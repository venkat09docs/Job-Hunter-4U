import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Send, Home } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useToast } from '@/hooks/use-toast';
import { AttemptTimer } from '@/components/clp/AttemptTimer';
import { QuestionRenderer } from '@/components/clp/QuestionRenderer';
import type { Assignment, Question, Attempt, Answer } from '@/types/clp';
import { supabase } from '@/integrations/supabase/client';

const AttemptAssignment = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    getAssignments,
    submitAssignment,
    submitAnswer,
    getQuestionsByAssignment,
    getAnswersByAttempt,
    getAttemptsByUser,
    loading
  } = useCareerLevelProgram();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentAttempt?.status === 'started' && !timeExpired && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'You are in the middle of an assignment. Your progress will be lost if you leave.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentAttempt?.status, timeExpired, isSubmitting]);

  useEffect(() => {
    if (!attemptId) return;
    
    // Load attempt and related data
    loadAttemptData();
  }, [attemptId]);

  useEffect(() => {
    // Disabled auto-save to prevent interference with user interactions
    // Auto-save was causing component re-renders during answer selection
    /*
    if (currentAttempt && answers.length > 0) {
      const interval = setInterval(saveCurrentAnswers, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
    */
  }, [currentAttempt, answers]);

  const loadAttemptData = async () => {
    if (!attemptId) return;

    try {
      // Get all user attempts to find this specific attempt
      const userAttempts = await getAttemptsByUser();
      const attempt = userAttempts.find(a => a.id === attemptId);
      
      if (!attempt) {
        toast({
          title: 'Error',
          description: 'Attempt not found',
          variant: 'destructive'
        });
        navigate('/dashboard/skill-level?tab=my-assignments');
        return;
      }

      setCurrentAttempt(attempt);

      // Get the assignment
      const allAssignments = await getAssignments();
      const assignmentData = allAssignments.find(a => a.id === attempt.assignment_id);
      
      if (!assignmentData) {
        toast({
          title: 'Error',
          description: 'Assignment not found',
          variant: 'destructive'
        });
        return;
      }

      setAssignment(assignmentData);

      // Load questions and existing answers
      const [questionsData, answersData] = await Promise.all([
        getQuestionsByAssignment(attempt.assignment_id),
        getAnswersByAttempt(attemptId)
      ]);
      
      setQuestions(questionsData.sort((a, b) => a.order_index - b.order_index));
      setAnswers(answersData || []);

    } catch (error) {
      console.error('Error loading attempt data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attempt data',
        variant: 'destructive'
      });
    }
  };

  // Auto-save function removed to prevent interference with user interactions

  // Debounce timer for answer submission
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnswerChange = useCallback((questionId: string, response: Record<string, any>) => {
    if (!currentAttempt) return;

    // Update local state immediately for better UX
    setAnswers(prev => {
      const existing = prev.find(a => a.question_id === questionId);
      if (existing) {
        // Check if response actually changed to avoid unnecessary state updates
        const responseChanged = JSON.stringify(existing.response) !== JSON.stringify(response);
        if (!responseChanged) {
          return prev;
        }
        return prev.map(a => 
          a.question_id === questionId 
            ? { ...a, response } 
            : a
        );
      } else {
        return [...prev, {
          id: `temp-${questionId}`,
          attempt_id: currentAttempt.id,
          question_id: questionId,
          response,
          is_correct: null,
          marks_awarded: 0,
          feedback: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }];
      }
    });

    // Clear existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    // Debounce answer submission to prevent constant API calls while typing
    submitTimeoutRef.current = setTimeout(async () => {
      try {
        await submitAnswer({
          attempt_id: currentAttempt.id,
          question_id: questionId,
          response
        });
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Don't show error toast for every answer submission to avoid disrupting user experience
      }
    }, 1000); // Wait 1 second after user stops typing
  }, [currentAttempt, submitAnswer]);

  const handleSubmitAttempt = async () => {
    if (!currentAttempt) return;

    setIsSubmitting(true);
    try {
      console.log('🔄 Submitting assignment:', currentAttempt.assignment_id);
      
      // Submit the assignment directly (not attempt-based)
      const success = await submitAssignment(currentAttempt.assignment_id);
      
      if (!success) {
        throw new Error('Failed to submit assignment');
      }
      
      console.log('✅ Assignment submitted successfully');
      
      // Notify institute admin about the submission
      await notifyInstituteAdmin();
      
      toast({
        title: 'Success',
        description: 'Assignment submitted successfully!',
        variant: 'default'
      });
      
      // Navigate to Skills Level Up Program - Assignments tab
      navigate('/dashboard/skill-level?tab=my-assignments');
    } catch (error) {
      console.error('❌ Error submitting attempt:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
      setShowNavigationWarning(false);
      const pendingNav = pendingNavigation;
      setPendingNavigation(null);
      // Execute pending navigation if exists
      if (pendingNav) {
        pendingNav();
      }
    }
  };

  const notifyInstituteAdmin = async () => {
    try {
      const { data: userInstitute } = await supabase
        .from('user_assignments')
        .select(`
          institute_id,
          institutes:institute_id (
            name
          )
        `)
        .eq('user_id', currentAttempt?.user_id)
        .eq('is_active', true)
        .single();

      if (userInstitute?.institute_id) {
        // Get institute admins
        const { data: instituteAdmins } = await supabase
          .from('institute_admin_assignments')
          .select('user_id')
          .eq('institute_id', userInstitute.institute_id)
          .eq('is_active', true);

        // Send notifications to all institute admins
        if (instituteAdmins && instituteAdmins.length > 0) {
          const { data: currentUser } = await supabase.auth.getUser();
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('user_id', currentUser?.user?.id)
            .single();
          
          const studentName = studentProfile?.full_name || studentProfile?.username || 'A student';
          
          const notifications = instituteAdmins.map(admin => ({
            user_id: admin.user_id,
            title: 'New Skills Assignment Submission',
            message: `${studentName} has submitted a skills assignment: ${assignment?.title}`,
            type: 'skills_assignment_submission',
            related_id: currentAttempt?.id,
            is_read: false
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
          
          console.log('✅ Notifications sent to institute admins:', notifications.length);
        }
      }
    } catch (error) {
      console.error('Error notifying institute admin:', error);
      // Don't fail the submission if notification fails
    }
  };

  const handleTimeExpired = () => {
    setTimeExpired(true);
    // Auto-submit when time expires
    handleSubmitAttempt();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getAnsweredQuestionsCount = () => {
    return questions.filter(q => 
      answers.some(a => a.question_id === q.id && a.response && Object.keys(a.response).length > 0)
    ).length;
  };

  const handleNavigationWarning = (shouldSubmit: boolean) => {
    if (shouldSubmit) {
      handleSubmitAttempt();
    } else {
      setShowNavigationWarning(false);
      setPendingNavigation(null);
    }
  };

  const handleBackToAssignments = () => {
    if (currentAttempt?.status === 'started' && !timeExpired && !isSubmitting) {
      setPendingNavigation(() => () => navigate('/dashboard/skill-level?tab=my-assignments'));
      setShowNavigationWarning(true);
    } else {
      navigate('/dashboard/skill-level?tab=my-assignments');
    }
  };

  // Calculate these values early (before any conditional returns) to avoid hook order issues
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question_id === currentQuestion?.id);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = getAnsweredQuestionsCount();

  if (loading || !assignment || !currentAttempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading assignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToAssignments}>
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Back to Assignments</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div>
              <h1 className="font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {answeredCount}/{questions.length} Answered
            </Badge>
            
            {assignment.duration_minutes && (
              <AttemptTimer
                startTime={currentAttempt.started_at}
                durationMinutes={assignment.duration_minutes}
                onTimeExpired={handleTimeExpired}
              />
            )}
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto py-6 px-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1}/{questions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Time Expired Alert */}
        {timeExpired && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Time has expired! Your assignment will be auto-submitted.
            </AlertDescription>
          </Alert>
        )}

        {/* Question */}
        {currentQuestion && (
          <div className="space-y-6">
            <QuestionRenderer
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              existingAnswer={currentAnswer}
              onAnswerChange={handleAnswerChange}
              readonly={timeExpired}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={() => setShowSubmitConfirm(true)}
                    disabled={answeredCount === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Assignment
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Warning Dialog */}
        {showNavigationWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Assignment in Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p>You are currently attempting an assignment.</p>
                  <p>You have answered {getAnsweredQuestionsCount()} out of {questions.length} questions.</p>
                  <p className="font-medium text-amber-600">
                    Do you want to submit your assignment or continue working on it?
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleNavigationWarning(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Continue Assignment
                  </Button>
                  <Button
                    onClick={() => handleNavigationWarning(true)}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit Confirmation Dialog */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Submit Assignment?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p>You have answered {answeredCount} out of {questions.length} questions.</p>
                  {answeredCount < questions.length && (
                    <p className="text-amber-600 font-medium">
                      You still have {questions.length - answeredCount} unanswered questions.
                    </p>
                  )}
                  <p>Once submitted, you cannot make further changes.</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitAttempt}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Question Navigation Sidebar */}
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
          <Card className="w-48">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-5 gap-1">
                {questions.map((_, index) => {
                  const isAnswered = answers.some(a => 
                    a.question_id === questions[index].id && 
                    a.response && 
                    Object.keys(a.response).length > 0
                  );
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`
                        w-8 h-8 rounded text-xs font-medium transition-colors
                        ${isCurrent 
                          ? 'bg-blue-600 text-white' 
                          : isAnswered 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttemptAssignment;