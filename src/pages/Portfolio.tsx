import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Upload, Plus, Trash2, FileText, Download, User, Edit3, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';

interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

interface Portfolio {
  id: string;
  user_id: string;
  resume_url: string | null;
  parsed_summary: string | null;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  created_at: string;
  updated_at: string;
}

const Portfolio = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [newSkill, setNewSkill] = useState('');
  
  // Local form state for better UX
  const [localFormData, setLocalFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    linkedin_profile: '',
    parsed_summary: ''
  });
  
  // Local state for experience and education items
  const [localExperience, setLocalExperience] = useState<ExperienceItem[]>([]);
  const [localEducation, setLocalEducation] = useState<EducationItem[]>([]);
  const [changedExperience, setChangedExperience] = useState<Set<number>>(new Set());
  const [changedEducation, setChangedEducation] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Transform the data to match our interface
        const transformedData: Portfolio = {
          ...data,
          full_name: (data as any).full_name || '',
          email: (data as any).email || '',
          phone: (data as any).phone || '',
          location: (data as any).location || '',
          skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
          experience: Array.isArray(data.experience) ? (data.experience as unknown as ExperienceItem[]) : [],
          education: Array.isArray(data.education) ? (data.education as unknown as EducationItem[]) : []
        };
        setPortfolio(transformedData);
        
        // Update local form data
        setLocalFormData({
          full_name: (data as any).full_name || '',
          email: (data as any).email || '',
          phone: (data as any).phone || '',
          linkedin_profile: (data as any).location || '', // Keep existing data in linkedin field for now
          parsed_summary: data.parsed_summary || ''
        });
        
        // Update local experience and education
        setLocalExperience(transformedData.experience);
        setLocalEducation(transformedData.education);
      } else {
        // Create initial portfolio if none exists
        await createInitialPortfolio();
      }
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to load portfolio data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createInitialPortfolio = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          full_name: user?.email?.split('@')[0] || '',
          email: user?.email || '',
          phone: '',
          location: '', // This will be used for linkedin_profile temporarily
          skills: [],
          experience: [],
          education: []
        })
        .select()
        .single();

      if (error) throw error;

      const transformedData: Portfolio = {
        ...data,
        full_name: (data as any).full_name || '',
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        location: (data as any).location || '',
        skills: [],
        experience: [],
        education: []
      };
      
      setPortfolio(transformedData);
      
      // Update local form data
      setLocalFormData({
        full_name: (data as any).full_name || '',
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        linkedin_profile: '',
        parsed_summary: data.parsed_summary || ''
      });
      
      // Update local experience and education
      setLocalExperience([]);
      setLocalEducation([]);
    } catch (error: any) {
      console.error('Error creating initial portfolio:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Parse resume with n8n
      setParsing(true);
      const { data: parseData, error: parseError } = await supabase.functions
        .invoke('parse-resume', {
          body: {
            resumeUrl: publicUrl,
            userId: user.id
          }
        });

      if (parseError) throw parseError;

      toast({
        title: 'Success',
        description: 'Resume uploaded and parsed successfully!',
      });

      await fetchPortfolio();

    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload resume.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const updatePortfolio = async (updates: Partial<{
    skills: string[];
    experience: ExperienceItem[];
    education: EducationItem[];
    parsed_summary: string;
    resume_url: string;
    full_name: string;
    email: string;
    phone: string;
    location: string;
  }>) => {
    if (!portfolio || !user) return;

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .update(updates as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data
      const transformedData: Portfolio = {
        ...data,
        full_name: (data as any).full_name || '',
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        location: (data as any).location || '',
        skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
        experience: Array.isArray(data.experience) ? (data.experience as unknown as ExperienceItem[]) : [],
        education: Array.isArray(data.education) ? (data.education as unknown as EducationItem[]) : []
      };
      
      setPortfolio(transformedData);
      
      // Update local form data
      setLocalFormData({
        full_name: (data as any).full_name || '',
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        linkedin_profile: (data as any).location || '',
        parsed_summary: data.parsed_summary || ''
      });
      
      // Update local experience and education
      setLocalExperience(transformedData.experience);
      setLocalEducation(transformedData.education);
      toast({
        title: 'Success',
        description: 'Portfolio updated successfully!',
      });
    } catch (error: any) {
      console.error('Error updating portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to update portfolio.',
        variant: 'destructive'
      });
    }
  };

  const addSkill = () => {
    if (!newSkill.trim() || !portfolio) return;
    
    const updatedSkills = [...portfolio.skills, newSkill.trim()];
    updatePortfolio({ skills: updatedSkills });
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    if (!portfolio) return;
    
    const updatedSkills = portfolio.skills.filter((_, i) => i !== index);
    updatePortfolio({ skills: updatedSkills });
  };
  
  // Debounced update function
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (updates: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updatePortfolio(updates);
        }, 1000); // 1 second delay
      };
    })(),
    []
  );

  // Handle form field changes with local state
  const handleFormChange = (field: string, value: string) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
    
    // Map linkedin_profile to location for database storage
    const dbField = field === 'linkedin_profile' ? 'location' : field;
    debouncedUpdate({ [dbField]: value });
  };

  // Handle blur events for immediate save
  const handleFieldBlur = (field: string, value: string) => {
    // Map linkedin_profile to location for database storage
    const dbField = field === 'linkedin_profile' ? 'location' : field;
    updatePortfolio({ [dbField]: value });
  };
  const addExperience = () => {
    if (!portfolio) return;
    
    const newExp: ExperienceItem = {
      title: '',
      company: '',
      duration: '',
      description: ''
    };
    const updatedExperience = [...localExperience, newExp];
    setLocalExperience(updatedExperience);
    updatePortfolio({ experience: updatedExperience });
  };

  const updateLocalExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    const updatedExperience = [...localExperience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setLocalExperience(updatedExperience);
    
    // Mark this item as changed
    setChangedExperience(prev => new Set(prev).add(index));
  };

  const saveExperience = (index: number) => {
    if (!portfolio) return;
    
    const updatedExperience = [...portfolio.experience];
    updatedExperience[index] = localExperience[index];
    updatePortfolio({ experience: updatedExperience });
    
    // Remove from changed set
    setChangedExperience(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const removeExperience = (index: number) => {
    if (!portfolio) return;
    
    const updatedExperience = portfolio.experience.filter((_, i) => i !== index);
    const updatedLocalExperience = localExperience.filter((_, i) => i !== index);
    
    setLocalExperience(updatedLocalExperience);
    updatePortfolio({ experience: updatedExperience });
    
    // Update changed set indices
    setChangedExperience(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const addEducation = () => {
    if (!portfolio) return;
    
    const newEdu: EducationItem = {
      degree: '',
      institution: '',
      year: '',
      description: ''
    };
    const updatedEducation = [...localEducation, newEdu];
    setLocalEducation(updatedEducation);
    updatePortfolio({ education: updatedEducation });
  };

  const updateLocalEducation = (index: number, field: keyof EducationItem, value: string) => {
    const updatedEducation = [...localEducation];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setLocalEducation(updatedEducation);
    
    // Mark this item as changed
    setChangedEducation(prev => new Set(prev).add(index));
  };

  const saveEducation = (index: number) => {
    if (!portfolio) return;
    
    const updatedEducation = [...portfolio.education];
    updatedEducation[index] = localEducation[index];
    updatePortfolio({ education: updatedEducation });
    
    // Remove from changed set
    setChangedEducation(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const removeEducation = (index: number) => {
    if (!portfolio) return;
    
    const updatedEducation = portfolio.education.filter((_, i) => i !== index);
    const updatedLocalEducation = localEducation.filter((_, i) => i !== index);
    
    setLocalEducation(updatedLocalEducation);
    updatePortfolio({ education: updatedEducation });
    
    // Update changed set indices
    setChangedEducation(prev => {
      const newSet = new Set<number>();
      prev.forEach(i => {
        if (i < index) newSet.add(i);
        else if (i > index) newSet.add(i - 1);
      });
      return newSet;
    });
  };

  const downloadPDF = async () => {
    if (!portfolio) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let yPosition = margin;

      // Helper function to check if we need a new page
      const checkNewPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with proper ATS formatting
      const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' = 'left') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(0, 0, 0); // Always black for ATS
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        const lineHeight = fontSize * 0.35; // Tighter line spacing for ATS
        
        checkNewPage(lines.length * lineHeight);
        
        lines.forEach((line: string) => {
          if (align === 'center') {
            const textWidth = pdf.getTextWidth(line);
            const xPosition = (pageWidth - textWidth) / 2;
            pdf.text(line, xPosition, yPosition);
          } else {
            pdf.text(line, margin, yPosition);
          }
          yPosition += lineHeight;
        });
        
        return yPosition;
      };

      // Add section separator
      const addSectionSeparator = () => {
        yPosition += 4;
      };

      // Add bullet point
      const addBulletPoint = (text: string, fontSize: number = 10) => {
        const bulletX = margin + 5;
        const textX = margin + 10;
        
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const lines = pdf.splitTextToSize(text, contentWidth - 10);
        const lineHeight = fontSize * 0.35;
        
        checkNewPage(lines.length * lineHeight);
        
        // Add bullet
        pdf.text('•', bulletX, yPosition);
        
        // Add text
        lines.forEach((line: string, index: number) => {
          pdf.text(line, textX, yPosition);
          yPosition += lineHeight;
        });
      };

      // HEADER SECTION - Name and Contact (ATS Standard)
      addText(portfolio.full_name || 'Your Name', 16, 'bold', 'center');
      yPosition += 2;

      // Contact information in a single line for ATS
      const contactInfo = [];
      if (portfolio.email) contactInfo.push(portfolio.email);
      if (portfolio.phone) contactInfo.push(portfolio.phone);
      if (localFormData.linkedin_profile) contactInfo.push(localFormData.linkedin_profile);
      
      if (contactInfo.length > 0) {
        addText(contactInfo.join(' | '), 10, 'normal', 'center');
      }
      
      addSectionSeparator();

      // PROFESSIONAL SUMMARY (if available)
      if (portfolio.parsed_summary) {
        addText('PROFESSIONAL SUMMARY', 12, 'bold');
        yPosition += 2;
        addText(portfolio.parsed_summary, 10);
        addSectionSeparator();
      }

      // CORE COMPETENCIES / SKILLS (ATS prefers this format)
      if (portfolio.skills && portfolio.skills.length > 0) {
        addText('CORE COMPETENCIES', 12, 'bold');
        yPosition += 2;
        
        // Group skills in lines of 3-4 for better ATS reading
        const skillsPerLine = 3;
        for (let i = 0; i < portfolio.skills.length; i += skillsPerLine) {
          const skillGroup = portfolio.skills.slice(i, i + skillsPerLine);
          addText(skillGroup.join(' • '), 10);
        }
        addSectionSeparator();
      }

      // PROFESSIONAL EXPERIENCE (ATS Standard Format)
      if (portfolio.experience && portfolio.experience.length > 0) {
        addText('PROFESSIONAL EXPERIENCE', 12, 'bold');
        yPosition += 2;

        portfolio.experience.forEach((exp, index) => {
          if (exp.title || exp.company) {
            // Job Title (Bold)
            if (exp.title) {
              addText(exp.title, 11, 'bold');
            }
            
            // Company and Duration (same line, ATS format)
            const companyDuration = [];
            if (exp.company) companyDuration.push(exp.company);
            if (exp.duration) companyDuration.push(exp.duration);
            
            if (companyDuration.length > 0) {
              addText(companyDuration.join(' | '), 10);
            }
            
            yPosition += 1;
            
            // Job Description as bullet points (ATS prefers this)
            if (exp.description) {
              const descriptions = exp.description.split(/[•\n]/).filter(desc => desc.trim());
              if (descriptions.length > 1) {
                descriptions.forEach(desc => {
                  if (desc.trim()) {
                    addBulletPoint(desc.trim(), 10);
                  }
                });
              } else {
                addBulletPoint(exp.description, 10);
              }
            }
            
            if (index < portfolio.experience.length - 1) {
              yPosition += 3;
            }
          }
        });
        addSectionSeparator();
      }

      // EDUCATION (ATS Standard Format)
      if (portfolio.education && portfolio.education.length > 0) {
        addText('EDUCATION', 12, 'bold');
        yPosition += 2;

        portfolio.education.forEach((edu, index) => {
          if (edu.degree || edu.institution) {
            // Degree (Bold)
            if (edu.degree) {
              addText(edu.degree, 11, 'bold');
            }
            
            // Institution and Year
            const institutionYear = [];
            if (edu.institution) institutionYear.push(edu.institution);
            if (edu.year) institutionYear.push(edu.year);
            
            if (institutionYear.length > 0) {
              addText(institutionYear.join(' | '), 10);
            }
            
            // Education Description
            if (edu.description) {
              yPosition += 1;
              addText(edu.description, 10);
            }
            
            if (index < portfolio.education.length - 1) {
              yPosition += 3;
            }
          }
        });
      }

      // Save the PDF
      pdf.save(`${portfolio.full_name || 'resume'}-resume.pdf`);
      
      toast({
        title: 'Success',
        description: 'ATS-friendly resume downloaded successfully!',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF.',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out successfully',
        description: 'You have been logged out of your account.',
      });
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: 'There was a problem signing you out.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-hero">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="border-b bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Job Hunter Pro
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <Button onClick={handleSignOut} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </header>
            <main className="flex-1 p-8 overflow-auto">
              <div className="container mx-auto max-w-6xl">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/4"></div>
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Hunter Pro
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Editor */}
                <div className="lg:w-1/2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">My Portfolio</h1>
                  </div>

                  {/* Resume Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Resume Upload
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          disabled={uploading || parsing}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm">
                            {uploading ? 'Uploading...' : parsing ? 'Parsing with AI...' : 'Click to upload PDF resume'}
                          </span>
                        </label>
                      </div>
                      
                      {portfolio?.resume_url && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm flex-1">Resume uploaded</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(portfolio.resume_url!, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      )}

                    </CardContent>
                  </Card>

                  {/* ... keep existing code (Personal Information, Skills, Experience, Education sections) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={localFormData.full_name}
                            onChange={(e) => handleFormChange('full_name', e.target.value)}
                            onBlur={(e) => handleFieldBlur('full_name', e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={localFormData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            onBlur={(e) => handleFieldBlur('email', e.target.value)}
                            placeholder="john@example.com"
                            type="email"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={localFormData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label>LinkedIn Profile</Label>
                          <Input
                            value={localFormData.linkedin_profile}
                            onChange={(e) => handleFormChange('linkedin_profile', e.target.value)}
                            onBlur={(e) => handleFieldBlur('linkedin_profile', e.target.value)}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </div>
                      </div>
                      {!portfolio?.parsed_summary && (
                        <div>
                          <Label>Professional Summary</Label>
                          <Textarea
                            value={localFormData.parsed_summary}
                            onChange={(e) => handleFormChange('parsed_summary', e.target.value)}
                            onBlur={(e) => handleFieldBlur('parsed_summary', e.target.value)}
                            placeholder="Brief professional summary highlighting your key skills and experience..."
                            rows={3}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Professional Summary Section */}
                  {portfolio?.parsed_summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5" />
                          Professional Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={portfolio.parsed_summary}
                          onChange={(e) => updatePortfolio({ parsed_summary: e.target.value })}
                          placeholder="Brief professional summary highlighting your key skills and experience..."
                          rows={4}
                          className="text-sm"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Skills Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        />
                        <Button onClick={addSkill} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {portfolio?.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {skill}
                            <button
                              onClick={() => removeSkill(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Experience
                        <Button onClick={addExperience} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {localExperience.map((exp, index) => (
                        <div key={index} className="p-4 border rounded space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                              <div>
                                <Label>Job Title</Label>
                                <Input
                                  value={exp.title}
                                  onChange={(e) => updateLocalExperience(index, 'title', e.target.value)}
                                  placeholder="Software Engineer"
                                />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input
                                  value={exp.company}
                                  onChange={(e) => updateLocalExperience(index, 'company', e.target.value)}
                                  placeholder="Company Name"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div>
                            <Label>Duration</Label>
                            <Input
                              value={exp.duration}
                              onChange={(e) => updateLocalExperience(index, 'duration', e.target.value)}
                              placeholder="Jan 2020 - Present"
                            />
                          </div>
                          
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateLocalExperience(index, 'description', e.target.value)}
                              placeholder="Describe your role and achievements..."
                              rows={3}
                            />
                          </div>
                          
                          {changedExperience.has(index) && (
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => saveExperience(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Education Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Education
                        <Button onClick={addEducation} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {localEducation.map((edu, index) => (
                        <div key={index} className="p-4 border rounded space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                              <div>
                                <Label>Degree</Label>
                                <Input
                                  value={edu.degree}
                                  onChange={(e) => updateLocalEducation(index, 'degree', e.target.value)}
                                  placeholder="Bachelor of Science"
                                />
                              </div>
                              <div>
                                <Label>Institution</Label>
                                <Input
                                  value={edu.institution}
                                  onChange={(e) => updateLocalEducation(index, 'institution', e.target.value)}
                                  placeholder="University Name"
                                />
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div>
                            <Label>Year</Label>
                            <Input
                              value={edu.year}
                              onChange={(e) => updateLocalEducation(index, 'year', e.target.value)}
                              placeholder="2020"
                            />
                          </div>
                          
                          <div>
                            <Label>Description (Optional)</Label>
                            <Textarea
                              value={edu.description || ''}
                              onChange={(e) => updateLocalEducation(index, 'description', e.target.value)}
                              placeholder="Additional details..."
                              rows={2}
                            />
                          </div>
                          
                          {changedEducation.has(index) && (
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => saveEducation(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Live Preview */}
                <div className="lg:w-1/2">
                  <div className="sticky top-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Resume Preview
                          {portfolio && (
                            <Button onClick={downloadPDF} variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div id="resume-preview" className="bg-white text-black p-6 space-y-4 min-h-[800px]">
                          {/* Header */}
                          <div className="text-center border-b-2 border-gray-800 pb-3 resume-section">
                            <h1 className="text-xl font-bold text-gray-900 mb-1">
                              {localFormData.full_name || portfolio?.full_name || 'Your Name'}
                            </h1>
                            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-700">
                              {(localFormData.email || portfolio?.email) && (
                                <span>
                                  {localFormData.email || portfolio?.email}
                                </span>
                              )}
                              {(localFormData.phone || portfolio?.phone) && (
                                <span>
                                  {localFormData.phone || portfolio?.phone}
                                </span>
                              )}
                              {(localFormData.linkedin_profile || portfolio?.location) && (
                                <span>
                                  {localFormData.linkedin_profile || portfolio?.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Professional Summary - Moved after Personal Information */}
                          {(localFormData.parsed_summary || portfolio?.parsed_summary) && (
                            <div className="resume-section">
                              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                                PROFESSIONAL SUMMARY
                              </h2>
                              <p className="text-xs text-gray-800 leading-relaxed">{localFormData.parsed_summary || portfolio?.parsed_summary}</p>
                            </div>
                          )}

                          {/* Skills */}
                          {portfolio?.skills && portfolio.skills.length > 0 && (
                            <div className="resume-section">
                              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                                TECHNICAL SKILLS
                              </h2>
                              <div className="text-xs text-gray-800">
                                {portfolio.skills.join(' • ')}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {localExperience && localExperience.length > 0 && (
                            <div className="resume-section">
                              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                                PROFESSIONAL EXPERIENCE
                              </h2>
                              <div className="space-y-3">
                                {localExperience.map((exp, index) => (
                                  <div key={index} className="resume-item">
                                    <div className="flex justify-between items-start mb-1">
                                      <h3 className="text-xs font-semibold text-gray-900">{exp.title}</h3>
                                      <span className="text-xs text-gray-700">{exp.duration}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 font-medium mb-1">{exp.company}</p>
                                    {exp.description && (
                                      <p className="text-xs text-gray-800 leading-relaxed">{exp.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education */}
                          {localEducation && localEducation.length > 0 && (
                            <div className="resume-section">
                              <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                                EDUCATION
                              </h2>
                              <div className="space-y-2">
                                {localEducation.map((edu, index) => (
                                  <div key={index} className="resume-item">
                                    <div className="flex justify-between items-start mb-1">
                                      <h3 className="text-xs font-semibold text-gray-900">{edu.degree}</h3>
                                      <span className="text-xs text-gray-700">{edu.year}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 font-medium">{edu.institution}</p>
                                    {edu.description && (
                                      <p className="text-xs text-gray-800 mt-1">{edu.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!portfolio || (!portfolio.full_name && !portfolio.skills?.length && !portfolio.experience?.length)) && (
                            <div className="text-center py-12 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm mb-2">Start building your resume</p>
                              <p className="text-xs">Fill in your personal information, skills, experience, and education</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Portfolio;