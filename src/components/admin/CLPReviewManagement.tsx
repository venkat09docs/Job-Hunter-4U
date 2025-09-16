import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, MessageSquare, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AttemptWithDetails {
  id: string;
  user_id: string;
  assignment_id: string;
  started_at: string;
  submitted_at: string | null;
  time_used_seconds: number;
  status: string;
  score_numeric: number | null;
  score_points: number;
  review_status: string;
  assignment: {
    title: string;
    type: string;
    section: {
      title: string;
      course: {
        title: string;
      };
    };
  };
  user: {
    full_name: string | null;
    username: string | null;
    email: string;
  } | null;
  answers: Array<{
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
    };
  }>;
  reviews: Array<{
    id: string;
    reviewer_id: string;
    rubric_scores: any;
    reviewer_comments: string | null;
    published_at: string | null;
  }>;
}

const CLPReviewManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<AttemptWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptWithDetails | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attempts, filter, searchTerm]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Get current user's managed institutes
      const { data: managedInstitutes } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      const instituteIds = managedInstitutes?.map(inst => inst.institute_id) || [];

      // Get students from managed institutes
      const { data: instituteStudents } = await supabase
        .from('user_assignments')
        .select('user_id')
        .in('institute_id', instituteIds)
        .eq('is_active', true);

      const studentIds = instituteStudents?.map(student => student.user_id) || [];

      if (studentIds.length === 0) {
        setAttempts([]);
        return;
      }

      // Get attempts from institute students only
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('clp_attempts')
        .select(`
          *,
          assignment:clp_assignments(
            title,
            type,
            section:course_sections(
              title,
              course:clp_courses(title)
            )
          ),
          answers:clp_answers(
            *,
            question:clp_questions(
              prompt,
              kind,
              marks
            )
          ),
          reviews:clp_reviews(*)
        `)
        .eq('status', 'submitted')
        .in('user_id', studentIds)
        .order('submitted_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Get user profiles separately
      const userIds = attemptsData?.map(attempt => attempt.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const attemptsWithUsers = attemptsData?.map(attempt => ({
        ...attempt,
        user: profilesData?.find(profile => profile.user_id === attempt.user_id) || null
      })) || [];

      setAttempts(attemptsWithUsers as AttemptWithDetails[]);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = attempts;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(attempt => attempt.review_status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(attempt => 
        attempt.assignment?.title?.toLowerCase().includes(term) ||
        attempt.user?.full_name?.toLowerCase().includes(term) ||
        attempt.user?.username?.toLowerCase().includes(term) ||
        attempt.user?.email?.toLowerCase().includes(term)
      );
    }

    setFilteredAttempts(filtered);
  };

  const handleReviewSubmit = async (attemptId: string, approved: boolean) => {
    try {
      // Create or update review
      const { error: reviewError } = await supabase
        .from('clp_reviews')
        .upsert({
          attempt_id: attemptId,
          reviewer_id: user?.id,
          rubric_scores: reviewScores,
          reviewer_comments: reviewComments,
          published_at: new Date().toISOString()
        });

      if (reviewError) throw reviewError;

      // Update attempt review status
      const { error: attemptError } = await supabase
        .from('clp_attempts')
        .update({ 
          review_status: 'published',
          score_points: approved ? 
            Object.values(reviewScores).reduce((sum, score) => sum + score, 0) : 0
        })
        .eq('id', attemptId);

      if (attemptError) throw attemptError;

      toast({
        title: 'Success',
        description: `Review ${approved ? 'approved' : 'rejected'} successfully`,
      });

      // Refresh data
      fetchSubmissions();
      setSelectedAttempt(null);
      setReviewComments('');
      setReviewScores({});
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review Submissions</h2>
          <p className="text-muted-foreground">Review and provide feedback on student assignment submissions</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, email, or assignment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{attempts.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{attempts.filter(a => a.review_status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Review</p>
                <p className="text-2xl font-bold">{attempts.filter(a => a.review_status === 'in_review').length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{attempts.filter(a => a.review_status === 'published').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredAttempts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAttempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No submissions found</p>
              </div>
            ) : (
              filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{attempt.assignment?.title}</h3>
                        <Badge variant="outline" className={getStatusColor(attempt.review_status)}>
                          {attempt.review_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>Student:</strong> {attempt.user?.full_name || attempt.user?.username} ({attempt.user?.email})
                        </p>
                        <p>
                          <strong>Course:</strong> {attempt.assignment?.section?.course?.title} - {attempt.assignment?.section?.title}
                        </p>
                        <p>
                          <strong>Submitted:</strong> {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
                        </p>
                        <p>
                          <strong>Time Used:</strong> {formatDuration(attempt.time_used_seconds)}
                        </p>
                        {attempt.score_points > 0 && (
                          <p>
                            <strong>Score:</strong> {attempt.score_points} points
                          </p>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAttempt(attempt)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Review Submission</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[600px]">
                          {selectedAttempt && selectedAttempt.id === attempt.id && (
                            <div className="space-y-6 pr-6">
                              {/* Submission Details */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Submission Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Assignment:</strong> {selectedAttempt.assignment?.title}
                                    </div>
                                    <div>
                                      <strong>Type:</strong> {selectedAttempt.assignment?.type}
                                    </div>
                                    <div>
                                      <strong>Student:</strong> {selectedAttempt.user?.full_name || selectedAttempt.user?.username}
                                    </div>
                                    <div>
                                      <strong>Email:</strong> {selectedAttempt.user?.email}
                                    </div>
                                    <div>
                                      <strong>Submitted:</strong> {selectedAttempt.submitted_at ? new Date(selectedAttempt.submitted_at).toLocaleString() : 'Not submitted'}
                                    </div>
                                    <div>
                                      <strong>Duration:</strong> {formatDuration(selectedAttempt.time_used_seconds)}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Answers */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Answers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {selectedAttempt.answers?.map((answer, index) => (
                                      <div key={answer.id} className="border rounded-lg p-4">
                                        <div className="mb-2">
                                          <strong>Question {index + 1}:</strong> {answer.question?.prompt}
                                        </div>
                                        <div className="mb-2">
                                          <strong>Answer:</strong> {JSON.stringify(answer.response)}
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div>
                                            <strong>Max Marks:</strong> {answer.question?.marks}
                                          </div>
                                          <Input
                                            type="number"
                                            placeholder="Marks awarded"
                                            value={reviewScores[answer.id] || ''}
                                            onChange={(e) => setReviewScores({
                                              ...reviewScores,
                                              [answer.id]: parseFloat(e.target.value) || 0
                                            })}
                                            className="w-32"
                                            max={answer.question?.marks}
                                            min={0}
                                            step={0.5}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Review Form */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Review & Feedback</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Reviewer Comments</label>
                                    <Textarea
                                      placeholder="Provide detailed feedback for the student..."
                                      value={reviewComments}
                                      onChange={(e) => setReviewComments(e.target.value)}
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => handleReviewSubmit(selectedAttempt.id, true)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button 
                                      onClick={() => handleReviewSubmit(selectedAttempt.id, false)}
                                      variant="destructive"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CLPReviewManagement;