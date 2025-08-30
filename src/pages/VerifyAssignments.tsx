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
  _isJobHuntingAssignment?: boolean;
  _originalJobHuntingTask?: any;
  _isGitHubAssignment?: boolean;
  _originalGitHubTask?: any;
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
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [verifiedSearchTerm, setVerifiedSearchTerm] = useState('');
  const [verifiedModuleFilter, setVerifiedModuleFilter] = useState('all');
  const [verifiedSubcategoryFilter, setVerifiedSubcategoryFilter] = useState('all');
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
  }, [user?.id, isAdmin, isInstituteAdmin, isRecruiter, loading]);

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

    if (subcategoryFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        return getAssignmentSubcategory(assignment) === subcategoryFilter;
      });
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === userFilter);
    }

    setFilteredAssignments(filtered);
    setCurrentPage(1);
  }, [assignments, searchTerm, moduleFilter, subcategoryFilter, userFilter]);

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

    if (verifiedSubcategoryFilter !== 'all') {
      filtered = filtered.filter(assignment => {
        return getAssignmentSubcategory(assignment) === verifiedSubcategoryFilter;
      });
    }

    if (verifiedUserFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.user_id === verifiedUserFilter);
    }

    setFilteredVerifiedAssignments(filtered);
    setVerifiedCurrentPage(1);
  }, [verifiedAssignments, verifiedSearchTerm, verifiedModuleFilter, verifiedSubcategoryFilter, verifiedUserFilter]);

  // Function to map assignment to subcategory
  const getAssignmentSubcategory = (assignment: SubmittedAssignment) => {
    // Handle LinkedIn assignments
    if (assignment._isLinkedInAssignment) {
      return 'LinkedIn growth activities based';
    }
    
    // Handle Job Hunting assignments
    if (assignment._isJobHuntingAssignment) {
      return 'Job hunting based';
    }
    
    // Handle GitHub assignments (Daily digital profile)
    if (assignment._isGitHubAssignment) {
      return 'Daily digital profile based';
    }
    
    // Handle career task assignments based on module/category
    const module = assignment.career_task_templates.module?.toLowerCase() || 
                  assignment.career_task_templates.category?.toLowerCase() || '';
    
    if (module.includes('resume') || module === 'RESUME') {
      return 'Resume based';
    }
    
    if (module.includes('linkedin') || module.includes('profile')) {
      return 'LinkedIn profile based';
    }
    
    if (module.includes('github') || module.includes('digital')) {
      return 'Daily digital profile based';
    }
    
    // Default fallback
    return 'Resume based';
  };

  // Available subcategories
  const subcategoryOptions = [
    'Resume based',
    'LinkedIn profile based', 
    'Daily digital profile based',
    'LinkedIn growth activities based',
    'Job hunting based'
  ];
  const fetchVerifiedAssignments = async () => {
    try {
      if (isAdmin || isRecruiter) {
        // Fetch verified assignments from all sources to match recruiter dashboard count
        const [careerVerifiedData, linkedInVerifiedData, jobHuntingVerifiedData, gitHubVerifiedData] = await Promise.all([
          // 1. Career task assignments (verified)
          supabase
            .from('career_task_assignments')
            .select(`
              *,
              career_task_templates!career_task_assignments_template_id_fkey (
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
            .order('verified_at', { ascending: false }),

          // 2. LinkedIn user tasks (VERIFIED)
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
            .eq('status', 'VERIFIED')
            .order('updated_at', { ascending: false }),

          // 3. Job hunting assignments (verified)
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
            .order('verified_at', { ascending: false }),

          // 4. GitHub user tasks (VERIFIED)
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
        ]);

        // Check for errors
        if (careerVerifiedData.error) throw careerVerifiedData.error;
        if (linkedInVerifiedData.error) throw linkedInVerifiedData.error;
        if (jobHuntingVerifiedData.error) throw jobHuntingVerifiedData.error;
        if (gitHubVerifiedData.error) throw gitHubVerifiedData.error;

        // Process all verified assignments together
        await processVerifiedAssignments(
          careerVerifiedData.data || [], 
          linkedInVerifiedData.data || [], 
          jobHuntingVerifiedData.data || [], 
          gitHubVerifiedData.data || []
        );
      }
    } catch (error) {
      console.error('Error fetching verified assignments:', error);
      toast.error('Failed to load verified assignments');
    }
  };

  const processVerifiedAssignments = async (careerData: any[], linkedInData: any[], jobHuntingData: any[], gitHubData: any[]) => {
    const allVerifiedAssignments = [];

    // Process career task assignments
    if (careerData && careerData.length > 0) {
      const userIds = careerData.map(assignment => assignment.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const assignmentsWithProfiles = careerData.map(assignment => {
        const profile = profilesData?.find(p => p.user_id === assignment.user_id);
        return {
          ...assignment,
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          _assignmentType: 'career_task'
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

      allVerifiedAssignments.push(...assignmentsWithEvidence);
    }

    // Process LinkedIn assignments (similar structure to pending assignments)
    if (linkedInData && linkedInData.length > 0) {
      const authUids = [...new Set(linkedInData.map(task => task.linkedin_users?.auth_uid).filter(Boolean))];
      let profilesData: any[] = [];
      
      if (authUids.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, profile_image_url')
          .in('user_id', authUids);
        
        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      const combinedLinkedInData = linkedInData.map(task => ({
        ...task,
        user_profile: profilesData.find(p => p.user_id === task.linkedin_users?.auth_uid),
        _assignmentType: 'linkedin_task',
        // Map LinkedIn task structure to match career task structure
        career_task_templates: {
          title: task.linkedin_tasks?.title || 'LinkedIn Task',
          module: 'LINKEDIN',
          category: 'LinkedIn Growth',
          points_reward: task.linkedin_tasks?.points_base || 0,
          sub_categories: { name: 'LinkedIn growth activities based' }
        },
        profiles: profilesData.find(p => p.user_id === task.linkedin_users?.auth_uid) || {
          full_name: task.linkedin_users?.name || '[Missing User]',
          username: task.linkedin_users?.email?.split('@')[0] || 'missing_user',
          profile_image_url: ''
        },
        evidence: [] // LinkedIn tasks don't have evidence like career tasks
      }));

      allVerifiedAssignments.push(...combinedLinkedInData);
    }

    // Process Job Hunting assignments (similar structure)
    if (jobHuntingData && jobHuntingData.length > 0) {
      const userIds = jobHuntingData.map(assignment => assignment.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const combinedJobHuntingData = jobHuntingData.map(assignment => {
        const profile = profilesData?.find(p => p.user_id === assignment.user_id);
        return {
          ...assignment,
          _assignmentType: 'job_hunting',
          career_task_templates: {
            title: assignment.template?.title || 'Job Hunting Task',
            module: 'JOB_HUNTING',
            category: assignment.template?.category || 'Job Hunting',
            points_reward: assignment.template?.points_reward || 0,
            sub_categories: { name: 'Job hunting based' }
          },
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          evidence: []
        };
      });

      allVerifiedAssignments.push(...combinedJobHuntingData);
    }

    // Process GitHub assignments (similar structure)
    if (gitHubData && gitHubData.length > 0) {
      const userIds = gitHubData.map(task => task.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const gitHubAssignmentsWithProfiles = gitHubData.map(task => {
        const profile = profilesData?.find(p => p.user_id === task.user_id);
        return {
          ...task,
          _assignmentType: 'github_task',
          career_task_templates: {
            title: task.github_tasks?.title || 'GitHub Task',
            module: 'GITHUB',
            category: 'GitHub Repository',
            points_reward: task.github_tasks?.points_base || 0,
            sub_categories: { name: 'Daily digital profile based' }
          },
          profiles: profile || {
            full_name: `[Missing User: ${task.user_id.slice(0, 8)}...]`, 
            username: `missing_${task.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          evidence: [],
          _originalGitHubTask: task
        };
      });

      // Fetch GitHub evidence for these verified assignments
      const gitHubAssignmentsWithEvidence = await Promise.all(
        gitHubAssignmentsWithProfiles.map(async (assignment) => {
          try {
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('github_evidence')
              .select('*')
              .eq('user_task_id', assignment._originalGitHubTask.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('Error fetching GitHub evidence for verified assignment:', assignment.id, evidenceError);
              return { ...assignment, evidence: [] };
            }

            // Transform GitHub evidence to match career evidence structure
            const transformedEvidence = (evidenceData || []).map(evidence => ({
              id: evidence.id,
              assignment_id: assignment.id,
              evidence_type: evidence.kind?.toLowerCase() || 'url',
              evidence_data: evidence.parsed_json || {},
              url: evidence.url,
              file_urls: evidence.file_key ? [`/storage/v1/object/public/github-evidence/${evidence.file_key}`] : null,
              verification_status: 'approved',
              created_at: evidence.created_at,
              submitted_at: evidence.created_at,
              verification_notes: null,
              verified_at: assignment.verified_at,
              verified_by: assignment.verified_by,
              kind: evidence.kind,
              parsed_json: evidence.parsed_json
            }));

            return { ...assignment, evidence: transformedEvidence };
          } catch (error) {
            console.error('Error processing GitHub evidence for verified assignment:', assignment.id, error);
            return { ...assignment, evidence: [] };
          }
        })
      );

      allVerifiedAssignments.push(...gitHubAssignmentsWithEvidence);
    }

    // Sort all verified assignments by verified_at or updated_at
    allVerifiedAssignments.sort((a, b) => {
      const dateA = new Date(a.verified_at || a.updated_at || a.created_at);
      const dateB = new Date(b.verified_at || b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    setVerifiedAssignments(allVerifiedAssignments);
  };

  const fetchCareerAssignments = async () => {
    const { data, error } = await supabase
      .from('career_task_assignments')
      .select(`
        *,
        career_task_templates!career_task_assignments_template_id_fkey (
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

  const fetchLinkedInAssignments = async () => {
    console.log('🔍 Fetching LinkedIn assignments...');
    
    // Fetch LinkedIn tasks with proper join through linkedin_users to get profiles
    const { data: linkedInTasks, error: linkedInError } = await supabase
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
      .order('updated_at', { ascending: false });

    if (linkedInError) {
      console.error('🔍 Error fetching LinkedIn tasks:', linkedInError);
      throw linkedInError;
    }

    console.log('🔍 LinkedIn tasks fetched:', linkedInTasks?.length || 0);

    // Get user profiles using auth_uid from linkedin_users
    const authUids = [...new Set(linkedInTasks?.map(task => task.linkedin_users?.auth_uid).filter(Boolean) || [])];
    let profilesData: any[] = [];
    
    console.log('🔍 Auth UIDs to fetch profiles for:', authUids);
    
    if (authUids.length > 0) {
      console.log('🔍 Fetching profiles for LinkedIn assignments via auth_uid...');

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, profile_image_url')
        .in('user_id', authUids);
      
      console.log('🔍 Profile fetch result for LinkedIn:', {
        profiles: profiles,
        error: profilesError,
        profileCount: profiles?.length || 0,
        authUids: authUids
      });
      
      if (profilesError) {
        console.error('❌ Error fetching profiles for LinkedIn tasks:', profilesError);
        console.error('❌ Full error object:', profilesError);
      } else {
        profilesData = profiles || [];
        console.log('🔍 Successfully fetched profiles:', profilesData);
      }
    }

    // Combine the data using auth_uid as the link
    const combinedData = linkedInTasks?.map(task => {
      const profile = profilesData.find(p => p.user_id === task.linkedin_users?.auth_uid);
      console.log(`🔍 Matching profile for auth_uid ${task.linkedin_users?.auth_uid}:`, profile);
      
      return {
        ...task,
        user_profile: profile
      };
    }) || [];

    console.log('🔍 Combined LinkedIn data with profiles:', combinedData.map(d => ({
      id: d.id,
      user_id: d.user_id,
      username: d.user_profile?.username,
      full_name: d.user_profile?.full_name,
      task_title: d.linkedin_tasks?.title,
      has_profile: !!d.user_profile
    })));
    
    return combinedData;
  };

  const fetchJobHuntingAssignments = async () => {
    console.log('🔍 Fetching Job Hunting assignments...');
    
    const { data: jobHuntingTasks, error: jobHuntingError } = await supabase
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
      .order('submitted_at', { ascending: false });

    if (jobHuntingError) {
      console.error('🔍 Error fetching Job Hunting assignments:', jobHuntingError);
      throw jobHuntingError;
    }

    // Get user profiles for the job hunting task user_ids
    const jobHuntingUserIds = jobHuntingTasks?.map(task => task.user_id) || [];
    let profilesData: any[] = [];
    
    console.log('🔍 Job Hunting user IDs to fetch profiles for:', jobHuntingUserIds);
    
    if (jobHuntingUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, profile_image_url')
        .in('user_id', jobHuntingUserIds);
      
      console.log('🔍 Profile fetch attempt result for Job Hunting:', {
        profiles: profiles,
        error: profilesError,
        profileCount: profiles?.length || 0
      });
      
      if (profilesError) {
        console.error('❌ Error fetching profiles for Job Hunting tasks:', profilesError);
      } else {
        profilesData = profiles || [];
        console.log('🔍 Successfully fetched profiles for Job Hunting tasks:', profilesData.length);
      }
    }

    // Combine the data
    const combinedData = jobHuntingTasks?.map(task => ({
      ...task,
      user_profile: profilesData.find(p => p.user_id === task.user_id)
    })) || [];

    console.log('🔍 Combined Job Hunting data with profiles:', combinedData.map(d => ({
      id: d.id,
      user_id: d.user_id,
      username: d.user_profile?.username,
      full_name: d.user_profile?.full_name,
      task_title: d.template?.title,
      has_profile: !!d.user_profile
    })));
    
    return combinedData;
  };

  const fetchGitHubAssignments = async () => {
    console.log('🔍 Fetching GitHub assignments...');
    
    const { data: gitHubTasks, error: gitHubError } = await supabase
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
      .order('updated_at', { ascending: false });

    if (gitHubError) {
      console.error('🔍 Error fetching GitHub assignments:', gitHubError);
      throw gitHubError;
    }

    // Get user profiles for the GitHub task user_ids
    const gitHubUserIds = gitHubTasks?.map(task => task.user_id) || [];
    let profilesData: any[] = [];
    
    console.log('🔍 GitHub user IDs to fetch profiles for:', gitHubUserIds);
    
    if (gitHubUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, profile_image_url')
        .in('user_id', gitHubUserIds);
      
      console.log('🔍 Profile fetch attempt result for GitHub:', {
        profiles: profiles,
        error: profilesError,
        profileCount: profiles?.length || 0
      });
      
      if (profilesError) {
        console.error('❌ Error fetching profiles for GitHub tasks:', profilesError);
      } else {
        profilesData = profiles || [];
        console.log('🔍 Successfully fetched profiles for GitHub tasks:', profilesData.length);
      }
    }

    // Combine the data
    const combinedData = gitHubTasks?.map(task => ({
      ...task,
      user_profile: profilesData.find(p => p.user_id === task.user_id)
    })) || [];

    console.log('🔍 Combined GitHub data with profiles:', combinedData.map(d => ({
      id: d.id,
      user_id: d.user_id,
      username: d.user_profile?.username,
      full_name: d.user_profile?.full_name,
      task_title: d.github_tasks?.title,
      has_profile: !!d.user_profile
    })));
    
    return combinedData;
  };

  const fetchSubmittedAssignments = async () => {
    try {
      setLoadingAssignments(true);
      
      // Fetch all types of assignments in parallel
      const [careerData, linkedInData, jobHuntingData, gitHubData] = await Promise.all([
        fetchCareerAssignments(),
        fetchLinkedInAssignments(),
        fetchJobHuntingAssignments(),
        fetchGitHubAssignments()
      ]);
      
      // Process all the data together
      await processAssignments(careerData, linkedInData, jobHuntingData, gitHubData);
      
    } catch (error) {
      console.error('Error fetching submitted assignments:', error);
      toast.error('Failed to load submitted assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const processAssignments = async (careerData: any[], linkedInData: any[], jobHuntingData: any[], gitHubData: any[]) => {
    console.log('🔍 Processing assignments:', { 
      careerDataLength: careerData?.length || 0, 
      linkedInDataLength: linkedInData?.length || 0,
      jobHuntingDataLength: jobHuntingData?.length || 0,
      gitHubDataLength: gitHubData?.length || 0
    });
    
    if ((!careerData || careerData.length === 0) && 
        (!linkedInData || linkedInData.length === 0) && 
        (!jobHuntingData || jobHuntingData.length === 0) &&
        (!gitHubData || gitHubData.length === 0)) {
      console.log('🔍 No assignments found, setting empty array');
      setAssignments([]);
      return;
    }

    const allAssignments = [];

    // Process career assignments
    if (careerData && careerData.length > 0) {
      const userIds = careerData.map(assignment => assignment.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, profile_image_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const assignmentsWithProfiles = careerData.map(assignment => {
        const profile = profilesData?.find(p => p.user_id === assignment.user_id);
        return {
          ...assignment,
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          }
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

      allAssignments.push(...assignmentsWithEvidence);
    }

    // Process LinkedIn assignments
    if (linkedInData && linkedInData.length > 0) {
      console.log('🔍 Processing LinkedIn assignments, count:', linkedInData.length);
      
      // Process each LinkedIn assignment with profile data
      const linkedInAssignmentsWithProfiles = linkedInData.map(assignment => {
        const profile = assignment.user_profile;
        
        console.log('🔍 Processing LinkedIn assignment:', {
          assignmentId: assignment.id,
          userId: assignment.user_id,
          profileFound: !!profile,
          profileData: profile ? { full_name: profile.full_name, username: profile.username } : null
        });
        
        return {
          id: assignment.id,
          user_id: assignment.linkedin_users?.auth_uid || assignment.user_id, // Use auth_uid for correct user identification
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
            category: 'LinkedIn Profile',
            sub_categories: { name: 'LinkedIn Profile' }
          },
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.linkedin_users?.auth_uid?.slice(0, 8) || assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.linkedin_users?.auth_uid?.slice(0, 8) || assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          evidence: [],
          _isLinkedInAssignment: true,
          _originalLinkedInTask: assignment
        };
      });

      console.log('🔍 LinkedIn assignments with profiles:', linkedInAssignmentsWithProfiles.length);

      // Fetch LinkedIn evidence for these assignments
      const linkedInAssignmentsWithEvidence = await Promise.all(
        linkedInAssignmentsWithProfiles.map(async (assignment) => {
          try {
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('linkedin_evidence')
              .select('*')
              .eq('user_task_id', assignment._originalLinkedInTask.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('🔍 Error fetching LinkedIn evidence for assignment:', assignment.id, evidenceError);
              return { ...assignment, evidence: [] };
            }

            // Transform LinkedIn evidence to match career evidence structure
            const transformedEvidence = (evidenceData || []).map(evidence => ({
              id: evidence.id,
              assignment_id: assignment.id,
              evidence_type: evidence.kind?.toLowerCase() || 'url',
              evidence_data: evidence.evidence_data || {},
              url: evidence.url,
              file_urls: evidence.file_key ? [`/storage/v1/object/public/linkedin-evidence/${evidence.file_key}`] : null,
              verification_status: 'pending',
              created_at: evidence.created_at,
              submitted_at: evidence.created_at,
              verification_notes: null,
              verified_at: null,
              verified_by: null,
              kind: evidence.kind,
              email_meta: evidence.email_meta,
              parsed_json: evidence.parsed_json
            }));

            return { ...assignment, evidence: transformedEvidence };
          } catch (error) {
            console.error('🔍 Error processing LinkedIn evidence for assignment:', assignment.id, error);
            return { ...assignment, evidence: [] };
          }
        })
      );

      console.log('🔍 LinkedIn assignments with evidence:', linkedInAssignmentsWithEvidence.length);
      allAssignments.push(...linkedInAssignmentsWithEvidence);
    }

    // Process Job Hunting assignments
    if (jobHuntingData && jobHuntingData.length > 0) {
      console.log('🔍 Processing Job Hunting assignments, count:', jobHuntingData.length);
      
      const jobHuntingAssignmentsWithProfiles = jobHuntingData.map(assignment => {
        const profile = assignment.user_profile;
        
        console.log('🔍 Processing Job Hunting assignment:', {
          assignmentId: assignment.id,
          userId: assignment.user_id,
          profileFound: !!profile,
          profileData: profile ? { full_name: profile.full_name, username: profile.username } : null
        });
        
        return {
          id: assignment.id,
          user_id: assignment.user_id,
          template_id: assignment.template_id,
          status: assignment.status,
          submitted_at: assignment.submitted_at,
          verified_at: assignment.verified_at,
          points_earned: assignment.points_earned,
          score_awarded: assignment.score_awarded,
          career_task_templates: {
            title: assignment.template?.title || 'Job Hunting Task',
            module: 'JOB_HUNTING',
            points_reward: assignment.template?.points_reward || 0,
            category: 'Job Hunting',
            sub_categories: { name: 'Job Hunting' }
          },
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          evidence: [],
          _isJobHuntingAssignment: true,
          _originalJobHuntingTask: assignment
        };
      });

      console.log('🔍 Job Hunting assignments with profiles:', jobHuntingAssignmentsWithProfiles.length);

      // Fetch Job Hunting evidence for these assignments
      const jobHuntingAssignmentsWithEvidence = await Promise.all(
        jobHuntingAssignmentsWithProfiles.map(async (assignment) => {
          try {
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('job_hunting_evidence')
              .select('*')
              .eq('assignment_id', assignment._originalJobHuntingTask.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('🔍 Error fetching Job Hunting evidence for assignment:', assignment.id, evidenceError);
              return { ...assignment, evidence: [] };
            }

            // Transform Job Hunting evidence to match career evidence structure
            const transformedEvidence = (evidenceData || []).map(evidence => ({
              id: evidence.id,
              assignment_id: assignment.id,
              evidence_type: evidence.evidence_type,
              evidence_data: evidence.evidence_data || {},
              url: (evidence.evidence_data as any)?.url,
              file_urls: evidence.file_urls,
              verification_status: evidence.verification_status,
              created_at: evidence.created_at,
              submitted_at: evidence.submitted_at,
              verification_notes: evidence.verification_notes,
              verified_at: evidence.verified_at,
              verified_by: evidence.verified_by
            }));

            return { ...assignment, evidence: transformedEvidence };
          } catch (error) {
            console.error('🔍 Error processing Job Hunting evidence for assignment:', assignment.id, error);
            return { ...assignment, evidence: [] };
          }
        })
      );

      console.log('🔍 Job Hunting assignments with evidence:', jobHuntingAssignmentsWithEvidence.length);
      allAssignments.push(...jobHuntingAssignmentsWithEvidence);
    }

    // Process GitHub assignments
    if (gitHubData && gitHubData.length > 0) {
      console.log('🔍 Processing GitHub assignments, count:', gitHubData.length);
      
      const gitHubAssignmentsWithProfiles = gitHubData.map(assignment => {
        const profile = assignment.user_profile;
        
        console.log('🔍 Processing GitHub assignment:', {
          assignmentId: assignment.id,
          userId: assignment.user_id,
          profileFound: !!profile,
          profileData: profile ? { full_name: profile.full_name, username: profile.username } : null
        });
        
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
            category: 'GitHub',
            sub_categories: { name: 'GitHub Weekly' }
          },
          profiles: profile || { 
            full_name: `[Missing User: ${assignment.user_id.slice(0, 8)}...]`, 
            username: `missing_${assignment.user_id.slice(0, 8)}`, 
            profile_image_url: '' 
          },
          evidence: [],
          _isGitHubAssignment: true,
          _originalGitHubTask: assignment
        };
      });

      console.log('🔍 GitHub assignments with profiles:', gitHubAssignmentsWithProfiles.length);

      // Fetch GitHub evidence for these assignments
      const gitHubAssignmentsWithEvidence = await Promise.all(
        gitHubAssignmentsWithProfiles.map(async (assignment) => {
          try {
            console.log('🔍 Fetching GitHub evidence for assignment:', assignment.id, 'original task:', assignment._originalGitHubTask.id);
            
            const { data: evidenceData, error: evidenceError } = await supabase
              .from('github_evidence')
              .select('*')
              .eq('user_task_id', assignment._originalGitHubTask.id)
              .order('created_at', { ascending: false });

            if (evidenceError) {
              console.error('🔍 Error fetching GitHub evidence for assignment:', assignment.id, evidenceError);
              return { ...assignment, evidence: [] };
            }

            console.log('🔍 Found GitHub evidence for assignment:', assignment.id, 'evidence count:', evidenceData?.length || 0, 'evidence:', evidenceData);

            // Transform GitHub evidence to match career evidence structure
            const transformedEvidence = (evidenceData || []).map(evidence => {
              console.log('🔍 Transforming GitHub evidence:', evidence);
              console.log('🔍 Raw parsed_json:', evidence.parsed_json);
              
              // Extract GitHub-specific details from parsed_json - safely handle JSON type
              const parsedData = (evidence.parsed_json as any) || {};
              console.log('🔍 Parsed data extracted:', parsedData);
              
              const gitHubDetails = {
                commits_count: parsedData.commits_count || parsedData.commit_count || parsedData.numberOfCommits || null,
                readmes_count: parsedData.readmes_count || parsedData.readme_count || parsedData.numberOfReadmes || null,
                repo_url: parsedData.repo_url || parsedData.repository_url || parsedData.repositoryUrl || evidence.url || null,
                repository_name: parsedData.repository_name || parsedData.repo_name || parsedData.repositoryName || null,
                branch: parsedData.branch || parsedData.defaultBranch || null,
                files_changed: parsedData.files_changed || parsedData.filesChanged || null,
                additions: parsedData.additions || null,
                deletions: parsedData.deletions || null,
                description: parsedData.description || parsedData.message || evidence.url || 'GitHub submission'
              };

              console.log('🔍 Extracted GitHub details:', gitHubDetails);

              const transformedEvidenceItem = {
                id: evidence.id,
                assignment_id: assignment.id,
                evidence_type: evidence.kind?.toLowerCase() || 'url',
                evidence_data: {
                  ...parsedData,
                  description: gitHubDetails.description,
                  commits_count: gitHubDetails.commits_count,
                  readmes_count: gitHubDetails.readmes_count,
                  repo_url: gitHubDetails.repo_url,
                  repository_name: gitHubDetails.repository_name,
                  branch: gitHubDetails.branch,
                  files_changed: gitHubDetails.files_changed,
                  additions: gitHubDetails.additions,
                  deletions: gitHubDetails.deletions,
                  // Also add direct fields for easier access
                  numberOfCommits: gitHubDetails.commits_count,
                  numberOfReadmes: gitHubDetails.readmes_count,
                  repositoryUrl: gitHubDetails.repo_url
                },
                url: evidence.url,
                file_urls: evidence.file_key ? [`/storage/v1/object/public/github-evidence/${evidence.file_key}`] : null,
                verification_status: 'pending',
                created_at: evidence.created_at,
                submitted_at: evidence.created_at,
                verification_notes: null,
                verified_at: null,
                verified_by: null,
                kind: evidence.kind,
                parsed_json: evidence.parsed_json
              };

              console.log('🔍 Final transformed evidence item:', transformedEvidenceItem);
              return transformedEvidenceItem;
            });

            console.log('🔍 Transformed GitHub evidence for assignment:', assignment.id, 'transformed:', transformedEvidence);
            return { ...assignment, evidence: transformedEvidence };
          } catch (error) {
            console.error('🔍 Error processing GitHub evidence for assignment:', assignment.id, error);
            return { ...assignment, evidence: [] };
          }
        })
      );

      console.log('🔍 GitHub assignments with evidence:', gitHubAssignmentsWithEvidence.length);
      allAssignments.push(...gitHubAssignmentsWithEvidence);
    }

    console.log('🔍 Total processed assignments:', allAssignments.length);
    setAssignments(allAssignments);
  };

  const handleVerifyAssignment = async (assignment: SubmittedAssignment, approved: boolean) => {
    if (!selectedAssignment) return;

    setProcessing(true);
    
    try {
      console.log('🔍 Processing assignment:', { approved, selectedAssignment: selectedAssignment.id, isLinkedIn: selectedAssignment._isLinkedInAssignment });
      
      if (selectedAssignment._isLinkedInAssignment) {
        // Handle LinkedIn assignment verification
        const linkedInTask = selectedAssignment._originalLinkedInTask;
        
        const updateData: any = {
          status: approved ? 'VERIFIED' : 'REJECTED',
          updated_at: new Date().toISOString()
        };

        // Only add verification_notes if it's not empty
        if (verificationNotes && verificationNotes.trim()) {
          updateData.verification_notes = verificationNotes.trim();
        }

        if (approved) {
          updateData.score_awarded = selectedAssignment.career_task_templates.points_reward;
        }

        const { error } = await supabase
          .from('linkedin_user_tasks')
          .update(updateData)
          .eq('id', linkedInTask.id);

        if (error) {
          console.error('🔍 LinkedIn assignment update error:', error);
          throw error;
        }

        // If verified/completed, process tracking metrics from evidence and add to linkedin_network_metrics
        if (approved && updateData.status === 'VERIFIED' && selectedAssignment.evidence) {
          for (const evidenceItem of selectedAssignment.evidence) {
            if (evidenceItem.evidence_data && evidenceItem.evidence_data.tracking_metrics) {
              const metrics = evidenceItem.evidence_data.tracking_metrics;
              const evidenceDate = new Date(evidenceItem.created_at).toISOString().split('T')[0];
              
              console.log('🔍 Processing LinkedIn tracking metrics for approval:', metrics, 'for date:', evidenceDate);
              
              // Insert/update metrics in linkedin_network_metrics
              const metricsToInsert = [];
              
              if (metrics.connections_accepted && metrics.connections_accepted > 0) {
                metricsToInsert.push({
                  user_id: selectedAssignment.user_id, // Use user_id from assignment
                  date: evidenceDate,
                  activity_id: 'connections_accepted',
                  value: metrics.connections_accepted
                });
              }
              
              if (metrics.posts_count && metrics.posts_count > 0) {
                metricsToInsert.push({
                  user_id: selectedAssignment.user_id, // Use user_id from assignment
                  date: evidenceDate,
                  activity_id: 'create_post',
                  value: metrics.posts_count
                });
              }
              
              if (metrics.profile_views && metrics.profile_views > 0) {
                metricsToInsert.push({
                  user_id: selectedAssignment.user_id, // Use user_id from assignment
                  date: evidenceDate,
                  activity_id: 'profile_views',
                  value: metrics.profile_views
                });
              }
              
              if (metricsToInsert.length > 0) {
                console.log(`🔍 Inserting ${metricsToInsert.length} LinkedIn metrics:`, metricsToInsert);
                
                const { error: metricsError } = await supabase
                  .from('linkedin_network_metrics')
                  .upsert(metricsToInsert, {
                    onConflict: 'user_id,date,activity_id'
                  });
                
                if (metricsError) {
                  console.error('🔍 Error inserting LinkedIn network metrics:', metricsError);
                } else {
                  console.log(`✅ Successfully added LinkedIn metrics to growth stats for user ${selectedAssignment.user_id}`);
                }
              }
            }
          }
        }

        console.log('🔍 LinkedIn assignment updated successfully');

        // If approved, add points to user_activity_points table
        if (approved) {
          console.log('🔍 Adding points to user_activity_points for LinkedIn task');
          const { error: pointsError } = await supabase
            .from('user_activity_points')
            .insert({
              user_id: selectedAssignment.user_id,
              activity_id: selectedAssignment.id,
              activity_type: 'linkedin_task_completion',
              points_earned: selectedAssignment.career_task_templates.points_reward,
              activity_date: new Date().toISOString().split('T')[0]
            });

          if (pointsError) {
            console.error('🔍 Error adding points for LinkedIn task:', pointsError);
            toast.success(`LinkedIn assignment approved successfully, but there was an issue recording points`);
          } else {
            console.log('🔍 Points added successfully for LinkedIn task');
            toast.success(`LinkedIn assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
          }
        } else {
          console.log('🔍 LinkedIn assignment rejected successfully');
          toast.success(`LinkedIn assignment rejected successfully`);
        }
      } else if (selectedAssignment._isJobHuntingAssignment) {
        // Handle Job Hunting assignment verification
        const { error } = await supabase
          .from('job_hunting_assignments')
          .update({
            status: approved ? 'verified' : 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: user?.id
          })
          .eq('id', selectedAssignment._originalJobHuntingTask.id);

        if (error) throw error;

        // Also update the evidence status
        if (selectedAssignment.evidence && selectedAssignment.evidence.length > 0) {
          const { error: evidenceError } = await supabase
            .from('job_hunting_evidence')
            .update({
              verification_status: approved ? 'verified' : 'rejected',
              verification_notes: verificationNotes.trim() || null,
              verified_at: new Date().toISOString(),
              verified_by: user?.id
            })
            .eq('assignment_id', selectedAssignment._originalJobHuntingTask.id);

          if (evidenceError) {
            console.error('Error updating job hunting evidence status:', evidenceError);
          }
        }

        // If approved, add points to user_activity_points table
        if (approved) {
          console.log('🔍 Adding points to user_activity_points for Job Hunting task');
          const { error: pointsError } = await supabase
            .from('user_activity_points')
            .insert({
              user_id: selectedAssignment.user_id,
              activity_id: selectedAssignment.id,
              activity_type: 'job_hunting_task_completion',
              points_earned: selectedAssignment.career_task_templates.points_reward,
              activity_date: new Date().toISOString().split('T')[0]
            });

          if (pointsError) {
            console.error('🔍 Error adding points for Job Hunting task:', pointsError);
            toast.success(`Job Hunting assignment approved successfully, but there was an issue recording points`);
          } else {
            console.log('🔍 Points added successfully for Job Hunting task');
            toast.success(`Job Hunting assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
          }
        } else {
          console.log('🔍 Job Hunting assignment rejected successfully');
          toast.success(`Job Hunting assignment rejected successfully`);
        }
      } else if (selectedAssignment._isGitHubAssignment) {
        // Handle GitHub assignment verification
        console.log('🔍 Processing GitHub assignment verification');
        const { error } = await supabase
          .from('github_user_tasks')
          .update({
            status: approved ? 'VERIFIED' : 'REJECTED', // Set to REJECTED for resubmission
            score_awarded: approved ? selectedAssignment.career_task_templates.points_reward : 0,
            verification_notes: verificationNotes.trim() || null
          })
          .eq('id', selectedAssignment._originalGitHubTask.id);

        if (error) {
          console.error('🔍 Error updating GitHub task status:', error);
          throw error;
        }

        console.log('🔍 GitHub assignment updated successfully');

        // If approved, add points to user_activity_points table
        if (approved) {
          console.log('🔍 Adding points to user_activity_points for GitHub task');
          const { error: pointsError } = await supabase
            .from('user_activity_points')
            .insert({
              user_id: selectedAssignment.user_id,
              activity_id: selectedAssignment.id,
              activity_type: 'github_task_completion',
              points_earned: selectedAssignment.career_task_templates.points_reward,
              activity_date: new Date().toISOString().split('T')[0]
            });

          if (pointsError) {
            console.error('🔍 Error adding points for GitHub task:', pointsError);
            toast.success(`GitHub assignment approved successfully, but there was an issue recording points`);
          } else {
            console.log('🔍 Points added successfully for GitHub task');
            toast.success(`GitHub assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
          }
        } else {
          console.log('🔍 GitHub assignment rejected successfully');
          toast.success(`GitHub assignment rejected successfully`);
        }
      } else {
        // Handle regular career assignment verification
        const updateData: any = {
          status: approved ? 'verified' : 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: user?.id
        };

        // Only add verification_notes if it's not empty
        if (verificationNotes && verificationNotes.trim()) {
          updateData.verification_notes = verificationNotes.trim();
        }

        if (approved) {
          updateData.points_earned = selectedAssignment.career_task_templates.points_reward;
          updateData.score_awarded = selectedAssignment.career_task_templates.points_reward;
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
            toast.success(`Assignment approved successfully, but there was an issue recording points`);
          } else {
            console.log('🔍 Points added successfully');
            toast.success(`Assignment approved and ${selectedAssignment.career_task_templates.points_reward} points awarded!`);
          }
        } else {
          console.log('🔍 Assignment rejected successfully');
          toast.success(`Assignment rejected successfully`);
        }
      }
      
      console.log('🔍 Refreshing assignment lists');
      if (isAdmin || isRecruiter) {
        await fetchVerifiedAssignments();
      }
      await fetchSubmittedAssignments();
      
      setSelectedAssignment(null);
      setVerificationNotes('');
    } catch (error: any) {
      console.error('🔍 Complete error details:', error);
      
      let errorMessage = 'Failed to process assignment';
      if (error?.message) {
        if (error.message.includes('constraint')) {
          errorMessage = `Database constraint failed: ${error.message}`;
        } else if (error.message.includes('foreign key')) {
          errorMessage = `Reference error: ${error.message}`;
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
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
        {(isAdmin || isRecruiter) && <AdminReenableRequestsDialog />}
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
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategoryOptions.map(subcategory => (
                  <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
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
                            <Badge variant="secondary" className="text-xs">
                              {getAssignmentSubcategory(assignment)}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, username, or task..."
                value={verifiedSearchTerm}
                onChange={(e) => setVerifiedSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={verifiedModuleFilter} onValueChange={setVerifiedModuleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueVerifiedModules.map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verifiedSubcategoryFilter} onValueChange={setVerifiedSubcategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategoryOptions.map(subcategory => (
                  <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verifiedUserFilter} onValueChange={setVerifiedUserFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueVerifiedUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name} ({user.username})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                            <Badge variant="secondary" className="text-xs">
                              {getAssignmentSubcategory(assignment)}
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

              {totalVerifiedPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {verifiedStartIndex + 1} to {Math.min(verifiedEndIndex, filteredVerifiedAssignments.length)} of {filteredVerifiedAssignments.length} assignments
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVerifiedCurrentPage(Math.max(1, verifiedCurrentPage - 1))}
                      disabled={verifiedCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalVerifiedPages) }, (_, i) => {
                        const pageNum = i + 1;
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
                      onClick={() => setVerifiedCurrentPage(Math.min(totalVerifiedPages, verifiedCurrentPage + 1))}
                      disabled={verifiedCurrentPage === totalVerifiedPages}
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