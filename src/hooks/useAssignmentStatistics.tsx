import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useCareerLevelProgram } from './useCareerLevelProgram';

interface AssignmentStatistics {
  total: number;
  available: number;
  completed: number;
}

export const useAssignmentStatistics = () => {
  const { user } = useAuth();
  const { getAssignmentsWithProgress } = useCareerLevelProgram();
  const [statistics, setStatistics] = useState<AssignmentStatistics>({
    total: 0,
    available: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAssignmentStatistics = useCallback(async () => {
    if (!user) {
      setStatistics({ total: 0, available: 0, completed: 0 });
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching assignment statistics...');
    setLoading(true);
    try {
      // Get assignments with progress from career level program
      const assignments = await getAssignmentsWithProgress();
      
      if (!assignments || assignments.length === 0) {
        setStatistics({ total: 0, available: 0, completed: 0 });
        setLoading(false);
        return;
      }

      // Calculate statistics based on assignment status and user attempts
      let available = 0;
      let completed = 0;

      assignments.forEach((assignment: any) => {
        // Check if assignment is completed based on user attempts
        const isCompleted = assignment.userAttempts && assignment.userAttempts.some((attempt: any) => 
          attempt.status === 'submitted' || attempt.status === 'auto_submitted'
        );

        if (isCompleted) {
          completed++;
        } else if (assignment.status === 'open') {
          available++;
        }
      });

      const total = assignments.length;

      console.log('📊 Assignment statistics calculated:', {
        total,
        available,
        completed,
        assignmentsCount: assignments.length
      });

      setStatistics({
        total,
        available,
        completed
      });
    } catch (error) {
      console.error('❌ Error fetching assignment statistics:', error);
      setStatistics({ total: 0, available: 0, completed: 0 });
    } finally {
      console.log('✅ Assignment statistics fetch completed');
      setLoading(false);
    }
  }, [user, getAssignmentsWithProgress]);

  useEffect(() => {
    fetchAssignmentStatistics();
  }, [fetchAssignmentStatistics]);

  return {
    statistics,
    loading,
    refetch: fetchAssignmentStatistics
  };
};