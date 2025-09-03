import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { taskId, action, reviewerNotes } = await req.json()
    console.log('Received request:', { taskId, action, reviewerNotes })

    if (!taskId || !action || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the current user (reviewer)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Set auth header for supabase client
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Authenticated user:', user.id)

    // Fetch the task to verify reviewer permissions
    const { data: task, error: taskError } = await supabase
      .from('daily_job_hunting_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      console.error('Task fetch error:', taskError)
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Found task:', task.id, 'for user:', task.user_id)

    // Check if user has permission to review this task
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError) {
      console.error('Role fetch error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Unable to verify permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const roles = userRoles?.map(r => r.role) || []
    console.log('User roles:', roles)

    let hasPermission = false

    // Super admins can review all tasks
    if (roles.includes('admin')) {
      hasPermission = true
      console.log('User is admin - permission granted')
    }
    // Recruiters can review non-institute user tasks
    else if (roles.includes('recruiter')) {
      // Check if task user is NOT in any institute
      const { data: userAssignments } = await supabase
        .from('user_assignments')
        .select('id')
        .eq('user_id', task.user_id)
        .eq('is_active', true)

      if (!userAssignments || userAssignments.length === 0) {
        hasPermission = true
        console.log('User is recruiter and task user is not in institute - permission granted')
      }
    }
    // Institute admins can review their institute students' tasks
    else if (roles.includes('institute_admin')) {
      const { data: adminAssignments } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (adminAssignments && adminAssignments.length > 0) {
        const instituteIds = adminAssignments.map(a => a.institute_id)
        
        const { data: studentAssignments } = await supabase
          .from('user_assignments')
          .select('institute_id')
          .eq('user_id', task.user_id)
          .eq('is_active', true)
          .in('institute_id', instituteIds)

        if (studentAssignments && studentAssignments.length > 0) {
          hasPermission = true
          console.log('User is institute admin for task user - permission granted')
        }
      }
    }

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to review this task' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Calculate points based on task completion
    let pointsEarned = 0
    if (action === 'approve') {
      // Award points based on task type and actual count
      const taskConfigs = {
        job_applications: { basePoints: 10, maxTarget: 5 },
        referral_requests: { basePoints: 8, maxTarget: 3 },
        follow_up_messages: { basePoints: 6, maxTarget: 5 }
      }

      const config = taskConfigs[task.task_type as keyof typeof taskConfigs]
      if (config) {
        // Award full points if target met, proportional if partial
        const completionRatio = Math.min(task.actual_count / config.maxTarget, 1)
        pointsEarned = Math.round(config.basePoints * completionRatio)
      }
    }

    // Update the task status
    const { data: updatedTask, error: updateError } = await supabase
      .from('daily_job_hunting_tasks')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewer_notes: reviewerNotes,
        points_earned: pointsEarned
      })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update task' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // If approved, record points in user_activity_points
    if (action === 'approve' && pointsEarned > 0) {
      const { error: pointsError } = await supabase
        .from('user_activity_points')
        .insert({
          user_id: task.user_id,
          activity_type: `daily_${task.task_type}`,
          activity_name: `Daily Task: ${task.task_type.replace('_', ' ')}`,
          points_earned: pointsEarned,
          activity_date: task.task_date,
          evidence_data: {
            task_id: task.id,
            actual_count: task.actual_count,
            target_count: task.target_count
          }
        })

      if (pointsError) {
        console.error('Points insertion error:', pointsError)
        // Don't fail the whole operation, just log the error
      } else {
        console.log(`Awarded ${pointsEarned} points to user ${task.user_id}`)
      }
    }

    console.log(`Task ${taskId} ${action}ed successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        task: updatedTask,
        pointsAwarded: pointsEarned,
        message: `Task ${action}ed successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})