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
import { SubscriptionStatus, SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { ResumeProgressBar } from '@/components/ResumeProgressBar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useNavigate } from 'react-router-dom';
import { useToolChats } from '@/hooks/useToolChats';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from 'docx';
import { FileText, Download, CheckCircle, Plus, Minus, Sparkles, FileEdit, ArrowLeft, Save, Eye, StickyNote, ChevronDown, Copy, ExternalLink } from 'lucide-react';

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
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<StatusType>('draft');
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [coverLetterSuggestions, setCoverLetterSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [showCoverLetterFields, setShowCoverLetterFields] = useState(false);
  const [coverLetterName, setCoverLetterName] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedCoverLetters, setSavedCoverLetters] = useState<any[]>([]);
  
  // Job Application Tracker notes
  const JOB_TRACKER_TOOL_ID = '343aeaa1-fe2d-40fb-b660-a2064774bee3';
  const { chats: jobTrackerNotes } = useToolChats(JOB_TRACKER_TOOL_ID);
  
  // Generate Resume Summary tool notes
  const RESUME_SUMMARY_TOOL_ID = '733fcfc9-f0cd-4429-a8c2-66f1605e63df';
  const { chats: resumeSummaryNotes } = useToolChats(RESUME_SUMMARY_TOOL_ID);
  
  // Cover Letter tool notes
  const COVER_LETTER_TOOL_ID = '5bd39f3b-1ed9-41eb-bc4c-ab7d0fe27a55';
  const { chats: coverLetterNotes } = useToolChats(COVER_LETTER_TOOL_ID);
  
  // Top 6 Skills tool notes
  const TOP_SKILLS_TOOL_ID = '20c53c53-70c1-4d50-b0af-655fe09aef7b';
  const { chats: topSkillsNotes } = useToolChats(TOP_SKILLS_TOOL_ID);
  
  // Resume Builder - Achievements tool notes  
  const ACHIEVEMENTS_TOOL_ID = '55b57cf9-4781-4b80-8e40-eb154420ce49';
  const { chats: achievementsNotes } = useToolChats(ACHIEVEMENTS_TOOL_ID);
  
  // Generate Capstone Project Ideas tool notes
  const CAPSTONE_TOOL_ID = 'c0df061d-c6de-400f-a33e-2ea98f425d75';
  const { chats: capstoneNotes } = useToolChats(CAPSTONE_TOOL_ID);
  
  // Write an Effective Resume tool notes
  const EFFECTIVE_RESUME_TOOL_ID = 'b1d7a888-49b8-412b-861b-b6d850eda7a4';
  const { chats: effectiveResumeNotes } = useToolChats(EFFECTIVE_RESUME_TOOL_ID);
  
  
  // Debug logging for effective resume notes
  useEffect(() => {
    console.log('Effective Resume Notes Debug:', {
      toolId: EFFECTIVE_RESUME_TOOL_ID,
      notesCount: effectiveResumeNotes?.length || 0,
      notes: effectiveResumeNotes?.map(note => ({
        id: note.id,
        title: note.title,
        messagesCount: note.messages?.length || 0,
        messages: note.messages,
        created_at: note.created_at
      }))
    });
  }, [effectiveResumeNotes]);
  
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
    const tab = params.get('tab');
    if (tab === 'resume') return 'resume-builder';
    if (tab === 'cover-letter') return 'cover-letter';
    return 'before-starting';
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
        
        // Handle both old and new data formats
        let certifications = [''];
        let awards = [''];
        
        if (data.awards && Array.isArray(data.awards)) {
          // New format: awards are stored separately
          awards = (data.awards as string[]).length > 0 ? (data.awards as string[]) : [''];
        }
        
        if (data.certifications_awards && Array.isArray(data.certifications_awards)) {
          // If we have the old combined format and no separate awards, keep them as certifications
          certifications = (data.certifications_awards as string[]).length > 0 ? (data.certifications_awards as string[]) : [''];
        }

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
          certifications: certifications,
          awards: awards,
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
      // Generate resume suggestions with notes from "Write an Effective Resume" tool
      let suggestions = `Based on your information, here are some resume enhancement suggestions:

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

      setCoverLetterContent(coverLetter);
      
      // Auto-generate a name if not provided
      if (!coverLetterName.trim()) {
        const currentDate = new Date().toLocaleDateString();
        setCoverLetterName(`Cover Letter - ${currentDate}`);
      }
      
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

  const saveCoverLetter = async () => {
    if (!coverLetterName.trim() || !coverLetterContent.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a name and content for your cover letter.',
        variant: 'destructive'
      });
      return;
    }

    if (savedCoverLetters.length >= 10) {
      toast({
        title: 'Limit Reached',
        description: 'You can only save up to 10 cover letters. Please delete some to make room.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_cover_letters')
        .insert({
          user_id: user?.id,
          title: coverLetterName.trim(),
          content: coverLetterContent.trim()
        });

      if (error) throw error;

      toast({
        title: 'Cover Letter Saved',
        description: 'Your cover letter has been saved to your library.',
      });

      // Reset form
      setCoverLetterName('');
      setCoverLetterContent('');
      
      // Refresh count
      fetchSavedCoverLettersCount();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: 'Error saving cover letter',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadCoverLetter = () => {
    if (!coverLetterContent.trim()) {
      toast({
        title: 'No Content',
        description: 'Please add content to your cover letter before downloading.',
        variant: 'destructive'
      });
      return;
    }

    const fileName = coverLetterName.trim() || 'Cover Letter';
    const element = document.createElement('a');
    const file = new Blob([coverLetterContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'Download Started',
      description: 'Your cover letter has been downloaded.',
    });
  };

  useEffect(() => {
    if (user) {
      fetchSavedCoverLettersCount();
    }
  }, [user]);

  const fetchSavedCoverLettersCount = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_cover_letters')
        .select('id')
        .eq('user_id', user?.id);

      if (error) throw error;
      setSavedCoverLetters(data || []);
    } catch (error) {
      console.error('Error fetching saved cover letters count:', error);
    }
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
        p_certifications_awards: resumeData.certifications.filter(cert => cert.trim()) as any,
        p_awards: resumeData.awards.filter(award => award.trim()) as any,
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
    const linkDetails = [];
    if (resumeData.personalDetails.email) contactDetails.push(`Email: ${resumeData.personalDetails.email}`);
    if (resumeData.personalDetails.phone) contactDetails.push(`Phone: ${resumeData.personalDetails.phone}`);
    if (resumeData.personalDetails.location) contactDetails.push(`Location: ${resumeData.personalDetails.location}`);
    
    // Store URLs separately for linking
    if (resumeData.personalDetails.linkedIn) {
      linkDetails.push({
        text: resumeData.personalDetails.linkedIn,
        url: resumeData.personalDetails.linkedIn.startsWith('http') 
          ? resumeData.personalDetails.linkedIn 
          : `https://${resumeData.personalDetails.linkedIn}`
      });
    }
    if (resumeData.personalDetails.github) {
      linkDetails.push({
        text: resumeData.personalDetails.github,
        url: resumeData.personalDetails.github.startsWith('http') 
          ? resumeData.personalDetails.github 
          : `https://${resumeData.personalDetails.github}`
      });
    }
    
    contactDetails.forEach(detail => {
      addATSText(detail, 10);
    });
    
    // Add clickable links for URLs
    linkDetails.forEach(link => {
      if (currentY > 270) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.setFont('arial', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 238); // Blue color for links
      pdf.textWithLink(link.text, margin, currentY, { url: link.url });
      currentY += 10 * 0.4 + 2;
    });
    
    // Reset text color to black for the rest of the document
    pdf.setTextColor(0, 0, 0);
    
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
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: resumeData.personalDetails.linkedIn,
                    font: "Arial",
                    size: 20,
                    color: "0000EE",
                    underline: {},
                  }),
                ],
                link: resumeData.personalDetails.linkedIn.startsWith('http') 
                  ? resumeData.personalDetails.linkedIn 
                  : `https://${resumeData.personalDetails.linkedIn}`,
              }),
            ],
            spacing: { after: 50 },
          })] : []),

          ...(resumeData.personalDetails.github ? [new Paragraph({
            children: [
              new ExternalHyperlink({
                children: [
                  new TextRun({
                    text: resumeData.personalDetails.github,
                    font: "Arial",
                    size: 20,
                    color: "0000EE",
                    underline: {},
                  }),
                ],
                link: resumeData.personalDetails.github.startsWith('http') 
                  ? resumeData.personalDetails.github 
                  : `https://${resumeData.personalDetails.github}`,
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
    if (resumeData.personalDetails.linkedIn) contactDetails.push(resumeData.personalDetails.linkedIn);
    if (resumeData.personalDetails.github) contactDetails.push(resumeData.personalDetails.github);
    
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

  // Get cover letter notes content for suggestions
  const getCoverLetterNotes = () => {
    const notes: { title: string; content: string; createdAt: string }[] = [];
    
    coverLetterNotes.forEach(chat => {
      if (chat.messages && Array.isArray(chat.messages)) {
        chat.messages.forEach(message => {
          if (message.content) {
            const content = typeof message.content === 'string' 
              ? message.content 
              : JSON.stringify(message.content);
            
            // Extract content from user or assistant messages
            if (content && content.trim()) {
              notes.push({
                title: `Note from ${new Date(chat.created_at).toLocaleDateString()}`,
                content: content,
                createdAt: chat.created_at
              });
            }
          }
        });
      }
    });
    
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Get resume summary notes content for suggestions
  const getResumeSummaryNotes = () => {
    if (!resumeSummaryNotes || resumeSummaryNotes.length === 0) {
      return [];
    }
    
    return resumeSummaryNotes.map(note => ({
      title: note.title,
      content: note.messages[0]?.content || 'No content',
      createdAt: note.created_at
    }));
  };

  // Get top skills notes content for suggestions
  const getTopSkillsNotes = () => {
    if (!topSkillsNotes || topSkillsNotes.length === 0) {
      return [];
    }
    
    return topSkillsNotes.map(note => ({
      title: note.title,
      content: note.messages[0]?.content || 'No content',
      createdAt: note.created_at
    }));
  };

  // Get achievements notes content for suggestions
  const getAchievementsNotes = () => {
    if (!achievementsNotes || achievementsNotes.length === 0) {
      return [];
    }
    
    return achievementsNotes.map(note => ({
      title: note.title,
      content: note.messages[0]?.content || 'No content',
      createdAt: note.created_at
    }));
  };

  // Get capstone project notes content for suggestions
  const getCapstoneNotes = () => {
    if (!capstoneNotes || capstoneNotes.length === 0) {
      return [];
    }
    
    return capstoneNotes.map(note => ({
      title: note.title,
      content: note.messages[0]?.content || 'No content',
      createdAt: note.created_at
    }));
  };

  // Copy content to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
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
              {resumeData.personalDetails.linkedIn && (
                <div>
                  <a 
                    href={resumeData.personalDetails.linkedIn.startsWith('http') ? resumeData.personalDetails.linkedIn : `https://${resumeData.personalDetails.linkedIn}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {resumeData.personalDetails.linkedIn}
                  </a>
                </div>
              )}
              {resumeData.personalDetails.github && (
                <div>
                  <a 
                    href={resumeData.personalDetails.github.startsWith('http') ? resumeData.personalDetails.github : `https://${resumeData.personalDetails.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {resumeData.personalDetails.github}
                  </a>
                </div>
              )}
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

  // Check premium access
  if (!canAccessFeature('resume_builder')) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Resume Builder
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
          <SubscriptionUpgrade featureName="resume_builder">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  Resume Builder is a premium feature. Upgrade your plan to access professional resume building tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Upgrade Now</Button>
              </CardContent>
            </Card>
          </SubscriptionUpgrade>
        </main>
      </div>
    );
  }

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
              <TabsTrigger value="before-starting">Before Starting</TabsTrigger>
              <TabsTrigger value="resume-builder">Resume Builder</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
            </TabsList>

            <TabsContent value="before-starting" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Instructions Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Resume & Cover Letter Instructions
                    </CardTitle>
                    <CardDescription>
                      Essential guidelines to create professional resume and cover letter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-primary mb-3">Resume Building Guidelines</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Keep your resume to 1-2 pages maximum</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Use a clean, professional format with consistent styling</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Include quantifiable achievements with numbers and percentages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Tailor your resume for each job application</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Use action verbs to start bullet points (e.g., Developed, Managed, Led)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Include relevant keywords from the job description</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Proofread carefully for grammar and spelling errors</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-3">Cover Letter Best Practices</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Address the hiring manager by name when possible</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Start with a compelling opening that grabs attention</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Highlight specific achievements that match job requirements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Show enthusiasm for the company and role</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Keep it concise - one page maximum</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>End with a strong call-to-action</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-3">AI Tools Integration</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>Use "Generate Resume Summary" tool for professional summaries</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>Leverage "Top 6 Skills" tool to identify key competencies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>Use "Resume Builder - Achievements" for impact statements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span>Access "Write an Effective Resume" for detailed guidance</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Checklist Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Pre-Application Checklist
                    </CardTitle>
                    <CardDescription>
                      Complete these steps before building your resume and cover letter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary mb-3">Preparation Phase</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="job-description" />
                          <label htmlFor="job-description" className="text-sm">
                            Read and analyze the job description thoroughly
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="company-research" />
                          <label htmlFor="company-research" className="text-sm">
                            Research the company culture and values
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="keywords" />
                          <label htmlFor="keywords" className="text-sm">
                            Identify key skills and keywords from job posting
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="achievements" />
                          <label htmlFor="achievements" className="text-sm">
                            List your quantifiable achievements and accomplishments
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-3">Content Gathering</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="contact-info" />
                          <label htmlFor="contact-info" className="text-sm">
                            Verify all contact information is current
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="work-history" />
                          <label htmlFor="work-history" className="text-sm">
                            Organize work experience with dates and details
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="education" />
                          <label htmlFor="education" className="text-sm">
                            Gather education details, certifications, and awards
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="skills-list" />
                          <label htmlFor="skills-list" className="text-sm">
                            Create comprehensive list of technical and soft skills
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-3">AI Tools Preparation</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="effective-resume-notes" />
                          <label htmlFor="effective-resume-notes" className="text-sm">
                            Review "Write an Effective Resume" tool notes
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="skills-analysis" />
                          <label htmlFor="skills-analysis" className="text-sm">
                            Use "Top 6 Skills" tool to identify key competencies
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="achievements-tool" />
                          <label htmlFor="achievements-tool" className="text-sm">
                            Generate achievements using AI achievement tool
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="summary-ready" />
                          <label htmlFor="summary-ready" className="text-sm">
                            Prepare content for AI resume summary generation
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-primary mb-3">Final Preparation</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="templates" />
                          <label htmlFor="templates" className="text-sm">
                            Choose appropriate resume template/format
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="references" />
                          <label htmlFor="references" className="text-sm">
                            Prepare list of professional references
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="portfolio" />
                          <label htmlFor="portfolio" className="text-sm">
                            Update portfolio and LinkedIn profile
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Pro Tip:</span> Complete at least 80% of this checklist before proceeding to the Resume Builder tab for best results.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

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
                        <Label htmlFor="location">Location (Optional)</Label>
                           <Input 
                             id="location"
                             value={resumeData.personalDetails.location || ''}
                             onChange={(e) => updatePersonalDetails('location', e.target.value)}
                             placeholder="e.g., New York, NY"
                        />
                      </div>
                       <div>
                         <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                            <Input 
                              id="linkedin"
                              value={resumeData.personalDetails.linkedIn || ''}
                              onChange={(e) => updatePersonalDetails('linkedIn', e.target.value)}
                              placeholder="e.g., linkedin.com/in/yourname"
                         />
                       </div>
                       <div>
                         <Label htmlFor="github">GitHub / Portfolio Link (Optional)</Label>
                            <Input 
                              id="github"
                              value={resumeData.personalDetails.github || ''}
                              onChange={(e) => updatePersonalDetails('github', e.target.value)}
                              placeholder="e.g., github.com/username or portfolio.com"
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - AI Suggestions */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                          <div>
                            <CardTitle>AI Resume Suggestions</CardTitle>
                            <CardDescription>
                              Review these AI-generated suggestions
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(aiSuggestions);
                              toast({
                                title: 'Copied to clipboard!',
                                description: 'Resume suggestions have been copied.',
                              });
                            }}
                            className="gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <Textarea 
                            value={aiSuggestions}
                            onChange={(e) => setAiSuggestions(e.target.value)}
                            rows={12}
                            className="font-mono text-sm max-h-96 overflow-y-auto resize-none"
                            placeholder="AI suggestions will appear here..."
                          />
                        </CardContent>
                      </Card>

                      {/* Right Column - Tool Notes */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              "Write an Effective Resume" Tool Notes
                            </CardTitle>
                            <CardDescription>
                              Your saved notes from the effective resume tool
                            </CardDescription>
                          </div>
                          {(!effectiveResumeNotes || effectiveResumeNotes.length === 0) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('/dashboard/digital-career-hub?toolId=b1d7a888-49b8-412b-861b-b6d850eda7a4', '_blank')}
                              className="gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Go to Tool
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent>
                          {effectiveResumeNotes && effectiveResumeNotes.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {effectiveResumeNotes.map((note, index) => {
                                // Extract all messages for display
                                const assistantContent = note.messages
                                  ?.filter(msg => msg.type === 'assistant')
                                  ?.map(msg => msg.content)
                                  ?.join('\n\n') || '';
                                
                                const userContent = note.messages
                                  ?.filter(msg => msg.type === 'user')
                                  ?.map(msg => msg.content)
                                  ?.join('\n\n') || '';
                                
                                // Use assistant content if available, otherwise use user content
                                const displayContent = assistantContent || userContent || 'No content available';
                                
                                console.log('Note Debug:', {
                                  noteId: note.id,
                                  title: note.title,
                                  messagesCount: note.messages?.length,
                                  assistantContent,
                                  userContent,
                                  displayContent: displayContent.substring(0, 100) + '...'
                                });
                                
                                return (
                                  <div key={note.id} className="p-3 bg-muted/20 rounded-lg border">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-sm">{note.title || `Note ${index + 1}`}</h5>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(displayContent);
                                          toast({
                                            title: 'Copied!',
                                            description: 'Note content copied to clipboard.',
                                          });
                                        }}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {new Date(note.created_at).toLocaleDateString()} • {note.messages?.length || 0} messages
                                    </p>
                                    <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto border rounded p-2 bg-background/50">
                                      {displayContent ? (
                                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{displayContent}</pre>
                                      ) : (
                                        <p className="text-muted-foreground italic">No content to display</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                              <p className="text-sm text-muted-foreground mb-3">
                                No notes found from "Write an Effective Resume" tool. Generate content using the tool to see personalized resume guidance here.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Debug: Tool ID = {EFFECTIVE_RESUME_TOOL_ID}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
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
                               
                                {/* Professional Summary Notes - Show for summary section */}
                                {activeSuggestionSection === 'summary' && (
                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                      <StickyNote className="h-4 w-4" />
                                      Your Resume Summary Notes
                                    </h4>
                                     <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                       {getResumeSummaryNotes().length > 0 ? (
                                         getResumeSummaryNotes().map((note, index) => (
                                           <div key={index} className="p-3 bg-muted/50 rounded-lg border relative group">
                                             <div className="flex justify-between items-start mb-1">
                                               <h5 className="font-medium text-sm pr-8">{note.title}</h5>
                                               <button
                                                 onClick={() => copyToClipboard(note.content)}
                                                 className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                 title="Copy content"
                                               >
                                                 <Copy className="h-3 w-3" />
                                               </button>
                                             </div>
                                             <p className="text-xs text-muted-foreground mb-2">
                                               {new Date(note.createdAt).toLocaleDateString()}
                                             </p>
                                             <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                               <p className="whitespace-pre-wrap break-words">
                                                 {note.content}
                                               </p>
                                             </div>
                                           </div>
                                         ))
                                        ) : (
                                          <div className="text-sm text-muted-foreground space-y-3">
                                            <p>
                                              No notes found in "3. Generate Resume Summary" tool. 
                                              Create notes there to see them here.
                                            </p>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="gap-2"
                                              onClick={() => window.open('/dashboard/digital-career-hub?toolId=24b5bb05-e871-4c7a-a7cb-8a7e6c87b3cd', '_blank')}
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Go to Resume Summary Tool
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                 )}

                                {/* Top Skills Notes - Show for skills section */}
                                {activeSuggestionSection === 'skills' && (
                                  <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                      <StickyNote className="h-4 w-4" />
                                      Your Top Skills Notes
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                      {getTopSkillsNotes().length > 0 ? (
                                        getTopSkillsNotes().map((note, index) => (
                                          <div key={index} className="p-3 bg-muted/50 rounded-lg border relative group">
                                            <div className="flex justify-between items-start mb-1">
                                              <h5 className="font-medium text-sm pr-8">{note.title}</h5>
                                              <button
                                                onClick={() => copyToClipboard(note.content)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                title="Copy content"
                                              >
                                                <Copy className="h-3 w-3" />
                                              </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {new Date(note.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                              <p className="whitespace-pre-wrap break-words">
                                                {note.content}
                                              </p>
                                            </div>
                                          </div>
                                        ))
                                        ) : (
                                          <div className="text-sm text-muted-foreground space-y-3">
                                            <p>
                                              No notes found in "1. Resume Builder - Top 6 Skills" tool. 
                                              Create notes there to see them here.
                                            </p>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="gap-2"
                                              onClick={() => window.open('/dashboard/digital-career-hub?toolId=20c53c53-70c1-4d50-b0af-655fe09aef7b', '_blank')}
                                            >
                                              <ExternalLink className="h-3 w-3" />
                                              Go to Top Skills Tool
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                 )}

                                {/* Experience Notes - Show for experience section */}
                                {activeSuggestionSection === 'experience' && (
                                  <div className="space-y-4">
                                    {/* Achievements Notes */}
                                    <div>
                                      <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <StickyNote className="h-4 w-4" />
                                        Your Achievements Notes
                                      </h4>
                                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {getAchievementsNotes().length > 0 ? (
                                          getAchievementsNotes().map((note, index) => (
                                            <div key={index} className="p-3 bg-muted/50 rounded-lg border relative group">
                                              <div className="flex justify-between items-start mb-1">
                                                <h5 className="font-medium text-sm pr-8">{note.title}</h5>
                                                <button
                                                  onClick={() => copyToClipboard(note.content)}
                                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                  title="Copy content"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </div>
                                              <p className="text-xs text-muted-foreground mb-2">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                              </p>
                                              <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                                <p className="whitespace-pre-wrap break-words">
                                                  {note.content}
                                                </p>
                                              </div>
                                            </div>
                                          ))
                                         ) : (
                                           <div className="text-sm text-muted-foreground space-y-3">
                                             <p>
                                               No notes found in "2. Resume Builder - Achievements" tool. 
                                               Create notes there to see them here.
                                             </p>
                                             <Button 
                                               variant="outline" 
                                               size="sm" 
                                               className="gap-2"
                                                onClick={() => window.open('/dashboard/digital-career-hub?toolId=55b57cf9-4781-4b80-8e40-eb154420ce49', '_blank')}
                                             >
                                               <ExternalLink className="h-3 w-3" />
                                               Go to Achievements Tool
                                             </Button>
                                           </div>
                                         )}
                                      </div>
                                    </div>

                                    {/* Capstone Project Notes */}
                                    <div>
                                      <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <StickyNote className="h-4 w-4" />
                                        Your Capstone Project Ideas
                                      </h4>
                                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                        {getCapstoneNotes().length > 0 ? (
                                          getCapstoneNotes().map((note, index) => (
                                            <div key={index} className="p-3 bg-muted/50 rounded-lg border relative group">
                                              <div className="flex justify-between items-start mb-1">
                                                <h5 className="font-medium text-sm pr-8">{note.title}</h5>
                                                <button
                                                  onClick={() => copyToClipboard(note.content)}
                                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                  title="Copy content"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </div>
                                              <p className="text-xs text-muted-foreground mb-2">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                              </p>
                                              <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                                <p className="whitespace-pre-wrap break-words">
                                                  {note.content}
                                                </p>
                                              </div>
                                            </div>
                                          ))
                                         ) : (
                                           <div className="text-sm text-muted-foreground space-y-3">
                                             <p>
                                               No notes found in "4. Generate Capstone Project Ideas" tool. 
                                               Create notes there to see them here.
                                             </p>
                                             <Button 
                                               variant="outline" 
                                               size="sm" 
                                               className="gap-2"
                                               onClick={() => window.open('/dashboard/digital-career-hub?toolId=c0df061d-c6de-400f-a33e-2ea98f425d75', '_blank')}
                                             >
                                               <ExternalLink className="h-3 w-3" />
                                               Go to Capstone Ideas Tool
                                             </Button>
                                           </div>
                                         )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                 {/* Job Tracker Notes - Show for other sections except summary, skills, experience, education, and personalDetails */}
                                 {activeSuggestionSection !== 'summary' && activeSuggestionSection !== 'skills' && activeSuggestionSection !== 'experience' && activeSuggestionSection !== 'education' && activeSuggestionSection !== 'personalDetails' && (
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
                                )}
                             </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="text-center text-muted-foreground">
                                  <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>Click on a section to see specific tips and suggestions</p>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Cover Letter Generator */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cover Letter Generator</CardTitle>
                      <CardDescription>
                        Generate a personalized cover letter based on your resume data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!showCoverLetterFields ? (
                        <div className="text-center py-12">
                          <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">Create Your Cover Letter</h3>
                          <p className="text-muted-foreground mb-6">
                            Start by creating a new cover letter based on your resume data
                          </p>
                          <Button 
                            onClick={() => setShowCoverLetterFields(true)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Cover Letter
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="coverLetterName" className="text-sm font-medium">
                                Cover Letter Name *
                              </Label>
                              <Input
                                id="coverLetterName"
                                value={coverLetterName}
                                onChange={(e) => setCoverLetterName(e.target.value)}
                                placeholder="Enter a name for your cover letter..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="coverLetterContent" className="text-sm font-medium">
                                Cover Letter Content *
                              </Label>
                              <Textarea
                                id="coverLetterContent"
                                value={coverLetterContent}
                                onChange={(e) => setCoverLetterContent(e.target.value)}
                                placeholder="Your generated cover letter will appear here..."
                                rows={12}
                                className="min-h-[300px] mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              variant="outline" 
                              onClick={saveCoverLetter}
                              disabled={!coverLetterName.trim() || !coverLetterContent.trim() || isSaving}
                              className="flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {isSaving ? 'Saving...' : 'Save Cover Letter'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => navigate('/dashboard/library', { state: { activeTab: 'saved-cover-letters' } })}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Cover Letters
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Cover Letter Suggestions - Right Column */}
                {showCoverLetterFields && (
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Cover Letter Suggestions</CardTitle>
                        <CardDescription>
                          Tips and your saved notes to improve your cover letter
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Cover Letter Tips */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Cover Letter Tips
                          </h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Start with a strong opening that grabs attention</p>
                            <p>• Mention the specific job title and company name</p>
                            <p>• Highlight 2-3 key achievements relevant to the role</p>
                            <p>• Show knowledge about the company and role</p>
                            <p>• Use keywords from the job description</p>
                            <p>• Keep it concise - ideally one page</p>
                            <p>• End with a strong call to action</p>
                            <p>• Proofread for grammar and spelling errors</p>
                          </div>
                        </div>

                        {/* Cover Letter Notes */}
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <StickyNote className="h-4 w-4" />
                            Your Cover Letter Notes
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {getCoverLetterNotes().length > 0 ? (
                              getCoverLetterNotes().map((note, index) => (
                                <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h5 className="font-medium text-sm">{note.title}</h5>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        navigator.clipboard.writeText(note.content);
                                        toast({
                                          title: "Copied!",
                                          description: "Note content copied to clipboard",
                                        });
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </p>
                                  <div className="text-sm text-foreground/80 max-h-32 overflow-y-auto">
                                    {note.content}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border border-dashed">
                                <p className="mb-2">No notes found from the "Write a powerful cover letter" tool.</p>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2"
                                  onClick={() => window.open('/dashboard/digital-career-hub?toolId=5bd39f3b-1ed9-41eb-bc4c-ab7d0fe27a55', '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Go to Cover Letter Tool
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Helpful Tools - Only show tools with saved notes */}
                        {(getCoverLetterNotes().length > 0 || getJobTrackerNotes().length > 0) && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Helpful Tools
                            </h4>
                            <div className="space-y-2 text-sm">
                              {getCoverLetterNotes().length > 0 && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-2 h-auto p-3"
                                  onClick={() => window.open('/dashboard/digital-career-hub?toolId=5bd39f3b-1ed9-41eb-bc4c-ab7d0fe27a55', '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  🎯 AI Career Hub - Cover Letter Generator
                                </Button>
                              )}
                              {getJobTrackerNotes().length > 0 && (
                                <Button
                                  variant="outline"
                                  className="w-full justify-start gap-2 h-auto p-3"
                                  onClick={() => window.open('/dashboard/digital-career-hub?toolId=343aeaa1-fe2d-40fb-b660-a2064774bee3', '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  🔍 Job Application Tracker
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ResumeBuilder;