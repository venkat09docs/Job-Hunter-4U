import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  evidenceId: string;
  action: 'approve' | 'reject' | 'needs_review';
  verificationNotes?: string;
  adminUserId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { evidenceId, action, verificationNotes, adminUserId }: VerificationRequest = await req.json();

    // Get the evidence record with related assignment and template
    const { data: evidence, error: evidenceError } = await supabase
      .from('career_task_evidence')
      .select(`
        *,
        assignment:career_task_assignments(
          *,
          template:career_task_templates(*)
        )
      `)
      .eq('id', evidenceId)
      .single();

    if (evidenceError || !evidence) {
      throw new Error('Evidence not found');
    }

    console.log('Processing verification for evidence:', evidenceId, 'Action:', action);

    // Auto-verify certain types of evidence based on criteria
    let autoVerified = false;
    let verificationResult = action;
    let notes = verificationNotes || '';

    // Auto-verification logic for URLs and screenshots
    if (action === 'approve' && !adminUserId) {
      autoVerified = await performAutoVerification(evidence, supabase);
      if (!autoVerified) {
        verificationResult = 'needs_review';
        notes = 'Automatic verification failed, requires manual review';
      }
    }

    // Update evidence verification status
    const { error: updateError } = await supabase
      .from('career_task_evidence')
      .update({
        verification_status: verificationResult,
        verification_notes: notes,
        verified_by: adminUserId || null,
        verified_at: new Date().toISOString()
      })
      .eq('id', evidenceId);

    if (updateError) {
      throw new Error('Failed to update evidence verification status');
    }

    // If approved, update assignment status and award points
    if (verificationResult === 'approved') {
      const assignment = evidence.assignment;
      const template = assignment.template;

      // Update assignment status
      await supabase
        .from('career_task_assignments')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          points_earned: template.points_reward
        })
        .eq('id', assignment.id);

      // Update weekly schedule
      await updateWeeklyScheduleProgress(supabase, assignment.user_id, assignment.week_start_date);

      // Award points to user (integrate with existing points system)
      await awardUserPoints(supabase, assignment.user_id, template.points_reward, template.title);

      console.log(`Awarded ${template.points_reward} points to user ${assignment.user_id} for completing task: ${template.title}`);
    }

    return new Response(JSON.stringify({
      success: true,
      evidenceId,
      verificationStatus: verificationResult,
      autoVerified,
      pointsAwarded: verificationResult === 'approved' ? evidence.assignment.template.points_reward : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-evidence function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Auto-verification logic for different evidence types
async function performAutoVerification(evidence: any, supabase: any): Promise<boolean> {
  const template = evidence.assignment.template;
  const evidenceData = evidence.evidence_data;

  try {
    switch (evidence.evidence_type) {
      case 'url':
        return await verifyUrlEvidence(evidenceData, template);
      
      case 'screenshot':
        return await verifyScreenshotEvidence(evidence.file_urls, template);
      
      case 'data_export':
        return await verifyDataExportEvidence(evidence.file_urls, template);
      
      case 'text_description':
        return await verifyTextEvidence(evidenceData, template);
      
      default:
        return false; // Unknown evidence type requires manual review
    }
  } catch (error) {
    console.error('Auto-verification failed:', error);
    return false;
  }
}

async function verifyUrlEvidence(evidenceData: any, template: any): Promise<boolean> {
  const url = evidenceData.url;
  if (!url || !isValidUrl(url)) {
    return false;
  }

  // For LinkedIn tasks, verify the URL is from LinkedIn
  if (template.category === 'linkedin_growth') {
    return url.includes('linkedin.com');
  }

  // For Supabase/n8n tasks, check for relevant domains
  if (template.category === 'supabase_practice') {
    return url.includes('supabase.co') || url.includes('github.com') || isDeploymentUrl(url);
  }

  if (template.category === 'n8n_practice') {
    return url.includes('n8n.io') || url.includes('n8n.cloud') || isValidDemoUrl(url);
  }

  return true; // Other categories pass basic URL validation
}

async function verifyScreenshotEvidence(fileUrls: string[], template: any): Promise<boolean> {
  if (!fileUrls || fileUrls.length === 0) {
    return false;
  }

  // Basic validation - check if files exist and have image extensions
  for (const url of fileUrls) {
    if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return false;
    }
  }

  // For now, we'll approve screenshots if they're uploaded
  // In production, you might want to add image content analysis
  return true;
}

async function verifyDataExportEvidence(fileUrls: string[], template: any): Promise<boolean> {
  if (!fileUrls || fileUrls.length === 0) {
    return false;
  }

  // Check for valid file types (CSV, JSON, TXT)
  for (const url of fileUrls) {
    if (!url.match(/\.(csv|json|txt|xlsx?)$/i)) {
      return false;
    }
  }

  return true;
}

async function verifyTextEvidence(evidenceData: any, template: any): Promise<boolean> {
  const description = evidenceData.description;
  if (!description || description.length < 50) {
    return false; // Require meaningful descriptions
  }

  // Check for relevant keywords based on task category
  const keywords = getRelevantKeywords(template.category);
  const hasRelevantKeywords = keywords.some(keyword => 
    description.toLowerCase().includes(keyword.toLowerCase())
  );

  return hasRelevantKeywords;
}

// Helper functions
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isDeploymentUrl(url: string): boolean {
  return url.includes('vercel.app') || 
         url.includes('netlify.app') || 
         url.includes('herokuapp.com') ||
         url.includes('.dev') ||
         url.includes('railway.app');
}

function isValidDemoUrl(url: string): boolean {
  return isDeploymentUrl(url) || url.includes('localhost') || url.includes('127.0.0.1');
}

function getRelevantKeywords(category: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'linkedin_growth': ['linkedin', 'connection', 'post', 'engagement', 'network'],
    'supabase_practice': ['supabase', 'database', 'rls', 'authentication', 'postgres'],
    'n8n_practice': ['n8n', 'workflow', 'automation', 'trigger', 'webhook'],
    'networking': ['network', 'professional', 'industry', 'colleague'],
    'content_creation': ['content', 'article', 'post', 'blog', 'video']
  };
  
  return keywordMap[category] || [];
}

async function updateWeeklyScheduleProgress(supabase: any, userId: string, weekStartDate: string) {
  // Get current completed tasks count
  const { data: completedTasks } = await supabase
    .from('career_task_assignments')
    .select('points_earned')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate)
    .eq('status', 'verified');

  const tasksCompleted = completedTasks?.length || 0;
  const totalPointsEarned = completedTasks?.reduce((sum: number, task: any) => sum + (task.points_earned || 0), 0) || 0;

  // Update weekly schedule
  await supabase
    .from('career_weekly_schedules')
    .update({
      tasks_completed: tasksCompleted,
      points_earned: totalPointsEarned
    })
    .eq('user_id', userId)
    .eq('week_start_date', weekStartDate);
}

async function awardUserPoints(supabase: any, userId: string, points: number, taskTitle: string) {
  // Insert into user_activity_points table (if it exists)
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await supabase
      .from('user_activity_points')
      .insert({
        user_id: userId,
        activity_type: 'career_task_completion',
        activity_id: 'career_task',
        points_earned: points,
        activity_date: today
      });
  } catch (error) {
    console.log('Could not insert into user_activity_points:', error);
    // This is optional, don't fail the verification if this table doesn't exist
  }
}