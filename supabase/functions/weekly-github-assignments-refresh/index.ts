import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      github_user_tasks: {
        Row: {
          id: string
          user_id: string
          task_id: string
          period: string | null
          repo_id: string | null
          due_at: string | null
          status: string
          score_awarded: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          period?: string | null
          repo_id?: string | null
          due_at?: string | null
          status?: string
          score_awarded?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          period?: string | null
          repo_id?: string | null
          due_at?: string | null
          status?: string
          score_awarded?: number
          created_at?: string
          updated_at?: string
        }
      }
      github_tasks: {
        Row: {
          id: string
          code: string
          scope: string
          title: string
          description: string | null
          display_order: number | null
          cadence: string | null
          active: boolean | null
          points_base: number
          evidence_types: string[]
          bonus_rules: any
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting weekly GitHub assignments refresh...')

    // Get current date and calculate the new week period using consistent ISO week calculation
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentWeek = getWeekNumber(now)
    const newPeriod = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`

    console.log(`Creating assignments for period: ${newPeriod}`)

    // First, delete any existing assignments for the current period to ensure fresh start
    const { error: deleteError } = await supabaseClient
      .from('github_user_tasks')
      .delete()
      .eq('period', newPeriod)

    if (deleteError) {
      console.error('Error deleting existing assignments:', deleteError)
      // Don't throw error, continue with creation
    } else {
      console.log(`Deleted existing assignments for period: ${newPeriod}`)
    }

    // Get all active GitHub tasks
    const { data: activeTasks, error: tasksError } = await supabaseClient
      .from('github_tasks')
      .select('*')
      .eq('active', true)
      .eq('cadence', 'weekly')
      .order('display_order')

    if (tasksError) {
      console.error('Error fetching GitHub tasks:', tasksError)
      throw tasksError
    }

    console.log(`Found ${activeTasks?.length || 0} active weekly tasks`)

    // Get all active users (users who have profiles)
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`Found ${users?.length || 0} users to assign tasks to`)

    if (!activeTasks || !users || activeTasks.length === 0 || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No tasks or users to process',
          tasksCount: activeTasks?.length || 0,
          usersCount: users?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate week start (Monday)
    const weekStart = getMonday(now)

    // Create new assignments for all users and tasks with individual due dates
    const assignments = []
    for (const user of users) {
      for (const task of activeTasks) {
        const dayAssignment = task.display_order || 1 // Default to day 1 (Monday) if no display_order
        
        // Calculate individual due date based on day assignment
        let dueDate = new Date(weekStart)
        
        if (dayAssignment === 7) {
          // Day 7 (Sunday tasks) are due on Sunday evening (same day)
          dueDate.setDate(weekStart.getDate() + 6) // Sunday
          dueDate.setHours(23, 59, 59, 999)
        } else {
          // Other tasks are due the next day evening
          // Day 1 (Monday) → Due Tuesday evening
          // Day 2 (Tuesday) → Due Wednesday evening
          // etc.
          dueDate.setDate(weekStart.getDate() + dayAssignment) // Next day after assignment
          dueDate.setHours(23, 59, 59, 999)
        }
        
         assignments.push({
           user_id: user.user_id,
           task_id: task.id,
           period: newPeriod,
           due_at: dueDate.toISOString(),
           status: 'NOT_STARTED',
           score_awarded: 0
         })
         
         // Log the assignment for debugging
         console.log(`Task ${task.code} (Day ${dayAssignment}) assigned to user, due: ${dueDate.toISOString()}`)
      }
    }

    console.log(`Creating ${assignments.length} new assignments`)

    if (assignments.length > 0) {
      // Insert new assignments in batches
      const batchSize = 100
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize)
        const { error: insertError } = await supabaseClient
          .from('github_user_tasks')
          .insert(batch)

        if (insertError) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError)
          throw insertError
        }
      }
    }

    const result = {
      success: true,
      message: 'Weekly GitHub assignments refreshed successfully',
      period: newPeriod,
      tasksCreated: assignments.length,
      usersProcessed: users.length,
      activeTasks: activeTasks.length
    }

    console.log('Refresh completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in weekly refresh:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Helper function to get Monday of current week
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
  return new Date(d.setDate(diff))
}