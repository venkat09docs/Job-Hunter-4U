import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🧹 Starting cleanup of ugly usernames...')
    
    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all profiles with ugly username pattern (timestamp + random suffix)
    const uglyPattern = /_\d{13}_[a-z0-9]{6}$/
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, email')
    
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError)
      throw fetchError
    }

    console.log(`📊 Found ${profiles?.length || 0} total profiles`)

    // Filter profiles with ugly usernames
    const uglyProfiles = profiles?.filter(profile => 
      uglyPattern.test(profile.username)
    ) || []

    console.log(`🎯 Found ${uglyProfiles.length} profiles with ugly usernames`)

    if (uglyProfiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No ugly usernames found to clean up',
          cleaned: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let cleanedCount = 0
    const cleanupResults = []

    // Process each ugly profile
    for (const profile of uglyProfiles) {
      try {
        // Extract clean username by removing timestamp and random suffix
        let cleanUsername = profile.username.replace(uglyPattern, '')
        
        // Ensure clean username is not empty
        if (!cleanUsername) {
          cleanUsername = profile.full_name?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') ||
                          profile.email?.split('@')[0] ||
                          'user'
        }

        // Find a unique username
        let finalUsername = cleanUsername
        let counter = 1
        let isUnique = false

        while (!isUnique) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('username', finalUsername)
            .neq('user_id', profile.user_id)
            .maybeSingle()

          if (!existingProfile) {
            isUnique = true
          } else {
            finalUsername = `${cleanUsername}${counter}`
            counter++
          }
        }

        // Update the profile with clean username
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            username: finalUsername,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', profile.user_id)

        if (updateError) {
          console.error(`❌ Error updating profile ${profile.user_id}:`, updateError)
          cleanupResults.push({
            user_id: profile.user_id,
            old_username: profile.username,
            new_username: finalUsername,
            status: 'failed',
            error: updateError.message
          })
        } else {
          console.log(`✅ Cleaned username: ${profile.username} -> ${finalUsername}`)
          cleanedCount++
          cleanupResults.push({
            user_id: profile.user_id,
            old_username: profile.username,
            new_username: finalUsername,
            status: 'success'
          })
        }
      } catch (error) {
        console.error(`❌ Error processing profile ${profile.user_id}:`, error)
        cleanupResults.push({
          user_id: profile.user_id,
          old_username: profile.username,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log(`🎉 Successfully cleaned ${cleanedCount} out of ${uglyProfiles.length} ugly usernames`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully cleaned ${cleanedCount} ugly usernames`,
        cleaned: cleanedCount,
        total_processed: uglyProfiles.length,
        results: cleanupResults
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Cleanup failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Username cleanup failed', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})