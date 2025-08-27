import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JobHuntingTaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points_reward: number;
  estimated_duration: number;
  instructions: any;
  verification_criteria: any;
  evidence_types: string[];
  cadence: string;
  is_active: boolean;
}

export interface JobHuntingAssignment {
  id: string;
  user_id: string;
  template_id: string;
  week_start_date: string;
  status: string;
  assigned_at: string;
  submitted_at?: string;
  verified_at?: string;
  verified_by?: string;
  points_earned: number;
  score_awarded: number;
  due_date: string;
  template?: JobHuntingTaskTemplate;
}

export interface JobHuntingEvidence {
  id: string;
  assignment_id: string;
  evidence_type: string;
  evidence_data: any;
  file_urls?: string[];
  verification_status: string;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  submitted_at: string;
}

export interface JobHuntingStreak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
}

export const useJobHuntingAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<JobHuntingAssignment[]>([]);
  const [templates, setTemplates] = useState<JobHuntingTaskTemplate[]>([]);
  const [evidence, setEvidence] = useState<JobHuntingEvidence[]>([]);
  const [streaks, setStreaks] = useState<JobHuntingStreak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTemplates(),
        fetchAssignments(),
        fetchEvidence(),
        fetchStreaks()
      ]);
    } catch (error) {
      console.error('Error fetching job hunting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('job_hunting_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('category, difficulty, points_reward');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchAssignments = async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching assignments');
      return;
    }

    try {
      console.log('Fetching job hunting assignments for user:', user.id);
      
      // Calculate current week start date (Monday) to filter assignments
      const now = new Date();
      const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayOfWeek = currentDate.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - daysToSubtract);
      const currentWeekStart = weekStart.toISOString().split('T')[0];
      
      console.log('Calculated current week start:', currentWeekStart);

      const { data, error } = await supabase
        .from('job_hunting_assignments')
        .select(`
          *,
          template:job_hunting_task_templates(*)
        `)
        .eq('user_id', user.id)
        .eq('week_start_date', currentWeekStart) // Only fetch current week assignments
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      
      console.log('Fetched assignments:', data);
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('job_hunting_evidence')
        .select(`
          *,
          assignment:job_hunting_assignments!inner(user_id)
        `)
        .eq('assignment.user_id', user?.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    }
  };

  const fetchStreaks = async () => {
    try {
      const { data, error } = await supabase
        .from('job_hunting_streaks')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setStreaks(data || []);
    } catch (error) {
      console.error('Error fetching streaks:', error);
    }
  };

  const initializeUserWeek = async () => {
    try {
      setLoading(true);
      
      console.log('Initializing job hunting week for user:', user?.id);
      
      // Call the job hunting specific edge function
      const { data, error } = await supabase.functions.invoke('initialize-job-hunting-week', {
        body: { user_id: user?.id }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Job hunting week initialization response:', data);
      
      // Handle different response cases
      if (data?.success === true) {
        if (data?.message?.includes('already exist')) {
          toast.success(`Job hunting assignments are already set up for this week! (${data.assignments_count} tasks)`);
        } else {
          toast.success(`Job hunting tasks initialized successfully! Created ${data?.assignments_created || 0} assignments.`);
        }
      } else if (data?.success === false) {
        throw new Error(data?.error || 'Unknown error occurred');
      } else {
        // Handle old response format
        toast.success('Job hunting tasks initialized successfully!');
      }
      
      // Always refresh assignments after initialization
      console.log('Refreshing assignments after initialization...');
      await fetchAssignments();
      await fetchEvidence();
      await fetchStreaks();
      
    } catch (error: any) {
      console.error('Error initializing job hunting week:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to initialize job hunting tasks';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show specific error for edge function failures
      if (error?.message?.includes('edge function')) {
        errorMessage = 'Edge function error. Please check the logs and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitEvidence = async (
    assignmentId: string, 
    evidenceType: string, 
    evidenceData: any, 
    files?: File[]
  ) => {
    try {
      let fileUrls: string[] = [];

      // Upload files if provided
      if (files && files.length > 0) {
        for (const file of files) {
          const fileName = `${user?.id}/${assignmentId}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('career-evidence')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('career-evidence')
            .getPublicUrl(fileName);

          fileUrls.push(urlData.publicUrl);
        }
      }

      const { data, error } = await supabase
        .from('job_hunting_evidence')
        .insert({
          assignment_id: assignmentId,
          evidence_type: evidenceType,
          evidence_data: evidenceData,
          file_urls: fileUrls.length > 0 ? fileUrls : null
        })
        .select()
        .single();

      if (error) throw error;

      // Update assignment status
      await supabase
        .from('job_hunting_assignments')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      await fetchAssignments();
      await fetchEvidence();
      toast.success('Evidence submitted successfully!');
      
      return data;
    } catch (error: any) {
      toast.error('Failed to submit evidence: ' + error.message);
      throw error;
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_hunting_assignments')
        .update({ status })
        .eq('id', assignmentId);

      if (error) throw error;
      
      await fetchAssignments();
      toast.success('Assignment status updated!');
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const getWeekProgress = () => {
    const currentWeek = assignments.filter(a => {
      const weekStart = new Date(a.week_start_date);
      const now = new Date();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return now >= weekStart && now <= weekEnd;
    });

    const completed = currentWeek.filter(a => a.status === 'verified').length;
    const total = currentWeek.length;
    const totalPoints = currentWeek.reduce((sum, a) => sum + (a.points_earned || 0), 0);
    const maxPoints = currentWeek.reduce((sum, a) => sum + (a.template?.points_reward || 0), 0);

    return { completed, total, totalPoints, maxPoints, assignments: currentWeek };
  };

  const getTasksByCategory = () => {
    const categories = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, JobHuntingTaskTemplate[]>);

    return categories;
  };

  const getTotalPoints = () => {
    return assignments.reduce((sum, a) => sum + (a.points_earned || 0), 0);
  };

  // Function to instantiate per-job tasks
  const instantiateJobTasks = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('instantiate-job-tasks', {
        body: { userId: user?.id, jobId }
      });
      
      if (error) throw error;
      
      console.log('Job tasks instantiation response:', data);
      toast.success(`Tasks created for job: ${data.jobTitle}`);
      
      // Refresh assignments
      await fetchData();
      return data;
    } catch (error: any) {
      console.error('Error instantiating job tasks:', error);
      toast.error(error.message || 'Failed to create job tasks');
      throw error;
    }
  };

  // Function to verify job hunter activities
  const verifyJobHunter = async (period?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-jobhunter', {
        body: { userId: user?.id, period }
      });
      
      if (error) throw error;
      
      console.log('Verification response:', data);
      toast.success(`Verified ${data.tasksVerified} tasks and awarded ${data.totalPointsAwarded} points!`);
      
      // Refresh assignments
      await fetchData();
      return data;
    } catch (error: any) {
      console.error('Error verifying activities:', error);
      toast.error(error.message || 'Failed to verify activities');
      throw error;
    }
  };

  return {
    assignments,
    templates,
    evidence,
    streaks,
    loading,
    initializeUserWeek,
    instantiateJobTasks,
    verifyJobHunter,
    submitEvidence,
    updateAssignmentStatus,
    getWeekProgress,
    getTasksByCategory,
    getTotalPoints,
    refetch: fetchData
  };
};