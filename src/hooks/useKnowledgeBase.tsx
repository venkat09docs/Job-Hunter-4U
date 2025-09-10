import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  description: string;
  duration?: string;
  instructor?: string;
  readTime?: string;
  lastUpdated?: string;
  thumbnail?: string;
  isPublished: boolean;
  categoryId: string;
  content?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
}

export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  description?: string;
  categoryType: 'video' | 'documentation';
  videos?: KnowledgeBaseItem[];
  docs?: KnowledgeBaseItem[];
  displayOrder?: number;
  isActive?: boolean;
}

export const useKnowledgeBase = () => {
  const [videoData, setVideoData] = useState<KnowledgeBaseCategory[]>([]);
  const [docData, setDocData] = useState<KnowledgeBaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Profile Building Documentation - Comprehensive Step-by-Step Guides
      const profileBuildingDocs: KnowledgeBaseCategory[] = [
        {
          id: 'job-hunting-assignments',
          name: 'Job Hunting Assignments',
          description: 'Complete guide to daily and weekly job hunting tasks with points system',
          categoryType: 'documentation',
          displayOrder: 1,
          isActive: true,
          docs: [
            {
              id: 'job-hunting-assignments-guide',
              title: 'Job Hunting Assignments - Complete Guide',
              description: 'Master daily and weekly job hunting assignments to accelerate your career search with our structured points system',
              readTime: '35 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'job-hunting-assignments',
              displayOrder: 1,
              content: `# Job Hunting Assignments - Complete Guide

## Overview
Accelerate your job search with our structured assignment system designed to maximize your chances of landing your dream role. This comprehensive guide covers daily tasks, weekly assignments, and our points-based reward system.

## Points System Overview
Earn points for completing various job hunting activities. Points track your progress and unlock achievements:

### Point Categories:
- **Daily Tasks**: 1-15 points per task
- **Weekly Assignments**: 15-50 points per assignment
- **Premium Features**: 20-100 points for advanced activities
- **Streaks**: Bonus multipliers for consistency

### Point Values by Activity:
- **Job Application**: 10-15 points
- **LinkedIn Networking**: 5-10 points
- **Follow-up Message**: 8-12 points
- **Interview Preparation**: 15-25 points
- **Resume Update**: 10-20 points
- **Cover Letter Creation**: 8-15 points

## Daily Job Hunting Tasks

### Day-Based Follow-up System
Our intelligent system tracks your job applications and creates follow-up tasks:

#### Day 5 Follow-up Tasks (8-12 points each)
**When**: 5 days after job application
**Purpose**: Show continued interest and professionalism

**Tasks Include:**
1. **Application Status Inquiry** (10 pts)
   - Send polite follow-up email to recruiter/hiring manager
   - Express continued interest in the position
   - Provide any additional information if requested

2. **LinkedIn Connection Request** (8 pts)
   - Connect with hiring manager or recruiter on LinkedIn
   - Send personalized message referencing your application
   - Follow company updates and engage appropriately

**Example Day 5 Follow-up Email:**
\`\`\`
Subject: Following up on [Position Title] Application

Dear [Hiring Manager Name],

I hope this email finds you well. I submitted my application for the [Position Title] role at [Company Name] on [Date] and wanted to follow up to express my continued interest.

I'm particularly excited about [specific aspect of role/company] and believe my experience in [relevant skill/achievement] would add significant value to your team.

Please let me know if you need any additional information from me. I look forward to hearing about next steps.

Best regards,
[Your Name]
\`\`\`

#### Day 6 Follow-up Tasks (10-15 points each)
**When**: 6 days after application
**Purpose**: Demonstrate value and maintain visibility

**Tasks Include:**
1. **Value-Add Content Share** (12 pts)
   - Share relevant industry article on LinkedIn
   - Tag company or mention in thoughtful commentary
   - Demonstrate industry knowledge and engagement

2. **Referral Outreach** (15 pts)
   - Identify employees at target company through LinkedIn
   - Send personalized connection requests
   - Request informational interviews or referrals

#### Day 7 Follow-up Tasks (12-18 points each)
**When**: 7 days after application
**Purpose**: Final professional touch before extended patience

**Tasks Include:**
1. **Thank You + Next Steps** (15 pts)
   - Send final follow-up acknowledging their time
   - Offer to provide additional information
   - Set expectation for future communication

2. **Pipeline Update** (12 pts)
   - Update application status in job tracker
   - Schedule next follow-up if no response
   - Move to appropriate status category

## Weekly Job Hunting Assignments

### Week Structure Overview
Each week includes mandatory and optional assignments targeting different aspects of job searching:

### Weekly Target Metrics (15-week program):
- **15 Job Applications per week** (150-225 points)
- **5 Referral Requests** (50-75 points)  
- **10 Follow-up Messages** (80-120 points)
- **5 LinkedIn Conversations** (50-75 points)

### Weekly Assignment Categories:

#### 1. Application Assignments (15-25 points each)
**Weekly Target**: 15 quality applications

**Tasks Include:**
- **Job Research & Matching** (15 pts)
  - Research company culture, values, recent news
  - Customize resume for role requirements
  - Identify key decision makers

- **Application Customization** (20 pts)
  - Tailor resume to job description (75%+ match)
  - Write compelling cover letter
  - Optimize LinkedIn profile for role

- **Application Submission** (25 pts)
  - Submit through company website when possible
  - Track application in job tracker system
  - Schedule follow-up reminders

#### 2. Networking Assignments (10-20 points each)
**Weekly Target**: 25 networking activities

**Tasks Include:**
- **LinkedIn Outreach** (10 pts per connection)
  - Send 10 personalized connection requests weekly
  - Target industry professionals and alumni
  - Include specific reason for connecting

- **Informational Interviews** (20 pts each)
  - Schedule 2-3 informational interviews weekly
  - Prepare thoughtful questions about role/industry
  - Send thank you notes and maintain relationships

- **Industry Events** (15 pts each)
  - Attend 1-2 virtual or in-person networking events
  - Engage in meaningful conversations
  - Follow up with new connections within 48 hours

#### 3. Skill Development Assignments (20-40 points each)
**Weekly Target**: 2-3 learning activities

**Tasks Include:**
- **Technical Skills** (25 pts each)
  - Complete online course modules
  - Practice coding challenges or relevant skills
  - Update resume with new competencies

- **Interview Preparation** (30 pts each)
  - Practice behavioral interview questions (STAR method)
  - Research common technical questions for role
  - Record mock interview sessions

- **Industry Knowledge** (20 pts each)
  - Read industry reports and trends
  - Follow thought leaders on LinkedIn
  - Share insights through content creation

### Advanced Weekly Assignments (Premium Features)

#### LinkedIn Automation Tasks (25-50 points each)
- **Profile Optimization** (25 pts)
- **Content Strategy** (30 pts)
- **Engagement Campaign** (35 pts)
- **Connection Management** (25 pts)

#### GitHub Profile Enhancement (30-60 points each)
- **Repository Organization** (30 pts)
- **Documentation Updates** (25 pts)
- **Open Source Contributions** (50 pts)
- **Portfolio Showcase** (40 pts)

## Assignment Tracking & Verification

### Automatic Tracking
The system automatically tracks:
- Job applications submitted through integrated platforms
- LinkedIn activities (connections, messages, posts)
- GitHub commits and contributions
- Calendar events and meetings

### Manual Verification Required
Some activities require evidence submission:
- Email screenshots for follow-ups
- Interview confirmations
- Networking event attendance
- Skill certification completions

### Evidence Submission Process:
1. **Capture Evidence**: Screenshots, emails, certificates
2. **Upload to System**: Use evidence upload feature
3. **Admin Review**: 24-48 hour verification process
4. **Points Awarded**: Automatic point allocation upon approval

## Streak System & Bonuses

### Daily Streaks
- **3-day streak**: 1.2x point multiplier
- **7-day streak**: 1.5x point multiplier  
- **14-day streak**: 2x point multiplier
- **30-day streak**: 2.5x point multiplier

### Weekly Consistency Bonuses
- **Complete weekly targets**: 50 bonus points
- **Exceed targets by 25%**: 100 bonus points
- **Perfect week (all tasks)**: 200 bonus points

## Success Metrics & Outcomes

### Weekly Performance Indicators:
- **Application Rate**: Target 15 per week
- **Response Rate**: Track interview requests
- **Network Growth**: LinkedIn connections
- **Skill Progress**: Course completions

### Expected Timeline Results:
- **Week 1-2**: System familiarity, initial applications
- **Week 3-5**: Interview requests, networking momentum
- **Week 6-8**: Multiple interview rounds
- **Week 9-12**: Job offers and negotiations
- **Week 13-15**: Role transition and onboarding

### Success Stories:
> "Following the structured assignment plan, I received 8 interview requests in 4 weeks and landed my dream role at a Fortune 500 company." - Sarah M., Software Engineer

> "The daily follow-up system helped me stay organized and professional. Got 3 job offers after 6 weeks!" - Michael R., Product Manager

## Getting Started

### Step 1: Initialize Your Week
1. Navigate to Job Hunting Assignments page
2. Click "Initialize Job Hunting Tasks"  
3. System creates personalized weekly assignments
4. Review and customize based on your schedule

### Step 2: Set Up Tracking
1. Connect LinkedIn and GitHub accounts
2. Import existing job applications
3. Set up email forwarding for follow-ups
4. Configure notification preferences

### Step 3: Begin Daily Tasks
1. Start with job applications (highest priority)
2. Schedule follow-up tasks automatically
3. Engage in networking activities
4. Track progress in dashboard

### Step 4: Weekly Review
1. Analyze performance metrics
2. Adjust strategies based on results
3. Plan next week's priorities
4. Celebrate achievements and streaks

## Pro Tips for Maximum Success

### Application Strategy:
- Apply early in the week (Monday-Wednesday)
- Target 50% reach roles, 50% target level
- Quality over quantity - research thoroughly
- Use ATS-optimized resume formats

### Follow-up Best Practices:
- Professional but friendly tone
- Add value in each communication
- Respect communication preferences
- Document all interactions

### Networking Excellence:
- Give before you receive
- Maintain long-term relationships
- Be authentic and genuine
- Follow up consistently

### Time Management:
- Block calendar time for job hunting
- Batch similar activities together
- Use templates for efficiency
- Set realistic daily goals

## Troubleshooting Common Challenges

### Low Response Rate:
- Review resume ATS compatibility
- Improve application targeting
- Enhance LinkedIn profile visibility
- Request referrals more actively

### Overwhelming Task Load:
- Prioritize high-value activities
- Use time-blocking techniques
- Leverage automation tools
- Focus on consistency over perfection

### Motivation Issues:
- Track progress visually
- Celebrate small wins
- Join accountability groups
- Remind yourself of career goals

This comprehensive system transforms job hunting from chaotic activity into structured, measurable progress toward career success.`
            }
          ]
        },
        
        {
          id: 'resume-profile',
          name: 'Resume Profile',
          description: 'Build a professional resume that passes ATS and attracts recruiters',
          categoryType: 'documentation',
          displayOrder: 2,
          isActive: true,
          docs: [
            {
              id: 'resume-profile-complete-guide',
              title: 'Complete Resume Profile Building Guide',
              description: 'Master all 9 essential steps to build a professional resume that gets you hired',
              readTime: '25 min read',
              lastUpdated: '2 days ago',
              isPublished: true,
              categoryId: 'resume-profile',
              displayOrder: 1,
              content: `# Complete Resume Profile Building Guide

## Overview
Transform your career prospects with a professionally crafted resume that passes ATS systems and attracts top recruiters. This comprehensive guide walks you through all 9 essential tasks to build a standout resume profile.

## Step 1: Complete Resume Profile Information (8 pts)
Fill out your basic professional information to create the foundation of your resume.

**User Action Steps:**
1. Navigate to Dashboard → Resume Builder → Click "Edit Profile Information"
2. Fill Personal Details: Full Name, Professional Email, Phone, Location, LinkedIn URL
3. Add Professional Summary: 2-3 line professional headline focusing on current role
4. Save and Verify: Check all fields for accuracy

**Success Criteria:** All basic profile fields completed with accurate, professional information.

## Step 2: Add Professional Links Section (8 pts)
Enhance your resume with relevant professional links.

**User Action Steps:**
1. Access "Professional Links" section → Click "Add New Link"
2. Add Essential Links: LinkedIn, GitHub, Portfolio, Professional Blog, Certifications
3. Format and test all links properly
4. Prioritize most relevant links (maximum 4-5)

**Success Criteria:** 3-5 professional links added and verified.

## Step 3: Generate Resume Summary (10 pts)
Create a compelling professional summary using AI assistance.

**User Action Steps:**
1. Navigate to "Professional Summary" → Click "Generate with AI"
2. Provide: Current role, years of experience, top 3 skills, target role
3. Review and customize AI output with specific achievements
4. Keep to 3-4 lines maximum

**Success Criteria:** Compelling 3-4 line professional summary highlighting value proposition.

## Step 4: Generate Top 6 Skills for Your Role (10 pts)
Identify most relevant skills using AI assistance.

**User Action Steps:**
1. Go to "Skills" section → Click "Generate Skills with AI"
2. Input target job title, industry, experience level
3. Review AI suggestions (6 skills ranked by importance)
4. Validate and customize based on actual proficiency

**Success Criteria:** 6 highly relevant skills selected and added.

## Step 5: Add Educational, Certification, Awards Details (10 pts)
Document educational background and achievements.

**User Action Steps:**
1. Add Education: Degree, Institution, Year, GPA (if 3.5+)
2. List Certifications: Include body and expiry dates
3. Add Awards: Professional recognition and achievements
4. Organize by relevance and recency

**Success Criteria:** Complete education section with relevant certifications and awards.

## Step 6: Generate Achievements and Responsibilities (10 pts)
Transform job descriptions into achievement-focused bullet points.

**User Action Steps:**
1. Access "Work Experience" → Click "Generate Achievements" for each role
2. Provide responsibilities and quantifiable results
3. Apply STAR method (Situation, Task, Action, Result)
4. Limit to 3-5 bullet points per role

**Success Criteria:** Each work experience has 3-5 achievement-focused bullet points with metrics.

## Step 7: Upload/Save Primary Resume as Default (10 pts)
Finalize and save resume as default version.

**User Action Steps:**
1. Review complete resume and choose professional template
2. Generate Final Resume and download as PDF
3. Set as Default Resume for applications
4. Proofread and verify formatting

**Success Criteria:** Professional resume saved as default with all sections completed.

## Step 8: Pass Baseline ATS Score (10 pts)
Test resume against ATS systems.

**User Action Steps:**
1. Access "ATS Score Checker" and upload resume
2. Input target job description for analysis
3. Review compatibility score and keyword matches
4. Improve based on feedback and retest

**Success Criteria:** ATS compatibility score of 70% or higher achieved.

## Step 9: Save Cover Letter to Resources Library (10 pts)
Create master cover letter template.

**User Action Steps:**
1. Access "Cover Letter" section → "Create New Cover Letter"
2. Use AI generator with role and company information
3. Create template version with placeholders
4. Save to Resources Library for future use

**Success Criteria:** Professional cover letter template saved to resources library.

## Final Checklist
✅ All 9 Tasks Completed (84 points total)
- Complete Resume Profile Information (8 pts)
- Add Professional Links Section (8 pts) 
- Generate Resume Summary (10 pts)
- Generate Top 6 Skills (10 pts)
- Add Education, Certifications, Awards (10 pts)
- Generate Achievements and Responsibilities (10 pts)
- Upload/Save Primary Resume as Default (10 pts)
- Pass Baseline ATS Score (10 pts)
- Save Cover Letter to Resources Library (10 pts)

Congratulations! You now have a professional, ATS-optimized resume ready for applications.`
            }
          ]
        },
        
        {
          id: 'linkedin-profile',
          name: 'LinkedIn Profile', 
          description: 'Build an engaging LinkedIn profile that attracts opportunities',
          categoryType: 'documentation',
          displayOrder: 2,
          isActive: true,
          docs: [
            {
              id: 'linkedin-profile-7-day-guide',
              title: '7-Day LinkedIn Profile Optimization Plan',
              description: 'Week-long intensive program to transform your LinkedIn presence and boost visibility',
              readTime: '30 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'linkedin-profile',
              displayOrder: 1,
              content: `# 7-Day LinkedIn Profile Optimization Plan

## Overview
Transform your LinkedIn profile into a powerful professional magnet that attracts recruiters, clients, and career opportunities through this intensive 7-day program.

## Day 1: Profile Visibility Boost
**Morning Tasks (30 minutes):**
1. **Profile Photo:** Upload professional headshot with face taking 60% of frame
2. **Headline:** Create compelling headline beyond job title with value proposition
3. **About Section:** Write in first person with achievements and call-to-action

**Afternoon Tasks (45 minutes):**
4. **Experience Enhancement:** Add achievements with quantifiable results
5. **Skills & Endorsements:** Add 50 relevant skills, endorse connections

**Success Metrics:** Profile shows "All-Star", 5+ new connections, 50% more views

## Day 2: Content Posting Mastery
**Tasks:**
1. **Industry Insights Post:** Share trend with professional perspective
2. **Achievement Showcase:** Share recent wins and lessons learned
3. **Engagement:** Comment on 10 posts, share 2 articles

**Success Metrics:** 1 post with 10+ likes, 10 meaningful comments, 3-5 new connections

## Day 3: Networking & Outreach Excellence
**Tasks:**
1. **Strategic Connections:** Send 20 personalized connection requests
2. **Alumni Network:** Connect with school alumni in target companies
3. **Industry Leaders:** Follow and engage with 10 thought leaders

**Success Metrics:** 20 requests sent, 15+ accepted, engaged with 15 leader posts

## Day 4: Authority Building Through Content
**Tasks:**
1. **Educational Post:** Share professional tips and best practices
2. **Industry Analysis:** Analyze recent data and explain implications
3. **Content Curation:** Share 3 articles with commentary

**Success Metrics:** 1 educational post with 15+ likes, 5+ comments received

## Day 5: Engagement & Direct Messaging Strategy
**Tasks:**
1. **Deep Engagement:** Leave substantive comments (3+ sentences)
2. **Strategic Messaging:** Send 5 thoughtful messages to connections
3. **Group Participation:** Join and participate in 3 relevant groups

**Success Metrics:** 5 strategic messages sent, 15 meaningful comments, 3 groups joined

## Day 6: Content Deep Dive & Optimization
**Tasks:**
1. **Performance Analysis:** Review week's content performance
2. **Long-form Article:** Write 1,000-1,500 word comprehensive article
3. **Visual Content:** Create 2-3 professional graphics

**Success Metrics:** Article published, 3 visual pieces created, community discussion started

## Day 7: Reflection, Planning & Future Strategy
**Tasks:**
1. **Performance Review:** Analyze LinkedIn analytics and metrics
2. **Content Calendar:** Plan next month's content themes
3. **Reflection Post:** Share growth journey and insights

**Expected Results:** 200-400% increase in profile views, 50-100 quality connections, established thought leadership

The plan creates sustainable LinkedIn growth through consistent engagement and valuable content sharing.`
            }
          ]
        },

        {
          id: 'github-profile',
          name: 'GitHub Profile',
          description: 'Create an impressive GitHub profile that showcases your technical skills',
          categoryType: 'documentation', 
          displayOrder: 3,
          isActive: true,
          docs: [
            {
              id: 'github-profile-7-day-plan',
              title: '7-Day GitHub Profile Development Plan',
              description: 'Complete guide to building an impressive GitHub profile that attracts opportunities',
              readTime: '35 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'github-profile',
              displayOrder: 1,
              content: `# 7-Day GitHub Profile Development Plan

## Overview
Transform your GitHub profile into a powerful portfolio that showcases coding skills, attracts recruiters, and demonstrates development expertise.

## Day 1: Planning & Setup Foundation
**Morning Tasks (1 hour):**
1. **Account Optimization:** Professional photo, compelling bio, location, email setup
2. **Profile Customization:** Theme selection, GitHub Pages setup, 2FA enabled

**Afternoon Tasks (1.5 hours):**
3. **Repository Planning:** Audit existing repos, plan 3-5 showcase projects
4. **Environment Setup:** Git configuration, SSH keys, development tools

**Success Metrics:** Professional setup complete, 3-5 projects planned, environment configured

## Day 2: Initial Code Commit & Project Foundation
**Morning Tasks (2 hours):**
1. **Web Application Setup:** Create repository with comprehensive README
2. **Commit Best Practices:** Use conventional commit format with clear messages

**Afternoon Tasks (2 hours):**
3. **Core Implementation:** Add basic features with error handling
4. **Version Control:** Meaningful branches, atomic commits, proper .gitignore

**Success Metrics:** First project created, 5-10 meaningful commits, comprehensive documentation

## Day 3: Progress & Documentation Excellence
**Morning Tasks (2 hours):**
1. **Feature Implementation:** Add 2-3 major features with tests
2. **Code Quality:** Refactoring, TypeScript, ESLint/Prettier

**Afternoon Tasks (1.5 hours):**
3. **Advanced Documentation:** API docs, architecture diagrams, troubleshooting
4. **Project Management:** Issue templates, GitHub Projects, labels, milestones

**Success Metrics:** 3+ major features, test coverage, comprehensive docs, second project started

## Day 4: Improve & Showcase Multiple Projects
**Morning Tasks (2 hours):**
1. **Enhancement:** Responsive design, dark mode, performance optimization
2. **Visual Appeal:** Screenshots, demo GIFs, attractive UI design

**Afternoon Tasks (2 hours):**
3. **Second Project:** Core functionality, proper documentation
4. **Profile Enhancement:** Pin repositories, update bio, add topics

**Success Metrics:** Two functional projects, visual documentation, properly tagged repos

## Day 5: Polish & Refactor for Production
**Morning Tasks (2.5 hours):**
1. **Code Refactoring:** Clean architecture, security implementation
2. **Deployment:** Production deployment with CI/CD pipeline

**Afternoon Tasks (2 hours):**
3. **Performance:** Optimization, caching, monitoring
4. **Quality Assurance:** Thorough testing, responsive design verification

**Success Metrics:** Projects deployed with live URLs, CI/CD configured, security implemented

## Day 6: Portfolio Preparation & Advanced Features
**Morning Tasks (2 hours):**
1. **Advanced Features:** Real-time functionality, data visualization
2. **Third Project:** Utility tool with different tech stack

**Afternoon Tasks (2 hours):**
3. **Portfolio Website:** Showcase site for all projects
4. **Open Source:** Meaningful contributions to existing projects

**Success Metrics:** Advanced features implemented, portfolio site created, open source contribution

## Day 7: Review, Plan & Future Strategy
**Morning Tasks (1.5 hours):**
1. **Profile README:** Impressive profile with stats, skills showcase
2. **Analytics Review:** GitHub analytics, repository traffic analysis

**Afternoon Tasks (2 hours):**
3. **Community Engagement:** Star repositories, follow developers, join discussions
4. **Future Planning:** 30-day roadmap, learning schedule, contribution goals

**Expected Results:** 3-5 production projects, 500% increase in profile views, 50-100 repository stars, established developer portfolio

The plan creates a comprehensive GitHub presence demonstrating technical expertise and professional development skills.`
            }
          ]
        }
      ];

      // Video categories with sample content
      const videoCategories: KnowledgeBaseCategory[] = [
        {
          id: 'getting-started',
          name: 'Getting Started',
          categoryType: 'video',
          displayOrder: 1,
          isActive: true,
          videos: [
            {
              id: 'welcome-intro',
              title: 'Welcome to JobHunter4U Platform',
              description: 'Comprehensive introduction to platform features and career growth journey.',
              duration: '5:23',
              instructor: 'Sarah Johnson',
              thumbnail: '/placeholder.svg',
              isPublished: true,
              categoryId: 'getting-started',
              displayOrder: 1
            }
          ]
        },
        {
          id: 'career-development',
          name: 'Career Development',
          categoryType: 'video',
          displayOrder: 2,
          isActive: true,
          videos: [
            {
              id: 'networking-strategies',
              title: 'Professional Networking Strategies',
              description: 'Effective networking techniques for landing dream jobs.',
              duration: '12:30',
              instructor: 'Alex Rivera',
              thumbnail: '/placeholder.svg',
              isPublished: true,
              categoryId: 'career-development',
              displayOrder: 1
            }
          ]
        },
        {
          id: 'technical-skills',
          name: 'Technical Skills',
          categoryType: 'video',
          displayOrder: 3,
          isActive: true,
          videos: [
            {
              id: 'github-portfolio',
              title: 'Building an Impressive GitHub Portfolio',
              description: 'Create a GitHub profile that showcases coding skills.',
              duration: '15:20',
              instructor: 'Ryan Park',
              thumbnail: '/placeholder.svg',
              isPublished: true,
              categoryId: 'technical-skills',
              displayOrder: 1
            }
          ]
        }
      ];

      setVideoData(videoCategories);
      setDocData(profileBuildingDocs);
    } catch (err) {
      console.error('Error loading knowledge base data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load knowledge base content');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoPublishStatus = async (videoId: string, categoryId: string) => {
    try {
      const currentItem = videoData
        .find(cat => cat.id === categoryId)
        ?.videos?.find(video => video.id === videoId);
      
      if (!currentItem) return;

      const newStatus = !currentItem.isPublished;

      setVideoData(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            videos: category.videos?.map(video => 
              video.id === videoId 
                ? { ...video, isPublished: newStatus }
                : video
            )
          };
        }
        return category;
      }));

      toast.success(`Video ${newStatus ? 'published' : 'unpublished'} successfully`);
    } catch (err) {
      console.error('Error toggling video publish status:', err);
      toast.error('Failed to update video status');
    }
  };

  const toggleDocPublishStatus = async (docId: string, categoryId: string) => {
    try {
      const currentItem = docData
        .find(cat => cat.id === categoryId)
        ?.docs?.find(doc => doc.id === docId);
      
      if (!currentItem) return;

      const newStatus = !currentItem.isPublished;

      setDocData(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            docs: category.docs?.map(doc => 
              doc.id === docId 
                ? { ...doc, isPublished: newStatus }
                : doc
            )
          };
        }
        return category;
      }));

      toast.success(`Documentation ${newStatus ? 'published' : 'unpublished'} successfully`);
    } catch (err) {
      console.error('Error toggling doc publish status:', err);
      toast.error('Failed to update documentation status');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    videoData,
    docData,
    toggleVideoPublishStatus,
    toggleDocPublishStatus,
    loading,
    error,
    refetch: fetchData
  };
};