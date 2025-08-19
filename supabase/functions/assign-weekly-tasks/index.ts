import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskAssignmentRequest {
  userId?: string;
  weekStartDate?: string;
  forceRegenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, weekStartDate, forceRegenerate }: TaskAssignmentRequest = await req.json();

    // Get current Monday if no date provided
    const currentDate = weekStartDate ? new Date(weekStartDate) : new Date();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    const mondayStr = monday.toISOString().split('T')[0];

    // If userId is provided, assign tasks for that user only
    // Otherwise, assign tasks for all users
    const usersToProcess = userId ? [{ id: userId }] : 
      (await supabase.from('profiles').select('user_id').eq('subscription_active', true)).data?.map(p => ({ id: p.user_id })) || [];

    console.log(`Processing ${usersToProcess.length} users for week starting ${mondayStr}`);

    let totalAssigned = 0;
    const results = [];

    for (const user of usersToProcess) {
      try {
        // Check if schedule already exists for this user and week
        const { data: existingSchedule } = await supabase
          .from('career_weekly_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start_date', mondayStr)
          .single();

        if (existingSchedule && !forceRegenerate) {
          console.log(`Schedule already exists for user ${user.id} for week ${mondayStr}`);
          continue;
        }

        // Get user's profile to determine skill level and preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('industry, subscription_plan')
          .eq('user_id', user.id)
          .single();

        // Get available task templates
        const { data: templates } = await supabase
          .from('career_task_templates')
          .select('*')
          .eq('is_active', true);

        if (!templates || templates.length === 0) {
          console.log('No active task templates found');
          continue;
        }

        // Smart task selection algorithm
        const selectedTasks = selectTasksForUser(templates, profile);
        
        // Calculate due date (Sunday of the same week)
        const dueDate = new Date(monday);
        dueDate.setDate(dueDate.getDate() + 6);
        dueDate.setHours(23, 59, 59, 999);

        let assignedCount = 0;
        let totalPossiblePoints = 0;

        // Create task assignments
        for (const template of selectedTasks) {
          const { error } = await supabase
            .from('career_task_assignments')
            .upsert({
              user_id: user.id,
              template_id: template.id,
              week_start_date: mondayStr,
              due_date: dueDate.toISOString(),
              status: 'assigned'
            }, {
              onConflict: 'user_id,template_id,week_start_date'
            });

          if (!error) {
            assignedCount++;
            totalPossiblePoints += template.points_reward;
          } else {
            console.error(`Error assigning task ${template.id} to user ${user.id}:`, error);
          }
        }

        // Create or update weekly schedule
        await supabase
          .from('career_weekly_schedules')
          .upsert({
            user_id: user.id,
            week_start_date: mondayStr,
            total_tasks_assigned: assignedCount,
            tasks_completed: 0,
            total_points_possible: totalPossiblePoints,
            points_earned: 0,
            schedule_generated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,week_start_date'
          });

        totalAssigned += assignedCount;
        results.push({
          userId: user.id,
          tasksAssigned: assignedCount,
          pointsPossible: totalPossiblePoints
        });

        console.log(`Assigned ${assignedCount} tasks to user ${user.id} for week ${mondayStr}`);

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({
          userId: user.id,
          error: userError.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      weekStartDate: mondayStr,
      usersProcessed: usersToProcess.length,
      totalTasksAssigned: totalAssigned,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assign-weekly-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Smart task selection based on user profile and preferences
function selectTasksForUser(templates: any[], profile: any) {
  const selectedTasks = [];
  
  // Always include 1-2 LinkedIn growth tasks (core requirement)
  const linkedinTasks = templates.filter(t => t.category === 'linkedin_growth');
  if (linkedinTasks.length > 0) {
    selectedTasks.push(linkedinTasks[0]); // Always assign at least one LinkedIn task
    if (linkedinTasks.length > 1 && Math.random() > 0.5) {
      selectedTasks.push(linkedinTasks[1]); // 50% chance for second LinkedIn task
    }
  }

  // Add 1 practice task based on subscription level
  const practiceTasks = templates.filter(t => 
    t.category === 'supabase_practice' || t.category === 'n8n_practice'
  );

  if (practiceTasks.length > 0) {
    // Premium users get more advanced tasks
    const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'pro';
    const availablePractice = isPremium 
      ? practiceTasks 
      : practiceTasks.filter(t => t.difficulty !== 'advanced');
    
    if (availablePractice.length > 0) {
      const randomPractice = availablePractice[Math.floor(Math.random() * availablePractice.length)];
      selectedTasks.push(randomPractice);
    }
  }

  // Limit total tasks to 3-4 per week to avoid overwhelming users
  return selectedTasks.slice(0, 4);
}
