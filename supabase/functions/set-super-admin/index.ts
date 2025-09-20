import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SetAdminRequest {
  emails: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Default emails to set as admin
    const defaultEmails = ['test@gmail.com', 'venkat09docs@gmail.com']
    
    let emailsToProcess = defaultEmails
    
    // If request has a body, try to parse it for custom emails
    if (req.method === 'POST') {
      try {
        const body = await req.json() as SetAdminRequest
        if (body.emails && Array.isArray(body.emails)) {
          emailsToProcess = body.emails
        }
      } catch {
        // If parsing fails, use default emails
        console.log('Using default emails due to parsing error')
      }
    }

    const results = []

    for (const email of emailsToProcess) {
      try {
        // Get user by email
        const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
        
        if (authError) {
          throw authError
        }

        const user = authUsers.users.find(u => u.email === email)
        
        if (!user) {
          results.push({
            email,
            success: false,
            message: 'User not found'
          })
          continue
        }

        // Insert admin role for this user
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .upsert([
            {
              user_id: user.id,
              role: 'admin'
            }
          ], {
            onConflict: 'user_id,role'
          })

        if (roleError) {
          results.push({
            email,
            success: false,
            message: `Failed to set admin role: ${roleError.message}`
          })
        } else {
          results.push({
            email,
            success: true,
            message: 'Successfully set as admin'
          })
        }

      } catch (error) {
        results.push({
          email,
          success: false,
          message: `Error: ${error.message}`
        })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in set-super-admin function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})