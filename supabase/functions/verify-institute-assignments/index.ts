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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Set the auth context for RLS
    const jwt = authHeader.replace('Bearer ', '');
    supabaseClient.auth.setAuth(jwt);

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    console.log('🔐 Authenticated user:', user.id);

    // Verify user is an institute admin
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'institute_admin');

    if (roleError || !userRoles?.length) {
      throw new Error('Only institute admins can verify assignments');
    }

    console.log('✅ Institute admin role verified');

    const body: VerifyAssignmentRequest = await req.json();
    const { assignmentId, assignmentType, action, verificationNotes, scoreAwarded } = body;

    console.log('📋 Processing assignment verification:', {
      assignmentId,
      assignmentType,
      action,
      adminUserId: user.id
    });

    // Verify institute admin has access to this assignment
    let assignment: any = null;
    let tableName = '';
    let userIdField = 'user_id';

    // Get assignment details and verify access
    switch (assignmentType) {
      case 'career':
        tableName = 'career_task_assignments';
        const { data: careerAssignment, error: careerError } = await supabaseClient
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

        if (careerError) throw careerError;
        assignment = careerAssignment;
        break;

      case 'linkedin':
        tableName = 'linkedin_user_tasks';
        const { data: linkedinAssignment, error: linkedinError } = await supabaseClient
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

        if (linkedinError) throw linkedinError;
        assignment = linkedinAssignment;
        break;

      case 'job_hunting':
        tableName = 'job_hunting_assignments';
        const { data: jobAssignment, error: jobError } = await supabaseClient
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

        if (jobError) throw jobError;
        assignment = jobAssignment;
        break;

      case 'github':
        tableName = 'github_user_tasks';
        const { data: githubAssignment, error: githubError } = await supabaseClient
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

        if (githubError) throw githubError;
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

    // Verify the admin has access to this user's institute
    const { data: userAssignment, error: userAssignmentError } = await supabaseClient
      .from('user_assignments')
      .select(`
        institute_id,
        institutes:institute_id (
          name
        )
      `)
      .eq('user_id', assignment.user_id)
      .eq('is_active', true)
      .single();

    if (userAssignmentError && userAssignmentError.code !== 'PGRST116') {
      throw new Error(`Failed to verify user institute assignment: ${userAssignmentError.message}`);
    }

    // If user is not assigned to an institute, only super admin/recruiter can verify
    if (!userAssignment) {
      const { data: adminRoles, error: adminRoleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'recruiter']);

      if (adminRoleError || !adminRoles?.length) {
        throw new Error('User is not assigned to your institute');
      }
    } else {
      // Verify admin manages this institute
      const { data: adminAssignment, error: adminAssignmentError } = await supabaseClient
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user.id)
        .eq('institute_id', userAssignment.institute_id)
        .eq('is_active', true)
        .single();

      if (adminAssignmentError || !adminAssignment) {
        throw new Error(`You don't have permission to verify assignments for ${userAssignment.institutes?.name || 'this institute'}`);
      }

      console.log('✅ Institute access verified:', userAssignment.institutes?.name);
    }

    // Update assignment based on type and action
    const updateData: any = {
      verified_at: new Date().toISOString(),
      verified_by: user.id,
      verification_notes: verificationNotes || null
    };

    if (assignmentType === 'career') {
      updateData.status = action === 'approve' ? 'verified' : 'rejected';
      updateData.points_earned = action === 'approve' ? (scoreAwarded || assignment.career_task_templates?.points_reward || 0) : 0;
      updateData.score_awarded = updateData.points_earned;
    } else {
      // For other types (LinkedIn, GitHub, Job Hunting)
      updateData.status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
      const pointsField = assignmentType === 'linkedin' || assignmentType === 'github' ? 'points_base' : 'points_reward';
      const templatePoints = assignmentType === 'career' 
        ? assignment.career_task_templates?.[pointsField] 
        : assignmentType === 'linkedin' 
        ? assignment.linkedin_tasks?.[pointsField]
        : assignmentType === 'github'
        ? assignment.github_tasks?.[pointsField]
        : assignment.template?.[pointsField];
      
      updateData.score_awarded = action === 'approve' ? (scoreAwarded || templatePoints || 0) : 0;
    }

    console.log('🔄 Updating assignment:', { updateData, tableName });

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Assignment verification completed:', {
      id: assignmentId,
      action,
      points: updateData.score_awarded || updateData.points_earned,
      status: updateData.status
    });

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