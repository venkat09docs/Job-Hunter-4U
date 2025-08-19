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
      .eq('period', currentPeriod)
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

    // Get all active weekly tasks
    const { data: weeklyTasks, error: tasksError } = await supabaseClient
      .from('github_tasks')
      .select('*')
      .eq('scope', 'WEEKLY')
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
        JSON.stringify({ message: 'No active weekly tasks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found weekly tasks:', weeklyTasks.length);

    // Calculate due date (end of current week - Sunday 23:59:59 IST)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const dueDate = new Date(endOfWeek.getTime() + istOffset);

    // Create user task instances for all weekly tasks
    const userTasks = weeklyTasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      period: currentPeriod,
      repo_id: null, // Weekly tasks are not repo-specific
      due_at: dueDate.toISOString(),
      status: 'NOT_STARTED' as const,
      score_awarded: 0,
    }));

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

    console.log('Created weekly tasks:', createdTasks?.length);

    return new Response(
      JSON.stringify({
        message: 'Weekly GitHub tasks created successfully',
        period: currentPeriod,
        tasksCreated: createdTasks?.length || 0,
        dueDate: dueDate.toISOString(),
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