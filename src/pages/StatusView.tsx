import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  Award,
  Eye,
  Briefcase,
  MessageSquare,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface StatusMetrics {
  // Core metrics
  totalJobsViewed: { thisWeek: number; allTime: number; trend: number };
  totalJobsSaved: { count: number; trend: number };
  totalApplicationsSent: { count: number; trend: number };
  applicationsThisWeek: { count: number; trend: number };
  interviewCalls: { count: number; trend: number };
  offersReceived: { count: number; trend: number };
  followUpsSent: { count: number; trend: number };
  pendingFollowUps: { count: number };
  
  // Calculated metrics
  interviewConversionRate: number;
  offerConversionRate: number;
  averageMatchScore: number;
  dailyStreak: number;
  averageProcessingTime: number;
  
  // Top sources
  topSources: Array<{ source: string; count: number }>;
  
  // Profile metrics
  profileViews: { linkedin: number; github: number };
}

export default function StatusView() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<StatusMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Get current date and week boundaries
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const prevWeekStart = new Date(weekStart);
      prevWeekStart.setDate(weekStart.getDate() - 7);
      
      // Fetch job tracker data
      const { data: jobTrackerData, error: jobTrackerError } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', user?.id);

      if (jobTrackerError) throw jobTrackerError;

      // Fetch job application activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('job_application_activities')
        .select('*')
        .eq('user_id', user?.id);

      if (activitiesError) throw activitiesError;

      // Fetch job search results
      const { data: jobSearchData, error: jobSearchError } = await supabase
        .from('job_results')
        .select('*')
        .eq('user_id', user?.id);

      if (jobSearchError) throw jobSearchError;

      // Calculate metrics
      const totalApplications = jobTrackerData?.length || 0;
      const thisWeekApplications = jobTrackerData?.filter(job => 
        new Date(job.created_at) >= weekStart
      ).length || 0;

      const lastWeekApplications = jobTrackerData?.filter(job => {
        const createdAt = new Date(job.created_at);
        return createdAt >= prevWeekStart && createdAt < weekStart;
      }).length || 0;

      const interviewCount = jobTrackerData?.filter(job => 
        ['interview_scheduled', 'interviewed', 'final_round'].includes(job.status)
      ).length || 0;

      const offersCount = jobTrackerData?.filter(job => 
        ['offer_received', 'accepted'].includes(job.status)
      ).length || 0;

      const pendingFollowUps = jobTrackerData?.filter(job => 
        job.next_follow_up && new Date(job.next_follow_up) <= now && 
        !['rejected', 'accepted', 'withdrawn'].includes(job.status)
      ).length || 0;

      // Calculate conversion rates
      const interviewConversionRate = totalApplications > 0 ? (interviewCount / totalApplications) * 100 : 0;
      const offerConversionRate = interviewCount > 0 ? (offersCount / interviewCount) * 100 : 0;

      // Calculate daily streak
      const sortedApplications = jobTrackerData?.sort((a, b) => 
        new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
      ) || [];
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const job of sortedApplications) {
        const appDate = new Date(job.application_date);
        appDate.setHours(0, 0, 0, 0);
        
        if (appDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (appDate.getTime() < currentDate.getTime()) {
          break;
        }
      }

      // Top sources analysis
      const sources: { [key: string]: number } = {};
      jobSearchData?.forEach(job => {
        const query = job.search_query as any;
        const source = query?.source || 'Direct Application';
        sources[source] = (sources[source] || 0) + 1;
      });

      const topSources = Object.entries(sources)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([source, count]) => ({ source, count }));

      const compiledMetrics: StatusMetrics = {
        totalJobsViewed: { 
          thisWeek: jobSearchData?.filter(job => new Date(job.created_at) >= weekStart).length || 0,
          allTime: jobSearchData?.length || 0,
          trend: 0 
        },
        totalJobsSaved: { 
          count: jobTrackerData?.filter(job => job.status === 'saved').length || 0, 
          trend: 0 
        },
        totalApplicationsSent: { 
          count: totalApplications, 
          trend: thisWeekApplications - lastWeekApplications 
        },
        applicationsThisWeek: { 
          count: thisWeekApplications, 
          trend: thisWeekApplications - lastWeekApplications 
        },
        interviewCalls: { 
          count: interviewCount, 
          trend: 0 
        },
        offersReceived: { 
          count: offersCount, 
          trend: 0 
        },
        followUpsSent: { 
          count: activitiesData?.filter(activity => activity.task_id === 'follow_up_sent').length || 0, 
          trend: 0 
        },
        pendingFollowUps: { 
          count: pendingFollowUps 
        },
        interviewConversionRate,
        offerConversionRate,
        averageMatchScore: 75, // Mock data - would need AI scoring implementation
        dailyStreak: streak,
        averageProcessingTime: 5, // Mock data - would need response tracking
        topSources,
        profileViews: { linkedin: 0, github: 0 } // Mock data - would need external API integration
      };

      setMetrics(compiledMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load status metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-yellow-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-500";
    if (trend < 0) return "text-red-500";
    return "text-yellow-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Status View</h1>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Job Search Status</h1>
          <p className="text-muted-foreground">Your comprehensive job hunting dashboard</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Application Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          <h2 className="text-xl font-semibold">📊 Application Stats</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Applications</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.totalApplicationsSent.count}</span>
                {getTrendIcon(metrics.totalApplicationsSent.trend)}
                <span className={`text-sm ${getTrendColor(metrics.totalApplicationsSent.trend)}`}>
                  {metrics.totalApplicationsSent.trend > 0 ? '+' : ''}{metrics.totalApplicationsSent.trend}
                </span>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">This Week</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.applicationsThisWeek.count}</span>
                {getTrendIcon(metrics.applicationsThisWeek.trend)}
                <span className={`text-sm ${getTrendColor(metrics.applicationsThisWeek.trend)}`}>
                  {metrics.applicationsThisWeek.trend > 0 ? '+' : ''}{metrics.applicationsThisWeek.trend}
                </span>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Jobs Viewed</CardTitle>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.totalJobsViewed.allTime}</div>
                <div className="text-xs text-muted-foreground">
                  {metrics.totalJobsViewed.thisWeek} this week
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily Streak</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.dailyStreak}</span>
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-500">days</span>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Conversion Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <h2 className="text-xl font-semibold">🎯 Conversion Metrics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Calls</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.interviewCalls.count}</span>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Rate</CardTitle>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.interviewConversionRate.toFixed(1)}%</div>
                <Progress value={metrics.interviewConversionRate} className="h-2" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Offers Received</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{metrics.offersReceived.count}</span>
                <Award className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Offer Rate</CardTitle>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.offerConversionRate.toFixed(1)}%</div>
                <Progress value={metrics.offerConversionRate} className="h-2" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Weekly Progress & Action Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              📅 Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Applications Goal (5/week)</span>
              <span className="text-sm font-medium">{metrics.applicationsThisWeek.count}/5</span>
            </div>
            <Progress value={(metrics.applicationsThisWeek.count / 5) * 100} className="h-2" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Match Score</span>
                <span className="font-medium">{metrics.averageMatchScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Follow-ups Sent</span>
                <span className="font-medium">{metrics.followUpsSent.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Processing Time</span>
                <span className="font-medium">{metrics.averageProcessingTime} days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              📌 Action Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending Follow-ups</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/50">
                {metrics.pendingFollowUps.count}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Top Job Sources</h4>
              {metrics.topSources.map((source, index) => (
                <div key={source.source} className="flex justify-between items-center">
                  <span className="text-sm">{index + 1}. {source.source}</span>
                  <Badge variant="secondary">{source.count}</Badge>
                </div>
              ))}
            </div>

            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Profile Metrics</h4>
              <div className="flex justify-between text-sm">
                <span>LinkedIn Views</span>
                <span className="font-medium">{metrics.profileViews.linkedin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GitHub Views</span>
                <span className="font-medium">{metrics.profileViews.github}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}