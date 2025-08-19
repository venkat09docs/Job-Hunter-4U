import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';

export interface CareerTaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: number;
  points_reward: number;
  evidence_types: string[];
  instructions: any;
  verification_criteria: any;
  is_active: boolean;
}

export interface CareerTaskAssignment {
  id: string;
  user_id: string;
  template_id: string;
  week_start_date: string;
  status: string;
  assigned_at: string;
  due_date: string;
  submitted_at?: string;
  verified_at?: string;
  points_earned: number;
  template: CareerTaskTemplate;
  evidence?: CareerTaskEvidence[];
}

export interface CareerTaskEvidence {
  id: string;
  assignment_id: string;
  evidence_type: string;
  evidence_data: any;
  file_urls?: string[];
  verification_status: string;
  verification_notes?: string;
  verified_by?: string;
  submitted_at: string;
  verified_at?: string;
}

export interface WeeklySchedule {
  id: string;
  user_id: string;
  week_start_date: string;
  total_tasks_assigned: number;
  tasks_completed: number;
  total_points_possible: number;
  points_earned: number;
  schedule_generated_at: string;
}

export const useCareerTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<CareerTaskAssignment[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [templates, setTemplates] = useState<CareerTaskTemplate[]>([]);

  // Get current week's Monday
  const getCurrentWeekStart = () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(monday, 'yyyy-MM-dd');
  };

  // Fetch user's task assignments for current week
  const fetchAssignments = async (weekStartDate?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const targetWeek = weekStartDate || getCurrentWeekStart();
      
      const { data, error } = await supabase
        .from('career_task_assignments')
        .select(`
          *,
          template:career_task_templates(*),
          evidence:career_task_evidence(*)
        `)
        .eq('user_id', user.id)
        .eq('week_start_date', targetWeek)
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch weekly schedule
  const fetchWeeklySchedule = async (weekStartDate?: string) => {
    if (!user) return;

    try {
      const targetWeek = weekStartDate || getCurrentWeekStart();
      
      const { data, error } = await supabase
        .from('career_weekly_schedules')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', targetWeek)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors

      setWeeklySchedule(data);
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
    }
  };

  // Fetch available task templates
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('career_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Generate weekly tasks for user
  const generateWeeklyTasks = async (forceRegenerate = false) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('assign-weekly-tasks', {
        body: {
          userId: user.id,
          weekStartDate: getCurrentWeekStart(),
          forceRegenerate
        }
      });

      if (error) throw error;

      toast.success(`Generated ${data.totalTasksAssigned} tasks for this week`);
      
      // Refresh assignments and schedule
      await Promise.all([
        fetchAssignments(),
        fetchWeeklySchedule()
      ]);

    } catch (error) {
      console.error('Error generating weekly tasks:', error);
      toast.error('Failed to generate weekly tasks');
    } finally {
      setLoading(false);
    }
  };

  // Update assignment status
  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('career_task_assignments')
        .update({
          status,
          ...(status === 'submitted' && { submitted_at: new Date().toISOString() })
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status }
            : assignment
        )
      );

      toast.success('Assignment status updated');
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
    }
  };

  // Submit evidence for a task
  const submitEvidence = async (
    assignmentId: string, 
    evidenceType: string,
    evidenceData: any,
    fileUrls?: string[]
  ) => {
    try {
      const { data, error } = await supabase
        .from('career_task_evidence')
        .insert({
          assignment_id: assignmentId,
          evidence_type: evidenceType,
          evidence_data: evidenceData,
          file_urls: fileUrls
        })
        .select()
        .single();

      if (error) throw error;

      // Update assignment status to submitted
      await updateAssignmentStatus(assignmentId, 'submitted');

      toast.success('Evidence submitted successfully!');
      return data;
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast.error('Failed to submit evidence');
      throw error;
    }
  };

  // Upload file to Supabase Storage
  const uploadEvidenceFile = async (assignmentId: string, file: File) => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${assignmentId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('career-evidence')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('career-evidence')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  // Initialize data on user change
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAssignments(),
        fetchWeeklySchedule(),
        fetchTemplates()
      ]);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const assignmentsChannel = supabase
      .channel('career-assignments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_assignments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchAssignments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_evidence'
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    const scheduleChannel = supabase
      .channel('career-schedule')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_weekly_schedules',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchWeeklySchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(scheduleChannel);
    };
  }, [user]);

  return {
    loading,
    assignments,
    weeklySchedule,
    templates,
    fetchAssignments,
    fetchWeeklySchedule,
    generateWeeklyTasks,
    updateAssignmentStatus,
    submitEvidence,
    uploadEvidenceFile,
    getCurrentWeekStart
  };
};