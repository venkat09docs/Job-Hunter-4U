import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, Circle, Clock, User, BookOpen, Target, Settings, Users, Trophy, BarChart, Edit, Trash2, Save, X } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";

const documentationContent = {
  1: {
    title: "Complete Platform Setup Guide",
    description: "Your first steps after signing in - complete walkthrough of the Digital Career Hub platform and its core features.",
    readTime: "10 min read",
    lastUpdated: "1 day ago",
    category: "Getting Started",
    steps: [
      {
        id: 1,
        title: "Welcome to Digital Career Hub",
        content: `Congratulations on joining Digital Career Hub! This comprehensive platform is designed to accelerate your career growth and help you get hired faster. Let's start with understanding what makes this platform unique:

• **AI-Powered Career Tools**: Get personalized recommendations and automated assistance
• **Gamification System**: Earn points for every career-building activity you complete
• **Complete Job Search Management**: Track applications, interviews, and progress
• **Professional Profile Building**: Create compelling profiles across multiple platforms
• **Learning & Development**: Access curated resources and track your skill growth`,
        icon: "BookOpen"
      },
      {
        id: 2,
        title: "Complete Your Initial Profile Setup",
        content: `Your profile is the foundation of your success on this platform. Complete these essential sections:

**Basic Information:**
• Navigate to Profile → Edit Profile
• Add your professional photo (increases profile views by 60%)
• Fill in your current role, location, and contact information
• Write a compelling professional summary (2-3 sentences)

**Skills & Experience:**
• List your top 10 technical and soft skills
• Add your work experience with specific achievements
• Include education details and certifications

**Career Preferences:**
• Set your desired job titles and industries
• Specify your preferred work location (remote/hybrid/onsite)
• Set salary expectations and availability date

**Pro Tip:** Completing your profile earns you valuable points and increases your visibility to recruiters by 85%!`,
        icon: "User"
      },
      {
        id: 3,
        title: "Connect Your Professional Accounts",
        content: `Linking your professional accounts enables powerful automation and tracking features:

**LinkedIn Integration:**
• Go to Settings → Connected Accounts
• Connect your LinkedIn profile for automatic activity tracking
• Enable LinkedIn automation tools (Premium feature)
• Sync your network growth and engagement metrics

**GitHub Integration:**
• Connect your GitHub account to showcase technical projects
• Enable automatic commit tracking and contribution analysis
• Display your coding activity and project portfolio

**Benefits of Integration:**
• Automatic profile updates and skill verification
• Real-time activity tracking and point earning
• Enhanced credibility with verified accounts
• Streamlined application processes`,
        icon: "Settings"
      },
      {
        id: 4,
        title: "Set Up Your Job Search Preferences",
        content: `Configure your job search settings for personalized opportunities:

**Job Tracker Setup:**
• Navigate to Job Tracker from the main menu
• Set up job search alerts for your preferred roles
• Configure automatic job matching based on your profile
• Enable email notifications for new opportunities

**Application Management:**
• Create application templates for different job types
• Set up interview scheduling integration
• Enable application status tracking and reminders

**AI Job Matching:**
• Complete the career assessment questionnaire
• Set your job search intensity (passive/active/urgent)
• Configure geographic and remote work preferences
• Enable AI-powered job recommendations`,
        icon: "Target"
      },
      {
        id: 5,
        title: "Understand the Points & Gamification System",
        content: `Our gamification system motivates consistent career-building activities:

**How Points Work:**
• Earn points for profile completion, job applications, networking, and learning
• View your point history and track daily/weekly progress
• Compete on leaderboards with other users in your institute or globally

**Point Categories:**
• **Profile Building**: Complete sections, add skills, update experience
• **Job Search**: Apply to jobs, attend interviews, update application status
• **Networking**: Connect on LinkedIn, engage with posts, attend events
• **Learning**: Complete courses, read documentation, set goals

**Viewing Your Progress:**
• Check your dashboard for daily point summary
• Access detailed point history from your profile menu
• Track your ranking on various leaderboards
• Set daily and weekly point targets`,
        icon: "Trophy"
      },
      {
        id: 6,
        title: "Explore AI-Powered Career Tools",
        content: `Leverage our AI tools to accelerate your career growth:

**AI Resume Builder:**
• Navigate to Resume Builder from the main menu
• Choose from ATS-optimized templates
• Get AI-powered content suggestions for each section
• Generate multiple versions for different job types

**AI Career Assistant:**
• Access the chat assistant from any page
• Ask for personalized career advice and job search strategies
• Get help with interview preparation and salary negotiation
• Request feedback on your applications and profiles

**AI Job Search:**
• Use AI-powered job matching for personalized recommendations
• Get automated application writing assistance
• Receive interview preparation based on specific job requirements`,
        icon: "BarChart"
      },
      {
        id: 7,
        title: "Join Your Institute Community (If Applicable)",
        content: `If you're part of an educational institution, maximize your community benefits:

**Institute Features:**
• Access your institute's private leaderboard
• Connect with classmates and alumni
• Participate in institute-specific challenges and competitions
• Access exclusive resources and job opportunities

**Networking Within Your Institute:**
• View and connect with fellow students
• Share job opportunities and referrals
• Participate in group learning activities
• Access mentor connections through faculty

**Competition & Motivation:**
• Compete for top positions on your institute leaderboard
• Participate in batch-wise competitions
• Earn recognition for consistent progress
• Access institute-specific rewards and incentives`,
        icon: "Users"
      },
      {
        id: 8,
        title: "Set Your Career Goals & Create an Action Plan",
        content: `Define clear objectives to stay focused and motivated:

**Goal Setting Process:**
• Navigate to Career Growth → Learning Goals
• Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
• Break down long-term goals into weekly milestones
• Assign point values to track progress

**Recommended Initial Goals:**
• Complete profile to 100% within first week
• Apply to 5 relevant jobs within first month
• Build LinkedIn network by 50 connections
• Complete 3 skill assessments or courses

**Tracking & Adjustment:**
• Review goals weekly and adjust as needed
• Celebrate milestone achievements
• Use the platform's analytics to identify improvement areas
• Set increasingly challenging goals as you progress`,
        icon: "Target"
      },
      {
        id: 9,
        title: "Master Your Dashboard & Analytics",
        content: `Your dashboard is your career command center:

**Dashboard Overview:**
• Daily activity summary and point progress
• Recent applications and their status updates
• Upcoming interviews and important reminders
• Goal progress and achievement notifications

**Key Metrics to Monitor:**
• Profile completion percentage
• Application response rate
• Interview success rate
• Network growth rate
• Learning progress and skill development

**Using Analytics for Improvement:**
• Identify patterns in successful applications
• Track which networking strategies work best
• Monitor your most productive days and times
• Adjust strategies based on data insights

**Regular Review Process:**
• Check dashboard daily for 5 minutes
• Review weekly analytics every Sunday
• Adjust goals and strategies monthly
• Celebrate achievements and learn from setbacks`,
        icon: "BarChart"
      },
      {
        id: 10,
        title: "Take Your First Quick Win Actions",
        content: `Complete these high-impact activities in your first session:

**Immediate Actions (Next 30 Minutes):**
• Upload a professional profile photo
• Complete basic profile information
• Connect LinkedIn and GitHub accounts
• Set up 3 job search alerts

**This Week's Goals:**
• Complete profile to 90%+
• Apply to 3 relevant positions
• Connect with 10 new LinkedIn contacts
• Read 2 relevant documentation articles

**Success Metrics:**
• Earn your first 100 points
• Achieve "Profile Builder" badge
• Get featured on the newcomer leaderboard
• Receive your first job match recommendation

**Next Steps:**
• Explore the Knowledge Base for advanced strategies
• Join community discussions and forums
• Schedule regular platform usage (15-20 minutes daily)
• Consider upgrading to Premium for advanced features

**Remember:** Consistency beats intensity. Small daily actions compound into significant career progress!`,
        icon: "CheckCircle"
      }
    ]
  },
  2: {
    title: "First-Time User Onboarding",
    description: "A comprehensive walkthrough for new users to get started with confidence and understand the platform's value.",
    readTime: "8 min read",
    lastUpdated: "1 day ago",
    category: "Getting Started",
    steps: [
      {
        id: 1,
        title: "Welcome & Platform Overview",
        content: `Welcome to your career transformation journey! Digital Career Hub is designed to be your comprehensive career companion.

**What You'll Achieve:**
• Land your dream job 3x faster with AI-powered tools
• Build a professional brand across multiple platforms
• Track and optimize your career growth with data-driven insights
• Connect with like-minded professionals and industry experts

**Platform Philosophy:**
We believe that career success comes from consistent, strategic actions. Our gamification system makes career building engaging and rewarding, turning your professional development into an exciting journey with clear milestones and achievements.

**Your Success Timeline:**
• Week 1: Foundation setup and first activities
• Month 1: Establish consistent habits and see initial results
• Month 3: Significant progress toward your career goals
• Month 6: Major career milestones and opportunities`,
        icon: "BookOpen"
      },
      {
        id: 2,
        title: "Account Setup & Profile Creation",
        content: `Let's establish your professional foundation with a strong profile setup:

**Essential Profile Elements:**
• **Professional Photo**: Use a high-quality headshot with good lighting
• **Headline**: Craft a compelling professional tagline (e.g., "Marketing Professional | Growth Specialist | Tech Enthusiast")
• **Location**: Add your city and indicate remote work preferences
• **Contact Information**: Include professional email and LinkedIn URL

**Profile Optimization Tips:**
• Use keywords relevant to your target roles
• Write in first person for a personal touch
• Quantify achievements with specific numbers when possible
• Keep information current and accurate

**Immediate Benefits:**
• Algorithm optimization for better job matching
• Increased visibility to recruiters and employers
• Professional credibility establishment
• Foundation for all platform features`,
        icon: "User"
      },
      {
        id: 3,
        title: "Understanding Your Dashboard",
        content: `Your dashboard is mission control for your career journey. Let's explore its key components:

**Main Dashboard Sections:**
• **Activity Feed**: Recent actions, achievements, and platform updates
• **Quick Stats**: Points earned, profile completion, recent applications
• **Goal Progress**: Visual progress toward your set career objectives
• **Recent Activity**: Your latest job applications, networking actions, and learning progress

**Key Metrics Overview:**
• **Profile Strength**: Percentage completion and optimization score
• **Application Pipeline**: Number of active applications and their stages
• **Network Growth**: LinkedIn connections and engagement metrics
• **Learning Progress**: Courses completed and skills developed

**Daily Dashboard Routine:**
• Check notifications and updates (2 minutes)
• Review goal progress and adjust plans (3 minutes)
• Plan your day's career-building activities (5 minutes)`,
        icon: "BarChart"
      },
      {
        id: 4,
        title: "Tour of Main Navigation",
        content: `Familiarize yourself with the platform's core sections and their purposes:

**Primary Navigation Areas:**
• **Dashboard**: Your daily overview and activity center
• **Job Tracker**: Manage applications, interviews, and opportunities
• **Profile**: View and edit your professional information
• **Career Growth**: Set goals, track progress, and access learning resources
• **AI Tools**: Access resume builder, job search, and career assistance

**Secondary Features:**
• **Leaderboards**: See how you rank against peers and stay motivated
• **Settings**: Customize preferences, notifications, and integrations
• **Knowledge Base**: Access tutorials, guides, and best practices
• **Resources Library**: Curated content for skill development

**Navigation Tips:**
• Bookmark frequently used sections
• Use keyboard shortcuts for quick access
• Mobile app mirrors desktop functionality
• Search function helps find specific features quickly`,
        icon: "Target"
      },
      {
        id: 5,
        title: "First Actions & Quick Wins",
        content: `Complete these foundational activities to establish momentum and earn your first points:

**Immediate Actions (Next 20 Minutes):**
• Upload your professional profile photo (+25 points)
• Complete basic information fields (+50 points)
• Write your professional summary (+75 points)
• Set your first career goal (+100 points)

**First Week Objectives:**
• Connect LinkedIn and GitHub accounts
• Complete profile to 80%+ completion
• Apply to 2 relevant job positions
• Join your institute's community (if applicable)

**Building Early Momentum:**
• Aim for at least 50 points daily in your first week
• Explore one new platform feature each day
• Read one knowledge base article daily
• Connect with at least 5 new LinkedIn contacts

**Success Indicators:**
You're off to a great start when you've earned your first 500 points, completed your profile foundation, and submitted your first job applications through the platform.`,
        icon: "CheckCircle"
      },
      {
        id: 6,
        title: "Setting Up Notifications & Preferences",
        content: `Customize your experience to stay informed without being overwhelmed:

**Notification Categories:**
• **Job Alerts**: New matching opportunities and application updates
• **Social Updates**: LinkedIn activity, network growth, and engagement
• **Achievement Notifications**: Points earned, badges unlocked, milestone reached
• **Learning Reminders**: Course deadlines, goal check-ins, skill assessments

**Recommended Settings for New Users:**
• Enable job alerts for high-priority matches
• Turn on achievement notifications for motivation
• Set daily digest emails instead of real-time for non-urgent items
• Enable mobile notifications for interview scheduling and urgent updates

**Frequency Options:**
• Immediate: Critical updates and urgent actions needed
• Daily Digest: Summary of activities and opportunities
• Weekly Summary: Progress reports and analytics insights
• Monthly Review: Comprehensive performance and goal assessment

**Customization Tips:**
Start with moderate notification levels and adjust based on your engagement patterns and preferences.`,
        icon: "Settings"
      },
      {
        id: 7,
        title: "Understanding Premium vs Free Features",
        content: `Learn what's available at each level and how to maximize your experience:

**Free Tier Benefits:**
• Complete profile creation and basic optimization
• Job application tracking and basic analytics
• Access to knowledge base and learning resources
• Community features and basic leaderboards
• Standard AI assistant interactions

**Premium Features:**
• Advanced AI-powered resume optimization and generation
• LinkedIn automation and advanced networking tools
• Priority job matching and application assistance
• Detailed analytics and performance insights
• Unlimited AI assistant conversations and advanced features

**When to Consider Premium:**
• You're actively job searching and need advanced tools
• You want to accelerate your networking and LinkedIn growth
• You need detailed analytics to optimize your strategy
• You're preparing for career transitions or promotions

**Maximizing Free Features:**
Focus on consistent profile building, regular job applications, and community engagement to get significant value before considering premium upgrades.`,
        icon: "Trophy"
      },
      {
        id: 8,
        title: "Community & Networking Introduction",
        content: `Connect with peers and leverage the power of professional networking:

**Institute Communities:**
• Join your educational institution's private community
• Participate in batch-specific challenges and competitions
• Access alumni networks and mentorship opportunities
• Share resources and job opportunities with classmates

**Global Community Features:**
• Engage in platform-wide discussions and forums
• Participate in industry-specific groups and conversations
• Share success stories and learn from others' experiences
• Access networking events and virtual meetups

**Networking Best Practices:**
• Be genuine and helpful in your interactions
• Share valuable content and insights regularly
• Offer help and support to fellow community members
• Maintain professional communication standards

**Building Your Network:**
Start by connecting with people in your institute or similar career paths, then gradually expand to industry professionals and potential mentors.`,
        icon: "Users"
      }
    ]
  },
  3: {
    title: "Understanding Your Dashboard",
    description: "Master your dashboard to effectively track progress, manage activities, and optimize your career growth strategy.",
    readTime: "7 min read",
    lastUpdated: "1 day ago",
    category: "Getting Started",
    steps: [
      {
        id: 1,
        title: "Dashboard Layout & Overview",
        content: `Your dashboard is designed to give you a comprehensive view of your career progress at a glance:

**Main Dashboard Sections:**
• **Header Stats**: Key performance indicators and quick metrics
• **Activity Timeline**: Chronological view of your recent career-building activities
• **Progress Widgets**: Visual representations of goals and milestone achievements
• **Quick Actions**: One-click access to frequently used features
• **Notifications Panel**: Important updates, reminders, and platform news

**Dashboard Philosophy:**
The dashboard follows a "at-a-glance" design principle, showing you the most important information first while providing drill-down capabilities for detailed analysis.

**Customization Options:**
• Rearrange widgets based on your priorities
• Show/hide specific metrics and sections
• Set your preferred time ranges for analytics
• Choose between summary and detailed view modes

**Mobile vs Desktop:**
The dashboard adapts seamlessly between devices, with mobile focusing on the most critical information and actions.`,
        icon: "BarChart"
      },
      {
        id: 2,
        title: "Key Metrics & Performance Indicators",
        content: `Learn to interpret and act on the most important dashboard metrics:

**Primary Performance Metrics:**
• **Total Points**: Your cumulative career-building activity score
• **Profile Completion**: Percentage and optimization score of your professional profile
• **Application Success Rate**: Ratio of applications to interviews and offers
• **Network Growth**: LinkedIn connections, engagement rate, and relationship quality

**Activity Metrics:**
• **Daily/Weekly Point Trends**: Track consistency and identify productive patterns
• **Goal Progress**: Visual progress toward your set career objectives
• **Learning Completion**: Courses finished, skills acquired, certifications earned
• **Job Search Pipeline**: Active applications, interview stages, and opportunity funnel

**Interpreting Your Data:**
• Green trends indicate positive progress and effective strategies
• Plateaus suggest need for strategy adjustment or goal refinement
• Declining metrics may indicate decreased activity or need for re-engagement
• Compare your metrics to previous periods and peer benchmarks

**Action Items Based on Metrics:**
Use dashboard insights to identify what's working and what needs improvement in your career strategy.`,
        icon: "Trophy"
      },
      {
        id: 3,
        title: "Activity Timeline & Progress Tracking",
        content: `Master the activity timeline to understand your career-building patterns and optimize your efforts:

**Activity Timeline Features:**
• **Chronological View**: See all your activities in time order
• **Category Filtering**: Focus on specific types of activities (applications, networking, learning)
• **Point Attribution**: Understand how each activity contributes to your overall score
• **Milestone Markers**: Identify significant achievements and breakthrough moments

**Understanding Activity Categories:**
• **Profile Building**: Updates, skill additions, experience entries, photo uploads
• **Job Search**: Applications submitted, interviews attended, follow-ups completed
• **Networking**: LinkedIn connections, post engagements, message exchanges
• **Learning**: Course completions, article readings, skill assessments

**Progress Patterns to Monitor:**
• Consistency of daily activities
• Balance between different activity types
• Correlation between activity spikes and success outcomes
• Seasonal patterns in your career-building efforts

**Using Timeline for Planning:**
Review your timeline weekly to identify successful patterns and plan future activities based on what has worked best for your career goals.`,
        icon: "Clock"
      },
      {
        id: 4,
        title: "Goal Progress & Milestone Tracking",
        content: `Effectively monitor and adjust your career goals using dashboard insights:

**Goal Visualization Tools:**
• **Progress Bars**: Visual representation of goal completion percentage
• **Milestone Markers**: Key checkpoints and achievement indicators
• **Timeline View**: See goal progress over time with trend analysis
• **Category Breakdown**: Understand progress across different goal types

**Goal Categories on Dashboard:**
• **Career Objectives**: Job search, salary targets, role progression
• **Skill Development**: Technical skills, certifications, learning milestones
• **Network Growth**: LinkedIn connections, industry relationships, mentorship
• **Profile Enhancement**: Completion percentage, optimization scores, content quality

**Smart Goal Adjustments:**
• Weekly goal review and refinement process
• Identifying and addressing goal bottlenecks
• Celebrating milestone achievements to maintain motivation
• Setting stretch goals to accelerate progress

**Dashboard Goal Actions:**
• One-click goal creation and modification
• Progress update logging and tracking
• Milestone celebration and sharing features
• Goal completion analysis and next-step recommendations`,
        icon: "Target"
      },
      {
        id: 5,
        title: "Quick Actions & Shortcuts",
        content: `Maximize efficiency with dashboard shortcuts and quick action features:

**Primary Quick Actions:**
• **Apply to Job**: Direct access to job application workflow from dashboard
• **Update Profile**: Quick edit mode for profile sections needing attention
• **Connect LinkedIn**: Instant access to networking and connection features
• **Log Activity**: Manually add career-building activities and earn points

**Smart Shortcuts:**
• **Resume Builder**: One-click access to AI-powered resume creation
• **Interview Prep**: Quick access to preparation materials for upcoming interviews
• **Goal Check-in**: Rapid progress updates on your career objectives
• **Learning Hub**: Direct access to recommended courses and resources

**Personalized Recommendations:**
Your dashboard provides AI-powered suggestions for:
• Next best actions based on your career stage
• Optimal timing for job applications and networking
• Skill gaps to address based on your target roles
• Networking opportunities within your industry

**Efficiency Tips:**
• Use keyboard shortcuts for frequent actions
• Set up dashboard bookmarks for daily routines
• Enable quick notifications for time-sensitive opportunities
• Customize your quick action menu based on your priorities`,
        icon: "Settings"
      },
      {
        id: 6,
        title: "Notifications & Alert Management",
        content: `Stay informed and responsive with effective notification management:

**Notification Categories:**
• **Critical Alerts**: Interview invitations, job offer communications, urgent deadlines
• **Opportunity Notifications**: New job matches, networking requests, learning recommendations
• **Progress Updates**: Goal milestones, point achievements, leaderboard changes
• **System Notifications**: Platform updates, feature releases, maintenance schedules

**Dashboard Notification Center:**
• **Unread Counter**: See new notifications at a glance
• **Priority Flagging**: Important notifications highlighted and prioritized
• **Action Required**: Notifications requiring immediate response or decision
• **Archive System**: Keep track of past notifications and actions taken

**Customizing Your Notification Experience:**
• Set quiet hours to avoid interruptions during focused work
• Choose between immediate, daily digest, or weekly summary delivery
• Customize notification importance levels based on your career stage
• Enable mobile push notifications for time-sensitive opportunities

**Best Practices:**
• Review notifications during your daily dashboard check-in
• Act on time-sensitive opportunities immediately
• Archive completed notifications to maintain a clean interface
• Adjust settings based on your engagement patterns and preferences`,
        icon: "User"
      },
      {
        id: 7,
        title: "Analytics & Performance Insights",
        content: `Leverage dashboard analytics to optimize your career strategy and accelerate your growth:

**Performance Analytics Available:**
• **Trend Analysis**: Track performance over time with visual graphs and charts
• **Comparative Metrics**: See how you perform against peer benchmarks
• **Success Correlation**: Identify which activities lead to the best outcomes
• **Efficiency Metrics**: Understand your productivity patterns and optimal times

**Key Analytics Sections:**
• **Application Performance**: Response rates, interview conversion, offer ratios
• **Networking Effectiveness**: Connection acceptance rates, engagement metrics, referral success
• **Learning ROI**: Skill acquisition impact on job opportunities and career progress
• **Time Investment**: Track time spent on different activities and their returns

**Using Analytics for Strategic Decisions:**
• Identify your most effective job search channels and strategies
• Optimize your networking approach based on success patterns
• Adjust learning priorities based on market demand and career goals
• Time your applications and networking activities for maximum impact

**Regular Analytics Review:**
• Weekly performance check-ins to identify trends
• Monthly deep-dive analysis for strategic adjustments
• Quarterly comprehensive review for major strategy pivots
• Annual analysis for career planning and goal setting`,
        icon: "BarChart"
      }
    ]
  },
  4: {
    title: "Setting Up Your Profile Foundation",
    description: "Build a compelling professional profile that attracts opportunities and showcases your unique value proposition.",
    readTime: "12 min read",
    lastUpdated: "1 day ago",
    category: "Getting Started",
    steps: [
      {
        id: 1,
        title: "Professional Photo & Visual Branding",
        content: `Your profile photo is your first impression - make it count with these professional guidelines:

**Photo Quality Standards:**
• **Resolution**: High-quality image (at least 400x400 pixels)
• **Lighting**: Natural, well-lit environment with soft shadows
• **Background**: Clean, simple background (solid color or professional setting)
• **Framing**: Head and shoulders shot, with your face taking up 60% of the frame

**Professional Appearance Guidelines:**
• Dress for your target role (business casual to business formal)
• Maintain eye contact with the camera for trustworthiness
• Use a genuine, confident smile to appear approachable
• Ensure your appearance reflects current professional standards

**Technical Best Practices:**
• Use recent photos (within 2 years) for authenticity
• Avoid filters, but basic color correction is acceptable
• Save in high-quality JPEG format for compatibility
• Test how your photo appears on different devices and screen sizes

**Impact on Career Success:**
Profiles with professional photos receive 60% more views and are 40% more likely to be contacted by recruiters.`,
        icon: "User"
      },
      {
        id: 2,
        title: "Crafting Your Professional Headline",
        content: `Your headline is your elevator pitch in one line - make it memorable and impactful:

**Headline Formula:**
**Current Role | Key Skill/Specialization | Industry/Value Proposition**

**Example Headlines by Career Level:**
• **Entry Level**: "Recent Marketing Graduate | Digital Marketing Specialist | Passionate About Brand Growth"
• **Mid-Level**: "Senior Software Engineer | Full-Stack Developer | Building Scalable Web Applications"
• **Senior Level**: "Marketing Director | Growth Strategy Expert | Driving 40% Revenue Increases"

**Power Words to Include:**
• Action-oriented: "Driving," "Leading," "Building," "Transforming"
• Skill-focused: "Specialist," "Expert," "Strategist," "Architect"
• Results-oriented: "Proven," "Award-winning," "Certified," "Experienced"

**Headline Optimization Tips:**
• Include relevant keywords for your target roles
• Quantify achievements when possible (percentages, numbers, awards)
• Make it scannable and easy to understand quickly
• Update regularly to reflect career progression and new skills

**A/B Testing Your Headlines:**
Try different versions and monitor which generates more profile views and connection requests.`,
        icon: "Target"
      },
      {
        id: 3,
        title: "Professional Summary & Value Proposition",
        content: `Your professional summary tells your career story and communicates your unique value:

**Summary Structure (3-4 Sentences):**
1. **Opening Statement**: Your current role and years of experience
2. **Key Achievements**: 2-3 most impressive accomplishments with numbers
3. **Skills & Expertise**: Your core competencies and specializations
4. **Career Goals**: What you're looking for and the value you bring

**Example Professional Summary:**
"Experienced Digital Marketing Manager with 5+ years driving customer acquisition and retention for SaaS companies. Increased lead generation by 150% and reduced customer acquisition cost by 30% through data-driven campaign optimization. Expertise in marketing automation, conversion optimization, and cross-functional team leadership. Seeking to leverage proven growth marketing strategies to scale emerging tech companies."

**Writing Best Practices:**
• Write in first person for personal connection
• Use active voice and strong action verbs
• Include industry-specific keywords naturally
• Quantify achievements with specific metrics
• Keep it concise but comprehensive

**Common Mistakes to Avoid:**
• Generic statements that could apply to anyone
• Focusing on responsibilities instead of achievements
• Using jargon that doesn't translate across industries
• Making it too long or too short for your experience level`,
        icon: "BookOpen"
      },
      {
        id: 4,
        title: "Skills Assessment & Keyword Optimization",
        content: `Strategic skill listing improves your discoverability and demonstrates your expertise:

**Skill Categories to Include:**
• **Technical Skills**: Software, programming languages, tools, platforms
• **Industry Skills**: Specific methodologies, processes, domain knowledge
• **Soft Skills**: Leadership, communication, problem-solving, teamwork
• **Certifications**: Professional credentials, licenses, specialized training

**Keyword Strategy:**
• Research job descriptions for your target roles
• Include variations of important skills (e.g., "JavaScript" and "JS")
• Use industry-standard terminology and acronyms
• Balance trending skills with foundational competencies

**Skill Prioritization Method:**
1. **Essential Skills**: Must-have skills for your target roles (list first)
2. **Differentiating Skills**: Unique skills that set you apart
3. **Emerging Skills**: New skills you're developing or recently acquired
4. **Supporting Skills**: Complementary skills that enhance your profile

**Validation & Credibility:**
• Include proficiency levels or years of experience where relevant
• Add context for how you've used skills in real projects
• Consider skill assessments or endorsements to validate expertise
• Update skill list regularly as you develop new competencies

**Skills Section Optimization:**
Aim for 10-15 highly relevant skills rather than an exhaustive list that dilutes your focus.`,
        icon: "Settings"
      },
      {
        id: 5,
        title: "Experience & Achievement Documentation",
        content: `Transform your work history into compelling achievement stories that demonstrate impact:

**Experience Entry Structure:**
• **Job Title & Company**: Clear, recognizable titles and reputable organizations
• **Duration**: Accurate dates showing career progression and stability
• **Key Responsibilities**: 2-3 core functions that align with target roles
• **Quantified Achievements**: Specific results with numbers, percentages, or metrics

**Achievement Formula (STAR Method):**
**Situation**: Context and challenge faced
**Task**: Your specific responsibility or objective
**Action**: What you did to address the situation
**Result**: Quantifiable outcome and impact

**Example Achievement Statements:**
• "Led cross-functional team of 8 to launch new product feature, resulting in 25% increase in user engagement and $200K additional monthly revenue"
• "Streamlined customer onboarding process, reducing time-to-value by 40% and improving customer satisfaction scores by 15%"
• "Managed $500K marketing budget across 5 channels, achieving 120% of lead generation targets while reducing cost-per-lead by 30%"

**Documentation Best Practices:**
• Start each bullet point with strong action verbs
• Focus on outcomes and impact rather than just duties
• Include relevant keywords naturally within achievement descriptions
• Highlight progression and increased responsibilities over time

**Career Gap Management:**
Address any gaps honestly with brief explanations focused on growth, learning, or strategic career decisions.`,
        icon: "Trophy"
      },
      {
        id: 6,
        title: "Education & Certification Strategy",
        content: `Strategically present your educational background and ongoing learning to support your career narrative:

**Education Section Components:**
• **Degree & Institution**: Include GPA if above 3.5 and recent graduate
• **Relevant Coursework**: Highlight courses that align with your target roles
• **Academic Achievements**: Dean's list, honors, relevant projects, thesis topics
• **Leadership & Activities**: Relevant extracurriculars that demonstrate skills

**Professional Certifications:**
• **Industry Certifications**: Google Analytics, AWS, PMP, etc.
• **Platform Certifications**: Salesforce, HubSpot, Microsoft, etc.
• **Skill-Based Certifications**: Coding bootcamps, design programs, language proficiency
• **Continuing Education**: Relevant online courses, workshops, conferences

**Strategic Positioning:**
• **Recent Graduates**: Lead with education if it's your strongest credential
• **Experienced Professionals**: Focus on relevant certifications and continued learning
• **Career Changers**: Highlight education/training that supports your transition
• **Technical Roles**: Emphasize technical certifications and ongoing skill development

**Ongoing Learning Section:**
• Currently pursuing certifications or courses
• Professional development goals and learning pathway
• Industry conferences, workshops, or seminars attended
• Relevant books, podcasts, or thought leaders you follow

**Credibility Enhancement:**
Include links to digital badges, certificates, or portfolio work that validates your educational achievements.`,
        icon: "BookOpen"
      },
      {
        id: 7,
        title: "Contact Information & Professional Links",
        content: `Optimize your contact information and professional links for maximum connectivity and discoverability:

**Essential Contact Information:**
• **Professional Email**: Use firstname.lastname@domain.com format when possible
• **Phone Number**: Include area code and ensure voicemail is professional
• **Location**: City and state (specify if open to remote work)
• **LinkedIn URL**: Customize your LinkedIn URL for consistency

**Professional Link Strategy:**
• **LinkedIn Profile**: Ensure it's complete and mirrors your platform profile
• **GitHub Portfolio**: Essential for technical roles, showcase best repositories
• **Personal Website**: Optional but valuable for demonstrating digital presence
• **Professional Portfolio**: Industry-specific platforms (Behance, Dribbble, etc.)

**Link Optimization Best Practices:**
• Ensure all links are current and functional
• Use consistent professional naming across all platforms
• Regularly update linked profiles to maintain consistency
• Consider privacy settings and what information is publicly visible

**Professional Email Best Practices:**
• Use a professional email provider (Gmail, Outlook, custom domain)
• Avoid nicknames, numbers, or unprofessional terms
• Set up a professional email signature with your contact information
• Ensure your email notifications are set up to respond promptly

**Communication Preferences:**
• Specify preferred contact methods if you have preferences
• Set expectations for response times
• Include time zone if working with global teams or remote positions
• Consider adding a professional phone greeting that matches your brand`,
        icon: "User"
      },
      {
        id: 8,
        title: "Profile Optimization & SEO",
        content: `Implement advanced optimization techniques to improve your profile's searchability and impact:

**Keyword Optimization Strategy:**
• **Research Phase**: Analyze 10-15 target job descriptions for common keywords
• **Integration Phase**: Naturally incorporate keywords throughout your profile
• **Monitoring Phase**: Track which keywords drive profile views and connections
• **Refinement Phase**: Continuously update based on industry trends and feedback

**Profile SEO Elements:**
• **Title Tags**: Include target job titles in your headline
• **Meta Description**: Craft your summary as if it's a meta description for search
• **Content Density**: Maintain 1-3% keyword density without keyword stuffing
• **Link Building**: Cross-link between your professional profiles and portfolio

**Advanced Optimization Techniques:**
• Use variations of important keywords throughout different sections
• Include location-based keywords if targeting specific geographic markets
• Incorporate industry buzzwords and emerging technology terms
• Balance optimization with natural, readable content

**Performance Tracking:**
• Monitor profile view analytics and identify top-performing keywords
• Track which sections of your profile generate the most engagement
• A/B test different versions of key sections (headline, summary)
• Regular competitor analysis to identify new optimization opportunities

**Profile Completeness Score:**
Aim for 100% profile completion, as complete profiles receive significantly more visibility and opportunities than incomplete ones.`,
        icon: "BarChart"
      }
    ]
  }
};

