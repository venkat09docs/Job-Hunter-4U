import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, Trash2, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
          skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
          experience: Array.isArray(data.experience) ? (data.experience as unknown as ExperienceItem[]) : [],
          education: Array.isArray(data.education) ? (data.education as unknown as EducationItem[]) : []
        };
        setPortfolio(transformedData);
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
          skills: [],
          experience: [],
          education: []
        })
        .select()
        .single();

      if (error) throw error;

      const transformedData: Portfolio = {
        ...data,
        skills: [],
        experience: [],
        education: []
      };
      
      setPortfolio(transformedData);
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
        skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
        experience: Array.isArray(data.experience) ? (data.experience as unknown as ExperienceItem[]) : [],
        education: Array.isArray(data.education) ? (data.education as unknown as EducationItem[]) : []
      };
      
      setPortfolio(transformedData);
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
                <div className="p-3 bg-primary/5 rounded border">
                  <h4 className="font-medium text-sm mb-2">AI Summary</h4>
                  <p className="text-sm text-muted-foreground">{portfolio.parsed_summary}</p>
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
                <CardTitle>Resume Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header */}
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold">{user?.email || 'Your Name'}</h2>
                  {portfolio?.parsed_summary && (
                    <p className="text-muted-foreground mt-2">{portfolio.parsed_summary}</p>
                  )}
                </div>

                {/* Skills */}
                {portfolio?.skills && portfolio.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {portfolio?.experience && portfolio.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Experience</h3>
                    <div className="space-y-4">
                      {portfolio.experience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-primary pl-4">
                          <h4 className="font-medium">{exp.title}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                          {exp.description && (
                            <p className="text-sm mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {portfolio?.education && portfolio.education.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Education</h3>
                    <div className="space-y-3">
                      {portfolio.education.map((edu, index) => (
                        <div key={index}>
                          <h4 className="font-medium">{edu.degree}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution} • {edu.year}</p>
                          {edu.description && (
                            <p className="text-sm mt-1">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!portfolio && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Upload your resume to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;