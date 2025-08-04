import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/H6as7qxVFG5F9DoBoLVM/webhook-trigger/5e771259-d862-4f3f-b642-6aaf1790dc6d'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Test webhook function triggered')
    
    // Test payload data
    const testPayload = {
      user_id: '2e3b68a3-76b7-4893-be29-b398fb4314f0',
      email: 'test10@gmail.com',
      full_name: 'test10',
      username: 'test10',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: true,
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'test10', username: 'test10' },
      raw_user_meta_data: { full_name: 'test10', username: 'test10' },
      provider: 'email',
      providers: ['email'],
      last_sign_in_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      role: 'authenticated',
      signup_source: 'test_function',
      timestamp: new Date().toISOString(),
      test: true
    }

    console.log('Sending test webhook payload:', testPayload)

    // Test webhook endpoint
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      body: JSON.stringify(testPayload)
    })

    console.log('Webhook response status:', webhookResponse.status)
    console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()))

    const responseText = await webhookResponse.text()
    console.log('Webhook response body:', responseText)

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Webhook test failed', 
          status: webhookResponse.status,
          response: responseText,
          url: WEBHOOK_URL
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test webhook sent successfully',
        webhook_response: responseText,
        webhook_status: webhookResponse.status,
        url: WEBHOOK_URL
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in test webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        url: WEBHOOK_URL
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})