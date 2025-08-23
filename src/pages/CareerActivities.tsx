import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Trophy, 
  Target, 
  RefreshCw, 
  TrendingUp,
  Users,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  Copy,
  Mail,
  Webhook,
  Clock,
  Star,
  Shield,
  ExternalLink,
  Home,
  Lock
} from 'lucide-react';
import { useLinkedInTasks } from '@/hooks/useLinkedInTasks';
import { LinkedInTaskCard } from '@/components/LinkedInTaskCard';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

const CareerActivities = () => {
  const { canAccessFeature } = usePremiumFeatures();
  const {
    userTasks,
    evidence,
    signals,
    userBadges,
    weeklyScore,
    currentPeriod,
    tasksLoading,
    initializeWeek,
    submitEvidence,
    updateTaskStatus,
    verifyTasks,
    isSubmittingEvidence,
    isVerifying,
    isInitializing
  } = useLinkedInTasks();

  const [autoVerifyEmail, setAutoVerifyEmail] = useState('');

  const handleInitializeWeek = () => {
    initializeWeek();
  };

  const handleVerifyTasks = () => {
    verifyTasks();
  };

  const getTaskStats = () => {
    const completed = userTasks.filter(task => task.status === 'VERIFIED').length;
    const submitted = userTasks.filter(task => task.status === 'SUBMITTED' || task.status === 'PARTIALLY_VERIFIED').length;
    const total = userTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const totalPoints = userTasks.reduce((sum, task) => sum + task.score_awarded, 0);
    const maxPoints = userTasks.reduce((sum, task) => sum + task.linkedin_tasks.points_base, 0);
    
    return { completed, submitted, total, progress, totalPoints, maxPoints };
  };

  // Calculate cumulative statistics from all evidence
  const getCumulativeStats = () => {
    const stats = {
      connections: 0,
      posts: 0,
      views: 0
    };
    
    evidence.forEach(ev => {
      if (ev.evidence_data?.tracking_metrics) {
        const metrics = ev.evidence_data.tracking_metrics;
        stats.connections += metrics.connections_accepted || 0;
        stats.posts += metrics.posts_count || 0;
        stats.views += metrics.profile_views || 0;
      }
    });
    
    return stats;
  };

  const cumulativeStats = getCumulativeStats();
  const stats = getTaskStats();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Get week date range from currentPeriod (format: 2025-34)
  const getWeekDateRange = (period: string): string => {
    if (!period) return "";
    
    try {
      const [year, week] = period.split('-').map(Number);
      if (!year || !week) return period;
      
      // Create date for January 1st of the year
      const jan1 = new Date(year, 0, 1);
      
      // Find the first Monday of the year (or previous year if Jan 1 is not Monday)
      const jan1Day = jan1.getDay(); // 0 = Sunday, 1 = Monday, etc.
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" className="mr-4">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">LinkedIn Growth Activities</h1>
              <p className="text-muted-foreground mt-2">Complete weekly LinkedIn tasks to grow your professional network and earn points</p>
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points Earned</p>
                  <p className="text-2xl font-bold">{stats.totalPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{Math.round(stats.progress)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Feature Notice */}
        {!canAccessFeature("linkedin_growth_activities") && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Premium Feature</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    LinkedIn Growth Activities is available for premium subscribers. You can view the interface but cannot modify or submit tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="this-week" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="this-week" className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 text-sm font-medium">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* This Week Tab */}
          <TabsContent value="this-week" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tasks Column */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Week {currentPeriod} ({getWeekDateRange(currentPeriod)}) - LinkedIn Growth Tasks</h3>
                  <Badge variant="outline" className="text-sm">
                    {stats.completed} of {stats.total} completed
                  </Badge>
                </div>

                {tasksLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <span className="mt-2 text-muted-foreground">Loading LinkedIn tasks...</span>
                    </div>
                  </div>
                )}

                {!tasksLoading && userTasks.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="space-y-6">
                        <Users className="w-16 h-16 text-primary mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Ready to start your LinkedIn growth?</h3>
                          <p className="text-muted-foreground">
                            Initialize your weekly tasks to begin earning points and growing your network.
                          </p>
                        </div>
                        <Button 
                          onClick={handleInitializeWeek} 
                          disabled={isInitializing || !canAccessFeature("linkedin_growth_activities")} 
                          size="lg"
                        >
                          {isInitializing ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Initializing Week...
                            </>
                          ) : (
                            <>
                              <Target className="w-5 h-5 mr-2" />
                              Start This Week's Tasks
                              {!canAccessFeature("linkedin_growth_activities") && <Lock className="w-5 h-5 ml-2" />}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!tasksLoading && userTasks.length > 0 && (
                  <div className="space-y-4">
                    {/* Debug info */}
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                      Debug: {userTasks.length} tasks loaded for period {currentPeriod}
                    </div>
                    
                    {userTasks.map((task) => (
                      <LinkedInTaskCard
                        key={task.id}
                        task={task}
                        evidence={evidence.filter(e => e.user_task_id === task.id)}
                        onSubmitEvidence={canAccessFeature("linkedin_growth_activities") ? submitEvidence : () => {}}
                        onUpdateStatus={canAccessFeature("linkedin_growth_activities") ? updateTaskStatus : () => {}}
                        isSubmitting={isSubmittingEvidence}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weekly Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Weekly Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{stats.totalPoints}</div>
                      <div className="text-sm text-muted-foreground">of {stats.maxPoints} points</div>
                    </div>
                    <Progress value={(stats.totalPoints / stats.maxPoints) * 100} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {Math.round(stats.progress)}% complete
                    </div>
                  </CardContent>
                </Card>

                {/* LinkedIn Growth Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      LinkedIn Growth Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Connections</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{cumulativeStats.connections}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Posts</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{cumulativeStats.posts}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Profile Views</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">{cumulativeStats.views}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
                      Total across all submissions
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Signals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {signals.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity detected yet</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      {signals.slice(0, 5).map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3 p-2 rounded">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {signal.kind.replace('_', ' ')}
                            </p>
                            {signal.actor && (
                              <p className="text-xs text-muted-foreground truncate">
                                by {signal.actor}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(signal.happened_at), 'MMM dd, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* User Badges */}
                {userBadges.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Earned Badges
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {userBadges.slice(0, 4).map((badge) => (
                          <div key={badge.id} className="text-center p-3 bg-muted/50 rounded">
                            <div className="text-2xl mb-1">{badge.linkedin_badges.icon || '🏆'}</div>
                            <div className="text-xs font-medium">{badge.linkedin_badges.title}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  Historical Activity Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Historical Data</h3>
                  <p className="text-muted-foreground">
                    View past activity trends, completion rates, and user engagement metrics.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Coming soon - Advanced analytics dashboard
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* Auto-Verify Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  Auto-Verify Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Privacy & Security Notice</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        We never scrape LinkedIn. Verification uses your forwarded emails or files you upload. 
                        You can revoke access and delete data anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Your Auto-Verify Email:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={`linkedin.sample@inbox.jobhunter.com`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`linkedin.sample@inbox.jobhunter.com`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-4">
          <p>Career Activities Management Dashboard - Admin View</p>
          <p className="mt-1">All times are in Asia/Kolkata timezone. Tasks reset every Monday.</p>
        </div>
      </div>
    </div>
  );
};

export default CareerActivities;