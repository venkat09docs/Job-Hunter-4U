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
          id: 'resume-profile',
          name: 'Resume Profile',
          description: 'Build a professional resume that passes ATS and attracts recruiters',
          categoryType: 'documentation',
          displayOrder: 1,
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