import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Github, Plus, ExternalLink, CheckCircle, AlertTriangle, Globe, Calendar } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { useAuth } from '@/hooks/useAuth';
import { validateGitHubUrl } from '@/utils/githubValidation';
import { formatDistanceToNow } from 'date-fns';

export const GitHubReposManager = () => {
  const { user } = useAuth();
  const { repos, signals, addRepo, isLoading } = useGitHubWeekly();
  const [addRepoDialog, setAddRepoDialog] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [repoFullName, setRepoFullName] = useState('');

  const handleAddRepo = async () => {
    if (!repoFullName.trim()) return;
    
    const validation = validateGitHubUrl(repoFullName);
    if (!validation.valid) {
      // Handle validation error
      return;
    }

    try {
      await addRepo(repoFullName);
      setRepoFullName('');
      setAddRepoDialog(false);
    } catch (error) {
      console.error('Failed to add repository:', error);
    }
  };

  // Get recent signals per repo for webhook status
  const getRepoWebhookStatus = (repoId: string) => {
    const repoSignals = signals.filter(s => s.repo_id === repoId);
    if (repoSignals.length === 0) return { status: 'inactive', lastActivity: null };
    
    const lastSignal = repoSignals[0];
    const hoursSinceLastActivity = (Date.now() - new Date(lastSignal.happened_at).getTime()) / (1000 * 60 * 60);
    
    return {
      status: hoursSinceLastActivity < 24 ? 'active' : 'stale',
      lastActivity: lastSignal.happened_at
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GitHub Username Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Profile
          </CardTitle>
          <CardDescription>
            Connect your GitHub username to track your repositories and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-username">GitHub Username</Label>
            <div className="flex gap-2">
              <Input
                id="github-username"
                placeholder="your-username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
              <Button variant="outline">
                Save
              </Button>
            </div>
            {githubUsername && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <a 
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  github.com/{githubUsername}
                </a>
                <ExternalLink className="h-3 w-3" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Repository Management */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Connected Repositories</h3>
          <p className="text-sm text-muted-foreground">
            Manage repositories to track for weekly assignments and showcase setup
          </p>
        </div>
        
        <Dialog open={addRepoDialog} onOpenChange={setAddRepoDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add GitHub Repository</DialogTitle>
              <DialogDescription>
                Add a repository to track for weekly GitHub tasks and showcase setup
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="repo-name">Repository</Label>
                <Input
                  id="repo-name"
                  placeholder="owner/repository-name"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: owner/repository (e.g., facebook/react)
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleAddRepo} className="flex-1">
                  Add Repository
                </Button>
                <Button variant="outline" onClick={() => setAddRepoDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Repositories List */}
      <div className="grid gap-4">
        {repos.map((repo) => {
          const webhookStatus = getRepoWebhookStatus(repo.id);
          
          return (
            <Card key={repo.id} className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      {repo.full_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <a 
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        View on GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={repo.is_active ? 'default' : 'secondary'}>
                      {repo.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Webhook Status */}
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      {webhookStatus.status === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">
                        Webhook Status: {webhookStatus.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {webhookStatus.lastActivity && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last activity {formatDistanceToNow(new Date(webhookStatus.lastActivity), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Repository Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={repo.is_active}
                        // onCheckedChange={() => toggleRepoActive(repo.id)}
                      />
                      <span className="text-sm">Include in weekly tasks</span>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {repos.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Github className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Repositories Connected</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Add your GitHub repositories to start tracking weekly activities and earn points
              </p>
              <Button onClick={() => setAddRepoDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Repository
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Webhook Setup Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Webhook Setup Required
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            For real-time verification, add webhooks to your repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Webhook URL:</p>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded border font-mono text-xs break-all">
              https://your-n8n-instance.com/hooks/github
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">Setup Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Go to your repository → Settings → Webhooks</li>
              <li>Click "Add webhook" and paste the URL above</li>
              <li>Content type: application/json</li>
              <li>Events: Push, Pull requests, Issues, Releases, Create, Workflow runs</li>
              <li>Click "Add webhook"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};