import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('userId is required')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Instantiating week tasks for user:', userId)

    // Get current week start date (Monday)
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Sunday = 0, Monday = 1
    const weekStartDate = new Date(now)
    weekStartDate.setDate(now.getDate() + daysToMonday)
    weekStartDate.setHours(0, 0, 0, 0)
    const weekStartString = weekStartDate.toISOString().split('T')[0]

    // Check if user already has assignments for this week
    const { data: existingAssignments, error: checkError } = await supabase
      .from('job_hunting_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartString)
      .limit(1)

    if (checkError) {
      throw checkError
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('Week already instantiated for user:', userId)
      return new Response(
        JSON.stringify({ 
          message: 'Week already instantiated', 
          weekStartDate: weekStartString 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get active job hunting task templates
    const { data: templates, error: templatesError } = await supabase
      .from('job_hunting_task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('cadence', 'weekly')

    if (templatesError) {
      throw templatesError
    }

    console.log(`Found ${templates?.length || 0} weekly templates`)

    // Create assignments for each template
    const assignments = []
    const dueDate = new Date(weekStartDate)
    dueDate.setDate(dueDate.getDate() + 7) // Due at end of week

    for (const template of templates || []) {
      assignments.push({
        user_id: userId,
        template_id: template.id,
        week_start_date: weekStartString,
        due_date: dueDate.toISOString(),
        status: 'assigned',
        points_earned: 0,
        score_awarded: 0
      })
    }

    if (assignments.length > 0) {
      const { data: insertedAssignments, error: insertError } = await supabase
        .from('job_hunting_assignments')
        .insert(assignments)
        .select()

      if (insertError) {
        throw insertError
      }

      console.log(`Created ${insertedAssignments?.length || 0} assignments`)

      // Update or create weekly schedule
      const { error: scheduleError } = await supabase
        .from('job_hunting_weekly_schedules')
        .upsert({
          user_id: userId,
          week_start_date: weekStartString,
          total_tasks_assigned: assignments.length,
          tasks_completed: 0,
          total_points_possible: templates?.reduce((sum, t) => sum + t.points_reward, 0) || 0,
          points_earned: 0,
          schedule_generated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,week_start_date'
        })

      if (scheduleError) {
        console.error('Error updating schedule:', scheduleError)
        // Don't fail the entire operation for schedule update
      }

      return new Response(
        JSON.stringify({ 
          message: 'Week instantiated successfully', 
          assignmentsCreated: insertedAssignments?.length || 0,
          weekStartDate: weekStartString
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          message: 'No weekly templates found', 
          weekStartDate: weekStartString 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('Error in instantiate-week:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})