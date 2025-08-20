import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { task } = await req.json();
    
    console.log(`Running notification scheduler task: ${task}`);
    
    let result: any = {};

    switch (task) {
      case 'profile_completion_reminders':
        const { error: profileError } = await supabase.rpc('send_profile_completion_reminders');
        if (profileError) throw profileError;
        result = { message: 'Profile completion reminders sent successfully' };
        break;

      case 'learning_goal_reminders':
        const { error: learningError } = await supabase.rpc('send_learning_goal_reminders');
        if (learningError) throw learningError;
        result = { message: 'Learning goal reminders sent successfully' };
        break;

      case 'weekly_progress_summaries':
        const { error: weeklyError } = await supabase.rpc('send_weekly_progress_summaries');
        if (weeklyError) throw weeklyError;
        result = { message: 'Weekly progress summaries sent successfully' };
        break;

      case 'job_application_reminders':
        // Send reminders for users who haven't applied to jobs in a while
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: inactiveUsers, error: inactiveError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .not('user_id', 'in', 
            supabase
              .from('job_application_activities')
              .select('user_id')
              .gte('created_at', threeDaysAgo.toISOString())
          )
          .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

        if (inactiveError) throw inactiveError;

        for (const user of inactiveUsers || []) {
          // Check if user wants job application reminders
          const { data: preference } = await supabase
            .from('notification_preferences')
            .select('is_enabled')
            .eq('user_id', user.user_id)
            .eq('notification_type', 'job_application_reminder')
            .single();

          if (preference?.is_enabled !== false) {
            await supabase
              .from('notifications')
              .insert({
                user_id: user.user_id,
                title: 'Job Application Reminder',
                message: `Hi ${user.full_name}! It's been a while since your last job application. Keep up the momentum and apply to new opportunities today!`,
                type: 'job_application_reminder',
                is_read: false
              });
          }
        }

        result = { message: `Job application reminders sent to ${inactiveUsers?.length || 0} users` };
        break;

      case 'skill_assessment_due':
        // This is a placeholder for future skill assessment functionality
        result = { message: 'Skill assessment reminders - feature coming soon' };
        break;

      default:
        throw new Error(`Unknown task: ${task}`);
    }

    console.log(`Notification scheduler completed: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in notification scheduler:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      task: req.method === 'POST' ? (await req.json().catch(() => ({})))?.task : 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);