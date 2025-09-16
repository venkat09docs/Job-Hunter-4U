import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Trophy,
  FileText,
  Eye,
  Home
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { Assignment, Question, Attempt, Answer } from '@/types/clp';
import { REVIEW_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';

const AttemptResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    loading, 
    getAssignments,
    getQuestionsByAssignment,
    getAnswersByAttempt,
    getAttemptsByUser
  } = useCareerLevelProgram();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    if (attemptId && user) {
      loadResultsData();
    }
  }, [attemptId, user]);

  const loadResultsData = async () => {
    if (!attemptId) return;
    
    try {
      const allAttempts = await getAttemptsByUser();
      const foundAttempt = allAttempts.find(a => a.id === attemptId);
      
      if (foundAttempt) {
        setAttempt(foundAttempt);
        
        const allAssignments = await getAssignments();
        const foundAssignment = allAssignments.find(a => a.id === foundAttempt.assignment_id);
        
        if (foundAssignment) {
          setAssignment(foundAssignment);
          
          const [questionsData, answersData] = await Promise.all([
            getQuestionsByAssignment(foundAssignment.id),
            getAnswersByAttempt(attemptId)
          ]);
          
          // Remove duplicate questions by ID
          const uniqueQuestions = questionsData.filter((question, index, self) => 
            index === self.findIndex(q => q.id === question.id)
          );
          
          console.log('🔍 Questions before dedup:', questionsData.length);
          console.log('🔍 Questions after dedup:', uniqueQuestions.length);
          
          setQuestions(uniqueQuestions);
          setAnswers(answersData);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'in_review': return 'bg-yellow-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getAnswerStatusIcon = (answer: Answer) => {
    if (attempt?.review_status !== 'published') {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
    
    if (answer.is_correct === true) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (answer.is_correct === false) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const renderQuestionResult = (question: Question, index: number) => {
    const answer = answers.find(a => a.question_id === question.id);
    const isReviewed = attempt?.review_status === 'published';
    
    return (
      <Card key={question.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            <div className="flex items-center gap-2">
              {getAnswerStatusIcon(answer!)}
              {isReviewed && answer && (
                <Badge variant="outline">
                  {answer.marks_awarded}/{question.marks} marks
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Question</h4>
            <p className="text-sm text-muted-foreground">{question.prompt}</p>
          </div>
          
          {question.kind === 'mcq' && question.options && (
            <div>
              <h4 className="font-medium mb-2">Options</h4>
              <div className="space-y-1">
                {(question.options as string[]).map((option, idx) => {
                  const isUserAnswer = answer?.response?.selected === idx;
                  const isCorrect = isReviewed && question.correct_answers?.includes(idx.toString());
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        'p-2 rounded text-sm',
                        isUserAnswer && isReviewed && isCorrect && 'bg-green-100 border border-green-300',
                        isUserAnswer && isReviewed && !isCorrect && 'bg-red-100 border border-red-300',
                        !isUserAnswer && isReviewed && isCorrect && 'bg-blue-100 border border-blue-300',
                        (!isReviewed || (!isUserAnswer && !isCorrect)) && 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                        <span>{option}</span>
                        {isUserAnswer && <Badge variant="outline" className="ml-auto">Your Answer</Badge>}
                        {isReviewed && isCorrect && !isUserAnswer && (
                          <Badge variant="outline" className="ml-auto">Correct Answer</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {question.kind === 'descriptive' && (
            <div>
              <h4 className="font-medium mb-2">Your Answer</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {answer?.response?.text || 'No answer provided'}
              </div>
            </div>
          )}
          
          {isReviewed && answer?.feedback && (
            <div>
              <h4 className="font-medium mb-2">Feedback</h4>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                {answer.feedback}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading || !assignment || !attempt) {
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

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const earnedMarks = answers.reduce((sum, a) => sum + (a.marks_awarded || 0), 0);
  const percentage = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/career-level/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Assignment Results</h1>
              <div className="flex items-center text-muted-foreground">
                <FileText className="w-4 h-4 mr-2" />
                <span>{assignment.title}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <span>{assignment.section?.course?.title} • {assignment.section?.title}</span>
              </div>
            </div>
            
            <Badge 
              className={cn('text-white', getReviewStatusColor(attempt.review_status))}
            >
              {REVIEW_STATUS_LABELS[attempt.review_status]}
            </Badge>
          </div>
        </div>
      </div>

      {attempt.review_status === 'pending' && (
        <Alert className="bg-orange-50 border-orange-200">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your assignment has been submitted and is awaiting review by your institute admin. 
            Results will be available once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {attempt.review_status === 'in_review' && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Your assignment is currently being reviewed by your institute admin. 
            Results will be available soon.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results Summary */}
        <div className="lg:col-span-2 space-y-6">
          {attempt.review_status === 'published' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Your Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {earnedMarks}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {earnedMarks}/{totalMarks} marks
                  </div>
                </div>
                
                <Progress value={percentage} className="h-3" />
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-medium text-green-600">
                      {answers.filter(a => a.is_correct === true).length}
                    </div>
                    <div className="text-muted-foreground">Correct</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">
                      {answers.filter(a => a.is_correct === false).length}
                    </div>
                    <div className="text-muted-foreground">Incorrect</div>
                  </div>
                  <div>
                    <div className="font-medium text-yellow-600">
                      {answers.filter(a => a.is_correct === null).length}
                    </div>
                    <div className="text-muted-foreground">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions and Answers */}
          <Card>
            <CardHeader>
              <CardTitle>Questions & Answers</CardTitle>
            </CardHeader>
            <CardContent>
              {questions.map((question, index) => renderQuestionResult(question, index))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attempt Details */}
          <Card>
            <CardHeader>
              <CardTitle>Attempt Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm font-medium">
                    {formatDateTime(attempt.started_at)}
                  </span>
                </div>
                
                {attempt.submitted_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <span className="text-sm font-medium">
                      {formatDateTime(attempt.submitted_at)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time Used</span>
                  <span className="text-sm font-medium">
                    {formatDuration(attempt.time_used_seconds)}
                  </span>
                </div>

                {assignment.duration_minutes && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Limit</span>
                    <span className="text-sm font-medium">
                      {assignment.duration_minutes} minutes
                    </span>
                  </div>
                )}
              </div>

              {attempt.review_status === 'published' && (
                <>
                  <hr />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Questions</span>
                      <span className="text-sm font-medium">{questions.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Marks</span>
                      <span className="text-sm font-medium">{totalMarks}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Points Earned</span>
                      <span className="text-sm font-medium">{attempt.score_points}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions / Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attempt.review_status === 'published' ? (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Assignment Completed Successfully</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your assignment has been reviewed and results are now available.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Assignment Under Review</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your assignment is being reviewed. Results will be available soon.
                  </p>
                </div>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to="/dashboard/career-level/assignments">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttemptResults;