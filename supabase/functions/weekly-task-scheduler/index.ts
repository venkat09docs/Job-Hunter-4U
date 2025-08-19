import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Weekly task scheduler starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current Monday in Asia/Kolkata timezone
    const now = new Date();
    const kolkataTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // UTC + 5:30
    const dayOfWeek = kolkataTime.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    
    const monday = new Date(kolkataTime);
    monday.setDate(kolkataTime.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const mondayStr = monday.toISOString().split('T')[0];

    console.log(`Processing tasks for week starting: ${mondayStr} (Kolkata time: ${kolkataTime.toISOString()})`);

    // Check if it's actually Monday in Kolkata (only run on Mondays)
    const isMonday = kolkataTime.getDay() === 1;
    if (!isMonday) {
      console.log(`Not Monday in Kolkata timezone (day: ${kolkataTime.getDay()}), skipping task generation`);
      return new Response(JSON.stringify({
        success: true,
        message: 'Not Monday, skipping task generation',
        kolkataTime: kolkataTime.toISOString(),
        dayOfWeek: kolkataTime.getDay()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active users with subscriptions
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, subscription_active, subscription_plan')
      .eq('subscription_active', true);

    if (usersError) {
      throw new Error(`Error fetching active users: ${usersError.message}`);
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log('No active users found with subscriptions');
      return new Response(JSON.stringify({
        success: true,
        message: 'No active users found',
        weekStartDate: mondayStr,
        usersProcessed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${activeUsers.length} active users to process`);

    // Call the assign-weekly-tasks function for all users
    const { data: assignmentResult, error: assignmentError } = await supabase.functions.invoke('assign-weekly-tasks', {
      body: {
        weekStartDate: mondayStr,
        forceRegenerate: false // Don't regenerate if tasks already exist
      }
    });

    if (assignmentError) {
      throw new Error(`Error calling assign-weekly-tasks: ${assignmentError.message}`);
    }

    console.log('Weekly task assignment completed:', assignmentResult);

    // Log the cron job execution
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'career_weekly_schedules',
        action: 'CRON_TASK_ASSIGNMENT',
        user_id: null,
        timestamp: new Date().toISOString()
      })
      .then(() => console.log('Audit log created'))
      .catch((err) => console.log('Failed to create audit log:', err));

    return new Response(JSON.stringify({
      success: true,
      message: 'Weekly tasks assigned successfully',
      weekStartDate: mondayStr,
      kolkataTime: kolkataTime.toISOString(),
      usersProcessed: activeUsers.length,
      assignmentResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weekly-task-scheduler:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// This function can be called manually or via cron job
// Example cron setup (run every Monday at 6 AM Kolkata time = 12:30 AM UTC):
// 30 0 * * 1

// To set up the cron job in Supabase, run this SQL:
/*
SELECT cron.schedule(
  'weekly-career-tasks',
  '30 0 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/weekly-task-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
    body := '{"manual": false}'::jsonb
  );
  $$
);
*/