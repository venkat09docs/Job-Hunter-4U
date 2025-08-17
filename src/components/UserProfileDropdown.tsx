import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Trophy, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { PointsHistoryDialog } from '@/components/PointsHistoryDialog';
import { NotificationBell } from '@/components/NotificationBell';

export function UserProfileDropdown() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { leaderboard } = useLeaderboard();
  const [open, setOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);

  // Get current user's points - prioritize from current_user_points, fallback to finding in current_week array
  const userPoints = leaderboard.current_user_points?.current_week || 
                    leaderboard.current_week?.find(entry => entry.user_id === user?.id)?.total_points || 0;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-auto px-2 gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_image_url || ""} />
              <AvatarFallback className="text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">
              {profile?.username || user?.email?.split('@')[0] || 'User'}
            </span>
            <Badge variant="secondary" className="ml-2 gap-1">
              <Trophy className="h-3 w-3" />
              {userPoints}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_image_url || ""} />
              <AvatarFallback className="text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm">
                {profile?.username || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPointsDialogOpen(true)} className="gap-2 cursor-pointer">
            <Trophy className="h-4 w-4" />
            Points History
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/dashboard/notification-preferences" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <PointsHistoryDialog 
        open={pointsDialogOpen} 
        onOpenChange={setPointsDialogOpen} 
      />
    </>
  );
}