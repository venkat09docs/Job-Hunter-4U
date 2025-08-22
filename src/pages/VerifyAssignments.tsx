import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Calendar, User, Award, FileText, Clock, Filter, Search, ChevronLeft, ChevronRight, History, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Navigate, useNavigate } from 'react-router-dom';

interface SubmittedAssignment {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
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
  const { isAdmin, isRecruiter, isInstituteAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<SubmittedAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<SubmittedAssignment[]>([]);
  const [verifiedAssignments, setVerifiedAssignments] = useState<SubmittedAssignment[]>([]);
  const [filteredVerifiedAssignments, setFilteredVerifiedAssignments] = useState<SubmittedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<SubmittedAssignment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filter and pagination states for pending assignments
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter and pagination states for verified assignments
  const [verifiedSearchTerm, setVerifiedSearchTerm] = useState('');
  const [verifiedModuleFilter, setVerifiedModuleFilter] = useState('all');
  const [verifiedUserFilter, setVerifiedUserFilter] = useState('all');
  const [verifiedCurrentPage, setVerifiedCurrentPage] = useState(1);

  // Calculate pagination for pending assignments
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  // Calculate pagination for verified assignments
  const verifiedTotalPages = Math.ceil(filteredVerifiedAssignments.length / itemsPerPage);
  const verifiedStartIndex = (verifiedCurrentPage - 1) * itemsPerPage;
  const verifiedEndIndex = verifiedStartIndex + itemsPerPage;
  const currentVerifiedAssignments = filteredVerifiedAssignments.slice(verifiedStartIndex, verifiedEndIndex);

  // Check authorization
  if (!roleLoading && !isAdmin && !isRecruiter && !isInstituteAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (user && (isAdmin || isRecruiter || isInstituteAdmin)) {
      fetchSubmittedAssignments();
      fetchVerifiedAssignments();
    }
  }, [user, isAdmin, isRecruiter, isInstituteAdmin]);

