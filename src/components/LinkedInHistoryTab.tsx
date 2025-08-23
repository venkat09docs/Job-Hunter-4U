import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Trophy,
  TrendingUp,
  ChevronRight
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
          )
        `)
        .eq('user_id', linkedinUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HistoricalTask[];
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
        const completedTasks = tasks.filter(t => t.status === 'VERIFIED').length;
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

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
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

  if (periodSummaries.length === 0) {
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
      {/* Period Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            Activity History by Week
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
                            {getStatusIcon(task.status)}
                            <div>
                              <p className="font-medium text-sm">{task.linkedin_tasks.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Updated: {format(new Date(task.updated_at), 'MMM dd, yyyy at h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {task.score_awarded} / {task.linkedin_tasks.points_base} pts
                              </p>
                            </div>
                            {getStatusBadge(task.status)}
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
  );
};