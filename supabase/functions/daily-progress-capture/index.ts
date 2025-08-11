import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProgressData {
  user_id: string;
  resume_progress: number;
  linkedin_progress: number;
  github_progress: number;
  network_progress: number;
  job_applications_count: number;
  published_blogs_count: number;
  total_resume_opens: number;
  total_job_searches: number;
  total_ai_queries: number;
}

Deno.serve(async (req) => {
  console.log('Daily progress capture function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date for snapshot
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`Processing daily snapshot for: ${todayStr}`);

    // Get all users to capture their progress
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users to process`);

    const results = [];

    // Process each user
    for (const user of users || []) {
      try {
        const progressData = await captureUserProgress(supabase, user.user_id, todayStr);
        results.push({ user_id: user.user_id, status: 'success', data: progressData });
      } catch (error) {
        console.error(`Error capturing progress for user ${user.user_id}:`, error);
        results.push({ user_id: user.user_id, status: 'error', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Completed: ${successCount} successful, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily progress captured for ${successCount} users`,
        snapshot_date: todayStr,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Weekly progress capture error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function captureUserProgress(supabase: any, userId: string, snapshotDate: string): Promise<ProgressData> {
  // Calculate resume progress using the same logic as frontend
  const { data: resumeData } = await supabase
    .from('resume_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  let resumeProgress = 0;
  if (resumeData) {
    const personalDetails = resumeData.personal_details || {};
    const experience = resumeData.experience || [];
    const education = resumeData.education || [];
    const skillsInterests = resumeData.skills_interests || {};
    const skills = skillsInterests.skills || [];
    const interests = skillsInterests.interests || [];
    const certifications = resumeData.certifications_awards || [];
    const professionalSummary = resumeData.professional_summary || '';

    let totalProgress = 0;
    
    // Personal Details - 15% (name, email, phone required)
    const personalDetailsComplete = !!(
      personalDetails.fullName &&
      personalDetails.email &&
      personalDetails.phone
    );
    if (personalDetailsComplete) totalProgress += 15;
    
    // Professional Summary - 20%
    if (professionalSummary && professionalSummary.trim()) totalProgress += 20;
    
    // Experience - 10% (at least one with company and role)
    const experienceComplete = experience.some((exp: any) => 
      exp.company && exp.company.trim() && exp.role && exp.role.trim()
    );
    if (experienceComplete) totalProgress += 10;
    
    // Education - 15% (at least one with institution and degree)
    const educationComplete = education.some((edu: any) => 
      edu.institution && edu.institution.trim() && edu.degree && edu.degree.trim()
    );
    if (educationComplete) totalProgress += 15;
    
    // Skills - 10% (at least one skill)
    const skillsComplete = skills.some((skill: any) => skill && skill.trim());
    if (skillsComplete) totalProgress += 10;
    
    // Interests - 5% (at least one interest)
    const interestsComplete = interests.some((interest: any) => interest && interest.trim());
    if (interestsComplete) totalProgress += 5;
    
    // Certifications - 15% (at least one certification)
    const certificationsComplete = certifications.some((cert: any) => cert && cert.trim());
    if (certificationsComplete) totalProgress += 15;
    
    // Awards - 10% (using certifications field for now as there's no separate awards field)
    const awardsComplete = certifications.length > 1; // If more than one item, consider some as awards
    if (awardsComplete) totalProgress += 10;
    
    resumeProgress = Math.min(totalProgress, 100);
  }

  // Get LinkedIn progress
  const { count: linkedinCompletedTasks } = await supabase
    .from('linkedin_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  const linkedinProgress = Math.round((linkedinCompletedTasks || 0) * 100 / 9);

  // Get GitHub progress
  const { count: githubCompletedTasks } = await supabase
    .from('github_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true);

  const githubProgress = Math.round((githubCompletedTasks || 0) * 100 / 5);

  // Get total network activities for today from linkedin_network_metrics
  const { data: networkMetrics } = await supabase
    .from('linkedin_network_metrics')
    .select('value')
    .eq('user_id', userId)
    .eq('date', snapshotDate);

  // Sum all network activities for the day
  const totalNetworkActivities = networkMetrics?.reduce((sum, metric) => sum + metric.value, 0) || 0;
  const networkProgress = totalNetworkActivities; // Store count instead of percentage

  // Get job applications count
  const { count: jobApplicationsCount } = await supabase
    .from('job_tracker')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .neq('status', 'wishlist');

  // Get published blogs count
  const { count: publishedBlogsCount } = await supabase
    .from('blogs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true);

  // Get analytics from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_resume_opens, total_job_searches, total_ai_queries')
    .eq('user_id', userId)
    .single();

  const progressData: ProgressData = {
    user_id: userId,
    resume_progress: resumeProgress,
    linkedin_progress: linkedinProgress,
    github_progress: githubProgress,
    network_progress: networkProgress,
    job_applications_count: jobApplicationsCount || 0,
    published_blogs_count: publishedBlogsCount || 0,
    total_resume_opens: profile?.total_resume_opens || 0,
    total_job_searches: profile?.total_job_searches || 0,
    total_ai_queries: profile?.total_ai_queries || 0
  };

  // Insert or update daily snapshot
  const { error } = await supabase
    .from('daily_progress_snapshots')
    .upsert({
      user_id: userId,
      snapshot_date: snapshotDate,
      ...progressData
    }, {
      onConflict: 'user_id,snapshot_date'
    });

  if (error) {
    throw error;
  }

  console.log(`Captured progress for user ${userId}`);
  return progressData;
}