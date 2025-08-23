import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyTasksRequest {
  period?: string;
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

    const { period }: VerifyTasksRequest = await req.json().catch(() => ({}));
    
    // Get current ISO week if not provided
    let currentPeriod = period;
    if (!currentPeriod) {
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
      const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
      currentPeriod = `${year}-${week.toString().padStart(2, '0')}`;
    }

    // Get user from auth
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

    // Get linkedin user
    const { data: linkedinUser, error: userError } = await supabase
      .from('linkedin_users')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (userError || !linkedinUser) {
      return new Response(JSON.stringify({ error: 'LinkedIn user not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all user tasks for the period with evidence
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
      .eq('period', currentPeriod);

    if (tasksError) {
      console.error('Error fetching user tasks:', tasksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userTasks || userTasks.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No tasks found for verification',
        period: currentPeriod,
        verifiedCount: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get evidence for these tasks
    const taskIds = userTasks.map(task => task.id);
    const { data: evidence, error: evidenceError } = await supabase
      .from('linkedin_evidence')
      .select('*')
      .in('user_task_id', taskIds);

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError);
      return new Response(JSON.stringify({ error: 'Failed to fetch evidence' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let verifiedCount = 0;
    let totalPointsAwarded = 0;

    // Verify tasks that have evidence
    for (const task of userTasks) {
      const taskEvidence = evidence?.filter(e => e.user_task_id === task.id) || [];
      
      if (taskEvidence.length > 0 && task.status !== 'VERIFIED') {
        // Basic verification logic - if evidence exists, mark as verified
        const pointsAwarded = task.linkedin_tasks.points_base;
        
        const { error: updateError } = await supabase
          .from('linkedin_user_tasks')
          .update({
            status: 'VERIFIED',
            score_awarded: pointsAwarded,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id);

        if (updateError) {
          console.error('Error updating task status:', updateError);
        } else {
          verifiedCount++;
          totalPointsAwarded += pointsAwarded;
        }
      }
    }

    // Update or create score record
    const { error: scoreError } = await supabase
      .from('linkedin_scores')
      .upsert({
        user_id: linkedinUser.id,
        period: currentPeriod,
        points_total: totalPointsAwarded,
        breakdown: {
          verified_tasks: verifiedCount,
          total_tasks: userTasks.length,
          points_per_task: userTasks.map(task => ({
            task_id: task.task_id,
            points_awarded: task.score_awarded || 0
          }))
        }
      }, {
        onConflict: 'user_id,period'
      });

    if (scoreError) {
      console.error('Error updating score:', scoreError);
    }

    console.log(`Verified ${verifiedCount} LinkedIn tasks for user ${user.id} in period ${currentPeriod}`);

    return new Response(JSON.stringify({
      message: `Successfully verified ${verifiedCount} tasks`,
      period: currentPeriod,
      verifiedCount,
      totalTasks: userTasks.length,
      totalPointsAwarded
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