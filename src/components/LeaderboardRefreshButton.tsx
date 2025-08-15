import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { toast } from 'sonner';

export const LeaderboardRefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshLeaderboard } = useLeaderboard();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLeaderboard();
      toast.success('Leaderboard refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      toast.error('Failed to refresh leaderboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
    >
      {isRefreshing ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Leaderboard
        </>
      )}
    </Button>
  );
};