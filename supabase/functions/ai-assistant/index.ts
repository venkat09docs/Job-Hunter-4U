import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, context } = await req.json();
    
    console.log('AI assistant request:', { message, userId, context });

    // Enhanced AI assistant with comprehensive career guidance
    let aiResponse = '';
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      if (lowerMessage.includes('build') || lowerMessage.includes('create')) {
        aiResponse = "🚀 **Resume Building Tips:**\n\n**Using our Resume Builder:**\n• Navigate to 'Resume Builder' in your dashboard\n• Use our templates for ATS-friendly formatting\n• Include sections: Contact, Summary, Experience, Education, Skills\n\n**Content Tips:**\n• Use action verbs (achieved, implemented, led)\n• Quantify achievements (increased sales by 25%)\n• Tailor keywords for each job application\n• Keep it 1-2 pages maximum\n\n**Pro Tip:** Use our 'Build My Profile' section to track completion percentage and earn points!";
      } else if (lowerMessage.includes('optimize') || lowerMessage.includes('improve')) {
        aiResponse = "📈 **Resume Optimization:**\n\n• Use our Resume Progress tracking in 'Build My Profile'\n• Include relevant keywords from job descriptions\n• Use bullet points with measurable results\n• Ensure consistent formatting and no typos\n• Add relevant certifications and projects\n\n**ATS Tips:**\n• Use standard section headers\n• Avoid graphics and complex formatting\n• Save as both PDF and Word formats\n\n**Track Progress:** Check your resume completion percentage in the dashboard!";
      } else {
        aiResponse = "📝 **Resume Help:**\n\nI can help you with:\n• Building a resume using our Resume Builder\n• Optimizing content for ATS systems\n• Formatting and structure advice\n• Industry-specific tips\n\nWhat specific aspect would you like help with? (building, optimizing, formatting, or reviewing)";
      }
    } else if (lowerMessage.includes('linkedin')) {
      if (lowerMessage.includes('profile') || lowerMessage.includes('optimize')) {
        aiResponse = "💼 **LinkedIn Profile Optimization:**\n\n**Using our LinkedIn Tools:**\n• Visit 'LinkedIn Optimization' in your dashboard\n• Use our LinkedIn task tracker for daily activities\n• Complete weekly assignments for networking growth\n\n**Profile Essentials:**\n• Professional headshot (increases profile views by 14x)\n• Compelling headline with keywords\n• Detailed summary showcasing your value\n• Complete all sections (education, experience, skills)\n• Get recommendations and endorsements\n\n**Daily Activities (track in our app):**\n• Post industry-relevant content\n• Engage with others' posts\n• Send personalized connection requests\n• Join relevant groups and participate";
      } else if (lowerMessage.includes('network') || lowerMessage.includes('connect')) {
        aiResponse = "🤝 **LinkedIn Networking Strategy:**\n\n**Use our LinkedIn Growth Tools:**\n• Track daily networking activities in your dashboard\n• Complete weekly networking assignments\n• Monitor connection growth metrics\n\n**Effective Networking:**\n• Send 5-10 personalized connection requests daily\n• Engage with posts before connecting\n• Follow up with valuable content or insights\n• Attend virtual events and connect with speakers\n• Join industry-specific LinkedIn groups\n\n**Message Templates:** Use our saved templates in the LinkedIn section for consistent outreach!";
      } else {
        aiResponse = "🔗 **LinkedIn Assistance:**\n\nI can help you with:\n• Profile optimization strategies\n• Networking and connection building\n• Content creation tips\n• Job search through LinkedIn\n• Using our LinkedIn tracking tools\n\nWhat aspect of LinkedIn would you like to focus on?";
      }
    } else if (lowerMessage.includes('github')) {
      aiResponse = "💻 **GitHub Profile Enhancement:**\n\n**Using our GitHub Tools:**\n• Access 'GitHub Optimization' for profile tracking\n• Complete weekly coding assignments\n• Track repository contributions in your dashboard\n\n**Profile Optimization:**\n• Create a compelling README for your profile\n• Pin your best repositories (max 6)\n• Use descriptive repository names and descriptions\n• Include live demo links and screenshots\n• Write clear documentation and setup instructions\n\n**Activity Tips:**\n• Commit code regularly (green squares matter!)\n• Contribute to open-source projects\n• Create diverse projects showcasing different skills\n• Use meaningful commit messages\n\n**Track Progress:** Monitor your GitHub activity and earn points in our GitHub tracking section!";
    } else if (lowerMessage.includes('job') && (lowerMessage.includes('search') || lowerMessage.includes('hunt') || lowerMessage.includes('application'))) {
      if (lowerMessage.includes('track') || lowerMessage.includes('manage')) {
        aiResponse = "📊 **Job Application Tracking:**\n\n**Use our Job Tracker:**\n• Navigate to 'Job Tracker' in your dashboard\n• Track applications through different stages\n• Set follow-up reminders\n• Monitor application success rates\n\n**Application Strategy:**\n• Apply to 5-10 jobs daily\n• Customize resume for each application\n• Write tailored cover letters\n• Follow up after 1 week if no response\n• Track metrics: applications sent, interviews, offers\n\n**Internal Opportunities:** Check 'Find Your Next Role' for exclusive job postings from partner companies!";
      } else if (lowerMessage.includes('internal') || lowerMessage.includes('opportunity')) {
        aiResponse = "🎯 **Internal Job Opportunities:**\n\n**Access Exclusive Jobs:**\n• Visit 'Find Your Next Role' → 'Internal Job Opportunities'\n• Browse curated positions from our partner network\n• Apply directly through our platform\n• Track application status in real-time\n\n**Application Tips:**\n• Read job descriptions carefully\n• Note application deadlines\n• Tailor your application to each role\n• Use our resume builder for consistent formatting\n\n**Advantage:** These positions often have higher response rates and faster hiring processes!";
      } else {
        aiResponse = "🎯 **Job Search Strategy:**\n\n**Use our Platform Features:**\n• Job Tracker for application management\n• Internal job opportunities in 'Find Your Next Role'\n• Resume Builder for ATS-optimized resumes\n• LinkedIn tools for networking\n\n**Search Strategy:**\n• Set up job alerts on multiple platforms\n• Apply within 24-48 hours of posting\n• Network your way to opportunities\n• Follow up professionally\n• Prepare for interviews using our resources\n\n**Daily Goals:** Apply to 5+ jobs, make 10+ LinkedIn connections, update your tracker!";
      }
    } else if (lowerMessage.includes('interview')) {
      aiResponse = "🎤 **Interview Preparation:**\n\n**Preparation Steps:**\n• Research the company thoroughly (website, recent news, culture)\n• Prepare STAR method examples (Situation, Task, Action, Result)\n• Practice common questions for your industry\n• Prepare thoughtful questions to ask them\n\n**Technical Interviews:**\n• Practice coding problems on platforms like LeetCode\n• Review fundamental concepts in your field\n• Prepare to explain your GitHub projects\n• Practice whiteboarding or screen sharing\n\n**Follow-up:**\n• Send thank-you emails within 24 hours\n• Track interview progress in our Job Tracker\n• Connect with interviewers on LinkedIn\n\n**Use our tools:** Update your interview status in the Job Tracker and prepare using our career activities section!";
    } else if (lowerMessage.includes('career') || lowerMessage.includes('growth') || lowerMessage.includes('development')) {
      aiResponse = "📈 **Career Development:**\n\n**Use our Career Tools:**\n• Complete daily activities in 'Career Growth Activities'\n• Set learning goals in our goal-setting section\n• Track skill development progress\n• Participate in weekly assignments\n\n**Growth Strategies:**\n• Identify skill gaps in your target roles\n• Take online courses and certifications\n• Build projects to demonstrate new skills\n• Seek mentorship and feedback\n• Network within your industry\n\n**Track Progress:**\n• Monitor your points and achievements\n• Complete profile building activities\n• Engage with our leaderboard for motivation\n\n**Pro Tip:** Consistent daily activities lead to significant career growth over time!";
    } else if (lowerMessage.includes('points') || lowerMessage.includes('level') || lowerMessage.includes('progress')) {
      aiResponse = "🏆 **Points & Progress System:**\n\n**How to Earn Points:**\n• Complete daily activities (LinkedIn, GitHub, Job Applications)\n• Build and optimize your resume (80% completion = bonus points)\n• Participate in weekly assignments\n• Network and make connections\n• Apply to jobs and track progress\n\n**Track Your Progress:**\n• View points history in your profile\n• Check leaderboard rankings\n• Monitor completion percentages\n• Set and achieve learning goals\n\n**Benefits:**\n• Gamified learning experience\n• Track career development\n• Compare progress with peers\n• Unlock achievements and milestones\n\n**Tip:** Consistency is key! Small daily actions compound into significant career growth!";
    } else if (lowerMessage.includes('tips') || lowerMessage.includes('advice') || lowerMessage.includes('help')) {
      aiResponse = "💡 **Career Success Tips:**\n\n**Daily Habits:**\n• Complete activities in our Career Growth section\n• Make 5-10 LinkedIn connections\n• Apply to 3-5 relevant job positions\n• Commit code to GitHub (if applicable)\n• Update your job tracker\n\n**Weekly Goals:**\n• Complete all assigned weekly tasks\n• Network at virtual events\n• Learn a new skill or technology\n• Optimize one section of your resume/LinkedIn\n\n**Platform Features to Use:**\n• Job Tracker for application management\n• Resume Builder for professional resumes\n• LinkedIn/GitHub optimization tools\n• Internal job opportunities\n• Progress tracking and points system\n\n**Success Formula:** Consistency + Our Tools + Networking = Career Success!";
    } else {
      aiResponse = `🤖 **Career Assistant Help:**\n\nI can provide specific guidance on:\n\n**📝 Resume:** Building, optimizing, formatting tips\n**💼 LinkedIn:** Profile optimization, networking strategies\n**💻 GitHub:** Profile enhancement, repository management\n**🎯 Job Search:** Application strategies, tracking, internal opportunities\n**🎤 Interviews:** Preparation, follow-up strategies\n**📈 Career Growth:** Skill development, goal setting\n**🏆 Platform Features:** Points system, progress tracking\n\n**Your Question:** "${message}"\n\nCould you be more specific about which area you'd like help with? I'll provide detailed, actionable advice using our platform's features!`;
    }

    const response = {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      context: context
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});