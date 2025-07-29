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
    const { email, password, full_name, username, batch_id, institute_id } = await req.json()

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

    // Check if user has admin or institute_admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (roleError || !roleData) {
      throw new Error('Unable to verify user permissions')
    }

    const userRole = roleData.role
    if (userRole !== 'admin' && userRole !== 'institute_admin') {
      throw new Error('Insufficient permissions. Only admins and institute admins can create students.')
    }

    // For institute admins, verify they can manage the target institute
    if (userRole === 'institute_admin') {
      const { data: adminAssignment, error: assignmentError } = await supabaseAdmin
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', currentUser.id)
        .eq('institute_id', institute_id)
        .eq('is_active', true)
        .maybeSingle()

      if (assignmentError || !adminAssignment) {
        throw new Error('You are not authorized to manage students in this institute.')
      }
    }

    // Create user account using admin client (won't affect current session)
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

    // Create user assignment
    const { error: assignmentError } = await supabaseAdmin
      .from('user_assignments')
      .insert({
        user_id: authData.user.id,
        batch_id,
        institute_id,
        assignment_type: 'batch',
        assigned_by: currentUser.id,
      })

    if (assignmentError) throw assignmentError

    // Update the profile with email, full_name and username (since we need it for management)
    console.log('Attempting to update profile for user:', authData.user.id, 'with data:', { full_name, username, email })
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        username,
        email,
      })
      .eq('user_id', authData.user.id)
      .select()

    if (profileError) {
      console.error('Profile update error:', profileError)
      throw new Error(`Failed to update profile: ${profileError.message}`)
    }
    
    console.log('Profile updated successfully:', profileData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        message: 'Student account created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
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