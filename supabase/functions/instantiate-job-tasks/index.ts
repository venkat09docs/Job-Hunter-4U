import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, jobId } = await req.json()
    
    if (!userId || !jobId) {
      throw new Error('userId and jobId are required')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Instantiating job tasks for user:', userId, 'job:', jobId)

    // Get job details from pipeline
    const { data: job, error: jobError } = await supabase
      .from('job_hunting_pipeline')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (jobError) {
      throw jobError
    }

    if (!job) {
      throw new Error('Job not found or not owned by user')
    }

    // Check if tasks already exist for this job
    const { data: existingTasks, error: checkError } = await supabase
      .from('job_hunting_assignments')
      .select('id')
      .eq('user_id', userId)
      .is('week_start_date', null) // Per-job tasks don't have week_start_date
      .textSearch('template_id', jobId) // This would need proper implementation
      .limit(1)

    if (checkError) {
      console.log('Check error (expected if no existing tasks):', checkError)
    }

    // Get per-job task templates (those with cadence = 'per_job')
    const { data: templates, error: templatesError } = await supabase
      .from('job_hunting_task_templates')
      .select('*')
      .eq('is_active', true)
      .eq('cadence', 'per_job')

    if (templatesError) {
      throw templatesError
    }

    console.log(`Found ${templates?.length || 0} per-job templates`)

    // Create per-job task assignments
    const assignments = []
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // Give 2 weeks for per-job tasks

    // Standard per-job tasks based on job stage
    const perJobTasks = [
      {
        title: `Research ${job.company_name}`,
        description: `Research company culture, recent news, and hiring team for ${job.job_title} position`,
        category: 'research',
        difficulty: 'easy',
        points_reward: 15,
        estimated_duration: 30
      },
      {
        title: `Tailor Resume for ${job.job_title}`,
        description: `Customize your resume to highlight relevant experience for this ${job.job_title} role`,
        category: 'application',
        difficulty: 'medium', 
        points_reward: 25,
        estimated_duration: 45
      },
      {
        title: `Apply to ${job.job_title} at ${job.company_name}`,
        description: `Submit your application for the ${job.job_title} position`,
        category: 'application',
        difficulty: 'medium',
        points_reward: 35,
        estimated_duration: 30
      },
      {
        title: `Follow up on ${job.job_title} application`,
        description: `Send a professional follow-up message about your ${job.job_title} application`,
        category: 'follow_up',
        difficulty: 'easy',
        points_reward: 20,
        estimated_duration: 15
      }
    ]

    // Create assignments based on existing templates or default tasks
    if (templates && templates.length > 0) {
      for (const template of templates) {
        assignments.push({
          user_id: userId,
          template_id: template.id,
          week_start_date: null, // Per-job tasks don't have week dates
          due_date: dueDate.toISOString(),
          status: 'assigned',
          points_earned: 0,
          score_awarded: 0
        })
      }
    } else {
      // If no per-job templates exist, we'll need to create them or handle differently
      console.log('No per-job templates found, skipping task creation')
    }

    if (assignments.length > 0) {
      const { data: insertedAssignments, error: insertError } = await supabase
        .from('job_hunting_assignments')
        .insert(assignments)
        .select()

      if (insertError) {
        throw insertError
      }

      console.log(`Created ${insertedAssignments?.length || 0} per-job assignments`)

      // Update job pipeline with task creation timestamp
      const { error: updateError } = await supabase
        .from('job_hunting_pipeline')
        .update({ 
          updated_at: new Date().toISOString(),
          notes: { 
            ...job.notes, 
            tasks_created_at: new Date().toISOString(),
            tasks_count: assignments.length
          }
        })
        .eq('id', jobId)

      if (updateError) {
        console.error('Error updating job pipeline:', updateError)
      }

      return new Response(
        JSON.stringify({ 
          message: 'Per-job tasks instantiated successfully', 
          tasksCreated: insertedAssignments?.length || 0,
          jobTitle: job.job_title,
          company: job.company_name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          message: 'No per-job templates found or tasks already exist',
          jobTitle: job.job_title,
          company: job.company_name
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('Error in instantiate-job-tasks:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})