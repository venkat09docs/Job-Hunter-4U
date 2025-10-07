import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeStatusRequest {
  email?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle both GET and POST requests
    let email: string | undefined;
    let user_id: string | undefined;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      email = url.searchParams.get('email') ?? undefined;
      user_id = url.searchParams.get('user_id') ?? undefined;
    } else {
      const body: ResumeStatusRequest = await req.json();
      email = body.email;
      user_id = body.user_id;
    }

    if (!email && !user_id) {
      return new Response(
        JSON.stringify({ error: 'Email or user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user profile
    let query = supabaseClient.from('profiles').select('*');
    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found', details: profileError?.message }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get career task assignments for RESUME module (matching Profile Assignments page logic)
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('career_task_assignments')
      .select(`
        *,
        career_task_templates!career_task_assignments_template_id_fkey(
          id,
          title,
          description,
          category,
          module,
          points_reward,
          sub_category_id
        )
      `)
      .eq('user_id', profile.user_id);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assignments', details: assignmentsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Filter RESUME module tasks (matching Profile Assignments page)
    const resumeTasks = assignments?.filter(
      a => a.career_task_templates?.module === 'RESUME'
    ) || [];

    const totalTasks = resumeTasks.length;
    const verifiedTasks = resumeTasks.filter(a => a.status === 'verified').length;
    const pendingTasks = totalTasks - verifiedTasks;

    // Calculate progress percentage (matching Profile Assignments page)
    const progressPercentage = totalTasks > 0 
      ? Math.round((verifiedTasks / totalTasks) * 100) 
      : 0;

    // Determine status based on progress (matching Profile Assignments page)
    let status = 'Getting Started';
    if (progressPercentage >= 100) {
      status = 'Complete';
    } else if (progressPercentage >= 50) {
      status = 'In Progress';
    }

    // Get task breakdown by status
    const tasksByStatus = {
      assigned: resumeTasks.filter(a => a.status === 'assigned').length,
      in_progress: resumeTasks.filter(a => a.status === 'in_progress').length,
      submitted: resumeTasks.filter(a => a.status === 'submitted').length,
      completed: resumeTasks.filter(a => a.status === 'completed').length,
      verified: verifiedTasks,
    };

    // Get task details
    const taskDetails = resumeTasks.map(task => ({
      id: task.id,
      title: task.career_task_templates?.title || 'Unknown Task',
      description: task.career_task_templates?.description || '',
      status: task.status,
      points_reward: task.career_task_templates?.points_reward || 0,
      points_earned: task.points_earned || 0,
      assigned_at: task.assigned_at,
      submitted_at: task.submitted_at,
      verified_at: task.verified_at,
      due_date: task.due_date,
    }));

    const responseData = {
      user: {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
      },
      resume_profile: {
        progress_percentage: progressPercentage,
        status: status,
        total_tasks: totalTasks,
        completed_tasks: verifiedTasks,
        pending_tasks: pendingTasks,
      },
      tasks: {
        total: totalTasks,
        verified: verifiedTasks,
        pending: pendingTasks,
        breakdown: tasksByStatus,
        details: taskDetails,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in get-resume-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
