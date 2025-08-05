import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface StudentStats {
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  batch_name: string;
  batch_id: string;
  profile_completion: number;
  total_job_applications: number;
  active_job_applications: number;
  linkedin_connections: number;
  linkedin_posts: number;
  github_completion: number;
  last_activity: string;
}

interface BatchSummary {
  batch_id: string;
  batch_name: string;
  student_count: number;
  students: StudentStats[];
}

export const useInstituteStudents = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const { toast } = useToast();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role) {
      fetchInstituteStudents();
    }
  }, [user, role]);

  const fetchInstituteStudents = async () => {
    try {
      setLoading(true);

      let instituteIds: string[] = [];

      if (role === 'admin') {
        // Super admin can see all institutes
        const { data: allInstitutes, error: instituteError } = await supabase
          .from('institutes')
          .select('id')
          .eq('is_active', true);

        if (instituteError) throw instituteError;
        instituteIds = allInstitutes?.map(inst => inst.id) || [];
      } else if (role === 'institute_admin') {
        // Institute admin sees only their managed institutes
        const { data: managedInstitutes, error: instituteError } = await supabase
          .rpc('get_managed_institutes', { user_id_param: user?.id });

        if (instituteError) throw instituteError;
        instituteIds = managedInstitutes?.map((inst: any) => inst.institute_id) || [];
      }

      if (instituteIds.length === 0) {
        setBatches([]);
        return;
      }

      // First, get all batches belonging to these institutes
      const { data: instituteBatches, error: batchError } = await supabase
        .from('batches')
        .select('id, name, institute_id')
        .in('institute_id', instituteIds)
        .eq('is_active', true);

      if (batchError) throw batchError;

      if (!instituteBatches || instituteBatches.length === 0) {
        setBatches([]);
        return;
      }

      const batchIds = instituteBatches.map(batch => batch.id);

      // Get all student assignments for these batches
      const { data: studentAssignments, error: assignmentError } = await supabase
        .from('user_assignments')
        .select('user_id, batch_id, institute_id')
        .in('batch_id', batchIds)
        .in('institute_id', instituteIds)
        .eq('is_active', true)
        .eq('assignment_type', 'student');

      if (assignmentError) throw assignmentError;

      if (!studentAssignments || studentAssignments.length === 0) {
        setBatches([]);
        return;
      }

      // Get profiles for all students
      const studentIds = studentAssignments.map(a => a.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, username')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;

      // Create a map for quick profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Create a map for quick batch lookup
      const batchMap = new Map<string, BatchSummary>();
      const batchLookup = new Map();
      instituteBatches.forEach(batch => {
        batchLookup.set(batch.id, batch);
      });

      for (const assignment of studentAssignments || []) {
        const batchId = assignment.batch_id;
        const batchInfo = batchLookup.get(batchId);
        const batchName = batchInfo?.name || 'Unknown Batch';
        const profile = profileMap.get(assignment.user_id);
        
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            batch_id: batchId,
            batch_name: batchName,
            student_count: 0,
            students: []
          });
        }

        // Fetch student statistics
        const studentStats = await fetchStudentStatistics(assignment.user_id);
        
        const student: StudentStats = {
          user_id: assignment.user_id,
          full_name: profile?.full_name || '',
          email: profile?.email || '',
          username: profile?.username || '',
          batch_name: batchName,
          batch_id: batchId,
          ...studentStats
        };

        const batch = batchMap.get(batchId)!;
        batch.students.push(student);
        batch.student_count = batch.students.length;
      }

      setBatches(Array.from(batchMap.values()));
    } catch (error: any) {
      console.error('Error fetching institute students:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStatistics = async (userId: string) => {
    try {
      // Fetch profile completion data
      const { data: resumeData } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Calculate profile completion percentage
      let profileCompletion = 0;
      if (resumeData) {
        const sections = [
          resumeData.personal_details,
          resumeData.experience,
          resumeData.education,
          resumeData.skills_interests,
          resumeData.professional_summary
        ];
        const completedSections = sections.filter(section => 
          section && (Array.isArray(section) ? section.length > 0 : Object.keys(section).length > 0)
        ).length;
        profileCompletion = (completedSections / sections.length) * 100;
      }

      // Fetch job applications
      const { data: jobApps } = await supabase
        .from('job_tracker')
        .select('status')
        .eq('user_id', userId)
        .eq('is_archived', false);

      const totalJobApps = jobApps?.length || 0;
      const activeJobApps = jobApps?.filter(app => 
        !['rejected', 'withdrawn'].includes(app.status)
      ).length || 0;

      // Fetch LinkedIn network metrics (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: linkedinMetrics } = await supabase
        .from('linkedin_network_metrics')
        .select('activity_id, value')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      let linkedinConnections = 0;
      let linkedinPosts = 0;

      if (linkedinMetrics) {
        linkedinConnections = linkedinMetrics
          .filter(m => m.activity_id === 'connections')
          .reduce((sum, m) => sum + m.value, 0);
        
        linkedinPosts = linkedinMetrics
          .filter(m => m.activity_id === 'posts')
          .reduce((sum, m) => sum + m.value, 0);
      }

      // Fetch GitHub progress
      const { data: githubProgress } = await supabase
        .from('github_progress')
        .select('completed')
        .eq('user_id', userId);

      const totalGithubTasks = 10; // Assuming 10 tasks
      const completedGithubTasks = githubProgress?.filter(p => p.completed).length || 0;
      const githubCompletion = (completedGithubTasks / totalGithubTasks) * 100;

      // Get last activity from daily progress snapshots
      const { data: lastSnapshot } = await supabase
        .from('daily_progress_snapshots')
        .select('snapshot_date')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      return {
        profile_completion: Math.round(profileCompletion),
        total_job_applications: totalJobApps,
        active_job_applications: activeJobApps,
        linkedin_connections: linkedinConnections,
        linkedin_posts: linkedinPosts,
        github_completion: Math.round(githubCompletion),
        last_activity: lastSnapshot?.snapshot_date || 'Never'
      };
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      return {
        profile_completion: 0,
        total_job_applications: 0,
        active_job_applications: 0,
        linkedin_connections: 0,
        linkedin_posts: 0,
        github_completion: 0,
        last_activity: 'Never'
      };
    }
  };

  const exportToExcel = async (selectedBatches: string[] = [], selectedStudents: string[] = []) => {
    try {
      const XLSX = await import('xlsx');
      
      let dataToExport: StudentStats[] = [];
      
      if (selectedStudents.length > 0) {
        // Export selected students
        dataToExport = batches.flatMap(batch => 
          batch.students.filter(student => selectedStudents.includes(student.user_id))
        );
      } else if (selectedBatches.length > 0) {
        // Export selected batches
        dataToExport = batches
          .filter(batch => selectedBatches.includes(batch.batch_id))
          .flatMap(batch => batch.students);
      } else {
        // Export all students
        dataToExport = batches.flatMap(batch => batch.students);
      }

      const worksheet = XLSX.utils.json_to_sheet(
        dataToExport.map(student => ({
          'Full Name': student.full_name,
          'Email': student.email,
          'Username': student.username,
          'Batch': student.batch_name,
          'Profile Completion (%)': student.profile_completion,
          'Total Job Applications': student.total_job_applications,
          'Active Job Applications': student.active_job_applications,
          'LinkedIn Connections': student.linkedin_connections,
          'LinkedIn Posts': student.linkedin_posts,
          'GitHub Completion (%)': student.github_completion,
          'Last Activity': student.last_activity
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Report');
      
      const fileName = `students_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Success',
        description: 'Students report exported successfully'
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'Error',
        description: 'Failed to export students report',
        variant: 'destructive'
      });
    }
  };

  return {
    batches,
    loading,
    refreshData: fetchInstituteStudents,
    exportToExcel
  };
};