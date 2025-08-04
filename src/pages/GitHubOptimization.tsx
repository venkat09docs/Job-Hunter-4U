import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Github, Eye, FileText, ArrowLeft, ExternalLink, StickyNote, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

const GIT_LINKEDIN_TOOL_ID = 'eff64291-db9d-4bcf-8bfe-82d58bfeeebe';

interface ProfileData {
  name: string;
  title: string;
  bio: string;
  location: string;
  email: string;
  website: string;
  github: string;
  linkedin: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  achievements: string;
  languages: string;
  interests: string;
}

const GitHubOptimization = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: profile?.full_name || '',
    title: '',
    bio: '',
    location: '',
    email: '',
    website: '',
    github: profile?.github_url || '',
    linkedin: profile?.linkedin_url || '',
    skills: '',
    experience: '',
    education: '',
    projects: '',
    achievements: '',
    languages: '',
    interests: ''
  });
  
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [activeField, setActiveField] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const generateReadme = () => {
    const { name, title, bio, location, email, website, github, linkedin, skills, experience, education, projects, achievements, languages, interests } = profileData;
    
    return `# Hi there, I'm ${name} 👋

${bio ? `${bio}\n` : ''}
${title ? `## 💼 ${title}\n` : ''}
${location ? `📍 **Location:** ${location}\n` : ''}
${email ? `📧 **Email:** ${email}\n` : ''}
${website ? `🌐 **Website:** [${website}](${website})\n` : ''}
${linkedin ? `💼 **LinkedIn:** [Connect with me](${linkedin})\n` : ''}

${skills ? `## 🛠️ Skills & Technologies

${skills}
` : ''}
${experience ? `## 💼 Professional Experience

${experience}
` : ''}
${education ? `## 🎓 Education

${education}
` : ''}
${projects ? `## 🚀 Featured Projects

${projects}
` : ''}
${achievements ? `## 🏆 Achievements

${achievements}
` : ''}
${languages ? `## 🗣️ Languages

${languages}
` : ''}
${interests ? `## 🎯 Interests

${interests}
` : ''}
## 📊 GitHub Stats

![${name}'s GitHub stats](https://github-readme-stats.vercel.app/api?username=${github.split('/').pop() || 'username'}&show_icons=true&theme=radical)

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${github.split('/').pop() || 'username'}&layout=compact&theme=radical)

## 🔥 GitHub Streak

[![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=${github.split('/').pop() || 'username'}&theme=radical)](https://git.io/streak-stats)

---

⭐️ From [${name}](${github})`;
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch saved notes from Build Git & LinkedIn Profiles tool
  useEffect(() => {
    const fetchSavedNotes = async () => {
      try {
        // Fetch chat messages from Build Git & LinkedIn Profiles tool
        const { data: chats } = await supabase
          .from('tool_chats')
          .select('messages, title, created_at')
          .eq('tool_id', GIT_LINKEDIN_TOOL_ID)
          .order('created_at', { ascending: false });

        if (chats) {
          setSavedNotes(chats);
        }
      } catch (error) {
        console.error('Error fetching saved notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedNotes();
  }, []);

  const getFieldTips = (field: string) => {
    const tips = {
      name: [
        "Use your real name for credibility",
        "Consider adding emojis to make it more engaging",
        "Keep it professional but friendly"
      ],
      title: [
        "Be specific about your role and tech stack",
        "Include your years of experience",
        "Add technologies you specialize in"
      ],
      bio: [
        "Keep it concise but impactful (2-3 lines max)",
        "Mention what you're passionate about",
        "Include what makes you unique as a developer"
      ],
      skills: [
        "Group skills by category (Frontend, Backend, Tools)",
        "Use bullet points for better readability",
        "Include proficiency levels if relevant"
      ],
      experience: [
        "Use reverse chronological order",
        "Include company names and duration",
        "Highlight key achievements and technologies used"
      ],
      education: [
        "Include degree, institution, and year",
        "Add relevant certifications",
        "Mention any honors or special achievements"
      ],
      projects: [
        "Include live demo links and repository links",
        "Briefly describe the tech stack used",
        "Highlight the problem solved or impact created"
      ],
      achievements: [
        "Include hackathon wins, certifications, awards",
        "Add open source contributions",
        "Mention any speaking engagements or publications"
      ]
    };
    return tips[field as keyof typeof tips] || [];
  };

  const handleDownload = () => {
    const readmeContent = generateReadme();
    const blob = new Blob([readmeContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('README.md downloaded successfully!');
  };

  const handleGoToGitHub = () => {
    const githubUrl = profile?.github_url;
    if (githubUrl && githubUrl.trim()) {
      window.open(githubUrl, '_blank');
    } else {
      toast.error('GitHub URL not configured in your profile settings');
      setTimeout(() => {
        window.open('https://github.com', '_blank');
      }, 2000);
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    setActiveField(fieldName);
  };


  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <header className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              GitHub Profile README Generator
            </h1>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Create a professional README.md for your GitHub profile
              </p>
              <div className="flex items-center gap-2 ml-4">
                <Button onClick={handleDownload} variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download README.md
                </Button>
                <Button onClick={handleGoToGitHub} variant="outline" size="sm" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Go to GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
        <UserProfileDropdown />
      </header>

      <main className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Left Side - Input Fields */}
          <div className="p-6 border-r overflow-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onFocus={() => handleFieldFocus('name')}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      onFocus={() => handleFieldFocus('title')}
                      placeholder="Full Stack Developer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio/Introduction</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      onFocus={() => handleFieldFocus('bio')}
                      placeholder="I'm a passionate developer who loves creating innovative solutions..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      onFocus={() => handleFieldFocus('location')}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => handleFieldFocus('email')}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      onFocus={() => handleFieldFocus('website')}
                      placeholder="https://johndoe.dev"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub Profile URL</Label>
                    <Input
                      id="github"
                      value={profileData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      onFocus={() => handleFieldFocus('github')}
                      placeholder="https://github.com/johndoe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedin"
                      value={profileData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      onFocus={() => handleFieldFocus('linkedin')}
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="skills">Skills & Technologies</Label>
                    <Textarea
                      id="skills"
                      value={profileData.skills}
                      onChange={(e) => handleInputChange('skills', e.target.value)}
                      onFocus={() => handleFieldFocus('skills')}
                      placeholder="- JavaScript, TypeScript, Python
- React, Node.js, Django
- AWS, Docker, Kubernetes"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={profileData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      onFocus={() => handleFieldFocus('experience')}
                      placeholder="- **Senior Developer at TechCorp** (2022-Present)
- **Full Stack Developer at StartupXYZ** (2020-2022)"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      onFocus={() => handleFieldFocus('education')}
                      placeholder="- **BS Computer Science** - University of Technology (2020)
- **Certified AWS Solutions Architect** (2021)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="projects">Featured Projects</Label>
                    <Textarea
                      id="projects"
                      value={profileData.projects}
                      onChange={(e) => handleInputChange('projects', e.target.value)}
                      onFocus={() => handleFieldFocus('projects')}
                      placeholder="- **[Project Name](link)** - Description of the project
- **[Another Project](link)** - Another project description"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievements">Achievements</Label>
                    <Textarea
                      id="achievements"
                      value={profileData.achievements}
                      onChange={(e) => handleInputChange('achievements', e.target.value)}
                      onFocus={() => handleFieldFocus('achievements')}
                      placeholder="- Winner of Hackathon 2023
- Open Source Contributor with 100+ contributions"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="languages">Languages</Label>
                    <Input
                      id="languages"
                      value={profileData.languages}
                      onChange={(e) => handleInputChange('languages', e.target.value)}
                      onFocus={() => handleFieldFocus('languages')}
                      placeholder="English (Native), Spanish (Fluent), French (Basic)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      value={profileData.interests}
                      onChange={(e) => handleInputChange('interests', e.target.value)}
                      onFocus={() => handleFieldFocus('interests')}
                      placeholder="Machine Learning, Open Source, Photography"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Middle - Notes & Tips */}
          <div className="p-6 border-r overflow-auto bg-muted/10">
            <div className="space-y-6">
              {/* Dynamic Tips Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5" />
                    {activeField ? `Tips for ${activeField.charAt(0).toUpperCase() + activeField.slice(1)}` : 'GitHub Profile Tips'}
                  </CardTitle>
                  <CardDescription>
                    {activeField ? `Best practices for your ${activeField} section` : 'Select a field to see specific tips'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeField ? (
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {getFieldTips(activeField).map((tip, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-accent/20">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click on any input field to see specific tips for that section.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Separator />

              {/* Saved Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <StickyNote className="h-5 w-5" />
                    Git & LinkedIn Profile Notes
                  </CardTitle>
                  <CardDescription>
                    Your saved notes from Build Git & LinkedIn Profiles tool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : savedNotes.length > 0 ? (
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {savedNotes.map((note, index) => (
                          <Card key={index} className="p-3 bg-accent/10">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm">{note.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {new Date(note.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            <ScrollArea className="h-20">
                              <div className="space-y-1">
                                {note.messages?.slice(-3).map((message: any, msgIndex: number) => (
                                  <p key={msgIndex} className="text-xs text-muted-foreground">
                                    {message.content?.substring(0, 100)}...
                                  </p>
                                ))}
                              </div>
                            </ScrollArea>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center h-32 flex items-center justify-center">
                      <div className="space-y-2">
                        <StickyNote className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No saved notes found from Build Git & LinkedIn Profiles tool
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Use the AI tool to create and save notes
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate('/dashboard/digital-career-hub')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to Tool
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="p-6 bg-muted/30 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  README.md Preview
                </h2>
                <Badge variant="outline">Live Preview</Badge>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded-lg border overflow-auto max-h-[calc(100vh-200px)]">
                    {generateReadme()}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Setup Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">1. Create Special Repository</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a new repository with the same name as your GitHub username (e.g., if your username is "johndoe", create a repository named "johndoe").
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">2. Add README.md</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload the downloaded README.md file to the root of this special repository.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">3. Make it Public</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure the repository is public so that the README appears on your GitHub profile.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">4. Customize Further</h4>
                    <p className="text-sm text-muted-foreground">
                      You can add GitHub stats widgets, visitor counters, and other dynamic elements to make your profile even more engaging.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GitHubOptimization;