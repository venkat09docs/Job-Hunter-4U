import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstantiateWeekRequest {
  userId?: string;
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

    const { userId }: InstantiateWeekRequest = await req.json().catch(() => ({}));
    
    // Get current week period (Monday to Sunday) in YYYY-WW format  
    const now = new Date();
    const year = now.getFullYear();
    
    // Get Monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    // Calculate week number from Monday dates
    const startOfYear = new Date(year, 0, 1);
    const startOfYearDay = startOfYear.getDay();
    const daysToFirstMonday = (8 - startOfYearDay) % 7;
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    
    const diffTime = monday.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    
    const currentPeriod = `${year}-${week.toString().padStart(2, '0')}`;

    console.log('🔍 Current period:', currentPeriod);
    console.log('🔍 Monday of week:', monday.toISOString().split('T')[0]);

    let targetUserId = userId;

    // If no userId provided, get from auth
    if (!targetUserId) {
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
      
      targetUserId = user.id;
    }

    // Ensure user exists in profiles table (required for foreign key constraint)
    const { data: existingProfile, error: profileSelectError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', targetUserId)
      .single();

    if (!existingProfile) {
      console.error('User profile not found for user:', targetUserId);
      return new Response(JSON.stringify({ error: 'User profile not found. Please ensure your profile is set up.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active tasks ordered by display_order (day assignment)
    const { data: tasks, error: tasksError } = await supabase
      .from('linkedin_tasks')
      .select('*')
      .eq('active', true)
      .order('display_order');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if tasks already exist for the current period
    const { data: existingTasks, error: existingTasksError } = await supabase
      .from('linkedin_user_tasks')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('period', currentPeriod);

    if (existingTasksError) {
      console.error('Error checking existing tasks:', existingTasksError);
      return new Response(JSON.stringify({ error: 'Failed to check existing tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If tasks exist for this period, delete them to start fresh
    if (existingTasks && existingTasks.length > 0) {
      console.log(`Deleting ${existingTasks.length} existing tasks for period ${currentPeriod} to start fresh`);
      
      // Delete existing tasks and their evidence for this period to start fresh
      const { error: deleteEvidenceError } = await supabase
        .from('linkedin_evidence')
        .delete()
        .in('user_task_id', existingTasks.map(t => t.id));

      if (deleteEvidenceError) {
        console.error('Error deleting existing evidence:', deleteEvidenceError);
      }

      const { error: deleteTasksError } = await supabase
        .from('linkedin_user_tasks')
        .delete()
        .eq('user_id', targetUserId)
        .eq('period', currentPeriod);

      if (deleteTasksError) {
        console.error('Error deleting existing tasks:', deleteTasksError);
        return new Response(JSON.stringify({ error: 'Failed to delete existing tasks' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create fresh user tasks for the current period
    // Calculate individual due dates for each task based on display_order (day assignment)
    const userTasksToInsert = tasks.map(task => {
      const dayAssignment = task.display_order; // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
      
      // Calculate due date based on day assignment
      let dueDate = new Date(monday);
      
      if (dayAssignment === 7) {
        // Sunday tasks are due on Sunday evening (same day)
        dueDate.setDate(monday.getDate() + 6); // Sunday
        dueDate.setHours(23, 59, 59, 999);
      } else {
        // Other tasks are due the next day evening
        // Day 1 (Monday) -> Due Tuesday evening
        // Day 2 (Tuesday) -> Due Wednesday evening
        // etc.
        dueDate.setDate(monday.getDate() + dayAssignment); // Next day after assignment
        dueDate.setHours(23, 59, 59, 999);
      }
      
      return {
        user_id: targetUserId,
        task_id: task.id,
        period: currentPeriod,
        due_at: dueDate.toISOString(),
        status: 'NOT_STARTED'
      };
    });

    console.log(`Creating ${userTasksToInsert.length} fresh tasks for period ${currentPeriod}`);

    const { data: createdTasks, error: insertError } = await supabase
      .from('linkedin_user_tasks')
      .insert(userTasksToInsert)
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
      `);

    if (insertError) {
      console.error('Error inserting user tasks:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create user tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all user tasks for this period (including existing ones)
    const { data: allUserTasks, error: fetchError } = await supabase
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
      .eq('user_id', targetUserId)
      .eq('period', currentPeriod);

    if (fetchError) {
      console.error('Error fetching user tasks:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user tasks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Instantiated ${allUserTasks.length} tasks for user ${targetUserId} in period ${currentPeriod}`);
    console.log(`Tasks assigned with individual due dates based on day assignment`);

    return new Response(JSON.stringify({
      period: currentPeriod,
      userTasks: allUserTasks,
      weekStart: monday.toISOString(),
      weekEnd: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in instantiate-linkedin-week function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});