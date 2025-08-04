import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
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

  const getCombinedNotes = () => {
    return [...gitLinkedInNotes, ...effectiveLinkedInNotes];
  };

  const hasNotes = () => {
    return getCombinedNotes().length > 0;
  };

  const navigateToTool = (toolId: string, toolName: string) => {
    const toolUrl = `/digital-career-hub?toolId=${toolId}`;
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

  if (loading) {
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

      {/* Main Layout with two columns */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Column - Main Content */}
        <main className="flex-1 p-8 overflow-auto">
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
        <aside className="w-80 border-l bg-background/50 backdrop-blur-sm p-6 overflow-auto">
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

            {/* Saved Notes Section - Only show for Profile Basics */}
            {selectedCategory === 'Profile Basics' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Your Saved Notes
                  </CardTitle>
                  <CardDescription>
                    Notes from LinkedIn profile tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasNotes() ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {getCombinedNotes().map((chat, index) => (
                          <div key={`${chat.id}-${index}`} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm truncate">{chat.title}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(chat.messages[0]?.content || '')}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <ScrollArea className="h-24">
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {chat.messages[0]?.content || 'No content'}
                              </p>
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(chat.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No notes available from LinkedIn profile tools
                      </p>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToTool(GIT_LINKEDIN_TOOL_ID, '7. Build Git & LinkedIn Profiles')}
                          className="w-full text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open "Build Git & LinkedIn Profiles" Tool
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToTool(EFFECTIVE_LINKEDIN_TOOL_ID, '8. Creating an effective LinkedIn Profile')}
                          className="w-full text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open "Creating an effective LinkedIn Profile" Tool
                        </Button>
                      </div>
                    </div>
                  )}
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