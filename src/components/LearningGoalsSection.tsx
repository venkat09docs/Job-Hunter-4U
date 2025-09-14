import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, BookOpen, Target, Calendar, AlertTriangle, TrendingUp, ExternalLink, Trophy, RefreshCw } from 'lucide-react';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useChapterCompletion } from '@/hooks/useChapterCompletion';
import { LearningGoalForm } from '@/components/LearningGoalForm';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface LearningGoalsSectionProps {
  shouldOpenForm?: boolean;
  courseInfo?: { id: string; title: string };
  onGoalCreated?: (courseId: string) => void;
  onFormClosed?: () => void;
}

export function LearningGoalsSection({ 
  shouldOpenForm = false, 
  courseInfo, 
  onGoalCreated, 
  onFormClosed 
}: LearningGoalsSectionProps) {
  const { goals, loading, createGoal, updateGoal, deleteGoal, getGoalStatus } = useLearningGoals();
  const { getCourses } = useCareerLevelProgram();
  const { getCourseProgress, awardLearningGoalPoints } = useChapterCompletion();
  const [showForm, setShowForm] = useState(shouldOpenForm);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [progressGoal, setProgressGoal] = useState<any>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, any>>({});
  const processedUpdates = useRef<Set<string>>(new Set());
  
  // Memoize goals IDs to prevent unnecessary re-renders
  const goalIds = useMemo(() => goals.map(g => g.id).join(','), [goals]);

  // Load courses for selection
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadCourses();
  }, [getCourses]);

  // Load course progress for goals with course_id (read-only, no updates)
  // TEMPORARILY DISABLED TO FIX INFINITE LOOP
  /*
  useEffect(() => {
    const loadCourseProgress = async () => {
      const progressData: Record<string, any> = {};
      
      for (const goal of goals) {
        if (goal.course_id) {
          try {
            const progress = await getCourseProgress(goal.course_id);
            if (progress) {
              progressData[goal.id] = progress;
            }
          } catch (error) {
            console.error('Error loading course progress:', error);
          }
        }
      }
      
      setCourseProgress(progressData);
    };

    if (goals.length > 0) {
      loadCourseProgress();
    }
  }, [goalIds, getCourseProgress]);
  */

  // Clear processed updates when goals change significantly
  useEffect(() => {
    processedUpdates.current.clear();
  }, [goals.length]);

  const handleCreate = async (data: any) => {
    const success = await createGoal(data);
    if (success) {
      setShowForm(false);
      // If this was triggered by course enrollment, redirect to course content
      if (courseInfo && onGoalCreated) {
        onGoalCreated(courseInfo.id);
      }
    }
  };

  // Effect to handle opening form when shouldOpenForm prop changes
  useEffect(() => {
    if (shouldOpenForm && courseInfo) {
      setShowForm(true);
    }
  }, [shouldOpenForm, courseInfo]);

  // Handle form cancel with callback
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingGoal(null);
    if (onFormClosed) {
      onFormClosed();
    }
  };

  const handleSyncProgress = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal || !goal.course_id) return;

    try {
      const progress = await getCourseProgress(goal.course_id);
      if (progress && progress.progress_percentage !== goal.progress) {
        const success = await updateGoal(goalId, { progress: progress.progress_percentage });
        if (success) {
          toast.success('Progress synced successfully!');
          
          // Check if course is completed and award points
          if (progress.progress_percentage >= 100 && !goal.reward_points_awarded) {
            try {
              const result = await awardLearningGoalPoints(goalId);
              if (result.success) {
                toast.success(`🎉 Course completed! You earned ${result.points_awarded} points!`);
              }
            } catch (error) {
              console.error('Error awarding points:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing progress:', error);
      toast.error('Failed to sync progress');
    }
  };

  const handleEdit = async (data: any) => {
    if (editingGoal) {
      const success = await updateGoal(editingGoal.id, data);
      if (success) {
        setEditingGoal(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this learning goal?')) {
      await deleteGoal(id);
    }
  };

  const handleProgressUpdate = async () => {
    if (progressGoal) {
      const newStatus = progressValue === 100 ? 'completed' : progressValue > 0 ? 'in_progress' : 'not_started';
      const success = await updateGoal(progressGoal.id, { 
        progress: progressValue,
        status: newStatus
      });
      if (success) {
        setProgressGoal(null);
        setProgressValue(0);
      }
    }
  };

  const openProgressDialog = (goal: any) => {
    setProgressGoal(goal);
    setProgressValue(goal.progress);
  };

  const getStatusBadge = (goal: any) => {
    const status = getGoalStatus(goal);
    const colors = {
      completed: 'bg-green-500/10 text-green-600 border-green-500/20',
      upcoming: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      active: 'bg-green-500/10 text-green-600 border-green-500/20',
      warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      critical: 'bg-red-500/10 text-red-600 border-red-500/20',
      overdue: 'bg-red-500/10 text-red-600 border-red-500/20'
    };

    return (
      <Badge variant="outline" className={colors[status.type] || colors.active}>
        {status.text}
      </Badge>
    );
  };

  if (showForm || editingGoal) {
    // Pre-populate form with course info if available
    const goalData = editingGoal || (courseInfo ? {
      skill_name: courseInfo.title,
      description: `Learning goal for ${courseInfo.title} course`
    } : null);

    return (
      <LearningGoalForm
        goal={goalData}
        onSubmit={editingGoal ? handleEdit : handleCreate}
        onCancel={handleFormCancel}
        isLoading={loading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Learning Goals Management
              </CardTitle>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No learning goals yet</h3>
              <p className="text-muted-foreground mb-4">Create your first learning goal to start tracking your skill development.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{goal.skill_name}</div>
                        {goal.description && (
                          <div className="text-sm text-muted-foreground">{goal.description}</div>
                        )}
                        {goal.course_id && (
                          <div className="text-xs text-blue-600 mt-1">
                            📚 Linked to course • {courseProgress[goal.id] ? 
                              `${courseProgress[goal.id].completed_chapters}/${courseProgress[goal.id].total_chapters} chapters completed` 
                              : 'Loading...'}
                          </div>
                        )}
                        {goal.resources && goal.resources.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {goal.resources.length} resource(s) available
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                        {goal.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{goal.course_id && courseProgress[goal.id] 
                            ? Math.round(courseProgress[goal.id].progress_percentage) 
                            : goal.progress}%</span>
                          {goal.completion_bonus_points > 0 && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              <Trophy className="h-3 w-3 mr-1" />
                              +{goal.completion_bonus_points} pts
                            </Badge>
                          )}
                        </div>
                        <Progress value={goal.course_id && courseProgress[goal.id] 
                          ? courseProgress[goal.id].progress_percentage 
                          : goal.progress} className="h-2 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(goal.start_date), 'MMM d')} - {format(new Date(goal.end_date), 'MMM d, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(goal)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {goal.resources && goal.resources.length > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="View Learning Resources">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Learning Resources</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  Resources for {goal.skill_name}:
                                </p>
                                {goal.resources.map((resource: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                                    <div>
                                      <div className="font-medium text-sm">{resource.name}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {resource.type}
                                      </Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(resource.url, '_blank')}
                                      className="shrink-0"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Open
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Dialog open={progressGoal?.id === goal.id} onOpenChange={(open) => !open && setProgressGoal(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openProgressDialog(goal)}>
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Update Progress</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">{progressGoal?.skill_name}</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Current progress: {progressGoal?.progress}%
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="progress-slider">New Progress: {progressValue}%</Label>
                                <Slider
                                  id="progress-slider"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={[progressValue]}
                                  onValueChange={(value) => setProgressValue(value[0])}
                                  className="w-full"
                                />
                                <Progress value={progressValue} className="h-2" />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setProgressGoal(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleProgressUpdate} disabled={loading}>
                                  Update Progress
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {goal.course_id && courseProgress[goal.id] && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleSyncProgress(goal.id)}
                            title="Sync course progress"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditingGoal(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}