import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, GitCommit, GitPullRequest, AlertCircle, Trophy, ExternalLink, CheckCircle, Clock, Play, FileText } from 'lucide-react';
import { useGitHubWeekly } from '@/hooks/useGitHubWeekly';
import { formatDistanceToNow, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export const GitHubWeeklyHistory = () => {
  const { signals, scores, badges, historicalAssignments } = useGitHubWeekly();

  console.log('GitHubWeeklyHistory - historicalAssignments:', historicalAssignments);

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

  // Group historical assignments by period
  const groupAssignmentsByPeriod = (assignments: any[]) => {
    const grouped = assignments.reduce((acc, assignment) => {
      const period = assignment.period || 'No Period';
      if (!acc[period]) acc[period] = [];
      acc[period].push(assignment);
      return acc;
    }, {} as Record<string, any[]>);
    
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'SUBMITTED': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'STARTED': return <Play className="h-4 w-4 text-yellow-600" />;
      case 'PARTIALLY_VERIFIED': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STARTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PARTIALLY_VERIFIED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPeriodDate = (period: string) => {
    if (!period || period === 'No Period') return 'Ongoing';
    
    const [year, week] = period.split('-');
    if (!year || !week) return period;
    
    // Calculate the start of the week
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    const days = (parseInt(week) - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + days * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    return `Week ${week}, ${year} (${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')})`;
  };

  const groupedAssignments = groupAssignmentsByPeriod(historicalAssignments);
  console.log('Grouped assignments:', groupedAssignments);

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

          <div className="space-y-6">
            {groupedAssignments.map(([period, periodAssignments]: [string, any[]]) => (
              <div key={period} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatPeriodDate(period)}
                  <Badge variant="outline" className="ml-auto">
                    {periodAssignments.length} {periodAssignments.length === 1 ? 'assignment' : 'assignments'}
                  </Badge>
                </div>
                
                <div className="space-y-2 pl-6 border-l border-border">
                  {periodAssignments.map((assignment: any) => (
                    <Card key={assignment.id} className="border-0 shadow-none bg-secondary/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getStatusIcon(assignment.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {assignment.github_tasks?.title || 'Unknown Task'}
                            </p>
                            {assignment.github_tasks?.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {assignment.github_tasks.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <span>
                                Created {formatDistanceToNow(new Date(assignment.created_at), { addSuffix: true })}
                              </span>
                              {assignment.due_at && (
                                <span className="text-xs">
                                  • Due {formatDistanceToNow(new Date(assignment.due_at), { addSuffix: true })}
                                </span>
                              )}
                              {assignment.score_awarded > 0 && (
                                <span className="text-xs font-medium text-green-600">
                                  • +{assignment.score_awarded} points
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(assignment.status)}`}
                          >
                            {assignment.status.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {(!historicalAssignments || historicalAssignments.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Assignment History</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Complete GitHub assignments to build your activity history
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
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