import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Activity, Star } from "lucide-react";
import { useUserPointsHistory } from "@/hooks/useUserPointsHistory";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";

export default function PointsHistory() {
  const { pointsHistory, loading, totalPoints } = useUserPointsHistory();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                <CardTitle>My Points History</CardTitle>
              </div>
              <CardDescription>
                Track your activity points and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle>My Points History</CardTitle>
            </div>
            <CardDescription>
              Track your activity points and achievements
            </CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="gap-1 text-lg px-3 py-1">
                <Star className="h-4 w-4" />
                Total Points: {totalPoints}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pointsHistory.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No Activity Points Yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start completing activities to earn points and track your progress!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pointsHistory.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          {entry.activity_settings?.activity_name || entry.activity_id}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(entry.activity_date), 'MMM dd, yyyy')}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="capitalize">
                            {entry.activity_settings?.category || 'General'}
                          </span>
                        </div>
                        {entry.activity_settings?.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {entry.activity_settings.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        +{entry.points_earned}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(entry.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}