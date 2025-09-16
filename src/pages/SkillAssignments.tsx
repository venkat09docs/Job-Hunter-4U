import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInstituteName } from '@/hooks/useInstituteName';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, User, BookOpen, Award, Clock, CheckCircle2, AlertCircle, Eye, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface SubmittedAssignment {
  id: string;
  assignment_id: string;
  user_id: string;
  submitted_at: string;
  score_numeric: number | null;
  score_points: number;
  status: string;
  review_status: string;
  time_used_seconds: number;
  assignment: {
    title: string;
    type: string;
    instructions: string;
    section: {
      title: string;
      course: {
        title: string;
        category: string;
      };
    };
  };
  user_profile: {
    full_name: string;
    username: string;
    email: string;
  };
  answers?: Array<{
    id: string;
    question_id: string;
    response: any;
    is_correct: boolean | null;
    marks_awarded: number | null;
    feedback: string | null;
  question: {
    prompt: string;
    kind: string;
    marks: number;
    correct_answers?: any[];
  };
  }>;
}

const SkillAssignments = () => {
  const { instituteName } = useInstituteName();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<SubmittedAssignment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState('');

  const { data: submittedAssignments = [], isLoading } = useQuery({
    queryKey: ['institute-submitted-assignments', selectedStatus],
    queryFn: async () => {
      // Get all attempts that are submitted by students of this institute
      let query = supabase
        .from('clp_attempts')
        .select(`
          *,
          assignment:clp_assignments(
            title,
            type,
            instructions,
            section:course_sections(
              title,
              course:clp_courses(
                title,
                category
              )
            )
          ),
          answers:clp_answers(
            id,
            question_id,
            response,
            is_correct,
            marks_awarded,
            feedback,
            question:clp_questions(
              prompt,
              kind,
              marks,
              correct_answers
            )
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      const { data: attempts, error } = await query;
      if (error) throw error;

      if (!attempts) return [];

      // Get user profiles for these attempts
      const userIds = attempts.map(attempt => attempt.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Filter to only include students from this institute
      const { data: instituteStudents, error: instituteError } = await supabase
        .from('user_assignments')
        .select('user_id')
        .eq('is_active', true);

      if (instituteError) throw instituteError;

      const instituteStudentIds = instituteStudents?.map(s => s.user_id) || [];

      // Combine data and filter by institute students
      const submittedAssignments = attempts
        .filter(attempt => instituteStudentIds.includes(attempt.user_id))
        .map(attempt => ({
          ...attempt,
          user_profile: profiles?.find(p => p.user_id === attempt.user_id)
        }))
        .filter(assignment => assignment.user_profile); // Only include if we have profile data

      return submittedAssignments as SubmittedAssignment[];
    }
  });

  const getStatusBadge = (status: string, reviewStatus: string) => {
    if (status === 'submitted' && reviewStatus === 'pending') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
    if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Reviewed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getScoreDisplay = (scoreNumeric: number | null, scorePoints: number) => {
    if (scoreNumeric !== null) {
      return (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span className="font-medium">{scoreNumeric.toFixed(1)}%</span>
          <span className="text-muted-foreground">({scorePoints} points)</span>
        </div>
      );
    }
    return <span className="text-muted-foreground">Not graded</span>;
  };

  const handleViewDetails = (assignment: SubmittedAssignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsDialog(true);
  };

  const handleReviewAssignment = (assignment: SubmittedAssignment) => {
    setSelectedAssignment(assignment);
    setShowReviewDialog(true);
    // Initialize review scores
    const initialScores: Record<string, number> = {};
    assignment.answers?.forEach(answer => {
      initialScores[answer.question_id] = answer.marks_awarded || 0;
    });
    setReviewScores(initialScores);
  };

  const handleReviewSubmit = async (approved: boolean) => {
    if (!selectedAssignment) return;
    
    try {
      console.log('Starting review submission for assignment:', selectedAssignment.id);
      
      // Update individual answer marks and feedback
      for (const answer of selectedAssignment.answers || []) {
        const score = reviewScores[answer.question_id] || 0;
        console.log(`Updating answer ${answer.id} with score ${score}`);
        
        const { error: answerError } = await supabase
          .from('clp_answers')
          .update({ 
            marks_awarded: score,
            feedback: reviewComments 
          })
          .eq('id', answer.id);
        
        if (answerError) {
          console.error('Error updating answer:', answerError);
          throw answerError;
        }
      }

      // Calculate total score
      const totalScore = Object.values(reviewScores).reduce((sum, score) => sum + score, 0);
      console.log('Total score calculated:', totalScore);

      // Update attempt with review status and total score
      console.log('Updating attempt:', selectedAssignment.id, 'with review_status: published and score:', totalScore);
      
      const { data: updateData, error: attemptError } = await supabase
        .from('clp_attempts')
        .update({ 
          review_status: 'published',
          score_points: totalScore,
          score_numeric: totalScore
        })
        .eq('id', selectedAssignment.id)
        .select(); // Return the updated record to verify the update
      
      if (attemptError) {
        console.error('Error updating attempt:', attemptError);
        throw attemptError;
      }
      
      console.log('Update result:', updateData);

      toast({
        title: 'Success',
        description: `Assignment reviewed successfully. Total score: ${totalScore} points`,
      });

      setShowReviewDialog(false);
      setSelectedAssignment(null);
      setReviewComments('');
      setReviewScores({});
      
      // Force refetch of the query data with the correct query key
      queryClient.invalidateQueries({ 
        queryKey: ['institute-submitted-assignments', selectedStatus] 
      });
      
      // Also invalidate other possible query keys to ensure data refresh
      queryClient.invalidateQueries({ 
        queryKey: ['institute-submitted-assignments'] 
      });
      
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: `Failed to submit review: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const filteredAssignments = selectedStatus === 'all' 
    ? submittedAssignments 
    : submittedAssignments.filter(assignment => 
        selectedStatus === 'pending' ? assignment.review_status === 'pending' : 
        selectedStatus === 'reviewed' ? assignment.review_status === 'published' :
        assignment.review_status === selectedStatus
      );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCorrectAnswer = (correctAnswers: any[], questionKind: string) => {
    if (!correctAnswers || correctAnswers.length === 0) return 'No correct answer defined';
    
    if (questionKind === 'tf') {
      return correctAnswers[0] ? 'True' : 'False';
    } else if (questionKind === 'mcq') {
      return correctAnswers.join(', ');
    } else {
      return correctAnswers.join(', ');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Skill Assignments</h1>
            <p className="text-muted-foreground">Loading submitted assignments...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Skill Assignments</h1>
          <p className="text-muted-foreground">
            Review submitted assignments from {instituteName} students
          </p>
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Submissions ({submittedAssignments.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review ({submittedAssignments.filter(a => a.review_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Published ({submittedAssignments.filter(a => a.review_status === 'published').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                <p className="text-muted-foreground text-center">
                  {selectedStatus === 'all' 
                    ? "No students have submitted assignments yet." 
                    : `No assignments with ${selectedStatus} status.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {assignment.assignment?.title || 'Assignment'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {assignment.user_profile?.full_name} (@{assignment.user_profile?.username})
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {format(new Date(assignment.submitted_at), 'PPp')}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(assignment.status, assignment.review_status)}
                      <Badge variant="outline" className="text-xs">
                        {assignment.assignment?.type?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Course Information</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Course: {assignment.assignment?.section?.course?.title}</span>
                        <span>Section: {assignment.assignment?.section?.title}</span>
                        <span>Category: {assignment.assignment?.section?.course?.category}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Score</h4>
                      {getScoreDisplay(assignment.score_numeric, assignment.score_points)}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Student Contact</h4>
                      <p className="text-sm text-muted-foreground">{assignment.user_profile?.email}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => handleViewDetails(assignment)}
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => handleReviewAssignment(assignment)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Review Assignment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(85vh-120px)] pr-4">{selectedAssignment && (
              <div className="space-y-6">{/* Assignment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Title:</strong> {selectedAssignment.assignment?.title}
                      </div>
                      <div>
                        <strong>Type:</strong> {selectedAssignment.assignment?.type}
                      </div>
                      <div>
                        <strong>Course:</strong> {selectedAssignment.assignment?.section?.course?.title}
                      </div>
                      <div>
                        <strong>Section:</strong> {selectedAssignment.assignment?.section?.title}
                      </div>
                      <div>
                        <strong>Student:</strong> {selectedAssignment.user_profile?.full_name}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedAssignment.user_profile?.email}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {format(new Date(selectedAssignment.submitted_at), 'PPp')}
                      </div>
                      <div>
                        <strong>Time Used:</strong> {formatDuration(selectedAssignment.time_used_seconds)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedAssignment.assignment?.instructions}</p>
                  </CardContent>
                </Card>

                {/* Answers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Student Answers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Group answers by question_id to show unique questions only
                        const uniqueQuestions = new Map();
                        selectedAssignment.answers?.forEach(answer => {
                          if (!uniqueQuestions.has(answer.question_id) || 
                              new Date(answer.id) > new Date(uniqueQuestions.get(answer.question_id).id)) {
                            uniqueQuestions.set(answer.question_id, answer);
                          }
                        });
                        const uniqueAnswers = Array.from(uniqueQuestions.values());
                        
                        return uniqueAnswers.map((answer, index) => (
                          <div key={answer.question_id} className="border rounded-lg p-4">
                            <div className="mb-2">
                              <strong>Question {index + 1}:</strong> {answer.question?.prompt}
                            </div>
                            <div className="mb-2">
                              <strong>Answer:</strong> 
                              <div className="mt-1 p-2 bg-muted rounded text-sm">
                                {answer.response?.value || 'No answer provided'}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>
                                <strong>Max Marks:</strong> {answer.question?.marks}
                              </span>
                              <span>
                                <strong>Awarded:</strong> {answer.marks_awarded || 0}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Review Assignment Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review Assignment</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(85vh-120px)] pr-4">{selectedAssignment && (
              <div className="space-y-6">{/* Assignment Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Title:</strong> {selectedAssignment.assignment?.title}
                      </div>
                      <div>
                        <strong>Student:</strong> {selectedAssignment.user_profile?.full_name}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions for Review */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Questions & Assign Marks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        // Group answers by question_id to show unique questions only
                        const uniqueQuestions = new Map();
                        selectedAssignment.answers?.forEach(answer => {
                          if (!uniqueQuestions.has(answer.question_id) || 
                              new Date(answer.id) > new Date(uniqueQuestions.get(answer.question_id).id)) {
                            uniqueQuestions.set(answer.question_id, answer);
                          }
                        });
                        const uniqueAnswers = Array.from(uniqueQuestions.values());
                        
                        return uniqueAnswers.map((answer, index) => (
                          <div key={answer.question_id} className="border rounded-lg p-4">
                            <div className="mb-3">
                              <strong>Question {index + 1}:</strong> {answer.question?.prompt}
                            </div>
                            <div className="mb-3">
                              <strong>Student's Answer:</strong> 
                              <div className="mt-1 p-2 bg-muted rounded text-sm">
                                {answer.response?.value || 'No answer provided'}
                              </div>
                            </div>
                            <div className="mb-3">
                              <strong>Correct Answer:</strong> 
                              <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                {formatCorrectAnswer(answer.question?.correct_answers, answer.question?.kind)}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Marks (Max: {answer.question?.marks}):</label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={answer.question?.marks}
                                  value={reviewScores[answer.question_id] || 0}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setReviewScores(prev => ({
                                      ...prev,
                                      [answer.question_id]: Math.min(value, answer.question?.marks || 0)
                                    }));
                                  }}
                                  className="w-20"
                                />
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Review Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Provide feedback for the student..."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleReviewSubmit(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Review
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillAssignments;