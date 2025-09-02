import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { username } = await req.json();

    if (!username) {
      console.error('Username is required');
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 Recalculating GitHub commits for user: ${username}`);

    // Find user by username (check display_name in profiles table)
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('display_name', username);

    if (profileError) {
      console.error('Error finding user profile:', profileError);
      throw profileError;
    }

    if (!profiles || profiles.length === 0) {
      console.error(`User not found with username: ${username}`);
      return new Response(
        JSON.stringify({ error: `User not found with username: ${username}` }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = profiles[0].user_id;
    console.log(`📋 Found user ID: ${userId} for username: ${username}`);

    // Get all GitHub user tasks for this user
    const { data: userTasks, error: tasksError } = await supabase
      .from('github_user_tasks')
      .select(`
        id,
        status,
        period,
        created_at,
        github_tasks (
          title,
          code,
          points_base
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'VERIFIED');

    if (tasksError) {
      console.error('Error fetching user tasks:', tasksError);
      throw tasksError;
    }

    console.log(`📋 Found ${userTasks?.length || 0} verified GitHub tasks`);

    // Get all evidence for these verified tasks
    const taskIds = userTasks?.map(task => task.id) || [];
    
    let totalCommits = 0;
    let totalReadmeUpdates = 0;
    let processedEvidence = 0;

    if (taskIds.length > 0) {
      const { data: evidence, error: evidenceError } = await supabase
        .from('github_evidence')
        .select('*')
        .in('user_task_id', taskIds)
        .eq('verification_status', 'verified');

      if (evidenceError) {
        console.error('Error fetching evidence:', evidenceError);
        throw evidenceError;
      }

      console.log(`📋 Found ${evidence?.length || 0} pieces of verified evidence`);

      // Calculate commits from evidence
      evidence?.forEach(evidenceItem => {
        try {
          const parsedData = evidenceItem.parsed_json as any;
          
          if (parsedData) {
            // Check for weeklyMetrics structure first (new format)
            if (parsedData.weeklyMetrics) {
              const commits = parsedData.weeklyMetrics.commits || 0;
              const readmes = parsedData.weeklyMetrics.readmeUpdates || 0;
              totalCommits += commits;
              totalReadmeUpdates += readmes;
              processedEvidence++;
              console.log(`📊 Added from weeklyMetrics - commits: ${commits}, readmes: ${readmes}`);
            } 
            // Fallback to legacy format
            else {
              const commits = parsedData.numberOfCommits || parsedData.commits_count || 0;
              const readmes = parsedData.numberOfReadmes || parsedData.readmes_count || 0;
              totalCommits += commits;
              totalReadmeUpdates += readmes;
              processedEvidence++;
              console.log(`📊 Added from legacy format - commits: ${commits}, readmes: ${readmes}`);
            }
          }
        } catch (error) {
          console.error('Error parsing evidence data:', error);
        }
      });

      // Add fallback commits for verified tasks without evidence data
      const tasksWithoutEvidence = taskIds.length - processedEvidence;
      if (tasksWithoutEvidence > 0) {
        totalCommits += tasksWithoutEvidence; // 1 commit per verified task without evidence
        console.log(`📊 Added ${tasksWithoutEvidence} fallback commits for tasks without evidence`);
      }
    }

    console.log(`📊 Final calculated totals - Commits: ${totalCommits}, README updates: ${totalReadmeUpdates}`);

    // Get current period for updating scores
    const getCurrentPeriod = (): string => {
      const now = new Date();
      const year = now.getFullYear();
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay();
      const daysToFirstMonday = jan4Day === 1 ? 0 : (jan4Day === 0 ? 1 : 8 - jan4Day);
      const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
      const currentWeekStart = new Date(now.getTime() - (now.getDay() - 1) * 24 * 60 * 60 * 1000);
      const daysDiff = Math.floor((currentWeekStart.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const weekNumber = daysDiff + 1;
      return `${year}-${weekNumber.toString().padStart(2, '0')}`;
    };

    const currentPeriod = getCurrentPeriod();

    // Update or create GitHub scores record for current period
    const { data: existingScore, error: scoreSelectError } = await supabase
      .from('github_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('period', currentPeriod)
      .single();

    const scoreData = {
      user_id: userId,
      period: currentPeriod,
      points_total: totalCommits * 10, // Assuming 10 points per commit
      breakdown: {
        total_commits: totalCommits,
        readme_updates: totalReadmeUpdates,
        verified_tasks: userTasks?.length || 0,
        calculated_at: new Date().toISOString()
      }
    };

    if (existingScore && !scoreSelectError) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('github_scores')
        .update(scoreData)
        .eq('id', existingScore.id);

      if (updateError) {
        console.error('Error updating GitHub scores:', updateError);
        throw updateError;
      }

      console.log(`✅ Updated GitHub scores for user ${username}`);
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('github_scores')
        .insert(scoreData);

      if (insertError) {
        console.error('Error inserting GitHub scores:', insertError);
        throw insertError;
      }

      console.log(`✅ Created new GitHub scores record for user ${username}`);
    }

    // Return summary
    const summary = {
      username,
      userId,
      verifiedTasks: userTasks?.length || 0,
      processedEvidence,
      totalCommits,
      totalReadmeUpdates,
      currentPeriod,
      message: 'GitHub commits successfully recalculated and updated'
    };

    console.log(`🎉 Recalculation completed:`, summary);

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in recalculate-github-commits function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});