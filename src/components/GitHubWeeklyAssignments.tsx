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
import { Calendar, Clock, Github, Plus, Upload, CheckCircle, AlertCircle, Shield, RefreshCw } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { formatDistanceToNow } from 'date-fns';
import { GitHubRequestReenableDialog } from '@/components/GitHubRequestReenableDialog';
import { EvidenceDisplay } from '@/components/EvidenceDisplay';
import { 
  getAssignmentDay,
  isDueDateInAssignmentWeek
} from '@/utils/dueDateValidation';
import { 
  getTaskDayAvailability,
  canUserInteractWithDayBasedTask,
  getTaskAvailabilityMessage
} from '@/utils/dayBasedTaskValidation';

interface EvidenceSubmissionData {
  kind: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  description?: string;
  file?: File;
  numberOfCommits?: number;
  numberOfReadmes?: number;
}

export const GitHubWeeklyAssignments = () => {
  const { 
    weeklyTasks, 
    repos, 
    repoTasks, 
    isLoading, 
    submitEvidence, 
    verifyTasks, 
    refreshWeeklyAssignments 
  } = useGitHubWeekly();

  const [evidenceDialog, setEvidenceDialog] = useState<{ open: boolean; taskId?: string }>({ open: false });
  const [evidenceForm, setEvidenceForm] = useState<EvidenceSubmissionData>({ kind: 'URL' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'secondary';
      case 'SUBMITTED': return 'outline';
      case 'PARTIALLY_VERIFIED': return 'outline';
      case 'VERIFIED': return 'default';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'Not Started';
      case 'SUBMITTED': return 'Submitted';
      case 'PARTIALLY_VERIFIED': return 'Partially Verified';
      case 'VERIFIED': return 'Verified';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceDialog.taskId) return;

    try {
      console.log('🔍 Submitting evidence form:', evidenceForm);
      console.log('🔍 numberOfCommits:', evidenceForm.numberOfCommits);
      console.log('🔍 numberOfReadmes:', evidenceForm.numberOfReadmes);
      await submitEvidence(evidenceDialog.taskId, evidenceForm);
      setEvidenceDialog({ open: false });
      setEvidenceForm({ kind: 'URL', numberOfCommits: undefined, numberOfReadmes: undefined });
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
          <TabsTrigger value="weekly">Daily Tasks</TabsTrigger>
          <TabsTrigger value="showcase">Showcase Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {/* Current Week Details */}
          {weeklyTasks.length > 0 && (
            <Card className="bg-accent/10 border-accent">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent-foreground" />
                  <h4 className="font-medium">Current Week - {weeklyTasks[0]?.period}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    // Calculate week start and end from period (e.g., "2025-36")
                    const period = weeklyTasks[0]?.period;
                    if (!period) return "Week period not available";
                    
                    const [year, week] = period.split('-').map(Number);
                    
                    // Use the same logic as PostgreSQL's DATE_TRUNC('week')
                    // Start from January 1st and calculate the Monday of the target week
                    const jan1 = new Date(year, 0, 1);
                    
                    // Find the first Monday of the year (or use Jan 1 if it's a Monday)
                    const jan1Day = jan1.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const daysToFirstMonday = jan1Day === 1 ? 0 : (jan1Day === 0 ? 1 : 8 - jan1Day);
                    
                    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
                    
                    // Calculate the Monday of the target week
                    const weekStart = new Date(firstMonday);
                    weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
                    
                    // Week end is the Sunday
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    return `${weekStart.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })} - ${weekEnd.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}`;
                  })()}
                </p>
              </CardHeader>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Daily GitHub Assignments</h3>
              <p className="text-sm text-muted-foreground">
                Complete day-specific development activities with proper deadlines and earn points
              </p>
            </div>
            <Button 
              onClick={() => refreshWeeklyAssignments()} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Tasks
            </Button>
          </div>

          <div className="grid gap-4">
            {weeklyTasks.map((task) => {
              const assignmentDay = getAssignmentDay(task.period);
              
              // Day-based availability (same as LinkedIn and main GitHub Weekly)
              const dayAvailability = getTaskDayAvailability(task.github_tasks?.title || '');
              const canInteractDayBased = canUserInteractWithDayBasedTask(task.github_tasks?.title || '', task.admin_extended);
              const dayAvailabilityMessage = getTaskAvailabilityMessage(task.github_tasks?.title || '', task.admin_extended);
              
              // Combined availability - use day-based if task has Day X format
              const hasDay = (task.github_tasks?.title || '').match(/Day (\d+)/i);
              const canInteract = hasDay ? canInteractDayBased : true; // Fallback for older tasks
              
              // Only show extension request for incomplete tasks that are past due
              const isTaskCompleteOrSubmitted = ['VERIFIED', 'SUBMITTED', 'PARTIALLY_VERIFIED'].includes(task.status);
              const showExtensionRequest = !isTaskCompleteOrSubmitted && (hasDay ? dayAvailability.canRequestExtension : false);
              
              console.log(`🔍 GitHub Task: ${task.github_tasks?.title}`, {
                dueDate: task.due_at,
                assignmentDay,
                adminExtended: task.admin_extended,
                hasDay,
                canInteract,
                dayAvailability,
                period: task.period,
                currentTime: new Date().toISOString(),
                isWithinAssignmentWeek: task.due_at ? isDueDateInAssignmentWeek(task.due_at) : false
              });
              
              return (
                <Card key={task.id} className="border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            {task.github_tasks?.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {assignmentDay}
                          </Badge>
                        </div>
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
                          {hasDay ? dayAvailabilityMessage : (task.due_at ? 'Legacy task' : 'No due date')}
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
                    
                    {/* Task Status-based Actions */}
                    {task.status !== 'VERIFIED' && (
                      <>
                        {canInteract && (task.status === 'NOT_STARTED' || task.status === 'REJECTED') && (
                          <Dialog 
                            open={evidenceDialog.open && evidenceDialog.taskId === task.id} 
                            onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : undefined })}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" className="w-full mb-3">
                                <Upload className="h-4 w-4 mr-2" />
                                {task.status === 'REJECTED' ? 'Resubmit Assignment' : 'Submit Evidence'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submit Evidence</DialogTitle>
                                <DialogDescription>
                                  Provide evidence for completing: {task.github_tasks?.title} ({assignmentDay} Assignment)
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

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="number-of-commits">Number of Weekly Commits</Label>
                                  <Input
                                    id="number-of-commits"
                                    type="number"
                                    placeholder="e.g. 5"
                                    min="0"
                                    value={evidenceForm.numberOfCommits || ''}
                                    onChange={(e) => setEvidenceForm(prev => ({ 
                                      ...prev, 
                                      numberOfCommits: e.target.value ? parseInt(e.target.value) : undefined 
                                    }))}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="number-of-readmes">Number of README or Docs Updates</Label>
                                  <Input
                                    id="number-of-readmes"
                                    type="number"
                                    placeholder="e.g. 1"
                                    min="0"
                                    value={evidenceForm.numberOfReadmes || ''}
                                    onChange={(e) => setEvidenceForm(prev => ({ 
                                      ...prev, 
                                      numberOfReadmes: e.target.value ? parseInt(e.target.value) : undefined 
                                    }))}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button onClick={handleSubmitEvidence} className="flex-1">
                                  Submit Evidence
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setEvidenceDialog({ open: false });
                                    setEvidenceForm({ kind: 'URL', numberOfCommits: undefined, numberOfReadmes: undefined });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                       )}
                        
                        {/* Show extension request if needed */}
                        {showExtensionRequest && (
                          <div className="mt-3">
                            <GitHubRequestReenableDialog
                              taskId={task.id}
                              taskTitle={task.github_tasks?.title || 'GitHub Task'}
                            />
                          </div>
                        )}
                      </>
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

                    {/* Evidence Display Section */}
                    {task.evidence && task.evidence.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <EvidenceDisplay evidence={task.evidence.map(evidence => ({
                          id: evidence.id,
                          evidence_type: evidence.kind || 'URL',
                          evidence_data: evidence.parsed_json || evidence.url || {},
                          url: evidence.url,
                          file_urls: evidence.file_key ? [`/storage/v1/object/public/github-evidence/${evidence.file_key}`] : [],
                          verification_status: evidence.verification_status || 'pending',
                          verification_notes: evidence.verification_notes,
                          created_at: evidence.created_at
                        }))} />
                      </div>
                    )}
                    
                    {/* Admin Review Notes */}
                    {task.verification_notes && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4" />
                          Admin Review:
                        </Label>
                        <div className={`p-3 rounded-md text-sm border-l-4 ${
                          task.status === 'VERIFIED' 
                            ? 'bg-success/10 border-success text-success-foreground' 
                            : task.status === 'REJECTED'
                            ? 'bg-destructive/10 border-destructive text-destructive-foreground'
                            : 'bg-warning/10 border-warning text-warning-foreground'
                        }`}>
                          <div className="font-medium mb-1">
                            {task.status === 'VERIFIED' ? 'Approved' : 
                             task.status === 'REJECTED' ? 'Rejected' : 'Under Review'}
                            {task.evidence_verified_at && (
                              <span className="text-xs font-normal ml-2">
                                on {new Date(task.evidence_verified_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">
                            {task.verification_notes}
                          </p>
                        </div>
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}

            {weeklyTasks.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Daily Tasks Yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Generate this week's GitHub tasks to start earning points
                  </p>
                  <Button onClick={() => refreshWeeklyAssignments()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Weekly Tasks
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

                            {(task.status === 'NOT_STARTED' || task.status === 'REJECTED') && (
                              <Dialog 
                                open={evidenceDialog.open && evidenceDialog.taskId === task.id} 
                                onOpenChange={(open) => setEvidenceDialog({ open, taskId: open ? task.id : undefined })}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {task.status === 'REJECTED' ? 'Resubmit Assignment' : 'Submit Evidence'}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Submit Evidence</DialogTitle>
                                    <DialogDescription>
                                      Provide evidence for: {task.github_tasks?.title}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="evidence-type-showcase">Evidence Type</Label>
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
                                        <Label htmlFor="evidence-url-showcase">URL</Label>
                                        <Input
                                          id="evidence-url-showcase"
                                          placeholder="https://github.com/..."
                                          value={evidenceForm.url || ''}
                                          onChange={(e) => setEvidenceForm(prev => ({ ...prev, url: e.target.value }))}
                                        />
                                      </div>
                                    )}

                                    {evidenceForm.kind === 'DATA_EXPORT' && (
                                      <div>
                                        <Label htmlFor="evidence-file-showcase">File</Label>
                                        <Input
                                          id="evidence-file-showcase"
                                          type="file"
                                          accept=".png,.jpg,.jpeg,.pdf,.md"
                                          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <Label htmlFor="evidence-description-showcase">Description (Optional)</Label>
                                      <Textarea
                                        id="evidence-description-showcase"
                                        placeholder="Additional notes about your completion..."
                                        value={evidenceForm.description || ''}
                                        onChange={(e) => setEvidenceForm(prev => ({ ...prev, description: e.target.value }))}
                                      />
                                    </div>

                    {/* GitHub-specific fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="number-of-commits-showcase">Number of Weekly Commits</Label>
                        <Input
                          id="number-of-commits-showcase"
                          type="number"
                          placeholder="e.g. 5"
                          min="0"
                          value={evidenceForm.numberOfCommits || ''}
                          onChange={(e) => setEvidenceForm(prev => ({ 
                            ...prev, 
                            numberOfCommits: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="number-of-readmes-showcase">Number of README or Docs Updates</Label>
                        <Input
                          id="number-of-readmes-showcase"
                          type="number"
                          placeholder="e.g. 1"
                          min="0"
                          value={evidenceForm.numberOfReadmes || ''}
                          onChange={(e) => setEvidenceForm(prev => ({ 
                            ...prev, 
                            numberOfReadmes: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                        />
                      </div>
                    </div>

                                    <div className="flex gap-3 pt-4">
                                      <Button onClick={handleSubmitEvidence} className="flex-1">
                                        Submit Evidence
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        onClick={() => {
                                          setEvidenceDialog({ open: false });
                                          setEvidenceForm({ kind: 'URL', numberOfCommits: undefined, numberOfReadmes: undefined });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                  
                                </DialogContent>
                              </Dialog>
                            )}

                            {task.status === 'REJECTED' && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                                <AlertCircle className="h-4 w-4" />
                                Rejected - Please resubmit
                              </div>
                            )}

                            {/* Admin Review Section for Repo Tasks */}
                            {(task.status === 'VERIFIED' || task.status === 'REJECTED') && task.verification_notes && (
                              <div className="mt-3 space-y-2 p-3 rounded-lg border">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Admin Review Notes:
                                </Label>
                                <div className={`p-3 rounded-md text-sm border-l-4 ${
                                  task.status === 'VERIFIED' 
                                    ? 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                                    : 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                                }`}>
                                  <div className="font-medium mb-1">
                                    Status: {task.status === 'VERIFIED' ? 'Approved ✓' : 'Rejected ✗'}
                                    {task.updated_at && (
                                      <span className="text-xs font-normal ml-2 opacity-75">
                                        on {new Date(task.updated_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="whitespace-pre-line leading-relaxed">
                                    {task.verification_notes}
                                  </p>
                                </div>
                              </div>
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
