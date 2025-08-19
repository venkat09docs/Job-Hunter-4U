import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, BarChart3, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';

export const JobHunterHistory: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-week');

  // Mock data - will be replaced with real data from hooks
  const weeklyReports = [
    {
      weekStart: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(new Date()), 'yyyy-MM-dd'),
      tasksAssigned: 12,
      tasksCompleted: 8,
      pointsEarned: 145,
      applicationsSubmitted: 5,
      interviewsScheduled: 2,
      offers: 0
    },
    {
      weekStart: format(startOfWeek(subWeeks(new Date(), 1)), 'yyyy-MM-dd'),
      weekEnd: format(endOfWeek(subWeeks(new Date(), 1)), 'yyyy-MM-dd'),
      tasksAssigned: 12,
      tasksCompleted: 11,
      pointsEarned: 195,
      applicationsSubmitted: 7,
      interviewsScheduled: 1,
      offers: 1
    }
  ];

  const auditTrail = [
    {
      id: '1',
      timestamp: new Date(),
      action: 'Task Completed',
      description: 'Applied to Software Engineer position at TechCorp',
      status: 'verified',
      points: 25
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000),
      action: 'Evidence Submitted',
      description: 'Screenshot uploaded for LinkedIn outreach task',
      status: 'pending',
      points: 0
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000),
      action: 'Email Auto-Verified',
      description: 'Interview invitation from DataFlow Inc detected',
      status: 'verified',
      points: 50
    }
  ];

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
            Summary of your job hunting activities by week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyReports.map((report, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">
                    Week of {format(new Date(report.weekStart), 'MMM d')} - {format(new Date(report.weekEnd), 'MMM d, yyyy')}
                  </h4>
                  <Badge variant={report.tasksCompleted >= report.tasksAssigned * 0.8 ? "default" : "secondary"}>
                    {Math.round((report.tasksCompleted / report.tasksAssigned) * 100)}% Complete
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
            Detailed log of all your job hunting activities and verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Applications</span>
                <span className="font-semibold text-green-600">↗ +40% from last week</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Response Rate</span>
                <span className="font-semibold text-blue-600">↗ +15% from last week</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Task Completion</span>
                <span className="font-semibold text-yellow-600">→ Same as last week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Streak Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Application</span>
                <span className="font-semibold">5 days (Best: 12)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weekly Research</span>
                <span className="font-semibold">3 weeks (Best: 8)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Follow-up</span>
                <span className="font-semibold">7 days (Best: 15)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};