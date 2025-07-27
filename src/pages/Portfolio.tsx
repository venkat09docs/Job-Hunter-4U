import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2, FileText, Download, User, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const { user } = useAuth();
  const { toast } = useToast();
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
    const element = document.getElementById('resume-preview');
    if (!element) return;

    try {
      // Create PDF with proper page management
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // margin in mm
      const contentWidth = pageWidth - (margin * 2);
      
      // Calculate scale to fit content properly
      const elementWidth = element.scrollWidth;
      const scale = Math.min(1.5, (contentWidth * 3.779527559) / elementWidth); // 3.779527559 px per mm
      
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // Add page break styles to prevent content cut-off
          const style = clonedDoc.createElement('style');
          style.textContent = `
            .section-break { page-break-inside: avoid; break-inside: avoid; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
            p { orphans: 3; widows: 3; }
          `;
          clonedDoc.head.appendChild(style);
          
          // Add classes to sections to avoid breaks
          const sections = clonedDoc.querySelectorAll('.mb-4, .mb-6, .space-y-2 > div');
          sections.forEach(section => {
            section.classList.add('section-break');
          });
        }
      });
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      const maxPageContentHeight = pageHeight - (margin * 2);
      let yPosition = 0;
      let pageNumber = 1;
      
      // Add content with proper page management
      while (yPosition < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        // Calculate source coordinates
        const sourceY = (yPosition / imgHeight) * canvas.height;
        const sourceHeight = Math.min(
          (maxPageContentHeight / imgHeight) * canvas.height,
          canvas.height - sourceY
        );
        
        // Create a new canvas for this page portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, pageImgHeight);
        }
        
        yPosition += maxPageContentHeight;
        pageNumber++;
      }
      
      pdf.save(`${portfolio?.full_name || 'resume'}-resume.pdf`);
      
      toast({
        title: 'Success',
        description: 'Resume downloaded successfully!',
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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

              {portfolio?.parsed_summary && (
                <div className="p-3 bg-primary/5 rounded border space-y-2">
                  <h4 className="font-medium text-sm mb-2">Professional Summary</h4>
                  <Textarea
                    value={portfolio.parsed_summary}
                    onChange={(e) => updatePortfolio({ parsed_summary: e.target.value })}
                    placeholder="Professional summary..."
                    rows={4}
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
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
                  <div className="text-center border-b-2 border-gray-800 pb-3">
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

                  {/* Professional Summary */}
                  {(localFormData.parsed_summary || portfolio?.parsed_summary) && (
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                        PROFESSIONAL SUMMARY
                      </h2>
                      <p className="text-xs text-gray-800 leading-relaxed">{localFormData.parsed_summary || portfolio?.parsed_summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {portfolio?.skills && portfolio.skills.length > 0 && (
                    <div>
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
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                        PROFESSIONAL EXPERIENCE
                      </h2>
                      <div className="space-y-3">
                        {localExperience.map((exp, index) => (
                          <div key={index}>
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
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                        EDUCATION
                      </h2>
                      <div className="space-y-2">
                        {localEducation.map((edu, index) => (
                          <div key={index}>
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
  );
};

export default Portfolio;