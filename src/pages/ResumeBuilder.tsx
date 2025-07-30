import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Download, CheckCircle, Plus, Minus, Sparkles, FileEdit, ChevronDown, ChevronRight, Target } from 'lucide-react';

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

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<StatusType>('draft');
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [coverLetterSuggestions, setCoverLetterSuggestions] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  
  // Sidebar suggestions state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personalDetails: false,
    experience: false,
    education: false,
    skills: false,
    certifications: false,
    summary: false
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

  const [checklist, setChecklist] = useState({
    personalInfo: false,
    experience: false,
    education: false,
    skills: false,
    summary: false
  });

  // Update checklist based on form data
  const updateChecklist = () => {
    setChecklist({
      personalInfo: !!(resumeData.personalDetails.fullName && resumeData.personalDetails.email && resumeData.personalDetails.phone),
      experience: resumeData.experience.some(exp => exp.company && exp.role),
      education: resumeData.education.some(edu => edu.institution && edu.degree),
      skills: resumeData.skills.some(skill => skill.trim()),
      summary: !!resumeData.professionalSummary.trim()
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSectionSuggestions = (section: string) => {
    switch (section) {
      case 'personalDetails':
        return {
          title: 'Personal Details Tips',
          content: `• Use a professional email address
• Include a complete phone number with area code
• Consider adding your LinkedIn profile URL
• Keep location general (city, state) for privacy
• Use your full legal name as it appears on official documents`
        };
      case 'experience':
        return {
          title: 'Experience Enhancement',
          content: `• Start each bullet point with strong action verbs
• Quantify achievements with specific numbers and metrics
• Focus on results and impact, not just responsibilities
• Tailor experience to match job requirements
• Keep descriptions concise but impactful (2-3 bullet points per role)`
        };
      case 'education':
        return {
          title: 'Education Optimization',
          content: `• List most recent education first
• Include relevant coursework for recent graduates
• Mention honors, dean's list, or academic achievements
• Only include GPA if it's 3.5 or higher
• Add relevant certifications or additional training`
        };
      case 'skills':
        return {
          title: 'Skills & Interests Strategy',
          content: `• Mix technical and soft skills relevant to your field
• Group similar skills together (Programming, Marketing, etc.)
• Include interests that show personality and cultural fit
• Avoid outdated technologies unless specifically required
• Be honest about proficiency levels`
        };
      case 'certifications':
        return {
          title: 'Certifications & Awards',
          content: `• List industry-relevant certifications prominently
• Include expiration dates for time-sensitive certifications
• Mention any ongoing professional development
• Highlight awards that demonstrate professional excellence
• Include volunteer work that shows leadership skills`
        };
      case 'summary':
        return {
          title: 'Professional Summary Guide',
          content: `• Keep it concise (3-4 sentences maximum)
• Highlight your unique value proposition
• Include years of experience and key specializations
• Mention 2-3 key achievements or skills
• Tailor it to the specific role you're targeting`
        };
      default:
        return { title: 'Resume Tips', content: 'Fill out this section to get specific suggestions.' };
    }
  };

  const addArrayItem = (field: keyof ResumeData, defaultValue: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultValue]
    }));
  };

  const removeArrayItem = (field: keyof ResumeData, index: number) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof ResumeData, index: number, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  };

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
      const { error } = await supabase
        .from('portfolios')
        .upsert({
          user_id: user.id,
          full_name: resumeData.personalDetails.fullName,
          email: resumeData.personalDetails.email,
          phone: resumeData.personalDetails.phone,
          location: resumeData.personalDetails.location,
          experience: resumeData.experience as any,
          education: resumeData.education as any,
          skills: resumeData.skills.filter(skill => skill.trim()) as any,
          parsed_summary: resumeData.professionalSummary
        });

      if (error) throw error;

      setStatus('finalized');
      toast({
        title: 'Resume saved successfully!',
        description: 'Your resume data has been saved to your profile.',
      });
    } catch (error) {
      toast({
        title: 'Error saving resume',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const downloadResume = () => {
    setStatus('downloaded');
    toast({
      title: 'Resume downloaded!',
      description: 'Your resume has been prepared for download.',
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
                  Resume Builder
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
            <div className="flex gap-8 max-w-7xl mx-auto">
              {/* Left Column - Form */}
              <div className="flex-1 space-y-8">
              {/* Status and Checklist */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Status Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusBadge()}
                      <span className="text-sm text-muted-foreground">
                        Current status
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Resume Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(checklist).map(([key, completed]) => (
                        <div key={key} className="flex items-center gap-2">
                          <CheckCircle className={`h-4 w-4 ${completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className={`text-sm ${completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName"
                        value={resumeData.personalDetails.fullName}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, fullName: e.target.value }
                          }));
                          updateChecklist();
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={resumeData.personalDetails.email}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, email: e.target.value }
                          }));
                          updateChecklist();
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone"
                        value={resumeData.personalDetails.phone}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, phone: e.target.value }
                          }));
                          updateChecklist();
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location"
                        value={resumeData.personalDetails.location}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, location: e.target.value }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
                      <Input 
                        id="linkedin"
                        value={resumeData.personalDetails.linkedIn}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, linkedIn: e.target.value }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub (Optional)</Label>
                      <Input 
                        id="github"
                        value={resumeData.personalDetails.github}
                        onChange={(e) => {
                          setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, github: e.target.value }
                          }));
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Write a compelling professional summary..."
                    value={resumeData.professionalSummary}
                    onChange={(e) => {
                      setResumeData(prev => ({ ...prev, professionalSummary: e.target.value }));
                      updateChecklist();
                    }}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Experience */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Experience</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', description: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            onChange={(e) => {
                              updateArrayItem('experience', index, { ...exp, company: e.target.value });
                              updateChecklist();
                            }}
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input 
                            value={exp.role}
                            onChange={(e) => {
                              updateArrayItem('experience', index, { ...exp, role: e.target.value });
                              updateChecklist();
                            }}
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
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Education</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addArrayItem('education', { institution: '', degree: '', duration: '', gpa: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            onChange={(e) => {
                              updateArrayItem('education', index, { ...edu, institution: e.target.value });
                              updateChecklist();
                            }}
                          />
                        </div>
                        <div>
                          <Label>Degree</Label>
                          <Input 
                            value={edu.degree}
                            onChange={(e) => {
                              updateArrayItem('education', index, { ...edu, degree: e.target.value });
                              updateChecklist();
                            }}
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
                </CardContent>
              </Card>

              {/* Skills & Interests */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Key Skills</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addArrayItem('skills', '')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resumeData.skills.map((skill, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={skill}
                          onChange={(e) => {
                            updateArrayItem('skills', index, e.target.value);
                            updateChecklist();
                          }}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Interests</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addArrayItem('interests', '')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resumeData.interests.map((interest, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={interest}
                          onChange={(e) => updateArrayItem('interests', index, e.target.value)}
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
                  </CardContent>
                </Card>
              </div>

              {/* Certifications & Awards */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Certifications</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addArrayItem('certifications', '')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resumeData.certifications.map((cert, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={cert}
                          onChange={(e) => updateArrayItem('certifications', index, e.target.value)}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Awards</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addArrayItem('awards', '')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {resumeData.awards.map((award, index) => (
                      <div key={index} className="flex gap-2">
                        <Input 
                          value={award}
                          onChange={(e) => updateArrayItem('awards', index, e.target.value)}
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
                  </CardContent>
                </Card>
              </div>

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
                  variant="outline"
                  onClick={generateCoverLetter}
                  disabled={loading}
                  className="gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  Generate Cover Letter
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

              {/* Cover Letter */}
              {showCoverLetter && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Generated Cover Letter</CardTitle>
                    <CardDescription>
                      Customize this cover letter for your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={coverLetterSuggestions}
                      onChange={(e) => setCoverLetterSuggestions(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Save and Download */}
              <div className="flex gap-4">
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
              </div>

              {/* Right Column - Suggestions Sidebar */}
              <div className="w-80 space-y-4">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Smart Suggestions
                    </CardTitle>
                    <CardDescription>
                      Click on sections below to get targeted advice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Personal Details Suggestion */}
                    <Collapsible 
                      open={openSections.personalDetails} 
                      onOpenChange={() => toggleSection('personalDetails')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Personal Details</span>
                          {openSections.personalDetails ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('personalDetails').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('personalDetails').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Experience Suggestion */}
                    <Collapsible 
                      open={openSections.experience} 
                      onOpenChange={() => toggleSection('experience')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Experience</span>
                          {openSections.experience ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('experience').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('experience').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Education Suggestion */}
                    <Collapsible 
                      open={openSections.education} 
                      onOpenChange={() => toggleSection('education')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Education</span>
                          {openSections.education ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('education').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('education').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Skills & Interests Suggestion */}
                    <Collapsible 
                      open={openSections.skills} 
                      onOpenChange={() => toggleSection('skills')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Skills & Interests</span>
                          {openSections.skills ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('skills').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('skills').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Certifications & Awards Suggestion */}
                    <Collapsible 
                      open={openSections.certifications} 
                      onOpenChange={() => toggleSection('certifications')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Certifications & Awards</span>
                          {openSections.certifications ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('certifications').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('certifications').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Professional Summary Suggestion */}
                    <Collapsible 
                      open={openSections.summary} 
                      onOpenChange={() => toggleSection('summary')}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2">
                          <span className="text-sm font-medium">Professional Summary</span>
                          {openSections.summary ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <h4 className="font-medium text-foreground">
                            {getSectionSuggestions('summary').title}
                          </h4>
                          <p className="whitespace-pre-line">
                            {getSectionSuggestions('summary').content}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ResumeBuilder;