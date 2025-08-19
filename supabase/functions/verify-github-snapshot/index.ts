import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  name: string;
  description: string;
  topics: string[];
  private: boolean;
  fork: boolean;
  pushed_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId }: { userId: string } = await req.json();

    // Get GitHub username from user_inputs
    const { data: githubInput } = await supabaseClient
      .from('user_inputs')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'github_username')
      .single();

    if (!githubInput?.value) {
      return new Response(
        JSON.stringify({ 
          error: 'GitHub username not found in user inputs',
          success: false
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const username = githubInput.value;

    // Fetch GitHub user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) {
      throw new Error('GitHub user not found');
    }
    const userData: GitHubUser = await userResponse.json();

    // Fetch user's repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }
    const reposData: GitHubRepo[] = await reposResponse.json();

    // Analyze repositories
    const publicRepos = reposData.filter(repo => !repo.private && !repo.fork);
    const portfolioRepo = publicRepos.find(repo => 
      repo.name.toLowerCase().includes('portfolio') || 
      repo.name === username || 
      repo.description?.toLowerCase().includes('portfolio')
    );
    
    // Check for profile README (username/username repo)
    const profileReadmeRepo = publicRepos.find(repo => repo.name === username);
    
    // Count topics across all repos
    const totalTopics = reposData.reduce((count, repo) => count + (repo.topics?.length || 0), 0);

    // Get recent commits (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentCommitDays = new Set<string>();
    for (const repo of publicRepos.slice(0, 10)) { // Check top 10 repos for performance
      try {
        const commitsResponse = await fetch(
          `https://api.github.com/repos/${username}/${repo.name}/commits?since=${oneWeekAgo.toISOString()}`
        );
        if (commitsResponse.ok) {
          const commits = await commitsResponse.json();
          commits.forEach((commit: any) => {
            const commitDate = new Date(commit.commit.author.date);
            recentCommitDays.add(commitDate.toDateString());
          });
        }
      } catch (error) {
        console.log(`Failed to fetch commits for ${repo.name}:`, error);
      }
    }

    const snapshot = {
      username,
      public_repos: userData.public_repos,
      has_portfolio_repo: !!portfolioRepo,
      has_profile_readme: !!profileReadmeRepo,
      total_topics: totalTopics,
      recent_commit_days: recentCommitDays.size,
      followers: userData.followers,
      following: userData.following
    };

    // Store the snapshot data as signals for verification
    await supabaseClient
      .from('signals')
      .insert({
        user_id: userId,
        kind: 'PROFILE_UPDATED',
        subject: 'GitHub Profile Snapshot',
        raw_meta: snapshot,
        happened_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        snapshot,
        message: 'GitHub snapshot completed'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-github-snapshot function:', error);
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