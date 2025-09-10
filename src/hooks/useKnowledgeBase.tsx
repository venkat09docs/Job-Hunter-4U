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
  content?: string;
  categoryId?: string;
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

      const documentationCategories: KnowledgeBaseCategory[] = [
        {
          id: 'profile-building',
          name: 'Profile Building Guides',
          description: 'Build professional profiles across different platforms to showcase your skills',
          categoryType: 'documentation',
          displayOrder: 1,
          isActive: true,
          docs: [
            {
              id: 'resume-profile-guide',
              title: 'Resume Profile Guide',
              description: 'Create a compelling resume that stands out to recruiters and ATS systems',
              readTime: '25 min read',
              lastUpdated: '2 days ago',
              isPublished: true,
              categoryId: 'profile-building',
              displayOrder: 1,
              content: `## Step 1: Resume Foundation Setup
              
**Set up your resume structure with ATS-friendly formatting**

Start by creating a clean, professional resume template:
- Use a simple, readable font (Arial, Calibri, or Times New Roman)
- Set 1-inch margins on all sides
- Use consistent formatting throughout
- Choose a single-column layout for ATS compatibility
- Keep file size under 2MB and save as PDF

**Points System:**
- Complete resume foundation setup: +10 points
- ATS-friendly formatting: +5 points
- Professional font selection: +3 points

## Step 2: Contact Information & Header

**Create a professional header with complete contact details**

Include essential contact information:
- Full name as the largest text at the top
- Professional email address (firstname.lastname@email.com)
- Phone number with area code
- City and state (no full address needed)
- LinkedIn profile URL
- Portfolio/website URL (if applicable)

**Pro Tips:**
- Avoid using "References available upon request"
- Don't include personal photos
- Use a professional email address

**Points System:**
- Complete contact header: +8 points
- Professional email format: +3 points
- LinkedIn URL included: +5 points

## Step 3: Professional Summary

**Write a compelling professional summary that captures attention**

Create a 3-4 line summary that includes:
- Your professional title/role
- Years of experience
- Key skills and specializations
- Career achievements or goals

Example format:
"Marketing professional with 5+ years of experience in digital marketing and brand management. Proven track record of increasing brand awareness by 40% and generating $2M+ in revenue. Expert in SEO, content marketing, and data analytics."

**Points System:**
- Compelling professional summary: +15 points
- Include quantified achievements: +10 points
- Keyword optimization: +5 points

## Step 4: Core Skills Section

**List your technical and soft skills strategically**

Organize skills into categories:
- Technical Skills: Software, programming languages, tools
- Industry Skills: Specific to your field
- Soft Skills: Communication, leadership, project management
- Use bullet points or a table format
- Include skill proficiency levels if relevant

**ATS Optimization:**
- Use keywords from job descriptions
- Include both full terms and acronyms (e.g., "Search Engine Optimization (SEO)")
- Match skills to job requirements

**Points System:**
- Comprehensive skills list: +12 points
- ATS keyword optimization: +8 points
- Skill categorization: +5 points

## Step 5: Professional Experience

**Detail your work history with impact-focused descriptions**

For each role include:
- Company name, job title, dates of employment
- 3-5 bullet points describing achievements
- Use action verbs to start each bullet point
- Quantify results with numbers, percentages, and metrics
- Focus on accomplishments, not just responsibilities

**STAR Method:**
- Situation: Context of your work
- Task: What you were responsible for
- Action: What you did
- Result: Quantifiable outcome

**Points System:**
- Complete work history: +20 points
- Quantified achievements: +15 points
- Action verb usage: +8 points
- STAR method implementation: +10 points

## Step 6: Education & Certifications

**List your educational background and relevant certifications**

Include:
- Degree type, major, university name, graduation year
- GPA (if 3.5 or higher and recent graduate)
- Relevant coursework (for entry-level positions)
- Professional certifications with dates
- Online courses from reputable platforms

**Organization:**
- List in reverse chronological order
- Include certification expiration dates
- Add relevant projects or thesis topics

**Points System:**
- Education details: +10 points
- Relevant certifications: +8 points
- Course project highlights: +5 points

## Step 7: Additional Sections

**Add sections that showcase your unique value**

Optional sections to consider:
- **Projects:** Personal or professional projects with outcomes
- **Publications:** Articles, research, or thought leadership
- **Volunteer Work:** Community involvement and leadership
- **Awards & Recognition:** Professional achievements
- **Languages:** If relevant to the role

**Selection Criteria:**
- Only include sections that add value
- Ensure content is recent and relevant
- Maintain consistent formatting

**Points System:**
- Relevant project showcase: +12 points
- Professional awards: +8 points
- Volunteer leadership: +6 points

## Step 8: ATS Optimization & Keywords

**Optimize your resume for Applicant Tracking Systems**

ATS Optimization Checklist:
- Use standard section headings (Experience, Education, Skills)
- Include keywords from job descriptions
- Avoid graphics, tables, and columns
- Use standard bullet points (not custom symbols)
- Save as PDF with selectable text

**Keyword Research:**
- Study job descriptions in your field
- Include industry-specific terminology
- Balance keyword density naturally
- Use variations of important terms

**Points System:**
- ATS-friendly formatting: +15 points
- Keyword optimization: +10 points
- Standard section headers: +5 points

## Step 9: Proofreading & Final Review

**Ensure your resume is error-free and professional**

Review checklist:
- Grammar and spelling accuracy
- Consistent formatting and fonts
- Proper use of tenses (past for previous roles, present for current)
- Appropriate length (1-2 pages max)
- Contact information accuracy

**Quality Assurance:**
- Read aloud to catch errors
- Use spell-check tools
- Have someone else review it
- Check for consistent date formatting
- Verify all URLs work

**Points System:**
- Error-free content: +20 points
- Professional formatting: +10 points
- Appropriate length: +5 points

## Step 10: Customization & Targeting

**Tailor your resume for specific job applications**

Customization strategies:
- Adjust professional summary for each role
- Prioritize relevant experience
- Include job-specific keywords
- Highlight matching skills and achievements
- Modify project examples to align with role requirements

**Application Tracking:**
- Keep a master resume with all experiences
- Create targeted versions for different roles
- Track which version was sent to which employer
- Monitor response rates and adjust accordingly

**Points System:**
- Job-specific customization: +25 points
- Targeted keyword usage: +15 points
- Application tracking: +10 points

**🎯 Total Points Available: 200 points**

**📊 Point Breakdown:**
- Foundation & Setup: 50 points
- Content Creation: 100 points  
- Optimization: 30 points
- Quality & Targeting: 45 points`
            },
            {
              id: 'linkedin-profile-guide',
              title: 'LinkedIn Profile Guide',
              description: 'Optimize your LinkedIn profile to attract opportunities and build your network',
              readTime: '20 min read',
              lastUpdated: '2 days ago',
              isPublished: true,
              categoryId: 'profile-building',
              displayOrder: 2,
              content: `## Step 1: Professional Profile Photo

**Upload a high-quality, professional headshot**

Your profile photo is the first impression:
- Use a high-resolution image (400x400 pixels minimum)
- Professional attire appropriate for your industry
- Clean background (solid color or subtle pattern)
- Genuine smile and direct eye contact
- Head and shoulders shot with good lighting

**Photo Guidelines:**
- Avoid selfies, group photos, or casual images
- Ensure your face takes up 60% of the frame
- Use natural lighting or professional photography
- Update photo every 2-3 years

**Points System:**
- Professional headshot upload: +15 points
- High-quality image: +8 points
- Industry-appropriate attire: +5 points

## Step 2: Compelling Headline

**Create a headline that showcases your value proposition**

Your headline appears below your name:
- Include your current role or target position
- Add key skills or specializations
- Use industry keywords for searchability
- Keep it under 120 characters

Examples:
- "Senior Marketing Manager | Digital Strategy & Brand Growth Expert"
- "Full-Stack Developer | React, Node.js, AWS | Building Scalable Web Applications"

**Points System:**
- Compelling headline creation: +12 points
- Keyword optimization: +8 points
- Value proposition clarity: +6 points

## Step 3: About Section Optimization

**Write an engaging About section that tells your professional story**

Structure your About section:
- Opening hook with your professional identity
- Career highlights and achievements
- Key skills and expertise areas
- Personal values or mission statement
- Call to action for networking

**Writing Tips:**
- Write in first person
- Use short paragraphs for readability
- Include 2-3 measurable achievements
- Add personality while staying professional
- End with how people can connect with you

**Points System:**
- Complete About section: +20 points
- Measurable achievements: +12 points
- Professional storytelling: +8 points

## Step 4: Experience Section Enhancement

**Optimize your work experience with compelling descriptions**

For each role:
- Use a clear job title and company name
- Include employment dates and location
- Write 3-5 bullet points focusing on achievements
- Quantify results with specific metrics
- Use action verbs to start each bullet

**Achievement Formula:**
Action Verb + Task + Result + Impact
"Increased social media engagement by 150% through strategic content planning, resulting in 50+ new leads monthly"

**Points System:**
- Complete experience entries: +25 points
- Quantified achievements: +15 points
- Action verb usage: +8 points

## Step 5: Skills & Endorsements

**Build a comprehensive skills section with social proof**

Skills strategy:
- List 30+ relevant skills
- Prioritize top 10 skills for your industry
- Include both technical and soft skills
- Ask connections for endorsements
- Endorse others to encourage reciprocity

**Skill Categories:**
- Technical/Hard Skills: Software, tools, certifications
- Industry Skills: Specific to your profession
- Soft Skills: Leadership, communication, problem-solving

**Points System:**
- 30+ skills added: +15 points
- Top skills endorsements: +10 points
- Skill category diversity: +8 points

## Step 6: Education & Certifications

**Showcase your educational background and ongoing learning**

Education section:
- Include degree, institution, and graduation year
- Add relevant coursework or academic achievements
- List professional certifications with dates
- Include online courses and workshops
- Add test scores if impressive (GPA 3.5+, relevant exam scores)

**Certification Priority:**
- Industry-recognized certifications first
- Recent and relevant course completions
- Continuous learning demonstration

**Points System:**
- Complete education details: +12 points
- Professional certifications: +10 points
- Continuous learning evidence: +8 points

## Step 7: Recommendations Strategy

**Build credibility through professional recommendations**

Recommendation approach:
- Request recommendations from supervisors, colleagues, and clients
- Offer to write recommendations for others first
- Provide talking points to recommendation writers
- Aim for 3-5 high-quality recommendations
- Update recommendations annually

**Request Template:**
"Hi [Name], I hope you're doing well. I'm updating my LinkedIn profile and would love a recommendation highlighting our work together on [specific project]. I'd be happy to write one for you as well."

**Points System:**
- 3+ professional recommendations: +20 points
- Diverse recommendation sources: +10 points
- Recent recommendations: +8 points

## Step 8: Content Creation & Sharing

**Build thought leadership through consistent content sharing**

Content strategy:
- Share industry-relevant articles 2-3 times per week
- Write original posts about your expertise
- Comment meaningfully on others' content
- Use relevant hashtags (3-5 per post)
- Engage with your network's content

**Content Types:**
- Industry insights and trends
- Professional achievements and milestones
- Career advice and lessons learned
- Company news and updates
- Educational content and resources

**Points System:**
- Weekly content sharing: +15 points per week
- Original thought leadership: +20 points
- Meaningful engagement: +10 points

## Step 9: Network Building

**Strategically grow your professional network**

Networking tactics:
- Connect with colleagues, industry peers, and thought leaders
- Personalize connection requests with context
- Follow up on new connections with value-add messages
- Join industry groups and participate actively
- Attend virtual and in-person networking events

**Connection Quality:**
- Focus on quality over quantity
- Target connections in your industry or desired roles
- Maintain relationships through regular engagement
- Offer help before asking for favors

**Points System:**
- 500+ quality connections: +15 points
- Personalized connection requests: +10 points
- Active group participation: +12 points

## Step 10: Profile Maintenance & Analytics

**Monitor and continuously improve your LinkedIn presence**

Ongoing optimization:
- Update profile monthly with new achievements
- Monitor profile views and search appearances
- Track which content performs best
- Update skills based on industry trends
- Refresh profile photo annually

**Analytics Tracking:**
- Profile views per month
- Search appearances
- Connection acceptance rate
- Content engagement metrics
- Incoming opportunity messages

**Points System:**
- Monthly profile updates: +10 points
- Analytics monitoring: +8 points
- Profile optimization: +12 points

**🎯 Total Points Available: 250 points**

**📊 Point Breakdown:**
- Profile Setup: 70 points
- Content & Experience: 80 points
- Social Proof: 50 points
- Networking & Growth: 50 points`
            },
            {
              id: 'github-profile-guide',
              title: 'GitHub Profile Guide',
              description: 'Build an impressive GitHub profile that showcases your coding skills and projects',
              readTime: '15 min read',
              lastUpdated: '2 days ago',
              isPublished: true,
              categoryId: 'profile-building',
              displayOrder: 3,
              content: `## Step 1: GitHub Profile Setup

**Create a professional GitHub profile that showcases your coding expertise**

Essential profile elements:
- Professional profile photo (same as LinkedIn for consistency)
- Clear, descriptive bio highlighting your focus areas
- Location and contact information
- Links to portfolio, LinkedIn, and personal website
- Pronouns (optional but inclusive)

**Bio Examples:**
- "Full-Stack Developer passionate about React & Node.js 🚀"
- "Data Scientist | Python & ML enthusiast | Open source contributor"
- "Frontend Developer building accessible web experiences"

**Points System:**
- Complete profile setup: +15 points
- Professional bio: +10 points
- Contact links: +5 points

## Step 2: README Profile Creation

**Build an impressive profile README that appears on your GitHub homepage**

Create a special repository:
- Repository name must match your username exactly
- Add a README.md file to this repository
- Include sections: About Me, Skills, Current Projects, GitHub Stats
- Use markdown formatting for visual appeal
- Add emojis and badges for personality

**README Sections:**
1. Header with name and role
2. About me paragraph
3. Tech stack with icons/badges
4. Current projects and focus
5. GitHub statistics
6. Contact information

**Points System:**
- Profile README creation: +20 points
- Visual enhancements: +10 points
- Complete sections: +15 points

## Step 3: Repository Organization

**Organize and showcase your best coding projects**

Repository best practices:
- Pin 6 of your best repositories
- Use clear, descriptive repository names
- Write comprehensive README files for each project
- Include live demo links when possible
- Add topics/tags for discoverability

**Project Showcase Priority:**
1. Personal projects that solve real problems
2. Open source contributions
3. Learning projects with clear progression
4. Collaboration projects
5. Course projects (if substantial)

**Points System:**
- 6 pinned repositories: +15 points
- Clear project READMEs: +20 points
- Live demo links: +10 points

## Step 4: Code Quality & Documentation

**Ensure your code represents your best work**

Code standards:
- Write clean, readable code with comments
- Use consistent naming conventions
- Include error handling and edge cases
- Write unit tests where appropriate
- Document setup and installation instructions

**Documentation Elements:**
- Project description and purpose
- Installation and setup instructions
- Usage examples and screenshots
- Contributing guidelines
- License information

**Points System:**
- Clean code practices: +20 points
- Comprehensive documentation: +15 points
- Test coverage: +10 points

## Step 5: Contribution Activity

**Maintain consistent coding activity and contributions**

Activity goals:
- Aim for regular commits (daily is ideal)
- Contribute to open source projects
- Create meaningful commit messages
- Maintain green squares on contribution graph
- Participate in coding challenges or hackathons

**Contribution Types:**
- Personal project development
- Open source contributions
- Bug fixes and improvements
- Documentation updates
- Code reviews and discussions

**Points System:**
- Daily coding activity: +5 points per day
- Open source contributions: +15 points each
- Meaningful commit messages: +8 points

## Step 6: Community Engagement

**Engage with the developer community on GitHub**

Engagement activities:
- Star repositories you find useful
- Follow developers you admire
- Contribute to discussions and issues
- Share knowledge through comments
- Help newcomers with their code

**Professional Networking:**
- Follow industry leaders and companies
- Engage with trending repositories
- Participate in GitHub Discussions
- Join organization repositories
- Attend GitHub events and meetups

**Points System:**
- Community participation: +12 points
- Helpful contributions: +8 points
- Professional follows: +5 points

## Step 7: Project Diversity & Skills

**Demonstrate breadth and depth of technical skills**

Project variety:
- Full-stack applications
- Frontend/backend focused projects
- Mobile applications (React Native, Flutter)
- API development and integration
- Database design and management
- DevOps and deployment projects

**Skill Demonstration:**
- Use different programming languages
- Implement various frameworks and libraries
- Show problem-solving abilities
- Display learning progression over time

**Points System:**
- Technology diversity: +18 points
- Skill progression evidence: +12 points
- Complex project completion: +15 points

## Step 8: GitHub Pages & Portfolio

**Create a professional portfolio using GitHub Pages**

Portfolio development:
- Set up GitHub Pages for your account
- Create a personal website showcasing projects
- Include project case studies with process details
- Add contact form and social links
- Optimize for mobile responsiveness

**Portfolio Content:**
- About section with professional photo
- Featured projects with detailed descriptions
- Skills and technologies overview
- Contact information and social links
- Resume download option

**Points System:**
- GitHub Pages portfolio: +25 points
- Professional design: +15 points
- Mobile optimization: +10 points

## Step 9: Advanced GitHub Features

**Leverage advanced GitHub features for professional development**

Advanced features:
- Use GitHub Actions for CI/CD
- Implement automated testing workflows
- Create and use GitHub Templates
- Set up issue and PR templates
- Use GitHub Projects for project management

**Professional Workflows:**
- Automated code formatting and linting
- Continuous integration setup
- Automated deployment processes
- Security scanning and dependency updates

**Points System:**
- CI/CD implementation: +20 points
- Advanced workflow usage: +15 points
- Professional templates: +10 points

## Step 10: Profile Analytics & Growth

**Track and optimize your GitHub profile performance**

Performance monitoring:
- Monitor profile views and repository traffic
- Track which repositories get the most attention
- Analyze contribution patterns and activity
- Review follower growth and engagement
- Monitor job opportunities through GitHub

**Growth Strategies:**
- Contribute to trending technologies
- Create educational content and tutorials
- Participate in coding challenges
- Share projects on social media
- Collaborate with other developers

**Points System:**
- Regular analytics review: +10 points
- Growth strategy implementation: +15 points
- Professional opportunities: +20 points

**🎯 Total Points Available: 300 points**

**📊 Point Breakdown:**
- Profile Foundation: 60 points
- Code Quality & Projects: 120 points
- Community & Growth: 70 points
- Advanced Features: 50 points`
            }
          ]
        },
        {
          id: 'job-hunting',
          name: 'Job Hunting Assignments',
          description: 'Complete job hunting assignments with daily and weekly tasks plus points system',
          categoryType: 'documentation',
          displayOrder: 2,
          isActive: true,
          docs: [
            {
              id: 'job-hunting-complete-guide',
              title: 'Job Hunting Assignments - Complete Guide',
              description: 'Master job hunting with structured daily and weekly assignments, application tracking, and comprehensive points system',
              readTime: '30 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'job-hunting',
              displayOrder: 1,
              content: 'Complete guide for job hunting assignments with daily tasks, weekly goals, and points system for tracking progress.'
            }
          ]
        },
        {
          id: 'linkedin-growth',
          name: 'LinkedIn Growth',
          description: 'Grow your LinkedIn network and professional presence with daily and weekly assignments',
          categoryType: 'documentation',
          displayOrder: 3,
          isActive: true,
          docs: [
            {
              id: 'linkedin-growth-complete-guide',
              title: 'LinkedIn Growth Assignments - Complete Guide',
              description: 'Build your professional network and establish thought leadership through structured LinkedIn activities',
              readTime: '35 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'linkedin-growth',
              displayOrder: 1,
              content: 'Comprehensive guide for LinkedIn growth with networking strategies, content creation, and engagement tactics.'
            }
          ]
        },
        {
          id: 'github-weekly',
          name: 'GitHub Weekly Assignments',
          description: 'Complete GitHub development assignments with daily commits and weekly project goals',
          categoryType: 'documentation',
          displayOrder: 5,
          isActive: true,
          docs: [
            {
              id: 'github-weekly-complete-guide',
              title: 'GitHub Weekly Assignments - Complete Guide',
              description: 'Master GitHub development with structured weekly assignments and daily coding tasks',
              readTime: '45 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'github-weekly',
              displayOrder: 1,
              content: 'Step-by-step guide for GitHub weekly assignments including project development and contribution strategies.'
            }
          ]
        }
      ];

      setDocData(documentationCategories);
    } catch (err) {
      console.error('Error fetching knowledge base data:', err);
      setError('Failed to load knowledge base data');
      toast.error('Failed to load knowledge base data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleDocPublishStatus = (docId: string, categoryId: string) => {
    setDocData(prevData => 
      prevData.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            docs: category.docs?.map(doc => 
              doc.id === docId 
                ? { ...doc, isPublished: !doc.isPublished }
                : doc
            )
          };
        }
        return category;
      })
    );
  };

  const getDocumentById = (docId: string): KnowledgeBaseItem | undefined => {
    for (const category of docData) {
      const doc = category.docs?.find(d => d.id === docId);
      if (doc) return doc;
    }
    return undefined;
  };

  return {
    videoData,
    docData,
    loading,
    error,
    toggleDocPublishStatus,
    getDocumentById,
    refetch: fetchData
  };
};