import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, GitCommit, GitPullRequest, AlertCircle, Trophy, ExternalLink, CheckCircle, Clock, Play, FileText, BarChart3, TrendingUp, ChevronRight } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { formatDistanceToNow, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import React, { useState, useMemo } from 'react';

interface PeriodSummary {
  period: string;
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  maxPoints: number;
  completionRate: number;
}

export const GitHubWeeklyHistory = () => {
  const { signals, scores, badges, historicalAssignments } = useGitHubWeekly();
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  console.log('GitHubWeeklyHistory - historicalAssignments:', historicalAssignments);

  // Group assignments by period and calculate summary statistics
  const periodSummaries: PeriodSummary[] = useMemo(() => {
    const grouped = historicalAssignments.reduce((acc, assignment) => {
      const period = assignment.period || 'No Period';
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(assignment);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped)
      .map(([period, assignments]) => {
        const completedTasks = assignments.filter(a => a.status === 'VERIFIED').length;
        const totalPoints = assignments.reduce((sum, a) => sum + a.score_awarded, 0);
        const maxPoints = assignments.reduce((sum, a) => sum + (a.github_tasks?.points_base || 0), 0);
        
        return {
          period,
          totalTasks: assignments.length,
          completedTasks,
          totalPoints,
          maxPoints,
          completionRate: assignments.length > 0 ? (completedTasks / assignments.length) * 100 : 0
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period)); // Sort by period descending
  }, [historicalAssignments]);

  const getWeekDateRange = (period: string): string => {
    if (!period || period === 'No Period') return "Ongoing";
    
    try {
      const [year, week] = period.split('-').map(Number);
      if (!year || !week) return period;
      
      // Calculate the start of the week
      const firstDayOfYear = new Date(year, 0, 1);
      const days = (week - 1) * 7;
      const weekStart = new Date(firstDayOfYear.getTime() + days * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
    } catch (error) {
      console.error('Error parsing week period:', error);
      return period;
    }
  };

  // Group signals by date for better visualization
  const groupSignalsByDate = (signalsList: any[]) => {
    const grouped = signalsList.reduce((acc, signal) => {
      const date = format(new Date(signal.happened_at), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = [];
      acc[date].push(signal);
      return acc;
    }, {} as Record<string, any[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const getSignalIcon = (kind: string) => {
    switch (kind) {
      case 'COMMIT_PUSHED': return <GitCommit className="h-4 w-4" />;
      case 'PR_OPENED':
      case 'PR_MERGED': return <GitPullRequest className="h-4 w-4" />;
      case 'ISSUE_OPENED':
      case 'ISSUE_CLOSED': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getSignalColor = (kind: string) => {
    switch (kind) {
      case 'COMMIT_PUSHED': return 'text-blue-600';
      case 'PR_MERGED': return 'text-green-600';
      case 'PR_OPENED': return 'text-purple-600';
      case 'ISSUE_CLOSED': return 'text-green-600';
      case 'ISSUE_OPENED': return 'text-orange-600';
      case 'RELEASE_PUBLISHED': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatSignalTitle = (signal: any) => {
    const { kind, actor, subject } = signal;
    
    switch (kind) {
      case 'COMMIT_PUSHED':
        return `${actor} pushed commits`;
      case 'PR_OPENED':
        return `${actor} opened PR: ${subject}`;
      case 'PR_MERGED':
        return `${actor} merged PR: ${subject}`;
      case 'ISSUE_OPENED':
        return `${actor} opened issue: ${subject}`;
      case 'ISSUE_CLOSED':
        return `${actor} closed issue: ${subject}`;
      case 'RELEASE_PUBLISHED':
        return `${actor} published release: ${subject}`;
      default:
        return `${kind}: ${subject}`;
    }
  };

  const groupedSignals = groupSignalsByDate(signals);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'SUBMITTED': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'STARTED': return <Play className="h-4 w-4 text-yellow-600" />;
      case 'NOT_STARTED': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'PARTIALLY_VERIFIED': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments">Assignment History</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="scores">Weekly Scores</TabsTrigger>
          <TabsTrigger value="badges">Badges Earned</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Assignment History</h3>
            <p className="text-sm text-muted-foreground">
              Track all your GitHub assignments across different weeks and their completion status
            </p>
          </div>

          {periodSummaries.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Assignment History Yet</h3>
                  <p className="text-muted-foreground">
                    Complete some GitHub assignments to see your activity history here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Period Summaries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6" />
                    Assignment History by Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {periodSummaries.map((summary) => (
                      <div
                        key={summary.period}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPeriod(selectedPeriod === summary.period ? null : summary.period)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h4 className="font-semibold">Week {summary.period}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getWeekDateRange(summary.period)}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{summary.completedTasks}</p>
                                <p className="text-xs text-muted-foreground">Completed</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{summary.totalPoints}</p>
                                <p className="text-xs text-muted-foreground">Points</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{Math.round(summary.completionRate)}%</p>
                                <p className="text-xs text-muted-foreground">Rate</p>
                              </div>
                            </div>
                          </div>
                          <ChevronRight 
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              selectedPeriod === summary.period ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                        
                        {/* Task Details for Selected Period */}
                        {selectedPeriod === summary.period && (
                          <div className="mt-6 pt-4 border-t">
                            <h5 className="font-medium mb-4 flex items-center gap-2">
                              <Trophy className="w-4 h-4" />
                              Tasks for Week {summary.period}
                            </h5>
                            <div className="grid gap-3">
                              {historicalAssignments
                                .filter(assignment => assignment.period === summary.period)
                                .map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-3 bg-background border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    {getStatusIcon(assignment.status)}
                                    <div>
                                      <p className="font-medium text-sm">{assignment.github_tasks?.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Updated: {format(new Date(assignment.updated_at), 'MMM dd, yyyy at h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-sm font-medium">
                                        {assignment.score_awarded} / {assignment.github_tasks?.points_base || 0} pts
                                      </p>
                                    </div>
                                    <Badge variant={assignment.status === 'VERIFIED' ? 'default' : 'outline'}>
                                      {assignment.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Overall Statistics */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      Total Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-primary">
                      {periodSummaries.reduce((sum, p) => sum + p.totalPoints, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Across {periodSummaries.length} weeks
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Tasks Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">
                      {periodSummaries.reduce((sum, p) => sum + p.completedTasks, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Out of {periodSummaries.reduce((sum, p) => sum + p.totalTasks, 0)} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Average Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">
                      {Math.round(
                        periodSummaries.reduce((sum, p) => sum + p.completionRate, 0) / 
                        (periodSummaries.length || 1)
                      )}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Completion rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">GitHub Activity Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Real-time feed of your GitHub activities across tracked repositories
            </p>
          </div>

          <div className="space-y-6">
            {groupedSignals.map(([date, daySignals]: [string, any[]]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(date), 'EEEE, MMMM do, yyyy')}
                  <Badge variant="outline" className="ml-auto">
                    {daySignals.length} {daySignals.length === 1 ? 'activity' : 'activities'}
                  </Badge>
                </div>
                
                <div className="space-y-2 pl-6 border-l border-border">
                  {daySignals.map((signal: any) => (
                    <Card key={signal.id} className="border-0 shadow-none bg-secondary/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${getSignalColor(signal.kind)}`}>
                            {getSignalIcon(signal.kind)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {formatSignalTitle(signal)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>
                                {formatDistanceToNow(new Date(signal.happened_at), { addSuffix: true })}
                              </span>
                              {signal.link && (
                                <a 
                                  href={signal.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {signal.kind.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {signals?.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Activity Yet</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Set up webhooks on your repositories to start tracking activity
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Weekly Point Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Track your GitHub performance and points earned each week
            </p>
          </div>

          <div className="grid gap-4">
            {scores ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {scores.points_total} Total Points
                  </CardTitle>
                  <CardDescription>
                    Period: {scores.period}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scores.breakdown && typeof scores.breakdown === 'object' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Point Breakdown</h4>
                      <div className="grid gap-2 text-sm">
                        {Object.entries(scores.breakdown).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace('_', ' ')}
                            </span>
                            <span className="font-medium">+{value as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Scores Yet</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Complete GitHub tasks to start earning weekly points
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Achievement Badges</h3>
            <p className="text-sm text-muted-foreground">
              Badges earned through consistent GitHub activity and milestones
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {badges?.map((userBadge) => (
              <Card key={userBadge.id} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {userBadge.github_badges?.icon && (
                      <div className="text-2xl">
                        {userBadge.github_badges.icon}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {userBadge.github_badges?.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Earned {formatDistanceToNow(new Date(userBadge.awarded_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {userBadge.github_badges?.criteria && (
                    <p className="text-sm text-muted-foreground">
                      {JSON.stringify(userBadge.github_badges.criteria)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {badges?.length === 0 && (
              <div className="md:col-span-2">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Badges Yet</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Keep completing GitHub tasks to unlock achievement badges
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};