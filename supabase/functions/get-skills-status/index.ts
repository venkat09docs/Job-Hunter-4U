import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
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

    console.log('Fetching latest skills status at:', new Date().toISOString());

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

    // Get all active courses with latest data
    console.log('Fetching all active courses for user:', profile.user_id);
    const { data: allCourses, error: coursesError } = await supabaseClient
      .from('clp_courses')
      .select('id, title, code, is_free, subscription_plan_id, category, description')
      .eq('is_active', true)
      .order('updated_at', { ascending: false }); // Get most recently updated first

    console.log('Total active courses found:', allCourses?.length || 0);

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch courses', details: coursesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user's learning goals (enrolled courses) with latest data
    console.log('Fetching learning goals for user:', profile.user_id);
    const { data: learningGoals, error: goalsError } = await supabaseClient
      .from('learning_goals')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('updated_at', { ascending: false }); // Get most recently updated first

    console.log('User learning goals count:', learningGoals?.length || 0);

    if (goalsError) {
      console.error('Error fetching learning goals:', goalsError);
    }

    // Get user's subscription status from profile
    const userSubscription = profile.subscription_plan || 'free';
    const isSubscribed = profile.subscription_active || false;

    // Define subscription plan hierarchy (matching client-side logic)
    const planNameToTier: { [key: string]: number } = {
      'One Week Plan': 1,
      'One Month Plan': 1,
      '1 Month Plan': 1,
      'Monthly Plan': 1,
      'Three Months Plan': 2,
      '3 Months Plan': 2,
      'Six Months Plan': 3,
      '6 Months Plan': 3,
      'One Year Plan': 4,
      '1 Year Plan': 4,
      'Annual Plan': 4
    };

    // Get user's subscription tier
    const getUserTier = (): number => {
      if (!isSubscribed) return 0; // No active subscription = free tier
      return planNameToTier[userSubscription] || 1; // Default to tier 1 if unknown
    };

    const userTier = getUserTier();
    console.log('User subscription tier:', userTier, 'Plan:', userSubscription, 'Active:', isSubscribed);

    // Map subscription_plan_id (UUID) to tier
    const planUUIDToTier: { [key: string]: number } = {
      '4f72fb43-6e55-407e-969e-c83acfa5b05f': 1, // One Month Plan (30 days)
      'f077e30e-bdb9-4b09-9fa2-9c33a355189d': 2, // 3 Months Plan (90 days)
      '726be3fc-fdd5-4a59-883a-6b60cd2f68c5': 3, // 6 Months Plan (180 days)
      'c0aff632-80b0-4832-827a-ece42aa37ead': 4, // 1 Year Plan (365 days)
    };

    // Get course required tier
    const getCourseRequiredTier = (course: any): number => {
      if (course.is_free) return 0;
      
      if (course.subscription_plan_id) {
        return planUUIDToTier[course.subscription_plan_id] ?? 1;
      }

      return 1; // Default to tier 1 if not specified
    };

    // Filter accessible courses
    const accessibleCourses = allCourses?.filter(course => {
      const requiredTier = getCourseRequiredTier(course);
      return userTier >= requiredTier;
    }) || [];

    console.log('Accessible courses for user:', accessibleCourses.length, 'out of', allCourses?.length || 0);

    // Calculate course statistics with detailed information
    const enrolledCourseIds = new Set(learningGoals?.map(lg => lg.course_id) || []);
    
    const coursesInProgress = accessibleCourses.filter(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return goal && goal.status === 'in_progress';
    }).map(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return {
        id: course.id,
        title: course.title,
        code: course.code,
        category: course.category,
        description: course.description,
        is_free: course.is_free,
        enrolled_at: goal?.created_at,
        status: goal?.status
      };
    });

    const coursesCompleted = accessibleCourses.filter(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return goal && goal.status === 'completed';
    }).map(course => {
      const goal = learningGoals?.find(lg => lg.course_id === course.id);
      return {
        id: course.id,
        title: course.title,
        code: course.code,
        category: course.category,
        description: course.description,
        is_free: course.is_free,
        enrolled_at: goal?.created_at,
        completed_at: goal?.updated_at,
        status: goal?.status
      };
    });

    const coursesPending = accessibleCourses.filter(course => {
      return !enrolledCourseIds.has(course.id);
    }).map(course => ({
      id: course.id,
      title: course.title,
      code: course.code,
      category: course.category,
      description: course.description,
      is_free: course.is_free,
      required_tier: getCourseRequiredTier(course),
      can_enroll: true
    }));

    // Get modules to map sections to courses
    console.log('Fetching all modules');
    const { data: allModules, error: modulesError } = await supabaseClient
      .from('clp_modules')
      .select('id, course_id, title')
      .eq('is_active', true);

    console.log('Total modules found:', allModules?.length || 0);

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
    }

    // Get all published assignments with section info
    console.log('Fetching all published assignments');
    const { data: allAssignments, error: assignmentsError } = await supabaseClient
      .from('clp_assignments')
      .select('id, title, type, section_id, is_published')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    console.log('Total published assignments found:', allAssignments?.length || 0);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Get sections to link assignments to modules
    const sectionIds = allAssignments?.map(a => a.section_id).filter(Boolean) || [];
    let sections: any[] = [];
    
    if (sectionIds.length > 0) {
      const { data: sectionsData, error: sectionsError } = await supabaseClient
        .from('clp_sections')
        .select('id, module_id')
        .in('id', sectionIds);

      if (!sectionsError && sectionsData) {
        sections = sectionsData;
      } else {
        console.log('No sections table or error fetching sections:', sectionsError?.message);
      }
    }

    // Create a map of section_id -> module_id -> course_id
    const sectionToCourseMap = new Map();
    sections.forEach(section => {
      const module = allModules?.find(m => m.id === section.module_id);
      if (module) {
        sectionToCourseMap.set(section.id, module.course_id);
      }
    });

    // Filter assignments that belong to accessible courses
    const accessibleCourseIds = new Set(accessibleCourses.map(c => c.id));
    const accessibleAssignments = allAssignments?.filter(assignment => {
      const courseId = sectionToCourseMap.get(assignment.section_id);
      return courseId && accessibleCourseIds.has(courseId);
    }) || [];

    console.log('Accessible assignments:', accessibleAssignments.length, 'out of', allAssignments?.length || 0);

    // Get user's assignment attempts
    console.log('Fetching attempts for user:', profile.user_id);
    const { data: attempts, error: attemptsError } = await supabaseClient
      .from('clp_attempts')
      .select('id, assignment_id, status, review_status, score_points, submitted_at')
      .eq('user_id', profile.user_id)
      .order('updated_at', { ascending: false });

    console.log('User attempts count:', attempts?.length || 0);

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
    }

    // Calculate assignment statistics with detailed status information
    const assignmentStatuses = accessibleAssignments.map(assignment => {
      const userAttempts = attempts?.filter(a => a.assignment_id === assignment.id) || [];
      const latestAttempt = userAttempts.length > 0 ? userAttempts[0] : null;
      
      let status = 'not_started';
      if (latestAttempt) {
        if (latestAttempt.status === 'submitted' && latestAttempt.review_status === 'approved') {
          status = 'completed';
        } else if (latestAttempt.status === 'submitted') {
          status = 'pending_review';
        } else if (latestAttempt.status === 'started') {
          status = 'in_progress';
        }
      }
      
      return {
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        status,
        attempts_count: userAttempts.length,
        latest_score: latestAttempt?.score_points || 0,
        submitted_at: latestAttempt?.submitted_at,
        course_id: sectionToCourseMap.get(assignment.section_id)
      };
    });

    const assignmentsCompleted = assignmentStatuses.filter(a => a.status === 'completed').length;
    const assignmentsInProgress = assignmentStatuses.filter(a => a.status === 'in_progress').length;
    const assignmentsPendingReview = assignmentStatuses.filter(a => a.status === 'pending_review').length;
    const assignmentsNotStarted = assignmentStatuses.filter(a => a.status === 'not_started').length;

    const responseData = {
      user: {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
        subscription_plan: userSubscription,
        subscription_active: isSubscribed,
        subscription_tier: userTier,
      },
      courses: {
        total: accessibleCourses.length,
        in_progress: coursesInProgress.length,
        completed: coursesCompleted.length,
        pending: coursesPending.length,
        details: {
          in_progress: coursesInProgress,
          completed: coursesCompleted,
          pending: coursesPending,
        }
      },
      skill_assignments: {
        total: accessibleAssignments.length,
        completed: assignmentsCompleted,
        in_progress: assignmentsInProgress,
        pending_review: assignmentsPendingReview,
        not_started: assignmentsNotStarted,
        completion_percentage: accessibleAssignments.length > 0 
          ? Math.round((assignmentsCompleted / accessibleAssignments.length) * 100) 
          : 0,
        details: assignmentStatuses
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
