import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Calendar, User, Award, FileText, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';

interface SubmittedAssignment {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  submitted_at: string;
  points_earned: number;
  score_awarded: number;
  career_task_templates: {
    title: string;
    module: string;
    points_reward: number;
    category: string;
  };
  profiles: {
    full_name: string;
    username: string;
    profile_image_url: string;
  };
  evidence: {
    id: string;
    evidence_type: string;
    evidence_data: any;
    url?: string;
    file_urls?: string[];
    verification_status: string;
  }[];
}

const VerifyAssignments = () => {
  const { user } = useAuth();
  const { isAdmin, isRecruiter, loading: roleLoading } = useRole();
  const [assignments, setAssignments] = useState<SubmittedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<SubmittedAssignment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Check authorization
  if (!roleLoading && !isAdmin && !isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (user && (isAdmin || isRecruiter)) {
      fetchSubmittedAssignments();
    }
  }, [user, isAdmin, isRecruiter]);

  const fetchSubmittedAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch submitted assignments with user profiles
      const { data, error } = await supabase
        .from('career_task_assignments')
        .select(`
          *,
          career_task_templates (
            title,
            module,
            points_reward,
            category
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data?.map(assignment => assignment.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine assignments with profiles and fetch evidence
      const assignmentsWithProfiles = (data || []).map(assignment => {
        const profile = profilesData?.find(p => p.user_id === assignment.user_id);
        return {
          ...assignment,
          profiles: profile || { full_name: 'Unknown', username: 'unknown', profile_image_url: '' }
        };
      });

      // Fetch evidence for each assignment
      const assignmentsWithEvidence = await Promise.all(
        assignmentsWithProfiles.map(async (assignment) => {
          const { data: evidenceData, error: evidenceError } = await supabase
            .from('career_task_evidence')
            .select('*')
            .eq('assignment_id', assignment.id);

          if (evidenceError) {
            console.error('Error fetching evidence:', evidenceError);
            return { ...assignment, evidence: [] };
          }

          return { ...assignment, evidence: evidenceData || [] };
        })
      );

      setAssignments(assignmentsWithEvidence);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAssignment = async (assignmentId: string, action: 'approve' | 'deny') => {
    if (!selectedAssignment) return;

    try {
      setProcessing(true);

      if (action === 'approve') {
        // Approve the assignment and award points
        const { error: updateError } = await supabase
          .from('career_task_assignments')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            points_earned: selectedAssignment.career_task_templates.points_reward,
            score_awarded: 100
          })
          .eq('id', assignmentId);

        if (updateError) throw updateError;

        // Update evidence status
        for (const evidence of selectedAssignment.evidence) {
          await supabase
            .from('career_task_evidence')
            .update({
              verification_status: 'approved',
              verified_at: new Date().toISOString(),
              verified_by: user?.id,
              verification_notes: verificationNotes
            })
            .eq('id', evidence.id);
        }

        // Award points to user
        await supabase
          .from('user_activity_points')
          .insert({
            user_id: selectedAssignment.user_id,
            activity_type: 'career_assignment',
            activity_id: selectedAssignment.template_id,
            points_earned: selectedAssignment.career_task_templates.points_reward,
            activity_date: new Date().toISOString().split('T')[0],
            notes: `Assignment completed: ${selectedAssignment.career_task_templates.title}`
          });

        toast.success('Assignment approved and points awarded!');
      } else {
        // Deny and set to resubmit
        const { error: updateError } = await supabase
          .from('career_task_assignments')
          .update({
            status: 'assigned',  // Reset to assigned so user can resubmit
            verified_at: null,
            points_earned: 0,
            score_awarded: 0
          })
          .eq('id', assignmentId);

        if (updateError) throw updateError;

        // Update evidence status
        for (const evidence of selectedAssignment.evidence) {
          await supabase
            .from('career_task_evidence')
            .update({
              verification_status: 'rejected',
              verified_at: new Date().toISOString(),
              verified_by: user?.id,
              verification_notes: verificationNotes
            })
            .eq('id', evidence.id);
        }

        toast.success('Assignment rejected. User can now resubmit.');
      }

      setSelectedAssignment(null);
      setVerificationNotes('');
      fetchSubmittedAssignments(); // Refresh the list
    } catch (error) {
      console.error('Error verifying assignment:', error);
      toast.error('Failed to process verification');
    } finally {
      setProcessing(false);
    }
  };

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'RESUME': return 'bg-blue-500';
      case 'LINKEDIN': return 'bg-blue-600';
      case 'GITHUB': return 'bg-gray-800';
      case 'DIGITAL_PROFILE': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verify Assignments</h1>
          <p className="text-muted-foreground mt-2">
            Review and verify user submitted assignments
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {assignments.length} Pending
        </Badge>
      </div>

      {assignments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assignments to Review</h3>
            <p className="text-muted-foreground">
              All submitted assignments have been verified.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={assignment.profiles.profile_image_url} />
                      <AvatarFallback>
                        {assignment.profiles.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {assignment.career_task_templates.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{assignment.profiles.full_name} (@{assignment.profiles.username})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      className={`${getModuleBadgeColor(assignment.career_task_templates.module)} text-white`}
                    >
                      {assignment.career_task_templates.module}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>{assignment.career_task_templates.points_reward} pts</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Submitted {format(new Date(assignment.submitted_at), 'PPp')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{assignment.evidence.length} Evidence Files</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog 
        open={!!selectedAssignment} 
        onOpenChange={() => setSelectedAssignment(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review Assignment: {selectedAssignment?.career_task_templates.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              {/* Assignment Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Student</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedAssignment.profiles.profile_image_url} />
                      <AvatarFallback>
                        {selectedAssignment.profiles.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {selectedAssignment.profiles.full_name} (@{selectedAssignment.profiles.username})
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Points Reward</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">
                      {selectedAssignment.career_task_templates.points_reward} points
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Submitted Evidence ({selectedAssignment.evidence.length})
                </Label>
                <div className="space-y-3">
                  {selectedAssignment.evidence.map((evidence, index) => (
                    <Card key={evidence.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">{evidence.evidence_type}</Badge>
                        <Badge 
                          variant={evidence.verification_status === 'pending' ? 'secondary' : 
                                 evidence.verification_status === 'approved' ? 'default' : 'destructive'}
                        >
                          {evidence.verification_status}
                        </Badge>
                      </div>
                      
                      {evidence.url && (
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">URL:</Label>
                          <a 
                            href={evidence.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline block truncate"
                          >
                            {evidence.url}
                          </a>
                        </div>
                      )}
                      
                      {evidence.file_urls && evidence.file_urls.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Files:</Label>
                          <div className="space-y-1">
                            {evidence.file_urls.map((fileUrl, fileIndex) => (
                              <a 
                                key={fileIndex}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline block text-sm"
                              >
                                File {fileIndex + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {evidence.evidence_data && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Additional Data:</Label>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(evidence.evidence_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Verification Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Verification Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this verification..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="mt-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleVerifyAssignment(selectedAssignment.id, 'approve')}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Approve & Award Points'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerifyAssignment(selectedAssignment.id, 'deny')}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Reject & Request Resubmit'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;