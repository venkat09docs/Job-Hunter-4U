import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  category: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationCategory {
  category: string;
  preferences: NotificationPreference[];
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('notification_type', { ascending: true });

      if (error) throw error;

      setPreferences(data || []);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (notificationType: string, isEnabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ 
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('notification_type', notificationType);

      if (error) throw error;

      setPreferences(prev => 
        prev.map(pref => 
          pref.notification_type === notificationType 
            ? { ...pref, is_enabled: isEnabled }
            : pref
        )
      );

      toast({
        title: 'Success',
        description: `Notification preference updated successfully`,
      });
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preference',
        variant: 'destructive'
      });
    }
  };

  const toggleAll = async (category: string, isEnabled: boolean) => {
    if (!user) return;

    try {
      const categoryPrefs = preferences.filter(pref => pref.category === category);
      
      const { error } = await supabase
        .from('notification_preferences')
        .update({ 
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('notification_type', categoryPrefs.map(p => p.notification_type));

      if (error) throw error;

      setPreferences(prev => 
        prev.map(pref => 
          pref.category === category 
            ? { ...pref, is_enabled: isEnabled }
            : pref
        )
      );

      toast({
        title: 'Success',
        description: `All ${category.replace('_', ' ')} notifications ${isEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating category preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category preferences',
        variant: 'destructive'
      });
    }
  };

  const getPreferencesByCategory = (): NotificationCategory[] => {
    const categories = [...new Set(preferences.map(p => p.category))];
    return categories.map(category => ({
      category,
      preferences: preferences.filter(p => p.category === category)
    }));
  };

  const getCategoryDisplayName = (category: string): string => {
    const displayNames: { [key: string]: string } = {
      'profile_progress': 'Profile & Progress',
      'job_search': 'Job Search',
      'job_opportunities': 'Job Opportunities',
      'learning': 'Learning & Goals',
      'achievements': 'Achievements',
      'reports': 'Reports & Analytics',
      'system': 'System Updates',
      'student_management': 'Student Management',
      'batch_management': 'Batch Management',
      'subscription': 'Subscription',
      'institute_management': 'Institute Management',
      'customer_management': 'Customer Management',
      'system_monitoring': 'System Monitoring',
      'business_metrics': 'Business Metrics',
      'job_management': 'Job Management',
      'candidate_management': 'Candidate Management',
      'performance': 'Performance Reports'
    };
    return displayNames[category] || category.replace('_', ' ');
  };

  const getNotificationDisplayName = (notificationType: string): string => {
    const displayNames: { [key: string]: string } = {
      'profile_completion_reminder': 'Profile completion reminders',
      'resume_progress_update': 'Resume progress updates',
      'linkedin_progress_update': 'LinkedIn progress updates',
      'github_activity_reminder': 'GitHub activity reminders',
      'job_search_results': 'Job search results',
      'job_application_reminder': 'Job application reminders',
      'follow_up_reminder': 'Follow-up reminders',
      'interview_preparation': 'Interview preparation tips',
      'new_job_posted': 'New job postings',
      'job_match_found': 'Job matches found',
      'learning_goal_reminder': 'Learning goal reminders',
      'skill_assessment_due': 'Skill assessment due dates',
      'achievement_unlocked': 'Achievement unlocked',
      'milestone_reached': 'Milestone reached',
      'leaderboard_position': 'Leaderboard position changes',
      'weekly_progress_summary': 'Weekly progress summaries',
      'monthly_progress_report': 'Monthly progress reports',
      'system_maintenance': 'System maintenance alerts',
      'feature_announcement': 'Feature announcements',
      'new_student_enrollment': 'New student enrollments',
      'student_progress_alert': 'Student progress alerts',
      'low_engagement_student': 'Low engagement student alerts',
      'student_milestone_achieved': 'Student milestone achievements',
      'batch_completion_rate': 'Batch completion rate updates',
      'batch_performance_summary': 'Batch performance summaries',
      'subscription_expiry_warning': 'Subscription expiry warnings',
      'subscription_renewed': 'Subscription renewal confirmations',
      'usage_limit_approaching': 'Usage limit warnings',
      'weekly_institute_report': 'Weekly institute reports',
      'monthly_institute_analytics': 'Monthly institute analytics',
      'new_institute_registration': 'New institute registrations',
      'institute_subscription_change': 'Institute subscription changes',
      'high_value_customer_activity': 'High-value customer activity',
      'support_ticket_escalation': 'Support ticket escalations',
      'system_performance_alert': 'System performance alerts',
      'security_breach_alert': 'Security breach alerts',
      'database_backup_status': 'Database backup status',
      'revenue_milestone': 'Revenue milestones',
      'user_growth_report': 'User growth reports',
      'churn_rate_alert': 'Churn rate alerts',
      'daily_system_summary': 'Daily system summaries',
      'weekly_business_report': 'Weekly business reports',
      'job_application_received': 'Job applications received',
      'job_posting_expiring': 'Job posting expiration alerts',
      'candidate_profile_match': 'Candidate profile matches',
      'interview_scheduled': 'Interview scheduling notifications',
      'candidate_status_update': 'Candidate status updates',
      'hiring_goal_progress': 'Hiring goal progress',
      'recruiter_performance_report': 'Recruiter performance reports'
    };
    return displayNames[notificationType] || notificationType.replace('_', ' ');
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updatePreference,
    toggleAll,
    getPreferencesByCategory,
    getCategoryDisplayName,
    getNotificationDisplayName,
    refetch: fetchPreferences
  };
}