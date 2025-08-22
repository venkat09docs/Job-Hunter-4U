import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskTemplate {
  id: string;
  code: string;
  module: 'RESUME' | 'LINKEDIN' | 'DIGITAL_PROFILE' | 'GITHUB';
  title: string;
  description: string;
  category: string;
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
}

export const useCareerAssignments = () => {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [evidence, setEvidence] = useState<TaskEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchTemplates(),
        fetchAssignments(),
        fetchEvidence()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('career_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('module', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load task templates');
    }
  };

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('career_task_assignments')
        .select(`
          *,
          career_task_templates (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Add assigned_at to match interface
      const assignmentsWithAssignedAt = (data || []).map(assignment => ({
        ...assignment,
        assigned_at: assignment.created_at
      }));
      setAssignments(assignmentsWithAssignedAt);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    }
  };

  const fetchEvidence = async () => {
    if (!user) return;

    try {
      // Get evidence through assignments
      const { data, error } = await supabase
        .from('career_task_evidence')
        .select(`
          *,
          career_task_assignments!inner (user_id)
        `)
        .eq('career_task_assignments.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence');
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
        // Upload file to Supabase storage
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('career-evidence')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
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
        evidence_data: JSON.stringify(completeEvidenceData), // Explicitly stringify the object
        verification_status: 'pending'
      };

      console.log('🔍 FIXED VERSION - Insert payload:', insertPayload);
      console.log('🔍 FIXED VERSION - evidence_data as string:', JSON.stringify(completeEvidenceData));

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
    refreshData: () => Promise.all([fetchAssignments(), fetchEvidence()])
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