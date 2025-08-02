import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { ResumeProgressBar } from '@/components/ResumeProgressBar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToolChats } from '@/hooks/useToolChats';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { FileText, Download, CheckCircle, Plus, Minus, Sparkles, FileEdit, ArrowLeft, Save, Eye, StickyNote, ChevronDown } from 'lucide-react';

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
type SectionType = 'personalDetails' | 'experience' | 'education' | 'skills' | 'interests' | 'certifications' | 'awards' | 'summary';

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
    interests: false,
    certifications: false,
    awards: false,
    summary: false
  });

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'resume-builder';
  });

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
    if (showSuggestions) {
      // Close suggestions if already open
      setShowSuggestions(false);
      setAiSuggestions('');
      return;
    }

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

  const saveFinalVersion = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First check how many saved resumes the user already has
      const { data: existingSaves, error: countError } = await supabase
        .from('saved_resumes')
        .select('id')
        .eq('user_id', user.id);

      if (countError) throw countError;

      if (existingSaves && existingSaves.length >= 5) {
        toast({
          title: 'Maximum saves reached',
          description: 'You can only save up to 5 resume versions. Please delete some older versions from your Library.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Generate PDF and Word documents
      const currentDate = new Date();
      const timestamp = currentDate.toISOString().slice(0, 19).replace(/:/g, '-');
      const title = `Resume_${timestamp}`;

      // Generate PDF blob
      const pdfBlob = await generatePDFBlob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Generate Word blob  
      const wordBlob = await generateWordBlob();
      const wordUrl = URL.createObjectURL(wordBlob);

      // Save to saved_resumes table
      const { error: saveError } = await supabase
        .from('saved_resumes')
        .insert({
          user_id: user.id,
          title: title,
          resume_data: resumeData as any,
          word_url: wordUrl,
          pdf_url: pdfUrl,
        });

      if (saveError) throw saveError;

      // Also save to resume_data table
      await saveToSupabase();

      toast({
        title: 'Final version saved!',
        description: 'Your resume has been saved to your Library with downloadable PDF and Word versions.',
      });
    } catch (error) {
      console.error('Error saving final version:', error);
      toast({
        title: 'Error saving final version',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // ATS-friendly helper function
    const addATSText = (text: string, fontSize: number = 11, isBold: boolean = false, isHeader: boolean = false) => {
      // Use ATS-friendly fonts
      if (isBold || isHeader) {
        pdf.setFont('arial', 'bold');
      } else {
        pdf.setFont('arial', 'normal');
      }
      
      pdf.setFontSize(fontSize);
      
      // Handle page breaks
      if (currentY > 270) {
        pdf.addPage();
        currentY = margin;
      }
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach((line: string) => {
        if (currentY > 270) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += fontSize * 0.4;
      });
      
      // Add spacing after sections
      if (isHeader) {
        currentY += 3;
      } else {
        currentY += 2;
      }
    };

    // Contact Information (ATS Standard)
    addATSText(resumeData.personalDetails.fullName, 16, true);
    currentY += 2;
    
    const contactDetails = [];
    if (resumeData.personalDetails.email) contactDetails.push(`Email: ${resumeData.personalDetails.email}`);
    if (resumeData.personalDetails.phone) contactDetails.push(`Phone: ${resumeData.personalDetails.phone}`);
    if (resumeData.personalDetails.location) contactDetails.push(`Location: ${resumeData.personalDetails.location}`);
    if (resumeData.personalDetails.linkedIn) contactDetails.push(`LinkedIn: ${resumeData.personalDetails.linkedIn}`);
    if (resumeData.personalDetails.github) contactDetails.push(`GitHub: ${resumeData.personalDetails.github}`);
    
    contactDetails.forEach(detail => {
      addATSText(detail, 10);
    });
    currentY += 8;

    // Professional Summary (ATS Section)
    if (resumeData.professionalSummary) {
      addATSText('PROFESSIONAL SUMMARY', 12, true, true);
      addATSText(resumeData.professionalSummary, 11);
      currentY += 8;
    }

    // Key Skills (ATS Section)
    const validSkills = resumeData.skills.filter(skill => skill.trim());
    if (validSkills.length > 0) {
      addATSText('KEY SKILLS', 12, true, true);
      validSkills.forEach(skill => {
        addATSText(`• ${skill.trim()}`, 10);
      });
      currentY += 8;
    }

    // Education (ATS Standard)
    const validEducation = resumeData.education.filter(edu => edu.institution && edu.degree);
    if (validEducation.length > 0) {
      addATSText('EDUCATION', 12, true, true);
      validEducation.forEach(edu => {
        addATSText(edu.degree, 11, true);
        addATSText(`${edu.institution} | ${edu.duration}`, 10);
        if (edu.gpa) {
          addATSText(`GPA: ${edu.gpa}`, 10);
        }
        currentY += 3;
      });
      currentY += 3;
    }

    // Work Experience (ATS Standard)
    const validExperience = resumeData.experience.filter(exp => exp.company && exp.role);
    if (validExperience.length > 0) {
      addATSText('WORK EXPERIENCE', 12, true, true);
      validExperience.forEach(exp => {
        addATSText(exp.role, 11, true);
        addATSText(`${exp.company} | ${exp.duration}`, 10);
        if (exp.description) {
          addATSText(exp.description, 10);
        }
        currentY += 5;
      });
    }

    // Certifications (ATS Section)
    const validCertifications = resumeData.certifications.filter(cert => cert.trim());
    if (validCertifications.length > 0) {
      addATSText('CERTIFICATIONS', 12, true, true);
      validCertifications.forEach(cert => {
        addATSText(`• ${cert.trim()}`, 10);
      });
      currentY += 8;
    }

    // Awards (ATS Section)
    const validAwards = resumeData.awards.filter(award => award.trim());
    if (validAwards.length > 0) {
      addATSText('AWARDS', 12, true, true);
      validAwards.forEach(award => {
        addATSText(`• ${award.trim()}`, 10);
      });
      currentY += 8;
    }

    // Interests (ATS Section)
    const validInterests = resumeData.interests.filter(interest => interest.trim());
    if (validInterests.length > 0) {
      addATSText('INTERESTS', 12, true, true);
      addATSText(validInterests.join(', '), 10);
    }

    return pdf.output('blob');
  };

  const generateWordBlob = async (): Promise<Blob> => {
    const doc = new Document({
      creator: "Digital Career Hub Resume Builder",
      title: `${resumeData.personalDetails.fullName} - Resume`,
      description: "ATS-Optimized Resume",
      styles: {
        paragraphStyles: [{
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: {
            bold: true,
            size: 24,
            font: "Arial",
          },
          paragraph: {
            spacing: { after: 120 },
          },
        }],
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Contact Information Header (ATS Standard)
          new Paragraph({
            children: [
              new TextRun({
                text: resumeData.personalDetails.fullName,
                bold: true,
                font: "Arial",
                size: 32, // 16pt
              }),
            ],
            spacing: { after: 100 },
          }),

          ...(resumeData.personalDetails.email ? [new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${resumeData.personalDetails.email}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.phone ? [new Paragraph({
            children: [
              new TextRun({
                text: `Phone: ${resumeData.personalDetails.phone}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.location ? [new Paragraph({
            children: [
              new TextRun({
                text: `Location: ${resumeData.personalDetails.location}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.linkedIn ? [new Paragraph({
            children: [
              new TextRun({
                text: `LinkedIn: ${resumeData.personalDetails.linkedIn}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.github ? [new Paragraph({
            children: [
              new TextRun({
                text: `GitHub: ${resumeData.personalDetails.github}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          })] : []),

          // Professional Summary (ATS Section)
          ...(resumeData.professionalSummary ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "PROFESSIONAL SUMMARY",
                  bold: true,
                  font: "Arial",
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.professionalSummary,
                  font: "Arial",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Key Skills (ATS Section)
          ...(resumeData.skills.filter(skill => skill.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "KEY SKILLS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.skills.filter(skill => skill.trim()).map(skill =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${skill.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Education (ATS Format)
          ...(resumeData.education.filter(edu => edu.institution && edu.degree).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "EDUCATION",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.education.filter(edu => edu.institution && edu.degree).flatMap(edu => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: edu.degree,
                    bold: true,
                    font: "Arial",
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.institution} | ${edu.duration}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              }),
              ...(edu.gpa ? [new Paragraph({
                children: [
                  new TextRun({
                    text: `GPA: ${edu.gpa}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              })] : [new Paragraph({ text: "", spacing: { after: 100 } })]),
            ]),
          ] : []),

          // Work Experience (ATS Standard)
          ...(resumeData.experience.filter(exp => exp.company && exp.role).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "WORK EXPERIENCE",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.experience.filter(exp => exp.company && exp.role).flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.role,
                    bold: true,
                    font: "Arial",
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.company} | ${exp.duration}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              }),
              ...(exp.description ? [new Paragraph({
                children: [
                  new TextRun({
                    text: exp.description,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 150 },
              })] : [new Paragraph({ text: "", spacing: { after: 100 } })]),
            ]),
          ] : []),

          // Certifications (ATS Section)
          ...(resumeData.certifications.filter(cert => cert.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "CERTIFICATIONS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.certifications.filter(cert => cert.trim()).map(cert =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${cert.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Awards (ATS Section)
          ...(resumeData.awards.filter(award => award.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "AWARDS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.awards.filter(award => award.trim()).map(award =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${award.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Interests (ATS Section) 
          ...(resumeData.interests.filter(interest => interest.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "INTERESTS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.interests.filter(interest => interest.trim()).join(', '),
                  font: "Arial",
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            }),
          ] : []),
        ],
      }],
    });

    return await Packer.toBlob(doc);
  };

  const downloadResumeAsPDF = () => {
    console.log('Downloading PDF...');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // ATS-friendly helper function
    const addATSText = (text: string, fontSize: number = 11, isBold: boolean = false, isHeader: boolean = false) => {
      // Use ATS-friendly fonts
      if (isBold || isHeader) {
        pdf.setFont('arial', 'bold');
      } else {
        pdf.setFont('arial', 'normal');
      }
      
      pdf.setFontSize(fontSize);
      
      // Handle page breaks
      if (currentY > 270) {
        pdf.addPage();
        currentY = margin;
      }
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach((line: string) => {
        if (currentY > 270) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += fontSize * 0.4;
      });
      
      // Add spacing after sections
      if (isHeader) {
        currentY += 3;
      } else {
        currentY += 2;
      }
    };

    // Contact Information (ATS Standard)
    addATSText(resumeData.personalDetails.fullName, 16, true);
    currentY += 2;
    
    const contactDetails = [];
    if (resumeData.personalDetails.email) contactDetails.push(`Email: ${resumeData.personalDetails.email}`);
    if (resumeData.personalDetails.phone) contactDetails.push(`Phone: ${resumeData.personalDetails.phone}`);
    if (resumeData.personalDetails.location) contactDetails.push(`Location: ${resumeData.personalDetails.location}`);
    if (resumeData.personalDetails.linkedIn) contactDetails.push(`LinkedIn: ${resumeData.personalDetails.linkedIn}`);
    if (resumeData.personalDetails.github) contactDetails.push(`GitHub: ${resumeData.personalDetails.github}`);
    
    contactDetails.forEach(detail => {
      addATSText(detail, 10);
    });
    currentY += 8;

    // Professional Summary (ATS Section)
    if (resumeData.professionalSummary) {
      addATSText('PROFESSIONAL SUMMARY', 12, true, true);
      addATSText(resumeData.professionalSummary, 11);
      currentY += 8;
    }

    // Key Skills (ATS Section)
    const validSkills = resumeData.skills.filter(skill => skill.trim());
    if (validSkills.length > 0) {
      addATSText('KEY SKILLS', 12, true, true);
      // ATS-friendly skill listing
      validSkills.forEach(skill => {
        addATSText(`• ${skill.trim()}`, 10);
      });
      currentY += 8;
    }

    // Education (ATS Standard)
    const validEducation = resumeData.education.filter(edu => edu.institution && edu.degree);
    if (validEducation.length > 0) {
      addATSText('EDUCATION', 12, true, true);
      validEducation.forEach(edu => {
        addATSText(edu.degree, 11, true);
        addATSText(`${edu.institution} | ${edu.duration}`, 10);
        if (edu.gpa) {
          addATSText(`GPA: ${edu.gpa}`, 10);
        }
        currentY += 3;
      });
      currentY += 3;
    }

    // Work Experience (ATS Standard)
    const validExperience = resumeData.experience.filter(exp => exp.company && exp.role);
    if (validExperience.length > 0) {
      addATSText('WORK EXPERIENCE', 12, true, true);
      validExperience.forEach(exp => {
        // Job title and company (ATS format)
        addATSText(`${exp.role}`, 11, true);
        addATSText(`${exp.company} | ${exp.duration}`, 10);
        
        // Description with bullet points
        if (exp.description) {
          const descriptions = exp.description.split('\n').filter(desc => desc.trim());
          descriptions.forEach(desc => {
            addATSText(`• ${desc.trim()}`, 10);
          });
        }
        currentY += 5;
      });
      currentY += 3;
    }

    // Certifications (ATS Section)
    const validCertifications = resumeData.certifications.filter(cert => cert.trim());
    if (validCertifications.length > 0) {
      addATSText('CERTIFICATIONS', 12, true, true);
      validCertifications.forEach(cert => {
        addATSText(`• ${cert.trim()}`, 10);
      });
      currentY += 8;
    }

    // Awards (ATS Section)
    const validAwards = resumeData.awards.filter(award => award.trim());
    if (validAwards.length > 0) {
      addATSText('AWARDS', 12, true, true);
      validAwards.forEach(award => {
        addATSText(`• ${award.trim()}`, 10);
      });
      currentY += 8;
    }

    // Interests (ATS Section)
    const validInterests = resumeData.interests.filter(interest => interest.trim());
    if (validInterests.length > 0) {
      addATSText('INTERESTS', 12, true, true);
      validInterests.forEach(interest => {
        addATSText(`• ${interest.trim()}`, 10);
      });
      currentY += 8;
    }

    pdf.save(`${resumeData.personalDetails.fullName || 'Resume'}_ATS_Resume.pdf`);
    setStatus('downloaded');
    toast({
      title: 'ATS-Optimized Resume downloaded as PDF!',
      description: 'Your ATS-friendly resume has been downloaded as a PDF file.',
    });
  };

  const downloadResumeAsWord = async () => {
    console.log('Downloading Word document...');
    
    // ATS-optimized Word document structure
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Arial", // ATS-friendly font
              size: 22, // 11pt font size
            },
          },
        },
      },
      sections: [{
        children: [
          // Contact Information (ATS Standard Format)
          new Paragraph({
            children: [
              new TextRun({
                text: resumeData.personalDetails.fullName,
                bold: true,
                size: 32, // 16pt
                font: "Arial",
              }),
            ],
            spacing: { after: 100 },
          }),

          // Contact Details (Each on separate line for ATS)
          ...(resumeData.personalDetails.email ? [new Paragraph({
            children: [
              new TextRun({
                text: `Email: ${resumeData.personalDetails.email}`,
                font: "Arial",
                size: 20, // 10pt
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.phone ? [new Paragraph({
            children: [
              new TextRun({
                text: `Phone: ${resumeData.personalDetails.phone}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.location ? [new Paragraph({
            children: [
              new TextRun({
                text: `Location: ${resumeData.personalDetails.location}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.linkedIn ? [new Paragraph({
            children: [
              new TextRun({
                text: `LinkedIn: ${resumeData.personalDetails.linkedIn}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.github ? [new Paragraph({
            children: [
              new TextRun({
                text: `GitHub: ${resumeData.personalDetails.github}`,
                font: "Arial",
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          })] : []),

          // Professional Summary (ATS Section)
          ...(resumeData.professionalSummary ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "PROFESSIONAL SUMMARY",
                  bold: true,
                  font: "Arial",
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.professionalSummary,
                  font: "Arial",
                  size: 22,
                }),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Key Skills (ATS Section)
          ...(resumeData.skills.filter(skill => skill.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "KEY SKILLS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.skills.filter(skill => skill.trim()).map(skill =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${skill.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Education (ATS Format)
          ...(resumeData.education.filter(edu => edu.institution && edu.degree).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "EDUCATION",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.education.filter(edu => edu.institution && edu.degree).flatMap(edu => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: edu.degree,
                    bold: true,
                    font: "Arial",
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.institution} | ${edu.duration}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              }),
              ...(edu.gpa ? [new Paragraph({
                children: [
                  new TextRun({
                    text: `GPA: ${edu.gpa}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 100 },
              })] : [new Paragraph({ text: "", spacing: { after: 100 } })]),
            ]),
          ] : []),

          // Work Experience (ATS Standard)
          ...(resumeData.experience.filter(exp => exp.company && exp.role).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "WORK EXPERIENCE",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.experience.filter(exp => exp.company && exp.role).flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.role,
                    bold: true,
                    font: "Arial",
                    size: 22,
                  }),
                ],
                spacing: { after: 50 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.company} | ${exp.duration}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              }),
              ...(exp.description ? exp.description.split('\n').filter(desc => desc.trim()).map(desc =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${desc.trim()}`,
                      font: "Arial",
                      size: 20,
                    }),
                  ],
                  spacing: { after: 50 },
                })
              ) : []),
              new Paragraph({ text: "", spacing: { after: 100 } }),
            ]),
          ] : []),

          // Certifications (ATS Section)
          ...(resumeData.certifications.filter(cert => cert.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "CERTIFICATIONS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.certifications.filter(cert => cert.trim()).map(cert =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${cert.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Awards (ATS Section)
          ...(resumeData.awards.filter(award => award.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "AWARDS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.awards.filter(award => award.trim()).map(award =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${award.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

          // Interests (ATS Section)
          ...(resumeData.interests.filter(interest => interest.trim()).length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: "INTERESTS",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              spacing: { after: 100 },
            }),
            ...resumeData.interests.filter(interest => interest.trim()).map(interest =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${interest.trim()}`,
                    font: "Arial",
                    size: 20,
                  }),
                ],
                spacing: { after: 50 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 200 } }),
          ] : []),

        ],
      }],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resumeData.personalDetails.fullName || 'Resume'}_ATS_Resume.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatus('downloaded');
    toast({
      title: 'ATS-Optimized Resume downloaded as Word document!',
      description: 'Your ATS-friendly resume has been downloaded as a Word (.docx) file.',
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
        "Add issuing organization name",
        "Include certification numbers or IDs when relevant",
        "Focus on industry-specific certifications that match job requirements"
      ],
      awards: [
        "List awards in reverse chronological order",
        "Include the awarding organization",
        "Add context about the significance of the award",
        "Include relevant volunteer work achievements",
        "Mention publications or speaking engagements"
      ],
      interests: [
        "Keep interests professional and relevant to the role",
        "Avoid controversial or overly personal topics",
        "Include interests that demonstrate valuable skills",
        "Show interests that indicate cultural fit",
        "Use interests to highlight soft skills like teamwork or leadership"
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
      <div className="space-y-4 text-sm bg-white p-6 rounded-lg border max-w-full font-['Arial']">
        {/* Contact Information - ATS Standard Format */}
        {resumeData.personalDetails.fullName && (
          <div className="border-b border-gray-300 pb-3 mb-4">
            <h1 className="text-lg font-bold text-gray-900 mb-2 text-left">{resumeData.personalDetails.fullName}</h1>
            <div className="text-gray-700 space-y-1 text-xs">
              {resumeData.personalDetails.email && <div>Email: {resumeData.personalDetails.email}</div>}
              {resumeData.personalDetails.phone && <div>Phone: {resumeData.personalDetails.phone}</div>}
              {resumeData.personalDetails.location && <div>Location: {resumeData.personalDetails.location}</div>}
              {resumeData.personalDetails.linkedIn && <div>LinkedIn: {resumeData.personalDetails.linkedIn}</div>}
              {resumeData.personalDetails.github && <div>GitHub: {resumeData.personalDetails.github}</div>}
            </div>
          </div>
        )}

        {/* Professional Summary - ATS Section */}
        {resumeData.professionalSummary && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Professional Summary</h2>
            <p className="text-gray-700 text-xs leading-relaxed">{resumeData.professionalSummary}</p>
          </div>
        )}

        {/* Key Skills - ATS Section */}
        {resumeData.skills.filter(skill => skill.trim()).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Key Skills</h2>
            <div className="grid grid-cols-1 gap-1">
              {resumeData.skills
                .filter(skill => skill.trim())
                .map((skill, index) => (
                  <div key={index} className="text-xs text-gray-700">• {skill.trim()}</div>
                ))}
            </div>
          </div>
        )}

        {/* Education - ATS Format */}
        {resumeData.education.filter(edu => edu.institution && edu.degree).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Education</h2>
            <div className="space-y-2">
              {resumeData.education
                .filter(edu => edu.institution && edu.degree)
                .map((edu, index) => (
                  <div key={index}>
                    <h3 className="text-xs font-bold text-gray-900">{edu.degree}</h3>
                    <p className="text-xs text-gray-600">{edu.institution} | {edu.duration}</p>
                    {edu.gpa && <p className="text-xs text-gray-600">GPA: {edu.gpa}</p>}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Work Experience - ATS Standard */}
        {resumeData.experience.filter(exp => exp.company && exp.role).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Work Experience</h2>
            <div className="space-y-3">
              {resumeData.experience
                .filter(exp => exp.company && exp.role)
                .map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3">
                    <h3 className="text-xs font-bold text-gray-900">{exp.role}</h3>
                    <p className="text-xs text-gray-600 mb-1">{exp.company} | {exp.duration}</p>
                    {exp.description && (
                      <div className="text-xs text-gray-700">
                        {exp.description.split('\n').filter(desc => desc.trim()).map((desc, i) => (
                          <div key={i} className="mb-1">• {desc.trim()}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Certifications - ATS Standard */}
        {resumeData.certifications.filter(cert => cert.trim()).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Certifications</h2>
            <div className="space-y-1">
              {resumeData.certifications
                .filter(cert => cert.trim())
                .map((cert, index) => (
                  <div key={index} className="text-xs text-gray-700">• {cert.trim()}</div>
                ))}
            </div>
          </div>
        )}

        {/* Awards - ATS Standard */}
        {resumeData.awards.filter(award => award.trim()).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Awards</h2>
            <div className="space-y-1">
              {resumeData.awards
                .filter(award => award.trim())
                .map((award, index) => (
                  <div key={index} className="text-xs text-gray-700">• {award.trim()}</div>
                ))}
            </div>
          </div>
        )}

        {/* Interests - ATS Format */}
        {resumeData.interests.filter(interest => interest.trim()).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Interests</h2>
            <div className="grid grid-cols-1 gap-1">
              {resumeData.interests
                .filter(interest => interest.trim())
                .map((interest, index) => (
                  <div key={index} className="text-xs text-gray-700">• {interest.trim()}</div>
                ))}
            </div>
          </div>
        )}


        {/* ATS Notice */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic text-center">
            ✓ ATS-Optimized Format | Standard Fonts | Clean Layout | Keyword-Friendly
          </p>
        </div>
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

                  {/* Key Skills */}
                  <CollapsibleSection 
                    title="Key Skills" 
                    sectionKey="skills"
                    isOpen={openSections.skills}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
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


                  {/* Certifications */}
                  <CollapsibleSection 
                    title="Certifications" 
                    sectionKey="certifications"
                    isOpen={openSections.certifications}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
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
                  </CollapsibleSection>

                  {/* Awards */}
                  <CollapsibleSection 
                    title="Awards" 
                    sectionKey="awards"
                    isOpen={openSections.awards}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
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
                  </CollapsibleSection>

                  {/* Interests */}
                  <CollapsibleSection 
                    title="Interests" 
                    sectionKey="interests"
                    isOpen={openSections.interests}
                    onToggle={handleSectionToggle}
                    onSave={saveSection}
                  >
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
                  </CollapsibleSection>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button 
                      onClick={generateResumeSuggestions}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {showSuggestions ? 'Close AI Resume Suggestions' : 'Generate Resume Suggestions'}
                    </Button>
                    <Button 
                      onClick={saveFinalVersion}
                      disabled={loading}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Save Final Version
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download Resume
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-background border shadow-md z-50">
                        <DropdownMenuItem 
                          onClick={() => downloadResumeAsPDF()} 
                          className="cursor-pointer"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => downloadResumeAsWord()} 
                          className="cursor-pointer"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download as Word Document
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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