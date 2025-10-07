import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeStatusRequest {
  email?: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, user_id }: ResumeStatusRequest = await req.json();

    if (!email && !user_id) {
      return new Response(
        JSON.stringify({ error: 'Email or user_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get user profile
    let query = supabaseClient.from('profiles').select('*');
    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found', details: profileError?.message }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get portfolio data for resume calculation
    const { data: portfolio } = await supabaseClient
      .from('portfolios')
      .select('*')
      .eq('user_id', profile.user_id)
      .single();

    // Calculate resume completion percentage
    const resumeProgress = calculateResumeProgress(portfolio);

    // Get career task assignments for resume category
    const { data: assignments, error: assignmentsError } = await supabaseClient
      .from('career_task_assignments')
      .select(`
        *,
        career_task_templates!inner(category, module)
      `)
      .eq('user_id', profile.user_id);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
    }

    // Filter resume-related tasks
    const resumeTasks = assignments?.filter(
      a => a.career_task_templates?.module === 'RESUME' || 
           a.career_task_templates?.category === 'resume'
    ) || [];

    const totalTasks = resumeTasks.length;
    const completedTasks = resumeTasks.filter(
      a => a.status === 'completed' || a.status === 'verified'
    ).length;
    const pendingTasks = totalTasks - completedTasks;

    // Get task breakdown by status
    const tasksByStatus = {
      assigned: resumeTasks.filter(a => a.status === 'assigned').length,
      in_progress: resumeTasks.filter(a => a.status === 'in_progress').length,
      submitted: resumeTasks.filter(a => a.status === 'submitted').length,
      completed: resumeTasks.filter(a => a.status === 'completed').length,
      verified: resumeTasks.filter(a => a.status === 'verified').length,
    };

    const responseData = {
      user: {
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
      },
      resume_profile: {
        completion_percentage: resumeProgress,
        status: resumeProgress === 100 ? 'complete' : resumeProgress >= 70 ? 'good' : resumeProgress >= 40 ? 'moderate' : 'needs_improvement',
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        breakdown: tasksByStatus,
      },
      portfolio_sections: portfolio ? {
        has_personal_details: !!(portfolio.personal_details && Object.keys(portfolio.personal_details).length > 0),
        has_experience: !!(portfolio.experience && portfolio.experience.length > 0),
        has_education: !!(portfolio.education && portfolio.education.length > 0),
        has_skills: !!(portfolio.skills && portfolio.skills.length > 0),
        has_summary: !!(portfolio.professional_summary),
      } : null,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in get-resume-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

function calculateResumeProgress(portfolio: any): number {
  if (!portfolio) return 0;

  const sections = [
    {
      name: 'personal_details',
      weight: 20,
      check: () => {
        const details = portfolio.personal_details;
        if (!details || typeof details !== 'object') return 0;
        const fields = ['first_name', 'last_name', 'email', 'phone'];
        const filledFields = fields.filter(f => details[f] && details[f].toString().trim() !== '');
        return (filledFields.length / fields.length) * 100;
      }
    },
    {
      name: 'experience',
      weight: 25,
      check: () => {
        const exp = portfolio.experience;
        if (!Array.isArray(exp) || exp.length === 0) return 0;
        const validExperiences = exp.filter(e => 
          e.company && e.position && (e.description || e.responsibilities)
        );
        return validExperiences.length > 0 ? 100 : 50;
      }
    },
    {
      name: 'education',
      weight: 20,
      check: () => {
        const edu = portfolio.education;
        if (!Array.isArray(edu) || edu.length === 0) return 0;
        const validEducation = edu.filter(e => 
          e.institution && e.degree
        );
        return validEducation.length > 0 ? 100 : 50;
      }
    },
    {
      name: 'skills',
      weight: 15,
      check: () => {
        const skills = portfolio.skills;
        if (!Array.isArray(skills) || skills.length === 0) return 0;
        return skills.length >= 5 ? 100 : (skills.length / 5) * 100;
      }
    },
    {
      name: 'professional_summary',
      weight: 20,
      check: () => {
        const summary = portfolio.professional_summary;
        if (!summary || typeof summary !== 'string') return 0;
        const wordCount = summary.trim().split(/\s+/).length;
        return wordCount >= 50 ? 100 : (wordCount / 50) * 100;
      }
    }
  ];

  let totalProgress = 0;
  sections.forEach(section => {
    const sectionProgress = section.check();
    totalProgress += (sectionProgress * section.weight) / 100;
  });

  return Math.round(totalProgress);
}

serve(handler);