  const fetchVerifiedAssignments = async () => {
    try {
      // If institute admin, filter by their institute's students
      if (isInstituteAdmin && !isAdmin) {
        console.log('Fetching verified assignments for institute admin:', user?.id);
        
        // First get the institute(s) this admin manages
        const { data: institutes, error: instituteError } = await supabase
          .from('institute_admin_assignments')
          .select('institute_id')
          .eq('user_id', user?.id)
          .eq('is_active', true);

        console.log('Institute admin assignments (verified):', institutes);

        if (instituteError) {
          console.error('Error fetching institute assignments (verified):', instituteError);
          throw instituteError;
        }

        if (institutes && institutes.length > 0) {
          const instituteIds = institutes.map(i => i.institute_id);
          console.log('Institute IDs managed (verified):', instituteIds);
          
          // Get students assigned to these institutes
          const { data: studentAssignments, error: studentsError } = await supabase
            .from('user_assignments')
            .select('user_id')
            .in('institute_id', instituteIds)
            .eq('is_active', true);

          console.log('Student assignments found (verified):', studentAssignments);

          if (studentsError) {
            console.error('Error fetching student assignments (verified):', studentsError);
            throw studentsError;
          }

          if (studentAssignments && studentAssignments.length > 0) {
            const studentIds = studentAssignments.map(s => s.user_id);
            console.log('Student IDs (verified):', studentIds);
            
            // Fetch verified assignments for these students
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
                  category
                )
              `)
              .eq('status', 'verified')
              .in('user_id', studentIds)
              .order('verified_at', { ascending: false });

            console.log('Verified assignments found:', data);

            if (error) throw error;

            // Continue with the rest of the logic
            await processVerifiedAssignments(data || []);
          } else {
            console.log('No students found for this institute admin (verified)');
            setVerifiedAssignments([]);
          }
        } else {
          console.log('No institutes managed by this admin (verified)');
          setVerifiedAssignments([]);
        }
      } else {
        // For super admins and recruiters, fetch all verified assignments
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
          .eq('assignment_id', assignment.id);

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
      filtered = filtered.filter(assignment => assignment.career_task_templates.module === moduleFilter);
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
      filtered = filtered.filter(assignment => assignment.career_task_templates.module === verifiedModuleFilter);
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
      setLoading(true);
      
      // If institute admin, filter by their institute's students
      if (isInstituteAdmin && !isAdmin) {
        console.log('Fetching assignments for institute admin:', user?.id);
        
        // First get the institute(s) this admin manages
        const { data: institutes, error: instituteError } = await supabase
          .from('institute_admin_assignments')
          .select('institute_id')
          .eq('user_id', user?.id)
          .eq('is_active', true);

        console.log('Institute admin assignments:', institutes);

        if (instituteError) {
          console.error('Error fetching institute assignments:', instituteError);
          throw instituteError;
        }

        if (institutes && institutes.length > 0) {
          const instituteIds = institutes.map(i => i.institute_id);
          console.log('Institute IDs managed:', instituteIds);
          
          // Get students assigned to these institutes
          const { data: studentAssignments, error: studentsError } = await supabase
            .from('user_assignments')
            .select('user_id')
            .in('institute_id', instituteIds)
            .eq('is_active', true);

          console.log('Student assignments found:', studentAssignments);

          if (studentsError) {
            console.error('Error fetching student assignments:', studentsError);
            throw studentsError;
          }

          if (studentAssignments && studentAssignments.length > 0) {
            const studentIds = studentAssignments.map(s => s.user_id);
            console.log('Student IDs:', studentIds);
            
            // Fetch submitted assignments for these students
            console.log('Querying career_task_assignments with studentIds:', studentIds);
            
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
                  category
                )
              `)
              .eq('status', 'submitted')
              .in('user_id', studentIds)
              .order('submitted_at', { ascending: false });

            console.log('Query result - data:', data);
            console.log('Query result - error:', error);
            console.log('Submitted assignments found:', data);
            
            // Debug: Check what modules we're getting
            if (data) {
              console.log('🔍 Modules found in assignments:', data.map(d => d.career_task_templates?.module).filter(Boolean));
              console.log('🔍 First assignment template:', data[0]?.career_task_templates);
            }

            if (error) throw error;

            // Continue with the rest of the logic
            await processAssignments(data || []);
          } else {
            console.log('No students found for this institute admin');
            setAssignments([]);
          }
        } else {
          console.log('No institutes managed by this admin');
          setAssignments([]);
        }
      } else {
        // For super admins and recruiters, fetch all assignments
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
        await processAssignments(data || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
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

        console.log('🔍 Evidence for assignment', assignment.id, ':', evidenceData);
        return { ...assignment, evidence: evidenceData || [] };
      })
    );

    console.log('🔍 Final assignments with evidence:', assignmentsWithEvidence);
    setAssignments(assignmentsWithEvidence);
  };

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
  const uniqueModules = [...new Set(assignments.map(assignment => assignment.career_task_templates.module))];

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
  const uniqueVerifiedModules = [...new Set(verifiedAssignments.map(assignment => assignment.career_task_templates.module))];

  const handleVerifyAssignment = async (assignmentId: string, action: 'approve' | 'deny') => {
    if (!selectedAssignment) return;
    
    console.log('🔍 Selected assignment for verification:', selectedAssignment);
    console.log('🔍 Evidence to display:', selectedAssignment.evidence);

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

        console.log('🔍 About to award points for assignment:', selectedAssignment.id);
        console.log('🔍 User ID:', selectedAssignment.user_id);
        console.log('🔍 Points to award:', selectedAssignment.career_task_templates.points_reward);
        console.log('🔍 Current user (auth.uid()):', supabase.auth.getUser().then(u => console.log('Current user:', u.data.user?.id)));

        // Award points to user
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_activity_points')
          .insert({
            user_id: selectedAssignment.user_id,
            activity_type: 'career_assignment',
            activity_id: selectedAssignment.id, // Use assignment ID instead of template ID to avoid unique constraint issues
            points_earned: selectedAssignment.career_task_templates.points_reward,
            activity_date: new Date().toISOString().split('T')[0]
          })
          .select();

        console.log('🔍 Points insertion result:', { pointsData, pointsError });

        if (pointsError) {
          console.error('❌ Error awarding points:', pointsError);
          console.error('❌ Points error details:', JSON.stringify(pointsError, null, 2));
          // Don't throw error here - assignment verification should still succeed
          toast.error(`Assignment approved but failed to award points: ${pointsError.message}`);
        } else {
          // Points were successfully awarded
          console.log('✅ Points successfully awarded to user:', selectedAssignment.user_id, 'Points:', selectedAssignment.career_task_templates.points_reward);
          console.log('✅ Inserted points data:', pointsData);
          
          toast.success(`Assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded to user!`);
        }
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
      fetchSubmittedAssignments(); // Refresh pending assignments
      fetchVerifiedAssignments(); // Refresh verified assignments
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
    <div>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Verify Assignments</h1>
              <p className="text-muted-foreground mt-2">
                Review and verify user submitted assignments
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {filteredAssignments.length} Pending
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {verifiedAssignments.length} Verified
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Reviews ({filteredAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Verified Assignments ({filteredVerifiedAssignments.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Reviews Tab */}
          <TabsContent value="pending" className="space-y-6">
            {/* Filters Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search users or tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Module</Label>
                    <Select value={moduleFilter} onValueChange={setModuleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {uniqueModules.map(module => (
                          <SelectItem key={module} value={module}>{module}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uniqueUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSearchTerm('');
                        setModuleFilter('all');
                        setUserFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredAssignments.length === 0 ? (
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
              <>
                <div className="grid gap-6">
                  {currentAssignments.map((assignment) => (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredAssignments.length)} of {filteredAssignments.length} assignments
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
                      
                      <div className="flex items-center gap-1">
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

          {/* Verified Assignments Tab */}
          <TabsContent value="verified" className="space-y-6">
            {/* Filters Section for Verified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search - Verified Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="verified-search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verified-search"
                        placeholder="Search users or tasks..."
                        value={verifiedSearchTerm}
                        onChange={(e) => setVerifiedSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Module</Label>
                    <Select value={verifiedModuleFilter} onValueChange={setVerifiedModuleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Modules" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        {uniqueVerifiedModules.map(module => (
                          <SelectItem key={module} value={module}>{module}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={verifiedUserFilter} onValueChange={setVerifiedUserFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uniqueVerifiedUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} (@{user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setVerifiedSearchTerm('');
                        setVerifiedModuleFilter('all');
                        setVerifiedUserFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredVerifiedAssignments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Verified Assignments</h3>
                  <p className="text-muted-foreground">
                    No assignments have been verified yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6">
                  {currentVerifiedAssignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow border-green-200">
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
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <Badge 
                              className={`${getModuleBadgeColor(assignment.career_task_templates.module)} text-white`}
                            >
                              {assignment.career_task_templates.module}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Award className="h-4 w-4" />
                              <span>{assignment.points_earned} pts awarded</span>
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
                                Verified {assignment.verified_at ? format(new Date(assignment.verified_at), 'PPp') : 'N/A'}
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
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination for Verified */}
                {verifiedTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Showing {verifiedStartIndex + 1}-{Math.min(verifiedEndIndex, filteredVerifiedAssignments.length)} of {filteredVerifiedAssignments.length} verified assignments
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVerifiedCurrentPage(Math.max(1, verifiedCurrentPage - 1))}
                        disabled={verifiedCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, verifiedTotalPages) }, (_, i) => {
                          let pageNum;
                          if (verifiedTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (verifiedCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (verifiedCurrentPage >= verifiedTotalPages - 2) {
                            pageNum = verifiedTotalPages - 4 + i;
                          } else {
                            pageNum = verifiedCurrentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={verifiedCurrentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setVerifiedCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVerifiedCurrentPage(Math.min(verifiedTotalPages, verifiedCurrentPage + 1))}
                        disabled={verifiedCurrentPage === verifiedTotalPages}
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
        </Tabs>
      </div>

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
                          <Label className="text-xs text-muted-foreground">Description & Details:</Label>
                          {typeof evidence.evidence_data === 'object' ? (
                            <div className="mt-1 space-y-2">
                              {evidence.evidence_data.description && (
                                <div>
                                  <Label className="text-xs font-medium">Description:</Label>
                                  <p className="text-sm bg-muted p-2 rounded mt-1">
                                    {evidence.evidence_data.description}
                                  </p>
                                </div>
                              )}
                              {evidence.evidence_data.notes && (
                                <div>
                                  <Label className="text-xs font-medium">Notes:</Label>
                                  <p className="text-sm bg-muted p-2 rounded mt-1">
                                    {evidence.evidence_data.notes}
                                  </p>
                                </div>
                              )}
                              {evidence.evidence_data.linkedinUrl && (
                                <div>
                                  <Label className="text-xs font-medium">LinkedIn URL:</Label>
                                  <a 
                                    href={evidence.evidence_data.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block text-sm"
                                  >
                                    {evidence.evidence_data.linkedinUrl}
                                  </a>
                                </div>
                              )}
                              {evidence.evidence_data.githubUrl && (
                                <div>
                                  <Label className="text-xs font-medium">GitHub URL:</Label>
                                  <a 
                                    href={evidence.evidence_data.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline block text-sm"
                                  >
                                    {evidence.evidence_data.githubUrl}
                                  </a>
                                </div>
                              )}
                              {Object.keys(evidence.evidence_data).length > 0 && 
                               !evidence.evidence_data.description && 
                               !evidence.evidence_data.notes && 
                               !evidence.evidence_data.linkedinUrl && 
                               !evidence.evidence_data.githubUrl && (
                                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                                  {JSON.stringify(evidence.evidence_data, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm bg-muted p-2 rounded mt-1">
                              {String(evidence.evidence_data)}
                            </p>
                          )}
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