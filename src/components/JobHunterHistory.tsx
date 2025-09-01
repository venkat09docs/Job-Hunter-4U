import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { useUserPointsHistory } from '@/hooks/useUserPointsHistory';

export const JobHunterHistory: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-week');
  
  // Get real data from hooks
  const { assignments, evidence, loading: assignmentsLoading } = useJobHuntingAssignments();
  const { pointsHistory, loading: pointsLoading, totalPoints } = useUserPointsHistory();

  // Process real data into weekly reports
  const getWeeklyReports = () => {
    if (!assignments || assignmentsLoading) return [];

    const weeks = new Map();
    
    // Group assignments by week
    assignments.forEach(assignment => {
      const weekStart = format(startOfWeek(new Date(assignment.week_start_date)), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date(assignment.week_start_date)), 'yyyy-MM-dd');
      const weekKey = weekStart;
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, {
          weekStart,
          weekEnd,
          tasksAssigned: 0,
          tasksCompleted: 0,
          pointsEarned: 0,
          applicationsSubmitted: 0,
          interviewsScheduled: 0,
          offers: 0
        });
      }
      
      const week = weeks.get(weekKey);
      week.tasksAssigned++;
      
      if (assignment.status === 'verified') {
        week.tasksCompleted++;
        week.pointsEarned += assignment.points_earned || 0;
      }
      
      // Count applications based on task titles
      if (assignment.template?.title?.toLowerCase().includes('apply')) {
        week.applicationsSubmitted++;
      }
      
      // Count interviews based on task titles
      if (assignment.template?.title?.toLowerCase().includes('interview')) {
        week.interviewsScheduled++;
      }
    });

    return Array.from(weeks.values()).sort((a, b) => 
      new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
    ).slice(0, 4); // Show last 4 weeks
  };

  // Process evidence into audit trail
  const getAuditTrail = () => {
    if (!evidence || assignmentsLoading) return [];

    return evidence.map(item => {
      const assignment = assignments?.find(a => a.id === item.assignment_id);
      
      return {
        id: item.id,
        timestamp: new Date(item.submitted_at),
        action: item.verification_status === 'verified' ? 'Task Completed' : 'Evidence Submitted',
        description: assignment?.template?.title || 'Task evidence submitted',
        status: item.verification_status,
        points: item.verification_status === 'verified' ? (assignment?.points_earned || 0) : 0
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  };

  // Calculate performance trends
  const getPerformanceTrends = () => {
    const weeklyReports = getWeeklyReports();
    if (weeklyReports.length < 2) return null;
    
    const currentWeek = weeklyReports[0];
    const lastWeek = weeklyReports[1];
    
    const applicationChange = lastWeek.applicationsSubmitted > 0 
      ? Math.round(((currentWeek.applicationsSubmitted - lastWeek.applicationsSubmitted) / lastWeek.applicationsSubmitted) * 100)
      : 0;
      
    const taskCompletionChange = lastWeek.tasksCompleted > 0
      ? Math.round(((currentWeek.tasksCompleted - lastWeek.tasksCompleted) / lastWeek.tasksCompleted) * 100)
      : 0;
    
    return {
      applicationChange,
      taskCompletionChange,
      responseRate: 15 // This would need additional data from job tracking
    };
  };

  const weeklyReports = getWeeklyReports();
  const auditTrail = getAuditTrail();
  const trends = getPerformanceTrends();

  if (assignmentsLoading || pointsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your job hunting history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Job Hunter History</h2>
          <p className="text-muted-foreground text-sm">
            Review your progress over time and audit trail
          </p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-week">Current Week</SelectItem>
            <SelectItem value="last-4-weeks">Last 4 Weeks</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="all-time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Performance Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Performance Reports
          </CardTitle>
          <CardDescription>
            Summary of your job hunting activities by week (Real Data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyReports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No weekly data available yet. Complete some job hunting tasks to see your progress here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyReports.map((report, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">
                      Week of {format(new Date(report.weekStart), 'MMM d')} - {format(new Date(report.weekEnd), 'MMM d, yyyy')}
                    </h4>
                    <Badge variant={report.tasksCompleted >= report.tasksAssigned * 0.8 ? "default" : "secondary"}>
                      {report.tasksAssigned > 0 ? Math.round((report.tasksCompleted / report.tasksAssigned) * 100) : 0}% Complete
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold text-lg">{report.tasksCompleted}/{report.tasksAssigned}</p>
                      <p className="text-muted-foreground">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-yellow-600">{report.pointsEarned}</p>
                      <p className="text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-blue-600">{report.applicationsSubmitted}</p>
                      <p className="text-muted-foreground">Applied</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-green-600">{report.interviewsScheduled}</p>
                      <p className="text-muted-foreground">Interviews</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-lg text-purple-600">{report.offers}</p>
                      <p className="text-muted-foreground">Offers</p>
                    </div>
                    <div className="text-center">
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Audit Trail
          </CardTitle>
          <CardDescription>
            Detailed log of all your job hunting activities and verifications (Real Data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditTrail.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activity data available yet. Submit evidence for your tasks to see audit trail here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditTrail.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'verified' ? 'bg-green-100' : 
                      activity.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {activity.status === 'verified' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : activity.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(activity.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={activity.status === 'verified' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {activity.status}
                    </Badge>
                    {activity.points > 0 && (
                      <Badge variant="outline">+{activity.points} pts</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Trends
            </CardTitle>
            <CardDescription>Based on Real Data</CardDescription>
          </CardHeader>
          <CardContent>
            {trends ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Applications</span>
                  <span className={`font-semibold ${trends.applicationChange > 0 ? 'text-green-600' : trends.applicationChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {trends.applicationChange > 0 ? '↗' : trends.applicationChange < 0 ? '↘' : '→'} 
                    {trends.applicationChange > 0 ? '+' : ''}{trends.applicationChange}% from last week
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Task Completion</span>
                  <span className={`font-semibold ${trends.taskCompletionChange > 0 ? 'text-green-600' : trends.taskCompletionChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {trends.taskCompletionChange > 0 ? '↗' : trends.taskCompletionChange < 0 ? '↘' : '→'} 
                    {trends.taskCompletionChange > 0 ? '+' : ''}{trends.taskCompletionChange}% from last week
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Points</span>
                  <span className="font-semibold text-yellow-600">{totalPoints} pts earned</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Need at least 2 weeks of data to show trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Summary
            </CardTitle>
            <CardDescription>Based on Real Data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Tasks</span>
                <span className="font-semibold">{assignments?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed Tasks</span>
                <span className="font-semibold">{assignments?.filter(a => a.status === 'verified').length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Evidence Submitted</span>
                <span className="font-semibold">{evidence?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};