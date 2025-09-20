import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, full_name, username, role = 'user' } = await req.json()

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user making the request
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user: currentUser } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)

    if (roleError) {
      throw new Error('Error checking user permissions')
    }

    const hasAdminRole = roleData?.some(r => r.role === 'admin') || false
    if (!hasAdminRole) {
      throw new Error('Insufficient permissions. Only super admins can create users.')
    }

    // Create user account using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
        username,
      },
      email_confirm: true, // Auto-confirm email
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('Failed to create user account')

    // Wait a bit for the trigger to create the profile, then update it
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update the profile with the provided information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        username,
        email,
      })
      .eq('user_id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Retry once if it fails
      await new Promise(resolve => setTimeout(resolve, 500))
      const { error: retryError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name,
          username,
          email,
        })
        .eq('user_id', authData.user.id)
      
      if (retryError) {
        console.error('Profile retry update error:', retryError)
      }
    }

    // Assign the specified role (default is 'user', which is already assigned by trigger)
    if (role !== 'user') {
      // First delete the default 'user' role
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', authData.user.id)

      // Then insert the new role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: role
        })

      if (roleInsertError) {
        console.error('Role assignment error:', roleInsertError)
        // Don't throw here as the user is already created
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        message: 'User created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Create user error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})