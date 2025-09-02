import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for RLS operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the requesting user has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete all user-related data in order (using admin client to bypass RLS)
    console.log(`Starting deletion process for user: ${user_id}`)

    // Delete from all tables that reference user_id
    const tablesToDelete = [
      'affiliate_users',
      'ai_chat_logs', 
      'ats_score_history',
      'audit_log',
      'blogs',
      'career_task_assignments',
      'career_weekly_schedules', 
      'daily_job_hunting_sessions',
      'daily_progress_snapshots',
      'github_daily_flow_sessions',
      'github_progress',
      'github_repos',
      'github_scores', 
      'github_signals',
      'github_snapshots',
      'github_task_reenable_requests',
      'github_user_badges',
      'github_user_tasks',
      'job_application_activities',
      'job_hunting_assignments',
      'job_hunting_pipeline', 
      'job_hunting_streaks',
      'job_hunting_weekly_schedules',
      'job_results',
      'job_searches',
      'job_tracker',
      'leaderboard_rankings',
      'learning_goals',
      'linkedin_automations',
      'linkedin_network_completions',
      'linkedin_network_metrics',
      'linkedin_progress',
      'linkedin_scores',
      'linkedin_signals', 
      'linkedin_task_renable_requests',
      'linkedin_user_badges',
      'linkedin_user_tasks',
      'notification_analytics',
      'notification_preferences',
      'notifications',
      'payment_audit_log',
      'payment_records',
      'payments',
      'portfolios',
      'profile_user_badges',
      'public_profiles',
      'resume_checks',
      'resume_data',
      'role_audit_log',
      'saved_cover_letters',
      'saved_job_searches',
      'saved_readme_files', 
      'saved_resumes',
      'security_audit_log',
      'signals',
      'tool_chats',
      'tool_usage', 
      'user_activity_points',
      'user_analytics',
      'user_badges',
      'user_inputs',
      'user_notification_settings',
      'webhook_queue',
      'user_assignments',
      'institute_admin_assignments',
      'user_roles',
      'profiles'
    ]

    // Delete from each table
    for (const table of tablesToDelete) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', user_id)
        console.log(`Deleted from ${table}`)
      } catch (error) {
        console.log(`Error deleting from ${table}:`, error)
        // Continue with other tables even if one fails
      }
    }

    // 16. Finally, delete from auth.users using admin API
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    
    if (authDeleteError) {
      console.error('Error deleting from auth.users:', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from authentication system' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Successfully deleted user: ${user_id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'User successfully deleted' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})