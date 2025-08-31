import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, Trophy, Bell, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

  // Get current user's total points earned so far (all time)
  const userPoints = leaderboard.current_user_points?.all_time || 0;

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
      <div className="flex items-center gap-3">
        <NotificationBell />
        <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_image_url || ""} />
              <AvatarFallback className="text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
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
                {profile?.industry && ` (${profile.industry})`}
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
          <DropdownMenuItem asChild>
            <a 
              href="https://members.risenshinetechnologies.com/communities/groups/job-hunting-pro/home" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help/Support
            </a>
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