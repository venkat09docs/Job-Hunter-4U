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
import { JobPipelineKanban } from '@/components/JobPipelineKanban';
import PremiumProtectedRoute from '@/components/PremiumProtectedRoute';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { AssignmentCardSkeleton } from '@/components/SkeletonLoaders';
import { useTranslation } from '@/i18n';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Target, 
  Trophy, 
  Calendar, 
  TrendingUp,
  Zap,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  BarChart3,
  Lock,
  Briefcase
} from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';

export const JobHuntingAssignments: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      <PremiumProtectedRoute featureKey="job_hunting_assignments">
        <div className="min-h-screen flex flex-col w-full bg-gradient-hero">
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-7 w-80 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <AssignmentCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </PremiumProtectedRoute>
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
            
            {/* Premium Feature Notice */}
            {!canAccessFeature("job_hunting_assignments") && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Lock className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-800">Premium Feature</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Job Hunter Assignments & Tracking is available for premium subscribers. You can view the interface but cannot modify or submit tasks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
                        disabled={!canAccessFeature("job_hunting_assignments")}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate Tasks
                        {!canAccessFeature("job_hunting_assignments") && <Lock className="h-3 w-3 ml-1" />}
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
                {/* Weekly Progress Overview */}
                <Card className="shadow-elegant border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Job Hunting Weekly Progress
                    </CardTitle>
                    <CardDescription>
                      Track your job search activities and maintain consistent application habits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Overall Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {weekProgress.completed} / {weekProgress.total} completed
                          </span>
                        </div>
                        <Progress 
                          value={weekProgress.total > 0 ? (weekProgress.completed / weekProgress.total) * 100 : 0} 
                          className="h-3" 
                        />
                      </div>
                      <Badge variant={weekProgress.total > 0 && weekProgress.completed === weekProgress.total ? "default" : "secondary"} className="text-lg px-3 py-1">
                        {weekProgress.total > 0 ? Math.round((weekProgress.completed / weekProgress.total) * 100) : 0}%
                      </Badge>
                    </div>
                    
                    {weekProgress.total > 0 && weekProgress.completed === weekProgress.total && (
                      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          Excellent work! You've completed all weekly job hunting tasks!
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Task Categories */}
                <div className="space-y-6">
                  {/* Application Activities */}
                  <Card className="shadow-elegant">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Application Activities
                        <Badge variant="outline" className="ml-auto">
                          {filteredAssignments.filter(a => a.template?.category === 'application' && a.status === 'verified').length} / {filteredAssignments.filter(a => a.template?.category === 'application').length}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Weekly job application quotas and application-related tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredAssignments.filter(a => a.template?.category === 'application').length > 0 ? (
                        <JobHunterAssignments 
                          weekProgress={weekProgress}
                          assignments={filteredAssignments.filter(a => a.template?.category === 'application')}
                          initializeUserWeek={canAccessFeature("job_hunting_assignments") ? initializeUserWeek : () => {}}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No application tasks assigned this week</p>
                          <Button
                            onClick={initializeUserWeek}
                            disabled={!canAccessFeature("job_hunting_assignments")}
                            className="mt-4"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate Weekly Tasks
                            {!canAccessFeature("job_hunting_assignments") && <Lock className="h-4 w-4 ml-2" />}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>


                  {/* All Tasks Section (fallback) */}
                  {filteredAssignments.length > 0 && (
                    <Card className="shadow-elegant">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-gray-600" />
                          All Weekly Tasks
                        </CardTitle>
                        <CardDescription>
                          Complete overview of all assigned tasks for this week
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <JobHunterAssignments 
                          weekProgress={weekProgress}
                          assignments={filteredAssignments}
                          initializeUserWeek={canAccessFeature("job_hunting_assignments") ? initializeUserWeek : () => {}}
                        />
                      </CardContent>
                     </Card>
                   )}

                   {/* Job Pipeline - Single Instance */}
                   <Card className="shadow-elegant">
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <Briefcase className="h-5 w-5 text-orange-600" />
                         Job Pipeline
                       </CardTitle>
                       <CardDescription>
                         Track your job applications through different stages of the hiring process
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <JobPipelineKanban />
                     </CardContent>
                   </Card>
                 </div>
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