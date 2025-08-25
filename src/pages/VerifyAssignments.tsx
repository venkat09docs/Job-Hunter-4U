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

  // All state hooks - must be called unconditionally
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

  // All useEffect hooks - must be called unconditionally
  useEffect(() => {
    if (!loading && (isAdmin || isInstituteAdmin || isRecruiter)) {
      fetchSubmittedAssignments();
      fetchVerifiedAssignments();
    }
  }, [user?.id, isAdmin, isInstituteAdmin, loading]);

  useEffect(() => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.profiles.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.career_task_templates.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.career_task_templates.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const displayModule = assignment.career_task_templates.sub_categories?.name || 
                              assignment.career_task_templates.module || 
                              assignment.career_task_templates.category || 
                              'GENERAL';
        return displayModule === moduleFilter;
      });
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === userFilter);
    }

    setFilteredAssignments(filtered);
    setCurrentPage(1);
  }, [assignments, searchTerm, moduleFilter, userFilter]);

  useEffect(() => {
    let filtered = verifiedAssignments;

    if (verifiedSearchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.profiles.full_name.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.profiles.username.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.career_task_templates.title.toLowerCase().includes(verifiedSearchTerm.toLowerCase()) ||
        assignment.career_task_templates.category.toLowerCase().includes(verifiedSearchTerm.toLowerCase())
      );
    }

    if (verifiedModuleFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        const displayModule = assignment.career_task_templates.sub_categories?.name || 
                              assignment.career_task_templates.module || 
                              assignment.career_task_templates.category || 
                              'GENERAL';
        return displayModule === verifiedModuleFilter;
      });
    }

    if (verifiedUserFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === verifiedUserFilter);
    }

    setFilteredVerifiedAssignments(filtered);
    setVerifiedCurrentPage(1);
  }, [verifiedAssignments, verifiedSearchTerm, verifiedModuleFilter, verifiedUserFilter]);

  // Function definitions
  const fetchVerifiedAssignments = async () => {
    try {
      if (isAdmin) {
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
    if (!data || data.length === 0) {
      setVerifiedAssignments([]);
      return;
    }

    const userIds = data.map(assignment => assignment.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    const assignmentsWithProfiles = data.map(assignment => {
      const profile = profilesData?.find(p => p.user_id === assignment.user_id);
      return {
        ...assignment,
        profiles: profile || { full_name: 'Unknown', username: 'unknown', profile_image_url: '' }
      };
    });

    const assignmentsWithEvidence = await Promise.all(
      assignmentsWithProfiles.map(async (assignment) => {
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('career_task_evidence')
          .select('id, assignment_id, evidence_type, evidence_data, url, file_urls, verification_status, created_at, submitted_at, verification_notes, verified_at, verified_by, kind, email_meta, parsed_json')
          .eq('assignment_id', assignment.id)
          .order('created_at', { ascending: false });

        if (evidenceError) {
          console.error('Error fetching evidence:', evidenceError);
        }

        return { ...assignment, evidence: evidenceData || [] };
      })
    );

    setVerifiedAssignments(assignmentsWithEvidence);
  };

  const fetchCareerAssignments = async () => {
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
  };

  const processAssignments = async (data: any[]) => {
    if (!data || data.length === 0) {
      setAssignments([]);
      return;
    }

    const userIds = data.map(assignment => assignment.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    const assignmentsWithProfiles = data.map(assignment => {
      const profile = profilesData?.find(p => p.user_id === assignment.user_id);
      return {
        ...assignment,
        profiles: profile || { full_name: 'Unknown', username: 'unknown', profile_image_url: '' }
      };
    });

    const assignmentsWithEvidence = await Promise.all(
      assignmentsWithProfiles.map(async (assignment) => {
        const { data: evidenceData, error: evidenceError } = await supabase
          .from('career_task_evidence')
          .select('id, assignment_id, evidence_type, evidence_data, url, file_urls, verification_status, created_at, submitted_at, verification_notes, verified_at, verified_by, kind, email_meta, parsed_json')
          .eq('assignment_id', assignment.id)
          .order('created_at', { ascending: false });

        if (evidenceError) {
          console.error('Error fetching evidence:', evidenceError);
        }

        return { ...assignment, evidence: evidenceData || [] };
      })
    );

    setAssignments(assignmentsWithEvidence);
  };

  const fetchSubmittedAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const assignments = await fetchCareerAssignments();
      await processAssignments(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleVerifyAssignment = async (assignment: SubmittedAssignment, approved: boolean) => {
    if (!selectedAssignment) return;

    setProcessing(true);
    
    try {
      console.log('🔍 Processing assignment:', { approved, selectedAssignment: selectedAssignment.id });
      
      const updateData: any = {
        status: approved ? 'verified' : 'rejected',
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        verification_notes: verificationNotes || ''
      };

      if (approved) {
        updateData.points_earned = selectedAssignment.career_task_templates.points_reward;
        updateData.score_awarded = selectedAssignment.career_task_templates.points_reward;
      } else {
        // For rejected assignments, set points to 0
        updateData.points_earned = 0;
        updateData.score_awarded = 0;
      }

      console.log('🔍 Update data:', updateData);

      const { error } = await supabase
        .from('career_task_assignments')
        .update(updateData)
        .eq('id', selectedAssignment.id);

      if (error) {
        console.error('🔍 Database update error:', error);
        throw error;
      }

      console.log('🔍 Assignment updated successfully');

      // If approved, add points to user_activity_points table
      if (approved) {
        console.log('🔍 Adding points to user_activity_points');
        const { error: pointsError } = await supabase
          .from('user_activity_points')
          .insert({
            user_id: selectedAssignment.user_id,
            activity_id: selectedAssignment.id,
            activity_type: 'career_task_completion',
            points_earned: selectedAssignment.career_task_templates.points_reward,
            activity_date: new Date().toISOString().split('T')[0]
          });

        if (pointsError) {
          console.error('🔍 Error adding points:', pointsError);
          // Still show success for assignment approval, but log the points error
          toast.success(`Assignment approved successfully, but there was an issue recording points`);
        } else {
          console.log('🔍 Points added successfully');
          toast.success(`Assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
        }
      } else {
        console.log('🔍 Assignment rejected successfully');
        toast.success(`Assignment rejected successfully`);
      }
      
      console.log('🔍 Refreshing assignment lists');
      if (isAdmin) {
        await fetchVerifiedAssignments();
      }
      await fetchSubmittedAssignments();
      
      setSelectedAssignment(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('🔍 Complete error details:', error);
      console.error('🔍 Error message:', error.message);
      console.error('🔍 Error stack:', error.stack);
      toast.error(`Failed to process assignment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Computed values
  const uniqueUsers = Array.from(
    new Map(
      assignments.map(assignment => [
        assignment.user_id,
        { id: assignment.user_id, name: assignment.profiles.full_name, username: assignment.profiles.username }
      ])
    ).values()
  );

  const uniqueVerifiedUsers = Array.from(
    new Map(
      verifiedAssignments.map(assignment => [
        assignment.user_id,
        { id: assignment.user_id, name: assignment.profiles.full_name, username: assignment.profiles.username }
      ])
    ).values()
  );

  const uniqueModules = Array.from(
    new Set(
      assignments.map(assignment => {
        return assignment.career_task_templates.sub_categories?.name || 
               assignment.career_task_templates.module || 
               assignment.career_task_templates.category || 
               'GENERAL';
      })
    )
  );

  const uniqueVerifiedModules = Array.from(
    new Set(
      verifiedAssignments.map(assignment => {
        return assignment.career_task_templates.sub_categories?.name || 
               assignment.career_task_templates.module || 
               assignment.career_task_templates.category || 
               'GENERAL';
      })
    )
  );

  const totalPendingPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  const totalVerifiedPages = Math.ceil(filteredVerifiedAssignments.length / itemsPerPage);
  const verifiedStartIndex = (verifiedCurrentPage - 1) * itemsPerPage;
  const verifiedEndIndex = verifiedStartIndex + itemsPerPage;
  const currentVerifiedAssignments = filteredVerifiedAssignments.slice(verifiedStartIndex, verifiedEndIndex);

  // Early returns after all hooks are called
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin && !isInstituteAdmin && !isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verify Assignments</h1>
            <p className="text-muted-foreground mt-2">
              Review and verify submitted assignments from students
            </p>
          </div>
        </div>
        {isAdmin && <AdminReenableRequestsDialog />}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filteredAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({filteredVerifiedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, username, or task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name} ({user.username})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingAssignments ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {currentAssignments.map((assignment) => (
                  <Card key={assignment.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={assignment.profiles.profile_image_url} 
                            alt={assignment.profiles.full_name} 
                          />
                          <AvatarFallback>
                            {assignment.profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {assignment.career_task_templates.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {assignment.career_task_templates.sub_categories?.name || 
                               assignment.career_task_templates.module || 
                               assignment.career_task_templates.category || 'GENERAL'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Submitted by: {assignment.profiles.full_name} (@{assignment.profiles.username})
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {assignment.career_task_templates.sub_categories?.name || 
                               assignment.career_task_templates.module || 
                               assignment.career_task_templates.category || 'GENERAL'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              {assignment.career_task_templates.points_reward} points
                            </span>
                            <span>
                              Submitted: {format(new Date(assignment.submitted_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setSelectedAssignment(assignment)}
                        size="sm"
                      >
                        Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPendingPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAssignments.length)} of {filteredAssignments.length} assignments
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPendingPages) }, (_, i) => {
                        const pageNum = i + 1;
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
                      onClick={() => setCurrentPage(Math.min(totalPendingPages, currentPage + 1))}
                      disabled={currentPage === totalPendingPages}
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
          {verifiedAssignments.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No verified assignments yet.</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {currentVerifiedAssignments.map((assignment) => (
                  <Card key={assignment.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={assignment.profiles.profile_image_url} 
                            alt={assignment.profiles.full_name} 
                          />
                          <AvatarFallback>
                            {assignment.profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {assignment.profiles.full_name}
                            </h3>
                            <Badge variant="outline">
                              @{assignment.profiles.username}
                            </Badge>
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {assignment.career_task_templates.title}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Verified: {assignment.verified_at ? format(new Date(assignment.verified_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              {assignment.points_earned || assignment.career_task_templates.points_reward} points earned
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedAssignment(assignment)}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Review Assignment: {selectedAssignment?.career_task_templates.title}
            </DialogTitle>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline">
                {selectedAssignment?.career_task_templates.sub_categories?.name || 
                 selectedAssignment?.career_task_templates.module || 
                 selectedAssignment?.career_task_templates.category || 'GENERAL'}
              </Badge>
              <Badge variant="secondary">
                {selectedAssignment?.career_task_templates.points_reward} points
              </Badge>
            </div>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={selectedAssignment.profiles.profile_image_url} 
                    alt={selectedAssignment.profiles.full_name} 
                  />
                  <AvatarFallback>
                    {selectedAssignment.profiles.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedAssignment.profiles.full_name}
                  </h3>
                  <p className="text-muted-foreground">
                    @{selectedAssignment.profiles.username}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {selectedAssignment.career_task_templates.sub_categories?.name || 
                       selectedAssignment.career_task_templates.module || 
                       selectedAssignment.career_task_templates.category || 'GENERAL'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Assignment Information</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {selectedAssignment.career_task_templates.points_reward} points
                    </span>
                    <span>
                      Submitted: {format(new Date(selectedAssignment.submitted_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Category:</strong> {selectedAssignment.career_task_templates.category}
                  </div>
                  {selectedAssignment.career_task_templates.sub_categories?.name && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Sub-category:</strong> {selectedAssignment.career_task_templates.sub_categories.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Submitted Evidence</h4>
                <EvidenceDisplay evidence={selectedAssignment.evidence} />
              </div>

              {selectedAssignment.status === 'submitted' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
                    <Textarea
                      id="verification-notes"
                      placeholder="Add any notes about this verification..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAssignment(null)}
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleVerifyAssignment(selectedAssignment, false)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleVerifyAssignment(selectedAssignment, true)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;