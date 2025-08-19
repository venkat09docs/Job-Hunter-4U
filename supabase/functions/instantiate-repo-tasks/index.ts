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
      github_repos: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          html_url: string;
          default_branch: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
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

    const { userId, repoId } = await req.json();

    if (!userId || !repoId) {
      return new Response(
        JSON.stringify({ error: 'User ID and Repository ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Instantiating GitHub repo tasks for user:', userId, 'repo:', repoId);

    // Verify the repo belongs to the user
    const { data: repo, error: repoError } = await supabaseClient
      .from('github_repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (repoError || !repo) {
      console.error('Repository not found or access denied:', repoError);
      return new Response(
        JSON.stringify({ error: 'Repository not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if repo tasks already exist for this repository
    const { data: existingTasks, error: existingError } = await supabaseClient
      .from('github_user_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('repo_id', repoId)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing repo tasks:', existingError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log('Repo tasks already exist for repository:', repoId);
      return new Response(
        JSON.stringify({ message: 'Repository tasks already exist', repoId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active repo showcase tasks
    const { data: repoTasks, error: tasksError } = await supabaseClient
      .from('github_tasks')
      .select('*')
      .eq('scope', 'REPO')
      .eq('active', true);

    if (tasksError) {
      console.error('Error fetching repo tasks:', tasksError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch repository tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!repoTasks || repoTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active repository tasks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found repository tasks:', repoTasks.length);

    // No due date for one-time showcase tasks (they can be completed anytime)
    const userTasks = repoTasks.map(task => ({
      user_id: userId,
      task_id: task.id,
      period: null, // No period for one-time tasks
      repo_id: repoId,
      due_at: null, // No due date for showcase setup tasks
      status: 'NOT_STARTED' as const,
      score_awarded: 0,
    }));

    const { data: createdTasks, error: createError } = await supabaseClient
      .from('github_user_tasks')
      .insert(userTasks)
      .select('*');

    if (createError) {
      console.error('Error creating repo tasks:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create repository tasks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created repository tasks:', createdTasks?.length);

    return new Response(
      JSON.stringify({
        message: 'Repository showcase tasks created successfully',
        repoId,
        repoName: repo.full_name,
        tasksCreated: createdTasks?.length || 0,
        tasks: createdTasks,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instantiate-repo-tasks:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});