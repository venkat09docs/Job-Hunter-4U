import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus, SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useToolChats } from '@/hooks/useToolChats';
import { Linkedin, CheckCircle, Target, ExternalLink, ArrowLeft, Lightbulb, Plus, Minus, Copy, FileText } from 'lucide-react';

interface LinkedInTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
}

const LINKEDIN_TASKS: Omit<LinkedInTask, 'completed'>[] = [
  // Profile Basics
  { id: 'profile-photo', title: 'Professional Profile Photo', description: 'Upload a high-quality, professional headshot', category: 'Profile Basics' },
  { id: 'headline', title: 'Compelling Headline', description: 'Write a compelling headline that showcases your value proposition', category: 'Profile Basics' },
  { id: 'about-section', title: 'About Section', description: 'Craft a compelling about section (summary) with keywords', category: 'Profile Basics' },
  { id: 'location', title: 'Location & Industry', description: 'Add your current location and industry', category: 'Profile Basics' },
  
  // Experience & Education
  { id: 'current-position', title: 'Current Position', description: 'Add your current job with detailed description', category: 'Experience' },
  { id: 'work-experience', title: 'Work Experience', description: 'Add all relevant work experiences with achievements', category: 'Experience' },
  { id: 'education', title: 'Education Details', description: 'Complete your education section with degrees and certifications', category: 'Experience' },
  
  // Skills & Endorsements
  { id: 'skills', title: 'Add Skills', description: 'Add relevant skills (aim for 50+ skills)', category: 'Skills' },
  { id: 'endorsements', title: 'Get Endorsements', description: 'Request endorsements from colleagues and connections', category: 'Skills' },
];

// Tool IDs for fetching notes
const GIT_LINKEDIN_TOOL_ID = 'd48e085e-51bf-4b89-a795-371d2f7ae6b3'; // 7. Build Git & LinkedIn Profiles
const EFFECTIVE_LINKEDIN_TOOL_ID = '97a32a5a-9506-4e06-a5cb-ca9477e54bf8'; // 8. Creating an effective LinkedIn Profile
const RESUME_BUILDER_TOOL_ID = '55b57cf9-4781-4b80-8e40-eb154420ce49'; // 2. Resume Builder - Achievements
const TOP_SKILLS_TOOL_ID = '20c53c53-70c1-4d50-b0af-655fe09aef7b'; // 1. Resume Builder - Top 6 Skills

const CATEGORY_TIPS: Record<string, string[]> = {
  'Profile Basics': [
    'Use a professional headshot with good lighting and a clean background',
    'Include industry keywords in your headline to improve discoverability',
    'Write your about section in first person and tell your professional story',
    'Add your current city and industry to help with local networking',
    'Use action verbs and quantifiable achievements in descriptions'
  ],
  'Experience': [
    'Use bullet points to highlight key achievements in each role',
    'Include metrics and numbers to demonstrate impact (e.g., "Increased sales by 25%")',
    'Add relevant coursework, projects, and certifications to education',
    'Update your current position regularly to reflect new responsibilities',
    'Use industry-specific keywords throughout your experience descriptions'
  ],
  'Skills': [
    'Add skills that are relevant to your target industry and role',
    'Prioritize skills that are frequently mentioned in job postings',
    'Endorse colleagues\' skills to encourage reciprocal endorsements',
    'Take LinkedIn skill assessments to validate your expertise',
    'Include both hard and soft skills for a well-rounded profile'
  ]
};

