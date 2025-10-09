import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
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
    // Create Supabase client with no caching
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        db: {
          schema: 'public',
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'Cache-Control': 'no-cache',
          },
        },
      }
    );

    console.log('Fetching latest profile status at:', new Date().toISOString());

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

    // Get career task assignments for all modules (RESUME, LINKEDIN, GITHUB, PORTFOLIO) with fresh data
    console.log('Fetching assignments for user:', profile.user_id);
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
      .eq('user_id', profile.user_id)
      .order('updated_at', { ascending: false });

    console.log('Fetched career assignments count:', assignments?.length || 0);
    
    // Debug: Check assignments without templates
    const assignmentsWithoutTemplate = assignments?.filter(a => !a.career_task_templates) || [];
    console.log('Assignments without template:', assignmentsWithoutTemplate.length);
    
    // Debug: Check unique module values
    const uniqueModules = [...new Set(assignments?.map(a => a.career_task_templates?.module).filter(Boolean))];
    console.log('Unique modules found:', uniqueModules);
    
    // Debug: Sample assignments without template
    if (assignmentsWithoutTemplate.length > 0) {
      console.log('Sample assignment without template:', JSON.stringify(assignmentsWithoutTemplate[0], null, 2));
    }
    
    console.log('Assignments by module:', {
      resume: assignments?.filter(a => a.career_task_templates?.module === 'RESUME').length || 0,
      linkedin: assignments?.filter(a => a.career_task_templates?.module === 'LINKEDIN').length || 0,
      github: assignments?.filter(a => a.career_task_templates?.module === 'GITHUB').length || 0,
      portfolio: assignments?.filter(a => a.career_task_templates?.module === 'PORTFOLIO').length || 0,
      no_template: assignmentsWithoutTemplate.length,
    });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assignments', details: assignmentsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Additional debug: Check if template_ids exist but module is null
    const templateIds = assignments?.map(a => a.template_id).filter(Boolean) || [];
    if (templateIds.length > 0) {
      const { data: templates } = await supabaseClient
        .from('career_task_templates')
        .select('id, title, module, is_active')
        .in('id', templateIds);
      
      console.log('Templates check:', {
        total_templates: templates?.length || 0,
        templates_with_null_module: templates?.filter(t => !t.module).length || 0,
        inactive_templates: templates?.filter(t => !t.is_active).length || 0,
      });
      
      // Sample templates without module
      const templatesWithoutModule = templates?.filter(t => !t.module) || [];
      if (templatesWithoutModule.length > 0) {
        console.log('Sample template without module:', JSON.stringify(templatesWithoutModule[0], null, 2));
      }
    }

    // Subcategory ID to Module mapping
    const SUBCATEGORY_MODULE_MAP: Record<string, string> = {
      'ce552091-3a66-4aed-a165-686a524c8bca': 'RESUME',      // Resume Building
      '1f6bd7f0-117c-4167-8719-f55525b362e2': 'LINKEDIN',    // LinkedIn Profile
      '1c47c855-7705-456b-867a-0e7a563f54db': 'GITHUB',      // GitHub Profile
      '1a2c3b0a-abba-4342-b538-575872b109a2': 'PORTFOLIO',   // Digital Profile
    };

    // Helper function to determine module from assignment
    const getAssignmentModule = (assignment: any): string | null => {
      // First try the template module
      if (assignment.career_task_templates?.module) {
        return assignment.career_task_templates.module;
      }
      
      // Second: Check sub_category_id mapping
      const subCategoryId = assignment.career_task_templates?.sub_category_id;
      if (subCategoryId && SUBCATEGORY_MODULE_MAP[subCategoryId]) {
        return SUBCATEGORY_MODULE_MAP[subCategoryId];
      }
      
      // Fallback: Try to infer from category
      const category = assignment.career_task_templates?.category?.toUpperCase();
      if (category) {
        if (category.includes('LINKEDIN')) return 'LINKEDIN';
        if (category.includes('GITHUB')) return 'GITHUB';
        if (category.includes('PORTFOLIO') || category.includes('DIGITAL')) return 'PORTFOLIO';
        if (category.includes('RESUME')) return 'RESUME';
      }
      
      return null;
    };

    // Helper function to calculate module status with subcategory grouping
    const calculateModuleStatusWithSubcategories = (moduleName: string) => {
      const moduleTasks = assignments?.filter(
        a => getAssignmentModule(a) === moduleName
      ) || [];

      console.log(`[${moduleName}] Found ${moduleTasks.length} tasks`);

      // Group by subcategory
      const subcategoryMap = new Map();
      
      moduleTasks.forEach(task => {
        const subCategoryId = task.career_task_templates?.sub_category_id;
        if (!subCategoryId) return;
        
        if (!subcategoryMap.has(subCategoryId)) {
          subcategoryMap.set(subCategoryId, []);
        }
        subcategoryMap.get(subCategoryId).push(task);
      });

      // Build subcategory details - exclude assigned tasks
      const subcategoryDetails = [];
      
      subcategoryMap.forEach((tasks, subCategoryId) => {
        // Filter out "assigned" tasks
        const activeTasks = tasks.filter(t => t.status !== 'assigned');
        
        if (activeTasks.length === 0) return; // Skip subcategories with no active tasks
        
        const totalTasks = activeTasks.length;
        const verifiedTasks = activeTasks.filter(t => t.status === 'verified').length;
        const percentage = totalTasks > 0 ? Math.round((verifiedTasks / totalTasks) * 100) : 0;
        
        // Calculate total points earned in this subcategory
        const pointsEarned = activeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
        const maxPoints = activeTasks.reduce((sum, task) => sum + (task.career_task_templates?.points_reward || 0), 0);
        
        const taskDetails = activeTasks.map(task => ({
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

        subcategoryDetails.push({
          sub_category_id: subCategoryId,
          total_tasks: totalTasks,
          verified_tasks: verifiedTasks,
          pending_tasks: totalTasks - verifiedTasks,
          completion_percentage: percentage,
          is_complete: percentage === 100,
          points_earned: pointsEarned,
          max_points: maxPoints,
          tasks: taskDetails
        });
      });

      // Calculate overall stats - exclude assigned tasks
      const activeTasks = moduleTasks.filter(a => a.status !== 'assigned');
      const totalTasks = activeTasks.length;
      const verifiedTasks = activeTasks.filter(a => a.status === 'verified').length;
      const pendingTasks = totalTasks - verifiedTasks;

      const progressPercentage = totalTasks > 0 
        ? Math.round((verifiedTasks / totalTasks) * 100) 
        : 0;

      let status = 'Getting Started';
      if (progressPercentage >= 100) {
        status = 'Complete';
      } else if (progressPercentage >= 50) {
        status = 'In Progress';
      }

      const tasksByStatus = {
        in_progress: activeTasks.filter(a => a.status === 'in_progress').length,
        submitted: activeTasks.filter(a => a.status === 'submitted').length,
        completed: activeTasks.filter(a => a.status === 'completed').length,
        verified: verifiedTasks,
      };

      // Calculate total points earned across all subcategories
      const totalPointsEarned = activeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
      const totalMaxPoints = activeTasks.reduce((sum, task) => sum + (task.career_task_templates?.points_reward || 0), 0);

      return {
        progress_percentage: progressPercentage,
        status: status,
        total_tasks: totalTasks,
        completed_tasks: verifiedTasks,
        pending_tasks: pendingTasks,
        points_earned: totalPointsEarned,
        max_points: totalMaxPoints,
        subcategories: subcategoryDetails,
        tasks: {
          total: totalTasks,
          verified: verifiedTasks,
          pending: pendingTasks,
          breakdown: tasksByStatus,
        }
      };
    };

    // Helper function for LinkedIn status from career_task_assignments
    const calculateLinkedInStatus = () => {
      const moduleTasks = assignments?.filter(
        a => getAssignmentModule(a) === 'LINKEDIN'
      ) || [];

      console.log(`[LINKEDIN] Found ${moduleTasks.length} tasks`);

      // Filter out assigned tasks
      const activeTasks = moduleTasks.filter(a => a.status !== 'assigned');
      const totalTasks = activeTasks.length;
      const verifiedTasks = activeTasks.filter(a => a.status === 'verified').length;
      const pendingTasks = totalTasks - verifiedTasks;

      const progressPercentage = totalTasks > 0 
        ? Math.round((verifiedTasks / totalTasks) * 100) 
        : 0;

      let status = 'Getting Started';
      if (progressPercentage >= 100) {
        status = 'Complete';
      } else if (progressPercentage >= 50) {
        status = 'In Progress';
      }

      const tasksByStatus = {
        in_progress: activeTasks.filter(a => a.status === 'in_progress').length,
        submitted: activeTasks.filter(a => a.status === 'submitted').length,
        completed: activeTasks.filter(a => a.status === 'completed').length,
        verified: verifiedTasks,
      };

      const taskDetails = activeTasks.map(task => ({
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

      // Calculate total points
      const totalPointsEarned = activeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
      const totalMaxPoints = activeTasks.reduce((sum, task) => sum + (task.career_task_templates?.points_reward || 0), 0);

      return {
        progress_percentage: progressPercentage,
        status: status,
        total_tasks: totalTasks,
        completed_tasks: verifiedTasks,
        pending_tasks: pendingTasks,
        points_earned: totalPointsEarned,
        max_points: totalMaxPoints,
        tasks: {
          total: totalTasks,
          verified: verifiedTasks,
          pending: pendingTasks,
          breakdown: tasksByStatus,
          details: taskDetails,
        }
      };
    };

    // Helper function for GitHub status from career_task_assignments
    const calculateGitHubStatus = () => {
      const moduleTasks = assignments?.filter(
        a => getAssignmentModule(a) === 'GITHUB'
      ) || [];

      console.log(`[GITHUB] Found ${moduleTasks.length} tasks`);

      // Filter out assigned tasks
      const activeTasks = moduleTasks.filter(a => a.status !== 'assigned');
      const totalTasks = activeTasks.length;
      const verifiedTasks = activeTasks.filter(a => a.status === 'verified').length;
      const pendingTasks = totalTasks - verifiedTasks;

      const progressPercentage = totalTasks > 0 
        ? Math.round((verifiedTasks / totalTasks) * 100) 
        : 0;

      let status = 'Getting Started';
      if (progressPercentage >= 100) {
        status = 'Complete';
      } else if (progressPercentage >= 50) {
        status = 'In Progress';
      }

      const tasksByStatus = {
        in_progress: activeTasks.filter(a => a.status === 'in_progress').length,
        submitted: activeTasks.filter(a => a.status === 'submitted').length,
        completed: activeTasks.filter(a => a.status === 'completed').length,
        verified: verifiedTasks,
      };

      const taskDetails = activeTasks.map(task => ({
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

      // Calculate total points
      const totalPointsEarned = activeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
      const totalMaxPoints = activeTasks.reduce((sum, task) => sum + (task.career_task_templates?.points_reward || 0), 0);

      return {
        progress_percentage: progressPercentage,
        status: status,
        total_tasks: totalTasks,
        completed_tasks: verifiedTasks,
        pending_tasks: pendingTasks,
        points_earned: totalPointsEarned,
        max_points: totalMaxPoints,
        tasks: {
          total: totalTasks,
          verified: verifiedTasks,
          pending: pendingTasks,
          breakdown: tasksByStatus,
          details: taskDetails,
        }
      };
    };

    // Helper function for Portfolio status from career_task_assignments
    const calculatePortfolioStatus = () => {
      const moduleTasks = assignments?.filter(
        a => getAssignmentModule(a) === 'PORTFOLIO'
      ) || [];

      console.log(`[PORTFOLIO] Found ${moduleTasks.length} tasks`);

      // Filter out assigned tasks
      const activeTasks = moduleTasks.filter(a => a.status !== 'assigned');
      const totalTasks = activeTasks.length;
      const verifiedTasks = activeTasks.filter(a => a.status === 'verified').length;
      const pendingTasks = totalTasks - verifiedTasks;

      const progressPercentage = totalTasks > 0 
        ? Math.round((verifiedTasks / totalTasks) * 100) 
        : 0;

      let status = 'Getting Started';
      if (progressPercentage >= 100) {
        status = 'Complete';
      } else if (progressPercentage >= 50) {
        status = 'In Progress';
      }

      const tasksByStatus = {
        in_progress: activeTasks.filter(a => a.status === 'in_progress').length,
        submitted: activeTasks.filter(a => a.status === 'submitted').length,
        completed: activeTasks.filter(a => a.status === 'completed').length,
        verified: verifiedTasks,
      };

      const taskDetails = activeTasks.map(task => ({
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

      // Calculate total points
      const totalPointsEarned = activeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
      const totalMaxPoints = activeTasks.reduce((sum, task) => sum + (task.career_task_templates?.points_reward || 0), 0);

      return {
        progress_percentage: progressPercentage,
        status: status,
        total_tasks: totalTasks,
        completed_tasks: verifiedTasks,
        pending_tasks: pendingTasks,
        points_earned: totalPointsEarned,
        max_points: totalMaxPoints,
        tasks: {
          total: totalTasks,
          verified: verifiedTasks,
          pending: pendingTasks,
          breakdown: tasksByStatus,
          details: taskDetails,
        }
      };
    };

    // Calculate status for all modules
    const resumeStatus = calculateModuleStatusWithSubcategories('RESUME');
    const linkedinStatus = calculateLinkedInStatus();
    const githubStatus = calculateGitHubStatus();
    const portfolioStatus = calculatePortfolioStatus();

    const responseData = {
      user: {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
      },
      resume_profile: resumeStatus,
      linkedin_profile: linkedinStatus,
      github_profile: githubStatus,
      digital_portfolio: portfolioStatus,
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
