import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, User, Calendar, Award, ArrowLeft } from 'lucide-react';
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
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [scoreAwarded, setScoreAwarded] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Filter states
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');

  // Compute pending and verified assignments
  const pendingAssignments = useMemo(() => 
    filteredAssignments.filter(assignment => assignment.status === 'submitted'),
    [filteredAssignments]
  );

  const verifiedAssignments = useMemo(() => 
    filteredAssignments.filter(assignment => assignment.status === 'verified'),
    [filteredAssignments]
  );

  const fetchSubmittedAssignments = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch all assignment types
      
      // First, check if user is institute admin and get their institute assignments
      console.log('🔍 Fetching user assignments for institute filtering...');
      const { data: userAssignments, error: userAssignmentsError } = await supabase
        .from('user_assignments')
        .select('user_id, institute_id')
        .eq('is_active', true);
      
      if (userAssignmentsError) {
        console.error('Error fetching user assignments:', userAssignmentsError);
        throw userAssignmentsError;
      }

      const { data: instituteAdminAssignments, error: adminError } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (adminError) {
        console.error('Error fetching institute admin assignments:', adminError);
        throw adminError;
      }

      // Filter users based on institute admin access
      let allowedUserIds: string[] = [];
      let isGlobalAdmin = false;
      
      // Check if current user has admin role (super admin)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      } else {
        isGlobalAdmin = userRoles?.some(ur => ur.role === 'admin') || false;
      }
      
      if (isGlobalAdmin) {
        // Super admin - show all assignments, get all user IDs from profiles
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('user_id');
        allowedUserIds = allProfiles?.map(p => p.user_id) || [];
      } else if (instituteAdminAssignments && instituteAdminAssignments.length > 0) {
        // Institute admin - only show their institute's students
        const adminInstituteIds = instituteAdminAssignments.map(ia => ia.institute_id);
        const filteredUsers = userAssignments?.filter(ua => adminInstituteIds.includes(ua.institute_id)) || [];
        allowedUserIds = filteredUsers.map(ua => ua.user_id);
      } else {
        // Not an admin or institute admin - no access
        allowedUserIds = [];
      }
      
      if (allowedUserIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      
      // Fetch different types of assignments in parallel
      const promises = [
        // Career assignments with explicit foreign key relationship
        ...(allowedUserIds.length > 0 ? [supabase
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
            career_task_templates!career_task_assignments_template_id_fkey (
              id,
              title,
              module,
              points_reward,
              category
            )
          `)
          .in('status', ['submitted', 'verified'])
          .in('user_id', allowedUserIds)
          .order('submitted_at', { ascending: false })] : [Promise.resolve({ data: [], error: null })]),

        // LinkedIn assignments (filtered by allowed users)
        ...(allowedUserIds.length > 0 ? [supabase
          .from('linkedin_user_tasks')
          .select(`
            *,
            linkedin_tasks (
              id,
              code,
              title,
              description,
              points_base
            )
          `)
          .in('status', ['SUBMITTED', 'VERIFIED'])
          .in('user_id', allowedUserIds)
          .order('updated_at', { ascending: false })] : [Promise.resolve({ data: [], error: null })]),

        // Job hunting assignments (filtered by allowed users)
        ...(allowedUserIds.length > 0 ? [supabase
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
          .in('status', ['submitted', 'verified'])
          .in('user_id', allowedUserIds)
          .order('submitted_at', { ascending: false })] : [Promise.resolve({ data: [], error: null })]),

        // GitHub assignments (filtered by allowed users)
        ...(allowedUserIds.length > 0 ? [supabase
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
          .in('status', ['SUBMITTED', 'VERIFIED'])
          .in('user_id', allowedUserIds)
          .order('updated_at', { ascending: false })] : [Promise.resolve({ data: [], error: null })])
      ];

      const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = await Promise.all(promises);
      
      // Handle errors
      if (careerResult.error) {
        console.error('Career assignments error:', careerResult.error);
        toast.error('Failed to load career assignments');
      }
      if (linkedInResult.error) {
        console.error('LinkedIn assignments error:', linkedInResult.error);
        toast.error('Failed to load LinkedIn assignments');
      }
      if (jobHuntingResult.error) {
        console.error('Job hunting assignments error:', jobHuntingResult.error);
        toast.error('Failed to load job hunting assignments');
      }
      if (gitHubResult.error) {
        console.error('GitHub assignments error:', gitHubResult.error);
        toast.error('Failed to load GitHub assignments');
      }

      const careerData = careerResult.data || [];
      const linkedInData = linkedInResult.data || [];
      const jobHuntingData = jobHuntingResult.data || [];
      const gitHubData = gitHubResult.data || [];

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
        // Get user_ids for profile lookup - use user_id directly from linkedin_user_tasks
        const userIds = [...new Set(linkedInData.map(task => task.user_id).filter(Boolean))];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, profile_image_url')
            .in('user_id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles for LinkedIn assignments:', profilesError);
          } else {
            profilesData = profiles || [];
          }
        }

        const linkedInAssignmentsWithEvidence = await Promise.all(
          linkedInData.map(async assignment => {
            // Use user_id directly from the linkedin_user_tasks table
            const userId = assignment.user_id;
            const profile = profilesData?.find(p => p.user_id === userId);
            
            // Fetch LinkedIn evidence for this specific task
            let evidenceData: any[] = [];
            try {
              const { data: evidence, error: evidenceError } = await supabase
                .from('linkedin_evidence')
                .select('*')
                .eq('user_task_id', assignment.id)
                .order('created_at', { ascending: false });

              if (evidenceError) {
                console.error('LinkedIn evidence fetch error for task', assignment.id, ':', evidenceError);
              } else {
                evidenceData = evidence || [];
              }
            } catch (error) {
              console.error('LinkedIn evidence fetch exception for task', assignment.id, ':', error);
            }
            
            return {
              id: assignment.id,
              user_id: userId, // Use user_id directly from linkedin_user_tasks
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
                full_name: assignment.linkedin_users?.name || `[Missing User: ${userId?.slice(0, 8)}...]`, 
                username: assignment.linkedin_users?.email?.split('@')[0] || `missing_${userId?.slice(0, 8)}`, 
                profile_image_url: '' 
              },
              evidence: evidenceData,
              _isLinkedInAssignment: true,
              _originalLinkedInTask: assignment
            };
          })
        );

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

      // Set assignments
      setAssignments(allAssignments);
      
    } catch (error) {
      console.error('Error in fetchSubmittedAssignments:', error);
      toast.error('Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = assignments;

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
  }, [assignments, moduleFilter, userFilter]);

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
      } else if (selectedAssignment.career_task_templates?.module === 'GITHUB') {
        // Handle GitHub assignment verification
        const gitHubStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
        const { error } = await supabase
          .from('github_user_tasks')
          .update({
            status: gitHubStatus,
            score_awarded: points,
            updated_at: new Date().toISOString(),
            verification_notes: verificationNotes
          })
          .eq('id', selectedAssignment.id);

        if (error) throw error;

        // Award points to user for GitHub task completion if approved
        if (action === 'approve' && points > 0) {
          const { error: pointsError } = await supabase
            .from('user_activity_points')
            .insert({
              user_id: selectedAssignment.user_id,
              activity_id: 'github_task_completion',
              activity_type: 'github_task',
              points_earned: points,
              activity_date: new Date().toISOString().split('T')[0]
            });

          if (pointsError) {
            console.error('Error awarding points:', pointsError);
            // Don't throw here, just log the error as the main verification was successful
          }
        }
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

  const renderAssignmentCard = (assignment: Assignment) => (
    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {assignment.career_task_templates?.title || 'Untitled Assignment'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{assignment.profiles?.full_name || 'Unknown User'}</span>
              <span className="text-gray-400">(@{assignment.profiles?.username || 'unknown'})</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(assignment.status)}
            {getModuleBadge(assignment.career_task_templates?.module)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {assignment.status === 'verified' ? 'Verified' : 'Submitted'}: {' '}
              {new Date(assignment.verified_at || assignment.submitted_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-400" />
            <span>
              {assignment.status === 'verified' ? 'Points Awarded' : 'Max Points'}: {' '}
              {assignment.status === 'verified' 
                ? (assignment.score_awarded || assignment.points_earned || 0) 
                : (assignment.career_task_templates?.points_reward || 0)
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Evidence Items: {assignment.evidence?.length || 0}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={() => handleReview(assignment)}
            variant="outline"
            size="sm"
          >
            {assignment.status === 'verified' ? 'View Details' : 'Review'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/admin')} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to - Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Verify Assignments</h1>
        </div>
        {loading ? (
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Button onClick={fetchSubmittedAssignments} variant="outline">
            Refresh
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Label htmlFor="module-filter">Module:</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="career">Career</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="job_hunting">Job Hunting</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="user-filter">User:</Label>
          <Input
            id="user-filter"
            placeholder="Search by name..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Tabs for Pending and Verified */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({verifiedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No pending assignments</p>
              <p className="text-sm">Submitted assignments will appear here for review.</p>
            </div>
          ) : (
            pendingAssignments.map(renderAssignmentCard)
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : verifiedAssignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No verified assignments</p>
              <p className="text-sm">Verified assignments will appear here.</p>
            </div>
          ) : (
            verifiedAssignments.map(renderAssignmentCard)
          )}
        </TabsContent>
      </Tabs>

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

              {/* Verification Form - Only show for non-verified assignments */}
              {selectedAssignment.status !== 'verified' && (
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
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;