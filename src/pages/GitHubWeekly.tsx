import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Link } from 'react-router-dom';
import { 
  Github, 
  Calendar, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Upload, 
  LinkIcon, 
  Camera,
  FileText,
  Webhook,
  Settings,
  History,
  Plus,
  Trash2,
  Eye,
  Star,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Bug,
  Rocket,
  BookOpen,
  Target,
  Home,
  Lock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { GitHubWeeklyHistory } from '@/components/GitHubWeeklyHistory';
import { GitHubRequestReenableDialog } from '@/components/GitHubRequestReenableDialog';
import { 
  isDueDatePassed,
  isDueDateInAssignmentWeek,
  getGitHubTaskStatus
} from '@/utils/dueDateValidation';

const GitHubWeekly = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canAccessFeature } = usePremiumFeatures();
  const [activeTab, setActiveTab] = useState('assignments');
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [evidenceDialog, setEvidenceDialog] = useState({ open: false, taskId: null as string | null });
  const [newRepoName, setNewRepoName] = useState('');
  
  const {
    weeklyTasks,
    repoTasks,
    repos,
    signals,
    scores,
    badges,
    isLoading,
    addRepo,
    submitEvidence,
    verifyTasks,
    instantiateWeek,
    isSubmittingEvidence
  } = useGitHubWeekly();

  // Fetch pending extension requests
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  
  React.useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('github_task_reenable_requests')
          .select('user_task_id')
          .eq('user_id', user.id)
          .eq('status', 'pending');
          
        if (error) throw error;
        
        const taskIds = new Set(data?.map(req => req.user_task_id) || []);
        setPendingRequests(taskIds);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };
    
    fetchPendingRequests();
  }, [user]);

  const statusConfig = {
    'NOT_STARTED': { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Not Started' },
    'SUBMITTED': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Submitted' },
    'PARTIALLY_VERIFIED': { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Partially Verified' },
    'VERIFIED': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', label: 'Verified' }
  };

  const handleAddRepo = async () => {
    if (!newRepoName.trim()) return;
    
    try {
      await addRepo(newRepoName.trim());
      setNewRepoName('');
      toast({
        title: "Repository added",
        description: `${newRepoName} has been added to your tracking list.`,
      });
    } catch (error) {
      toast({
        title: "Error adding repository",
        description: "Failed to add repository. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartAssignment = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('github_user_tasks')
        .update({ 
          status: 'STARTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Assignment started",
        description: "You can now submit evidence for this assignment.",
      });
      
      // Refresh data after status update
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error starting assignment",
        description: "Failed to start assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitEvidence = async (taskId: string, evidenceData: any) => {
    try {
      await submitEvidence(taskId, evidenceData);
      setEvidenceDialog({ open: false, taskId: null });
      toast({
        title: "Evidence submitted",
        description: "Your evidence has been submitted for verification.",
      });
    } catch (error) {
      toast({
        title: "Error submitting evidence",
        description: "Failed to submit evidence. Please try again.",
        variant: "destructive",
      });
    }
  };

  const EvidenceSubmissionDialog = ({ taskId }: { taskId: string | null }) => {
    const [evidenceType, setEvidenceType] = useState<'URL' | 'SCREENSHOT' | 'DATA_EXPORT'>('URL');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
    // Weekly metrics state (removed projectsUpdated)
    const [commits, setCommits] = useState<number>(0);
    const [readmeUpdates, setReadmeUpdates] = useState<number>(0);

    const handleSubmit = () => {
      const evidenceData = {
        kind: evidenceType,
        url: evidenceType === 'URL' ? url : undefined,
        description,
        file: evidenceType !== 'URL' ? file : undefined,
        // Include weekly metrics (removed projectsUpdated)
        weeklyMetrics: {
          commits,
          readmeUpdates
        }
      };
      handleSubmitEvidence(taskId!, evidenceData);
    };

    // Enhanced cursor and interaction styles
    const inputClassName = "cursor-text transition-all duration-200 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg hover:border-primary/50 hover:shadow-md";
    const textareaClassName = "cursor-text min-h-[100px] resize-y transition-all duration-200 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg hover:border-primary/50 hover:shadow-md";

    return (
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            Submit Evidence
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Provide evidence and metrics to verify your GitHub task completion
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {/* Evidence Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="evidence-type" className="text-sm font-medium cursor-pointer">Evidence Type</Label>
            <Select value={evidenceType} onValueChange={(value: any) => setEvidenceType(value)}>
              <SelectTrigger className="cursor-pointer hover:bg-muted/50 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URL" className="cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL Link
                  </div>
                </SelectItem>
                <SelectItem value="SCREENSHOT" className="cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Screenshot
                  </div>
                </SelectItem>
                <SelectItem value="DATA_EXPORT" className="cursor-pointer hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Upload
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL Input */}
          {evidenceType === 'URL' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="url" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                GitHub URL
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo/commit/abc123..."
                className={inputClassName}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Paste the GitHub URL for your commit, PR, or repository</p>
            </div>
          )}

          {/* File Upload */}
          {evidenceType !== 'URL' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="file" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                {evidenceType === 'SCREENSHOT' ? <Camera className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {evidenceType === 'SCREENSHOT' ? 'Screenshot' : 'File'}
              </Label>
              <div className="relative">
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept={evidenceType === 'SCREENSHOT' ? 'image/*' : '*'}
                  className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all duration-200"
                />
                {file && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Selected: {file.name}
                  </div>
                )}
              </div>
            </div>
          )}

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-xl border border-primary/20 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-primary">
              <Target className="h-5 w-5" />
              Weekly Activity Metrics
            </h4>
            <p className="text-sm text-muted-foreground">
              Track your GitHub activity for this week. At least one metric must be greater than zero.
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commits" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <GitCommit className="h-4 w-4" />
                  Number of Commits
                </Label>
                <Input
                  id="commits"
                  type="number"
                  min="0"
                  max="999"
                  value={commits}
                  onChange={(e) => setCommits(Number(e.target.value))}
                  placeholder="Enter number of commits"
                  className={inputClassName}
                />
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Target: 10+ commits</span>
                  </div>
                  {commits >= 10 && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Target Met!
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="readme" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  README/Docs Updates
                </Label>
                <Input
                  id="readme"
                  type="number"
                  min="0"
                  max="20"
                  value={readmeUpdates}
                  onChange={(e) => setReadmeUpdates(Number(e.target.value))}
                  placeholder="Enter number of documentation updates"
                  className={inputClassName}
                />
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-muted-foreground">Target: 2-3 updates</span>
                  </div>
                  {readmeUpdates >= 2 && (
                    <Badge variant="default" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Target Met!
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional context, notes, or explanations about your work..."
              className={textareaClassName}
            />
            <p className="text-xs text-muted-foreground">
              Provide context about your work, challenges faced, or any other relevant details
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t bg-muted/20">
          <Button 
            variant="outline" 
            onClick={() => setEvidenceDialog({ open: false, taskId: null })}
            className="cursor-pointer hover:bg-muted transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmittingEvidence || (evidenceType === 'URL' && !url.trim()) || (commits === 0 && readmeUpdates === 0)}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isSubmittingEvidence ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Submit Evidence
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  // Helper function to calculate day-based due date with 48-hour window
  const calculateDayDueDate = (displayOrder: number) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate this week's Monday (start of week)
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday is 6 days from Monday
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysFromMonday);
    
    // Calculate due date for the specific day (48 hours after Monday)
    const taskDueDate = new Date(thisMonday);
    taskDueDate.setDate(thisMonday.getDate() + (displayOrder - 1)); // Day 1 = Monday, Day 2 = Tuesday, etc.
    taskDueDate.setHours(23, 59, 59, 999); // End of day
    
    // Add 48 hours buffer
    const dueWith48Hours = new Date(taskDueDate);
    dueWith48Hours.setDate(taskDueDate.getDate() + 2);
    
    return dueWith48Hours;
  };

  // Helper function to check if task is expired (past 48-hour window)
  const isTaskExpired = (displayOrder: number) => {
    const dueDate = calculateDayDueDate(displayOrder);
    return new Date() > dueDate;
  };

  // Helper function to format description with bullet points
  const formatDescription = (description: string) => {
    if (!description) return null;
    
    // Split by lines and filter out empty lines
    const lines = description.split('\n').filter(line => line.trim());
    
    return (
      <ul className="space-y-2 mt-3">
        {lines.map((line, index) => {
          // Remove ✅ emoji and clean up the text
          const cleanLine = line.replace(/^✅\s*/, '').trim();
          if (!cleanLine) return null;
          
          return (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const TaskCard = ({ task, repo = null }: { task: any; repo?: any }) => {
    const StatusIcon = statusConfig[task.status]?.icon || Circle;
    const statusColor = statusConfig[task.status]?.color || 'text-muted-foreground';
    const statusBg = statusConfig[task.status]?.bg || 'bg-muted';
    
    // Get display order from task
    const displayOrder = task.github_tasks?.display_order || 1;
    const dueDate = calculateDayDueDate(displayOrder);
    const isExpired = isTaskExpired(displayOrder);
    const canInteract = !isExpired || task.status === 'VERIFIED';
    
    // Extract day number from GitHub task title (e.g., "Day 1 – Planning & Setup" -> "Monday")
    const extractDayFromTitle = (title: string): string => {
      const dayMatch = title.match(/Day (\d+)/i);
      if (dayMatch) {
        const dayNumber = parseInt(dayMatch[1]);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayNumber - 1] || 'Monday';
      }
      return 'Monday'; // Default to Monday if can't extract
    };
    
    const assignmentDay = extractDayFromTitle(task.github_tasks?.title || '');
    
    // Calculate conceptual due date based on day number instead of using database due_at
    const calculateConceptualDueDate = (title: string): Date => {
      const dayMatch = title.match(/Day (\d+)/i);
      if (dayMatch) {
        const dayNumber = parseInt(dayMatch[1]);
        // Get the start of the current week (Monday)
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Sunday
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(23, 59, 59, 999); // End of the day
        
        // Add days based on task day number (Day 1 = Monday, Day 2 = Tuesday, etc.)
        const taskDueDate = new Date(startOfWeek);
        taskDueDate.setDate(startOfWeek.getDate() + (dayNumber - 1));
        
        return taskDueDate;
      }
      return new Date(task.due_at); // Fallback to database due_at
    };
    
    const conceptualDueDate = calculateConceptualDueDate(task.github_tasks?.title || '');
    
    // Use GitHub-specific task status logic with conceptual due date
    let taskStatus = getGitHubTaskStatus(
      conceptualDueDate,
      assignmentDay,
      task.admin_extended || false
    );
    
    // Calculate days until due
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60));
    
    // Parse title to get day number and activity name
    const titleParts = (task.github_tasks?.title || task.title || '').split(' – ');
    const dayPart = titleParts[0] || `Day ${displayOrder}`;
    const activityName = titleParts[1] || 'GitHub Activity';
    
    return (
      <Card className={`relative transition-all duration-300 hover:shadow-xl border-l-4 ${
        task.status === 'VERIFIED' 
          ? 'border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50/30' 
          : task.status === 'SUBMITTED' 
          ? 'border-l-blue-500 bg-gradient-to-br from-blue-50 to-sky-50/30'
          : isExpired && task.status !== 'VERIFIED'
          ? 'border-l-red-500 bg-gradient-to-br from-red-50 to-rose-50/30 opacity-80'
          : 'border-l-primary bg-gradient-to-br from-background to-muted/20'
      } group hover:border-l-primary/80`}>
        
        {/* Status and Due Date - Top Right Corner */}
        <div className="absolute top-4 right-4 z-10 text-right space-y-2">
          {/* Status Badge */}
          <Badge className={`${statusBg} ${statusColor} shadow-sm`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[task.status]?.label || task.status}
          </Badge>
          
          {/* Due Date */}
          <div className="text-xs text-right">
            <div className={`flex items-center gap-1 justify-end ${isExpired && task.status !== 'VERIFIED' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              <span>
                Due: {dueDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {/* Additional Status Indicators */}
            <div className="flex items-center gap-1 justify-end mt-1">
              {isExpired && task.status !== 'VERIFIED' && (
                <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Expired
                </Badge>
              )}
              
              {!isExpired && hoursUntilDue <= 24 && hoursUntilDue > 0 && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {hoursUntilDue}h left
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pb-4 pr-32"> {/* Increase right padding for status/due date */}
          {/* Day Badge and Activity Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary border-primary/20">
                <Calendar className="h-3 w-3 mr-1" />
                {dayPart}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                {task.github_tasks?.points_base || 0} pts
              </Badge>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Github className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {activityName}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  GitHub development activity for {dayPart.toLowerCase()}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {repo && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
              <GitBranch className="h-4 w-4 text-primary" />
              <span className="font-mono text-sm">{repo.full_name}</span>
            </div>
          )}
          
          {/* Assignment Tasks */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Assignment Tasks
            </h4>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              {formatDescription(task.github_tasks?.description || task.description)}
            </div>
          </div>

          {/* Instructions */}
          {task.github_tasks?.bonus_rules && Object.keys(task.github_tasks.bonus_rules).length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Instructions
              </h4>
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                <div className="text-sm text-blue-800">
                  <div className="space-y-2">
                    {Object.entries(task.github_tasks.bonus_rules).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <span><strong>{key}:</strong> {String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : task.github_tasks?.description ? (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Instructions
              </h4>
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Follow the assignment tasks listed above for {dayPart.toLowerCase()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Submit URL evidence of your GitHub commits and repository changes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Complete all tasks within the 48-hour deadline from {dayPart} start</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Ensure your repository is public and accessible for verification</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Evidence Types Accepted */}
          {task.github_tasks?.evidence_types && task.github_tasks.evidence_types.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Accepted Evidence Types
              </h4>
              <div className="flex flex-wrap gap-2">
                {task.github_tasks.evidence_types.map((type: string) => (
                  <Badge key={type} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {type.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Extension Request Notice */}
          {taskStatus.canRequestExtension && task.status !== 'VERIFIED' && (
            <div className="mb-4 p-4 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Request Extension Available
              </div>
              <p className="text-sm mb-3">
                {taskStatus.message}
              </p>
              <GitHubRequestReenableDialog
                taskId={task.id}
                taskTitle={task.github_tasks?.title || 'GitHub Task'}
              />
            </div>
          )}
          
          {/* Expiration Notice */}
          {taskStatus.status === 'week_expired' && task.status !== 'VERIFIED' && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Assignment Week Expired
              </div>
              <p className="text-sm">
                This task expired after the assignment week and can no longer be submitted or extended.
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-border/50">
            {task.status === 'NOT_STARTED' ? (
              <>
                {taskStatus.canSubmit ? (
                  <Button 
                    variant="default"
                    size="sm"
                    disabled={!canAccessFeature("github_weekly")}
                    className="flex-1"
                    onClick={() => handleStartAssignment(task.id)}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Start Assignment
                    {!canAccessFeature("github_weekly") && <Lock className="h-4 w-4 ml-2" />}
                  </Button>
                 ) : null}
              </>
            ) : task.status === 'STARTED' || task.status === 'REJECTED' ? (
              <>
                {taskStatus.canSubmit ? (
                  <Dialog 
                    open={evidenceDialog.open && evidenceDialog.taskId === task.id}
                    onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : null })}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant={task.status === 'REJECTED' ? "destructive" : "default"}
                        size="sm"
                        disabled={!canAccessFeature("github_weekly")}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {task.status === 'REJECTED' ? 'Resubmit Assignment' : 'Submit Assignment'}
                        {!canAccessFeature("github_weekly") && <Lock className="h-4 w-4 ml-2" />}
                      </Button>
                    </DialogTrigger>
                    <EvidenceSubmissionDialog taskId={evidenceDialog.taskId} />
                  </Dialog>
                ) : (
                  <Button 
                    variant="secondary"
                    size="sm"
                    disabled
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Assignment Expired
                  </Button>
                )}
              </>
            ) : task.status === 'SUBMITTED' ? (
              <Button 
                variant="outline"
                size="sm"
                disabled
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Submitted - Awaiting Review
              </Button>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                disabled
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Completed
              </Button>
            )}
            
            {task.status === 'VERIFIED' && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
                <Trophy className="h-4 w-4 mr-1" />
                +{task.score_awarded} pts Earned
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  // Calculate current week's submitted metrics
  const getCurrentWeekMetrics = () => {
    const currentWeekTasks = weeklyTasks.filter(task => task.status === 'SUBMITTED' || task.status === 'VERIFIED');
    let totalCommits = 0;
    let totalProjects = 0;
    let totalReadmeUpdates = 0;

    // This would ideally come from the evidence submissions
    // For now, we'll calculate based on completed/verified tasks as a proxy
    // In a full implementation, you'd fetch the actual evidence data with weekly metrics

    currentWeekTasks.forEach(task => {
      // Since we don't have direct access to evidence metrics in this hook,
      // we'll estimate based on task completion (this should be enhanced to fetch actual evidence data)
      if (task.status === 'VERIFIED') {
        totalCommits += 2; // Average commits per verified task
        if (task.github_tasks?.code?.includes('project')) totalProjects += 1;
        if (task.github_tasks?.code?.includes('readme') || task.github_tasks?.code?.includes('doc')) totalReadmeUpdates += 1;
      }
    });

    return { totalCommits, totalProjects, totalReadmeUpdates };
  };

  // Calculate total commits across all time periods (not just current week)
  const getTotalCommitsAllTime = () => {
    // Calculate from GitHub signals (commits are tracked via webhook signals)
    const allSignals = signals || [];
    
    // Estimate total commits from verified tasks across all periods
    const allVerifiedTasks = weeklyTasks.filter(task => task.status === 'VERIFIED');
    let estimatedTotalCommits = allVerifiedTasks.length * 2; // Average 2 commits per verified task
    
    // Add signals count as proxy for activity if available
    estimatedTotalCommits += allSignals.length;
    
    // Fallback minimum based on verified tasks count
    const totalCommits = Math.max(allVerifiedTasks.length, estimatedTotalCommits);
    
    // Show at least some activity if user has verified tasks
    return totalCommits > 0 ? totalCommits : allVerifiedTasks.length > 0 ? 5 : 0;
  };

  const currentMetrics = getCurrentWeekMetrics();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Github className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">GitHub Weekly</h1>
            <p className="text-muted-foreground">Track your GitHub activity and showcase your repositories</p>
          </div>
        </div>
      </div>

      {/* Premium Feature Notice */}
      {!canAccessFeature("github_weekly") && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Premium Feature</h3>
                <p className="text-sm text-orange-700 mt-1">
                  GitHub Weekly is available for premium subscribers. You can view the interface but cannot modify or submit tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="repos" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            Repositories
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          {/* Weekly Progress Overview */}
          <Card className="shadow-elegant border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" />
                GitHub Weekly Progress
              </CardTitle>
              <CardDescription>
                Complete weekly GitHub activities to build your developer profile and earn points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {weeklyTasks.filter(task => task.status === 'VERIFIED').length} / {weeklyTasks.length} completed
                    </span>
                  </div>
                  <Progress 
                    value={weeklyTasks.length > 0 ? (weeklyTasks.filter(task => task.status === 'VERIFIED').length / weeklyTasks.length) * 100 : 0} 
                    className="h-3" 
                  />
                </div>
                <Badge variant={weeklyTasks.length > 0 && weeklyTasks.filter(task => task.status === 'VERIFIED').length === weeklyTasks.length ? "default" : "secondary"} className="text-lg px-3 py-1">
                  {weeklyTasks.length > 0 ? Math.round((weeklyTasks.filter(task => task.status === 'VERIFIED').length / weeklyTasks.length) * 100) : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Tasks Categories */}
          <div className="space-y-6">
            {/* Development Activity Tasks */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-green-600" />
                  Development Activity
                  <Badge variant="outline" className="ml-auto">
                    {weeklyTasks.filter(task => task.status === 'VERIFIED').length} / {weeklyTasks.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Weekly coding activities to maintain consistent development habits
                </CardDescription>
                
                {/* Weekly Targets */}
                <div className="bg-primary/5 p-4 rounded-lg mt-4">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Weekly Targets & Progress
                  </h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-4 bg-background rounded-lg border hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <GitCommit className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">Weekly Commits</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold text-green-600">{currentMetrics.totalCommits}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-lg font-bold text-green-600">10+</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Current / Target</div>
                          {currentMetrics.totalCommits >= 10 ? (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Target Met!
                            </Badge>
                          ) : (
                            <div className="text-xs text-orange-600">
                              {10 - currentMetrics.totalCommits} more needed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-background rounded-lg border hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <GitBranch className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold text-indigo-600">Total Commits</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold text-indigo-600">{getTotalCommitsAllTime()}</span>
                            <span className="text-muted-foreground">commits</span>
                          </div>
                          <div className="text-xs text-muted-foreground">All time total</div>
                          <div className="text-xs text-indigo-600 font-medium">
                            Lifetime achievement
                          </div>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="text-center p-4 bg-background rounded-lg border hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 hover:bg-blue-50/50"
                      onClick={() => setActiveTab("repos")}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-600">Pinned Repositories</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{repos?.length || 0}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-lg font-bold text-blue-600">3+</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Current / Target</div>
                          {(repos?.length || 0) >= 3 ? (
                            <Badge variant="default" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Target Met!
                            </Badge>
                          ) : (
                            <div className="text-xs text-orange-600">
                              {3 - (repos?.length || 0)} more needed
                            </div>
                          )}
                          <div className="text-xs text-blue-600 font-medium mt-1">Click to manage repositories →</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-background rounded-lg border hover:shadow-md transition-shadow">
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-600">README/Docs</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold text-purple-600">{currentMetrics.totalReadmeUpdates}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-lg font-bold text-purple-600">2-3</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Current / Target</div>
                          {currentMetrics.totalReadmeUpdates >= 2 ? (
                            <Badge variant="default" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Target Met!
                            </Badge>
                          ) : (
                            <div className="text-xs text-orange-600">
                              {2 - currentMetrics.totalReadmeUpdates} more needed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overall Progress Bar */}
                  <div className="mt-4 p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Weekly Goals Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {[
                          currentMetrics.totalCommits >= 10,
                          currentMetrics.totalReadmeUpdates >= 2
                        ].filter(Boolean).length} / 2 goals achieved
                      </span>
                    </div>
                    <Progress 
                      value={[
                        currentMetrics.totalCommits >= 10,
                        currentMetrics.totalReadmeUpdates >= 2
                      ].filter(Boolean).length / 2 * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sort tasks by display_order to ensure Day 1-7 ordering */}
                  {weeklyTasks
                    .sort((a, b) => (a.github_tasks?.display_order || 999) - (b.github_tasks?.display_order || 999))
                    .map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  {weeklyTasks.length === 0 && (
                    <div className="text-center py-8">
                      <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No weekly development tasks assigned</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Generate your Day 1-7 GitHub activities for this week
                      </p>
                      <Button 
                        onClick={() => instantiateWeek()}
                        disabled={!canAccessFeature("github_weekly")}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Week Tasks
                        {!canAccessFeature("github_weekly") && <Lock className="h-4 w-4 ml-2" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Repository Showcase Tasks */}
            {selectedRepo && repoTasks[selectedRepo] && (
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Repository Showcase
                    <Badge variant="outline" className="ml-auto">
                      {repoTasks[selectedRepo].filter(task => task.status === 'VERIFIED').length} / {repoTasks[selectedRepo].length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    One-time setup tasks to make your {repos.find(r => r.id === selectedRepo)?.full_name} repository shine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {repoTasks[selectedRepo].map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        repo={repos.find(r => r.id === selectedRepo)} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repository Selection */}
            {repos.length > 0 && !selectedRepo && (
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Github className="h-5 w-5 text-gray-600" />
                    Select Repository for Showcase Tasks
                  </CardTitle>
                  <CardDescription>
                    Choose a repository to generate showcase and optimization tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {repos.map((repo) => (
                      <div 
                        key={repo.id}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedRepo(repo.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{repo.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {repo.default_branch} • {repo.html_url}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Repository Management
              </CardTitle>
              <CardDescription>
                Add and manage repositories to track for showcase tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Repository */}
              <div className="flex gap-2">
                <Input
                  placeholder="owner/repository-name"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                />
                <Button 
                  onClick={handleAddRepo} 
                  disabled={!newRepoName.trim() || !canAccessFeature("github_weekly")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Repository
                  {!canAccessFeature("github_weekly") && <Lock className="h-4 w-4 ml-2" />}
                </Button>
              </div>

              {/* Repository List */}
              <div className="space-y-3">
                {repos.map((repo) => (
                  <div 
                    key={repo.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRepo === repo.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRepo(selectedRepo === repo.id ? null : repo.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Github className="h-5 w-5" />
                        <div>
                          <p className="font-mono font-medium">{repo.full_name}</p>
                          <p className="text-sm text-muted-foreground">{repo.html_url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {repo.is_active && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {repos.length === 0 && (
                  <div className="text-center py-8">
                    <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No repositories added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a repository to start tracking showcase tasks
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <GitHubWeeklyHistory />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Set up GitHub webhooks to automatically track your activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacy Notice:</strong> We never scrape GitHub. Verification uses your repo webhooks, 
                  public API reads, and the links/files you share. You can revoke access at any time.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value="https://your-n8n-instance.com/hooks/github"
                    readOnly
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-secret">Webhook Secret</Label>
                  <Input
                    id="webhook-secret"
                    value="your-shared-secret-key"
                    readOnly
                    type="password"
                    className="font-mono"
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Setup Instructions:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Go to your repository Settings → Webhooks</li>
                    <li>Click "Add webhook"</li>
                    <li>Paste the webhook URL above</li>
                    <li>Set Content type to "application/json"</li>
                    <li>Add the secret above</li>
                    <li>Select these events: Push, Pull requests, Issues, Releases, Create, Workflow runs, Pages</li>
                    <li>Click "Add webhook"</li>
                  </ol>
                </div>
              </div>

              <Button onClick={() => verifyTasks()}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Re-verify Tasks Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Points & Badges
              </CardTitle>
              <CardDescription>
                Your current score and earned badges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {scores?.points_total || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {badges?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Badges Earned</div>
                </div>
              </div>

              {badges && badges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Your Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <Badge key={badge.id} variant="outline" className="flex items-center gap-1">
                        <span>{badge.github_badges?.icon}</span>
                        {badge.github_badges?.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GitHubWeekly;