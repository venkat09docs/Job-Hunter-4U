import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/H6as7qxVFG5F9DoBoLVM/webhook-trigger/ff787746-939d-4016-96e7-7712f455f521'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('User signup webhook triggered')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this is a queue processing request or direct user data
    const body = await req.json()
    
    let userData;
    let isFromQueue = false;
    
    if (body.user) {
      // Direct call format
      userData = body.user
    } else if (body.user_id) {
      // Notification format or queue processing
      userData = body
      isFromQueue = true
    } else {
      // Try to process pending webhooks from queue
      console.log('No direct user data, checking webhook queue...')
      
      const { data: queueItems, error: queueError } = await supabase
        .from('webhook_queue')
        .select('*')
        .eq('status', 'pending')
        .limit(10)
      
      if (queueError) {
        console.error('Error fetching webhook queue:', queueError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch webhook queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (!queueItems || queueItems.length === 0) {
        console.log('No pending webhooks in queue')
        return new Response(
          JSON.stringify({ message: 'No pending webhooks to process' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Process all pending webhooks
      let processedCount = 0
      let errorCount = 0
      
      for (const queueItem of queueItems) {
        try {
          console.log('Processing queued webhook for user:', queueItem.user_id)
          
          // Mark as processing
          await supabase
            .from('webhook_queue')
            .update({ status: 'processing' })
            .eq('id', queueItem.id)
          
          // Send webhook
          const webhookResponse = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(queueItem.user_data)
          })
          
          if (webhookResponse.ok) {
            // Mark as completed
            await supabase
              .from('webhook_queue')
              .update({ 
                status: 'completed', 
                processed_at: new Date().toISOString() 
              })
              .eq('id', queueItem.id)
            
            processedCount++
            console.log('Successfully processed webhook for user:', queueItem.user_id)
          } else {
            const errorText = await webhookResponse.text()
            console.error('Webhook failed for user:', queueItem.user_id, 'Error:', errorText)
            
            // Mark as failed
            await supabase
              .from('webhook_queue')
              .update({ 
                status: 'failed', 
                error_message: `HTTP ${webhookResponse.status}: ${errorText}`,
                processed_at: new Date().toISOString()
              })
              .eq('id', queueItem.id)
            
            errorCount++
          }
        } catch (error) {
          console.error('Error processing webhook for user:', queueItem.user_id, error)
          
          // Mark as failed
          await supabase
            .from('webhook_queue')
            .update({ 
              status: 'failed', 
              error_message: error.message,
              processed_at: new Date().toISOString()
            })
            .eq('id', queueItem.id)
          
          errorCount++
        }
      }
      
      return new Response(
        JSON.stringify({ 
          message: 'Queue processing completed',
          processed: processedCount,
          failed: errorCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing webhook for user:', userData.user_id || userData.id)

    const userId = userData.user_id || userData.id
    
    // Get user's industry from profile or metadata
    let userIndustry = 'Non-IT' // Default to Non-IT
    
    if (userData.raw_user_meta_data?.industry) {
      userIndustry = userData.raw_user_meta_data.industry
    } else {
      // Check profile table for industry
      const { data: profile } = await supabase
        .from('profiles')
        .select('industry')
        .eq('user_id', userId)
        .single()
      
      if (profile?.industry) {
        userIndustry = profile.industry
      }
    }
    
    console.log(`User ${userId} industry: ${userIndustry}`)

    // Auto-assign to RNS Tech Institute with appropriate batch
    const rnsInstituteId = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80'
    const itBatchId = 'acd2af9d-b906-4dc8-a250-fc5e47736e6a'
    const nonItBatchId = '37bb5110-42d7-43ea-8854-b2bfee404dd8'
    
    const batchId = userIndustry === 'IT' ? itBatchId : nonItBatchId
    const batchName = userIndustry === 'IT' ? 'IT Batch' : 'Non-IT Batch'
    
    console.log(`Auto-assigning user ${userId} to RNS Tech Institute ${batchName}`)
    
    // Check if user is already assigned to any institute
    const { data: existingAssignment } = await supabase
      .from('user_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)

    if (!existingAssignment || existingAssignment.length === 0) {
      // Auto-assign to RNS Tech Institute with appropriate batch
      const { error: assignmentError } = await supabase
        .from('user_assignments')
        .insert({
          user_id: userId,
          institute_id: rnsInstituteId,
          batch_id: batchId,
          assignment_type: 'auto_signup',
          is_active: true
        })

      if (assignmentError) {
        console.error('❌ Failed to auto-assign user to RNS Tech Institute:', assignmentError)
      } else {
        console.log(`✅ User successfully auto-assigned to RNS Tech Institute ${batchName}`)
      }
    } else {
      console.log('👤 User already has institute assignment, skipping auto-assignment')
    }

    // Prepare comprehensive user details for webhook
    const webhookPayload = {
      user_id: userId,
      email: userData.email,
      full_name: userData.full_name || userData.raw_user_meta_data?.full_name || userData.raw_user_meta_data?.['Display Name'] || userData.email?.split('@')[0],
      username: userData.username || userData.raw_user_meta_data?.username || userData.email?.split('@')[0],
      industry: userIndustry,
      created_at: userData.created_at,
      updated_at: userData.updated_at || new Date().toISOString(),
      email_verified: userData.email_confirmed_at ? true : false,
      phone: userData.phone || '',
      app_metadata: userData.app_metadata || {},
      user_metadata: userData.user_metadata || userData.raw_user_meta_data || {},
      raw_user_meta_data: userData.raw_user_meta_data || {},
      provider: userData.app_metadata?.provider || 'email',
      providers: userData.app_metadata?.providers || ['email'],
      last_sign_in_at: userData.last_sign_in_at,
      confirmed_at: userData.confirmed_at || userData.email_confirmed_at,
      role: userData.role || 'authenticated',
      signup_source: 'web_application',
      institute_assignment: {
        institute_id: rnsInstituteId,
        batch_id: batchId,
        batch_type: userIndustry === 'IT' ? 'IT' : 'Non-IT'
      },
      timestamp: new Date().toISOString()
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