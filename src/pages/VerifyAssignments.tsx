import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Filter, FileText, Award, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminReenableRequestsDialog } from '@/components/AdminReenableRequestsDialog';
import { EvidenceDisplay } from '@/components/EvidenceDisplay';

interface SubmittedAssignment {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
  points_earned?: number;
  score_awarded?: number;
  career_task_templates: {
    title: string;
    module?: string;
    points_reward: number;
    category: string;
    sub_categories?: {
      name: string;
    };
  };
  profiles: {
    full_name: string;
    username: string;
    profile_image_url?: string;
  };
  evidence: any[];
  _isLinkedInAssignment?: boolean;
  _originalLinkedInTask?: any;
}

const VerifyAssignments = () => {
  const { user } = useAuth();
  const { role, isAdmin, isInstituteAdmin, isRecruiter, loading } = useRole();
  const navigate = useNavigate();

  // States
  const [assignments, setAssignments] = useState<SubmittedAssignment[]>([]);
  const [verifiedAssignments, setVerifiedAssignments] = useState<SubmittedAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<SubmittedAssignment[]>([]);
  const [filteredVerifiedAssignments, setFilteredVerifiedAssignments] = useState<SubmittedAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<SubmittedAssignment | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [verifiedSearchTerm, setVerifiedSearchTerm] = useState('');
  const [verifiedModuleFilter, setVerifiedModuleFilter] = useState('all');
  const [verifiedUserFilter, setVerifiedUserFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [verifiedCurrentPage, setVerifiedCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchVerifiedAssignments = async () => {
    try {
      // Only fetch if user has proper permissions
      if (isAdmin) {
        // Super admins can view all verified assignments
        const { data, error } = await supabase
          .from('career_task_assignments')
          .select(`
            *,
            career_task_templates (
              title,
              module,
              points_reward,
              category,
              sub_categories (
                name
              )
            )
          `)
          .eq('status', 'verified')
          .order('verified_at', { ascending: false });

        if (error) throw error;
        await processVerifiedAssignments(data || []);
      }
    } catch (error) {
      console.error('Error fetching verified assignments:', error);
      toast.error('Failed to load verified assignments');
    }
  };

  const processVerifiedAssignments = async (data: any[]) => {
    // Fetch user profiles separately
    const userIds = data?.map(assignment => assignment.user_id) || [];
    if (userIds.length === 0) {
      setVerifiedAssignments([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Combine assignments with profiles and fetch evidence
    const assignmentsWithProfiles = data.map(assignment => {
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
          .eq('assignment_id', assignment.id)
          .order('created_at', { ascending: false });

        if (evidenceError) {
          console.error('Error fetching evidence:', evidenceError);
          return { ...assignment, evidence: [] };
        }

        return { ...assignment, evidence: evidenceData || [] };
      })
    );

    setVerifiedAssignments(assignmentsWithEvidence);
  };

  // Filter pending assignments based on search and filters
  useEffect(() => {
    let filtered = assignments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.career_task_templates.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.career_task_templates.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Module filter
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const displayModule = assignment.career_task_templates.sub_categories?.name || 
                              assignment.career_task_templates.module || 
                              assignment.career_task_templates.category || 
                              'GENERAL';
        return displayModule === moduleFilter;
      });
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === userFilter);
    }

    setFilteredAssignments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [assignments, searchTerm, moduleFilter, userFilter]);

  // Filter verified assignments based on search and filters
  useEffect(() => {
    let filtered = verifiedAssignments;

    // Search filter
    if (verifiedSearchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.profiles.full_name.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.profiles.username.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.career_task_templates.title.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.career_task_templates.category.toLowerCase().includes(verifiedSearchTerm.toLowerCase())
      );
    }

    // Module filter
    if (verifiedModuleFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const displayModule = assignment.career_task_templates.sub_categories?.name || 
                              assignment.career_task_templates.module || 
                              assignment.career_task_templates.category || 
                              'GENERAL';
        return displayModule === verifiedModuleFilter;
      });
    }

    // User filter
    if (verifiedUserFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === verifiedUserFilter);
    }

    setFilteredVerifiedAssignments(filtered);
    setVerifiedCurrentPage(1); // Reset to first page when filters change
  }, [verifiedAssignments, verifiedSearchTerm, verifiedModuleFilter, verifiedUserFilter]);

  const fetchSubmittedAssignments = async () => {
    try {
      setLoadingAssignments(true);
      
      // Fetch both career assignments and LinkedIn assignments
      const careerAssignments = await fetchCareerAssignments();
      const linkedinAssignments = await fetchLinkedInAssignments();
      
      // Combine both types of assignments
      const allAssignments = [...careerAssignments, ...linkedinAssignments];
      
      // Sort by submission time
      allAssignments.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      
      await processAssignments(allAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchCareerAssignments = async () => {
    // If institute admin, filter by their institute's students
    if (isInstituteAdmin && !isAdmin) {
      console.log('Fetching career assignments for institute admin:', user?.id);
      
      // First get the institute(s) this admin manages
      const { data: institutes, error: instituteError } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (instituteError) throw instituteError;

      if (institutes && institutes.length > 0) {
        const instituteIds = institutes.map(i => i.institute_id);
        
        // Get students assigned to these institutes
        const { data: studentAssignments, error: studentsError } = await supabase
          .from('user_assignments')
          .select('user_id')
          .in('institute_id', instituteIds)
          .eq('is_active', true);

        if (studentsError) throw studentsError;

        if (studentAssignments && studentAssignments.length > 0) {
          const studentIds = studentAssignments.map(s => s.user_id);
          
          const { data, error } = await supabase
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
                title,
                module,
                points_reward,
                category,
                sub_categories (
                  name
                )
              )
            `)
            .eq('status', 'submitted')
            .in('user_id', studentIds)
            .order('submitted_at', { ascending: false });

          if (error) throw error;
          return data || [];
        }
      }
      return [];
    } else {
      // For super admins and recruiters, fetch all career assignments
      const { data, error } = await supabase
        .from('career_task_assignments')
        .select(`
          *,
          career_task_templates (
            title,
            module,
            points_reward,
            category,
            sub_categories (
              name
            )
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  };

  const fetchLinkedInAssignments = async () => {
    try {
      // Similar logic for LinkedIn assignments - simplified for brevity
      return [];
    } catch (error) {
      console.error('Error fetching LinkedIn assignments:', error);
      return [];
    }
  };

  const processAssignments = async (data: any[]) => {
    // Fetch user profiles separately
    const userIds = data?.map(assignment => assignment.user_id) || [];
    if (userIds.length === 0) {
      setAssignments([]);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Combine assignments with profiles and fetch evidence
    const assignmentsWithProfiles = data.map(assignment => {
      const profile = profilesData?.find(p => p.user_id === assignment.user_id);
      return {
        ...assignment,
        profiles: profile || { full_name: 'Unknown', username: 'unknown', profile_image_url: '' }
      };
    });

    // Fetch evidence for each assignment (handle both career and LinkedIn assignments)
    const assignmentsWithEvidence = await Promise.all(
      assignmentsWithProfiles.map(async (assignment) => {
        let evidenceData = [];
        
        if (assignment._isLinkedInAssignment) {
          // Handle LinkedIn evidence if needed
          evidenceData = [];
        } else {
          // Fetch all career task evidence - ordered by most recent first
          const { data: careerEvidenceData, error: careerEvidenceError } = await supabase
            .from('career_task_evidence')
            .select('*')
            .eq('assignment_id', assignment.id)
            .order('created_at', { ascending: false });

          if (careerEvidenceError) {
            console.error('Error fetching career evidence:', careerEvidenceError);
          } else {
            evidenceData = careerEvidenceData || [];
          }
        }

        console.log('🔍 Evidence for assignment', assignment.id, ':', evidenceData);
        return { ...assignment, evidence: evidenceData };
      })
    );

    console.log('🔍 Final assignments with evidence:', assignmentsWithEvidence);
    setAssignments(assignmentsWithEvidence);
  };

  // Check access permissions after hooks are defined
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin && !isInstituteAdmin && !isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch assignments on component mount
  useEffect(() => {
    if (!loading && (isAdmin || isInstituteAdmin || isRecruiter)) {
      fetchSubmittedAssignments();
      fetchVerifiedAssignments();
    }
  }, [user?.id, isAdmin, isInstituteAdmin, loading]);

  // Get unique users for filter dropdown
  const uniqueUsers = Array.from(
    new Map(
      assignments.map(assignment => [
        assignment.user_id,
        { id: assignment.user_id, name: assignment.profiles.full_name, username: assignment.profiles.username }
      ])
    ).values()
  );

  // Get unique modules for filter dropdown
  const uniqueModules = [...new Set(assignments.map(assignment => 
    assignment.career_task_templates.sub_categories?.name || 
    assignment.career_task_templates.module || 
    assignment.career_task_templates.category || 
    'GENERAL'
  ))];

  // Get unique users for verified assignments filter dropdown
  const uniqueVerifiedUsers = Array.from(
    new Map(
      verifiedAssignments.map(assignment => [
        assignment.user_id,
        { id: assignment.user_id, name: assignment.profiles.full_name, username: assignment.profiles.username }
      ])
    ).values()
  );

  // Get unique modules for verified assignments filter dropdown
  const uniqueVerifiedModules = [...new Set(verifiedAssignments.map(assignment => 
    assignment.career_task_templates.sub_categories?.name || 
    assignment.career_task_templates.module || 
    assignment.career_task_templates.category || 
    'GENERAL'
  ))];

  const handleVerifyAssignment = async (assignmentId: string, action: 'approve' | 'deny') => {
    if (!selectedAssignment) return;
    
    console.log('🔍 Selected assignment for verification:', selectedAssignment);
    console.log('🔍 Evidence to display:', selectedAssignment.evidence);

    try {
      setProcessing(true);

      if (selectedAssignment._isLinkedInAssignment) {
        // Handle LinkedIn assignments
        if (action === 'approve') {
          // Update LinkedIn user task status to VERIFIED
          const { error: updateError } = await supabase
            .from('linkedin_user_tasks')
            .update({
              status: 'VERIFIED',
              score_awarded: selectedAssignment.career_task_templates.points_reward,
              updated_at: new Date().toISOString()
            })
            .eq('id', assignmentId);

          if (updateError) throw updateError;

          // Call the LinkedIn verification function
          const { data, error: verifyError } = await supabase.functions.invoke('verify-linkedin-tasks', {
            body: { period: selectedAssignment._originalLinkedInTask?.period }
          });

          if (verifyError) throw verifyError;

          toast.success(`LinkedIn assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
        } else {
          // Deny LinkedIn assignment - reset to STARTED so user can resubmit
          const { error: updateError } = await supabase
            .from('linkedin_user_tasks')
            .update({
              status: 'STARTED',
              score_awarded: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', assignmentId);

          if (updateError) throw updateError;

          toast.success('LinkedIn assignment rejected. User can now resubmit.');
        }
      } else {
        // Handle regular career assignments
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
          const pointsToAward = selectedAssignment.career_task_templates.points_reward;
          const today = new Date().toISOString().split('T')[0];
          const pointsData = {
            user_id: selectedAssignment.user_id,
            activity_type: 'career_task_completion',
            activity_id: `career_task_${selectedAssignment.template_id}`,
            points_earned: pointsToAward,
            activity_date: today
          };

          const { error: pointsError } = await supabase
            .from('user_activity_points')
            .insert([pointsData]);

          if (pointsError) {
            console.error('Error awarding points:', pointsError);
          }

          toast.success(`Assignment approved and ${pointsToAward} points awarded!`);
        } else {
          // Deny the assignment
          const { error: updateError } = await supabase
            .from('career_task_assignments')
            .update({
              status: 'submitted', // Keep as submitted so user can see feedback
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

          toast.success('Assignment rejected with feedback provided.');
        }
      }

      // Refresh the assignments list
      await fetchSubmittedAssignments();
      if (isAdmin) {
        await fetchVerifiedAssignments();
      }
      
      // Close the dialog
      setSelectedAssignment(null);
      setVerificationNotes('');
      
    } catch (error) {
      console.error('Error processing assignment:', error);
      toast.error('Failed to process assignment');
    } finally {
      setProcessing(false);
    }
  };

  // Pagination logic
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

  const paginatedVerifiedAssignments = filteredVerifiedAssignments.slice(
    (verifiedCurrentPage - 1) * itemsPerPage,
    verifiedCurrentPage * itemsPerPage
  );

  const verifiedTotalPages = Math.ceil(filteredVerifiedAssignments.length / itemsPerPage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verify Assignments</h1>
          <p className="text-muted-foreground">Review and verify submitted assignments</p>
        </div>
        <div className="flex gap-3">
          <AdminReenableRequestsDialog />
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {filteredAssignments.length} Pending
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Review ({filteredAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({filteredVerifiedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filters for Pending Assignments */}
          <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-4 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students or tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueModules.map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pending Assignments List */}
          {loadingAssignments ? (
            <div className="text-center py-8">Loading assignments...</div>
          ) : paginatedAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending assignments found.
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedAssignments.map((assignment) => (
                  <Card key={assignment.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.profiles.profile_image_url} />
                            <AvatarFallback>
                              {assignment.profiles.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{assignment.profiles.full_name}</h3>
                            <p className="text-sm text-muted-foreground">@{assignment.profiles.username}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium">{assignment.career_task_templates.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {assignment.career_task_templates.sub_categories?.name || 
                               assignment.career_task_templates.module || 
                               assignment.career_task_templates.category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Submitted {format(new Date(assignment.submitted_at), 'MMM dd, yyyy hh:mm a')}
                            </span>
                          </div>
                        </div>

                        {assignment.evidence && assignment.evidence.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {assignment.evidence.length} evidence submission{assignment.evidence.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{assignment.career_task_templates.points_reward}</span>
                        </div>
                        <Button
                          onClick={() => setSelectedAssignment(assignment)}
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination for Pending */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {/* Similar structure for verified assignments - simplified for brevity */}
          {verifiedAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No verified assignments found.
            </div>
          ) : (
            <div className="text-center py-4">
              {verifiedAssignments.length} verified assignments found.
            </div>
          )}
        </TabsContent>
      </Tabs>

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
              <EvidenceDisplay evidence={selectedAssignment.evidence} />

              {/* Verification Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Verification Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Enter any verification notes..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleVerifyAssignment(selectedAssignment.id, 'approve')}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Approve & Award Points'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerifyAssignment(selectedAssignment.id, 'deny')}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Deny'}
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