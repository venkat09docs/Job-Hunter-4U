import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useInstituteAdminManagement } from '@/hooks/useInstituteAdminManagement';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CheckCircle, XCircle, Clock, User, Calendar, Award, ArrowLeft, Building2 } from 'lucide-react';
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
  const { isAdmin, isInstituteAdmin, isRecruiter, loading: roleLoading } = useRole();
  const { 
    managedInstitutes, 
    primaryInstitute, 
    isValidInstituteAdmin, 
    loading: instituteLoading
  } = useInstituteAdminManagement();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [scoreAwarded, setScoreAwarded] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [verifiedCurrentPage, setVerifiedCurrentPage] = useState(1);
  
  const VERIFIED_PAGE_SIZE = 10;

  // Optimized data fetching function
  const fetchAssignmentsOptimized = async () => {
    if (!user) throw new Error('User not authenticated');
    
    // Fetch all assignment types in parallel with optimized queries
    const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = await Promise.all([
      supabase
        .from('career_task_assignments')
        .select(`
          id, user_id, template_id, status, submitted_at, verified_at, points_earned, score_awarded,
          career_task_templates!career_task_assignments_template_id_fkey (
            id, title, module, points_reward, category
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false }),

      supabase
        .from('linkedin_user_tasks')
        .select(`*, linkedin_tasks (id, code, title, description, points_base)`)
        .eq('status', 'SUBMITTED')
        .order('updated_at', { ascending: false }),

      supabase
        .from('job_hunting_assignments')
        .select(`*, template:job_hunting_task_templates (id, title, description, points_reward, category)`)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false }),

      supabase
        .from('github_user_tasks')
        .select(`*, github_tasks (id, code, title, description, points_base)`)
        .eq('status', 'SUBMITTED')
        .order('updated_at', { ascending: false })
    ]);

    // Collect all unique user IDs and fetch profiles in one query
    const allUserIds = new Set([
      ...(careerResult.data || []).map(a => a.user_id),
      ...(linkedInResult.data || []).map(a => a.user_id),
      ...(jobHuntingResult.data || []).map(a => a.user_id),
      ...(gitHubResult.data || []).map(a => a.user_id)
    ]);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', Array.from(allUserIds));

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Batch fetch evidence for better performance
    const evidencePromises = [
      careerResult.data?.length ? supabase
        .from('career_task_evidence')
        .select('assignment_id, *')
        .in('assignment_id', careerResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      linkedInResult.data?.length ? supabase
        .from('linkedin_evidence')
        .select('user_task_id, *')
        .in('user_task_id', linkedInResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      jobHuntingResult.data?.length ? supabase
        .from('job_hunting_evidence')
        .select('assignment_id, *')
        .in('assignment_id', jobHuntingResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      gitHubResult.data?.length ? supabase
        .from('github_evidence')
        .select('user_task_id, *')
        .in('user_task_id', gitHubResult.data.map(a => a.id)) : Promise.resolve({ data: [] })
    ];

    const [careerEvidence, linkedInEvidence, jobHuntingEvidence, gitHubEvidence] = await Promise.all(evidencePromises);

    // Create evidence maps for efficient lookup
    const evidenceMaps = {
      career: new Map(),
      linkedin: new Map(),
      jobHunting: new Map(),
      github: new Map()
    };

    (careerEvidence.data || []).forEach(e => {
      if (!evidenceMaps.career.has(e.assignment_id)) evidenceMaps.career.set(e.assignment_id, []);
      evidenceMaps.career.get(e.assignment_id).push(e);
    });

    (linkedInEvidence.data || []).forEach(e => {
      if (!evidenceMaps.linkedin.has(e.user_task_id)) evidenceMaps.linkedin.set(e.user_task_id, []);
      evidenceMaps.linkedin.get(e.user_task_id).push(e);
    });

    (jobHuntingEvidence.data || []).forEach(e => {
      if (!evidenceMaps.jobHunting.has(e.assignment_id)) evidenceMaps.jobHunting.set(e.assignment_id, []);
      evidenceMaps.jobHunting.get(e.assignment_id).push(e);
    });

    (gitHubEvidence.data || []).forEach(e => {
      if (!evidenceMaps.github.has(e.user_task_id)) evidenceMaps.github.set(e.user_task_id, []);
      evidenceMaps.github.get(e.user_task_id).push(e);
    });

    // Process all assignments efficiently
    const allAssignments: Assignment[] = [];

    // Process each type with evidence mapping
    (careerResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.career.get(assignment.id) || []
      });
    });

    (linkedInResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        career_task_templates: {
          title: assignment.linkedin_tasks?.title || 'LinkedIn Task',
          module: 'LINKEDIN',
          points_reward: assignment.linkedin_tasks?.points_base || 0,
          category: 'LinkedIn Growth Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.linkedin.get(assignment.id) || [],
        _isLinkedInAssignment: true
      });
    });

    (jobHuntingResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.jobHunting.get(assignment.id) || [],
        career_task_templates: {
          title: assignment.template?.title || 'Job Hunting Task',
          module: 'JOB_HUNTING',
          points_reward: assignment.template?.points_reward || 0,
          category: 'Job Hunting Activities'
        }
      });
    });

    (gitHubResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        career_task_templates: {
          title: assignment.github_tasks?.title || 'GitHub Task',
          module: 'GITHUB',
          points_reward: assignment.github_tasks?.points_base || 0,
          category: 'GitHub Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.github.get(assignment.id) || []
      });
    });

    return allAssignments;
  };

  // Check if user can access this page
  const canAccess = user && !roleLoading && (isAdmin || isInstituteAdmin || isRecruiter) && 
                   (!isInstituteAdmin || !instituteLoading);

  // Query for pending assignments with React Query for better performance
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['assignments', 'pending', user?.id],
    queryFn: fetchAssignmentsOptimized,
    enabled: canAccess,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // Apply filters with memoization
  const filteredAssignments = useMemo(() => {
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

    return filtered;
  }, [assignments, moduleFilter, userFilter]);

  const pendingAssignments = useMemo(() => 
    filteredAssignments.filter(assignment => assignment.status === 'submitted'),
    [filteredAssignments]
  );

  // Mutation for verifying assignments
  const verifyAssignmentMutation = useMutation({
    mutationFn: async ({ action, assignment }: { action: 'approve' | 'reject', assignment: Assignment }) => {
      const response = await supabase.functions.invoke('verify-institute-assignments', {
        body: {
          assignmentId: assignment.id,
          assignmentType: assignment._isLinkedInAssignment ? 'linkedin' : 
                         assignment.career_task_templates?.module === 'GITHUB' ? 'github' :
                         assignment.career_task_templates?.module === 'JOB_HUNTING' ? 'job_hunting' : 'career',
          action,
          scoreAwarded: parseInt(scoreAwarded) || 0,
          verificationNotes
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Assignment processed successfully');
      setIsReviewDialogOpen(false);
      setSelectedAssignment(null);
      setVerificationNotes('');
      setScoreAwarded('');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error) => {
      console.error('Error verifying assignment:', error);
      toast.error('Failed to process assignment');
    }
  });

  const handleReview = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsReviewDialogOpen(true);
    setVerificationNotes('');
    setScoreAwarded(assignment.career_task_templates?.points_reward?.toString() || '');
  };

  const handleVerifyAssignment = async (action: 'approve' | 'reject') => {
    if (!selectedAssignment) return;
    verifyAssignmentMutation.mutate({ action, assignment: selectedAssignment });
  };

  // Render functions
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModuleBadge = (module?: string) => {
    if (!module) return null;
    
    const colors = {
      'RESUME': 'bg-blue-100 text-blue-800',
      'LINKEDIN': 'bg-green-100 text-green-800',
      'GITHUB': 'bg-purple-100 text-purple-800',
      'JOB_HUNTING': 'bg-orange-100 text-orange-800',
      'DIGITAL_PROFILE': 'bg-pink-100 text-pink-800'
    };
    
    return (
      <Badge variant="secondary" className={colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {module.replace('_', ' ')}
      </Badge>
    );
  };

  const renderAssignmentCard = (assignment: Assignment) => (
    <Card key={assignment.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{assignment.career_task_templates?.title}</CardTitle>
          <div className="flex items-center gap-2">
            {getModuleBadge(assignment.career_task_templates?.module)}
            {getStatusBadge(assignment.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{assignment.profiles?.full_name || 'Unknown User'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(assignment.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{assignment.career_task_templates?.points_reward || 0} points</span>
            </div>
          </div>
          
          {assignment.evidence && assignment.evidence.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Evidence: </span>
              <span className="text-muted-foreground">{assignment.evidence.length} item(s) submitted</span>
            </div>
          )}
          
          {assignment.status === 'submitted' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => handleReview(assignment)}
                size="sm"
                variant="outline"
              >
                Review Assignment
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Loading and error states
  if (roleLoading || instituteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isInstituteAdmin && !isRecruiter)) {
    navigate('/dashboard');
    return null;
  }

  if (isInstituteAdmin && !isValidInstituteAdmin) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Institute Access Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be assigned to an institute to access assignment verification.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Assignments</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading assignments. Please try again.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['assignments'] })} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Verify Assignments</h1>
          {isInstituteAdmin && primaryInstitute && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Managing: <strong>{primaryInstitute.name}</strong></span>
            </div>
          )}
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="moduleFilter">Filter by Module</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="resume">Resume</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="job_hunting">Job Hunting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="userFilter">Filter by User</Label>
          <Input
            id="userFilter"
            placeholder="Enter username or full name..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Assignments ({pendingAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Assignments</h3>
              <p className="text-muted-foreground">
                All assignments have been processed or there are no assignments to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map(renderAssignmentCard)}
            </div>
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Title:</strong> {selectedAssignment.career_task_templates?.title}</div>
                <div><strong>Student:</strong> {selectedAssignment.profiles?.full_name}</div>
                <div><strong>Module:</strong> {selectedAssignment.career_task_templates?.module}</div>
                <div><strong>Points:</strong> {selectedAssignment.career_task_templates?.points_reward}</div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="score">Score to Award</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={selectedAssignment.career_task_templates?.points_reward}
                    value={scoreAwarded}
                    onChange={(e) => setScoreAwarded(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any feedback..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleVerifyAssignment('approve')}
                    disabled={verifyAssignmentMutation.isPending}
                    className="flex-1"
                  >
                    {verifyAssignmentMutation.isPending ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleVerifyAssignment('reject')}
                    disabled={verifyAssignmentMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {verifyAssignmentMutation.isPending ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;