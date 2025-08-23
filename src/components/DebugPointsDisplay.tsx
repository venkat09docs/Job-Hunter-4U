import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserActivityPoint {
  id: string;
  user_id: string;
  activity_id: string;
  activity_type: string;
  points_earned: number;
  activity_date: string;
  created_at: string;
}

export const DebugPointsDisplay: React.FC = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserActivityPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPoints();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchPoints = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity_points')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('🔍 Debug: Fetched points from database:', data);
      setPoints(data || []);
      
      const total = data?.reduce((sum, p) => sum + p.points_earned, 0) || 0;
      setTotalPoints(total);
      
      toast.success(`Loaded ${data?.length || 0} recent point entries`);
    } catch (error) {
      console.error('Error fetching points:', error);
      toast.error('Failed to fetch points');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('debug-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_activity_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔄 Debug: Real-time points change detected:', payload);
          setRealTimeEnabled(true);
          
          // Refresh points when changes occur
          setTimeout(() => {
            fetchPoints();
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('🔄 Debug: Points subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setRealTimeEnabled(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const testPointsInsertion = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const testData = {
        user_id: user.id,
        activity_type: 'debug_test',
        activity_id: `debug_test_${Date.now()}`,
        points_earned: 1,
        activity_date: new Date().toISOString().split('T')[0]
      };

      console.log('🔍 Debug: Testing points insertion with data:', testData);

      const { data, error } = await supabase
        .from('user_activity_points')
        .insert(testData)
        .select();

      if (error) {
        console.error('❌ Debug: Test points insertion failed:', error);
        toast.error(`Test insertion failed: ${error.message}`);
      } else {
        console.log('✅ Debug: Test points inserted successfully:', data);
        toast.success('Test point inserted successfully!');
        fetchPoints();
      }
    } catch (error) {
      console.error('❌ Debug: Test insertion error:', error);
      toast.error('Test insertion error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Debug: Points Display
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No user logged in</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Debug: User Points ({user.email})
          <Badge variant={realTimeEnabled ? "default" : "secondary"}>
            {realTimeEnabled ? "Real-time ON" : "Real-time OFF"}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchPoints} 
            disabled={loading} 
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={testPointsInsertion} 
            disabled={loading} 
            size="sm"
            variant="outline"
          >
            Test Insert (+1 point)
          </Button>
          <div className="ml-auto">
            <Badge variant="default" className="text-lg">
              Total: {totalPoints} points
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {points.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No points found for this user
            </p>
          ) : (
            points.map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {point.activity_type}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground">
                      {point.activity_id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {point.activity_date} • {new Date(point.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Badge 
                  variant={point.points_earned >= 0 ? "default" : "destructive"}
                  className="ml-2"
                >
                  {point.points_earned >= 0 ? '+' : ''}{point.points_earned}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};