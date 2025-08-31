import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_hunting':
        return 'bg-blue-100 text-blue-800';
      case 'assignments':
        return 'bg-green-100 text-green-800';
      case 'achievements':
        return 'bg-yellow-100 text-yellow-800';
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'networking':
        return 'bg-pink-100 text-pink-800';
      case 'profile':
        return 'bg-indigo-100 text-indigo-800';
      case 'subscription':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'job_hunting':
        return 'Jobs';
      case 'assignments':
        return 'Tasks';
      case 'achievements':
        return 'Points';
      case 'technical':
        return 'GitHub';
      case 'networking':
        return 'LinkedIn';
      case 'profile':
        return 'Profile';
      case 'subscription':
        return 'Plan';
      case 'ai_tools':
        return 'AI';
      case 'github':
        return 'GitHub';
      case 'reminder':
        return 'Reminder';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Info';
      default:
        return 'General';
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    await markAsRead(notification.id);

    // Track click analytics for Phase 3
    try {
      const { error } = await supabase.rpc('track_notification_event', {
        notification_id: notification.id,
        user_id: user?.id,
        event_type: 'clicked',
        metadata: { timestamp: new Date().toISOString() }
      });
      
      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track click event:', error);
    }
    
    // Navigate based on action_url first, then fallback to type-based routing
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      // Enhanced type-based navigation with new notification types
      const typeToRouteMap: Record<string, string> = {
        // Job hunting
        'new_job_posted': '/dashboard/job-search',
        'job_application_reminder': '/dashboard/job-search',
        'job_search_results': '/dashboard/job-search',
        'job_match_found': '/dashboard/job-search',
        'follow_up_reminder': '/dashboard/job-tracker',
        'job_status_stale': '/dashboard/job-tracker',
        
        // Assignments & Tasks
        'assignment_completed': '/dashboard/career-assignments',
        'assignment_due_soon': '/dashboard/career-assignments',
        
        // Achievements & Points
        'points_milestone': '/dashboard/leaderboard-points',
        'achievement_unlocked': '/dashboard/leaderboard-points',
        'milestone_reached': '/dashboard/leaderboard-points',
        'leaderboard_position': '/dashboard/leaderboard-points',
        
        // GitHub notifications (Phase 2)
        'github_weekly_completed': '/dashboard/github-activity-tracker',
        'github_streak_milestone': '/dashboard/github-activity-tracker',
        'github_task_reminder': '/dashboard/github-activity-tracker',
        'github_pr_merged': '/dashboard/github-activity-tracker',
        'github_repo_milestone': '/dashboard/github-activity-tracker',
        'github_streak_achieved': '/dashboard/github-activity-tracker',
        'github_activity_reminder': '/dashboard/github-activity-tracker',
        
        // LinkedIn notifications (Phase 2)  
        'linkedin_weekly_completed': '/dashboard/linkedin-optimization',
        'linkedin_connection_milestone': '/dashboard/linkedin-optimization',
        'linkedin_task_reminder': '/dashboard/linkedin-optimization',
        'linkedin_post_engagement': '/dashboard/linkedin-optimization',
        'linkedin_milestone': '/dashboard/linkedin-optimization',
        'linkedin_progress_update': '/dashboard/linkedin-optimization',
        
        // AI Tools notifications (Phase 2)
        'ai_tool_used': '/dashboard',
        'ai_credits_low': '/dashboard/manage-subscriptions',
        'ai_monthly_summary': '/dashboard',
        'ai_new_tool_available': '/dashboard',
        
        // Profile & Resume
        'profile_completion_reminder': '/dashboard/build-my-profile',
        'resume_progress_update': '/dashboard/build-my-profile',
        
        // Subscription
        'subscription_expiring': '/dashboard/manage-subscriptions',
        
        // Learning & Development
        'learning_goal_reminder': '/dashboard/level-up',
        'skill_assessment_due': '/dashboard/level-up',
        'level_up_daily_reminder': '/dashboard/level-up',
        'interview_preparation': '/dashboard/career-growth',
        
        // General
        'weekly_progress_summary': '/dashboard',
        'monthly_progress_report': '/dashboard',
        'system_maintenance': '/dashboard',
        'feature_announcement': '/dashboard'
      };
      
      const route = typeToRouteMap[notification.type] || '/dashboard';
      navigate(route);
    }
  };

  const handleViewAllClick = () => {
    navigate('/dashboard/notification-preferences');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-auto p-1"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer focus:bg-muted"
                onClick={() => handleNotificationClick(notification)}
              >
                 <div className="flex flex-col gap-1 w-full">
                   <div className="flex items-start justify-between gap-2">
                     <p className="text-sm font-medium leading-tight">
                       {notification.title}
                     </p>
                     <div className="flex items-center gap-1">
                       {/* Priority indicator */}
                       {notification.priority === 'high' && (
                         <div className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0" />
                       )}
                       {/* Category badge */}
                       <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(notification.category)}`}>
                         {getCategoryLabel(notification.category)}
                       </span>
                       {/* Unread indicator */}
                       {!notification.is_read && (
                         <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                       )}
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground leading-tight">
                     {notification.message}
                   </p>
                   <p className="text-xs text-muted-foreground">
                     {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                   </p>
                 </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center justify-center cursor-pointer"
          onClick={handleViewAllClick}
        >
          <span className="text-sm font-medium">Manage Notification Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}