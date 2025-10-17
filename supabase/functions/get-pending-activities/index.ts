import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user_id from request body
    let user_id;
    try {
      const body = await req.json();
      user_id = body.user_id;
      console.log('Request body received:', body);
    } catch (jsonError) {
      console.error('Error parsing JSON body:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching pending activities for user:', user_id);

    // Calculate current week period (format: YYYY-WW)
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const currentPeriod = `${now.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
    
    // Calculate current week start (Monday)
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];

    // Fetch LinkedIn tasks for current week (pending/assigned)
    const { data: linkedinTasks, error: linkedinError } = await supabase
      .from('linkedin_user_tasks')
      .select(`
        id,
        status,
        completed_at,
        linkedin_tasks (
          id,
          title,
          description,
          points
        )
      `)
      .eq('user_id', user_id)
      .eq('period', currentPeriod)
      .in('status', ['ASSIGNED', 'IN_PROGRESS'])
      .order('created_at', { ascending: true });

    if (linkedinError) {
      console.error('Error fetching LinkedIn tasks:', linkedinError);
    }

    // Fetch GitHub tasks for current week (assigned/in_progress)
    const { data: githubTasks, error: githubError } = await supabase
      .from('github_user_tasks')
      .select(`
        id,
        status,
        completed_at,
        github_tasks (
          id,
          title,
          description,
          points,
          task_type
        )
      `)
      .eq('user_id', user_id)
      .eq('period', currentPeriod)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: true });

    if (githubError) {
      console.error('Error fetching GitHub tasks:', githubError);
    }

    // Fetch Job Hunter daily tasks (pending/not started)
    const { data: jobHunterTasks, error: jobHunterError } = await supabase
      .from('daily_job_hunting_tasks')
      .select('*')
      .eq('user_id', user_id)
      .eq('task_date', today)
      .in('status', ['pending', 'not_started'])
      .order('created_at', { ascending: true });

    if (jobHunterError) {
      console.error('Error fetching job hunter tasks:', jobHunterError);
    }

    // Fetch job application activities for current week
    const weekStart = monday.toISOString().split('T')[0];
    const { data: jobApplicationActivities, error: jobAppError } = await supabase
      .from('job_application_activities')
      .select('activity_date, task_id, value')
      .eq('user_id', user_id)
      .gte('activity_date', weekStart)
      .lte('activity_date', today);

    if (jobAppError) {
      console.error('Error fetching job application activities:', jobAppError);
    }

    // Build response
    const response = {
      user_id: user_id,
      period: currentPeriod,
      date: today,
      linkedin: {
        pending_count: linkedinTasks?.length || 0,
        tasks: linkedinTasks?.map(task => ({
          id: task.id,
          title: task.linkedin_tasks?.title,
          description: task.linkedin_tasks?.description,
          points: task.linkedin_tasks?.points,
          status: task.status
        })) || []
      },
      github: {
        pending_count: githubTasks?.length || 0,
        tasks: githubTasks?.map(task => ({
          id: task.id,
          title: task.github_tasks?.title,
          description: task.github_tasks?.description,
          points: task.github_tasks?.points,
          task_type: task.github_tasks?.task_type,
          status: task.status
        })) || []
      },
      job_hunter: {
        pending_count: jobHunterTasks?.length || 0,
        tasks: jobHunterTasks?.map(task => ({
          id: task.id,
          task_type: task.task_type,
          target_count: task.target_count,
          actual_count: task.actual_count,
          status: task.status,
          task_date: task.task_date
        })) || []
      },
      job_applications: {
        weekly_data: jobApplicationActivities || []
      }
    };

    console.log('Successfully fetched pending activities:', {
      linkedin: response.linkedin.pending_count,
      github: response.github.pending_count,
      job_hunter: response.job_hunter.pending_count
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-pending-activities:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
