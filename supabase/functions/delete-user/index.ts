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

    // 1. Delete from ai_chat_logs
    await supabaseAdmin
      .from('ai_chat_logs')
      .delete()
      .eq('user_id', user_id)

    // 2. Delete from tool_chats
    await supabaseAdmin
      .from('tool_chats')
      .delete()
      .eq('user_id', user_id)

    // 3. Delete from tool_usage
    await supabaseAdmin
      .from('tool_usage')
      .delete()
      .eq('user_id', user_id)

    // 4. Delete from user_analytics
    await supabaseAdmin
      .from('user_analytics')
      .delete()
      .eq('user_id', user_id)

    // 5. Delete from job_searches
    await supabaseAdmin
      .from('job_searches')
      .delete()
      .eq('user_id', user_id)

    // 6. Delete from job_tracker
    await supabaseAdmin
      .from('job_tracker')
      .delete()
      .eq('user_id', user_id)

    // 7. Delete from linkedin_automations
    await supabaseAdmin
      .from('linkedin_automations')
      .delete()
      .eq('user_id', user_id)

    // 8. Delete from portfolios
    await supabaseAdmin
      .from('portfolios')
      .delete()
      .eq('user_id', user_id)

    // 9. Delete from public_profiles
    await supabaseAdmin
      .from('public_profiles')
      .delete()
      .eq('user_id', user_id)

    // 10. Delete from blogs
    await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('user_id', user_id)

    // 11. Delete from payments
    await supabaseAdmin
      .from('payments')
      .delete()
      .eq('user_id', user_id)

    // 12. Delete from user_assignments
    await supabaseAdmin
      .from('user_assignments')
      .delete()
      .eq('user_id', user_id)

    // 13. Delete from institute_admin_assignments
    await supabaseAdmin
      .from('institute_admin_assignments')
      .delete()
      .eq('user_id', user_id)

    // 14. Delete from user_roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id)

    // 15. Delete from profiles
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user_id)

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