import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SkillsStatusRequest {
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
      const body: SkillsStatusRequest = await req.json();
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

    // Get all active courses
    const { data: allCourses, error: coursesError } = await supabaseClient
      .from('clp_courses')
      .select('id, title, code, is_free, subscription_plan_id')
      .eq('is_active', true);

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch courses', details: coursesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user's learning goals (enrolled courses)
    const { data: learningGoals, error: goalsError } = await supabaseClient
      .from('learning_goals')
      .select('*')
      .eq('user_id', profile.user_id);

    if (goalsError) {
      console.error('Error fetching learning goals:', goalsError);
    }

    // Get user's subscription status from profile
    const userSubscription = profile.subscription_plan || 'free';
    const isSubscribed = profile.subscription_active || false;

    // Define subscription hierarchy
    const subscriptionHierarchy: { [key: string]: number } = {
      'free': 0,
      'basic': 1,
      'premium': 2,
      'enterprise': 3
    };

    // Determine user's subscription tier
    const getUserTier = (): number => {
      if (!isSubscribed) return 0;
      const tier = subscriptionHierarchy[userSubscription.toLowerCase()] ?? 0;
      return tier;
    };

    const userTier = getUserTier();

    // Map course subscription requirements
    const getCourseRequiredTier = (course: any): number => {
      if (course.is_free) return 0;
      
      // Map subscription_plan_id to tier
      const planMapping: { [key: string]: number } = {
        'free': 0,
        'basic': 1,
        'premium': 2,
        'enterprise': 3
      };

      if (course.subscription_plan_id) {
        // Fetch the subscription plan details
        return planMapping[course.subscription_plan_id] ?? 1;
      }

      return 1; // Default to basic if not specified
    };

    // Filter accessible courses
    const accessibleCourses = allCourses?.filter(course => {
      const requiredTier = getCourseRequiredTier(course);
      return userTier >= requiredTier;
    }) || [];

    // Calculate course statistics
    const enrolledCourseIds = new Set(learningGoals?.map(lg => lg.course_id) || []);
    
    const coursesInProgress = accessibleCourses.filter(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return goal && goal.status === 'in_progress';
    });

    const coursesCompleted = accessibleCourses.filter(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return goal && goal.status === 'completed';
    });

    const coursesPending = accessibleCourses.filter(course => {
      return !enrolledCourseIds.has(course.id);
    });

    // Get user's assignment attempts for skill assignments
    const { data: attempts, error: attemptsError } = await supabaseClient
      .from('clp_attempts')
      .select(`
        *,
        clp_assignments!inner(
          id,
          title,
          type,
          section_id,
          is_published,
          clp_modules!inner(
            id,
            title,
            course_id
          )
        )
      `)
      .eq('user_id', profile.user_id);

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
    }

    // Get all published assignments accessible to the user
    const { data: allAssignments, error: assignmentsError } = await supabaseClient
      .from('clp_assignments')
      .select(`
        id,
        title,
        type,
        section_id,
        is_published,
        clp_modules!inner(
          id,
          title,
          course_id
        )
      `)
      .eq('is_published', true);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Filter assignments that belong to accessible courses
    const accessibleCourseIds = new Set(accessibleCourses.map(c => c.id));
    const accessibleAssignments = allAssignments?.filter(assignment => {
      const courseId = (assignment as any).clp_modules?.course_id;
      return accessibleCourseIds.has(courseId);
    }) || [];

    // Calculate assignment statistics
    const completedAssignmentIds = new Set(
      attempts?.filter(a => a.status === 'submitted' && a.review_status === 'approved')
        .map(a => a.assignment_id) || []
    );

    const assignmentsAvailable = accessibleAssignments.length;
    const assignmentsCompleted = completedAssignmentIds.size;

    const responseData = {
      user: {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
        subscription_plan: userSubscription,
        subscription_active: isSubscribed,
      },
      courses: {
        total: accessibleCourses.length,
        in_progress: coursesInProgress.length,
        completed: coursesCompleted.length,
        pending: coursesPending.length,
        details: {
          in_progress: coursesInProgress.map(c => ({
            id: c.id,
            title: c.title,
            code: c.code,
          })),
          completed: coursesCompleted.map(c => ({
            id: c.id,
            title: c.title,
            code: c.code,
          })),
          pending: coursesPending.map(c => ({
            id: c.id,
            title: c.title,
            code: c.code,
          })),
        }
      },
      skill_assignments: {
        available: assignmentsAvailable,
        completed: assignmentsCompleted,
        pending: assignmentsAvailable - assignmentsCompleted,
        completion_percentage: assignmentsAvailable > 0 
          ? Math.round((assignmentsCompleted / assignmentsAvailable) * 100) 
          : 0,
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
    console.error('Error in get-skills-status function:', error);
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