const LinkedInOptimization = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<LinkedInTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Profile Basics');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Profile Basics': true,
    'Experience': false,
    'Skills': false
  });

  // Fetch notes from specific tools
  const { chats: gitLinkedInNotes } = useToolChats(GIT_LINKEDIN_TOOL_ID);
  const { chats: effectiveLinkedInNotes } = useToolChats(EFFECTIVE_LINKEDIN_TOOL_ID);
  const { chats: resumeBuilderNotes } = useToolChats(RESUME_BUILDER_TOOL_ID);
  const { chats: topSkillsNotes } = useToolChats(TOP_SKILLS_TOOL_ID);

  useEffect(() => {
    if (user) {
      loadLinkedInProgress();
    }
  }, [user]);

  const loadLinkedInProgress = async () => {
    try {
      if (!user) return;

      // Fetch from database instead of localStorage
      const { data, error } = await supabase
        .from('linkedin_progress')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      const completedTaskIds = data?.map(item => item.task_id) || [];
      
      const tasksWithStatus = LINKEDIN_TASKS.map(task => ({
        ...task,
        completed: completedTaskIds.includes(task.id)
      }));

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error('Error loading LinkedIn progress:', error);
      // Initialize with default tasks if error
      setTasks(LINKEDIN_TASKS.map(task => ({ ...task, completed: false })));
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    try {
      if (!user) return;

      // Update database instead of localStorage
      if (completed) {
        // Insert new task completion
        const { error } = await supabase
          .from('linkedin_progress')
          .upsert({
            user_id: user.id,
            task_id: taskId,
            completed: true,
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,task_id'
          });

        if (error) throw error;
      } else {
        // Remove task completion
        const { error } = await supabase
          .from('linkedin_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('task_id', taskId);

        if (error) throw error;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));

      toast({
        title: completed ? 'Task completed!' : 'Task unchecked',
        description: completed ? 'Great progress on your LinkedIn optimization!' : 'Task marked as incomplete',
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleGoToLinkedIn = () => {
    if (!profile?.linkedin_url) {
      toast({
        title: 'LinkedIn URL not configured',
        description: 'Please configure your LinkedIn URL in Settings > Professional Details',
        variant: 'destructive'
      });
      return;
    }

    window.open(profile.linkedin_url, '_blank');
  };

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
    
    // Update selected category for tips when expanding
    if (!expandedSections[category]) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory('');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy content to clipboard',
        variant: 'destructive'
      });
    }
  };

  const getToolsForCategory = (category: string) => {
    if (category === 'Skills') {
      return [
        { id: GIT_LINKEDIN_TOOL_ID, name: 'Build Git & LinkedIn Profiles', notes: gitLinkedInNotes },
        { id: TOP_SKILLS_TOOL_ID, name: '1. Resume Builder - Top 6 Skills', notes: topSkillsNotes }
      ];
    }
    
    const baseTools = [
      { id: GIT_LINKEDIN_TOOL_ID, name: 'Build Git & LinkedIn Profiles', notes: gitLinkedInNotes },
      { id: EFFECTIVE_LINKEDIN_TOOL_ID, name: 'Creating an effective LinkedIn Profile', notes: effectiveLinkedInNotes }
    ];
    
    if (category === 'Experience') {
      baseTools.push({ id: RESUME_BUILDER_TOOL_ID, name: '2. Resume Builder - Achievements', notes: resumeBuilderNotes });
    }
    
    return baseTools;
  };

  const getCombinedNotes = (category?: string) => {
    if (category === 'Experience') {
      return [...gitLinkedInNotes, ...effectiveLinkedInNotes, ...resumeBuilderNotes];
    } else if (category === 'Skills') {
      return [...gitLinkedInNotes, ...topSkillsNotes];
    }
    return [...gitLinkedInNotes, ...effectiveLinkedInNotes];
  };

  const hasNotes = (category?: string) => {
    return getCombinedNotes(category).length > 0;
  };

  const navigateToTool = (toolId: string, toolName: string) => {
    const toolUrl = `/dashboard/digital-career-hub?toolId=${toolId}`;
    window.open(toolUrl, '_blank');
  };

  const completedCount = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, LinkedInTask[]>);

  if (loading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check premium access
  if (!canAccessFeature('linkedin_optimization')) {
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
                Go to Dashboard
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LinkedIn Profile Optimization
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
          <SubscriptionUpgrade featureName="linkedin_optimization">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  LinkedIn Optimization is a premium feature. Upgrade your plan to access professional LinkedIn optimization tools.
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
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LinkedIn Profile Optimization
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SubscriptionStatus />
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Layout with responsive columns */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Column - Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto lg:h-[calc(100vh-80px)]">
          {/* Progress Overview */}
          <div className="mb-8">
            <Card className="shadow-elegant border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-primary" />
                  LinkedIn Optimization Progress
                </CardTitle>
                <CardDescription>
                  Complete these tasks to optimize your LinkedIn profile for maximum visibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{completedCount} / {totalTasks} completed</span>
                    </div>
                    <Progress value={completionPercentage} className="h-3" />
                  </div>
                  <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-lg px-3 py-1">
                    {completionPercentage}%
                  </Badge>
                </div>
                
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Congratulations! Your LinkedIn profile is fully optimized!
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task Categories */}
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
              const categoryCompleted = categoryTasks.filter(task => task.completed).length;
              const categoryTotal = categoryTasks.length;
              const categoryPercentage = Math.round((categoryCompleted / categoryTotal) * 100);

              return (
                <Card key={category} className="shadow-elegant">
                   <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSection(category)}
                          className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                        >
                          {expandedSections[category] ? (
                            <Minus className="h-4 w-4 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4 text-primary" />
                          )}
                          {category}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleGoToLinkedIn}
                          className="gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Go to LinkedIn
                        </Button>
                        <Badge variant="outline">
                          {categoryCompleted}/{categoryTotal}
                        </Badge>
                      </div>
                    </CardTitle>
                    <Progress value={categoryPercentage} className="h-2" />
                  </CardHeader>
                  {expandedSections[category] && (
                    <CardContent>
                      <div className="space-y-4">
                        {categoryTasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <Checkbox
                              id={task.id}
                              checked={task.completed}
                              onCheckedChange={(checked) => updateTaskStatus(task.id, !!checked)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <label
                                htmlFor={task.id}
                                className={`font-medium cursor-pointer ${task.completed ? 'text-muted-foreground line-through' : ''}`}
                              >
                                {task.title}
                              </label>
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </main>

        {/* Right Column - Tips Panel */}
        <aside className="w-full lg:w-96 xl:w-[28rem] 2xl:w-[32rem] border-t lg:border-t-0 lg:border-l bg-background/50 backdrop-blur-sm p-4 md:p-6 overflow-auto max-h-screen lg:h-[calc(100vh-80px)]">
          <div className="space-y-6">
            {/* LinkedIn Profile Best Practices */}
            {selectedCategory === 'Profile Basics' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    LinkedIn Profile Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {CATEGORY_TIPS[selectedCategory]?.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-bold text-xs mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tips for other categories */}
            {selectedCategory !== 'Profile Basics' && selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Tips for {selectedCategory}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {CATEGORY_TIPS[selectedCategory]?.map((tip, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-bold text-xs mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Saved Notes Section - Show for Profile Basics, Experience, and Skills */}
            {(selectedCategory === 'Profile Basics' || selectedCategory === 'Experience' || selectedCategory === 'Skills') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Your Saved Notes
                  </CardTitle>
                  <CardDescription>
                    Notes from {selectedCategory === 'Experience' ? 'LinkedIn and Resume tools' : selectedCategory === 'Skills' ? 'LinkedIn and Skills tools' : 'LinkedIn profile tools'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Display notes from each tool individually */}
                    {getToolsForCategory(selectedCategory).map((tool) => (
                      <div key={tool.id} className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h4 className="font-medium text-sm">{tool.name}</h4>
                        </div>
                        
                        {tool.notes.length > 0 ? (
                          <ScrollArea className="h-48">
                            <div className="space-y-3">
                              {tool.notes.map((chat, index) => (
                                <div key={`${chat.id}-${index}`} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-xs truncate">{chat.title}</h5>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(chat.messages[0]?.content || '')}
                                      className="h-6 w-6 p-0 shrink-0"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                  <ScrollArea className="h-16">
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {chat.messages[0]?.content || 'No content'}
                                    </p>
                                  </ScrollArea>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(chat.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-4 bg-muted/20 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">
                              "{tool.name}" tool is not having saved Notes
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Tool Links Section */}
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        Access Tools
                      </h4>
                      {getToolsForCategory(selectedCategory).map((tool) => (
                        <Button
                          key={tool.id}
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToTool(tool.id, tool.name)}
                          className="w-full text-xs flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Open "{tool.name}" Tool</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Default message when no section is selected */}
            {!selectedCategory && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Lightbulb className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Expand sections using + to see specific tips and notes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LinkedInOptimization;