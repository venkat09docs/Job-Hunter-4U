import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyAssignmentRequest {
  assignmentId: string;
  assignmentType: 'career' | 'linkedin' | 'job_hunting' | 'github';
  action: 'approve' | 'reject';
  verificationNotes?: string;
  scoreAwarded?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's JWT for RLS context
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get current user using the user client
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    console.log('🔐 Authenticated user:', user.id);

    // Verify user is an institute admin by checking institute_admin_assignments
    const { data: adminAssignments, error: roleError } = await supabaseClient
      .from('institute_admin_assignments')
      .select('institute_id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError || !adminAssignments?.length) {
      console.error('Institute admin verification failed:', roleError);
      throw new Error('Only institute admins can verify assignments');
    }

    console.log('✅ Institute admin status verified:', {
      userId: user.id,
      managedInstitutes: adminAssignments.length
    });

    const body: VerifyAssignmentRequest = await req.json();
    const { assignmentId, assignmentType, action, verificationNotes, scoreAwarded } = body;

    console.log('📋 Processing assignment verification:', {
      assignmentId,
      assignmentType,
      action,
      adminUserId: user.id
    });

    // Use the user client to fetch assignment (this will respect RLS policies)
    let assignment: any = null;
    let tableName = '';

    // Get assignment details using user context (RLS will filter appropriately)
    switch (assignmentType) {
      case 'career':
        tableName = 'career_task_assignments';
        const { data: careerAssignment, error: careerError } = await userClient
          .from('career_task_assignments')
          .select(`
            *,
            career_task_templates (
              title,
              points_reward,
              module
            )
          `)
          .eq('id', assignmentId)
          .single();

        if (careerError) {
          console.error('Career assignment fetch error:', careerError);
          throw new Error(`Assignment not found or you don't have access to it`);
        }
        assignment = careerAssignment;
        break;

      case 'linkedin':
        tableName = 'linkedin_user_tasks';
        const { data: linkedinAssignment, error: linkedinError } = await userClient
          .from('linkedin_user_tasks')
          .select(`
            *,
            linkedin_tasks (
              title,
              points_base
            )
          `)
          .eq('id', assignmentId)
          .single();

        if (linkedinError) {
          console.error('LinkedIn assignment fetch error:', linkedinError);
          throw new Error(`Assignment not found or you don't have access to it`);
        }
        assignment = linkedinAssignment;
        break;

      case 'job_hunting':
        tableName = 'job_hunting_assignments';
        const { data: jobAssignment, error: jobError } = await userClient
          .from('job_hunting_assignments')
          .select(`
            *,
            template:job_hunting_task_templates (
              title,
              points_reward
            )
          `)
          .eq('id', assignmentId)
          .single();

        if (jobError) {
          console.error('Job hunting assignment fetch error:', jobError);
          throw new Error(`Assignment not found or you don't have access to it`);
        }
        assignment = jobAssignment;
        break;

      case 'github':
        tableName = 'github_user_tasks';
        const { data: githubAssignment, error: githubError } = await userClient
          .from('github_user_tasks')
          .select(`
            *,
            github_tasks (
              title,
              points_base
            )
          `)
          .eq('id', assignmentId)
          .single();

        if (githubError) {
          console.error('GitHub assignment fetch error:', githubError);
          throw new Error(`Assignment not found or you don't have access to it`);
        }
        assignment = githubAssignment;
        break;

      default:
        throw new Error('Invalid assignment type');
    }

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    console.log('📄 Assignment found:', {
      id: assignment.id,
      userId: assignment.user_id,
      status: assignment.status
    });

    // Update assignment based on type and action using service role client
    const updateData: any = {
      verification_notes: verificationNotes || null
    };

    if (assignmentType === 'career') {
      // Career assignments have verified_at and verified_by columns
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = user.id;
      updateData.status = action === 'approve' ? 'verified' : 'rejected';
      updateData.points_earned = action === 'approve' ? (scoreAwarded || assignment.career_task_templates?.points_reward || 0) : 0;
      updateData.score_awarded = updateData.points_earned;
    } else if (assignmentType === 'job_hunting') {
      // Job hunting assignments have verified_at and verified_by columns
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = user.id;
      updateData.status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
      const templatePoints = assignment.template?.points_reward || 0;
      updateData.score_awarded = action === 'approve' ? (scoreAwarded || templatePoints) : 0;
    } else {
      // LinkedIn and GitHub assignments only have verification_notes and score_awarded
      updateData.status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
      const pointsField = 'points_base';
      const templatePoints = assignmentType === 'linkedin' 
        ? assignment.linkedin_tasks?.[pointsField]
        : assignment.github_tasks?.[pointsField];
      
      updateData.score_awarded = action === 'approve' ? (scoreAwarded || templatePoints || 0) : 0;
    }

    console.log('🔄 Updating assignment:', { updateData, tableName });

    // Update the assignment using service role client
    const { data: updatedAssignment, error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('✅ Assignment verification completed:', {
      id: assignmentId,
      action,
      points: updateData.score_awarded || updateData.points_earned,
      status: updateData.status
    });

    // Award points to user_activity_points table if approved
    if (action === 'approve' && (updateData.score_awarded || updateData.points_earned) > 0) {
      const pointsToAward = updateData.score_awarded || updateData.points_earned;
      const activityTypeMap = {
        'career': 'career_task_completion',
        'linkedin': 'linkedin_task_completion', 
        'job_hunting': 'job_hunting_task_completion',
        'github': 'github_task_completion'
      };
      
      const activityType = activityTypeMap[assignmentType];
      
      console.log('🎯 Awarding points to user_activity_points:', {
        userId: assignment.user_id,
        activityType,
        assignmentId,
        points: pointsToAward
      });

      const { error: pointsError } = await supabaseClient
        .from('user_activity_points')
        .insert({
          user_id: assignment.user_id,
          activity_type: activityType,
          activity_id: assignmentId,
          points_earned: pointsToAward,
          activity_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
        });

      if (pointsError) {
        console.error('❌ Error awarding points:', pointsError);
        // Don't fail the request if points can't be awarded, just log the error
      } else {
        console.log('✅ Points awarded successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignment: updatedAssignment,
        message: `Assignment ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in verify-institute-assignments:', error);
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
});