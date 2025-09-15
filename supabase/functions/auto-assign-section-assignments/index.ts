import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string;
  chapter_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, chapter_id }: RequestBody = await req.json()

    console.log('Processing section assignment check for user:', user_id, 'chapter:', chapter_id)

    // 1. Get the section ID for this chapter
    const { data: chapterData, error: chapterError } = await supabase
      .from('course_chapters')
      .select('section_id')
      .eq('id', chapter_id)
      .single()

    if (chapterError || !chapterData) {
      console.error('Error fetching chapter:', chapterError)
      return new Response(
        JSON.stringify({ error: 'Chapter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const section_id = chapterData.section_id

    // 2. Check if all chapters in this section are completed by the user
    const { data: sectionChapters, error: chaptersError } = await supabase
      .from('course_chapters')
      .select('id')
      .eq('section_id', section_id)
      .eq('is_active', true)

    if (chaptersError) {
      console.error('Error fetching section chapters:', chaptersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch section chapters' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get completed chapters for this user in this section
    const chapterIds = sectionChapters.map(ch => ch.id)
    const { data: completedChapters, error: completionError } = await supabase
      .from('user_chapter_completions')
      .select('chapter_id')
      .eq('user_id', user_id)
      .in('chapter_id', chapterIds)

    if (completionError) {
      console.error('Error fetching completed chapters:', completionError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chapter completions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const completedChapterIds = completedChapters.map(cc => cc.chapter_id)
    const allChaptersCompleted = chapterIds.every(id => completedChapterIds.includes(id))

    console.log('Section completion status:', {
      section_id,
      total_chapters: chapterIds.length,
      completed_chapters: completedChapterIds.length,
      all_completed: allChaptersCompleted
    })

    if (!allChaptersCompleted) {
      return new Response(
        JSON.stringify({ message: 'Section not yet fully completed', section_completed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Section is completed! Find assignments for this section
    const { data: assignments, error: assignmentsError } = await supabase
      .from('clp_assignments')
      .select(`
        id,
        title,
        section_id,
        is_published,
        section:course_sections(
          title,
          course:clp_courses(title)
        )
      `)
      .eq('section_id', section_id)
      .eq('is_published', true)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch assignments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!assignments || assignments.length === 0) {
      console.log('No published assignments found for section:', section_id)
      return new Response(
        JSON.stringify({ message: 'Section completed but no assignments to assign', section_completed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Check which assignments are not already assigned to this user
    const assignmentIds = assignments.map(a => a.id)
    const { data: existingAttempts, error: attemptsError } = await supabase
      .from('clp_attempts')
      .select('assignment_id')
      .eq('user_id', user_id)
      .in('assignment_id', assignmentIds)

    if (attemptsError) {
      console.error('Error checking existing attempts:', attemptsError)
    }

    const existingAssignmentIds = existingAttempts?.map(ea => ea.assignment_id) || []
    const newAssignments = assignments.filter(a => !existingAssignmentIds.includes(a.id))

    if (newAssignments.length === 0) {
      console.log('All assignments already assigned to user')
      return new Response(
        JSON.stringify({ message: 'Section completed, all assignments already assigned', section_completed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Create assignment attempts for new assignments (this effectively assigns them)
    const attemptInserts = newAssignments.map(assignment => ({
      user_id,
      assignment_id: assignment.id,
      status: 'available',
      started_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('clp_attempts')
      .insert(attemptInserts)

    if (insertError) {
      console.error('Error creating assignment attempts:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to assign assignments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Create notifications for the new assignments
    const notificationInserts = newAssignments.map(assignment => ({
      user_id,
      assignment_id: assignment.id,
      type: 'assignment_assigned',
      payload: {
        assignment_title: assignment.title,
        section_title: assignment.section?.title,
        course_title: assignment.section?.course?.title,
        message: `New assignment "${assignment.title}" has been assigned to you after completing the section "${assignment.section?.title}"`
      }
    }))

    const { error: notificationError } = await supabase
      .from('clp_notifications')
      .insert(notificationInserts)

    if (notificationError) {
      console.error('Error creating notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    // 8. Also create general notifications in the main notifications table
    const generalNotifications = newAssignments.map(assignment => ({
      user_id,
      type: 'assignment_assigned',
      title: 'New Assignment Available',
      message: `Assignment "${assignment.title}" has been assigned after completing section "${assignment.section?.title}"`,
      related_id: assignment.id,
      is_read: false
    }))

    const { error: generalNotificationError } = await supabase
      .from('notifications')
      .insert(generalNotifications)

    if (generalNotificationError) {
      console.error('Error creating general notifications:', generalNotificationError)
      // Don't fail the request if notifications fail
    }

    console.log('Successfully assigned assignments:', {
      user_id,
      section_id,
      assigned_count: newAssignments.length,
      assignment_titles: newAssignments.map(a => a.title)
    })

    return new Response(
      JSON.stringify({ 
        message: 'Section completed and assignments assigned successfully',
        section_completed: true,
        assignments_assigned: newAssignments.length,
        assignments: newAssignments.map(a => ({
          id: a.id,
          title: a.title
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in auto-assign-section-assignments:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})