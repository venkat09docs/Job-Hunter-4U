import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useToast } from '@/hooks/use-toast';
import { AttemptTimer } from '@/components/clp/AttemptTimer';
import { QuestionRenderer } from '@/components/clp/QuestionRenderer';
import type { Assignment, Question, Attempt, Answer } from '@/types/clp';

const AttemptAssignment = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    startAttempt,
    submitAttempt,
    submitAnswer,
    getQuestionsByAssignment,
    getAnswersByAttempt,
    loading
  } = useCareerLevelProgram();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;
    
    // Load assignment details and questions
    loadAssignmentData();
  }, [assignmentId]);

  useEffect(() => {
    // Auto-save answers periodically
    if (currentAttempt && answers.length > 0) {
      const interval = setInterval(saveCurrentAnswers, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentAttempt, answers]);

  const loadAssignmentData = async () => {
    if (!assignmentId) return;

    try {
      // For demo, we'll simulate loading assignment data
      // In real implementation, you'd fetch the assignment details
      const questionsData = await getQuestionsByAssignment(assignmentId);
      setQuestions(questionsData);

      // Simulate assignment data
      const assignmentData: Assignment = {
        id: assignmentId,
        module_id: 'module-1',
        title: 'React Fundamentals Quiz',
        type: 'mcq',
        instructions: 'Answer all questions to the best of your ability.',
        duration_minutes: 60,
        max_attempts: 1,
        attempt_policy: 'best',
        randomize_questions: false,
        shuffle_options: false,
        negative_marking: false,
        points_scale: {},
        rubric: {},
        attachments_required: false,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setAssignment(assignmentData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load assignment',
        variant: 'destructive'
      });
    }
  };

  const handleStartAttempt = async () => {
    if (!assignmentId) return;

    try {
      const attempt = await startAttempt(assignmentId);
      if (attempt) {
        setCurrentAttempt(attempt);
        // Initialize empty answers for all questions
        const initialAnswers: Answer[] = questions.map((question) => ({
          id: `temp-${question.id}`,
          attempt_id: attempt.id,
          question_id: question.id,
          response: {},
          marks_awarded: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setAnswers(initialAnswers);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start attempt',
        variant: 'destructive'
      });
    }
  };

  const handleAnswerChange = (questionId: string, response: any) => {
    const updatedAnswers = answers.map(answer => 
      answer.question_id === questionId 
        ? { ...answer, response, updated_at: new Date().toISOString() }
        : answer
    );
    setAnswers(updatedAnswers);
  };

  const saveCurrentAnswers = async () => {
    if (!currentAttempt) return;

    try {
      // Save all answers that have been modified
      const promises = answers
        .filter(answer => answer.response && Object.keys(answer.response).length > 0)
        .map(answer => 
          submitAnswer({
            attempt_id: currentAttempt.id,
            question_id: answer.question_id,
            response: answer.response
          })
        );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to auto-save answers:', error);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!currentAttempt) return;

    try {
      // Save all current answers first
      await saveCurrentAnswers();
      
      // Submit the attempt
      const success = await submitAttempt(currentAttempt.id);
      if (success) {
        toast({
          title: 'Assignment Submitted',
          description: 'Your answers have been submitted successfully!'
        });
        navigate('/dashboard/career-level/my-assignments');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive'
      });
    }
  };

  const handleTimeExpired = useCallback(() => {
    setTimeExpired(true);
    if (currentAttempt) {
      handleSubmitAttempt();
    }
  }, [currentAttempt]);

  const getCurrentAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    
    return answers.find(answer => answer.question_id === currentQuestion.id);
  };

  const getAnsweredQuestions = () => {
    return answers.filter(answer => answer.response && Object.keys(answer.response).length > 0).length;
  };

  const progress = questions.length > 0 ? (getAnsweredQuestions() / questions.length) * 100 : 0;

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading assignment...</div>
        </div>
      </div>
    );
  }

  // Pre-attempt view
  if (!currentAttempt) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/career-level/my-assignments')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">
                  {assignment.type}
                </Badge>
                <Badge variant="secondary">
                  {questions.length} Questions
                </Badge>
                {assignment.duration_minutes && (
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {assignment.duration_minutes} min
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {assignment.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instructions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {assignment.instructions}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {assignment.duration_minutes || '∞'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.duration_minutes ? 'Minutes' : 'No Time Limit'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{assignment.max_attempts}</div>
                  <div className="text-sm text-muted-foreground">Max Attempts</div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Once you start this assignment, the timer will begin. Make sure you have a stable internet connection and enough time to complete it.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button size="lg" onClick={handleStartAttempt} disabled={loading}>
                  Start Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = getCurrentAnswer();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {assignment.duration_minutes && (
                <AttemptTimer
                  durationMinutes={assignment.duration_minutes}
                  startTime={currentAttempt.started_at}
                  onTimeExpired={handleTimeExpired}
                />
              )}
              
              <Badge variant="outline">
                {getAnsweredQuestions()}/{questions.length} Answered
              </Badge>
            </div>
          </div>
          
          <Progress value={progress} className="mt-2" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-sm">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
                  {questions.map((_, index) => {
                    const isAnswered = answers[index]?.response && Object.keys(answers[index].response).length > 0;
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        className={`w-full ${isAnswered ? 'bg-green-50 border-green-200 text-green-800' : ''}`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                        {isAnswered && <CheckCircle className="h-3 w-3 ml-1" />}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    Answered: {getAnsweredQuestions()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Remaining: {questions.length - getAnsweredQuestions()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {currentQuestion ? (
                <QuestionRenderer
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  existingAnswer={currentAnswer}
                  onAnswerChange={handleAnswerChange}
                  readonly={timeExpired}
                />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0 || timeExpired}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={timeExpired}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                    disabled={timeExpired}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Submit Assignment?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to submit your assignment? You have answered {getAnsweredQuestions()} out of {questions.length} questions.
              </p>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Once submitted, you cannot make any changes to your answers.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAttempt}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Submit Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AttemptAssignment;