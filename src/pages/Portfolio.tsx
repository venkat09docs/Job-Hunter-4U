import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2, FileText, Download, User, Mail, Phone, MapPin, Edit3 } from 'lucide-react';
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
    location: '',
    parsed_summary: ''
  });

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
          location: (data as any).location || '',
          parsed_summary: data.parsed_summary || ''
        });
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
          location: '',
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
        location: (data as any).location || '',
        parsed_summary: data.parsed_summary || ''
      });
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
        location: (data as any).location || '',
        parsed_summary: data.parsed_summary || ''
      });
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
    debouncedUpdate({ [field]: value });
  };

  // Handle blur events for immediate save
  const handleFieldBlur = (field: string, value: string) => {
    updatePortfolio({ [field]: value });
  };
  const addExperience = () => {
    if (!portfolio) return;
    
    const newExp: ExperienceItem = {
      title: '',
      company: '',
      duration: '',
      description: ''
    };
    const updatedExperience = [...portfolio.experience, newExp];
    updatePortfolio({ experience: updatedExperience });
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    if (!portfolio) return;
    
    const updatedExperience = [...portfolio.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    updatePortfolio({ experience: updatedExperience });
  };

  const removeExperience = (index: number) => {
    if (!portfolio) return;
    
    const updatedExperience = portfolio.experience.filter((_, i) => i !== index);
    updatePortfolio({ experience: updatedExperience });
  };

  const addEducation = () => {
    if (!portfolio) return;
    
    const newEdu: EducationItem = {
      degree: '',
      institution: '',
      year: '',
      description: ''
    };
    const updatedEducation = [...portfolio.education, newEdu];
    updatePortfolio({ education: updatedEducation });
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    if (!portfolio) return;
    
    const updatedEducation = [...portfolio.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    updatePortfolio({ education: updatedEducation });
  };

  const removeEducation = (index: number) => {
    if (!portfolio) return;
    
    const updatedEducation = portfolio.education.filter((_, i) => i !== index);
    updatePortfolio({ education: updatedEducation });
  };

  const downloadPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
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
            {portfolio && (
              <Button onClick={downloadPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
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
                <div className="p-3 bg-primary/5 rounded border">
                  <h4 className="font-medium text-sm mb-2">AI Summary</h4>
                  <p className="text-sm text-muted-foreground">{portfolio.parsed_summary}</p>
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
                  <Label>Location</Label>
                  <Input
                    value={localFormData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    onBlur={(e) => handleFieldBlur('location', e.target.value)}
                    placeholder="New York, NY"
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
              {portfolio?.experience.map((exp, index) => (
                <div key={index} className="p-4 border rounded space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <Label>Job Title</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
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
                      onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                      placeholder="Jan 2020 - Present"
                    />
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Describe your role and achievements..."
                      rows={3}
                    />
                  </div>
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
              {portfolio?.education.map((edu, index) => (
                <div key={index} className="p-4 border rounded space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <div>
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="Bachelor of Science"
                        />
                      </div>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
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
                      onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  
                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea
                      value={edu.description || ''}
                      onChange={(e) => updateEducation(index, 'description', e.target.value)}
                      placeholder="Additional details..."
                      rows={2}
                    />
                  </div>
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
                <CardTitle>ATS Resume Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="resume-preview" className="bg-white text-black p-8 space-y-6 min-h-[800px]">
                  {/* Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {localFormData.full_name || portfolio?.full_name || 'Your Name'}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700">
                      {(localFormData.email || portfolio?.email) && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {localFormData.email || portfolio?.email}
                        </div>
                      )}
                      {(localFormData.phone || portfolio?.phone) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {localFormData.phone || portfolio?.phone}
                        </div>
                      )}
                      {(localFormData.location || portfolio?.location) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {localFormData.location || portfolio?.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  {(localFormData.parsed_summary || portfolio?.parsed_summary) && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        PROFESSIONAL SUMMARY
                      </h2>
                      <p className="text-gray-800 leading-relaxed">{localFormData.parsed_summary || portfolio?.parsed_summary}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {portfolio?.skills && portfolio.skills.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        TECHNICAL SKILLS
                      </h2>
                      <div className="text-gray-800">
                        {portfolio.skills.join(' • ')}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {portfolio?.experience && portfolio.experience.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        PROFESSIONAL EXPERIENCE
                      </h2>
                      <div className="space-y-4">
                        {portfolio.experience.map((exp, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                              <span className="text-gray-700 text-sm">{exp.duration}</span>
                            </div>
                            <p className="text-gray-700 font-medium mb-2">{exp.company}</p>
                            {exp.description && (
                              <p className="text-gray-800 leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {portfolio?.education && portfolio.education.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
                        EDUCATION
                      </h2>
                      <div className="space-y-3">
                        {portfolio.education.map((edu, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                              <span className="text-gray-700 text-sm">{edu.year}</span>
                            </div>
                            <p className="text-gray-700 font-medium">{edu.institution}</p>
                            {edu.description && (
                              <p className="text-gray-800 mt-1">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!portfolio || (!portfolio.full_name && !portfolio.skills?.length && !portfolio.experience?.length)) && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">Start building your resume</p>
                      <p className="text-sm">Fill in your personal information, skills, experience, and education</p>
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