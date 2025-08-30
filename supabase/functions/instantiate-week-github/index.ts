import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      github_tasks: {
        Row: {
          id: string;
          scope: string;
          code: string;
          title: string;
          description: string | null;
          cadence: string;
          evidence_types: string[];
          points_base: number;
          bonus_rules: Record<string, any>;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      github_user_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          period: string | null;
          repo_id: string | null;
          due_at: string | null;
          status: string;
          score_awarded: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          task_id: string;
          period?: string | null;
          repo_id?: string | null;
          due_at?: string | null;
          status?: string;
          score_awarded?: number;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Instantiating GitHub weekly tasks for user:', userId);

    // Get current week in ISO format (YYYY-WW)
    const now = new Date();
    const year = now.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const currentPeriod = `${year}-${week.toString().padStart(2, '0')}`;

    console.log('Current period:', currentPeriod);

    // Check if weekly tasks already exist for this period
    const { data: existingTasks, error: existingError } = await supabaseClient
      .from('github_user_tasks')
      .select('id')
      .eq('user_id', userId)
      .like('period', `${currentPeriod}%`) // Use LIKE to match period with day suffix
      .limit(1);

    if (existingError) {
      console.error('Error checking existing tasks:', existingError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log('Weekly tasks already exist for period:', currentPeriod);
      return new Response(
        JSON.stringify({ message: 'Weekly tasks already exist for this period', period: currentPeriod }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active GitHub tasks created in manage assignments
    const { data: weeklyTasks, error: tasksError } = await supabaseClient
      .from('github_tasks')
      .select('*')
      .eq('active', true);

    if (tasksError) {
      console.error('Error fetching weekly tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weekly tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!weeklyTasks || weeklyTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active GitHub assignments found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found GitHub assignments:', weeklyTasks.length);

    // Get current day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const currentDay = now.getDay();
    const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay];
    
    console.log('Current day:', currentDayName, '(', currentDay, ')');

    // Only create tasks for the current day and onwards within the same week
    // Get start of current week (Monday)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Calculate which day of the week to start creating tasks from
    const weekDayIndex = currentDay === 0 ? 6 : currentDay - 1; // Convert to 0=Monday, 6=Sunday
    
    // Create tasks for current day through Sunday
    const userTasks = [];
    for (let dayIndex = weekDayIndex; dayIndex < 7; dayIndex++) {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const assignmentDay = dayNames[dayIndex];
      
      // Calculate due date based on day:
      // Monday-Friday: 48 hours later
      // Saturday-Sunday: 24 hours later (by Sunday 11:59 PM)
      let dueDate = new Date(startOfWeek);
      dueDate.setDate(startOfWeek.getDate() + dayIndex); // Set to assignment day
      
      if (dayIndex <= 4) { // Monday through Friday (0-4)
        // 48 hours later, but not beyond Sunday
        dueDate.setDate(dueDate.getDate() + 2);
        if (dueDate.getDay() === 1) { // If it would be Monday, set to Sunday instead
          dueDate.setDate(dueDate.getDate() - 1);
        }
      } else { // Saturday and Sunday (5-6)
        // 24 hours later (by Sunday)
        dueDate.setDate(startOfWeek.getDate() + 6); // Set to Sunday
      }
      
      dueDate.setHours(23, 59, 59, 999); // End of day
      
      // Convert to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const dueDateIST = new Date(dueDate.getTime() + istOffset);

      // For each day, assign one task (rotate through available tasks)
      const taskIndex = dayIndex % weeklyTasks.length;
      const selectedTask = weeklyTasks[taskIndex];
      
      userTasks.push({
        user_id: userId,
        task_id: selectedTask.id,
        period: `${currentPeriod}-${assignmentDay}`,
        repo_id: null,
        due_at: dueDateIST.toISOString(),
        status: 'NOT_STARTED' as const,
        score_awarded: 0,
      });
      
      console.log(`Assigning ${selectedTask.title} for ${assignmentDay}, due: ${dueDateIST.toISOString()}`);
    }

    const { data: createdTasks, error: createError } = await supabaseClient
      .from('github_user_tasks')
      .insert(userTasks)
      .select('*');

    if (createError) {
      console.error('Error creating user tasks:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create weekly tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created GitHub user tasks:', createdTasks?.length);

    return new Response(
      JSON.stringify({
        message: 'Daily GitHub tasks created successfully',
        period: currentPeriod,
        tasksCreated: createdTasks?.length || 0,
        tasksDetails: userTasks.map(task => ({
          day: task.period?.split('-').pop(),
          dueDate: task.due_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instantiate-week-github:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});