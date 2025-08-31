import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulerRequest {
  task: string;
  payload?: any;
}

interface NotificationSchedule {
  id: string;
  name: string;
  template_code: string;
  target_audience: any;
  schedule_config: any;
  template_variables: any;
  is_active: boolean;
  last_executed_at: string | null;
  next_execution_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { task, payload }: SchedulerRequest = await req.json();
    console.log(`🚀 Smart Notification Scheduler - Processing task: ${task}`);

    let result = { success: false, message: 'Unknown task' };

    switch (task) {
      case 'process_scheduled_notifications':
        result = await processScheduledNotifications(supabase);
        break;
      case 'admin_daily_summary':
        result = await sendAdminDailySummary(supabase);
        break;
      case 'weekly_assignment_reminders':
        result = await sendWeeklyAssignmentReminders(supabase);
        break;
      case 'inactive_user_notifications':
        result = await sendInactiveUserNotifications(supabase);
        break;
      case 'milestone_celebrations':
        result = await sendMilestoneCelebrations(supabase);
        break;
      case 'smart_schedule_notification':
        result = await scheduleSmartNotification(supabase, payload);
        break;
      default:
        result = { success: false, message: `Unknown task: ${task}` };
    }

    console.log(`✅ Task ${task} completed:`, result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: result.success ? 200 : 400,
    });

  } catch (error) {
    console.error('❌ Smart Scheduler Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processScheduledNotifications(supabase: any) {
  try {
    console.log('📋 Processing scheduled notifications...');
    
    // Get notifications scheduled for now or past due
    const { data: schedules, error } = await supabase
      .from('notification_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution_at', new Date().toISOString());

    if (error) throw error;

    let processed = 0;
    
    for (const schedule of schedules || []) {
      try {
        await executeScheduledNotification(supabase, schedule);
        processed++;
      } catch (err) {
        console.error(`Failed to execute schedule ${schedule.id}:`, err);
      }
    }

    return {
      success: true,
      message: `Processed ${processed} scheduled notifications`,
      processed
    };
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return { success: false, message: error.message };
  }
}

async function executeScheduledNotification(supabase: any, schedule: NotificationSchedule) {
  console.log(`📤 Executing scheduled notification: ${schedule.name}`);
  
  // Get target users based on audience criteria
  const targetUsers = await getTargetUsers(supabase, schedule.target_audience);
  
  if (targetUsers.length === 0) {
    console.log('No target users found for schedule:', schedule.name);
    return;
  }

  // Send notifications to each target user
  let sentCount = 0;
  for (const userId of targetUsers) {
    try {
      // Use smart notification function that respects user preferences
      const { data, error } = await supabase.rpc('create_smart_notification', {
        target_user_id: userId,
        template_code: schedule.template_code,
        template_vars: schedule.template_variables,
        priority: 'medium',
        respect_quiet_hours: true
      });
      
      if (!error) {
        sentCount++;
        // Track analytics
        await supabase.rpc('track_notification_event', {
          notification_id: data,
          user_id: userId,
          event_type: 'sent',
          metadata: { source: 'scheduled', schedule_id: schedule.id }
        });
      }
    } catch (err) {
      console.error(`Failed to send notification to user ${userId}:`, err);
    }
  }

  // Update schedule execution info
  const nextExecution = calculateNextExecution(schedule.schedule_config);
  await supabase
    .from('notification_schedules')
    .update({
      last_executed_at: new Date().toISOString(),
      next_execution_at: nextExecution,
      execution_count: schedule.execution_count + 1
    })
    .eq('id', schedule.id);

  console.log(`✅ Sent ${sentCount} notifications for schedule: ${schedule.name}`);
}

async function getTargetUsers(supabase: any, targetAudience: any): Promise<string[]> {
  try {
    let query = supabase.from('profiles').select('user_id');
    
    // Apply audience filters
    if (targetAudience.roles && targetAudience.roles.length > 0) {
      const { data: roleUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', targetAudience.roles);
      
      const userIds = roleUsers?.map(r => r.user_id) || [];
      query = query.in('user_id', userIds);
    }
    
    if (targetAudience.subscription_plan) {
      query = query.eq('subscription_plan', targetAudience.subscription_plan);
    }
    
    if (targetAudience.subscription_active !== undefined) {
      query = query.eq('subscription_active', targetAudience.subscription_active);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(u => u.user_id) || [];
  } catch (error) {
    console.error('Error getting target users:', error);
    return [];
  }
}

function calculateNextExecution(scheduleConfig: any): string | null {
  if (!scheduleConfig.frequency) return null;
  
  const now = new Date();
  
  switch (scheduleConfig.frequency) {
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (scheduleConfig.time) {
        const [hours, minutes] = scheduleConfig.time.split(':');
        tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return tomorrow.toISOString();
      
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
      
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString();
      
    default:
      return null;
  }
}

async function sendAdminDailySummary(supabase: any) {
  try {
    console.log('📊 Sending admin daily summary...');
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get statistics for the summary
    const [
      { data: newUsers },
      { data: completedAssignments }, 
      { data: pendingAssignments }
    ] = await Promise.all([
      supabase.from('profiles').select('user_id', { count: 'exact' }).gte('created_at', yesterday),
      supabase.from('career_task_assignments').select('id', { count: 'exact' }).eq('status', 'verified').gte('verified_at', yesterday),
      supabase.from('career_task_assignments').select('id', { count: 'exact' }).eq('status', 'submitted')
    ]);

    const stats = {
      new_users: newUsers?.length || 0,
      completed_assignments: completedAssignments?.length || 0,
      pending_reviews: pendingAssignments?.length || 0
    };

    // Send to admins and recruiters
    const { data: sentCount } = await supabase.rpc('send_admin_notification', {
      notification_title: 'Daily Admin Summary',
      notification_message: `Today's Update: ${stats.new_users} new users, ${stats.completed_assignments} assignments completed, ${stats.pending_reviews} pending reviews.`,
      target_roles: ['admin', 'recruiter'],
      priority: 'medium',
      notification_category: 'admin'
    });

    return {
      success: true,
      message: `Daily summary sent to ${sentCount} admins`,
      stats
    };
  } catch (error) {
    console.error('Error sending admin daily summary:', error);
    return { success: false, message: error.message };
  }
}

async function sendWeeklyAssignmentReminders(supabase: any) {
  try {
    console.log('📝 Sending weekly assignment reminders...');
    
    // Find assignments due in next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: upcomingAssignments, error } = await supabase
      .from('career_task_assignments')
      .select(`
        id, user_id, due_date,
        career_task_templates!inner(title)
      `)
      .eq('status', 'assigned')
      .lte('due_date', threeDaysFromNow.toISOString());

    if (error) throw error;

    let sent = 0;
    for (const assignment of upcomingAssignments || []) {
      const daysUntilDue = Math.ceil((new Date(assignment.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      await supabase.from('notifications').insert({
        user_id: assignment.user_id,
        title: 'Assignment Due Soon',
        message: `Your assignment "${assignment.career_task_templates.title}" is due in ${daysUntilDue} day(s).`,
        type: 'assignment_reminder',
        category: 'assignment',
        priority: daysUntilDue <= 1 ? 'high' : 'medium',
        related_id: assignment.id
      });
      
      sent++;
    }

    return {
      success: true,
      message: `Sent ${sent} assignment reminders`,
      sent
    };
  } catch (error) {
    console.error('Error sending assignment reminders:', error);
    return { success: false, message: error.message };
  }
}

async function sendInactiveUserNotifications(supabase: any) {
  try {
    console.log('😴 Checking for inactive users...');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Find users inactive for 7+ days (no recent assignments or progress)
    const { data: inactiveUsers, error } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (error) throw error;

    let sent = 0;
    for (const user of inactiveUsers || []) {
      // Send re-engagement notification
      await supabase.from('notifications').insert({
        user_id: user.user_id,
        title: 'We Miss You!',
        message: `Hi ${user.full_name}! It's been a while since your last activity. Check out new opportunities and continue your career growth.`,
        type: 'reengagement',
        category: 'engagement',
        priority: 'low',
        action_url: '/dashboard'
      });
      
      sent++;
    }

    return {
      success: true,
      message: `Sent ${sent} re-engagement notifications`,
      sent
    };
  } catch (error) {
    console.error('Error sending inactive user notifications:', error);
    return { success: false, message: error.message };
  }
}

async function sendMilestoneCelebrations(supabase: any) {
  try {
    console.log('🎉 Checking for milestone celebrations...');
    
    // Find users who completed major milestones today
    const today = new Date().toISOString().split('T')[0];
    
    const { data: recentCompletions, error } = await supabase
      .from('career_task_assignments')
      .select(`
        user_id, points_earned,
        profiles!inner(full_name),
        career_task_templates!inner(title, module)
      `)
      .eq('status', 'verified')
      .gte('verified_at', today);

    if (error) throw error;

    // Group by user and calculate milestones
    const userMilestones = new Map();
    
    for (const completion of recentCompletions || []) {
      const userId = completion.user_id;
      if (!userMilestones.has(userId)) {
        userMilestones.set(userId, {
          user: completion.profiles,
          totalPoints: 0,
          completedModules: new Set()
        });
      }
      
      const milestone = userMilestones.get(userId);
      milestone.totalPoints += completion.points_earned || 0;
      milestone.completedModules.add(completion.career_task_templates.module);
    }

    let sent = 0;
    for (const [userId, milestone] of userMilestones) {
      // Send celebration for significant achievements
      if (milestone.totalPoints >= 50 || milestone.completedModules.size >= 3) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Achievement Unlocked! 🏆',
          message: `Congratulations ${milestone.user.full_name}! You've earned ${milestone.totalPoints} points today and completed tasks in ${milestone.completedModules.size} different modules!`,
          type: 'milestone_celebration',
          category: 'achievement',
          priority: 'high',
          action_url: '/dashboard/career-assignments'
        });
        
        sent++;
      }
    }

    return {
      success: true,
      message: `Sent ${sent} milestone celebrations`,
      sent
    };
  } catch (error) {
    console.error('Error sending milestone celebrations:', error);
    return { success: false, message: error.message };
  }
}

async function scheduleSmartNotification(supabase: any, payload: any) {
  try {
    const { user_id, title, message, scheduled_for, priority = 'medium' } = payload;
    
    if (!user_id || !title || !message) {
      throw new Error('Missing required fields: user_id, title, message');
    }

    // Create smart notification that respects user preferences
    const { data: notificationId, error } = await supabase.rpc('create_smart_notification', {
      target_user_id: user_id,
      template_code: 'custom_scheduled',
      template_vars: { title, message },
      priority,
      respect_quiet_hours: true
    });

    if (error) throw error;

    // Track the scheduling event
    await supabase.rpc('track_notification_event', {
      notification_id: notificationId,
      user_id: user_id,
      event_type: 'sent',
      metadata: { source: 'smart_scheduler', scheduled: true }
    });

    return {
      success: true,
      message: 'Smart notification scheduled successfully',
      notification_id: notificationId
    };
  } catch (error) {
    console.error('Error scheduling smart notification:', error);
    return { success: false, message: error.message };
  }
}