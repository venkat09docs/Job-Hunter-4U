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
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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
      default:
        return 'General';
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on action_url first, then fallback to type-based routing
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      // Enhanced type-based navigation with new notification types
      switch (notification.type) {
        case 'new_job_posted':
        case 'job_application_reminder':
        case 'job_search_results':
        case 'job_match_found':
          navigate('/dashboard/job-search');
          break;
        case 'follow_up_reminder':
        case 'job_status_stale':
          navigate('/dashboard/job-tracker');
          break;
        case 'assignment_completed':
        case 'assignment_due_soon':
          navigate('/dashboard/career-assignments');
          break;
        case 'points_milestone':
        case 'achievement_unlocked':
        case 'milestone_reached':
        case 'leaderboard_position':
          navigate('/dashboard/leaderboard-points');
          break;
        case 'github_streak_achieved':
        case 'github_activity_reminder':
          navigate('/dashboard/github-activity-tracker');
          break;
        case 'linkedin_milestone':
        case 'linkedin_progress_update':
          navigate('/dashboard/linkedin-optimization');
          break;
        case 'profile_completion_reminder':
        case 'resume_progress_update':
          navigate('/dashboard/build-my-profile');
          break;
        case 'subscription_expiring':
          navigate('/dashboard/manage-subscriptions');
          break;
        case 'learning_goal_reminder':
        case 'skill_assessment_due':
        case 'level_up_daily_reminder':
          navigate('/dashboard/level-up');
          break;
        case 'interview_preparation':
          navigate('/dashboard/career-growth');
          break;
        case 'weekly_progress_summary':
        case 'monthly_progress_report':
        case 'system_maintenance':
        case 'feature_announcement':
          navigate('/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
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