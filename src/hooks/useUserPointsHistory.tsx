import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserActivityPoint {
  id: string;
  user_id: string;
  activity_id: string;
  activity_type: string;
  points_earned: number;
  activity_date: string;
  created_at: string;
  activity_settings?: {
    activity_name: string;
    description: string;
    category: string;
  };
}

export const useUserPointsHistory = () => {
  const [pointsHistory, setPointsHistory] = useState<UserActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserPointsHistory();
    }
  }, [user]);

  const fetchUserPointsHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch user's activity points
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity_points')
        .select('*')
        .eq('user_id', user?.id)
        .order('activity_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (activityError) {
        console.error('Error fetching user activity points:', activityError);
        throw activityError;
      }

      console.log('User activity points fetched:', activityData);

      // If we have activity data, fetch the corresponding activity settings
      let settingsData: any[] = [];
      if (activityData && activityData.length > 0) {
        const activityIds = [...new Set(activityData.map(item => item.activity_id))];
        
        const { data: settings, error: settingsError } = await supabase
          .from('activity_point_settings')
          .select('activity_id, activity_name, description, category')
          .in('activity_id', activityIds);

        if (settingsError) {
          console.error('Error fetching activity settings:', settingsError);
        } else {
          settingsData = settings || [];
        }
      }

      // For career task completions, fetch additional details
      const careerTaskIds = activityData?.filter(item => 
        item.activity_type === 'career_task_completion'
      ).map(item => item.activity_id) || [];

      let careerTaskDetails: any[] = [];
      if (careerTaskIds.length > 0) {
        const { data: taskDetails, error: taskError } = await supabase
          .from('career_task_assignments')
          .select(`
            id,
            career_task_templates(
              title,
              sub_categories(
                name
              )
            )
          `)
          .in('id', careerTaskIds);

        if (taskError) {
          console.error('Error fetching career task details:', taskError);
        } else {
          careerTaskDetails = taskDetails || [];
          console.log('Career task details fetched:', careerTaskDetails);
        }
      }

      // Transform the data and combine with settings
      const transformedData: UserActivityPoint[] = activityData?.map(item => {
        const settings = settingsData.find(s => s.activity_id === item.activity_id);
        
        // For career task completions, use the template and subcategory data
        if (item.activity_type === 'career_task_completion') {
          const taskDetail = careerTaskDetails.find(task => task.id === item.activity_id);
          console.log('Full item data:', item);
          console.log('Task detail found:', taskDetail);
          console.log('All career task details:', careerTaskDetails);
          
          if (taskDetail && taskDetail.career_task_templates) {
            const template = taskDetail.career_task_templates;
            const subcategory = template.sub_categories;
            
            console.log('Template data:', template);
            console.log('Subcategory data:', subcategory);
            
            return {
              id: item.id,
              user_id: item.user_id,
              activity_id: item.activity_id,
              activity_type: item.activity_type,
              points_earned: item.points_earned,
              activity_date: item.activity_date,
              created_at: item.created_at,
              activity_settings: {
                activity_name: template.title || `Task ${item.activity_id}`,
                description: `Completed ${template.title || 'career task'}`,
                category: subcategory?.name || 'Career Task'
              }
            };
          }
          
          // Fallback if no task detail found
          return {
            id: item.id,
            user_id: item.user_id,
            activity_id: item.activity_id,
            activity_type: item.activity_type,
            points_earned: item.points_earned,
            activity_date: item.activity_date,
            created_at: item.created_at,
            activity_settings: {
              activity_name: `Task ${item.activity_id.substring(0, 8)}...`,
              description: 'Career task completed',
              category: 'Career Task'
            }
          };
        }
        
        // For other activity types, use the settings data
        return {
          id: item.id,
          user_id: item.user_id,
          activity_id: item.activity_id,
          activity_type: item.activity_type,
          points_earned: item.points_earned,
          activity_date: item.activity_date,
          created_at: item.created_at,
          activity_settings: settings ? {
            activity_name: settings.activity_name,
            description: settings.description,
            category: settings.category
          } : {
            activity_name: `Activity ${item.activity_id}`,
            description: 'Activity completed',
            category: 'General'
          }
        };
      }) || [];

      setPointsHistory(transformedData);

      // Calculate total points
      const total = transformedData.reduce((sum, entry) => sum + entry.points_earned, 0);
      setTotalPoints(total);

    } catch (error) {
      console.error('Error fetching user points history:', error);
      toast.error('Failed to load points history');
    } finally {
      setLoading(false);
    }
  };

  return {
    pointsHistory,
    loading,
    totalPoints,
    refreshPointsHistory: fetchUserPointsHistory
  };
};