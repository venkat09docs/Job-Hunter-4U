import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { useOptimizedLeaderboard, LeaderboardEntry } from '@/hooks/useOptimizedLeaderboard';
import { Skeleton } from '@/components/ui/skeleton';
import { LeaderboardRefreshButton } from '@/components/LeaderboardRefreshButton';
import { useRole } from '@/hooks/useRole';
import { AdminPointsHistoryDialog } from '@/components/AdminPointsHistoryDialog';

const LeaderBoard = () => {
  const { leaderboard, loading } = useOptimizedLeaderboard();
  const { isAdmin } = useRole();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2: return <Medal className="h-4 w-4 text-gray-400" />;
      case 3: return <Award className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const canViewDetails = isAdmin;
    
    return (
      <div 
        key={entry.user_id} 
        className={`flex items-center gap-3 p-3 rounded-lg ${canViewDetails ? 'hover:bg-muted/50 cursor-pointer' : 'hover:bg-muted/50'}`}
        onClick={() => canViewDetails ? setSelectedUserId(entry.user_id) : undefined}
      >
        <div className="flex items-center justify-center w-8 flex-shrink-0">
          {getRankIcon(entry.rank_position)}
        </div>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={entry.profile_image_url} alt={entry.full_name} />
          <AvatarFallback className="text-xs">
            {entry.full_name?.charAt(0) || entry.username?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium truncate leading-tight">
            {entry.full_name || entry.username}
          </p>
          <p className="text-xs text-muted-foreground truncate leading-tight">
            @{entry.username}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {entry.total_points} pts
          </Badge>
        </div>
      </div>
    );
  };

  const renderLeaderboardCard = (title: string, entries: LeaderboardEntry[], icon: React.ReactNode, cardTheme: string) => (
    <Card className={cardTheme}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            ))
          ) : entries.length > 0 ? (
            entries.map(renderLeaderboardEntry)
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Leader Board</h2>
            <p className="text-muted-foreground">
              Top performers based on their activities and engagement
            </p>
          </div>
          <LeaderboardRefreshButton />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {renderLeaderboardCard(
          'Top Performer',
          leaderboard.top_performer,
          <Trophy className="h-4 w-4 text-yellow-600" />,
          'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        )}
        {renderLeaderboardCard(
          'Current Week',
          leaderboard.current_week,
          <Medal className="h-4 w-4 text-blue-600" />,
          'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800'
        )}
        {renderLeaderboardCard(
          'Last 30 Days',
          leaderboard.last_30_days,
          <Award className="h-4 w-4 text-green-600" />,
          'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800'
        )}
      </div>

      {selectedUserId && (
        <AdminPointsHistoryDialog
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
          userId={selectedUserId}
        />
      )}
    </div>
  );
};

export default LeaderBoard;