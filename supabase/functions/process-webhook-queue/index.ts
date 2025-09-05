import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing webhook queue...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch pending webhooks from queue
    const { data: pendingWebhooks, error: queueError } = await supabase
      .from('webhook_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50) // Process up to 50 at a time

    if (queueError) {
      console.error('Error fetching webhook queue:', queueError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook queue' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!pendingWebhooks || pendingWebhooks.length === 0) {
      console.log('No pending webhooks in queue')
      return new Response(
        JSON.stringify({ message: 'No pending webhooks to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${pendingWebhooks.length} pending webhooks to process`)

    let processedCount = 0
    let errorCount = 0

    // Process each webhook
    for (const webhook of pendingWebhooks) {
      try {
        console.log(`Processing webhook for user: ${webhook.user_id}`)
        
        // Mark as processing
        await supabase
          .from('webhook_queue')
          .update({ status: 'processing' })
          .eq('id', webhook.id)

        // Call the user-signup-webhook function directly
        const webhookResponse = await supabase.functions.invoke('user-signup-webhook', {
          body: {
            user: webhook.user_data,
            user_id: webhook.user_id,
            from_queue: true
          }
        })

        if (webhookResponse.error) {
          console.error(`Webhook failed for user ${webhook.user_id}:`, webhookResponse.error)
          
          // Mark as failed
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'failed', 
              error_message: webhookResponse.error.message || 'Unknown error',
              processed_at: new Date().toISOString()
            })
            .eq('id', webhook.id)
          
          errorCount++
        } else {
          console.log(`Successfully processed webhook for user: ${webhook.user_id}`)
          
          // Mark as completed
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'completed', 
              processed_at: new Date().toISOString() 
            })
            .eq('id', webhook.id)
          
          processedCount++
        }

      } catch (error) {
        console.error(`Error processing webhook for user ${webhook.user_id}:`, error)
        
        // Mark as failed
        await supabase
          .from('webhook_queue')
          .update({ 
            status: 'failed', 
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', webhook.id)
        
        errorCount++
      }
    }

    const result = {
      message: 'Webhook queue processing completed',
      total_processed: processedCount + errorCount,
      successful: processedCount,
      failed: errorCount
    }

    console.log('Processing summary:', result)

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in webhook queue processor:', error)
    
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