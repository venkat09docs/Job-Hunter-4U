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

    const requestBody = await req.json();
    const { user_id } = requestBody;
    
    console.log('=== INITIALIZE JOB HUNTING WEEK ===');
    console.log('Request body:', requestBody);
    console.log('User ID:', user_id);

    if (!user_id) {
      console.error('Missing user_id in request');
      throw new Error('User ID is required');
    }

    // Get current week start date (Monday) - Fixed calculation
    const now = new Date();
    console.log('Current date:', now.toISOString());
    
    // Calculate Monday of current week
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    console.log('Day of week:', dayOfWeek);
    
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    console.log('Days to Monday:', daysToMonday);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split('T')[0];
    
    console.log('Calculated week start:', weekStartDate);

    // Check if assignments already exist for this week
    console.log('Checking for existing assignments...');
    const { data: existingAssignments, error: existingError } = await supabase
      .from('job_hunting_assignments')
      .select('id, template_id, status')
      .eq('user_id', user_id)
      .eq('week_start_date', weekStartDate);

    if (existingError) {
      console.error('Error checking existing assignments:', existingError);
      throw new Error(`Failed to check existing assignments: ${existingError.message}`);
    }

    console.log(`Found ${existingAssignments?.length || 0} existing assignments for week ${weekStartDate}`);

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('Assignments already exist, returning success message');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Assignments already exist for this week',
          assignments_count: existingAssignments.length,
          week_start_date: weekStartDate,
          existing_assignments: existingAssignments.map(a => ({ id: a.id, status: a.status }))
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get active templates - include ALL weekly templates
    const { data: templates, error: templatesError } = await supabase
      .from('job_hunting_task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('cadence', 'weekly')
      .order('title');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      throw templatesError;
    }

    console.log(`Found ${templates?.length || 0} active weekly templates:`);
    console.log('Template titles:', templates?.map(t => t.title) || []);

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

    if (assignmentsError) {
      console.error('Error creating assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log(`Successfully created ${createdAssignments?.length || 0} assignments`);

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

    if (scheduleError) {
      console.error('Error creating/updating schedule:', scheduleError);
      throw scheduleError;
    }

    console.log(`Created ${assignments.length} assignments for user ${user_id} for week ${weekStartDate}`);
    console.log('Assignment titles:', assignments.map((_, i) => templates[i]?.title || 'Unknown'));

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Weekly assignments initialized successfully',
        assignments_created: assignments.length,
        week_start_date: weekStartDate,
        template_titles: templates.map(t => t.title)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('=== ERROR IN INITIALIZE JOB HUNTING WEEK ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error object:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});