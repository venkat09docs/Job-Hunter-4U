import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Users, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstituteLeaderboard } from '@/hooks/useInstituteLeaderboard';
import { useBatchLeaderboards } from '@/hooks/useBatchLeaderboards';

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  username: string;
  profile_image_url?: string;
  total_points: number;
  rank_position: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-lg font-bold w-5 text-center">{rank}</span>;
  }
};

const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
  <div key={entry.user_id} className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8">
        {getRankIcon(entry.rank_position)}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={entry.profile_image_url} alt={entry.full_name} />
        <AvatarFallback className="text-xs">
          {entry.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{entry.full_name}</span>
        <span className="text-xs text-muted-foreground">@{entry.username}</span>
      </div>
    </div>
    <div className="text-right">
      <span className="font-bold text-primary">{entry.total_points}</span>
      <span className="text-xs text-muted-foreground ml-1">pts</span>
    </div>
  </div>
);

const renderLeaderboardCard = (title: string, entries: LeaderboardEntry[], icon: React.ReactNode, loading: boolean) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-1">
          {entries.map((entry, index) => renderLeaderboardEntry(entry, index))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No data available for this period</p>
        </div>
      )}
    </CardContent>
  </Card>
);

export function InstituteLeaderBoard() {
  const { leaderboard, loading } = useInstituteLeaderboard();
  const { batchLeaderboards, loading: batchLoading } = useBatchLeaderboards();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Institute Leaderboard</h2>
        <p className="text-muted-foreground">
          Top performing students in your institute
        </p>
      </div>

      {/* Overall Institute Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderLeaderboardCard(
          "Top Performers",
          leaderboard.top_performers,
          <Trophy className="h-5 w-5 text-yellow-500" />,
          loading
        )}
        {renderLeaderboardCard(
          "Current Week",
          leaderboard.current_week,
          <Medal className="h-5 w-5 text-blue-500" />,
          loading
        )}
        {renderLeaderboardCard(
          "Last 30 Days",
          leaderboard.last_30_days,
          <Award className="h-5 w-5 text-amber-600" />,
          loading
        )}
      </div>

      {/* Batch-wise Leaderboards */}
      {batchLeaderboards.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Batch Performance</h3>
            <p className="text-muted-foreground">
              Top 5 performers from each batch (Current Week)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchLeaderboards.map((batchLeaderboard) => (
              <Card key={batchLeaderboard.batch_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    {batchLeaderboard.batch_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Code: {batchLeaderboard.batch_code}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  {batchLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-20 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  ) : batchLeaderboard.entries.length > 0 ? (
                    <div className="space-y-1">
                      {batchLeaderboard.entries.map((entry, index) => renderLeaderboardEntry(entry, index))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-sm">No activity this week</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}