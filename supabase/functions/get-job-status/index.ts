import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get parameters from either query params (GET) or body (POST)
    let email: string | null = null;
    let userId: string | null = null;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      email = url.searchParams.get('email');
      userId = url.searchParams.get('user_id');
    } else if (req.method === 'POST') {
      const body = await req.json();
      email = body.email;
      userId = body.user_id;
    }

    // Validate that we have either email or user_id
    if (!email && !userId) {
      return new Response(
        JSON.stringify({
          error: 'Either email or user_id is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If email provided, get user_id from profiles
    if (email && !userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({
            error: 'User not found',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      userId = profile.user_id;
    }

    console.log('Fetching job status for user:', userId);

    // Fetch all jobs for the user
    const { data: jobs, error: jobsError } = await supabase
      .from('job_tracker')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    // Define pipeline stages
    const pipelineStages = [
      'wishlist',
      'applying',
      'applied',
      'interviewing',
      'negotiating',
      'accepted',
      'not_selected',
      'no_response',
      'archived'
    ];

    // Initialize counts
    const statusCounts: Record<string, number> = {};
    pipelineStages.forEach(stage => {
      statusCounts[stage] = 0;
    });

    // Count jobs by status
    jobs?.forEach(job => {
      const status = job.status || 'wishlist';
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });

    // Calculate additional statistics
    const totalJobs = jobs?.length || 0;
    const activeJobs = jobs?.filter(job => 
      !['accepted', 'not_selected', 'no_response', 'archived'].includes(job.status)
    ).length || 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentJobs = jobs?.filter(job => {
      const createdAt = new Date(job.created_at);
      return createdAt >= sevenDaysAgo;
    }).length || 0;

    // Get jobs with upcoming interviews or follow-ups
    const now = new Date();
    const upcomingActions = jobs?.filter(job => {
      if (job.interview_date) {
        const interviewDate = new Date(job.interview_date);
        return interviewDate >= now;
      }
      if (job.follow_up_date) {
        const followUpDate = new Date(job.follow_up_date);
        return followUpDate >= now;
      }
      return false;
    }).length || 0;

    // Build response
    const response = {
      user_id: userId,
      total_jobs: totalJobs,
      active_jobs: activeJobs,
      recent_activity_7_days: recentJobs,
      upcoming_actions: upcomingActions,
      pipeline_status: {
        wishlist: {
          count: statusCounts.wishlist,
          label: 'Wishlist'
        },
        applying: {
          count: statusCounts.applying,
          label: 'Applying'
        },
        applied: {
          count: statusCounts.applied,
          label: 'Applied'
        },
        interviewing: {
          count: statusCounts.interviewing,
          label: 'Interviewing'
        },
        negotiating: {
          count: statusCounts.negotiating,
          label: 'Negotiating'
        },
        accepted: {
          count: statusCounts.accepted,
          label: 'Accepted'
        },
        not_selected: {
          count: statusCounts.not_selected,
          label: 'Not Selected'
        },
        no_response: {
          count: statusCounts.no_response,
          label: 'No Response'
        },
        archived: {
          count: statusCounts.archived,
          label: 'Archived'
        }
      },
      summary: {
        success_rate: totalJobs > 0 ? ((statusCounts.accepted / totalJobs) * 100).toFixed(2) + '%' : '0%',
        response_rate: totalJobs > 0 ? (((totalJobs - statusCounts.no_response) / totalJobs) * 100).toFixed(2) + '%' : '0%',
        interview_rate: totalJobs > 0 ? (((statusCounts.interviewing + statusCounts.negotiating + statusCounts.accepted) / totalJobs) * 100).toFixed(2) + '%' : '0%'
      },
      timestamp: new Date().toISOString()
    };

    console.log('Job status response:', response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in get-job-status function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
