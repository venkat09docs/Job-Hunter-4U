import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyAllRequest {
  userId: string;
  period?: string;
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

    const { userId, period }: VerifyAllRequest = await req.json();

    // Get all user task assignments
    let query = supabaseClient
      .from('career_task_assignments')
      .select(`
        *,
        career_task_templates (*)
      `)
      .eq('user_id', userId);

    if (period) {
      query = query.eq('period', period);
    }

    const { data: assignments } = await query;

    if (!assignments) {
      return new Response(
        JSON.stringify({ success: true, verified: 0 }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let verifiedCount = 0;
    const verificationResults = [];

    for (const assignment of assignments) {
      if (assignment.status === 'VERIFIED') {
        continue; // Skip already verified tasks
      }

      const template = assignment.career_task_templates;
      if (!template) continue;

      const result = await verifyAssignment(supabaseClient, assignment, template, userId);
      
      if (result.status !== assignment.status || result.points !== assignment.points_earned) {
        // Update assignment status and points
        await supabaseClient
          .from('career_task_assignments')
          .update({
            status: result.status,
            points_earned: result.points,
            verified_at: result.status === 'VERIFIED' ? new Date().toISOString() : null
          })
          .eq('id', assignment.id);

        if (result.status === 'VERIFIED') {
          verifiedCount++;
        }
      }

      verificationResults.push({
        assignmentId: assignment.id,
        taskCode: template.code,
        status: result.status,
        points: result.points,
        reason: result.reason
      });
    }

    // Update weekly scores if needed
    if (verifiedCount > 0) {
      await updateWeeklyScores(supabaseClient, userId, period);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: verifiedCount,
        results: verificationResults
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-all-assignments function:', error);
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

async function verifyAssignment(supabaseClient: any, assignment: any, template: any, userId: string) {
  // Get evidence for this assignment
  const { data: evidence } = await supabaseClient
    .from('career_task_evidence')
    .select('*')
    .eq('assignment_id', assignment.id);

  const taskCode = template.code;
  let status = assignment.status;
  let points = assignment.points_earned || 0;
  let reason = 'No evidence submitted';

  if (!evidence || evidence.length === 0) {
    return { status: 'NOT_STARTED', points: 0, reason };
  }

  // Apply verification rules based on task code
  switch (taskCode) {
    case 'RESUME_UPLOAD_PRIMARY':
      const result = await verifyResumeUpload(supabaseClient, evidence, userId);
      status = result.status;
      points = result.points;
      reason = result.reason;
      break;

    case 'LI_HEADLINE_70':
      const headlineResult = verifyLinkedInHeadline(evidence);
      status = headlineResult.status;
      points = headlineResult.points;
      reason = headlineResult.reason;
      break;

    case 'GH_USERNAME_SET':
      const usernameResult = await verifyGitHubUsername(supabaseClient, evidence, userId);
      status = usernameResult.status;
      points = usernameResult.points;
      reason = usernameResult.reason;
      break;

    case 'GH_PORTFOLIO_REPO':
      const portfolioResult = await verifyGitHubPortfolio(supabaseClient, userId);
      status = portfolioResult.status;
      points = portfolioResult.points;
      reason = portfolioResult.reason;
      break;

    case 'GH_COMMIT_3DAYS':
      const commitResult = await verifyGitHubCommits(supabaseClient, userId, assignment.period);
      status = commitResult.status;
      points = commitResult.points;
      reason = commitResult.reason;
      break;

    default:
      // Generic evidence verification
      status = 'SUBMITTED';
      points = template.points_reward * 0.8; // Partial points for submission
      reason = 'Evidence submitted, manual review may be required';
      break;
  }

  return { status, points, reason };
}

async function verifyResumeUpload(supabaseClient: any, evidence: any[], userId: string) {
  const fileEvidence = evidence.find(e => e.kind === 'DATA_EXPORT' && e.file_urls?.length > 0);
  
  if (!fileEvidence) {
    return { status: 'NOT_STARTED', points: 0, reason: 'No resume file uploaded' };
  }

  // Get resume analysis
  const { data: resumeCheck } = await supabaseClient
    .from('resume_checks')
    .select('*')
    .eq('user_id', userId)
    .eq('evidence_id', fileEvidence.id)
    .single();

  if (!resumeCheck) {
    return { status: 'SUBMITTED', points: 5, reason: 'Resume uploaded, analysis pending' };
  }

  if (resumeCheck.has_email && resumeCheck.has_phone && resumeCheck.words >= 350) {
    return { status: 'VERIFIED', points: 10, reason: 'Resume meets all requirements' };
  } else {
    return { 
      status: 'PARTIALLY_VERIFIED', 
      points: 7, 
      reason: `Resume uploaded but missing: ${!resumeCheck.has_email ? 'email ' : ''}${!resumeCheck.has_phone ? 'phone ' : ''}${resumeCheck.words < 350 ? 'sufficient content' : ''}`
    };
  }
}

function verifyLinkedInHeadline(evidence: any[]) {
  const textEvidence = evidence.find(e => e.evidence_data?.text);
  const screenshotEvidence = evidence.find(e => e.kind === 'SCREENSHOT');

  if (!textEvidence) {
    return { status: 'NOT_STARTED', points: 0, reason: 'No headline text provided' };
  }

  const headline = textEvidence.evidence_data.text;
  if (headline.length >= 70 && headline.length <= 120) {
    if (screenshotEvidence) {
      return { status: 'VERIFIED', points: 10, reason: 'Headline meets length requirements with screenshot' };
    } else {
      return { status: 'PARTIALLY_VERIFIED', points: 7, reason: 'Headline meets requirements, screenshot missing' };
    }
  } else {
    return { 
      status: 'SUBMITTED', 
      points: 3, 
      reason: `Headline length is ${headline.length} characters (requires 70-120)` 
    };
  }
}

async function verifyGitHubUsername(supabaseClient: any, evidence: any[], userId: string) {
  const urlEvidence = evidence.find(e => e.kind === 'URL' || e.url);
  
  if (!urlEvidence?.url) {
    return { status: 'NOT_STARTED', points: 0, reason: 'No GitHub profile URL provided' };
  }

  // Extract username and save to user_inputs
  const githubUrlRegex = /github\.com\/([^\/]+)/;
  const match = urlEvidence.url.match(githubUrlRegex);
  
  if (!match) {
    return { status: 'SUBMITTED', points: 2, reason: 'Invalid GitHub URL format' };
  }

  const username = match[1];
  
  // Save username to user_inputs
  await supabaseClient
    .from('user_inputs')
    .upsert({
      user_id: userId,
      key: 'github_username',
      value: username
    });

  return { status: 'VERIFIED', points: 8, reason: 'GitHub username saved successfully' };
}

async function verifyGitHubPortfolio(supabaseClient: any, userId: string) {
  // Get latest GitHub snapshot
  const { data: signal } = await supabaseClient
    .from('signals')
    .select('raw_meta')
    .eq('user_id', userId)
    .eq('kind', 'PROFILE_UPDATED')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!signal?.raw_meta?.has_portfolio_repo) {
    return { status: 'NOT_STARTED', points: 0, reason: 'No portfolio repository found' };
  }

  return { status: 'VERIFIED', points: 12, reason: 'Portfolio repository verified' };
}

async function verifyGitHubCommits(supabaseClient: any, userId: string, period?: string) {
  // Get latest GitHub snapshot
  const { data: signal } = await supabaseClient
    .from('signals')
    .select('raw_meta')
    .eq('user_id', userId)
    .eq('kind', 'PROFILE_UPDATED')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!signal?.raw_meta) {
    return { status: 'NOT_STARTED', points: 0, reason: 'No GitHub activity data found' };
  }

  const recentCommitDays = signal.raw_meta.recent_commit_days || 0;
  
  if (recentCommitDays >= 3) {
    return { status: 'VERIFIED', points: 15, reason: `Commits found on ${recentCommitDays} days this week` };
  } else if (recentCommitDays > 0) {
    return { 
      status: 'PARTIALLY_VERIFIED', 
      points: Math.floor(15 * (recentCommitDays / 3)), 
      reason: `Commits found on ${recentCommitDays} days (need 3 days)` 
    };
  }

  return { status: 'NOT_STARTED', points: 0, reason: 'No recent commits found' };
}

async function updateWeeklyScores(supabaseClient: any, userId: string, period?: string) {
  // This would calculate and update weekly scores
  // Implementation depends on your scoring system
  console.log(`Updating weekly scores for user ${userId}, period ${period}`);
}

serve(handler);