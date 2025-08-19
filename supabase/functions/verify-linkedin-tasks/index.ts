import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyTasksRequest {
  userId?: string;
  period?: string;
}

// Verification rule engine
function verifyTask(taskCode: string, ctx: {
  evidence: any[];
  signals: any[];
  periodStart: Date;
  periodEnd: Date;
}): { status: string; points: number; notes?: string[] } {
  const { evidence, signals, periodStart, periodEnd } = ctx;
  
  // Filter signals within the period
  const periodSignals = signals.filter(signal => {
    const signalDate = new Date(signal.happened_at);
    return signalDate >= periodStart && signalDate <= periodEnd;
  });

  let status = 'NOT_STARTED';
  let points = 0;
  const notes: string[] = [];

  // Task-specific verification logic
  switch (taskCode) {
    case 'POST_ONCE':
      if (evidence.length > 0) {
        status = 'SUBMITTED';
        points = 15;
        
        // Check for engagement signals
        const engagementSignals = periodSignals.filter(s => 
          ['COMMENTED', 'REACTED', 'MENTIONED'].includes(s.kind)
        );
        
        if (engagementSignals.length > 0) {
          status = 'VERIFIED';
          
          // Bonus for high engagement (3+ unique actors)
          const uniqueActors = new Set(engagementSignals.map(s => s.actor));
          if (uniqueActors.size >= 3) {
            points += 5;
            notes.push(`Bonus +5 points for ${uniqueActors.size} engagements`);
          }
        }
      }
      break;

    case 'COMMENT_3':
      const commentUrls = evidence.filter(e => e.kind === 'URL').length;
      const commentSignals = periodSignals.filter(s => s.kind === 'COMMENTED').length;
      
      if (commentUrls >= 3 || commentSignals >= 3) {
        status = 'VERIFIED';
        points = 10;
        
        // Bonus for mentions
        const mentions = periodSignals.filter(s => s.kind === 'MENTIONED');
        if (mentions.length > 0) {
          points += 2;
          notes.push(`Bonus +2 points for ${mentions.length} mentions`);
        }
      } else if (commentUrls > 0 || commentSignals > 0) {
        status = 'PARTIALLY_VERIFIED';
        points = Math.round(10 * Math.max(commentUrls, commentSignals) / 3);
      }
      break;

    case 'INVITES_10':
      const acceptedInvites = periodSignals.filter(s => s.kind === 'INVITE_ACCEPTED').length;
      const hasDataExport = evidence.some(e => e.kind === 'DATA_EXPORT');
      
      if (acceptedInvites >= 1) {
        status = 'PARTIALLY_VERIFIED';
        points = 15;
        
        if (acceptedInvites >= 5) {
          status = 'VERIFIED';
          points = 20;
          notes.push(`Bonus completion for ${acceptedInvites} accepted invites`);
        }
      } else if (hasDataExport) {
        // Would need to analyze export data for new connections
        status = 'SUBMITTED';
        points = 5;
        notes.push('Data export submitted - manual review needed');
      }
      break;

    case 'PROFILE_TUNEUP':
      const hasScreenshot = evidence.some(e => e.kind === 'SCREENSHOT');
      const hasExport = evidence.some(e => e.kind === 'DATA_EXPORT');
      const profileUpdates = periodSignals.filter(s => s.kind === 'PROFILE_UPDATED');
      
      if (hasScreenshot) {
        status = 'SUBMITTED';
        points = 15;
      }
      
      if (hasExport || profileUpdates.length > 0) {
        status = 'VERIFIED';
        points = 25;
      }
      break;

    default:
      notes.push(`Unknown task code: ${taskCode}`);
  }

  return { status, points, notes };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, period: requestedPeriod }: VerifyTasksRequest = await req.json().catch(() => ({}));
    
    let targetUserId = userId;
    
    // If no userId provided, get from auth
    if (!targetUserId) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      targetUserId = user.id;
    }

    // Get linkedin user
    const { data: linkedinUser, error: userError } = await supabase
      .from('linkedin_users')
      .select('id')
      .eq('auth_uid', targetUserId)
      .single();

    if (userError || !linkedinUser) {
      return new Response(JSON.stringify({ error: 'LinkedIn user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine period (current week if not specified)
    let period = requestedPeriod;
    if (!period) {
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
      period = `${year}-${week.toString().padStart(2, '0')}`;
    }

    // Parse period to get date range
    const [yearStr, weekStr] = period.split('-');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    
    // Calculate week start (Monday) and end (Sunday)
    const jan4 = new Date(year, 0, 4); // Jan 4th is always in week 1
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7)); // Previous Monday
    
    const periodStart = new Date(startOfWeek1);
    periodStart.setDate(startOfWeek1.getDate() + (week - 1) * 7);
    
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);

    // Get user tasks for this period
    const { data: userTasks, error: tasksError } = await supabase
      .from('linkedin_user_tasks')
      .select(`
        *,
        linkedin_tasks:task_id (
          code,
          title,
          description,
          evidence_types,
          points_base,
          bonus_rules
        )
      `)
      .eq('user_id', linkedinUser.id)
      .eq('period', period);

    if (tasksError) {
      console.error('Error fetching user tasks:', tasksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verificationResults = [];

    for (const userTask of userTasks) {
      // Get evidence for this task
      const { data: evidence, error: evidenceError } = await supabase
        .from('linkedin_evidence')
        .select('*')
        .eq('user_task_id', userTask.id);

      if (evidenceError) {
        console.error('Error fetching evidence:', evidenceError);
        continue;
      }

      // Get signals for this user in the period
      const { data: signals, error: signalsError } = await supabase
        .from('linkedin_signals')
        .select('*')
        .eq('user_id', linkedinUser.id)
        .gte('happened_at', periodStart.toISOString())
        .lte('happened_at', periodEnd.toISOString());

      if (signalsError) {
        console.error('Error fetching signals:', signalsError);
        continue;
      }

      // Run verification
      const result = verifyTask(userTask.linkedin_tasks.code, {
        evidence: evidence || [],
        signals: signals || [],
        periodStart,
        periodEnd
      });

      // Update task status and score
      const { error: updateError } = await supabase
        .from('linkedin_user_tasks')
        .update({
          status: result.status,
          score_awarded: result.points,
          updated_at: new Date().toISOString()
        })
        .eq('id', userTask.id);

      if (updateError) {
        console.error('Error updating user task:', updateError);
      } else {
        verificationResults.push({
          taskId: userTask.id,
          taskCode: userTask.linkedin_tasks.code,
          previousStatus: userTask.status,
          newStatus: result.status,
          previousScore: userTask.score_awarded,
          newScore: result.points,
          notes: result.notes
        });
      }
    }

    // Update or create score summary
    const totalPoints = userTasks.reduce((sum, task) => {
      const result = verificationResults.find(r => r.taskId === task.id);
      return sum + (result?.newScore || task.score_awarded);
    }, 0);

    const { error: scoreError } = await supabase
      .from('linkedin_scores')
      .upsert({
        user_id: linkedinUser.id,
        period: period,
        points_total: totalPoints,
        breakdown: {
          tasks: userTasks.length,
          completed: userTasks.filter(t => {
            const result = verificationResults.find(r => r.taskId === t.id);
            return (result?.newStatus || t.status) === 'VERIFIED';
          }).length,
          total_evidence: userTasks.reduce((sum, task) => {
            // This would need to be calculated properly
            return sum;
          }, 0)
        }
      }, {
        onConflict: 'user_id,period'
      });

    if (scoreError) {
      console.error('Error updating scores:', scoreError);
    }

    console.log(`Verified ${verificationResults.length} tasks for user ${targetUserId} in period ${period}`);

    return new Response(JSON.stringify({
      period,
      verificationResults,
      totalPoints,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-linkedin-tasks function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});