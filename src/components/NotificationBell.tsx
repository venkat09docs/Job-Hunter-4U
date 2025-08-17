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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'profile_completion_reminder':
      case 'resume_progress_update':
        navigate('/dashboard/build-my-profile');
        break;
      case 'linkedin_progress_update':
        navigate('/dashboard/linkedin-optimization');
        break;
      case 'github_activity_reminder':
        navigate('/dashboard/github-activity-tracker');
        break;
      case 'job_search_results':
      case 'job_application_reminder':
      case 'new_job_posted':
      case 'job_match_found':
        navigate('/dashboard/job-search');
        break;
      case 'follow_up_reminder':
        navigate('/dashboard/job-tracker');
        break;
      case 'interview_preparation':
        navigate('/dashboard/career-growth');
        break;
      case 'learning_goal_reminder':
      case 'skill_assessment_due':
        navigate('/dashboard/level-up');
        break;
      case 'achievement_unlocked':
      case 'milestone_reached':
      case 'leaderboard_position':
        navigate('/dashboard/leaderboard-points');
        break;
      case 'weekly_progress_summary':
      case 'monthly_progress_report':
        navigate('/dashboard');
        break;
      case 'system_maintenance':
      case 'feature_announcement':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
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
                    {!notification.is_read && (
                      <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                    )}
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