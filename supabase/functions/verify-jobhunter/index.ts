import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, period } = await req.json()
    
    if (!userId) {
      throw new Error('userId is required')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Verifying job hunter activities for user:', userId, 'period:', period)

    // Determine the period to verify
    let startDate: Date
    let endDate: Date

    if (period) {
      // Verify specific period
      startDate = new Date(period + 'T00:00:00.000Z')
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
    } else {
      // Verify current week
      const now = new Date()
      const dayOfWeek = now.getDay()
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startDate = new Date(now)
      startDate.setDate(now.getDate() + daysToMonday)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)
    }

    const startDateString = startDate.toISOString().split('T')[0]
    const endDateString = endDate.toISOString().split('T')[0]

    console.log(`Verifying period: ${startDateString} to ${endDateString}`)

    // Get submitted assignments that need verification
    const { data: assignments, error: assignmentsError } = await supabase
      .from('job_hunting_assignments')
      .select(`
        *,
        job_hunting_task_templates (
          title,
          verification_criteria,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'submitted')
      .gte('assigned_at', startDate.toISOString())
      .lt('assigned_at', endDate.toISOString())

    if (assignmentsError) {
      throw assignmentsError
    }

    console.log(`Found ${assignments?.length || 0} assignments to verify`)

    // Get evidence for these assignments
    const assignmentIds = assignments?.map(a => a.id) || []
    const { data: evidence, error: evidenceError } = await supabase
      .from('job_hunting_evidence')
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('verification_status', 'pending')

    if (evidenceError) {
      throw evidenceError
    }

    console.log(`Found ${evidence?.length || 0} pieces of evidence to process`)

    // Verification logic - this is a simplified rule engine
    const verificationResults = []
    let totalPointsAwarded = 0

    for (const assignment of assignments || []) {
      const assignmentEvidence = evidence?.filter(e => e.assignment_id === assignment.id) || []
      
      if (assignmentEvidence.length === 0) {
        continue // Skip if no evidence
      }

      // Rule engine for verification
      let isVerified = false
      let pointsAwarded = 0
      let verificationNotes = ''

      const template = assignment.job_hunting_task_templates
      const criteria = template?.verification_criteria || {}

      // Basic verification rules
      for (const evidenceItem of assignmentEvidence) {
        const evidenceData = evidenceItem.evidence_data || {}
        
        switch (evidenceItem.evidence_type) {
          case 'url':
            // Verify URL evidence (job application links, etc.)
            if (evidenceData.url && evidenceData.url.length > 10) {
              isVerified = true
              pointsAwarded = Math.floor((template?.points_reward || 10) * 0.8) // 80% for URL evidence
              verificationNotes = 'Verified via URL submission'
            }
            break
            
          case 'screenshot':
            // Verify screenshot evidence
            if (evidenceItem.file_urls && evidenceItem.file_urls.length > 0) {
              isVerified = true
              pointsAwarded = Math.floor((template?.points_reward || 10) * 0.9) // 90% for screenshot
              verificationNotes = 'Verified via screenshot'
            }
            break
            
          case 'file':
            // Verify file uploads (resume, cover letter, etc.)
            if (evidenceItem.file_urls && evidenceItem.file_urls.length > 0) {
              isVerified = true
              pointsAwarded = template?.points_reward || 10 // Full points for file evidence
              verificationNotes = 'Verified via file upload'
            }
            break
            
          case 'email_signal':
            // Auto-verification from email forwarding
            if (evidenceData.email_type && evidenceData.confidence > 0.8) {
              isVerified = true
              pointsAwarded = template?.points_reward || 10 // Full points for email signals
              verificationNotes = `Auto-verified via email: ${evidenceData.email_type}`
            }
            break
        }

        if (isVerified) {
          break // Stop checking once verified
        }
      }

      if (isVerified) {
        // Update assignment status
        const { error: updateError } = await supabase
          .from('job_hunting_assignments')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            points_earned: pointsAwarded,
            score_awarded: pointsAwarded
          })
          .eq('id', assignment.id)

        if (updateError) {
          console.error('Error updating assignment:', updateError)
          continue
        }

        // Update evidence status
        for (const evidenceItem of assignmentEvidence) {
          await supabase
            .from('job_hunting_evidence')
            .update({
              verification_status: 'verified',
              verification_notes: verificationNotes,
              verified_at: new Date().toISOString()
            })
            .eq('id', evidenceItem.id)
        }

        // Add points to user_activity_points table
        const today = new Date().toISOString().split('T')[0]
        const { error: activityPointsError } = await supabase
          .from('user_activity_points')
          .insert({
            user_id: userId,
            activity_id: `job_hunting_assignment_${assignment.id}`,
            activity_date: today,
            points_earned: pointsAwarded,
            activity_type: 'job_hunting_assignment_completion'
          })

        if (activityPointsError) {
          console.error('Error inserting activity points:', activityPointsError)
        } else {
          console.log(`✅ Successfully added ${pointsAwarded} points to user_activity_points for assignment ${assignment.id}`)
        }

        totalPointsAwarded += pointsAwarded
        verificationResults.push({
          assignmentId: assignment.id,
          taskTitle: template?.title,
          status: 'verified',
          pointsAwarded,
          verificationNotes
        })

        // Update job pipeline stage if applicable
        if (template?.title?.toLowerCase().includes('apply')) {
          // Move job from 'leads' to 'applied' stage
          await supabase
            .from('job_hunting_pipeline')
            .update({ pipeline_stage: 'applied' })
            .eq('user_id', userId)
            .eq('pipeline_stage', 'leads')
            .ilike('job_title', `%${evidenceItem.evidence_data?.job_title || ''}%`)
        }
      } else {
        verificationResults.push({
          assignmentId: assignment.id,
          taskTitle: template?.title,
          status: 'insufficient_evidence',
          pointsAwarded: 0,
          verificationNotes: 'Insufficient or invalid evidence provided'
        })
      }
    }

    // Update streaks based on verified activities
    if (totalPointsAwarded > 0) {
      const today = new Date().toISOString().split('T')[0]
      
      // Update application streak if applications were verified
      const applicationTasks = verificationResults.filter(r => 
        r.taskTitle?.toLowerCase().includes('apply') && r.status === 'verified'
      )
      
      if (applicationTasks.length > 0) {
        await supabase.rpc('update_job_hunting_streak', {
          p_user_id: userId,
          p_streak_type: 'daily_application',
          p_activity_date: today
        })
      }

      // Update follow-up streak
      const followUpTasks = verificationResults.filter(r => 
        r.taskTitle?.toLowerCase().includes('follow') && r.status === 'verified'
      )
      
      if (followUpTasks.length > 0) {
        await supabase.rpc('update_job_hunting_streak', {
          p_user_id: userId,
          p_streak_type: 'follow_up',
          p_activity_date: today
        })
      }
    }

    // Update weekly schedule
    const { error: scheduleError } = await supabase
      .from('job_hunting_weekly_schedules')
      .update({
        tasks_completed: verificationResults.filter(r => r.status === 'verified').length,
        points_earned: totalPointsAwarded,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('week_start_date', startDateString)

    if (scheduleError) {
      console.error('Error updating weekly schedule:', scheduleError)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Verification completed',
        period: `${startDateString} to ${endDateString}`,
        totalPointsAwarded,
        verificationResults,
        tasksVerified: verificationResults.filter(r => r.status === 'verified').length,
        totalTasks: verificationResults.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in verify-jobhunter:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})