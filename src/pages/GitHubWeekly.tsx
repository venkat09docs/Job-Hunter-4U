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
  Lock
} from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';

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

    const handleSubmit = () => {
      const evidenceData = {
        kind: evidenceType,
        url: evidenceType === 'URL' ? url : undefined,
        description,
        file: evidenceType !== 'URL' ? file : undefined,
      };
      handleSubmitEvidence(taskId!, evidenceData);
    };

    return (
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submit Evidence
          </DialogTitle>
          <DialogDescription>
            Provide evidence to verify task completion
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="evidence-type">Evidence Type</Label>
            <Select value={evidenceType} onValueChange={(value: any) => setEvidenceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URL">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL Link
                  </div>
                </SelectItem>
                <SelectItem value="SCREENSHOT">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Screenshot
                  </div>
                </SelectItem>
                <SelectItem value="DATA_EXPORT">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Upload
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {evidenceType === 'URL' && (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/username/repo/..."
              />
            </div>
          )}

          {evidenceType !== 'URL' && (
            <div>
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept={evidenceType === 'SCREENSHOT' ? 'image/*' : '*'}
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context or notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setEvidenceDialog({ open: false, taskId: null })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmittingEvidence || (evidenceType === 'URL' && !url.trim())}
          >
            {isSubmittingEvidence ? 'Submitting...' : 'Submit Evidence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  const TaskCard = ({ task, repo = null }: { task: any; repo?: any }) => {
    const StatusIcon = statusConfig[task.status]?.icon || Circle;
    const statusColor = statusConfig[task.status]?.color || 'text-muted-foreground';
    const statusBg = statusConfig[task.status]?.bg || 'bg-muted';
    
    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Github className="h-5 w-5" />
                {task.github_tasks?.title || task.title}
                <Badge variant="outline" className="ml-auto">
                  {task.github_tasks?.points_base || 0} pts
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {task.github_tasks?.description || task.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge className={`${statusBg} ${statusColor}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[task.status]?.label || task.status}
            </Badge>
            
            {task.due_at && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Due {new Date(task.due_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {repo && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <GitBranch className="h-4 w-4" />
              <span className="font-mono">{repo.full_name}</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Dialog 
              open={evidenceDialog.open && evidenceDialog.taskId === task.id}
              onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : null })}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!canAccessFeature("github_weekly")}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Submit Evidence
                  {!canAccessFeature("github_weekly") && <Lock className="h-4 w-4 ml-1" />}
                </Button>
              </DialogTrigger>
              <EvidenceSubmissionDialog taskId={evidenceDialog.taskId} />
            </Dialog>
            
            {task.status === 'VERIFIED' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Trophy className="h-3 w-3 mr-1" />
                +{task.score_awarded} pts
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
                    {weeklyTasks.filter(task => task.github_tasks?.scope === 'weekly' && task.status === 'VERIFIED').length} / {weeklyTasks.filter(task => task.github_tasks?.scope === 'weekly').length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Weekly coding activities to maintain consistent development habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyTasks.filter(task => task.github_tasks?.scope === 'weekly').map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {weeklyTasks.filter(task => task.github_tasks?.scope === 'weekly').length === 0 && (
                    <div className="text-center py-8">
                      <GitCommit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No weekly development tasks assigned</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity History
              </CardTitle>
              <CardDescription>
                Review your GitHub activity and earned points over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signals.length > 0 ? (
                <div className="space-y-3">
                  {signals.slice(0, 20).map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <GitCommit className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{signal.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(signal.happened_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {signal.link && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={signal.link} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No activity signals recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up webhooks to start tracking your GitHub activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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