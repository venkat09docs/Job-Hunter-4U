import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trophy,
  TrendingUp,
  ChevronRight,
  Activity,
  FileText,
  Users,
  MessageSquare,
  Link
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface HistoricalTask {
  id: string;
  period: string;
  status: 'NOT_STARTED' | 'STARTED' | 'SUBMITTED' | 'PARTIALLY_VERIFIED' | 'VERIFIED';
  score_awarded: number;
  created_at: string;
  updated_at: string;
  linkedin_tasks: {
    title: string;
    description: string;
    points_base: number;
  };
  extension_requests?: Array<{
    id: string;
    status: string;
    created_at: string;
    reason: string;
  }>;
}

interface PeriodSummary {
  period: string;
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  maxPoints: number;
  completionRate: number;
}

export const LinkedInHistoryTab = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  // Fetch all historical LinkedIn tasks for the user
  const { data: historicalTasks = [], isLoading } = useQuery({
    queryKey: ['linkedin-historical-tasks'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get linkedin user
      const { data: linkedinUser } = await supabase
        .from('linkedin_users')
        .select('id')
        .eq('auth_uid', user.user.id)
        .single();

      if (!linkedinUser) return [];

      const { data, error } = await supabase
        .from('linkedin_user_tasks')
        .select(`
          *,
          linkedin_tasks:task_id (
            title,
            description,
            points_base
          ),
          extension_requests:linkedin_task_renable_requests!user_task_id (
            id,
            status,
            created_at,
            reason
          )
        `)
        .eq('user_id', linkedinUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HistoricalTask[];
    }
  });

  // Fetch all LinkedIn evidence for the user
  const { data: evidenceHistory = [] } = useQuery({
    queryKey: ['linkedin-evidence-history'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('linkedin_evidence')
        .select(`
          *,
          linkedin_user_tasks!inner (
            user_id,
            period,
            linkedin_tasks:task_id (
              title,
              description
            )
          )
        `)
        .eq('linkedin_user_tasks.user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch LinkedIn network metrics
  const { data: networkMetrics = [] } = useQuery({
    queryKey: ['linkedin-network-metrics'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('linkedin_network_metrics')
        .select('*')
        .eq('user_id', user.user.id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch LinkedIn signals
  const { data: signals = [] } = useQuery({
    queryKey: ['linkedin-signals-history'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('linkedin_signals')
        .select('*')
        .eq('user_id', user.user.id)
        .order('happened_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    }
  });

  // Group tasks by period and calculate summary statistics
  const periodSummaries: PeriodSummary[] = React.useMemo(() => {
    const grouped = historicalTasks.reduce((acc, task) => {
      const period = task.period;
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(task);
      return acc;
    }, {} as Record<string, HistoricalTask[]>);

    return Object.entries(grouped)
      .map(([period, tasks]) => {
        // Count tasks as completed if they are VERIFIED, SUBMITTED, or have any activity (extension requests)
        const completedTasks = tasks.filter(t => 
          t.status === 'VERIFIED' || 
          t.status === 'SUBMITTED' || 
          t.status === 'PARTIALLY_VERIFIED' ||
          (t.extension_requests && t.extension_requests.length > 0)
        ).length;
        const totalPoints = tasks.reduce((sum, t) => sum + t.score_awarded, 0);
        const maxPoints = tasks.reduce((sum, t) => sum + t.linkedin_tasks.points_base, 0);
        
        return {
          period,
          totalTasks: tasks.length,
          completedTasks,
          totalPoints,
          maxPoints,
          completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
        };
      })
      .sort((a, b) => b.period.localeCompare(a.period)); // Sort by period descending
  }, [historicalTasks]);

  const getWeekDateRange = (period: string): string => {
    if (!period) return "";
    
    try {
      const [year, week] = period.split('-').map(Number);
      if (!year || !week) return period;
      
      // Create date for January 1st of the year
      const jan1 = new Date(year, 0, 1);
      
      // Find the first Monday of the year
      const jan1Day = jan1.getDay();
      const daysToFirstMonday = jan1Day === 1 ? 0 : (8 - jan1Day) % 7;
      
      // Calculate the Monday of the target week
      const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
      const targetMonday = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      
      // Get Sunday (6 days after Monday)
      const targetSunday = new Date(targetMonday.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      return `${format(targetMonday, 'MMM dd')} - ${format(targetSunday, 'MMM dd, yyyy')}`;
    } catch (error) {
      console.error('Error parsing week period:', error);
      return period;
    }
  };

  const getStatusIcon = (status: string, extensionRequests?: Array<{id: string, status: string}>) => {
    // Check if there are pending extension requests
    const hasPendingExtension = extensionRequests?.some(req => req.status === 'pending');
    
    if (hasPendingExtension) {
      return <Clock className="w-4 h-4 text-orange-600" />;
    }
    
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'SUBMITTED':
      case 'PARTIALLY_VERIFIED':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'STARTED':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string, extensionRequests?: Array<{id: string, status: string}>) => {
    // Check if there are pending extension requests
    const hasPendingExtension = extensionRequests?.some(req => req.status === 'pending');
    const hasApprovedExtension = extensionRequests?.some(req => req.status === 'approved');
    
    if (hasPendingExtension) {
      return <Badge variant="secondary">Extension Pending</Badge>;
    }
    
    if (hasApprovedExtension) {
      return <Badge variant="outline">Extension Approved</Badge>;
    }
    
    const variants = {
      'VERIFIED': 'default' as const,
      'SUBMITTED': 'secondary' as const,
      'PARTIALLY_VERIFIED': 'secondary' as const,
      'STARTED': 'outline' as const,
      'NOT_STARTED': 'outline' as const
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const selectedPeriodTasks = selectedPeriod 
    ? historicalTasks.filter(task => task.period === selectedPeriod)
    : [];

  const formatTrackingMetrics = (evidenceData: any) => {
    if (!evidenceData?.tracking_metrics) return null;
    
    const metrics = evidenceData.tracking_metrics;
    return Object.entries(metrics)
      .filter(([key, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => `${key.replace('_', ' ')}: ${value}`)
      .join(' • ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="w-8 h-8 animate-pulse mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading historical data...</p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyData = historicalTasks.length > 0 || evidenceHistory.length > 0 || networkMetrics.length > 0 || signals.length > 0;

  if (!hasAnyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Historical Data Yet</h3>
            <p className="text-muted-foreground">
              Complete some LinkedIn tasks to see your activity history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Tasks ({historicalTasks.length})
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Evidence ({evidenceHistory.length})
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Metrics ({networkMetrics.length})
          </TabsTrigger>
          <TabsTrigger value="signals" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Signals ({signals.length})
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {periodSummaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  Task Completion by Week
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
                            {selectedPeriodTasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-3 bg-background border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {getStatusIcon(task.status, task.extension_requests)}
                                  <div>
                                    <p className="font-medium text-sm">{task.linkedin_tasks.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Updated: {format(new Date(task.updated_at), 'MMM dd, yyyy at h:mm a')}
                                    </p>
                                    {task.extension_requests && task.extension_requests.length > 0 && (
                                      <p className="text-xs text-orange-600">
                                        Extension request: {task.extension_requests[0].status}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {task.score_awarded} / {task.linkedin_tasks.points_base} pts
                                    </p>
                                  </div>
                                  {getStatusBadge(task.status, task.extension_requests)}
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
          )}
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Evidence Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidenceHistory.map((evidence: any) => (
                  <div key={evidence.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">
                            {evidence.linkedin_user_tasks?.linkedin_tasks?.title || 'Task Evidence'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Period: {evidence.linkedin_user_tasks?.period}
                          </p>
                          {evidence.url && (
                            <div className="flex items-center gap-2 mt-1">
                              <Link className="w-3 h-3" />
                              <a href={evidence.url} target="_blank" rel="noopener noreferrer" 
                                 className="text-xs text-blue-600 hover:underline">
                                {evidence.url.length > 50 ? evidence.url.substring(0, 50) + '...' : evidence.url}
                              </a>
                            </div>
                          )}
                          {evidence.evidence_data && formatTrackingMetrics(evidence.evidence_data) && (
                            <p className="text-xs text-green-600 mt-1">
                              📊 {formatTrackingMetrics(evidence.evidence_data)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evidence.created_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evidence.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {evidenceHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No evidence submissions found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Network Growth Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkMetrics.map((metric: any) => (
                  <div key={`${metric.date}-${metric.activity_id}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {metric.activity_id === 'connections_accepted' && <Users className="w-4 h-4 text-blue-600" />}
                      {metric.activity_id === 'create_post' && <MessageSquare className="w-4 h-4 text-green-600" />}
                      {metric.activity_id === 'profile_views' && <Activity className="w-4 h-4 text-purple-600" />}
                      <div>
                        <p className="font-medium text-sm">
                          {metric.activity_id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(metric.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{metric.value}</p>
                    </div>
                  </div>
                ))}
                {networkMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No network metrics recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signals Tab */}
        <TabsContent value="signals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Activity className="w-6 h-6" />
                LinkedIn Activity Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signals.map((signal: any) => (
                  <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-sm">{signal.subject}</p>
                        {signal.actor && (
                          <p className="text-xs text-muted-foreground">By: {signal.actor}</p>
                        )}
                        {signal.link && (
                          <a href={signal.link} target="_blank" rel="noopener noreferrer" 
                             className="text-xs text-blue-600 hover:underline">
                            View Activity
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(signal.happened_at), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(signal.happened_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {signals.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity signals recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Overall Statistics */}
      {periodSummaries.length > 0 && (
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
      )}
    </div>
  );
};