import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing missed webhooks triggered')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find users created since Aug 18, 2025 who don't have webhook entries
    const { data: usersWithoutWebhooks, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        email,
        full_name,
        username,
        created_at
      `)
      .gte('created_at', '2025-08-18T00:00:00Z')

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!usersWithoutWebhooks || usersWithoutWebhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users found for webhook processing', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let errorCount = 0

    // Process each user without a webhook entry
    for (const user of usersWithoutWebhooks) {
      try {
        // Check if webhook already exists
        const { data: existingWebhook } = await supabase
          .from('webhook_queue')
          .select('id')
          .eq('user_id', user.user_id)
          .single()

        if (existingWebhook) {
          console.log('Webhook already exists for user:', user.user_id)
          continue
        }

        // Create webhook queue entry
        const { error: insertError } = await supabase
          .from('webhook_queue')
          .insert({
            user_id: user.user_id,
            webhook_url: 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
            user_data: {
              user_id: user.user_id,
              email: user.email,
              full_name: user.full_name || user.email,
              username: user.username || user.email?.split('@')[0],
              industry: 'IT',
              created_at: user.created_at,
              updated_at: new Date().toISOString(),
              email_verified: false,
              phone: null,
              raw_user_meta_data: {
                full_name: user.full_name,
                username: user.username
              },
              provider: 'email',
              providers: ['email'],
              last_sign_in_at: null,
              confirmed_at: null,
              role: 'authenticated',
              signup_source: 'web_application',
              timestamp: new Date().toISOString()
            },
            status: 'pending'
          })

        if (insertError) {
          console.error('Error inserting webhook for user:', user.user_id, insertError)
          errorCount++
        } else {
          processedCount++
          console.log('Successfully queued webhook for user:', user.user_id)
        }

      } catch (error) {
        console.error('Error processing user:', user.user_id, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Missed webhooks processing completed',
        processed: processedCount,
        failed: errorCount,
        total_users_checked: usersWithoutWebhooks.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-missed-webhooks:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})