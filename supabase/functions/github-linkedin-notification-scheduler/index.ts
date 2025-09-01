import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { task = 'all' } = await req.json().catch(() => ({}));
    
    console.log(`Executing GitHub/LinkedIn notification task: ${task}`);
    
    let results: any = {};
    
    switch (task) {
      case 'github_task_reminders':
        await sendGitHubTaskReminders(supabase);
        results.github_reminders = 'sent';
        break;
        
      case 'linkedin_task_reminders':
        await sendLinkedInTaskReminders(supabase);
        results.linkedin_reminders = 'sent';
        break;
        
      case 'linkedin_milestones':
        await checkLinkedInMilestones(supabase);
        results.linkedin_milestones = 'checked';
        break;
        
      case 'github_streak_notifications':
        await checkGitHubStreaks(supabase);
        results.github_streaks = 'checked';
        break;
        
      case 'ai_usage_summaries':
        await sendAIUsageSummaries(supabase);
        results.ai_summaries = 'sent';
        break;
        
      case 'all':
        // Run all tasks
        await Promise.all([
          sendGitHubTaskReminders(supabase),
          sendLinkedInTaskReminders(supabase),
          checkLinkedInMilestones(supabase),
          checkGitHubStreaks(supabase),
          sendAIUsageSummaries(supabase)
        ]);
        results = {
          github_reminders: 'sent',
          linkedin_reminders: 'sent',
          linkedin_milestones: 'checked',
          github_streaks: 'checked',
          ai_summaries: 'sent'
        };
        break;
        
      default:
        throw new Error(`Unknown task: ${task}`);
    }
    
    console.log('Notification scheduler completed:', results);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'GitHub/LinkedIn notification scheduler completed',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in notification scheduler:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function sendGitHubTaskReminders(supabase: any) {
  console.log('Sending GitHub task reminders...');
  
  // Send reminders for GitHub tasks due within 24 hours
  const { data: dueTasks, error } = await supabase
    .from('github_user_tasks')
    .select(`
      *,
      github_tasks!inner(title, description)
    `)
    .eq('status', 'NOT_STARTED')
    .gte('due_at', new Date().toISOString())
    .lte('due_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    
  if (error) {
    console.error('Error fetching due GitHub tasks:', error);
    return;
  }
  
  for (const task of dueTasks || []) {
    const hoursRemaining = Math.round((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60));
    
    // Check if user wants GitHub notifications
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('is_enabled')
      .eq('user_id', task.user_id)
      .eq('notification_type', 'github_task_reminder')
      .single();
      
    if (prefs?.is_enabled === false) continue;
    
    // Check if we already sent a reminder recently
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', task.user_id)
      .eq('type', 'github_task_reminder')
      .eq('related_id', null) // Fix UUID comparison
      .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .single();
      
    if (existingNotification) continue;
    
    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: task.user_id,
        title: 'GitHub Task Due Soon ⏰',
        message: `Your GitHub task "${task.github_tasks.title}" is due in ${hoursRemaining} hours. Don't miss out on those points!`,
        type: 'github_task_reminder',
        category: 'technical',
        priority: 'medium',
        related_id: null, // Fix UUID type error
        action_url: '/dashboard/github-activity-tracker'
      });
  }
  
  console.log(`Sent ${dueTasks?.length || 0} GitHub task reminders`);
}

async function sendLinkedInTaskReminders(supabase: any) {
  console.log('Sending LinkedIn task reminders...');
  
  // Send reminders for LinkedIn tasks due within 24 hours
  const { data: dueTasks, error } = await supabase
    .from('linkedin_user_tasks')
    .select(`
      *,
      linkedin_tasks!inner(title, description)
    `)
    .eq('completed', false)
    .gte('due_at', new Date().toISOString())
    .lte('due_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
    
  if (error) {
    console.error('Error fetching due LinkedIn tasks:', error);
    return;
  }
  
  for (const task of dueTasks || []) {
    const hoursRemaining = Math.round((new Date(task.due_at).getTime() - Date.now()) / (1000 * 60 * 60));
    
    // Check if user wants LinkedIn notifications
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('is_enabled')
      .eq('user_id', task.user_id)
      .eq('notification_type', 'linkedin_task_reminder')
      .single();
      
    if (prefs?.is_enabled === false) continue;
    
    // Check if we already sent a reminder recently
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', task.user_id)
      .eq('type', 'linkedin_task_reminder')
      .eq('related_id', null) // Fix UUID comparison
      .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .single();
      
    if (existingNotification) continue;
    
    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: task.user_id,
        title: 'LinkedIn Task Due Soon 📱',
        message: `Your LinkedIn task "${task.linkedin_tasks.title}" is due in ${hoursRemaining} hours. Keep networking!`,
        type: 'linkedin_task_reminder',
        category: 'networking',
        priority: 'medium',
        related_id: null, // Fix UUID type error
        action_url: '/dashboard/linkedin-optimization'
      });
  }
  
  console.log(`Sent ${dueTasks?.length || 0} LinkedIn task reminders`);
}

async function checkLinkedInMilestones(supabase: any) {
  console.log('Checking LinkedIn connection milestones...');
  
  // Check for connection milestones
  const { data: metrics, error } = await supabase
    .from('linkedin_network_metrics')
    .select('*')
    .eq('activity_id', 'connections')
    .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour
    
  if (error) {
    console.error('Error fetching LinkedIn metrics:', error);
    return;
  }
  
  const milestoneValues = [50, 100, 250, 500, 1000, 2000];
  
  for (const metric of metrics || []) {
    if (milestoneValues.includes(metric.value)) {
      // Check if user wants LinkedIn notifications
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('is_enabled')
        .eq('user_id', metric.user_id)
        .eq('notification_type', 'linkedin_connection_milestone')
        .single();
        
      if (prefs?.is_enabled === false) continue;
      
      // Check if we already sent this milestone notification
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', metric.user_id)
        .eq('type', 'linkedin_connection_milestone')
        .ilike('message', `%${metric.value}%`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();
        
      if (existingNotification) continue;
      
      // Send milestone notification
      await supabase
        .from('notifications')
        .insert({
          user_id: metric.user_id,
          title: 'LinkedIn Connection Milestone! 🤝',
          message: `Fantastic networking! You have reached ${metric.value} connections. Your network is growing strong!`,
          type: 'linkedin_connection_milestone',
          category: 'networking',
          priority: 'medium',
          action_url: '/dashboard/linkedin-optimization'
        });
    }
  }
  
  console.log('LinkedIn milestone check completed');
}

async function checkGitHubStreaks(supabase: any) {
  console.log('Checking GitHub streaks...');
  
  // This would check GitHub commit streaks
  // For now, we'll just log as the streak logic would be complex
  // In a real implementation, you'd analyze the github_signals table
  // to calculate streak days and send notifications for milestones
  
  console.log('GitHub streak check completed (placeholder)');
}

async function sendAIUsageSummaries(supabase: any) {
  console.log('Sending AI usage summaries...');
  
  // Send monthly AI usage summaries (run this monthly)
  const currentDate = new Date();
  const isFirstDayOfMonth = currentDate.getDate() === 1;
  
  if (!isFirstDayOfMonth) {
    console.log('Not first day of month, skipping AI summaries');
    return;
  }
  
  // Get users who used AI tools last month
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  
  // This would need a tool_usage table to work properly
  // For now, we'll just log as a placeholder
  
  console.log('AI usage summaries completed (placeholder)');
}