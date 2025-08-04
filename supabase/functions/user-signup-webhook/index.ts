import { corsHeaders } from '../_shared/cors.ts'

const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/H6as7qxVFG5F9DoBoLVM/webhook-trigger/5e00d2ca-8b6a-4697-99a6-9932ddc8ca4a'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('User signup webhook triggered')
    
    const { user } = await req.json()
    
    if (!user) {
      console.error('No user data provided')
      return new Response(
        JSON.stringify({ error: 'No user data provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing webhook for user:', user.id)

    // Prepare user details for webhook
    const webhookPayload = {
      user_id: user.id,
      email: user.email,
      full_name: user.raw_user_meta_data?.full_name || user.email,
      username: user.raw_user_meta_data?.username || '',
      created_at: user.created_at,
      email_verified: user.email_confirmed_at ? true : false,
      phone: user.phone || '',
      metadata: user.raw_user_meta_data || {}
    }

    console.log('Sending webhook payload:', webhookPayload)

    // Send webhook to external service
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    })

    console.log('Webhook response status:', webhookResponse.status)

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text()
      console.error('Webhook failed:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook failed', 
          status: webhookResponse.status,
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseData = await webhookResponse.text()
    console.log('Webhook successful:', responseData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully',
        webhook_response: responseData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in user signup webhook:', error)
    
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