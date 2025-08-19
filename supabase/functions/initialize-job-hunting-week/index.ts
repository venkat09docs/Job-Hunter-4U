import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get current week start date (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Check if assignments already exist for this week
    const { data: existingAssignments } = await supabase
      .from('job_hunting_assignments')
      .select('id')
      .eq('user_id', user_id)
      .eq('week_start_date', weekStartDate);

    if (existingAssignments && existingAssignments.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Assignments already exist for this week' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active templates
    const { data: templates, error: templatesError } = await supabase
      .from('job_hunting_task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('cadence', 'weekly');

    if (templatesError) throw templatesError;

    if (!templates || templates.length === 0) {
      throw new Error('No active weekly templates found');
    }

    // Create assignments for each template
    const assignments = templates.map(template => {
      const dueDate = new Date(weekStart);
      dueDate.setDate(dueDate.getDate() + 6); // Due by end of week
      dueDate.setHours(23, 59, 59, 999);

      return {
        user_id,
        template_id: template.id,
        week_start_date: weekStartDate,
        status: 'assigned',
        due_date: dueDate.toISOString(),
        points_earned: 0,
        score_awarded: 0
      };
    });

    const { data: createdAssignments, error: assignmentsError } = await supabase
      .from('job_hunting_assignments')
      .insert(assignments)
      .select();

    if (assignmentsError) throw assignmentsError;

    // Create or update weekly schedule
    const { error: scheduleError } = await supabase
      .from('job_hunting_weekly_schedules')
      .upsert({
        user_id,
        week_start_date: weekStartDate,
        total_tasks_assigned: assignments.length,
        tasks_completed: 0,
        points_earned: 0,
        total_points_possible: templates.reduce((sum, t) => sum + t.points_reward, 0)
      });

    if (scheduleError) throw scheduleError;

    console.log(`Created ${assignments.length} assignments for user ${user_id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Weekly assignments initialized successfully',
        assignments_created: assignments.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error initializing week:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});