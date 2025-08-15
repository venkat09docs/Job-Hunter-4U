import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting user activity verification...')

    // Get all users with their profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, full_name, username, email, linkedin_url, bio, profile_image_url')

    if (profilesError) {
      throw profilesError
    }

    console.log(`Found ${profiles?.length || 0} users to verify`)

    // Get activity point settings for our activities
    const { data: activitySettings, error: settingsError } = await supabaseClient
      .from('activity_point_settings')
      .select('*')
      .in('activity_id', [
        'resume_completion_80',
        'linkedin_profile_completion_80', 
        'github_profile_completion_80',
        'cover_letter_saved_resources',
        'resume_saved_resources',
        'readme_saved_resources'
      ])
      .eq('is_active', true)

    if (settingsError) {
      throw settingsError
    }

    const activityMap = new Map()
    activitySettings?.forEach(setting => {
      activityMap.set(setting.activity_id, setting)
    })

    let processedCount = 0
    let pointsAwarded = 0

    // Process each user
    for (const profile of profiles || []) {
      try {
        console.log(`Processing user: ${profile.user_id}`)

        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Check resume progress
        const { data: resumeData } = await supabaseClient
          .from('resume_data')
          .select('*')
          .eq('user_id', profile.user_id)
          .single()

        if (resumeData) {
          const resumeProgress = calculateResumeProgress(resumeData)
          if (resumeProgress >= 80) {
            const awarded = await awardPoints(
              supabaseClient,
              profile.user_id,
              'resume_completion_80',
              activityMap.get('resume_completion_80'),
              today
            )
            if (awarded) pointsAwarded++
          }
        }

        // Check LinkedIn profile progress
        const linkedInProgress = calculateLinkedInProgress(profile)
        if (linkedInProgress >= 80) {
          const awarded = await awardPoints(
            supabaseClient,
            profile.user_id,
            'linkedin_profile_completion_80',
            activityMap.get('linkedin_profile_completion_80'),
            today
          )
          if (awarded) pointsAwarded++
        }

        // Check GitHub profile progress
        const githubProgress = await calculateGitHubProgress(supabaseClient, profile.user_id, profile)
        if (githubProgress >= 80) {
          const awarded = await awardPoints(
            supabaseClient,
            profile.user_id,
            'github_profile_completion_80',
            activityMap.get('github_profile_completion_80'),
            today
          )
          if (awarded) pointsAwarded++
        }

        // Check for saved resources (these would need to be awarded when resources are actually saved)
        // For now, we'll just log that we would check these
        console.log(`Completed processing for user: ${profile.user_id}`)
        processedCount++

      } catch (userError) {
        console.error(`Error processing user ${profile.user_id}:`, userError)
        continue
      }
    }

    console.log(`Verification complete. Processed ${processedCount} users, awarded ${pointsAwarded} point entries`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} users, awarded ${pointsAwarded} point entries`,
        processedCount,
        pointsAwarded
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in verify-user-activities:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to calculate resume progress
function calculateResumeProgress(resumeData: any): number {
  if (!resumeData) return 0

  let completedSections = 0
  const totalSections = 5

  // Check personal details
  if (resumeData.personal_details && Object.keys(resumeData.personal_details).length > 0) {
    completedSections++
  }

  // Check experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    completedSections++
  }

  // Check education
  if (resumeData.education && resumeData.education.length > 0) {
    completedSections++
  }

  // Check skills
  if (resumeData.skills_interests && Object.keys(resumeData.skills_interests).length > 0) {
    completedSections++
  }

  // Check professional summary
  if (resumeData.professional_summary && resumeData.professional_summary.trim().length > 0) {
    completedSections++
  }

  return Math.round((completedSections / totalSections) * 100)
}

// Helper function to calculate LinkedIn progress
function calculateLinkedInProgress(profileData: any): number {
  if (!profileData) return 0

  let completedFields = 0
  const totalFields = 5

  // Check full name
  if (profileData.full_name && profileData.full_name.trim().length > 0) {
    completedFields++
  }

  // Check LinkedIn URL
  if (profileData.linkedin_url && profileData.linkedin_url.trim().length > 0) {
    completedFields++
  }

  // Check bio/summary
  if (profileData.bio && profileData.bio.trim().length > 0) {
    completedFields++
  }

  // Check profile image
  if (profileData.profile_image_url && profileData.profile_image_url.trim().length > 0) {
    completedFields++
  }

  // Check email
  if (profileData.email && profileData.email.trim().length > 0) {
    completedFields++
  }

  return Math.round((completedFields / totalFields) * 100)
}

// Helper function to calculate GitHub progress
async function calculateGitHubProgress(supabaseClient: any, userId: string, profileData: any): Promise<number> {
  let completedFields = 0
  const totalFields = 5

  // Check GitHub URL from profile
  if (profileData.github_url && profileData.github_url.trim().length > 0) {
    completedFields++
  }

  // Check full name
  if (profileData.full_name && profileData.full_name.trim().length > 0) {
    completedFields++
  }

  // Check bio
  if (profileData.bio && profileData.bio.trim().length > 0) {
    completedFields++
  }

  // Check profile image
  if (profileData.profile_image_url && profileData.profile_image_url.trim().length > 0) {
    completedFields++
  }

  // Check if has repositories (check github_progress table)
  const { data: githubProgress } = await supabaseClient
    .from('github_progress')
    .select('completed')
    .eq('user_id', userId)
    .eq('completed', true)
    .limit(1)

  if (githubProgress && githubProgress.length > 0) {
    completedFields++
  }

  return Math.round((completedFields / totalFields) * 100)
}

// Helper function to award points
async function awardPoints(
  supabaseClient: any,
  userId: string,
  activityId: string,
  activitySetting: any,
  today: string
): Promise<boolean> {
  if (!activitySetting) {
    console.log(`No activity setting found for ${activityId}`)
    return false
  }

  // Check if user already received points for this activity today
  const { data: existingPoints } = await supabaseClient
    .from('user_activity_points')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_id', activityId)
    .eq('activity_date', today)
    .maybeSingle()

  if (existingPoints) {
    console.log(`Points already awarded for ${activityId} to user ${userId}`)
    return false
  }

  // Award points to user
  const { error: insertError } = await supabaseClient
    .from('user_activity_points')
    .insert({
      user_id: userId,
      activity_type: activitySetting.activity_type,
      activity_id: activityId,
      points_earned: activitySetting.points,
      activity_date: today
    })

  if (insertError) {
    console.error(`Error awarding points for ${activityId} to user ${userId}:`, insertError)
    return false
  }

  console.log(`Awarded ${activitySetting.points} points for ${activityId} to user ${userId}`)
  return true
}