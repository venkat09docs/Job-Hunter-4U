import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobHunterAssignments } from '@/components/JobHunterAssignments';
import { JobHunterHistory } from '@/components/JobHunterHistory';
import { JobHunterSettings } from '@/components/JobHunterSettings';
import PremiumProtectedRoute from '@/components/PremiumProtectedRoute';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Target, 
  Trophy, 
  Calendar, 
  TrendingUp,
  Users,
  Award,
  Zap,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  BarChart3
} from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';

export const JobHuntingAssignments: React.FC = () => {
  const { user } = useAuth();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { 
    assignments, 
    templates, 
    streaks, 
    loading,
    initializeUserWeek,
    getWeekProgress,
    getTasksByCategory,
    getTotalPoints
  } = useJobHuntingAssignments();

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const weekProgress = getWeekProgress();
  const taskCategories = getTasksByCategory();
  const totalPoints = getTotalPoints();

  // Get current week dates
  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(currentWeek, 6);

  // Filter assignments based on active filter
  const filteredAssignments = assignments.filter(assignment => {
    switch (activeFilter) {
      case 'pending': return assignment.status === 'assigned' || assignment.status === 'in_progress';
      case 'submitted': return assignment.status === 'submitted';
      case 'completed': return assignment.status === 'verified';
      case 'overdue': return new Date(assignment.due_date) < new Date() && assignment.status !== 'verified';
      default: return true;
    }
  });

  const getStreakByType = (type: string) => {
    return streaks.find(s => s.streak_type === type);
  };

  if (loading || premiumLoading) {
    return (
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <PremiumProtectedRoute featureKey="job_hunting_assignments">
      <div className="min-h-screen flex flex-col w-full bg-gradient-hero">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Hunter – Assignments & Tracking
                </h1>
                <p className="text-muted-foreground text-sm">
                  Weekly tasks, pipeline tracking, and progress verification
                </p>
              </div>
            </div>
            <UserProfileDropdown />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Week Progress</p>
                      <p className="text-2xl font-bold">
                        {weekProgress.completed}/{weekProgress.total}
                      </p>
                      <Progress 
                        value={weekProgress.total > 0 ? (weekProgress.completed / weekProgress.total) * 100 : 0} 
                        className="mt-2 h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                      <p className="text-2xl font-bold">{totalPoints}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        +{weekProgress.totalPoints} this week
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Application Streak</p>
                      <p className="text-2xl font-bold">
                        {getStreakByType('daily_application')?.current_streak || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Best: {getStreakByType('daily_application')?.longest_streak || 0} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Week</p>
                      <p className="text-sm font-bold">
                        {format(currentWeek, 'MMM d')} - {format(weekEnd, 'MMM d')}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs"
                        onClick={initializeUserWeek}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate Tasks
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="assignments" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Assignments Tab - Weekly quotas + Per-job tasks + Pipeline */}
              <TabsContent value="assignments" className="space-y-6">
                <JobHunterAssignments 
                  weekProgress={weekProgress}
                  assignments={filteredAssignments}
                  initializeUserWeek={initializeUserWeek}
                />
              </TabsContent>

              {/* History Tab - Period summaries, audit trail */}
              <TabsContent value="history" className="space-y-6">
                <JobHunterHistory />
              </TabsContent>

              {/* Settings Tab - Email auto-verify setup, data controls */}
              <TabsContent value="settings" className="space-y-6">
                <JobHunterSettings />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PremiumProtectedRoute>
  );
};