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
    
    // Get current ISO week (YYYY-WW format)
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    const currentPeriod = `${year}-${week.toString().padStart(2, '0')}`;

    // Get Monday of current week for task assignment and due date calculations
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

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

    // Ensure user exists in linkedin_users table
    const { data: existingUser, error: userSelectError } = await supabase
      .from('linkedin_users')
      .select('id')
      .eq('auth_uid', targetUserId)
      .single();

    let linkedinUserId = existingUser?.id;

    if (!existingUser) {
      // Create linkedin_users record
      const { data: newUser, error: userCreateError } = await supabase
        .from('linkedin_users')
        .insert({
          auth_uid: targetUserId,
          auto_forward_address: `linkedin.${targetUserId.substring(0, 8)}@inbox.jobhunter.com`
        })
        .select('id')
        .single();

      if (userCreateError) {
        console.error('Error creating linkedin user:', userCreateError);
        return new Response(JSON.stringify({ error: 'Failed to create user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      linkedinUserId = newUser.id;
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

    // Create user tasks for the current period if they don't exist
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
        user_id: linkedinUserId,
        task_id: task.id,
        period: currentPeriod,
        due_at: dueDate.toISOString(),
        status: 'NOT_STARTED'
      };
    });

    const { data: createdTasks, error: insertError } = await supabase
      .from('linkedin_user_tasks')
      .upsert(userTasksToInsert, { 
        onConflict: 'user_id,task_id,period',
        ignoreDuplicates: true 
      })
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
      .eq('user_id', linkedinUserId)
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