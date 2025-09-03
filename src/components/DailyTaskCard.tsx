import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText, 
  Link as LinkIcon,
  AlertCircle,
  Target,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { DailyTask, TaskType, useDailyJobHuntingTasks } from '@/hooks/useDailyJobHuntingTasks';

interface DailyTaskCardProps {
  taskType: TaskType;
  date: string;
  task?: DailyTask;
  onTaskUpdate: () => void;
}

export const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
  taskType,
  date,
  task,
  onTaskUpdate
}) => {
  const { taskConfigs, upsertTask, submitTask } = useDailyJobHuntingTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actualCount, setActualCount] = useState(task?.actual_count || 0);
  const [description, setDescription] = useState(task?.description || '');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(task?.evidence_urls || ['']);
  const [submitting, setSubmitting] = useState(false);

  const config = taskConfigs[taskType];
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'submitted': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleSaveTask = async () => {
    try {
      setSubmitting(true);
      const validUrls = evidenceUrls.filter(url => url.trim());
      
      await upsertTask(
        taskType,
        date,
        actualCount,
        { urls: validUrls },
        description,
        validUrls
      );
      
      setIsDialogOpen(false);
      onTaskUpdate();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTask = async () => {
    if (!task) return;
    
    try {
      setSubmitting(true);
      await submitTask(task.id);
      onTaskUpdate();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addUrlField = () => {
    setEvidenceUrls([...evidenceUrls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const updated = [...evidenceUrls];
    updated[index] = value;
    setEvidenceUrls(updated);
  };

  const removeUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const isCompleted = task?.status === 'approved';
  const isSubmitted = task?.status === 'submitted';
  const isPending = task?.status === 'pending';
  const isRejected = task?.status === 'rejected';

  return (
    <Card className={`${isCompleted ? 'bg-green-50 border-green-200' : isSubmitted ? 'bg-blue-50 border-blue-200' : isRejected ? 'bg-red-50 border-red-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">{config.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {config.description}
              </CardDescription>
            </div>
          </div>
          
          {task && (
            <Badge className={`${getStatusColor(task.status)} text-white`}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Display */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-semibold">{config.target}</span>
          </div>
          {task && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-semibold">{task.actual_count}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Points:</span>
            <span className="font-semibold">{task?.points_earned || 0}/{config.points}</span>
          </div>
        </div>

        {/* Status Messages */}
        {isSubmitted && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Under Review</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Submitted on {task?.submitted_at ? format(new Date(task.submitted_at), 'MMM dd, h:mm a') : ''}
            </p>
          </div>
        )}

        {isRejected && task?.reviewer_notes && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <p className="text-xs text-red-600">
              <strong>Feedback:</strong> {task.reviewer_notes}
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Approved & Completed</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Earned {task?.points_earned} points • Approved on {task?.reviewed_at ? format(new Date(task.reviewed_at), 'MMM dd, h:mm a') : ''}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!isCompleted && (
          <div className="flex gap-2">
            {!isSubmitted ? (
              <>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      {task ? 'Edit Task' : 'Add Evidence'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{config.title}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Target: {config.target} • Worth: {config.points} points
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="count">How many did you complete?</Label>
                        <Input
                          id="count"
                          type="number"
                          min="0"
                          max={config.target * 2}
                          value={actualCount}
                          onChange={(e) => setActualCount(parseInt(e.target.value) || 0)}
                          placeholder="Enter count"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Evidence URLs (Job portals, LinkedIn, etc.)</Label>
                        {evidenceUrls.map((url, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={url}
                              onChange={(e) => updateUrl(index, e.target.value)}
                              placeholder="https://..."
                              className="flex-1"
                            />
                            {evidenceUrls.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeUrl(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addUrlField}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Add URL
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Additional Notes (Optional)</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe your approach, challenges faced, or additional context..."
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveTask}
                          disabled={submitting || actualCount === 0}
                          className="flex-1"
                        >
                          {submitting ? 'Saving...' : 'Save Task'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {task && actualCount > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSubmitTask}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="secondary" size="sm" disabled className="flex-1">
                <Clock className="h-4 w-4 mr-2" />
                Awaiting Review
              </Button>
            )}
          </div>
        )}

        {/* Evidence Display */}
        {task?.evidence_urls && task.evidence_urls.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Evidence:</h5>
            <div className="space-y-1">
              {task.evidence_urls.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline block truncate"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};