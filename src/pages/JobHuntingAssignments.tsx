import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobHuntingAssignmentCard } from '@/components/JobHuntingAssignmentCard';
import { JobPipelineKanban } from '@/components/JobPipelineKanban';
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
                <TabsTrigger value="assignments">Weekly Assignments</TabsTrigger>
                <TabsTrigger value="pipeline">Job Pipeline</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Weekly Assignments Tab */}
              <TabsContent value="assignments" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">This Week's Assignments</h2>
                    <p className="text-muted-foreground text-sm">
                      Complete your weekly job hunting tasks to earn points and build streaks
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={activeFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter('all')}
                    >
                      All ({assignments.length})
                    </Button>
                    <Button
                      variant={activeFilter === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter('pending')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </Button>
                    <Button
                      variant={activeFilter === 'submitted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter('submitted')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      variant={activeFilter === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter('completed')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>

                {filteredAssignments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Target className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">No assignments yet</h3>
                          <p className="text-muted-foreground">
                            Generate your weekly assignments to start your job hunting journey
                          </p>
                        </div>
                        <Button onClick={initializeUserWeek}>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate This Week's Tasks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredAssignments.map((assignment) => (
                      <JobHuntingAssignmentCard 
                        key={assignment.id} 
                        assignment={assignment}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Job Pipeline Tab */}
              <TabsContent value="pipeline" className="space-y-6">
                <JobPipelineKanban />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Performance Analytics
                      </CardTitle>
                      <CardDescription>
                        Track your job hunting performance and streaks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Streak Cards */}
                        {['daily_application', 'weekly_research', 'follow_up'].map((streakType) => {
                          const streak = getStreakByType(streakType);
                          const icons = {
                            daily_application: Target,
                            weekly_research: Users,
                            follow_up: Award
                          };
                          const labels = {
                            daily_application: 'Application Streak',
                            weekly_research: 'Research Streak', 
                            follow_up: 'Follow-up Streak'
                          };
                          const IconComponent = icons[streakType as keyof typeof icons];
                          
                          return (
                            <div key={streakType} className="p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-3 mb-3">
                                <IconComponent className="h-5 w-5 text-primary" />
                                <h4 className="font-medium">{labels[streakType as keyof typeof labels]}</h4>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Current</span>
                                  <span className="font-semibold">{streak?.current_streak || 0} days</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Best</span>
                                  <span className="font-semibold">{streak?.longest_streak || 0} days</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Categories</CardTitle>
                      <CardDescription>
                        Available task types and their difficulty levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {Object.entries(taskCategories).map(([category, templates]) => (
                          <div key={category} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold capitalize">{category}</h4>
                              <Badge variant="outline">{templates.length} tasks</Badge>
                            </div>
                            <div className="grid gap-2">
                              {templates.map((template) => (
                                <div key={template.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                                  <span>{template.title}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline"
                                      className={
                                        template.difficulty === 'easy' ? 'border-green-300 text-green-700' :
                                        template.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                        'border-red-300 text-red-700'
                                      }
                                    >
                                      {template.difficulty}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Trophy className="h-3 w-3 text-yellow-600" />
                                      <span className="font-medium">{template.points_reward}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PremiumProtectedRoute>
  );
};