export default function DocumentationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const docId = parseInt(id || "1");
  const doc = documentationContent[docId as keyof typeof documentationContent];

  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem(`doc-${docId}-progress`);
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, [docId]);

  const toggleStepComplete = (stepId: number) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    localStorage.setItem(`doc-${docId}-progress`, JSON.stringify(newCompleted));
  };

  const handleSaveEdit = () => {
    // In a real app, this would make an API call to update the documentation
    console.log("Saving changes:", { title: editTitle, description: editDescription });
    toast.success("Documentation updated successfully");
    setIsEditing(false);
  };

  const handleDelete = () => {
    // In a real app, this would make an API call to delete the documentation
    console.log("Deleting documentation:", id);
    toast.success("Documentation deleted successfully");
    navigate("/dashboard/knowledge-base");
  };

  const handleCancelEdit = () => {
    if (doc) {
      setEditTitle(doc.title);
      setEditDescription(doc.description);
    }
    setIsEditing(false);
  };

  // Initialize edit form with current data when doc changes
  useEffect(() => {
    if (doc) {
      setEditTitle(doc.title);
      setEditDescription(doc.description);
    }
  }, [doc]);

  const getIcon = (iconName: string) => {
    const icons = {
      BookOpen,
      User,
      Settings,
      Target,
      Trophy,
      Users,
      BarChart,
      CheckCircle
    };
    const IconComponent = icons[iconName as keyof typeof icons] || BookOpen;
    return <IconComponent className="h-6 w-6" />;
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Documentation Not Found</h1>
          <Link to="/dashboard/knowledge-base" className="text-primary hover:underline">
            Return to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  const progress = (completedSteps.length / doc.steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard/knowledge-base"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Knowledge Base</span>
            </Link>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{doc.category}</Badge>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {doc.readTime}
                </div>
                <span>•</span>
                <span>Updated {doc.lastUpdated}</span>
              </div>
              {isAdmin && !isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
              {isAdmin && isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 text-green-600 hover:text-green-600"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50 mb-6">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-foreground mb-4">{doc.title}</h1>
                <p className="text-xl text-muted-foreground mb-6">{doc.description}</p>
              </>
            )}
            
            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps.length}/{doc.steps.length} steps completed
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {doc.steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <Card key={step.id} className={`transition-all ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() => toggleStepComplete(step.id)}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getIcon(step.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Step {index + 1}: {step.title}
                            </CardTitle>
                            {isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {step.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4 whitespace-pre-line text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleStepComplete(step.id)}
                      >
                        {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(step.id)}
                      >
                        Focus on this step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion Message */}
          {completedSteps.length === doc.steps.length && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Congratulations! You've completed this guide.
                </h3>
                <p className="text-green-700 mb-4">
                  You're now ready to make the most of the Digital Career Hub platform. 
                  Continue exploring other documentation to accelerate your career growth!
                </p>
                <Link to="/dashboard/knowledge-base">
                  <Button>Explore More Guides</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Documentation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{doc.title}"? This action cannot be undone and will remove all associated content and user progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Documentation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}