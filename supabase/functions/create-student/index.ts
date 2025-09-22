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
    console.log('🚀 Starting create-student function')
    
    const requestBody = await req.json()
    const { email, password, full_name, username, batch_id, institute_id, industry, phone_number } = requestBody
    
    console.log('📝 Request data:', { email, full_name, username, batch_id, institute_id, industry, phone_number })

    // Validate required fields
    if (!email || !password || !full_name || !username || !batch_id || !institute_id) {
      throw new Error('Missing required fields: email, password, full_name, username, batch_id, institute_id')
    }

    // Create admin client
    console.log('🔐 Creating admin client')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user making the request
    console.log('👤 Getting current user from auth header')
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError) {
      console.error('❌ User auth error:', userError)
      throw new Error(`Authentication failed: ${userError.message}`)
    }

    if (!currentUser) {
      throw new Error('Unauthorized - no user found')
    }

    console.log('✅ Current user verified:', currentUser.id)

    // Check if user has admin or institute_admin role
    console.log('🔍 Checking user role')
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (roleError) {
      console.error('❌ Role query error:', roleError)
      throw new Error(`Unable to verify user permissions: ${roleError.message}`)
    }

    if (!roleData) {
      throw new Error('No role found for user')
    }

    const userRole = roleData.role
    console.log('👑 User role:', userRole)
    
    if (userRole !== 'admin' && userRole !== 'institute_admin') {
      throw new Error('Insufficient permissions. Only admins and institute admins can create students.')
    }

    // For institute admins, verify they can manage the target institute
    if (userRole === 'institute_admin') {
      console.log('🏫 Verifying institute admin permissions for institute:', institute_id)
      const { data: adminAssignment, error: assignmentError } = await supabaseAdmin
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', currentUser.id)
        .eq('institute_id', institute_id)
        .eq('is_active', true)
        .maybeSingle()

      if (assignmentError) {
        console.error('❌ Institute assignment error:', assignmentError)
        throw new Error(`Failed to verify institute permissions: ${assignmentError.message}`)
      }

      if (!adminAssignment) {
        throw new Error('You are not authorized to manage students in this institute.')
      }

      // Additional validation: Verify batch belongs to the same institute
      console.log('🔍 Verifying batch belongs to institute:', batch_id, 'for institute:', institute_id)
      const { data: batchCheck, error: batchError } = await supabaseAdmin
        .from('batches')
        .select('institute_id')
        .eq('id', batch_id)
        .eq('institute_id', institute_id)
        .eq('is_active', true)
        .maybeSingle()

      if (batchError) {
        console.error('❌ Batch verification error:', batchError)
        throw new Error(`Failed to verify batch permissions: ${batchError.message}`)
      }

      if (!batchCheck) {
        throw new Error('Selected batch does not belong to your institute.')
      }
      
      console.log('✅ Institute admin permissions and batch ownership verified')
    }

    // Check if user already exists first
    console.log('🔍 Checking if user already exists with email:', email)
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error checking existing users:', listError)
      throw new Error(`Failed to check existing users: ${listError.message}`)
    }

    let authData
    const existingUser = existingUsers.users.find(user => user.email === email)
    
    if (existingUser) {
      console.log('👤 User already exists with ID:', existingUser.id)
      authData = { user: existingUser }
    } else {
      // Create user account using admin client (won't affect current session)
      console.log('👥 Creating new user account')
      const { data: newUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name,
          username,
          phone_number: phone_number || '',
          industry: industry || 'IT',
        },
        email_confirm: true, // Auto-confirm email
      })

      if (authError) {
        console.error('❌ User creation error:', authError)
        throw new Error(`Failed to create user account: ${authError.message}`)
      }

      if (!newUserData.user) {
        throw new Error('Failed to create user account - no user data returned')
      }

      console.log('✅ User created successfully:', newUserData.user.id)
      authData = newUserData
    }

    // Check if user already has any active assignments (prevent multiple institute assignments)
    console.log('🔍 Checking for existing user assignments')
    const { data: existingAssignments, error: existingError } = await supabaseAdmin
      .from('user_assignments')
      .select('institute_id, id')
      .eq('user_id', authData.user.id)
      .eq('is_active', true)

    if (existingError) {
      console.error('❌ Error checking existing assignments:', existingError)
      throw new Error(`Failed to check existing assignments: ${existingError.message}`)
    }

    if (existingAssignments && existingAssignments.length > 0) {
      console.log('⚠️ User already has active assignments:', existingAssignments)
      throw new Error(`Student already has an active assignment in another institute. Cannot assign to multiple institutes.`)
    }

    // Create user assignment - ensure single institute assignment
    console.log('📋 Creating user assignment for institute:', institute_id)
    const { error: assignmentError } = await supabaseAdmin
      .from('user_assignments')
      .insert({
        user_id: authData.user.id,
        batch_id,
        institute_id,
        assignment_type: 'batch',
        assigned_by: currentUser.id,
      })

    if (assignmentError) {
      console.error('❌ Assignment creation error:', assignmentError)
      throw new Error(`Failed to create user assignment: ${assignmentError.message}`)
    }

    console.log('✅ User assignment created successfully - student assigned only to institute:', institute_id)

    // Insert or update the profile with email, full_name and username (since we need it for management)
    console.log('👤 Upserting profile for user:', authData.user.id, 'with data:', { full_name, username, email })
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        full_name,
        username,
        email,
        phone_number: phone_number || '',
        industry: industry || 'IT',
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (profileError) {
      console.error('❌ Profile upsert error:', profileError)
      throw new Error(`Failed to upsert profile: ${profileError.message}`)
    }
    
    console.log('✅ Profile upserted successfully:', profileData)

    // Add default user role
    console.log('🎭 Adding default user role')
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'user'
      })

    if (roleInsertError) {
      console.error('⚠️ Role creation error (non-fatal):', roleInsertError)
      // Don't fail the entire operation for this
    } else {
      console.log('✅ User role added successfully')
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