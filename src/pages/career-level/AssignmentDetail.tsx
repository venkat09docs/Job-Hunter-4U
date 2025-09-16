import { supabase } from '@/integrations/supabase/client';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  PlayCircle,
  AlertCircle,
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
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useToast } from '@/hooks/use-toast';
import type { Assignment, Question, Attempt } from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS, ATTEMPT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';

const AssignmentDetail: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    loading, 
    getAssignments,
    getQuestionsByAssignment,
    getAttemptsByUser,
    startAttempt
  } = useCareerLevelProgram();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAttempts, setUserAttempts] = useState<Attempt[]>([]);
  const [reviewedAnswers, setReviewedAnswers] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (assignmentId && user) {
      loadAssignmentData();
    }
  }, [assignmentId, user]);

  // Add interval to check for review updates when student is on the page
  useEffect(() => {
    if (!assignmentId || !user || !assignment) return;
    
    // Check for review updates every 30 seconds if there's a submitted attempt without published review
    const hasSubmittedAttempt = userAttempts.some(a => a.status === 'submitted' && a.review_status === 'pending');
    if (!hasSubmittedAttempt) return;
    
    const interval = setInterval(() => {
      loadAssignmentData();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [assignmentId, user, assignment, userAttempts]);

  const loadAssignmentData = async () => {
    if (!assignmentId) return;
    
    try {
      setDataLoaded(false);
      const allAssignments = await getAssignments();
      const foundAssignment = allAssignments.find(a => a.id === assignmentId);
      
      if (foundAssignment) {
        setAssignment(foundAssignment);
        
        const [questionsData, attemptsData] = await Promise.all([
          getQuestionsByAssignment(assignmentId),
          getAttemptsByUser()
        ]);
        
        setQuestions(questionsData);
        const userAssignmentAttempts = attemptsData.filter(a => a.assignment_id === assignmentId);
        setUserAttempts(userAssignmentAttempts);

        // Fetch reviewed answers for completed attempts
        const completedAttempt = userAssignmentAttempts.find(a => a.review_status === 'published');
        if (completedAttempt) {
          console.log('🔍 Loading answers for attempt:', completedAttempt.id);
          
          const { data: answersData, error } = await supabase
            .from('clp_answers')
            .select(`
              *,
              question:clp_questions(
                prompt,
                kind,
                marks,
                correct_answers
              )
            `)
            .eq('attempt_id', completedAttempt.id);
          
          if (error) {
            console.error('❌ Error fetching answers:', error);
          } else {
            console.log('🔍 Raw answers data:', answersData);
            
            // Remove duplicate answers by question_id
            const uniqueAnswers = (answersData || []).filter((answer, index, self) => 
              index === self.findIndex(a => a.question_id === answer.question_id)
            );
            
            console.log('🔍 Answers before dedup:', answersData?.length || 0);
            console.log('🔍 Answers after dedup:', uniqueAnswers.length);
            console.log('🔍 Sample answer marks:', uniqueAnswers[0]?.marks_awarded);
            
            setReviewedAnswers(uniqueAnswers);
          }
        }
        
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      setDataLoaded(true);
    }
  };

  const handleStartAttempt = async () => {
    if (!assignment) return;
    
    setIsStarting(true);
    try {
      const existingAttempt = userAttempts.find(a => a.status === 'started' || a.status === 'available');
      
      if (existingAttempt) {
        if (existingAttempt.status === 'started') {
          navigate(`/dashboard/career-level/attempt/${existingAttempt.id}`);
          return;
        }
        
        if (existingAttempt.status === 'available') {
          const { error } = await supabase
            .from('clp_attempts')
            .update({
              status: 'started',
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAttempt.id)
            .eq('status', 'available');
          
          if (error) throw error;
          
          navigate(`/dashboard/career-level/attempt/${existingAttempt.id}`);
          return;
        }
      }
      
      const attempt = await startAttempt(assignment.id);
      if (attempt) {
        navigate(`/dashboard/career-level/attempt/${attempt.id}`);
      }
    } catch (error) {
      console.error('Error starting attempt:', error);
      toast({
        title: 'Error',
        description: 'Failed to start assignment. Please try again.',
        variant: 'destructive'
      });
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
    
    // Check if user has submitted attempts
    const submittedAttempts = userAttempts.filter(a => 
      a.status === 'submitted' || 
      a.review_status === 'pending' || 
      a.review_status === 'in_review'
    );
    
    const completedAttempts = userAttempts.filter(a => 
      a.review_status === 'published'
    );
    
    if (completedAttempts.length > 0) return 'completed';
    if (submittedAttempts.length > 0) return 'submitted';
    
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
      case 'submitted': return 'bg-orange-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBestScore = () => {
    const validAttempts = userAttempts.filter(attempt => 
      attempt.score_numeric !== null && attempt.status !== 'available'
    );
    
    if (validAttempts.length === 0) return 0;
    
    return Math.max(...validAttempts.map(attempt => Number(attempt.score_numeric) || 0));
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  };

  if (loading || !assignment || !dataLoaded) {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/skill-level">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go To Assignments
          </Link>
        </Button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
              <div className="flex items-center text-muted-foreground">
                <FileText className="w-4 h-4 mr-2" />
                <span>{assignment.section?.course?.title} • {assignment.section?.title}</span>
              </div>
            </div>
            
            <Badge 
              className={cn('text-white', getStatusColor(status))}
            >
              {status === 'submitted' ? 'Submitted' : 
               status === 'completed' ? 'Completed' : 
               ASSIGNMENT_STATUS_LABELS[status] || status}
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

          {/* Questions Overview - Only show for open assignments */}
          {status === 'open' && (
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
          )}

          {/* Assignment Summary for submitted/completed assignments */}
          {(status === 'submitted' || status === 'completed') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Assignment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{userAttempts.length}</div>
                      <div className="text-sm text-muted-foreground">Attempts Made</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {status === 'completed' ? Math.round(bestScore) : 'Pending Review'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {status === 'completed' ? 'Best Score' : 'Status'}
                      </div>
                    </div>
                  </div>
                  
                  {status === 'submitted' && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Your assignment has been submitted and is awaiting review by the institute admin.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Results for completed assignments */}
          {status === 'completed' && (() => {
            const completedAttempt = userAttempts.find(a => a.review_status === 'published');
            if (!completedAttempt || reviewedAnswers.length === 0) return null;

            const feedbackComment = reviewedAnswers.find(a => a.feedback)?.feedback;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Review Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="grid grid-cols-2 gap-4 text-center p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {completedAttempt.score_points || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Points Earned</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(completedAttempt.score_numeric || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Final Score</div>
                      </div>
                    </div>

                    {/* Review Comments */}
                    {feedbackComment && (
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Institute Admin Remarks:
                        </div>
                        <div className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          {feedbackComment}
                        </div>
                      </div>
                    )}

                    {/* Question-wise Results */}
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Detailed Question Review:</div>
                      {reviewedAnswers.length > 0 ? (
                        reviewedAnswers.map((answer, index) => {
                          console.log(`🔍 Answer ${index + 1}:`, {
                            marks_awarded: answer.marks_awarded,
                            question_marks: answer.question?.marks,
                            is_correct: answer.is_correct,
                            correct_answers: answer.question?.correct_answers,
                            student_response: answer.response
                          });
                          
                          // If marks_awarded is 0 but we have a total score, calculate proportional marks
                          const totalAttemptScore = completedAttempt.score_points || 0;
                          const totalPossibleMarks = reviewedAnswers.reduce((sum, a) => sum + (a.question?.marks || 0), 0);
                          const estimatedMarks = totalPossibleMarks > 0 ? 
                            Math.round((answer.question?.marks || 0) * (totalAttemptScore / totalPossibleMarks)) : 0;
                          
                          const displayMarks = answer.marks_awarded > 0 ? answer.marks_awarded : estimatedMarks;
                          
                          // Get correct answer text
                          const getCorrectAnswerText = () => {
                            if (!answer.question?.correct_answers) return 'Not specified';
                            
                            if (answer.question.kind === 'mcq' && answer.question.options) {
                              const correctIndices = answer.question.correct_answers;
                              return correctIndices.map((idx: any) => {
                                const index = parseInt(idx);
                                return answer.question.options[index] || `Option ${String.fromCharCode(65 + index)}`;
                              }).join(', ');
                            }
                            
                            return Array.isArray(answer.question.correct_answers) 
                              ? answer.question.correct_answers.join(', ')
                              : answer.question.correct_answers;
                          };
                          
                          // Get student answer text
                          const getStudentAnswerText = () => {
                            if (!answer.response) return 'No answer provided';
                            
                            if (answer.question?.kind === 'mcq') {
                              if (answer.response.selectedOption !== undefined) {
                                const selectedIndex = answer.response.selectedOption;
                                if (answer.question.options && answer.question.options[selectedIndex]) {
                                  return answer.question.options[selectedIndex];
                                }
                                return `Option ${String.fromCharCode(65 + selectedIndex)}`;
                              }
                              return answer.response.value || 'No selection made';
                            }
                            
                            if (answer.question?.kind === 'descriptive') {
                              return answer.response.text || 'No answer provided';
                            }
                            
                            return answer.response.value || JSON.stringify(answer.response);
                          };
                          
                          return (
                            <Card key={answer.id} className="border-l-4 border-l-blue-200">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Question Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-lg">Question {index + 1}</h4>
                                      <Badge variant={displayMarks >= (answer.question?.marks || 0) ? 'default' : 'secondary'}>
                                        {displayMarks}/{answer.question?.marks || 0} marks
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${
                                        displayMarks >= (answer.question?.marks || 0) 
                                          ? 'bg-green-500' 
                                          : displayMarks > 0 
                                            ? 'bg-yellow-500' 
                                            : 'bg-red-500'
                                      }`} />
                                      <span className="text-sm font-medium capitalize">
                                        {answer.question?.kind || 'Question'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Question Text */}
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Question:</div>
                                    <div className="text-sm text-gray-900">
                                      {answer.question?.prompt || 'Question text not available'}
                                    </div>
                                  </div>
                                  
                                  {/* Answers Section */}
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {/* Correct Answer */}
                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                      <div className="text-sm font-medium text-green-800 mb-1">Correct Answer:</div>
                                      <div className="text-sm text-green-700">
                                        {getCorrectAnswerText()}
                                      </div>
                                    </div>
                                    
                                    {/* Student Answer */}
                                    <div className={`p-3 rounded-lg ${
                                      displayMarks >= (answer.question?.marks || 0)
                                        ? 'bg-green-50 border border-green-200'
                                        : displayMarks > 0 
                                          ? 'bg-yellow-50 border border-yellow-200'
                                          : 'bg-red-50 border border-red-200'
                                    }`}>
                                      <div className={`text-sm font-medium mb-1 ${
                                        displayMarks >= (answer.question?.marks || 0)
                                          ? 'text-green-800'
                                          : displayMarks > 0 
                                            ? 'text-yellow-800'
                                            : 'text-red-800'
                                      }`}>
                                        Your Answer:
                                      </div>
                                      <div className={`text-sm ${
                                        displayMarks >= (answer.question?.marks || 0)
                                          ? 'text-green-700'
                                          : displayMarks > 0 
                                            ? 'text-yellow-700'
                                            : 'text-red-700'
                                      }`}>
                                        {getStudentAnswerText()}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Feedback */}
                                  {answer.feedback && (
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                      <div className="text-sm font-medium text-blue-800 mb-1">Instructor Feedback:</div>
                                      <div className="text-sm text-blue-700">{answer.feedback}</div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">No question details available</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
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
                      <span className="text-sm font-medium">{Math.round(bestScore)}</span>
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

              {/* Action Buttons */}
              {status === 'open' ? (
                <Button 
                  className="w-full" 
                  onClick={handleStartAttempt}
                  disabled={isStarting}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {isStarting ? 'Taking...' : 'Take Assignment'}
                </Button>
              ) : status === 'submitted' ? (
                <div className="space-y-2">
                  <Button variant="outline" disabled className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Assignment Submitted
                  </Button>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Waiting for admin approval. Results will be available once reviewed.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : status === 'completed' ? (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Assignment Completed Successfully</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your assignment has been reviewed and results are available above.
                  </p>
                </div>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  {status === 'scheduled' ? 'Not Yet Available' : 
                   status === 'closed' ? 'Assignment Closed' : 
                   'Not Available'}
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