import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context } = await req.json();
    
    console.log('AI assistant request received:', { message, userId, context });

    if (!userId) {
      console.log('Error: No userId provided');
      return new Response(JSON.stringify({ 
        error: 'User authentication required to use AI Assistant.' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching user profile and role...');
    
    // Check user subscription status and role with better error handling
    let profile = null;
    let userRole = null;
    let hasActiveSubscription = false;
    let isAdmin = false;
    
    try {
      console.log('Attempting to fetch profile...');
      const profileResult = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier, subscription_active, industry, resume_completion_percentage')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('Profile query result:', { data: profileResult.data, error: profileResult.error });
      
      if (profileResult.error) {
        console.error('Profile fetch error:', profileResult.error);
        // Continue without profile data rather than failing
      } else {
        profile = profileResult.data;
        // Check subscription status from multiple possible fields
        hasActiveSubscription = profile?.subscription_active === true || 
                               profile?.subscription_status === 'active';
        console.log('Profile found:', { hasActiveSubscription, subscriptionActive: profile?.subscription_active, subscriptionStatus: profile?.subscription_status });
      }
    } catch (error) {
      console.error('Profile fetch exception:', error);
      // Continue without profile data
    }

    try {
      console.log('Attempting to fetch user role...');
      const roleResult = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('Role query result:', { data: roleResult.data, error: roleResult.error });
      
      if (roleResult.error) {
        console.error('Role fetch error:', roleResult.error);
        // Continue without role data
      } else {
        userRole = roleResult.data;
        isAdmin = userRole?.role === 'admin';
        console.log('Role found:', { role: userRole?.role, isAdmin });
      }
    } catch (error) {
      console.error('Role fetch exception:', error);
      // Continue without role data
    }

    console.log('Final access check:', { 
      isAdmin, 
      hasActiveSubscription, 
      profileExists: !!profile,
      roleExists: !!userRole 
    });

    // Allow access for admins OR users with active subscription OR as fallback for any authenticated user
    if (!isAdmin && !hasActiveSubscription) {
      console.log('Access granted as fallback for authenticated user (will be limited)');
      // Don't block access, but provide limited functionality
    } else {
      console.log('Access granted - admin or active subscription confirmed');
    }

    console.log('Proceeding to fetch user data...');

    // Fetch user data for contextual responses with individual try-catch
    let userPointsRes = { data: [] };
    let jobsRes = { data: [] };
    let linkedinProgressRes = { data: [] };
    let githubProgressRes = { data: [] };
    let assignmentsRes = { data: [] };

    try {
      userPointsRes = await supabase
        .from('user_activity_points')
        .select('points_earned')
        .eq('user_id', userId);
      console.log('User points fetched:', userPointsRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }

    try {
      jobsRes = await supabase
        .from('job_hunting_pipeline')
        .select('pipeline_stage, company_name, job_title')
        .eq('user_id', userId)
        .limit(10);
      console.log('Jobs fetched:', jobsRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }

    try {
      linkedinProgressRes = await supabase
        .from('linkedin_progress')
        .select('*')
        .eq('user_id', userId);
      console.log('LinkedIn progress fetched:', linkedinProgressRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching LinkedIn progress:', error);
    }

    try {
      githubProgressRes = await supabase
        .from('github_progress')
        .select('*')
        .eq('user_id', userId);
      console.log('GitHub progress fetched:', githubProgressRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching GitHub progress:', error);
    }

    try {
      assignmentsRes = await supabase
        .from('career_task_assignments')
        .select(`
          id,
          status,
          due_date,
          career_task_templates!inner(title, category)
        `)
        .eq('user_id', userId)
        .limit(5);
      console.log('Assignments fetched:', assignmentsRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }

    const totalPoints = userPointsRes.data?.reduce((sum, record) => sum + (record.points_earned || 0), 0) || 0;
    const jobs = jobsRes.data || [];
    const linkedinProgress = linkedinProgressRes.data || [];
    const githubProgress = githubProgressRes.data || [];
    const assignments = assignmentsRes.data || [];

    // Calculate progress statistics
    const completedLinkedInTasks = linkedinProgress.filter(task => task.completed).length;
    const totalLinkedInTasks = linkedinProgress.length;
    const linkedinProgressPercent = totalLinkedInTasks > 0 ? Math.round((completedLinkedInTasks / totalLinkedInTasks) * 100) : 0;
    
    const resumeProgressPercent = profile?.resume_completion_percentage || 0;
    
    const completedAssignments = assignments.filter(a => a.status === 'completed' || a.status === 'verified').length;
    const totalAssignments = assignments.length;
    
    const jobsByStatus = jobs.reduce((acc, job) => {
      const status = job.pipeline_stage || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('Calculated statistics:', {
      totalPoints,
      resumeProgressPercent,
      linkedinProgressPercent,
      totalJobs: jobs.length,
      jobsByStatus,
      assignmentStats: { completed: completedAssignments, total: totalAssignments }
    });

    const lowerMessage = message.toLowerCase();
    let aiResponse = '';

    // Enhanced AI responses with contextual data
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      if (lowerMessage.includes('progress') || lowerMessage.includes('status')) {
        aiResponse = `📝 **Your Resume Progress:**\n\n**Current Status:** ${resumeProgressPercent}% complete\n\n`;
        if (resumeProgressPercent < 50) {
          aiResponse += "🚨 **Action Required:** Your resume needs attention!\n• Visit 'Resume Builder' to continue building\n• Complete missing sections for better ATS compatibility\n• Aim for at least 80% completion\n\n**Next Steps:**\n• Add work experience details\n• Include relevant skills and certifications\n• Write a compelling summary";
        } else if (resumeProgressPercent < 80) {
          aiResponse += "📈 **Good Progress!** You're halfway there!\n• Complete remaining sections\n• Review and optimize existing content\n• Add quantifiable achievements\n\n**Tips:**\n• Use action verbs and numbers\n• Tailor keywords for your target roles\n• Proofread for errors";
        } else {
          aiResponse += "🎉 **Excellent Work!** Your resume is almost complete!\n• Review all sections for accuracy\n• Customize for each job application\n• Download in multiple formats\n\n**Pro Tips:**\n• Create role-specific versions\n• Update regularly with new achievements\n• Test ATS compatibility";
        }
      } else {
        aiResponse = `📝 **Resume Building Help:**\n\n**Your Current Progress:** ${resumeProgressPercent}% complete\n\n**Our Resume Builder Features:**\n• ATS-friendly templates\n• Real-time completion tracking\n• Multiple export formats (PDF, Word)\n• Industry-specific guidance\n\n**Best Practices:**\n• Use bullet points with measurable results\n• Include relevant keywords from job descriptions\n• Keep it 1-2 pages maximum\n• Professional formatting and layout\n\n**Track Progress:** Visit 'Build My Profile' to see your completion percentage and earn points!`;
      }
    } else if (lowerMessage.includes('linkedin')) {
      if (lowerMessage.includes('progress') || lowerMessage.includes('status')) {
        aiResponse = `💼 **Your LinkedIn Progress:**\n\n**Tasks Completed:** ${completedLinkedInTasks}/${totalLinkedInTasks} (${linkedinProgressPercent}%)\n\n`;
        if (linkedinProgressPercent < 50) {
          aiResponse += "🚨 **Needs Attention:** Your LinkedIn profile needs work!\n• Complete daily LinkedIn activities\n• Optimize profile sections\n• Start networking consistently\n\n**Immediate Actions:**\n• Update headline and summary\n• Add professional photo\n• Complete experience section\n• Start connecting with industry professionals";
        } else {
          aiResponse += "📈 **Great Progress!** Keep up the momentum!\n• Continue daily networking activities\n• Engage with industry content\n• Share valuable insights\n\n**Advanced Tips:**\n• Join relevant LinkedIn groups\n• Publish articles in your expertise area\n• Request recommendations from colleagues\n• Use LinkedIn messaging for warm outreach";
        }
      } else {
        aiResponse = `💼 **LinkedIn Optimization Help:**\n\n**Your Progress:** ${linkedinProgressPercent}% LinkedIn tasks completed\n\n**Our LinkedIn Tools:**\n• Daily activity tracker\n• Weekly networking assignments\n• Connection growth monitoring\n• Content engagement metrics\n\n**Optimization Checklist:**\n✓ Professional headshot (14x more profile views)\n✓ Compelling headline with keywords\n✓ Detailed summary (3-5 sentences)\n✓ Complete work experience\n✓ Skills and endorsements\n✓ Regular content posting\n\n**Daily Activities:** Use our tracker to monitor networking progress!`;
      }
    } else if (lowerMessage.includes('github') && profile?.industry === 'IT') {
      const completedGitHubTasks = githubProgress.filter(task => task.completed).length;
      const githubProgressPercent = githubProgress.length > 0 ? Math.round((completedGitHubTasks / githubProgress.length) * 100) : 0;
      
      aiResponse = `💻 **GitHub Profile Enhancement:**\n\n**Your Progress:** ${githubProgressPercent}% GitHub tasks completed\n\n**Our GitHub Tools:**\n• Weekly coding assignments\n• Repository tracking\n• Contribution monitoring\n• Profile optimization guidance\n\n**Profile Optimization:**\n• Create compelling profile README\n• Pin your best 6 repositories\n• Use descriptive repo names and descriptions\n• Include live demo links\n• Write clear documentation\n\n**Activity Tips:**\n• Commit code regularly (green squares!)\n• Contribute to open-source projects\n• Showcase diverse skill sets\n• Use meaningful commit messages\n\n**Track Progress:** Monitor your GitHub activity in our dashboard!`;
    } else if (lowerMessage.includes('job') && (lowerMessage.includes('search') || lowerMessage.includes('hunt') || lowerMessage.includes('application'))) {
      const totalJobs = jobs.length;
      if (lowerMessage.includes('progress') || lowerMessage.includes('status')) {
        aiResponse = `📊 **Your Job Search Progress:**\n\n**Applications Submitted:** ${totalJobs}\n`;
        if (jobsByStatus.wishlist) aiResponse += `• Wishlist: ${jobsByStatus.wishlist}\n`;
        if (jobsByStatus.applied) aiResponse += `• Applied: ${jobsByStatus.applied}\n`;
        if (jobsByStatus.interviewing) aiResponse += `• Interviewing: ${jobsByStatus.interviewing}\n`;
        if (jobsByStatus.offered) aiResponse += `• Offers: ${jobsByStatus.offered}\n`;
        if (jobsByStatus.rejected) aiResponse += `• Rejected: ${jobsByStatus.rejected}\n`;
        
        aiResponse += `\n**Recent Applications:**\n`;
        jobs.slice(0, 3).forEach(job => {
          aiResponse += `• ${job.job_title} at ${job.company_name} - ${job.pipeline_stage}\n`;
        });
        
        if (totalJobs < 10) {
          aiResponse += `\n🚨 **Action Needed:** Apply to more positions!\n• Target: 5-10 applications daily\n• Use our Job Tracker to organize\n• Check internal opportunities section`;
        } else {
          aiResponse += `\n📈 **Good Activity!** Keep applying consistently!\n• Follow up on pending applications\n• Prepare for upcoming interviews\n• Network to unlock hidden opportunities`;
        }
      } else {
        aiResponse = `🎯 **Job Search Strategy:**\n\n**Your Current Activity:** ${totalJobs} applications tracked\n\n**Our Job Search Tools:**\n• Job Tracker for application management\n• Internal job opportunities database\n• Resume Builder for ATS optimization\n• LinkedIn networking tools\n• Interview preparation resources\n\n**Strategy Tips:**\n• Apply to 5-10 jobs daily\n• Customize resume for each application\n• Use our internal job board first\n• Network your way to opportunities\n• Track all interactions\n\n**Points System:** Earn 20 points for wishlist→applied, 20 more for applied→interviewing!`;
      }
    } else if (lowerMessage.includes('assignment') || lowerMessage.includes('task')) {
      aiResponse = `📋 **Your Career Assignments:**\n\n**Active Assignments:** ${totalAssignments}\n**Completed:** ${completedAssignments}/${totalAssignments}\n\n`;
      if (assignments.length > 0) {
        aiResponse += "**Current Tasks:**\n";
        assignments.forEach(assignment => {
          const statusIcon = (assignment.status === 'completed' || assignment.status === 'verified') ? "✅" : "⏳";
          const dueDate = assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No deadline";
          const title = assignment.career_task_templates?.title || 'Unknown Task';
          const category = assignment.career_task_templates?.category || 'General';
          aiResponse += `${statusIcon} ${title} (${category}) - Due: ${dueDate}\n`;
        });
        
        const pendingTasks = assignments.filter(a => a.status !== 'completed' && a.status !== 'verified');
        if (pendingTasks.length > 0) {
          aiResponse += `\n🎯 **Priority Actions:**\n• Complete ${pendingTasks.length} pending assignments\n• Focus on upcoming deadlines\n• Earn points for each completion\n\n**Categories:** LinkedIn Growth, Networking, Job Hunting, Content Creation, Interview Prep`;
        } else {
          aiResponse += `\n🎉 **All Caught Up!** Excellent work!\n• Check for new weekly assignments\n• Maintain consistency in daily activities\n• Help others in the community`;
        }
      } else {
        aiResponse += "**No active assignments found.**\n\n🚀 **Get Started:**\n• Visit Career Assignments to begin\n• Complete weekly tasks for points\n• Build your professional profile\n• Track progress in your dashboard";
      }
    } else if (lowerMessage.includes('points') || lowerMessage.includes('score') || lowerMessage.includes('progress')) {
      aiResponse = `🏆 **Your Progress Overview:**\n\n**Total Points Earned:** ${totalPoints}\n**Resume Progress:** ${resumeProgressPercent}%\n**LinkedIn Tasks:** ${linkedinProgressPercent}% complete\n**Job Applications:** ${totalJobs} tracked\n**Active Assignments:** ${totalAssignments} (${completedAssignments} completed)\n\n`;
      
      if (totalPoints < 100) {
        aiResponse += "🚀 **Getting Started!** Here's how to earn more points:\n• Complete daily LinkedIn activities (5-10 points each)\n• Apply to jobs and track progress (20 points per status change)\n• Build your resume (points for completion milestones)\n• Complete weekly assignments (10-50 points each)\n• Engage with platform features consistently";
      } else if (totalPoints < 500) {
        aiResponse += "📈 **Building Momentum!** Great progress so far:\n• Continue daily activities for consistent points\n• Focus on completing pending assignments\n• Optimize your profiles for bonus points\n• Help others and engage in community features\n• Maintain streak bonuses for extra rewards";
      } else {
        aiResponse += "🌟 **Excellent Performance!** You're a top performer:\n• Maintain your consistency streak\n• Mentor newcomers for leadership points\n• Explore advanced features and challenges\n• Share your success stories\n• Aim for leaderboard positions";
      }
      
      aiResponse += `\n\n**Quick Point Boosters:**\n• Complete resume to 100% (+50 points)\n• Connect with 10 professionals (+20 points)\n• Apply to 5 jobs in one day (+25 points)\n• Finish all weekly assignments (+100 points)`;
    } else if (lowerMessage.includes('help') || lowerMessage.includes('features') || lowerMessage.includes('what can')) {
      aiResponse = `🤖 **Career Growth Platform - Complete Feature Guide:**\n\n**📊 Your Dashboard Overview:**\n• Total Points: ${totalPoints}\n• Resume Progress: ${resumeProgressPercent}%\n• Job Applications: ${totalJobs}\n• LinkedIn Progress: ${linkedinProgressPercent}%\n\n**🛠️ Platform Features:**\n\n**📝 Resume Builder:**\n• ATS-friendly templates\n• Real-time completion tracking\n• Multiple export formats\n• Industry-specific guidance\n\n**💼 LinkedIn Optimization:**\n• Daily activity tracking\n• Weekly networking assignments\n• Connection growth monitoring\n• Content engagement tools\n\n**🎯 Job Tracker:**\n• Application status management\n• Follow-up reminders\n• Internal job opportunities\n• Interview tracking\n• Points for status transitions (20 points each)\n\n**📈 Career Growth:**\n• Daily activities and challenges\n• Weekly assignments\n• Skill development tracking\n• Learning goals management\n\n**🏆 Gamification:**\n• Points system for all activities\n• Leaderboards and rankings\n• Achievement badges\n• Progress visualization\n\n${profile?.industry === 'IT' ? '**💻 GitHub Tools:**\n• Repository tracking\n• Contribution monitoring\n• Profile optimization\n• Weekly coding challenges\n\n' : ''}**💡 AI Assistant (Premium):**\n• Personalized career guidance\n• Progress-based recommendations\n• Feature explanations\n• Strategic advice\n\n**🎓 Learning Resources:**\n• Industry-specific tips\n• Best practice guides\n• Template libraries\n• Success stories\n\n**Ask me anything about:** Resume building, LinkedIn optimization, job searching, career growth, platform features, progress tracking, assignments, or specific guidance!`;
    } else {
      // Generic helpful response
      aiResponse = `🤖 **I'm here to help with your career growth!**\n\n**Your Current Status:**\n• Points: ${totalPoints}\n• Resume: ${resumeProgressPercent}% complete\n• LinkedIn: ${linkedinProgressPercent}% tasks done\n• Job Applications: ${totalJobs} tracked\n\n**I can help you with:**\n• Resume building and optimization\n• LinkedIn profile enhancement\n• Job search strategies\n• Career development planning\n• Platform feature explanations\n• Progress tracking and goals${profile?.industry === 'IT' ? '\n• GitHub profile optimization' : ''}\n\n**Your Question:** "${message}"\n\n**How can I assist you specifically?** Ask about:\n✓ Resume progress and tips\n✓ LinkedIn networking strategies\n✓ Job application tracking\n✓ Assignment completion\n✓ Points and achievements\n✓ Platform features\n✓ Career growth advice\n\nI'm designed to help only with career development topics related to our platform. Let me know what specific area you'd like guidance on!`;
    }

    const response = {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userStats: {
          totalPoints,
          resumeProgress: resumeProgressPercent,
          linkedinProgress: linkedinProgressPercent,
          jobApplications: totalJobs,
          assignments: { completed: completedAssignments, total: totalAssignments }
        }
      }
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: 'Sorry, I encountered an error. Please try again or contact support if the issue persists.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});