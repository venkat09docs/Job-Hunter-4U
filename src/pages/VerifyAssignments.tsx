import { useState, useEffect, useMemo } from 'react';
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
    loading: instituteLoading,
    error: instituteError
  } = useInstituteAdminManagement();
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

  // Pagination states for verified assignments
  const [verifiedCurrentPage, setVerifiedCurrentPage] = useState(1);
  const [verifiedTotalCount, setVerifiedTotalCount] = useState(0);
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [paginatedVerifiedAssignments, setPaginatedVerifiedAssignments] = useState<Assignment[]>([]);
  
  const VERIFIED_PAGE_SIZE = 10;

  // Compute pending assignments (these are not paginated)
  const pendingAssignments = useMemo(() => 
    filteredAssignments.filter(assignment => assignment.status === 'submitted'),
    [filteredAssignments]
  );

  // For verified assignments, we'll use separate pagination logic
  const totalVerifiedPages = Math.ceil(verifiedTotalCount / VERIFIED_PAGE_SIZE);

  const fetchSubmittedAssignments = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Debug current user state
      console.log('🔍 Fetching assignments for user:', {
        userId: user.id,
        isAdmin,
        isInstituteAdmin, 
        isRecruiter,
        userEmail: user.email,
        userRole: isAdmin ? 'admin' : isInstituteAdmin ? 'institute_admin' : isRecruiter ? 'recruiter' : 'unknown',
        managedInstitutes: managedInstitutes?.map(i => ({ id: i.id, name: i.name })),
        primaryInstitute: primaryInstitute?.name
      });

      // For institute admins, ensure they have valid institute assignments
      if (isInstituteAdmin && !isValidInstituteAdmin) {
        console.warn('⚠️ Institute admin without valid assignments, skipping fetch');
        setAssignments([]);
        return;
      }

      // Fetch different types of assignments in parallel - RLS will filter based on user role
      // For pending assignments, fetch all. For verified, we'll fetch separately with pagination
      const promises = [
        // Career assignments - only pending for now
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
            career_task_templates!career_task_assignments_template_id_fkey (
              id,
              title,
              module,
              points_reward,
              category
            )
          `)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false }),

        // LinkedIn assignments - only pending for now
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
            )
          `)
          .eq('status', 'SUBMITTED')
          .order('updated_at', { ascending: false }),

        // Job hunting assignments - only pending for now
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

        // GitHub assignments - only pending for now
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
      
      const careerData = careerResult.data || [];
      const linkedInData = linkedInResult.data || [];
      const jobHuntingData = jobHuntingResult.data || [];
      const gitHubData = gitHubResult.data || [];

      
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

      // Log results for debugging
      console.log('📊 Assignment fetch results:', {
        careerCount: careerData?.length || 0,
        linkedInCount: linkedInData?.length || 0, 
        jobHuntingCount: jobHuntingData?.length || 0,
        gitHubCount: gitHubData?.length || 0,
        careerAssignments: careerData?.map(a => ({ id: a.id, userId: a.user_id })),
        jobHuntingAssignments: jobHuntingData?.map(a => ({ id: a.id, userId: a.user_id })),
        linkedInAssignments: linkedInData?.map(a => ({ id: a.id, userId: a.user_id })),
        gitHubAssignments: gitHubData?.map(a => ({ id: a.id, userId: a.user_id }))
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

      // Set assignments and log final count
      console.log('✅ Final assignments loaded:', {
        totalAssignments: allAssignments.length,
        byModule: allAssignments.reduce((acc, assignment) => {
          const module = assignment.career_task_templates?.module || 'unknown';
          acc[module] = (acc[module] || 0) + 1;
          return acc;
        }, {}),
        userIds: [...new Set(allAssignments.map(a => a.user_id))]
      });
      
      // Only set pending assignments, verified will be fetched separately
      setAssignments(allAssignments);
      
      // Fetch verified assignments count for pagination
      await fetchVerifiedAssignmentsCount();
      
    } catch (error) {
      console.error('Error in fetchSubmittedAssignments:', error);
      toast.error('Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedAssignmentsCount = async () => {
    if (!user) return;
    
    try {
      // Count verified assignments across all tables
      const countPromises = [
        supabase
          .from('career_task_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'verified'),
        supabase
          .from('linkedin_user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'VERIFIED'),
        supabase
          .from('job_hunting_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'verified'),
        supabase
          .from('github_user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'VERIFIED')
      ];

      const [careerCount, linkedInCount, jobHuntingCount, gitHubCount] = await Promise.all(countPromises);
      
      const totalCount = (careerCount.count || 0) + (linkedInCount.count || 0) + 
                        (jobHuntingCount.count || 0) + (gitHubCount.count || 0);
      
      setVerifiedTotalCount(totalCount);
      
      // Fetch first page if we haven't already
      if (verifiedCurrentPage === 1) {
        await fetchVerifiedAssignments(1);
      }
    } catch (error) {
      console.error('Error fetching verified assignments count:', error);
    }
  };

  const fetchVerifiedAssignments = async (page: number) => {
    if (!user) return;
    
    setVerifiedLoading(true);
    
    try {
      // Fetch more records from each table to ensure we have enough for proper pagination
      // We'll combine all results, sort them, and then slice to get exact page size
      const fetchSize = Math.max(VERIFIED_PAGE_SIZE * 2, 50); // Fetch enough to cover page needs
      
      // Fetch verified assignments without individual pagination - we'll handle it after combining
      const promises = [
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
            career_task_templates!career_task_assignments_template_id_fkey (
              id,
              title,
              module,
              points_reward,
              category
            )
          `)
          .eq('status', 'verified')
          .order('verified_at', { ascending: false })
          .limit(fetchSize),

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
            )
          `)
          .eq('status', 'VERIFIED')
          .order('updated_at', { ascending: false })
          .limit(fetchSize),

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
          .eq('status', 'verified')
          .order('verified_at', { ascending: false })
          .limit(fetchSize),

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
          .eq('status', 'VERIFIED')
          .order('updated_at', { ascending: false })
          .limit(fetchSize)
      ];

      const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = await Promise.all(promises);
      
      const careerData = careerResult.data || [];
      const linkedInData = linkedInResult.data || [];
      const jobHuntingData = jobHuntingResult.data || [];
      const gitHubData = gitHubResult.data || [];
      
      const verifiedAssignments = [];

      // Process career assignments (same logic as before)
      if (careerData && careerData.length > 0) {
        const userIds = careerData.map(assignment => assignment.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        const assignmentsWithEvidence = await Promise.all(
          careerData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            const { data: evidenceData } = await supabase
              .from('career_task_evidence')
              .select('*')
              .eq('assignment_id', assignment.id)
              .order('created_at', { ascending: false });

            return { ...assignment, profiles: profile, evidence: evidenceData || [] };
          })
        );

        verifiedAssignments.push(...assignmentsWithEvidence);
      }

      // Process other assignment types (similar logic as in main fetch)
      // LinkedIn assignments
      if (linkedInData && linkedInData.length > 0) {
        const userIds = [...new Set(linkedInData.map(task => task.user_id).filter(Boolean))];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, profile_image_url')
            .in('user_id', userIds);
          profilesData = profiles || [];
        }

        const linkedInAssignmentsWithEvidence = await Promise.all(
          linkedInData.map(async assignment => {
            const userId = assignment.user_id;
            const profile = profilesData?.find(p => p.user_id === userId);
            
            let evidenceData: any[] = [];
            try {
              const { data: evidence } = await supabase
                .from('linkedin_evidence')
                .select('*')
                .eq('user_task_id', assignment.id)
                .order('created_at', { ascending: false });
              evidenceData = evidence || [];
            } catch (error) {
              console.error('LinkedIn evidence fetch exception for task', assignment.id, ':', error);
            }
            
            return {
              id: assignment.id,
              user_id: userId,
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

        verifiedAssignments.push(...linkedInAssignmentsWithEvidence);
      }

      // Job hunting assignments
      if (jobHuntingData && jobHuntingData.length > 0) {
        const userIds = jobHuntingData.map(assignment => assignment.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        const assignmentsWithEvidence = await Promise.all(
          jobHuntingData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            const { data: evidenceData } = await supabase
              .from('job_hunting_evidence')
              .select('*')
              .eq('assignment_id', assignment.id)
              .order('created_at', { ascending: false });

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

        verifiedAssignments.push(...assignmentsWithEvidence);
      }

      // GitHub assignments
      if (gitHubData && gitHubData.length > 0) {
        const userIds = gitHubData.map(task => task.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, profile_image_url')
          .in('user_id', userIds);

        const assignmentsWithEvidence = await Promise.all(
          gitHubData.map(async (assignment) => {
            const profile = profilesData?.find(p => p.user_id === assignment.user_id);
            
            const { data: evidenceData } = await supabase
              .from('github_evidence')
              .select('*')
              .eq('user_task_id', assignment.id)
              .order('created_at', { ascending: false });

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

        verifiedAssignments.push(...assignmentsWithEvidence);
      }

      // After combining all assignments, sort by verified_at date and paginate properly
      const allCombinedAssignments = verifiedAssignments.sort((a, b) => {
        const dateA = new Date(a.verified_at || a.submitted_at || '').getTime();
        const dateB = new Date(b.verified_at || b.submitted_at || '').getTime();
        return dateB - dateA; // Most recent first
      });
      
      // Calculate proper pagination
      const offset = (page - 1) * VERIFIED_PAGE_SIZE;
      const paginatedResults = allCombinedAssignments.slice(offset, offset + VERIFIED_PAGE_SIZE);
      
      setPaginatedVerifiedAssignments(paginatedResults);
      setVerifiedCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching verified assignments:', error);
      toast.error('Failed to load verified assignments');
    } finally {
      setVerifiedLoading(false);
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
    // Only fetch when user is authenticated and role is loaded
    if (user && !roleLoading && (isAdmin || isInstituteAdmin || isRecruiter)) {
      // For institute admins, wait for institute data to load
      if (isInstituteAdmin && instituteLoading) {
        return;
      }
      fetchSubmittedAssignments();
    }
  }, [user, roleLoading, isAdmin, isInstituteAdmin, isRecruiter, instituteLoading, isValidInstituteAdmin]);

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
      
      // Determine assignment type
      let assignmentType = 'career';
      if (selectedAssignment._isLinkedInAssignment) {
        assignmentType = 'linkedin';
      } else if (selectedAssignment.career_task_templates?.module === 'JOB_HUNTING') {
        assignmentType = 'job_hunting';
      } else if (selectedAssignment.career_task_templates?.module === 'GITHUB') {
        assignmentType = 'github';
      }

      console.log('🔄 Verifying assignment via edge function:', {
        assignmentId: selectedAssignment.id,
        assignmentType,
        action,
        points
      });

      // Call the secure verification edge function
      const { data, error } = await supabase.functions.invoke('verify-institute-assignments', {
        body: {
          assignmentId: selectedAssignment.id,
          assignmentType,
          action,
          verificationNotes,
          scoreAwarded: points
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      console.log('✅ Assignment verification successful:', data.message);
      toast.success(data.message);

      // Refresh assignments to show updated data
      await fetchSubmittedAssignments();
      setIsReviewDialogOpen(false);
      setSelectedAssignment(null);
      
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      toast.error(error.message || 'Failed to verify assignment');
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
            onClick={() => {
              if (isAdmin || isInstituteAdmin) {
                navigate('/admin');
              } else if (isRecruiter) {
                navigate('/recruiter');
              } else {
                navigate('/dashboard');
              }
            }} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to - Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verify Assignments</h1>
            {isInstituteAdmin && primaryInstitute && (
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Managing: <strong>{primaryInstitute.name}</strong> ({primaryInstitute.code})</span>
              </div>
            )}
          </div>
        </div>
        {loading || verifiedLoading ? (
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Button 
            onClick={() => {
              setVerifiedCurrentPage(1);
              setPaginatedVerifiedAssignments([]);
              fetchSubmittedAssignments();
            }} 
            variant="outline"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Show institute admin error or warning messages */}
      {isInstituteAdmin && instituteError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Institute Access Error</p>
                <p className="text-sm">{instituteError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isInstituteAdmin && !instituteLoading && !instituteError && !isValidInstituteAdmin && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">No Institute Assignments Found</p>
                <p className="text-sm">You are not currently assigned to manage any institutes. Please contact your administrator.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            Verified ({verifiedTotalCount})
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
          {verifiedLoading || loading ? (
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
          ) : verifiedTotalCount === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No verified assignments</p>
              <p className="text-sm">Verified assignments will appear here.</p>
            </div>
          ) : (
            <>
              {paginatedVerifiedAssignments.map(renderAssignmentCard)}
              
              {/* Pagination for verified assignments */}
              {totalVerifiedPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => verifiedCurrentPage > 1 && fetchVerifiedAssignments(verifiedCurrentPage - 1)}
                          className={verifiedCurrentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalVerifiedPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => fetchVerifiedAssignments(page)}
                            isActive={page === verifiedCurrentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => verifiedCurrentPage < totalVerifiedPages && fetchVerifiedAssignments(verifiedCurrentPage + 1)}
                          className={verifiedCurrentPage >= totalVerifiedPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              
              {/* Results info */}
              <div className="text-center text-sm text-gray-500 mt-4">
                Showing {((verifiedCurrentPage - 1) * VERIFIED_PAGE_SIZE) + 1} to {Math.min(verifiedCurrentPage * VERIFIED_PAGE_SIZE, verifiedTotalCount)} of {verifiedTotalCount} verified assignments
              </div>
            </>
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