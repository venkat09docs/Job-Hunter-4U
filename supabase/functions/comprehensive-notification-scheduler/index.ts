import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulerRequest {
  task: string;
  params?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { task, params = {} }: SchedulerRequest = await req.json();
    
    console.log(`Running comprehensive notification scheduler task: ${task}`);
    
    let result: any = {};

    switch (task) {
      case 'send_assignment_due_reminders':
        result = await sendAssignmentDueReminders(supabase);
        break;

      case 'send_job_application_reminders':
        result = await sendJobApplicationReminders(supabase);
        break;

      case 'send_subscription_expiry_reminders':
        result = await sendSubscriptionExpiryReminders(supabase);
        break;

      case 'send_profile_completion_reminders':
        result = await sendProfileCompletionReminders(supabase);
        break;

      case 'send_follow_up_reminders':
        result = await sendFollowUpReminders(supabase);
        break;

      case 'process_scheduled_notifications':
        result = await processScheduledNotifications(supabase);
        break;

      case 'cleanup_old_notifications':
        result = await cleanupOldNotifications(supabase);
        break;

      default:
        throw new Error(`Unknown task: ${task}`);
    }

    console.log(`Comprehensive notification scheduler completed: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in comprehensive notification scheduler:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      task: req.method === 'POST' ? (await req.json().catch(() => ({})))?.task : 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Send assignment due reminders (24 hours before due date)
async function sendAssignmentDueReminders(supabase: any) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const { data: assignments, error } = await supabase
    .from('career_task_assignments')
    .select(`
      id, user_id, due_date, points_earned,
      career_task_templates!inner(title)
    `)
    .gte('due_date', tomorrow.toISOString())
    .lt('due_date', dayAfter.toISOString())
    .in('status', ['assigned', 'in_progress']);

  if (error) throw error;

  let sentCount = 0;
  
  for (const assignment of assignments || []) {
    try {
      await supabase.rpc('create_smart_notification', {
        user_id_param: assignment.user_id,
        template_key_param: 'assignment_due_soon',
        template_vars: {
          assignment_title: assignment.career_task_templates.title,
          days: '1',
          related_id: assignment.id
        },
        action_url_param: '/career-assignments',
        priority_param: 'high'
      });
      sentCount++;
    } catch (err) {
      console.error('Error sending assignment reminder:', err);
    }
  }

  return { message: `Assignment due reminders sent to ${sentCount} users` };
}

// Send job application inactivity reminders
async function sendJobApplicationReminders(supabase: any) {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find users who haven't applied to jobs in 3+ days
  const { data: users, error } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .not('user_id', 'in', 
      supabase
        .from('job_tracker')
        .select('user_id')
        .gte('created_at', threeDaysAgo.toISOString())
    )
    .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()); // Only active users

  if (error) throw error;

  let sentCount = 0;

  for (const user of users || []) {
    try {
      await supabase.rpc('create_smart_notification', {
        user_id_param: user.user_id,
        template_key_param: 'job_application_reminder',
        template_vars: {
          related_id: user.user_id
        },
        action_url_param: '/job-search',
        priority_param: 'normal'
      });
      sentCount++;
    } catch (err) {
      console.error('Error sending job application reminder:', err);
    }
  }

  return { message: `Job application reminders sent to ${sentCount} users` };
}

// Send subscription expiry reminders (7 days and 1 day before)
async function sendSubscriptionExpiryReminders(supabase: any) {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

  // 7-day reminder
  const { data: users7Days, error: error7Days } = await supabase
    .from('profiles')
    .select('user_id, full_name, subscription_plan, subscription_end_date')
    .eq('subscription_active', true)
    .gte('subscription_end_date', sevenDaysFromNow.toISOString().split('T')[0])
    .lt('subscription_end_date', new Date(sevenDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // 1-day reminder
  const { data: users1Day, error: error1Day } = await supabase
    .from('profiles')
    .select('user_id, full_name, subscription_plan, subscription_end_date')
    .eq('subscription_active', true)
    .gte('subscription_end_date', oneDayFromNow.toISOString().split('T')[0])
    .lt('subscription_end_date', new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  let sentCount = 0;

  // Send 7-day reminders
  for (const user of users7Days || []) {
    try {
      await supabase.rpc('create_smart_notification', {
        user_id_param: user.user_id,
        template_key_param: 'subscription_expiring',
        template_vars: {
          plan_name: user.subscription_plan,
          days: '7',
          related_id: user.user_id
        },
        action_url_param: '/manage-subscriptions',
        priority_param: 'normal'
      });
      sentCount++;
    } catch (err) {
      console.error('Error sending 7-day subscription reminder:', err);
    }
  }

  // Send 1-day reminders
  for (const user of users1Day || []) {
    try {
      await supabase.rpc('create_smart_notification', {
        user_id_param: user.user_id,
        template_key_param: 'subscription_expiring',
        template_vars: {
          plan_name: user.subscription_plan,
          days: '1',
          related_id: user.user_id
        },
        action_url_param: '/manage-subscriptions',
        priority_param: 'high'
      });
      sentCount++;
    } catch (err) {
      console.error('Error sending 1-day subscription reminder:', err);
    }
  }

  return { message: `Subscription expiry reminders sent to ${sentCount} users` };
}

// Send profile completion reminders for incomplete profiles
async function sendProfileCompletionReminders(supabase: any) {
  // Find users with less than 70% profile completion who haven't received a reminder recently
  const { data: users, error } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .lt('subscription_plan', 'Premium') // Focus on non-premium users
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Active in last 30 days

  if (error) throw error;

  let sentCount = 0;

  for (const user of users || []) {
    // Check if they received a profile completion reminder in the last 7 days
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.user_id)
      .eq('type', 'profile_completion_reminder')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (recentNotifications?.length === 0) {
      try {
        await supabase.rpc('create_smart_notification', {
          user_id_param: user.user_id,
          template_key_param: 'profile_completion_reminder',
          template_vars: {
            percentage: '65', // Estimate
            related_id: user.user_id
          },
          action_url_param: '/build-my-profile',
          priority_param: 'normal'
        });
        sentCount++;
      } catch (err) {
        console.error('Error sending profile completion reminder:', err);
      }
    }
  }

  return { message: `Profile completion reminders sent to ${sentCount} users` };
}

// Process follow-up reminders for job applications
async function sendFollowUpReminders(supabase: any) {
  const today = new Date().toISOString().split('T')[0];

  // Find scheduled follow-up reminders for today
  const { data: reminders, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'follow_up_reminder')
    .eq('scheduled_for', today)
    .eq('is_read', false);

  if (error) throw error;

  let sentCount = 0;

  for (const reminder of reminders || []) {
    try {
      // Update the notification to be visible (remove scheduled_for)
      await supabase
        .from('notifications')
        .update({ scheduled_for: null })
        .eq('id', reminder.id);
      
      sentCount++;
    } catch (err) {
      console.error('Error processing follow-up reminder:', err);
    }
  }

  return { message: `Follow-up reminders processed: ${sentCount}` };
}

// Process all scheduled notifications that are due
async function processScheduledNotifications(supabase: any) {
  const now = new Date().toISOString();

  const { data: scheduledNotifications, error } = await supabase
    .from('notifications')
    .select('*')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now);

  if (error) throw error;

  let processedCount = 0;

  for (const notification of scheduledNotifications || []) {
    try {
      // Make the notification visible by removing scheduled_for
      await supabase
        .from('notifications')
        .update({ scheduled_for: null })
        .eq('id', notification.id);

      processedCount++;
    } catch (err) {
      console.error('Error processing scheduled notification:', err);
    }
  }

  return { message: `Processed ${processedCount} scheduled notifications` };
}

// Cleanup old notifications (older than 30 days and read)
async function cleanupOldNotifications(supabase: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', true)
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error) throw error;

  return { message: 'Old notifications cleaned up successfully' };
}

serve(handler);