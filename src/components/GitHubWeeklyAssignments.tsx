import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Github, Plus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { formatDistanceToNow } from 'date-fns';

interface EvidenceSubmissionData {
  kind: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  description?: string;
  file?: File;
}

export const GitHubWeeklyAssignments = () => {
  const { 
    weeklyTasks, 
    repos, 
    repoTasks, 
    isLoading, 
    submitEvidence, 
    verifyTasks, 
    instantiateWeek 
  } = useGitHubWeekly();

  const [evidenceDialog, setEvidenceDialog] = useState<{ open: boolean; taskId?: string }>({ open: false });
  const [evidenceForm, setEvidenceForm] = useState<EvidenceSubmissionData>({ kind: 'URL' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'secondary';
      case 'SUBMITTED': return 'outline';
      case 'PARTIALLY_VERIFIED': return 'outline';
      case 'VERIFIED': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'Not Started';
      case 'SUBMITTED': return 'Submitted';
      case 'PARTIALLY_VERIFIED': return 'Partially Verified';
      case 'VERIFIED': return 'Verified';
      default: return status;
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceDialog.taskId) return;

    try {
      await submitEvidence(evidenceDialog.taskId, evidenceForm);
      setEvidenceDialog({ open: false });
      setEvidenceForm({ kind: 'URL' });
    } catch (error) {
      console.error('Failed to submit evidence:', error);
    }
  };

  const handleFileChange = (file: File | null) => {
    setEvidenceForm(prev => ({ ...prev, file: file || undefined }));
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
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly">Weekly Tasks</TabsTrigger>
          <TabsTrigger value="showcase">Showcase Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">This Week's GitHub Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Complete weekly development activities to earn points and build consistency
              </p>
            </div>
            <Button 
              onClick={() => instantiateWeek()} 
              variant="outline" 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Week
            </Button>
          </div>

          <div className="grid gap-4">
            {weeklyTasks.map((task) => (
              <Card key={task.id} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {task.github_tasks?.title}
                      </CardTitle>
                      <CardDescription>
                        {task.github_tasks?.description}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {task.due_at ? formatDistanceToNow(new Date(task.due_at), { addSuffix: true }) : 'No due date'}
                      </span>
                      <span className="font-medium text-primary">
                        {task.github_tasks?.points_base} points
                      </span>
                    </div>
                    {task.score_awarded > 0 && (
                      <span className="text-green-600 font-medium">
                        +{task.score_awarded} earned
                      </span>
                    )}
                  </div>
                  
                  {task.status === 'NOT_STARTED' && (
                    <Dialog 
                      open={evidenceDialog.open && evidenceDialog.taskId === task.id} 
                      onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : undefined })}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Evidence
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit Evidence</DialogTitle>
                          <DialogDescription>
                            Provide evidence for completing: {task.github_tasks?.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="evidence-type">Evidence Type</Label>
                            <Select 
                              value={evidenceForm.kind} 
                              onValueChange={(value: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT') => 
                                setEvidenceForm(prev => ({ ...prev, kind: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select evidence type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="URL">URL Link</SelectItem>
                                <SelectItem value="SCREENSHOT">Screenshot</SelectItem>
                                <SelectItem value="DATA_EXPORT">File Upload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {evidenceForm.kind === 'URL' && (
                            <div>
                              <Label htmlFor="evidence-url">URL</Label>
                              <Input
                                id="evidence-url"
                                placeholder="https://github.com/..."
                                value={evidenceForm.url || ''}
                                onChange={(e) => setEvidenceForm(prev => ({ ...prev, url: e.target.value }))}
                              />
                            </div>
                          )}

                          {evidenceForm.kind === 'DATA_EXPORT' && (
                            <div>
                              <Label htmlFor="evidence-file">File</Label>
                              <Input
                                id="evidence-file"
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf,.md"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="evidence-description">Description (Optional)</Label>
                            <Textarea
                              id="evidence-description"
                              placeholder="Additional notes about your completion..."
                              value={evidenceForm.description || ''}
                              onChange={(e) => setEvidenceForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button onClick={handleSubmitEvidence} className="flex-1">
                              Submit Evidence
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEvidenceDialog({ open: false })}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {task.status === 'SUBMITTED' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Awaiting verification...
                    </div>
                  )}
                  
                  {(task.status === 'VERIFIED' || task.status === 'PARTIALLY_VERIFIED') && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {task.status === 'VERIFIED' ? 'Completed!' : 'Partially completed'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {weeklyTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Weekly Tasks Yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Generate this week's GitHub tasks to start earning points
                  </p>
                  <Button onClick={() => instantiateWeek()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Weekly Tasks
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="showcase" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Repository Showcase Setup</h3>
            <p className="text-sm text-muted-foreground">
              One-time tasks to make your repositories shine and attract attention
            </p>
          </div>

          <div className="space-y-4">
            {repos.map((repo) => {
              const tasks = repoTasks[repo.id] || [];
              if (tasks.length === 0) return null;

              return (
                <Card key={repo.id} className="border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      {repo.full_name}
                    </CardTitle>
                    <CardDescription>
                      Showcase setup tasks for this repository
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {tasks.map((task) => (
                        <AccordionItem key={task.id} value={task.id}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center justify-between w-full pr-4">
                              <span className="font-medium">
                                {task.github_tasks?.title}
                              </span>
                              <Badge variant={getStatusColor(task.status)}>
                                {getStatusLabel(task.status)}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              {task.github_tasks?.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-primary">
                                {task.github_tasks?.points_base} points
                              </span>
                              {task.score_awarded > 0 && (
                                <span className="text-green-600 font-medium">
                                  +{task.score_awarded} earned
                                </span>
                              )}
                            </div>

                            {task.status === 'NOT_STARTED' && (
                              <Dialog 
                                open={evidenceDialog.open && evidenceDialog.taskId === task.id} 
                                onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : undefined })}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Submit Evidence
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Submit Evidence</DialogTitle>
                                    <DialogDescription>
                                      Provide evidence for: {task.github_tasks?.title}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {/* ... same evidence form content as weekly tasks ... */}
                                  
                                </DialogContent>
                              </Dialog>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}

            {Object.keys(repoTasks).length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Github className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Repository Tasks</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Add repositories in the Repos tab to unlock showcase tasks
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button onClick={() => verifyTasks()} variant="outline">
          <CheckCircle className="h-4 w-4 mr-2" />
          Re-verify All Tasks
        </Button>
      </div>
    </div>
  );
};