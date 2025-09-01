import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User, Calendar, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
  points_earned?: number;
  score_awarded?: number;
  career_task_templates?: {
    title: string;
    module?: string;
    points_reward: number;
    category?: string;
    sub_categories?: { name: string };
  };
  profiles?: {
    full_name: string;
    username: string;
    profile_image_url?: string;
  };
  evidence?: any[];
  _isLinkedInAssignment?: boolean;
  _originalLinkedInTask?: any;
}

const VerifyAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [scoreAwarded, setScoreAwarded] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');

  const fetchSubmittedAssignments = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      console.log('🔍 Starting to fetch submitted assignments...');
      
      // Fetch different types of assignments in parallel
      const promises = [
        // Career assignments
        supabase
          .from('career_task_assignments')
          .select(`
            id,
            user_id,
            template_id,
            status,
            submitted_at,
            verified_at,
            points_earned,
            score_awarded,
            career_task_templates (
              id,
              title,
              module,
              points_reward,
              category
            )
          `)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false }),

        // LinkedIn assignments
        supabase
          .from('linkedin_user_tasks')
          .select(`
            *,
            linkedin_tasks (
              id,
              code,
              title,
              description,
              points_base
            ),
            linkedin_users (
              id,
              auth_uid,
              name,
              email
            )
          `)
          .eq('status', 'SUBMITTED')
          .order('updated_at', { ascending: false }),

        // Job hunting assignments  
        supabase
          .from('job_hunting_assignments')
          .select(`
            *,
            template:job_hunting_task_templates (
              id,
              title,
              description,
              points_reward,
              category
            )
          `)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false }),

        // GitHub assignments
        supabase
          .from('github_user_tasks')
          .select(`
            *,
            github_tasks (
              id,
              code,
              title,
              description,
              points_base
            )
          `)
          .eq('status', 'SUBMITTED')
          .order('updated_at', { ascending: false })
      ];

      const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = await Promise.all(promises);
      
      if (careerResult.error) throw careerResult.error;
      if (linkedInResult.error) throw linkedInResult.error;
      if (jobHuntingResult.error) throw jobHuntingResult.error;
      if (gitHubResult.error) throw gitHubResult.error;

      const careerData = careerResult.data || [];
      const linkedInData = linkedInResult.data || [];
      const jobHuntingData = jobHuntingResult.data || [];
      const gitHubData = gitHubResult.data || [];

      console.log('🔍 Data fetched:', {
        careerDataLength: careerData?.length || 0, 
        linkedInDataLength: linkedInData?.length || 0,
        jobHuntingDataLength: jobHuntingData?.length || 0,
        gitHubDataLength: gitHubData?.length || 0
      });

      const allAssignments = [];

      // Process career assignments
      if (careerData && careerData.length > 0) {
        const userIds = careerData.map(assignment => assignment.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const assignmentsWithEvidence = await Promise.all(
          careerData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            // Fetch evidence for this assignment
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('career_task_evidence')
              .select('id, assignment_id, evidence_type, evidence_data, url, file_urls, verification_status, created_at, submitted_at, verification_notes, verified_at, verified_by, kind, email_meta, parsed_json')
              .eq('assignment_id', assignment.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('Error fetching evidence for assignment:', assignment.id, evidenceError);
            }

            return { ...assignment, profiles: profile, evidence: evidenceData || [] };
          })
        );

        allAssignments.push(...assignmentsWithEvidence);
      }

      // Process LinkedIn assignments WITH EVIDENCE FETCHING
      if (linkedInData && linkedInData.length > 0) {
        console.log('🔍 Processing LinkedIn assignments, count:', linkedInData.length);
        
        // Get auth_uids for profile lookup
        const authUids = [...new Set(linkedInData.map(task => task.linkedin_users?.auth_uid).filter(Boolean))];
        let profilesData: any[] = [];
        
        if (authUids.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, profile_image_url')
            .in('user_id', authUids);

          if (profilesError) {
            console.error('Error fetching profiles for LinkedIn assignments:', profilesError);
          } else {
            profilesData = profiles || [];
          }
        }

        const linkedInAssignmentsWithEvidence = await Promise.all(
          linkedInData.map(async assignment => {
            const authUid = assignment.linkedin_users?.auth_uid || assignment.user_id;
            const profile = profilesData?.find(p => p.user_id === authUid);
            
            console.log('🔍 Processing LinkedIn assignment:', {
              assignmentId: assignment.id,
              originalUserId: assignment.user_id,
              authUid: authUid,
              linkedInUsersData: assignment.linkedin_users,
              profileFound: !!profile
            });
            
            // Fetch LinkedIn evidence for this specific task
            let evidenceData: any[] = [];
            try {
              const { data: evidence, error: evidenceError } = await supabase
                .from('linkedin_evidence')
                .select('*')
                .eq('user_task_id', assignment.id)
                .order('created_at', { ascending: false });

              if (evidenceError) {
                console.error('🔍 LinkedIn evidence fetch error for task', assignment.id, ':', evidenceError);
              } else {
                evidenceData = evidence || [];
                console.log('🔍 LinkedIn evidence found for task', assignment.id, ':', evidenceData.length, 'items');
              }
            } catch (error) {
              console.error('🔍 LinkedIn evidence fetch exception for task', assignment.id, ':', error);
            }
            
            return {
              id: assignment.id,
              user_id: authUid, // Use auth_uid for correct user identification
              template_id: assignment.task_id,
              status: assignment.status.toLowerCase(),
              submitted_at: assignment.updated_at,
              verified_at: assignment.status === 'VERIFIED' ? assignment.updated_at : null,
              points_earned: assignment.score_awarded,
              score_awarded: assignment.score_awarded,
              career_task_templates: {
                title: assignment.linkedin_tasks?.title || 'LinkedIn Task',
                module: 'LINKEDIN',
                points_reward: assignment.linkedin_tasks?.points_base || 0,
                category: 'LinkedIn Growth Activities',
                sub_categories: { name: 'LinkedIn growth activities based' }
              },
              profiles: profile || { 
                full_name: assignment.linkedin_users?.name || `[Missing User: ${authUid?.slice(0, 8)}...]`, 
                username: assignment.linkedin_users?.email?.split('@')[0] || `missing_${authUid?.slice(0, 8)}`, 
                profile_image_url: '' 
              },
              evidence: evidenceData,
              _isLinkedInAssignment: true,
              _originalLinkedInTask: assignment
            };
          })
        );

        console.log('🔍 LinkedIn assignments with evidence:', linkedInAssignmentsWithEvidence.length);
        allAssignments.push(...linkedInAssignmentsWithEvidence);
      }

      // Process job hunting assignments
      if (jobHuntingData && jobHuntingData.length > 0) {
        const userIds = jobHuntingData.map(assignment => assignment.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const assignmentsWithEvidence = await Promise.all(
          jobHuntingData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            // Fetch evidence for this assignment
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('job_hunting_evidence')
              .select('*')
              .eq('assignment_id', assignment.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('Error fetching job hunting evidence for assignment:', assignment.id, evidenceError);
            }

            return {
              ...assignment,
              profiles: profile,
              evidence: evidenceData || [],
              career_task_templates: {
                title: assignment.template?.title || 'Job Hunting Task',
                module: 'JOB_HUNTING',
                points_reward: assignment.template?.points_reward || 0,
                category: 'Job Hunting Activities',
                sub_categories: { name: 'Job hunting activities based' }
              }
            };
          })
        );

        allAssignments.push(...assignmentsWithEvidence);
      }

      // Process GitHub assignments
      if (gitHubData && gitHubData.length > 0) {
        const userIds = gitHubData.map(task => task.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const assignmentsWithEvidence = await Promise.all(
          gitHubData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            // Fetch evidence for this assignment
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('github_evidence')
              .select('*')
              .eq('user_task_id', assignment.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('Error fetching GitHub evidence for assignment:', assignment.id, evidenceError);
            }

            return {
              id: assignment.id,
              user_id: assignment.user_id,
              template_id: assignment.task_id,
              status: assignment.status.toLowerCase(),
              submitted_at: assignment.updated_at,
              verified_at: assignment.status === 'VERIFIED' ? assignment.updated_at : null,
              points_earned: assignment.score_awarded,
              score_awarded: assignment.score_awarded,
              career_task_templates: {
                title: assignment.github_tasks?.title || 'GitHub Task',
                module: 'GITHUB',
                points_reward: assignment.github_tasks?.points_base || 0,
                category: 'GitHub Activities',
                sub_categories: { name: 'GitHub activities based' }
              },
              profiles: profile,
              evidence: evidenceData || []
            };
          })
        );

        allAssignments.push(...assignmentsWithEvidence);
      }

      console.log('🔍 Total processed assignments:', allAssignments.length);
      setAssignments(allAssignments);
      
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = assignments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.career_task_templates?.module?.toLowerCase() === moduleFilter.toLowerCase()
      );
    }

    if (userFilter.trim()) {
      filtered = filtered.filter(assignment => 
        assignment.profiles?.full_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
        assignment.profiles?.username?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    setFilteredAssignments(filtered);
  };

  useEffect(() => {
    fetchSubmittedAssignments();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [assignments, statusFilter, moduleFilter, userFilter]);

  const handleReview = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setVerificationNotes('');
    setScoreAwarded(assignment.career_task_templates?.points_reward?.toString() || '');
    setIsReviewDialogOpen(true);
  };

  const handleVerifyAssignment = async (action: 'approve' | 'reject') => {
    if (!selectedAssignment || !user) return;

    setVerifying(true);

    try {
      const points = action === 'approve' ? parseInt(scoreAwarded) || 0 : 0;
      const status = action === 'approve' ? 'verified' : 'rejected';

      if (selectedAssignment._isLinkedInAssignment) {
        // Handle LinkedIn assignment verification
        const linkedInStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
        const { error } = await supabase
          .from('linkedin_user_tasks')
          .update({
            status: linkedInStatus,
            score_awarded: points,
            updated_at: new Date().toISOString(),
            verification_notes: verificationNotes
          })
          .eq('id', selectedAssignment.id);

        if (error) throw error;
      } else {
        // Handle career task assignment verification
        const { error } = await supabase
          .from('career_task_assignments')
          .update({
            status,
            points_earned: points,
            score_awarded: points,
            verified_at: new Date().toISOString(),
            verified_by: user.id,
            verification_notes: verificationNotes
          })
          .eq('id', selectedAssignment.id);

        if (error) throw error;
      }

      toast.success(`Assignment ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setIsReviewDialogOpen(false);
      await fetchSubmittedAssignments(); // Refresh the list
      
    } catch (error) {
      console.error('Error verifying assignment:', error);
      toast.error('Failed to verify assignment');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      submitted: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getModuleBadge = (module?: string) => {
    if (!module) return null;
    
    const moduleColors = {
      RESUME: 'bg-blue-100 text-blue-800',
      LINKEDIN: 'bg-purple-100 text-purple-800',
      GITHUB: 'bg-gray-100 text-gray-800',
      JOB_HUNTING: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={moduleColors[module as keyof typeof moduleColors] || 'bg-gray-100 text-gray-800'}>
        {module}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Verify Assignments</h1>
        <Button onClick={fetchSubmittedAssignments} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module-filter">Module</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="RESUME">Resume</SelectItem>
                  <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                  <SelectItem value="GITHUB">GitHub</SelectItem>
                  <SelectItem value="JOB_HUNTING">Job Hunting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user-filter">Search User</Label>
              <Input
                id="user-filter"
                placeholder="Search by name or username"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStatusFilter('all');
                  setModuleFilter('all');
                  setUserFilter('');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No assignments found matching the current filters.
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {assignment.career_task_templates?.title || 'Unknown Task'}
                      </h3>
                      {getStatusBadge(assignment.status)}
                      {getModuleBadge(assignment.career_task_templates?.module)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          {assignment.profiles?.full_name || 'Unknown User'} 
                          ({assignment.profiles?.username || 'N/A'})
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Submitted: {new Date(assignment.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4" />
                        <span>
                          Points: {assignment.career_task_templates?.points_reward || 0}
                        </span>
                      </div>
                    </div>

                    {assignment.evidence && assignment.evidence.length > 0 && (
                      <div className="mt-3 text-sm text-blue-600">
                        📎 {assignment.evidence.length} evidence item(s) submitted
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleReview(assignment)}
                      size="sm"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Assignment</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Title:</strong> {selectedAssignment.career_task_templates?.title}
                  </div>
                  <div>
                    <strong>Module:</strong> {getModuleBadge(selectedAssignment.career_task_templates?.module)}
                  </div>
                  <div>
                    <strong>Student:</strong> {selectedAssignment.profiles?.full_name} ({selectedAssignment.profiles?.username})
                  </div>
                  <div>
                    <strong>Submitted:</strong> {new Date(selectedAssignment.submitted_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Max Points:</strong> {selectedAssignment.career_task_templates?.points_reward}
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submitted Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAssignment.evidence && selectedAssignment.evidence.length > 0 ? (
                    <div className="space-y-4">
                      {selectedAssignment.evidence.map((evidence: any, index: number) => (
                        <div key={evidence.id || index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{evidence.kind || evidence.evidence_type || 'Unknown Type'}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(evidence.created_at || evidence.submitted_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {evidence.url && (
                            <div className="mt-2">
                              <strong>URL:</strong> 
                              <a 
                                href={evidence.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:underline"
                              >
                                {evidence.url}
                              </a>
                            </div>
                          )}
                          
                          {evidence.file_urls && evidence.file_urls.length > 0 && (
                            <div className="mt-2">
                              <strong>Files:</strong>
                              <div className="mt-1 space-y-1">
                                {evidence.file_urls.map((fileUrl: string, fileIndex: number) => (
                                  <div key={fileIndex}>
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      📎 File {fileIndex + 1}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {evidence.evidence_data && (
                            <div className="mt-2">
                              <strong>Description:</strong>
                              <p className="mt-1 text-gray-700">
                                {typeof evidence.evidence_data === 'object' 
                                  ? evidence.evidence_data.description || evidence.evidence_data.text || 'No description provided'
                                  : evidence.evidence_data
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No evidence has been submitted for this assignment.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Verification Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="score">Score to Award (0 to {selectedAssignment.career_task_templates?.points_reward})</Label>
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max={selectedAssignment.career_task_templates?.points_reward}
                      value={scoreAwarded}
                      onChange={(e) => setScoreAwarded(e.target.value)}
                      placeholder="Enter score"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Verification Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add any feedback or comments..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => handleVerifyAssignment('approve')}
                      disabled={verifying || !scoreAwarded}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {verifying ? 'Approving...' : 'Approve'}
                    </Button>
                    
                    <Button
                      onClick={() => handleVerifyAssignment('reject')}
                      disabled={verifying}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {verifying ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;