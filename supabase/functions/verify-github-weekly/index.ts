import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationContext {
  repo?: any;
  periodStart?: Date;
  periodEnd?: Date;
  evidence: any[];
  signals: any[];
  snapshots: any[];
}

interface VerificationResult {
  status: 'NOT_STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED';
  points: number;
  notes?: string[];
}

// Verification rule engine
function verifyTask(taskCode: string, ctx: VerificationContext): VerificationResult {
  const notes: string[] = [];
  let status: VerificationResult['status'] = 'NOT_STARTED';
  let points = 0;

  // Check if there's submitted evidence
  const hasEvidence = ctx.evidence && ctx.evidence.length > 0;
  if (hasEvidence) {
    status = 'SUBMITTED';
  }

  switch (taskCode) {
    case 'GHW_COMMIT_3DAYS': {
      if (ctx.periodStart && ctx.periodEnd) {
        const commitDays = new Set();
        ctx.signals
          .filter(s => s.kind === 'COMMIT_PUSHED' && 
            new Date(s.happened_at) >= ctx.periodStart! &&
            new Date(s.happened_at) <= ctx.periodEnd!)
          .forEach(s => {
            const day = new Date(s.happened_at).toISOString().split('T')[0];
            commitDays.add(day);
          });

        if (commitDays.size >= 3) {
          status = 'VERIFIED';
          points = 15;
          if (commitDays.size >= 5) points += 5; // consistency bonus
          notes.push(`Committed on ${commitDays.size} distinct days`);
        } else if (commitDays.size > 0) {
          status = 'PARTIALLY_VERIFIED';
          points = Math.round((commitDays.size / 3) * 15);
          notes.push(`Committed on ${commitDays.size}/3 days`);
        }
      }
      break;
    }

    case 'GHW_WEEKLY_CHANGELOG': {
      const hasRelease = ctx.signals.some(s => 
        s.kind === 'RELEASE_PUBLISHED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      );

      if (hasRelease) {
        status = 'VERIFIED';
        points = 12;
        notes.push('Release published with changelog');
      } else if (hasEvidence) {
        // Check if evidence URL points to changelog
        const changelogEvidence = ctx.evidence.find(e => 
          e.url && (
            e.url.includes('CHANGELOG') || 
            e.url.includes('changelog') ||
            e.url.includes('releases')
          )
        );
        if (changelogEvidence) {
          status = 'PARTIALLY_VERIFIED';
          points = 8;
          notes.push('Changelog evidence submitted');
        }
      }
      break;
    }

    case 'GHW_MERGE_1PR': {
      const mergedPRs = ctx.signals.filter(s => 
        s.kind === 'PR_MERGED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      ).length;

      if (mergedPRs >= 1) {
        status = 'VERIFIED';
        points = 10;
        if (mergedPRs >= 3) points += 5; // multiple PRs bonus
        notes.push(`${mergedPRs} PR(s) merged`);
      } else {
        const openedPRs = ctx.signals.filter(s => 
          s.kind === 'PR_OPENED' &&
          ctx.periodStart && ctx.periodEnd &&
          new Date(s.happened_at) >= ctx.periodStart &&
          new Date(s.happened_at) <= ctx.periodEnd
        ).length;

        if (openedPRs > 0) {
          status = 'PARTIALLY_VERIFIED';
          points = 5;
          notes.push(`${openedPRs} PR(s) opened but not merged`);
        }
      }
      break;
    }

    case 'GHW_CLOSE_2ISSUES': {
      const closedIssues = ctx.signals.filter(s => 
        s.kind === 'ISSUE_CLOSED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      ).length;

      if (closedIssues >= 2) {
        status = 'VERIFIED';
        points = 12;
        notes.push(`${closedIssues} issues closed`);
      } else if (closedIssues === 1) {
        status = 'PARTIALLY_VERIFIED';
        points = 6;
        notes.push('1 issue closed');
      }
      break;
    }

    case 'GHW_README_TWEAK': {
      const readmeUpdated = ctx.signals.some(s => 
        s.kind === 'README_UPDATED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      );

      if (readmeUpdated) {
        status = 'VERIFIED';
        points = 8;
        notes.push('README updated via commit');
      } else if (hasEvidence) {
        const readmeEvidence = ctx.evidence.find(e => 
          e.url && e.url.toLowerCase().includes('readme')
        );
        if (readmeEvidence) {
          status = 'PARTIALLY_VERIFIED';
          points = 5;
          notes.push('README evidence submitted');
        }
      }
      break;
    }

    case 'GHW_CI_GREEN': {
      const workflowPassed = ctx.signals.some(s => 
        s.kind === 'ACTIONS_WORKFLOW_PASSED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      );

      if (workflowPassed) {
        status = 'VERIFIED';
        points = 10;
        notes.push('GitHub Actions workflow passed');
      }
      break;
    }

    case 'GHW_PAGES_DEPLOY': {
      const pagesDeployed = ctx.signals.some(s => 
        s.kind === 'PAGES_DEPLOYED' &&
        ctx.periodStart && ctx.periodEnd &&
        new Date(s.happened_at) >= ctx.periodStart &&
        new Date(s.happened_at) <= ctx.periodEnd
      );

      if (pagesDeployed) {
        status = 'VERIFIED';
        points = 15;
        notes.push('GitHub Pages deployed');
      } else if (hasEvidence) {
        status = 'PARTIALLY_VERIFIED';
        points = 10;
        notes.push('Pages URL evidence submitted');
      }
      break;
    }

    // Repository showcase tasks
    case 'GHS_ADD_TOPICS': {
      const latestSnapshot = ctx.snapshots[0];
      if (latestSnapshot && latestSnapshot.topics && latestSnapshot.topics.length >= 5) {
        status = 'VERIFIED';
        points = 8;
        notes.push(`${latestSnapshot.topics.length} topics added`);
      } else if (hasEvidence) {
        status = 'PARTIALLY_VERIFIED';
        points = 4;
        notes.push('Topics evidence submitted');
      }
      break;
    }

    case 'GHS_PAGES_SETUP': {
      const pagesEverDeployed = ctx.signals.some(s => s.kind === 'PAGES_DEPLOYED');
      if (pagesEverDeployed) {
        status = 'VERIFIED';
        points = 15;
        notes.push('GitHub Pages set up');
      } else if (hasEvidence) {
        status = 'PARTIALLY_VERIFIED';
        points = 10;
        notes.push('Pages setup evidence submitted');
      }
      break;
    }

    default: {
      // For other tasks, if evidence is submitted, mark as partially verified
      if (hasEvidence) {
        status = 'PARTIALLY_VERIFIED';
        points = 5;
        notes.push('Evidence submitted for manual review');
      }
      break;
    }
  }

  return { status, points, notes };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId, period } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying GitHub tasks for user:', userId, 'period:', period);

    // Determine period if not provided
    let currentPeriod = period;
    if (!currentPeriod) {
      const now = new Date();
      const year = now.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      currentPeriod = `${year}-${week.toString().padStart(2, '0')}`;
    }

    // Calculate period boundaries for weekly tasks
    const [year, weekStr] = currentPeriod.split('-');
    const periodStart = new Date(parseInt(year), 0, (parseInt(weekStr) - 1) * 7 + 1);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);

    console.log('Period boundaries:', periodStart, periodEnd);

    // Get user tasks for verification
    const { data: userTasks, error: tasksError } = await supabaseClient
      .from('github_user_tasks')
      .select(`
        *,
        github_tasks:task_id(*)
      `)
      .eq('user_id', userId)
      .or(`period.eq.${currentPeriod},period.is.null`);

    if (tasksError) {
      console.error('Error fetching user tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userTasks || userTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks found for verification', period: currentPeriod }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found tasks to verify:', userTasks.length);

    // Get signals for the period
    const { data: signals, error: signalsError } = await supabaseClient
      .from('github_signals')
      .select('*')
      .eq('user_id', userId)
      .gte('happened_at', periodStart.toISOString())
      .lte('happened_at', periodEnd.toISOString())
      .order('happened_at', { ascending: false });

    if (signalsError) {
      console.error('Error fetching signals:', signalsError);
    }

    // Get latest snapshots
    const { data: snapshots, error: snapshotsError } = await supabaseClient
      .from('github_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (snapshotsError) {
      console.error('Error fetching snapshots:', snapshotsError);
    }

    const updatedTasks = [];
    let totalPointsAwarded = 0;

    // Verify each task
    for (const userTask of userTasks) {
      const task = userTask.github_tasks;
      if (!task) continue;

      // Get evidence for this task
      const { data: evidence, error: evidenceError } = await supabaseClient
        .from('github_evidence')
        .select('*')
        .eq('user_task_id', userTask.id);

      if (evidenceError) {
        console.error('Error fetching evidence for task:', userTask.id, evidenceError);
        continue;
      }

      // Build verification context
      const context: VerificationContext = {
        periodStart: userTask.period ? periodStart : undefined,
        periodEnd: userTask.period ? periodEnd : undefined,
        evidence: evidence || [],
        signals: signals || [],
        snapshots: snapshots || [],
      };

      // Run verification
      const result = verifyTask(task.code, context);

      // Update task if status or score changed
      if (result.status !== userTask.status || result.points !== userTask.score_awarded) {
        const { error: updateError } = await supabaseClient
          .from('github_user_tasks')
          .update({
            status: result.status,
            score_awarded: result.points,
          })
          .eq('id', userTask.id);

        if (updateError) {
          console.error('Error updating task:', updateError);
        } else {
          updatedTasks.push({
            id: userTask.id,
            taskCode: task.code,
            oldStatus: userTask.status,
            newStatus: result.status,
            oldScore: userTask.score_awarded,
            newScore: result.points,
            notes: result.notes,
          });
          totalPointsAwarded += result.points;

          // Send notification for newly verified tasks
          if (result.status === 'VERIFIED' && userTask.status !== 'VERIFIED') {
            const { error: notificationError } = await supabaseClient
              .from('notifications')
              .insert({
                user_id: userId,
                title: `GitHub Task Completed: ${task.title}`,
                message: `Excellent! Your GitHub task "${task.title}" has been automatically verified. You earned ${result.points} points!`,
                type: 'task_approved',
                related_id: userTask.id,
                is_read: false
              });

            if (notificationError) {
              console.error('Error sending notification:', notificationError);
            } else {
              console.log(`📧 Notification sent to user ${userId} for verified GitHub task`);
            }

            // Award points in user_activity_points
            const { error: pointsError } = await supabaseClient
              .from('user_activity_points')
              .insert({
                user_id: userId,
                activity_date: new Date().toISOString().split('T')[0],
                activity_type: 'github_task_completion',
                points_earned: result.points,
                activity_description: `Completed GitHub task: ${task.title}`
              });

            if (pointsError) {
              console.error('Error awarding activity points:', pointsError);
            } else {
              console.log(`🎯 Awarded ${result.points} points to user ${userId} for GitHub task`);
            }
          }
        }
      }
    }

    // Update period score if we have weekly tasks
    if (updatedTasks.some(t => userTasks.find(ut => ut.id === t.id)?.period)) {
      const weeklyTasksPoints = updatedTasks
        .filter(t => userTasks.find(ut => ut.id === t.id)?.period)
        .reduce((sum, t) => sum + t.newScore, 0);

      const { error: scoreError } = await supabaseClient
        .from('github_scores')
        .upsert({
          user_id: userId,
          period: currentPeriod,
          points_total: weeklyTasksPoints,
          breakdown: {
            weekly_tasks: weeklyTasksPoints,
            updated_at: new Date().toISOString(),
          },
        });

      if (scoreError) {
        console.error('Error updating period score:', scoreError);
      }
    }

    console.log('Verification completed. Updated tasks:', updatedTasks.length);

    return new Response(
      JSON.stringify({
        message: 'GitHub tasks verification completed',
        period: currentPeriod,
        tasksVerified: userTasks.length,
        tasksUpdated: updatedTasks.length,
        totalPointsAwarded,
        updatedTasks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-github-weekly:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});