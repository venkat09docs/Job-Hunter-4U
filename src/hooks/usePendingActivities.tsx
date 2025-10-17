import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendingActivity {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  task_type?: string;
}

interface PendingActivitiesResponse {
  user_id: string;
  period: string;
  date: string;
  linkedin: {
    pending_count: number;
    tasks: PendingActivity[];
  };
  github: {
    pending_count: number;
    tasks: PendingActivity[];
  };
  job_hunter: {
    pending_count: number;
    tasks: {
      id: string;
      task_type: string;
      target_count: number;
      actual_count: number;
      status: string;
      task_date: string;
    }[];
  };
  job_applications: {
    weekly_data: any[];
  };
}

export const usePendingActivities = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-activities', user?.email],
    queryFn: async () => {
      if (!user?.email) throw new Error('User email not available');

      const { data, error } = await supabase.functions.invoke<PendingActivitiesResponse>(
        'get-pending-activities',
        {
          body: { email: user.email }
        }
      );

      if (error) {
        console.error('Error fetching pending activities:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.email,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  });
};
