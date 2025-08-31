import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface TaskTemplate {
  id: string;
  code: string;
  module: 'RESUME' | 'LINKEDIN' | 'DIGITAL_PROFILE' | 'GITHUB';
  title: string;
  description: string;
  category: string;
  sub_category_id?: string;
  display_order?: number;
  evidence_types: string[];
  points_reward: number;
  cadence: string;
  difficulty: string;
  estimated_duration: number;
  instructions: any;
  verification_criteria: any;
  bonus_rules: any;
}

interface TaskAssignment {
  id: string;
  user_id: string;
  template_id: string;
  period?: string;
  due_date: string;
  week_start_date: string;
  status: string;
  score_awarded: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
  assigned_at: string;
  career_task_templates: TaskTemplate;
}

interface TaskEvidence {
  id: string;
  assignment_id: string;
  kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
  url?: string;
  file_urls?: string[];
  evidence_data: any;
  verification_status: string;
  created_at: string;
  career_task_assignments?: {
    user_id: string;
    career_task_templates?: {
      title: string;
      category: string;
    };
  };
}

export const useCareerAssignments = () => {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [evidence, setEvidence] = useState<TaskEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const { user } = useAuth();
  const { isRecruiter, isAdmin, isInstituteAdmin } = useRole();
  const location = useLocation();
  const lastLocationRef = useRef(location.pathname);
  const isInitializedRef = useRef(false);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 ASSIGNMENTS STATE CHANGED:', assignments.length, 'assignments');
  }, [assignments]);

  useEffect(() => {
    console.log('🔍 TEMPLATES STATE CHANGED:', templates.length, 'templates');
  }, [templates]);

  useEffect(() => {
    console.log('🔍 LOADING STATE CHANGED:', loading);
  }, [loading]);

  // Main data fetching effect - triggers on user change and navigation
  useEffect(() => {
    console.log('🔍 useCareerAssignments useEffect triggered', { 
      user: user?.id, 
      hasUser: !!user,
      currentPath: location.pathname,
      lastPath: lastLocationRef.current,
      isNavigationChange: location.pathname !== lastLocationRef.current
    });
    
    if (user) {
      const isNavigationChange = location.pathname !== lastLocationRef.current;
      lastLocationRef.current = location.pathname;
      
      // Force fresh data load on any navigation or initial load
      if (isNavigationChange || !isInitializedRef.current || assignments.length === 0) {
        console.log('🔍 Loading fresh data - Navigation:', isNavigationChange, 'Initialized:', isInitializedRef.current, 'Assignments:', assignments.length);
        setLoading(true);
        setAssignments([]);
        setTemplates([]);
        setEvidence([]);
        
        // Immediate fetch without delay to prevent race conditions
        fetchAllData();
        isInitializedRef.current = true;
      }
    } else {
      console.log('🔍 No user available, skipping data fetch');
      setLoading(false);
      isInitializedRef.current = false;
    }
  }, [user, location.pathname]);

  // Additional effect to handle component mount scenarios
  useEffect(() => {
    console.log('🔍 Component mounted, checking initialization state');
    // If component mounts and user is already available, ensure data is loaded
    if (user && assignments.length === 0 && !loading && !isInitializedRef.current) {
      console.log('🔍 Component mounted with user but not initialized, triggering fetch');
      setLoading(true);
      fetchAllData();
      isInitializedRef.current = true;
    }
  }, []); // Only run once on mount

  const fetchAllData = async () => {
    if (!user?.id) {
      console.log('🔍 No user ID available for fetchAllData');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Starting fetchAllData for user:', user.id);
      
      // Fetch templates first
      console.log('🔍 Fetching templates...');
      const { data: templatesData, error: templatesError } = await supabase
        .from('career_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (templatesError) {
        console.error('🔍 Templates error:', templatesError);
        throw templatesError;
      }

      console.log('🔍 Templates loaded:', templatesData?.length || 0);
      setTemplates(templatesData || []);

      // Fetch assignments without join to avoid type issues
      console.log('🔍 Fetching assignments...');
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('career_task_assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) {
        console.error('🔍 Assignments error:', assignmentsError);
        throw assignmentsError;
      }

      console.log('🔍 Assignments loaded:', assignmentsData?.length || 0);

      // Manually join assignments with templates
      const assignmentsWithTemplates = (assignmentsData || []).map(assignment => {
        const template = templatesData?.find(t => t.id === assignment.template_id);
        return {
          ...assignment,
          assigned_at: assignment.created_at,
          career_task_templates: template || {
            id: '',
            code: '',
            module: 'RESUME' as const,
            title: 'Unknown Template',
            description: '',
            category: '',
            sub_category_id: null,
            evidence_types: [],
            points_reward: 0,
            cadence: '',
            difficulty: '',
            estimated_duration: 0,
            instructions: {},
            verification_criteria: {},
            bonus_rules: {}
          }
        };
      });

      setAssignments(assignmentsWithTemplates);

      // Skip evidence fetch for now to avoid TypeScript and body stream issues
      setEvidence([]);
      
      console.log('🔍 ✅ All data loaded successfully');
      setLoading(false);

    } catch (error) {
      console.error('🔍 ❌ fetchAllData error:', error);
      setLoading(false);
      
      // Handle body stream error with simplified retry
      if (error.message?.includes('body stream already read')) {
        console.log('🔍 Body stream error detected, will retry after delay');
        setTimeout(() => {
          if (user?.id && assignments.length === 0) {
            console.log('🔍 Retrying data fetch after body stream error...');
            fetchAllData();
          }
        }, 1000);
      } else {
        toast.error('Failed to load assignments data');
      }
    }
  };

  const fetchTemplates = async () => {
    console.log('🔍 fetchTemplates started');
    try {
      const { data, error } = await supabase
        .from('career_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('module', { ascending: true });

      if (error) throw error;
      console.log('🔍 fetchTemplates success:', data?.length || 0, 'templates');
      setTemplates(data || []);
    } catch (error) {
      console.error('🔍 fetchTemplates error:', error);
      // Don't show error toast for missing templates - just set empty array
      setTemplates([]);
    }
  };

  const fetchAssignments = async () => {
    console.log('🔍 fetchAssignments started', { userId: user?.id, templatesLength: templates.length });
    if (!user) {
      console.log('🔍 fetchAssignments aborted - no user');
      return;
    }

    try {
      console.log('🔍 Fetching assignments for user:', user.id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('career_task_assignments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      console.log('🔍 Raw assignments fetched:', assignmentsData?.length || 0);

      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('🔍 No assignments found for user');
        setAssignments([]);
        return;
      }

      // Use existing templates from state, but fetch fresh ones if needed
      let templatesData = templates;
      if (templates.length === 0) {
        console.log('🔍 No templates in state, fetching fresh...');
        const { data: freshTemplates, error: templatesError } = await supabase
          .from('career_task_templates')
          .select('*')
          .eq('is_active', true);

        if (templatesError) throw templatesError;
        templatesData = freshTemplates || [];
        console.log('🔍 Fresh templates fetched:', templatesData.length);
        setTemplates(templatesData);
      }
      
      console.log('🔍 Using templates for joining:', templatesData.length);

      // Manually join the data
      const assignmentsWithTemplates = assignmentsData.map(assignment => {
        const template = templatesData?.find(t => t.id === assignment.template_id);
        console.log('🔍 Mapping assignment:', assignment.id, 'to template:', template?.title || 'NOT FOUND', 'sub_category_id:', template?.sub_category_id);
        return {
          ...assignment,
          assigned_at: assignment.created_at,
          career_task_templates: template || {
            id: '',
            code: '',
            module: 'RESUME' as const,
            title: 'Unknown Template',
            description: '',
            category: '',
            sub_category_id: null,
            evidence_types: [],
            points_reward: 0,
            cadence: '',
            difficulty: '',
            estimated_duration: 0,
            instructions: {},
            verification_criteria: {},
            bonus_rules: {}
          }
        };
      });
      
      console.log('🔍 Final assignments with templates:', assignmentsWithTemplates.length);
      console.log('🔍 Sample assignment sub_category_id:', assignmentsWithTemplates[0]?.career_task_templates?.sub_category_id);
      
      // Set assignments directly without timeout
      setAssignments(assignmentsWithTemplates);
      console.log('🔍 ✅ Assignments successfully set in state');
      
    } catch (error) {
      console.error('🔍 ❌ fetchAssignments error:', error);
      setAssignments([]);
    }
  };

  const fetchEvidenceWithAssignments = async (userAssignments: any[]) => {
    try {
      const assignmentIds = userAssignments.map(a => a.id);
      
      if (assignmentIds.length === 0) {
        setEvidence([]);
        return;
      }

      // Get evidence for those assignments
      const { data: evidenceData, error } = await supabase
        .from('career_task_evidence')
        .select('*')
        .in('assignment_id', assignmentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get template details for context
      const { data: templatesData, error: templatesError } = await supabase
        .from('career_task_templates')
        .select('id, title, category')
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      // Map evidence with assignment and template info
      const evidenceWithDetails = (evidenceData || []).map(evidence => {
        const assignment = userAssignments?.find(a => a.id === evidence.assignment_id);
        const template = templatesData?.find(t => t.id === assignment?.template_id);
        return {
          ...evidence,
          career_task_assignments: assignment ? {
            user_id: assignment.user_id,
            career_task_templates: template ? {
              title: template.title,
              category: template.category
            } : undefined
          } : undefined
        };
      });

      setEvidence(evidenceWithDetails);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      setEvidence([]);
    }
  };

  const fetchEvidence = async () => {
    if (!user) return;

    try {
      // Get user's assignment IDs first, then filter evidence
      const { data: userAssignments, error: assignmentsError } = await supabase
        .from('career_task_assignments')
        .select('id, user_id, template_id')
        .eq('user_id', user.id);

      if (assignmentsError) throw assignmentsError;
      await fetchEvidenceWithAssignments(userAssignments || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      setEvidence([]);
    }
  };

  const initializeUserWeek = async (period?: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      
      // Ensure templates are loaded first
      if (templates.length === 0) {
        console.log('Templates not loaded, fetching...');
        await fetchTemplates();
      }
      
      // Check if templates loaded successfully
      if (templates.length === 0) {
        throw new Error('No task templates available');
      }
      
      console.log('Available templates:', templates);
      
      // Get current ISO week if period not provided
      const currentPeriod = period || getISOWeek(new Date());
      console.log('Initializing for period:', currentPeriod);
      
      // Get weekly templates
      const weeklyTemplates = templates.filter(t => t.cadence === 'weekly');
      const oneoffTemplates = templates.filter(t => t.cadence === 'oneoff');
      
      console.log('Weekly templates:', weeklyTemplates.length);
      console.log('One-off templates:', oneoffTemplates.length);
      
      let createdCount = 0;
      
      // Create assignments for weekly tasks
      for (const template of weeklyTemplates) {
        console.log('Processing weekly assignment for template:', template.title);
        
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('career_task_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .eq('period', currentPeriod)
          .single();
        
        if (!existing) {
          const { error } = await supabase
            .from('career_task_assignments')
            .insert({
              user_id: user.id,
              template_id: template.id,
              period: currentPeriod,
              due_date: getWeekEndDate(currentPeriod),
              week_start_date: getWeekStartDate(currentPeriod),
              status: 'assigned',
              points_earned: 0
            });
          
          if (error) {
            console.error('Error creating weekly assignment:', error);
            throw error;
          }
          createdCount++;
        }
      }

      // Create assignments for oneoff tasks (if not already created)
      for (const template of oneoffTemplates) {
        console.log('Processing one-off assignment for template:', template.title);
        
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('career_task_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .is('period', null)
          .single();
        
        if (!existing) {
          const { error } = await supabase
            .from('career_task_assignments')
            .insert({
              user_id: user.id,
              template_id: template.id,
              period: null,
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              week_start_date: new Date().toISOString().split('T')[0], // Today's date
              status: 'assigned',
              points_earned: 0
            });
          
          if (error) {
            console.error('Error creating one-off assignment:', error);
            throw error;
          }
          createdCount++;
        }
      }

      await fetchAssignments();
      
      if (createdCount > 0) {
        toast.success(`Tasks initialized successfully! Created ${createdCount} new assignments.`);
      } else {
        toast.success('All tasks already initialized for this period.');
      }
    } catch (error) {
      console.error('Error initializing user week:', error);
      toast.error(`Failed to initialize tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('career_task_assignments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;

      await fetchAssignments();
      
      // Show success message based on status change
      if (newStatus === 'started') {
        toast.success('Assignment started! You can now submit your work.');
      }
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
    }
  };

  const submitEvidence = async (
    assignmentId: string,
    evidenceType: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT',
    evidenceData: any,
    file?: File
  ) => {
    if (!user) return;

    try {
      setSubmittingEvidence(true);
      console.log('🔍 submitEvidence called with:', { assignmentId, evidenceType, evidenceData, file });

      let fileUrls: string[] = [];
      
      if (file) {
        // Upload file to Supabase storage with proper path structure for RLS policy
        // Policy expects: {user_id}/{assignment_id}/filename
        const fileName = `${user.id}/${assignmentId}/${Date.now()}_${file.name}`;
        console.log('🔍 Attempting to upload file:', fileName, 'Size:', file.size, 'Type:', file.type);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('career-evidence')
          .upload(fileName, file);

        if (uploadError) {
          console.error('🔍 File upload error:', uploadError);
          console.error('🔍 Full upload error details:', {
            message: uploadError.message,
            name: uploadError.name,
            stack: uploadError.stack
          });
          throw uploadError;
        }
        
        console.log('🔍 File upload successful:', uploadData);
        
        const { data: { publicUrl } } = supabase.storage
          .from('career-evidence')
          .getPublicUrl(fileName);
        
        fileUrls = [publicUrl];
        console.log('🔍 File uploaded successfully:', publicUrl);
      }

      // Ensure we always have a proper evidence data object
      const completeEvidenceData = {
        evidence_type: evidenceType.toLowerCase(),
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        has_file: fileUrls.length > 0,
        file_count: fileUrls.length,
        // Include all user-provided data, with defaults for empty values
        url: evidenceData.url || null,
        description: evidenceData.description || evidenceData.text || null,
        text: evidenceData.text || evidenceData.description || null,
        file_name: evidenceData.file_name || null,
        file_size: evidenceData.file_size || null,
        file_type: evidenceData.file_type || null,
        // Include any additional data from evidenceData
        ...evidenceData
      };

      console.log('🔍 FIXED VERSION - Complete evidence data to store:', completeEvidenceData);
      console.log('🔍 FIXED VERSION - Original evidenceData received:', evidenceData);

      // Insert evidence with proper data structure
      const insertPayload = {
        assignment_id: assignmentId,
        evidence_type: evidenceType.toLowerCase(),
        kind: evidenceType,
        url: completeEvidenceData.url,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
        evidence_data: completeEvidenceData, // Store as object, not string - Supabase will handle JSON serialization
        verification_status: 'pending'
      };

      console.log('🔍 FIXED VERSION - Insert payload:', insertPayload);
      console.log('🔍 FIXED VERSION - evidence_data as object:', completeEvidenceData);

      const { error } = await supabase
        .from('career_task_evidence')
        .insert(insertPayload);

      if (error) {
        console.error('🔍 Database insertion error:', error);
        throw error;
      }

      console.log('🔍 Evidence inserted successfully with complete data');

      // Update assignment status to submitted with proper timestamp
      const submittedAt = new Date().toISOString();
      const { error: statusError } = await supabase
        .from('career_task_assignments')
        .update({ 
          status: 'submitted',
          submitted_at: submittedAt,
          updated_at: submittedAt
        })
        .eq('id', assignmentId);

      if (statusError) {
        console.error('Error updating assignment status:', statusError);
        throw statusError;
      }

      await Promise.all([fetchAssignments(), fetchEvidence()]);
      toast.success('Evidence submitted successfully!');
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast.error('Failed to submit evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const verifyAssignments = async () => {
    if (!user) return;

    try {
      // Call the verification edge function
      const { data, error } = await supabase.functions.invoke('verify-all-assignments', {
        body: { userId: user.id }
      });

      if (error) throw error;

      await fetchAssignments();
      toast.success(`Verification complete! ${data.verified} tasks verified.`);
    } catch (error) {
      console.error('Error verifying assignments:', error);
      toast.error('Failed to verify assignments');
    }
  };

  // Define display order for resume tasks (Assignment #1, #2, #3, etc.)
  const resumeTaskOrder: Record<string, number> = {
    'RESUME_PROFESSIONAL_LINKS': 1,
    'RESUME_TOP_6_SKILLS': 2, 
    'RESUME_ACHIEVEMENTS_RESPONSIBILITIES': 3,
    'RESUME_SUMMARY_GENERATION': 4,
    'RESUME_COMPLETE_PROFILE': 5,
    'RESUME_EDUCATION_CERTIFICATIONS': 6,
    'RESUME_ATS_BASELINE_SCORE': 7,
    'RESUME_UPLOAD_DEFAULT': 8,
    'RESUME_COVER_LETTER_LIBRARY': 9,
  };

  const getTasksByModule = (module: 'RESUME' | 'LINKEDIN' | 'DIGITAL_PROFILE' | 'GITHUB') => {
    const filteredTasks = assignments.filter(a => a.career_task_templates?.module === module);
    
    // Sort resume tasks in ascending order (Assignment #1, #2, #3, etc.)
    if (module === 'RESUME') {
      return filteredTasks.sort((a, b) => {
        const orderA = resumeTaskOrder[a.career_task_templates?.code || ''] || 999;
        const orderB = resumeTaskOrder[b.career_task_templates?.code || ''] || 999;
        return orderA - orderB;
      });
    }
    
    return filteredTasks;
  };

  const getModuleProgress = (module: 'RESUME' | 'LINKEDIN' | 'DIGITAL_PROFILE' | 'GITHUB') => {
    const moduleTasks = getTasksByModule(module);
    if (moduleTasks.length === 0) return 0;
    
    const completedTasks = moduleTasks.filter(t => t.status === 'verified').length;
    return Math.round((completedTasks / moduleTasks.length) * 100);
  };

  const getTotalPoints = () => {
    return assignments.reduce((sum, assignment) => sum + (assignment.points_earned || 0), 0);
  };

  const getMaxPoints = () => {
    return assignments.reduce((sum, assignment) => 
      sum + assignment.career_task_templates?.points_reward || 0, 0);
  };

  return {
    assignments,
    templates,
    evidence,
    loading,
    submittingEvidence,
    initializeUserWeek,
    submitEvidence,
    updateAssignmentStatus,
    verifyAssignments,
    getTasksByModule,
    getModuleProgress,
    getTotalPoints,
    getMaxPoints,
    refreshData: () => {
      console.log('🔍 Refreshing data manually...');
      return Promise.all([fetchAssignments(), fetchEvidence()]);
    }
  };
};

// Helper functions
function getISOWeek(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = date.getTime() - start.getTime();
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekStartDate(period: string): string {
  const [year, week] = period.split('-W');
  const startOfYear = new Date(parseInt(year), 0, 1);
  const weekStart = new Date(startOfYear.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000);
  return weekStart.toISOString();
}

function getWeekEndDate(period: string): string {
  const [year, week] = period.split('-W');
  const startOfYear = new Date(parseInt(year), 0, 1);
  const weekStart = new Date(startOfYear.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  return weekEnd.toISOString();
}