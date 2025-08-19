import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, RefreshCw, Trash2, Download, Settings, Webhook, AlertTriangle, CheckCircle, Key } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { useToast } from '@/hooks/use-toast';

export const GitHubWeeklySettings = () => {
  const { verifyTasks } = useGitHubWeekly();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);

  // Mock webhook configuration - in real app this would come from backend
  const webhookConfig = {
    url: 'https://your-n8n-instance.com/hooks/github',
    secret: 'ghwh_1234567890abcdef1234567890abcdef',
    events: ['push', 'pull_request', 'issues', 'release', 'create', 'workflow_run', 'page_build', 'repository', 'star'],
    status: 'active' as 'active' | 'inactive'
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  };

  const handleReVerifyAll = async () => {
    setIsVerifying(true);
    try {
      await verifyTasks();
      toast({
        title: 'Verification Complete',
        description: 'All tasks have been re-verified based on current GitHub data',
      });
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'There was an error during verification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportData = () => {
    // Mock export functionality
    toast({
      title: 'Export Started',
      description: 'Your GitHub Weekly data export will be ready shortly',
    });
  };

  const handleDeleteAllData = () => {
    // This would connect to a delete function
    toast({
      title: 'Data Deletion',
      description: 'This feature will be implemented with proper safeguards',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">GitHub Weekly Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure webhooks, manage data, and control your GitHub Weekly experience
        </p>
      </div>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Set up GitHub webhooks for real-time activity tracking and automatic verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              {webhookConfig.status === 'active' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
              <span className="font-medium">
                Webhook Status: {webhookConfig.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Badge variant={webhookConfig.status === 'active' ? 'default' : 'secondary'}>
              {webhookConfig.status}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="webhook-url"
                  value={webhookConfig.url}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookConfig.url, 'Webhook URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="webhook-secret">Webhook Secret</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="webhook-secret"
                  value={webhookConfig.secret}
                  readOnly
                  className="font-mono text-sm"
                  type="password"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(webhookConfig.secret, 'Webhook Secret')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Webhook Events</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {webhookConfig.events.map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Add this webhook to each GitHub repository you want to track. 
              Go to Settings → Webhooks → Add webhook, then paste the URL and secret above.
              Select "application/json" as content type and choose the events listed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Task Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Task Management
          </CardTitle>
          <CardDescription>
            Manually trigger verification and manage your GitHub Weekly tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Re-verify All Tasks</h4>
              <p className="text-sm text-muted-foreground">
                Check all current tasks against latest GitHub data and webhook events
              </p>
            </div>
            <Button 
              onClick={handleReVerifyAll}
              disabled={isVerifying}
              variant="outline"
            >
              {isVerifying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Re-verify Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data or reset your GitHub Weekly progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">
                Download all your GitHub Weekly data including tasks, scores, and activity history
              </p>
            </div>
            <Button onClick={handleExportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <h4 className="font-medium text-destructive">Delete All Data</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all GitHub Weekly data, tasks, and progress. This cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your 
                    GitHub Weekly data including:
                    <br />
                    <br />
                    • All task assignments and completions
                    <br />
                    • Activity history and signals  
                    <br />
                    • Points and badge progress
                    <br />
                    • Repository connections
                    <br />
                    <br />
                    Type "DELETE" in the confirmation field to proceed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 text-base">
            Privacy & Data Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700 dark:text-blue-300">
            <p>
              <strong>We never scrape GitHub.</strong> All verification uses:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Repository webhooks you configure</li>
              <li>Public GitHub API reads for repository metadata</li>
              <li>Evidence files and links you voluntarily submit</li>
            </ul>
            <p>
              You can revoke access at any time by removing webhooks from your repositories 
              and deleting your data using the controls above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};