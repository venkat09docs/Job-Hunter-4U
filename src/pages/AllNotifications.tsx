import { ArrowLeft, Bell, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function AllNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'job_hunting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'assignments':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'achievements':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'technical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'networking':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'profile':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'subscription':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">View all the notifications</h1>
          <p className="text-muted-foreground">
            Manage and view all your notifications in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {notifications.length} Total
          </Badge>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={markAllAsRead} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Mark All as Read
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              When you receive notifications, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.is_read ? 'border-primary/50 bg-primary/5' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-medium ${
                        !notification.is_read ? 'text-primary' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </h3>
                      
                      {/* Priority indicator */}
                      {notification.priority === 'high' && (
                        <div className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0" />
                      )}
                      
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {notification.scheduled_for && (
                        <span>
                          Scheduled: {formatDistanceToNow(new Date(notification.scheduled_for), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {/* Category badge */}
                    <Badge className={getCategoryColor(notification.category)}>
                      {getCategoryLabel(notification.category)}
                    </Badge>
                    
                    {/* Status indicator */}
                    <div className="flex items-center gap-1">
                      {notification.is_read ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Check className="h-3 w-3" />
                          <span>Read</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <div className="h-2 w-2 bg-primary rounded-full" />
                          <span>Unread</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              {index < notifications.length - 1 && <Separator />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}