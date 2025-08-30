import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProgress {
  user_id: string;
  profile: {
    username: string;
    full_name: string;
    industry: string;
    subscription_plan: string;
    subscription_active: boolean;
  };
  resumeProgress: number;
  linkedinProfileProgress: number;
  digitalProfileProgress: number;
  githubProfileProgress: number;
  jobApplicationsCount: number;
  networkConnections: number;
  githubCommits: number;
  githubRepos: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting Level Up daily reminders...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active users with eligible subscriptions (3, 6, 12 month plans)
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        username,
        full_name,
        industry,
        subscription_plan,
        subscription_active
      `)
      .eq('subscription_active', true)
      .in('subscription_plan', ['3 Months Plan', '6 Months Plan', '1 Year Plan']);

    if (usersError) {
      console.error('❌ Error fetching eligible users:', usersError);
      throw usersError;
    }

    console.log(`📊 Found ${eligibleUsers?.length || 0} eligible users`);

    let notificationsSent = 0;
    let remindersCreated = 0;

    for (const user of eligibleUsers || []) {
      try {
        // Calculate user progress for each category
        const userProgress = await calculateUserProgress(supabase, user.user_id);
        
        // Generate personalized reminders
        const reminders = generateReminders(user, userProgress);
        
        // Send notifications for each reminder
        for (const reminder of reminders) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.user_id,
              title: reminder.title,
              message: reminder.message,
              type: 'level_up_daily_reminder',
              is_read: false,
              scheduled_for: new Date().toISOString()
            });

          if (notificationError) {
            console.error(`❌ Error creating notification for user ${user.user_id}:`, notificationError);
          } else {
            notificationsSent++;
            console.log(`✅ Notification sent to ${user.username || user.full_name}`);
          }
        }
        
        remindersCreated += reminders.length;
      } catch (userError) {
        console.error(`❌ Error processing user ${user.user_id}:`, userError);
      }
    }

    console.log(`🎯 Level Up reminders completed: ${notificationsSent} notifications sent for ${eligibleUsers?.length || 0} users`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Level Up daily reminders sent successfully`,
        stats: {
          eligibleUsers: eligibleUsers?.length || 0,
          remindersCreated,
          notificationsSent
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('💥 Error in level-up-daily-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function calculateUserProgress(supabase: any, userId: string): Promise<Partial<UserProgress>> {
  try {
    // Get career assignments progress (resume, linkedin, digital, github)
    const { data: assignments } = await supabase
      .from('career_task_assignments')
      .select(`
        status,
        career_task_templates (
          module,
          sub_category_id,
          sub_categories (name)
        )
      `)
      .eq('user_id', userId);

    // Calculate progress percentages
    const resumeTasks = assignments?.filter(a => a.career_task_templates?.module === 'RESUME') || [];
    const resumeProgress = resumeTasks.length > 0 ? 
      (resumeTasks.filter(t => t.status === 'verified').length / resumeTasks.length) * 100 : 0;

    const linkedinTasks = assignments?.filter(a => 
      a.career_task_templates?.sub_categories?.name?.toLowerCase().includes('linkedin')) || [];
    const linkedinProfileProgress = linkedinTasks.length > 0 ? 
      (linkedinTasks.filter(t => t.status === 'verified').length / linkedinTasks.length) * 100 : 0;

    const digitalTasks = assignments?.filter(a => 
      a.career_task_templates?.sub_categories?.name?.toLowerCase().includes('digital')) || [];
    const digitalProfileProgress = digitalTasks.length > 0 ? 
      (digitalTasks.filter(t => t.status === 'verified').length / digitalTasks.length) * 100 : 0;

    const githubTasks = assignments?.filter(a => 
      a.career_task_templates?.sub_categories?.name?.toLowerCase().includes('github')) || [];
    const githubProfileProgress = githubTasks.length > 0 ? 
      (githubTasks.filter(t => t.status === 'verified').length / githubTasks.length) * 100 : 0;

    // Get job applications count
    const { count: jobApplicationsCount } = await supabase
      .from('job_tracker')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .not('status', 'in', '("wishlist","not_selected","no_response","archived")');

    // Get network connections
    const { data: networkMetrics } = await supabase
      .from('linkedin_network_metrics')
      .select('activity_id, value')
      .eq('user_id', userId);

    const networkConnections = networkMetrics?.find(m => m.activity_id === 'connections')?.value || 0;

    // Get GitHub stats
    const { data: githubRepos } = await supabase
      .from('github_repos')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: githubEvidence } = await supabase
      .from('github_evidence')
      .select(`
        parsed_json,
        github_user_tasks!inner(user_id)
      `)
      .eq('verification_status', 'verified');

    // Calculate total commits from evidence
    let githubCommits = 0;
    githubEvidence?.forEach(evidence => {
      if (evidence.github_user_tasks?.user_id === userId && evidence.parsed_json) {
        try {
          const parsedData = evidence.parsed_json as any;
          if (parsedData?.weeklyMetrics?.commits) {
            githubCommits += parsedData.weeklyMetrics.commits;
          }
        } catch (error) {
          // Skip invalid JSON data
        }
      }
    });

    return {
      resumeProgress,
      linkedinProfileProgress,
      digitalProfileProgress,
      githubProfileProgress,
      jobApplicationsCount: jobApplicationsCount || 0,
      networkConnections,
      githubCommits,
      githubRepos: githubRepos?.length || 0
    };

  } catch (error) {
    console.error(`❌ Error calculating progress for user ${userId}:`, error);
    return {};
  }
}

function generateReminders(user: any, progress: Partial<UserProgress>): Array<{title: string, message: string}> {
  const reminders: Array<{title: string, message: string}> = [];
  const isIT = user.industry === 'IT';
  
  // Profile Build reminders
  if ((progress.resumeProgress || 0) < 100) {
    const remaining = Math.ceil(100 - (progress.resumeProgress || 0));
    reminders.push({
      title: '📝 Complete Your Resume',
      message: `You're ${remaining}% away from completing your Profile Rookie badge! Finish your resume tasks today.`
    });
  } else if ((progress.linkedinProfileProgress || 0) < 100) {
    const remaining = Math.ceil(100 - (progress.linkedinProfileProgress || 0));
    reminders.push({
      title: '💼 LinkedIn Profile Awaits',
      message: `Complete ${remaining}% more LinkedIn tasks to unlock your Profile Complete badge!`
    });
  } else if (user.subscription_plan !== '3 Months Plan' && (progress.digitalProfileProgress || 0) < 100) {
    const remaining = Math.ceil(100 - (progress.digitalProfileProgress || 0));
    reminders.push({
      title: '🌟 Digital Portfolio Progress',
      message: `You're ${remaining}% away from earning the Profile Perfectionist badge! Continue building your digital presence.`
    });
  } else if (isIT && (progress.githubProfileProgress || 0) < 100) {
    const remaining = Math.ceil(100 - (progress.githubProfileProgress || 0));
    reminders.push({
      title: '⚡ GitHub Profile Elite',
      message: `Complete ${remaining}% more GitHub tasks to achieve Profile Elite status!`
    });
  }

  // Job Application reminders
  if ((progress.jobApplicationsCount || 0) === 0) {
    reminders.push({
      title: '🎯 Take Your First Step',
      message: 'Apply to your first job today and unlock the First Step badge! Every journey begins with a single application.'
    });
  } else if ((progress.jobApplicationsCount || 0) < 14) {
    const remaining = 14 - (progress.jobApplicationsCount || 0);
    reminders.push({
      title: '🔥 Keep the Momentum Going',
      message: `Apply to ${remaining} more jobs to earn the Consistency Champ badge! You're doing great!`
    });
  } else if ((progress.jobApplicationsCount || 0) < 30) {
    const remaining = 30 - (progress.jobApplicationsCount || 0);
    reminders.push({
      title: '⭐ Become an Interview Magnet',
      message: `${remaining} more applications until you reach Interview Magnet status! Keep pushing forward!`
    });
  }

  // Network Growth reminders
  if ((progress.networkConnections || 0) < 25) {
    const remaining = 25 - (progress.networkConnections || 0);
    reminders.push({
      title: '🤝 Grow Your Network',
      message: `Connect with ${remaining} more professionals to earn the Connector badge! Networking opens doors.`
    });
  } else if ((progress.networkConnections || 0) < 50) {
    const remaining = 50 - (progress.networkConnections || 0);
    reminders.push({
      title: '📈 Expand Your Reach',
      message: `${remaining} more connections to become a Networker! Your professional circle is growing strong.`
    });
  } else if ((progress.networkConnections || 0) < 100) {
    const remaining = 100 - (progress.networkConnections || 0);
    reminders.push({
      title: '🌟 Influencer Status Awaits',
      message: `Just ${remaining} more connections to become an Influencer in the Making! You're almost there!`
    });
  }

  // GitHub reminders for IT users
  if (isIT) {
    if ((progress.githubRepos || 0) === 0 || (progress.githubCommits || 0) < 5) {
      const needsRepo = (progress.githubRepos || 0) === 0;
      const needsCommits = (progress.githubCommits || 0) < 5;
      const commitsNeeded = 5 - (progress.githubCommits || 0);
      
      if (needsRepo && needsCommits) {
        reminders.push({
          title: '💻 Start Your Coding Journey',
          message: `Create your first repository and make ${commitsNeeded} commits to earn the Commit Cadet badge!`
        });
      } else if (needsCommits) {
        reminders.push({
          title: '⚡ Commit More Code',
          message: `Make ${commitsNeeded} more commits to unlock the Commit Cadet badge! Keep coding!`
        });
      }
    } else if ((progress.githubCommits || 0) < 30) {
      const remaining = 30 - (progress.githubCommits || 0);
      reminders.push({
        title: '🛠️ Project Maintainer Goal',
        message: `${remaining} more commits to become a Project Maintainer! Your coding skills are improving!`
      });
    } else if ((progress.githubCommits || 0) < 100) {
      const remaining = 100 - (progress.githubCommits || 0);
      reminders.push({
        title: '🏆 Open Source Ally Achievement',
        message: `${remaining} commits left to become an Open Source Ally! You're building an impressive portfolio!`
      });
    }
  }

  // Motivational message if no specific reminders
  if (reminders.length === 0) {
    reminders.push({
      title: '🎉 Great Progress!',
      message: "You're doing amazing! Keep up the excellent work on your career journey. Check your Level Up page for new challenges!"
    });
  }

  // Limit to 2 reminders per day to avoid spam
  return reminders.slice(0, 2);
}

serve(handler);