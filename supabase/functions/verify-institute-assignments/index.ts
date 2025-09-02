import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerificationRequest {
  assignmentId: string;
  assignmentType: 'career' | 'linkedin' | 'github' | 'job_hunting';
  action: 'approve' | 'reject';
  scoreAwarded?: number;
  verificationNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      assignmentId, 
      assignmentType, 
      action, 
      scoreAwarded = 0, 
      verificationNotes = '' 
    }: VerificationRequest = await req.json();

    console.log(`🔍 Processing ${action} for assignment ${assignmentId} (${assignmentType})`);

    // Get JWT from Authorization header for user verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const verifierId = user.id;
    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'verified' : 'rejected';
    const pointsEarned = isApproved ? scoreAwarded : 0;

    let assignmentData: any = null;
    let notificationTitle: string;
    let notificationMessage: string;

    // Process different assignment types
    switch (assignmentType) {
      case 'career':
        // Update career task assignment
        const { data: careerData, error: careerError } = await supabase
          .from('career_task_assignments')
          .update({
            status: newStatus,
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            points_earned: pointsEarned,
            score_awarded: scoreAwarded,
            verification_notes: verificationNotes
          })
          .eq('id', assignmentId)
          .select(`
            *,
            career_task_templates(title, module, points_reward),
            profiles(user_id, full_name)
          `)
          .single();

        if (careerError) throw careerError;
        assignmentData = careerData;

        // Update evidence status
        await supabase
          .from('career_task_evidence')
          .update({
            verification_status: isApproved ? 'approved' : 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            verification_notes: verificationNotes
          })
          .eq('assignment_id', assignmentId);

        notificationTitle = `Task ${isApproved ? 'Approved' : 'Rejected'}: ${assignmentData.career_task_templates?.title}`;
        notificationMessage = isApproved
          ? `Congratulations! Your task "${assignmentData.career_task_templates?.title}" has been approved. You earned ${pointsEarned} points!`
          : `Your task "${assignmentData.career_task_templates?.title}" was rejected. ${verificationNotes ? `Reason: ${verificationNotes}` : 'Please review and resubmit.'}`;
        break;

      case 'linkedin':
        // Update LinkedIn task
        const { data: linkedinData, error: linkedinError } = await supabase
          .from('linkedin_user_tasks')
          .update({
            status: isApproved ? 'VERIFIED' : 'REJECTED',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            score_awarded: scoreAwarded,
            verification_notes: verificationNotes
          })
          .eq('id', assignmentId)
          .select(`
            *,
            linkedin_tasks(title, points_base),
            profiles(user_id, full_name)
          `)
          .single();

        if (linkedinError) throw linkedinError;
        assignmentData = linkedinData;

        // Update evidence status
        await supabase
          .from('linkedin_evidence')
          .update({
            verification_status: isApproved ? 'verified' : 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            verification_notes: verificationNotes
          })
          .eq('user_task_id', assignmentId);

        notificationTitle = `LinkedIn Task ${isApproved ? 'Approved' : 'Rejected'}: ${assignmentData.linkedin_tasks?.title}`;
        notificationMessage = isApproved
          ? `Great work! Your LinkedIn task "${assignmentData.linkedin_tasks?.title}" has been approved. You earned ${pointsEarned} points!`
          : `Your LinkedIn task "${assignmentData.linkedin_tasks?.title}" was rejected. ${verificationNotes ? `Reason: ${verificationNotes}` : 'Please review and resubmit.'}`;
        break;

      case 'github':
        // Update GitHub task
        const { data: githubData, error: githubError } = await supabase
          .from('github_user_tasks')
          .update({
            status: isApproved ? 'VERIFIED' : 'REJECTED',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            score_awarded: scoreAwarded,
            verification_notes: verificationNotes
          })
          .eq('id', assignmentId)
          .select(`
            *,
            github_tasks(title, points_base),
            profiles(user_id, full_name)
          `)
          .single();

        if (githubError) throw githubError;
        assignmentData = githubData;

        // Update evidence status
        await supabase
          .from('github_evidence')
          .update({
            verification_status: isApproved ? 'verified' : 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            verification_notes: verificationNotes
          })
          .eq('user_task_id', assignmentId);

        notificationTitle = `GitHub Task ${isApproved ? 'Approved' : 'Rejected'}: ${assignmentData.github_tasks?.title}`;
        notificationMessage = isApproved
          ? `Excellent! Your GitHub task "${assignmentData.github_tasks?.title}" has been approved. You earned ${pointsEarned} points!`
          : `Your GitHub task "${assignmentData.github_tasks?.title}" was rejected. ${verificationNotes ? `Reason: ${verificationNotes}` : 'Please review and resubmit.'}`;
        break;

      case 'job_hunting':
        // Update job hunting assignment
        const { data: jobData, error: jobError } = await supabase
          .from('job_hunting_assignments')
          .update({
            status: newStatus,
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            points_earned: pointsEarned,
            score_awarded: scoreAwarded
          })
          .eq('id', assignmentId)
          .select('*')
          .single();

        if (jobError) throw jobError;
        assignmentData = jobData;

        // Get template data separately
        const { data: templateData, error: templateError } = await supabase
          .from('job_hunting_task_templates')
          .select('title, points_reward')
          .eq('id', assignmentData.template_id)
          .single();
          
        if (!templateError && templateData) {
          assignmentData.job_hunting_task_templates = templateData;
        }
        
        // Get user profile separately
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', assignmentData.user_id)
          .single();
          
        if (!profileError && profileData) {
          assignmentData.profiles = profileData;
        }

        // Update evidence status
        await supabase
          .from('job_hunting_evidence')
          .update({
            verification_status: isApproved ? 'approved' : 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: verifierId,
            verification_notes: verificationNotes
          })
          .eq('assignment_id', assignmentId);

        notificationTitle = `Job Hunting Task ${isApproved ? 'Approved' : 'Rejected'}: ${assignmentData.job_hunting_task_templates?.title}`;
        notificationMessage = isApproved
          ? `Amazing! Your job hunting task "${assignmentData.job_hunting_task_templates?.title}" has been approved. You earned ${pointsEarned} points!`
          : `Your job hunting task "${assignmentData.job_hunting_task_templates?.title}" was rejected. ${verificationNotes ? `Reason: ${verificationNotes}` : 'Please review and resubmit.'}`;
        break;

      default:
        throw new Error(`Unsupported assignment type: ${assignmentType}`);
    }

    if (!assignmentData) {
      throw new Error('Assignment not found or could not be updated');
    }

    // Send notification to the user
    const userId = assignmentData.profiles?.user_id || assignmentData.user_id;
    if (userId) {
      console.log(`📧 Sending ${action} notification to user ${userId}`);
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notificationTitle,
          message: notificationMessage,
          type: isApproved ? 'task_approved' : 'task_rejected',
          related_id: assignmentId,
          is_read: false
        });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't throw here as the main verification was successful
      } else {
        console.log(`✅ Notification sent successfully to user ${userId}`);
      }

      // If approved, award points in user activity points table
      if (isApproved && pointsEarned > 0) {
        const taskTitle = assignmentData.career_task_templates?.title || 
                         assignmentData.linkedin_tasks?.title || 
                         assignmentData.github_tasks?.title || 
                         assignmentData.job_hunting_task_templates?.title || 
                         'Task Completed';
        
        const { error: pointsError } = await supabase
          .from('user_activity_points')
          .insert({
            user_id: userId,
            activity_date: new Date().toISOString().split('T')[0],
            activity_type: `${assignmentType}_task_completion`,
            activity_id: assignmentId,
            points_earned: pointsEarned
          });

        if (pointsError) {
          console.error('Error awarding points:', pointsError);
        } else {
          console.log(`🎯 Awarded ${pointsEarned} points to user ${userId} for ${taskTitle}`);
        }
      }
    }

    console.log(`✅ Assignment ${assignmentId} ${action}ed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        assignment: assignmentData,
        message: `Assignment ${action}ed successfully` 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-institute-assignments:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);