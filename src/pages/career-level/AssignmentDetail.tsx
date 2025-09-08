import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Trophy, 
  FileText, 
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Users,
  Target,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import useCareerLevelProgram from '@/hooks/useCareerLevelProgram';
import type { Assignment, Question, Attempt } from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';

const AssignmentDetail: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    loading, 
    getAssignmentsByModule, 
    getQuestionsByAssignment,
    getAttemptsByUser,
    startAttempt
  } = useCareerLevelProgram();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAttempts, setUserAttempts] = useState<Attempt[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (assignmentId && user) {
      loadAssignmentData();
    }
  }, [assignmentId, user]);

  const loadAssignmentData = async () => {
    if (!assignmentId) return;
    
    try {
      // This is a simplified approach - in practice, you'd want a direct assignment fetch
      const allAssignments = await getAssignmentsByModule('');
      const foundAssignment = allAssignments.find(a => a.id === assignmentId);
      
      if (foundAssignment) {
        setAssignment(foundAssignment);
        
        // Load questions and user attempts
        const [questionsData, attemptsData] = await Promise.all([
          getQuestionsByAssignment(assignmentId),
          getAttemptsByUser()
        ]);
        
        setQuestions(questionsData);
        setUserAttempts(attemptsData.filter(a => a.assignment_id === assignmentId));
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
    }
  };

  const handleStartAttempt = async () => {
    if (!assignment) return;
    
    setIsStarting(true);
    try {
      const attempt = await startAttempt(assignment.id);
      if (attempt) {
        navigate(`/career-level/attempt/${attempt.id}`);
      }
    } catch (error) {
      console.error('Error starting attempt:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignmentStatus = () => {
    if (!assignment) return 'draft';
    
    const now = new Date();
    const startAt = assignment.start_at ? new Date(assignment.start_at) : null;
    const endAt = assignment.end_at ? new Date(assignment.end_at) : null;
    
    if (!assignment.is_published) return 'draft';
    if (startAt && startAt > now) return 'scheduled';
    if (endAt && endAt < now) return 'closed';
    return 'open';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const canStartAttempt = () => {
    if (!assignment) return false;
    const status = getAssignmentStatus();
    return status === 'open' && userAttempts.length < assignment.max_attempts;
  };

  const hasActiveAttempt = () => {
    return userAttempts.some(a => a.status === 'started');
  };

  const getBestScore = () => {
    return userAttempts
      .filter(a => a.score_numeric !== null)
      .reduce((max, attempt) => Math.max(max, attempt.score_numeric || 0), 0);
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  };

  if (loading || !assignment) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const status = getAssignmentStatus();
  const bestScore = getBestScore();
  const totalMarks = getTotalMarks();
  const activeAttempt = userAttempts.find(a => a.status === 'started');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/career-level/my-assignments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Link>
        </Button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
              <div className="flex items-center text-muted-foreground">
                <FileText className="w-4 h-4 mr-2" />
                <span>{assignment.module?.course?.title} • {assignment.module?.title}</span>
              </div>
            </div>
            
            <Badge 
              className={cn('text-white', getStatusColor(status))}
            >
              {ASSIGNMENT_STATUS_LABELS[status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignment.instructions ? (
                <div className="prose prose-sm max-w-none">
                  <p>{assignment.instructions}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No specific instructions provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Questions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Questions Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{totalMarks}</div>
                    <div className="text-sm text-muted-foreground">Total Marks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {questions.filter(q => q.kind === 'mcq').length}
                    </div>
                    <div className="text-sm text-muted-foreground">MCQ</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {questions.filter(q => q.kind === 'descriptive').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Descriptive</div>
                  </div>
                </div>

                {/* Question Types Breakdown */}
                <div className="space-y-2">
                  {['mcq', 'tf', 'descriptive', 'task'].map(type => {
                    const count = questions.filter(q => q.kind === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {type === 'mcq' ? 'Multiple Choice' : 
                           type === 'tf' ? 'True/False' : 
                           type === 'descriptive' ? 'Descriptive' : 'Task/Project'}
                        </span>
                        <Badge variant="outline">{count} question{count !== 1 ? 's' : ''}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attempts History */}
          {userAttempts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Your Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userAttempts.map((attempt, index) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Attempt #{index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          Started: {formatDateTime(attempt.started_at)}
                          {attempt.submitted_at && (
                            <> • Submitted: {formatDateTime(attempt.submitted_at)}</>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {attempt.score_numeric !== null && (
                          <div className="text-right">
                            <div className="font-medium">{attempt.score_numeric.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {attempt.score_points} points
                            </div>
                          </div>
                        )}
                        
                        <Badge variant={
                          attempt.status === 'submitted' ? 'default' :
                          attempt.status === 'started' ? 'secondary' : 'destructive'
                        }>
                          {attempt.status === 'started' ? 'In Progress' :
                           attempt.status === 'submitted' ? 'Completed' : 
                           attempt.status.replace('_', ' ')}
                        </Badge>
                        
                        {attempt.status !== 'started' && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/career-level/feedback/${attempt.id}`}>
                              View Results
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline">{assignment.type.toUpperCase()}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">
                    {assignment.duration_minutes ? 
                      `${assignment.duration_minutes} minutes` : 
                      'No time limit'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Attempts</span>
                  <span className="text-sm font-medium">{assignment.max_attempts}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attempts Used</span>
                  <span className="text-sm font-medium">
                    {userAttempts.length}/{assignment.max_attempts}
                  </span>
                </div>
                
                {assignment.negative_marking && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Negative Marking</span>
                    <Badge variant="destructive" className="text-xs">Enabled</Badge>
                  </div>
                )}
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                {assignment.start_at && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Available From</div>
                    <div className="text-sm font-medium">{formatDateTime(assignment.start_at)}</div>
                  </div>
                )}
                
                {assignment.due_at && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Due Date</div>
                    <div className="text-sm font-medium">{formatDateTime(assignment.due_at)}</div>
                  </div>
                )}
                
                {assignment.end_at && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Closes At</div>
                    <div className="text-sm font-medium">{formatDateTime(assignment.end_at)}</div>
                  </div>
                )}
              </div>

              {bestScore > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Best Score</div>
                    <div className="flex items-center gap-2">
                      <Progress value={bestScore} className="flex-1" />
                      <span className="text-sm font-medium">{bestScore.toFixed(1)}%</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status Alerts */}
              {status === 'scheduled' && assignment.start_at && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Assignment will be available from {formatDateTime(assignment.start_at)}
                  </AlertDescription>
                </Alert>
              )}
              
              {status === 'closed' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This assignment is no longer available for attempts.
                  </AlertDescription>
                </Alert>
              )}
              
              {status === 'open' && !canStartAttempt() && userAttempts.length >= assignment.max_attempts && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have used all {assignment.max_attempts} attempts for this assignment.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              {activeAttempt ? (
                <Button className="w-full" asChild>
                  <Link to={`/career-level/attempt/${activeAttempt.id}`}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Continue Attempt
                  </Link>
                </Button>
              ) : canStartAttempt() ? (
                <Button 
                  className="w-full" 
                  onClick={handleStartAttempt}
                  disabled={isStarting}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {isStarting ? 'Starting...' : 'Start Assignment'}
                </Button>
              ) : null}
              
              {userAttempts.length > 0 && userAttempts.some(a => a.status !== 'started') && (
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/career-level/feedback/${userAttempts.find(a => a.status !== 'started')?.id}`}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    View Results
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;