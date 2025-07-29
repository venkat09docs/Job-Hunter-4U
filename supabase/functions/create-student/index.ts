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
    const { email, password, full_name, batch_id, institute_id } = await req.json()

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

    // Create user account using admin client (won't affect current session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name,
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

    // Update the profile with email (since we need it for management)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
      })
      .eq('user_id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't throw here as the user is already created, just log the error
    }

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