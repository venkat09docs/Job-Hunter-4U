import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { ResumeProgressBar } from '@/components/ResumeProgressBar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToolChats } from '@/hooks/useToolChats';
import { FileText, Download, CheckCircle, Plus, Minus, Sparkles, FileEdit, ArrowLeft, Save, Eye, StickyNote } from 'lucide-react';

interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa?: string;
}

interface ResumeData {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  interests: string[];
  certifications: string[];
  awards: string[];
  professionalSummary: string;
}

type StatusType = 'draft' | 'finalized' | 'downloaded';
type SectionType = 'personalDetails' | 'experience' | 'education' | 'skills' | 'certifications' | 'summary';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusType>('draft');
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [coverLetterSuggestions, setCoverLetterSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  
  // Job Application Tracker notes
  const JOB_TRACKER_TOOL_ID = '343aeaa1-fe2d-40fb-b660-a2064774bee3';
  const { chats: jobTrackerNotes } = useToolChats(JOB_TRACKER_TOOL_ID);
  
  // Right column state
  const [rightColumnContent, setRightColumnContent] = useState<'suggestions' | 'preview'>('suggestions');
  const [activeSuggestionSection, setActiveSuggestionSection] = useState<SectionType | null>(null);
  
  // Form sections collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personalDetails: false,
    experience: false,
    education: false,
    skills: false,
    certifications: false,
    summary: false
  });

  const [activeTab, setActiveTab] = useState('resume-builder');

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalDetails: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      github: ''
    },
    experience: [{ company: '', role: '', duration: '', description: '' }],
    education: [{ institution: '', degree: '', duration: '', gpa: '' }],
    skills: [''],
    interests: [''],
    certifications: [''],
    awards: [''],
    professionalSummary: ''
  });

  // Use useCallback to prevent re-renders that lose focus
  const updateResumeData = useCallback((updates: Partial<ResumeData>) => {
    setResumeData(prev => ({ ...prev, ...updates }));
  }, []);

  const updatePersonalDetails = useCallback((field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, [field]: value }
    }));
  }, []);

  const updateProfessionalSummary = useCallback((value: string) => {
    setResumeData(prev => ({ ...prev, professionalSummary: value }));
  }, []);

  const [checklist, setChecklist] = useState({
    personalInfo: false,
    experience: false,
    education: false,
    skills: false,
    summary: false
  });

  // Update checklist based on form data
  const updateChecklist = useCallback(() => {
    setChecklist({
      personalInfo: !!(resumeData.personalDetails.fullName && resumeData.personalDetails.email && resumeData.personalDetails.phone),
      experience: resumeData.experience.some(exp => exp.company && exp.role),
      education: resumeData.education.some(edu => edu.institution && edu.degree),
      skills: resumeData.skills.some(skill => skill.trim()),
      summary: !!resumeData.professionalSummary.trim()
    });
  }, [resumeData]);

  // Load existing resume data
  useEffect(() => {
    loadResumeData();
  }, [user]);

  const loadResumeData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const personalDetails = data.personal_details as any || {};
        const experience = Array.isArray(data.experience) ? (data.experience as unknown as Experience[]) : [{ company: '', role: '', duration: '', description: '' }];
        const education = Array.isArray(data.education) ? (data.education as unknown as Education[]) : [{ institution: '', degree: '', duration: '', gpa: '' }];
        const skillsInterests = data.skills_interests as any || {};
        const certAwards = Array.isArray(data.certifications_awards) ? (data.certifications_awards as unknown as string[]) : [''];

        setResumeData({
          personalDetails: {
            fullName: personalDetails.fullName || '',
            email: personalDetails.email || '',
            phone: personalDetails.phone || '',
            location: personalDetails.location || '',
            linkedIn: personalDetails.linkedIn || '',
            github: personalDetails.github || ''
          },
          experience: experience,
          education: education,
          skills: Array.isArray(skillsInterests.skills) ? skillsInterests.skills : [''],
          interests: Array.isArray(skillsInterests.interests) ? skillsInterests.interests : [''],
          certifications: certAwards,
          awards: [''],
          professionalSummary: data.professional_summary || ''
        });
        setStatus(data.status as StatusType || 'draft');
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
    }
  };



  const addArrayItem = useCallback((field: keyof ResumeData, defaultValue: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultValue]
    }));
  }, []);

  const removeArrayItem = useCallback((field: keyof ResumeData, index: number) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  }, []);

  const updateArrayItem = useCallback((field: keyof ResumeData, index: number, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  }, []);

  const updateSkill = useCallback((index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  }, []);

  const updateInterest = useCallback((index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      interests: prev.interests.map((interest, i) => i === index ? value : interest)
    }));
  }, []);

  const updateCertification = useCallback((index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  }, []);

  const updateAward = useCallback((index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      awards: prev.awards.map((award, i) => i === index ? value : award)
    }));
  }, []);

  const generateResumeSuggestions = async () => {
    setLoading(true);
    try {
      // Mock AI suggestions for now
      const suggestions = `Based on your information, here are some resume enhancement suggestions:

**Professional Summary Enhancement:**
Dynamic professional with ${resumeData.experience.length} years of experience in ${resumeData.skills.slice(0, 3).join(', ')}. Proven track record of delivering results and driving innovation.

**Experience Improvements:**
- Quantify your achievements with specific numbers and metrics
- Use action verbs like "Led," "Implemented," "Achieved," "Optimized"
- Focus on results and impact rather than just responsibilities

**Skills Optimization:**
Consider adding these relevant skills: Project Management, Data Analysis, Team Leadership

**Additional Suggestions:**
- Include relevant certifications prominently
- Tailor your resume to specific job descriptions
- Keep it concise but comprehensive (1-2 pages)`;

      setAiSuggestions(suggestions);
      setShowSuggestions(true);
      
      toast({
        title: 'Resume suggestions generated!',
        description: 'Review and edit the AI-generated content below.',
      });
    } catch (error) {
      toast({
        title: 'Error generating suggestions',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const generateCoverLetter = async () => {
    setLoading(true);
    try {
      // Mock cover letter generation
      const coverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the position at your organization. With my background in ${resumeData.skills.slice(0, 2).join(' and ')}, I am confident I would be a valuable addition to your team.

In my previous role at ${resumeData.experience[0]?.company || '[Company]'}, I successfully ${resumeData.experience[0]?.description || 'contributed to key projects and initiatives'}. This experience has prepared me to take on new challenges and contribute meaningfully to your organization.

Key qualifications I bring include:
• ${resumeData.skills.slice(0, 3).join('\n• ')}
• Strong problem-solving and analytical abilities
• Excellent communication and collaboration skills

I am excited about the opportunity to discuss how my skills and experience align with your needs. Thank you for considering my application.

Sincerely,
${resumeData.personalDetails.fullName}`;

      setCoverLetterSuggestions(coverLetter);
      setShowCoverLetter(true);
      
      toast({
        title: 'Cover letter generated!',
        description: 'Review and customize the generated cover letter.',
      });
    } catch (error) {
      toast({
        title: 'Error generating cover letter',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const saveToSupabase = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use the new upsert function for proper data persistence
      const { data, error } = await supabase.rpc('upsert_resume_data', {
        p_user_id: user.id,
        p_personal_details: resumeData.personalDetails as any,
        p_experience: resumeData.experience as any,
        p_education: resumeData.education as any,
        p_skills_interests: {
          skills: resumeData.skills.filter(skill => skill.trim()),
          interests: resumeData.interests.filter(interest => interest.trim())
        } as any,
        p_certifications_awards: [
          ...resumeData.certifications.filter(cert => cert.trim()),
          ...resumeData.awards.filter(award => award.trim())
        ] as any,
        p_professional_summary: resumeData.professionalSummary,
        p_status: 'finalized'
      });

      if (error) throw error;

      setStatus('finalized');
      toast({
        title: 'Resume saved successfully!',
        description: 'Your resume data has been saved permanently to your profile.',
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Error saving resume',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const downloadResume = () => {
    // Create a temporary div to render the resume
    const resumeElement = document.createElement('div');
    resumeElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${resumeData.personalDetails.fullName}</h1>
          <div style="margin-top: 10px; font-size: 14px;">
            ${resumeData.personalDetails.email} | ${resumeData.personalDetails.phone} | ${resumeData.personalDetails.location}
            ${resumeData.personalDetails.linkedIn ? `| LinkedIn: ${resumeData.personalDetails.linkedIn}` : ''}
            ${resumeData.personalDetails.github ? `| GitHub: ${resumeData.personalDetails.github}` : ''}
          </div>
        </div>

        <!-- Professional Summary -->
        ${resumeData.professionalSummary ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Professional Summary</h2>
          <p>${resumeData.professionalSummary}</p>
        </div>
        ` : ''}

        <!-- Experience -->
        ${resumeData.experience.filter(exp => exp.company && exp.role).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Experience</h2>
          ${resumeData.experience.filter(exp => exp.company && exp.role).map(exp => `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 style="margin: 0; font-size: 16px;">${exp.role} at ${exp.company}</h3>
              <span style="font-style: italic; color: #666;">${exp.duration}</span>
            </div>
            <p style="margin: 5px 0 0 0;">${exp.description}</p>
          </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${resumeData.education.filter(edu => edu.institution && edu.degree).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Education</h2>
          ${resumeData.education.filter(edu => edu.institution && edu.degree).map(edu => `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 style="margin: 0; font-size: 16px;">${edu.degree} - ${edu.institution}</h3>
              <span style="font-style: italic; color: #666;">${edu.duration}</span>
            </div>
            ${edu.gpa ? `<p style="margin: 5px 0 0 0;">GPA: ${edu.gpa}</p>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${resumeData.skills.filter(skill => skill.trim()).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Skills</h2>
          <p>${resumeData.skills.filter(skill => skill.trim()).join(' • ')}</p>
        </div>
        ` : ''}

        <!-- Certifications -->
        ${resumeData.certifications.filter(cert => cert.trim()).length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Certifications</h2>
          <ul>
            ${resumeData.certifications.filter(cert => cert.trim()).map(cert => `<li>${cert}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    `;

    // Create and trigger download
    const blob = new Blob([resumeElement.innerHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resumeData.personalDetails.fullName || 'Resume'}_Resume.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatus('downloaded');
    toast({
      title: 'Resume downloaded!',
      description: 'Your resume has been downloaded as an HTML file.',
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'finalized':
        return <Badge variant="default">Finalized</Badge>;
      case 'downloaded':
        return <Badge variant="outline" className="border-green-500 text-green-600">Downloaded</Badge>;
    }
  };

  const saveSection = useCallback(async (sectionName: string) => {
    if (!user) {
      console.error('No user found for save operation');
      return;
    }
    
    console.log('Saving section:', sectionName, 'for user:', user.id);
    console.log('Resume data to save:', resumeData);
    
    try {
      // Use the new upsert function for proper data persistence
      console.log('Calling upsert_resume_data function...');
      const { data, error } = await supabase.rpc('upsert_resume_data', {
        p_user_id: user.id,
        p_personal_details: resumeData.personalDetails as any,
        p_experience: resumeData.experience as any,
        p_education: resumeData.education as any,
        p_skills_interests: {
          skills: resumeData.skills.filter(skill => skill.trim()),
          interests: resumeData.interests.filter(interest => interest.trim())
        } as any,
        p_certifications_awards: [
          ...resumeData.certifications.filter(cert => cert.trim()),
          ...resumeData.awards.filter(award => award.trim())
        ] as any,
        p_professional_summary: resumeData.professionalSummary,
        p_status: status
      });

      console.log('Upsert result - data:', data, 'error:', error);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Section saved successfully:', sectionName);
      setRightColumnContent('preview');
      toast({
        title: `${sectionName} saved!`,
        description: 'Your changes have been saved permanently.',
      });
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: 'Error saving section',
        description: `Error: ${error?.message || 'Please try again later.'}`,
        variant: 'destructive'
      });
    }
  }, [user, resumeData, status]);

  const getSuggestions = (section: SectionType) => {
    const suggestions = {
      personalDetails: [
        "Use a professional email address",
        "Ensure phone number is current and professional", 
        "Include your LinkedIn profile URL",
        "Keep personal details concise and professional",
        "Use consistent formatting throughout"
      ],
      experience: [
        "Use action verbs to start each bullet point",
        "Quantify achievements with numbers and percentages",
        "Focus on accomplishments, not just responsibilities", 
        "Include relevant keywords from job descriptions",
        "Keep descriptions concise but impactful"
      ],
      education: [
        "List education in reverse chronological order",
        "Include GPA if 3.5 or higher",
        "Add relevant coursework for entry-level positions",
        "Include academic honors and achievements", 
        "Mention relevant projects or thesis topics"
      ],
      skills: [
        "Organize skills by category (Technical, Soft Skills, etc.)",
        "Include both hard and soft skills",
        "Match skills to job requirements",
        "Be honest about proficiency levels",
        "Include relevant certifications and tools"
      ],
      certifications: [
        "List certifications in reverse chronological order", 
        "Include expiration dates if applicable",
        "Add professional awards and recognitions",
        "Include relevant volunteer work",
        "Mention publications or speaking engagements"
      ],
      summary: [
        "Keep it concise (3-4 sentences)",
        "Highlight your unique value proposition",
        "Include years of experience and key skills",
        "Tailor to the specific role you're applying for",
        "Use keywords from the job description"
      ]
    };
    
    return suggestions[section] || [];
  };

  // Get job tracker notes content for suggestions
  const getJobTrackerNotes = () => {
    if (!jobTrackerNotes || jobTrackerNotes.length === 0) {
      return [];
    }
    
    return jobTrackerNotes.map(note => ({
      title: note.title,
      content: note.messages[0]?.content || 'No content',
      createdAt: note.created_at
    }));
  };

  const generateResumePreview = () => {
    return (
      <div className="space-y-6 text-sm bg-white p-6 rounded-lg border max-w-full">
        {/* Header - ATS Optimized */}
        {resumeData.personalDetails.fullName && (
          <div className="border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{resumeData.personalDetails.fullName}</h1>
            <div className="text-gray-700 space-y-1">
              {resumeData.personalDetails.email && <div>{resumeData.personalDetails.email}</div>}
              {resumeData.personalDetails.phone && <div>{resumeData.personalDetails.phone}</div>}
              {resumeData.personalDetails.linkedIn && <div>{resumeData.personalDetails.linkedIn}</div>}
            </div>
          </div>
        )}

        {/* Professional Summary - ATS Optimized */}
        {resumeData.professionalSummary && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">PROFESSIONAL SUMMARY</h2>
            <p className="text-gray-700 leading-relaxed">{resumeData.professionalSummary}</p>
          </div>
        )}

        {/* Experience - ATS Optimized */}
        {resumeData.experience.some(exp => exp.company || exp.role) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">WORK EXPERIENCE</h2>
            <div className="space-y-4">
              {resumeData.experience.map((exp, index) => (
                (exp.company || exp.role) && (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-gray-900">{exp.role}</h3>
                        <p className="font-semibold text-gray-700">{exp.company}</p>
                      </div>
                      {exp.duration && <span className="text-gray-600 font-medium">{exp.duration}</span>}
                    </div>
                    {exp.description && (
                      <div className="text-gray-700 mt-2">
                        {exp.description.split('\n').map((line, i) => (
                          <div key={i} className="mb-1">• {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Education - ATS Optimized */}
        {resumeData.education.some(edu => edu.institution || edu.degree) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">EDUCATION</h2>
            <div className="space-y-3">
              {resumeData.education.map((edu, index) => (
                (edu.institution || edu.degree) && (
                  <div key={index}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                        <p className="font-semibold text-gray-700">{edu.institution}</p>
                        {edu.gpa && <p className="text-gray-600">GPA: {edu.gpa}</p>}
                      </div>
                      {edu.duration && <span className="text-gray-600 font-medium">{edu.duration}</span>}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Skills - ATS Optimized */}
        {resumeData.skills.some(skill => skill.trim()) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">SKILLS</h2>
            <div className="text-gray-700">
              {resumeData.skills.filter(skill => skill.trim()).join(' • ')}
            </div>
          </div>
        )}

        {/* Interests - ATS Optimized */}
        {resumeData.interests.some(interest => interest.trim()) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">INTERESTS</h2>
            <div className="text-gray-700">
              {resumeData.interests.filter(interest => interest.trim()).join(' • ')}
            </div>
          </div>
        )}

        {/* Certifications - ATS Optimized */}
        {resumeData.certifications.some(cert => cert.trim()) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">CERTIFICATIONS</h2>
            <div className="space-y-1">
              {resumeData.certifications.filter(cert => cert.trim()).map((cert, index) => (
                <div key={index} className="text-gray-700">• {cert}</div>
              ))}
            </div>
          </div>
        )}

        {/* Awards - ATS Optimized */}
        {resumeData.awards.some(award => award.trim()) && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">AWARDS</h2>
            <div className="space-y-1">
              {resumeData.awards.filter(award => award.trim()).map((award, index) => (
                <div key={index} className="text-gray-700">• {award}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSectionToggle = useCallback((sectionKey: string) => {
    const isOpening = !openSections[sectionKey];
    setOpenSections(prev => ({ ...prev, [sectionKey]: isOpening }));
    
    if (isOpening) {
      // Show suggestions when opening a section
      setActiveSuggestionSection(sectionKey as SectionType);
      setRightColumnContent('suggestions');
    } else {
      // Show preview when closing a section
      setRightColumnContent('preview');
    }
  }, [openSections]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Resume & Cover Letter Builder
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SubscriptionStatus />
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resume-builder">Resume Builder</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
              <TabsTrigger value="resume-analyzer">Resume Analyzer</TabsTrigger>
            </TabsList>

            <TabsContent value="resume-builder" className="space-y-6 mt-6">
              {/* Progress Bar */}
              <ResumeProgressBar resumeData={resumeData} />
              
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Form */}
                <div className="col-span-8 space-y-6">
                  <CollapsibleSection 
                    title="Personal Details" 
                    sectionKey="personalDetails"
                    isOpen={openSections.personalDetails}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                           <Input 
                             id="fullName"
                             value={resumeData.personalDetails.fullName}
                             onChange={(e) => updatePersonalDetails('fullName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                           <Input 
                             id="email"
                             type="email"
                             value={resumeData.personalDetails.email}
                             onChange={(e) => updatePersonalDetails('email', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                           <Input 
                             id="phone"
                             value={resumeData.personalDetails.phone}
                             onChange={(e) => updatePersonalDetails('phone', e.target.value)}
                        />
                      </div>
                       <div>
                         <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                            <Input 
                              id="linkedin"
                              value={resumeData.personalDetails.linkedIn || ''}
                              onChange={(e) => updatePersonalDetails('linkedIn', e.target.value)}
                         />
                       </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection 
                    title="Professional Summary" 
                    sectionKey="summary"
                    isOpen={openSections.summary}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                       <Textarea 
                         placeholder="Write a compelling professional summary..."
                         value={resumeData.professionalSummary}
                         onChange={(e) => updateProfessionalSummary(e.target.value)}
                      rows={4}
                    />
                  </CollapsibleSection>

                  {/* Experience */}
                  <CollapsibleSection 
                    title="Experience" 
                    sectionKey="experience"
                    isOpen={openSections.experience}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', description: '' })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      {resumeData.experience.map((exp, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Experience {index + 1}</h4>
                            {resumeData.experience.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeArrayItem('experience', index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Company</Label>
                              <Input 
                                value={exp.company}
                                 onChange={(e) => updateArrayItem('experience', index, { ...exp, company: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Input 
                                value={exp.role}
                                 onChange={(e) => updateArrayItem('experience', index, { ...exp, role: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <Input 
                                placeholder="e.g., Jan 2020 - Dec 2022"
                                value={exp.duration}
                                onChange={(e) => updateArrayItem('experience', index, { ...exp, duration: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea 
                              placeholder="Describe your responsibilities and achievements..."
                              value={exp.description}
                              onChange={(e) => updateArrayItem('experience', index, { ...exp, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Education */}
                  <CollapsibleSection 
                    title="Education Details" 
                    sectionKey="education"
                    isOpen={openSections.education}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                    <div className="space-y-6">
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addArrayItem('education', { institution: '', degree: '', duration: '', gpa: '' })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                      {resumeData.education.map((edu, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Education {index + 1}</h4>
                            {resumeData.education.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeArrayItem('education', index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Institution</Label>
                              <Input 
                                value={edu.institution}
                                 onChange={(e) => updateArrayItem('education', index, { ...edu, institution: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Degree</Label>
                              <Input 
                                value={edu.degree}
                                 onChange={(e) => updateArrayItem('education', index, { ...edu, degree: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Duration</Label>
                              <Input 
                                placeholder="e.g., 2018 - 2022"
                                value={edu.duration}
                                onChange={(e) => updateArrayItem('education', index, { ...edu, duration: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>GPA (Optional)</Label>
                              <Input 
                                value={edu.gpa}
                                onChange={(e) => updateArrayItem('education', index, { ...edu, gpa: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Skills & Interests */}
                  <CollapsibleSection 
                    title="Key Skills & Interests" 
                    sectionKey="skills"
                    isOpen={openSections.skills}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Key Skills</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addArrayItem('skills', '')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {resumeData.skills.map((skill, index) => (
                            <div key={index} className="flex gap-2">
                               <Input 
                                 value={skill}
                                 onChange={(e) => updateSkill(index, e.target.value)}
                                 placeholder="Enter a skill"
                               />
                              {resumeData.skills.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeArrayItem('skills', index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Interests</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addArrayItem('interests', '')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {resumeData.interests.map((interest, index) => (
                            <div key={index} className="flex gap-2">
                              <Input 
                                value={interest}
                                 onChange={(e) => updateInterest(index, e.target.value)}
                                placeholder="Enter an interest"
                              />
                              {resumeData.interests.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeArrayItem('interests', index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Certifications & Awards */}
                  <CollapsibleSection 
                    title="Certifications & Awards" 
                    sectionKey="certifications"
                    isOpen={openSections.certifications}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Certifications</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addArrayItem('certifications', '')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {resumeData.certifications.map((cert, index) => (
                            <div key={index} className="flex gap-2">
                              <Input 
                                value={cert}
                                 onChange={(e) => updateCertification(index, e.target.value)}
                                placeholder="Enter a certification"
                              />
                              {resumeData.certifications.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeArrayItem('certifications', index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Awards</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addArrayItem('awards', '')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {resumeData.awards.map((award, index) => (
                            <div key={index} className="flex gap-2">
                              <Input 
                                value={award}
                                 onChange={(e) => updateAward(index, e.target.value)}
                                placeholder="Enter an award"
                              />
                              {resumeData.awards.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeArrayItem('awards', index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={generateResumeSuggestions}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Resume Suggestions
                    </Button>
                    <Button 
                      onClick={saveToSupabase}
                      disabled={loading}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Save Final Version
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={downloadResume}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Resume
                    </Button>
                  </div>

                  {/* AI Suggestions */}
                  {showSuggestions && (
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Resume Suggestions</CardTitle>
                        <CardDescription>
                          Review and edit these AI-generated suggestions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea 
                          value={aiSuggestions}
                          onChange={(e) => setAiSuggestions(e.target.value)}
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Suggestions/Preview */}
                <div className="col-span-4">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {rightColumnContent === 'suggestions' ? (
                            <>
                              <Sparkles className="h-5 w-5" />
                              Suggestions
                            </>
                          ) : (
                            <>
                              <Eye className="h-5 w-5" />
                              Resume Preview
                            </>
                          )}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant={rightColumnContent === 'suggestions' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setRightColumnContent('suggestions')}
                          >
                            Tips
                          </Button>
                          <Button
                            variant={rightColumnContent === 'preview' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setRightColumnContent('preview')}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                       {rightColumnContent === 'suggestions' ? (
                         <div className="space-y-4">
                           {activeSuggestionSection ? (
                             <div className="space-y-6">
                               <div>
                                 <h4 className="font-medium mb-3 capitalize">
                                   {activeSuggestionSection.replace(/([A-Z])/g, ' $1').trim()} Tips
                                 </h4>
                                 <ul className="space-y-2 text-sm">
                                   {getSuggestions(activeSuggestionSection).map((suggestion, index) => (
                                     <li key={index} className="flex gap-2">
                                       <span className="text-primary">•</span>
                                       <span>{suggestion}</span>
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                               
                               {/* Job Tracker Notes */}
                               <div>
                                 <h4 className="font-medium mb-3 flex items-center gap-2">
                                   <StickyNote className="h-4 w-4" />
                                   Your Job Tracker Notes
                                 </h4>
                                 <div className="space-y-2 max-h-48 overflow-y-auto">
                                   {getJobTrackerNotes().length > 0 ? (
                                     getJobTrackerNotes().map((note, index) => (
                                       <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                                         <h5 className="font-medium text-sm mb-1">{note.title}</h5>
                                         <p className="text-xs text-muted-foreground mb-2">
                                           {new Date(note.createdAt).toLocaleDateString()}
                                         </p>
                                         <p className="text-sm text-foreground/80 line-clamp-3">
                                           {note.content}
                                         </p>
                                       </div>
                                     ))
                                   ) : (
                                     <p className="text-sm text-muted-foreground">
                                       No notes found in Job Application Tracker & Checklist. 
                                       Create notes there to see them here.
                                     </p>
                                   )}
                                 </div>
                               </div>
                             </div>
                           ) : (
                             <div className="space-y-6">
                               <div className="text-center text-muted-foreground">
                                 <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                 <p>Click on a section to see specific tips and suggestions</p>
                               </div>
                               
                               {/* Show all notes when no section is active */}
                               <div>
                                 <h4 className="font-medium mb-3 flex items-center gap-2">
                                   <StickyNote className="h-4 w-4" />
                                   Your Job Tracker Notes
                                 </h4>
                                 <div className="space-y-2 max-h-64 overflow-y-auto">
                                   {getJobTrackerNotes().length > 0 ? (
                                     getJobTrackerNotes().map((note, index) => (
                                       <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                                         <h5 className="font-medium text-sm mb-1">{note.title}</h5>
                                         <p className="text-xs text-muted-foreground mb-2">
                                           {new Date(note.createdAt).toLocaleDateString()}
                                         </p>
                                         <p className="text-sm text-foreground/80 line-clamp-3">
                                           {note.content}
                                         </p>
                                       </div>
                                     ))
                                   ) : (
                                     <p className="text-sm text-muted-foreground">
                                       No notes found in Job Application Tracker & Checklist. 
                                       Create notes there to see them here.
                                     </p>
                                   )}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          {generateResumePreview()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cover Letter Generator</CardTitle>
                  <CardDescription>
                    Generate a personalized cover letter based on your resume data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={generateCoverLetter}
                    disabled={loading}
                    className="gap-2"
                  >
                    <FileEdit className="h-4 w-4" />
                    Generate Cover Letter
                  </Button>

                  {showCoverLetter && (
                    <div className="space-y-4">
                      <Label>Generated Cover Letter (Editable)</Label>
                      <Textarea 
                        value={coverLetterSuggestions}
                        onChange={(e) => setCoverLetterSuggestions(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm">Save Cover Letter</Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="resume-analyzer" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Analyzer</CardTitle>
                  <CardDescription>
                    Coming soon - Analyze your resume for ATS compatibility and optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Resume analysis feature will be available soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;