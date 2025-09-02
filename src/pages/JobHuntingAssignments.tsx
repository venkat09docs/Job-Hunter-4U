import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobHunterAssignments } from '@/components/JobHunterAssignments';
import { JobHunterHistory } from '@/components/JobHunterHistory';
import { JobHunterSettings } from '@/components/JobHunterSettings';
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
  Briefcase,
  ExternalLink,
  Linkedin,
  Globe,
  Search,
  FileText,
  CheckSquare,
  XCircle,
  Archive
} from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';

export const JobHuntingAssignments: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
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
    getTotalPoints,
    updateAssignmentStatus
  } = useJobHuntingAssignments();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('assignments');
  const [jobTrackerStats, setJobTrackerStats] = useState<Record<string, number>>({
    wishlist: 0,
    applied: 0,
    interviewing: 0,
    negotiating: 0,
    accepted: 0,
    not_selected: 0,
    no_response: 0
  });
  const [jobTrackerLoading, setJobTrackerLoading] = useState(true);
  const [sidebarWeeklyStats, setSidebarWeeklyStats] = useState({
    applied: 0,
    referrals: 0,
    followUps: 0,
    conversations: 0
  });

  const weekProgress = getWeekProgress();
  const taskCategories = getTasksByCategory();
  const totalPoints = getTotalPoints();

  // Get current week dates
  const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(currentWeek, 6);

  // All assignments are already job hunting specific since we're using useJobHuntingAssignments
  // Use assignments directly from the hook to ensure reactivity
  const jobHuntingAssignments = assignments;

  const getStreakByType = (type: string) => {
    return streaks.find(s => s.streak_type === type);
  };

  // Fetch job tracker statistics
  useEffect(() => {
    const fetchJobTrackerStats = async () => {
      if (!user) return;
      
      try {
        setJobTrackerLoading(true);
        const { data, error } = await supabase
          .from('job_tracker')
          .select('status')
          .eq('user_id', user.id)
          .eq('is_archived', false);

        if (error) throw error;

        const statusCounts = {
          wishlist: 0,
          applied: 0,
          interviewing: 0,
          negotiating: 0,
          accepted: 0,
          not_selected: 0,
          no_response: 0
        };

        (data || []).forEach((job: any) => {
          if (statusCounts.hasOwnProperty(job.status)) {
            statusCounts[job.status as keyof typeof statusCounts]++;
          }
        });

        setJobTrackerStats(statusCounts);
      } catch (error) {
        console.error('Error fetching job tracker stats:', error);
      } finally {
        setJobTrackerLoading(false);
      }
    };

    fetchJobTrackerStats();
  }, [user]);

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


            {/* Main Content Tabs */}
            <Tabs defaultValue="assignments" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Assignments Tab - Weekly quotas + Per-job tasks + Pipeline */}
              <TabsContent value="assignments" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Main Content - Left Side */}
                  <div className="xl:col-span-3 space-y-6">
                    {/* Weekly Progress Overview */}
                <Card className="shadow-elegant border-primary/20" data-section="weekly-progress-targets">
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

                {/* Weekly Assignments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Weekly Assignments
                    </CardTitle>
                    <CardDescription>
                      Initialize and manage your weekly job hunting tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                     {jobHuntingAssignments.length === 0 ? (
                       <div className="text-center py-8">
                         <div className="flex flex-col items-center gap-4">
                           <div className="p-4 bg-muted rounded-full">
                             <Target className="h-8 w-8 text-muted-foreground" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-lg mb-2">No Job Hunting Tasks Found</h3>
                             <p className="text-muted-foreground mb-2">
                               {assignments.length > 0 
                                 ? `Found ${assignments.length} total assignments, but none for current week. Click Initialize to create new tasks.`
                                 : 'Initialize your job hunting assignments to see tasks like:'
                               }
                             </p>
                             {assignments.length === 0 && (
                               <div className="text-sm text-muted-foreground mb-4 space-y-1">
                                 <p>• Day 5/6/7 follow-up tasks</p>
                                 <p>• Job application tasks</p>
                                 <p>• Networking assignments</p>
                                 <p>• Interview preparation tasks</p>
                               </div>
                             )}
                             <p className="text-xs text-muted-foreground mb-4">
                               {templates.length > 0 
                                 ? `Found ${templates.length} available templates ready to be assigned`
                                 : 'Loading templates...'
                               }
                             </p>
                           </div>
                            <Button 
                              onClick={initializeUserWeek}
                              disabled={loading}
                              className="flex items-center gap-2"
                            >
                             {loading ? (
                               <RefreshCw className="h-4 w-4 animate-spin" />
                             ) : (
                               <Zap className="h-4 w-4" />
                             )}
                             Initialize Job Hunting Tasks
                           </Button>
                         </div>
                       </div>
                    ) : (
                      <div className="space-y-4">
                        {loading ? (
                          <div className="grid gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <AssignmentCardSkeleton key={i} />
                            ))}
                          </div>
                        ) : (
                            <JobHunterAssignments 
                              weekProgress={weekProgress}
                              assignments={jobHuntingAssignments}
                              initializeUserWeek={initializeUserWeek}
                              onUpdateStatus={updateAssignmentStatus}
                              onWeeklyStatsUpdate={setSidebarWeeklyStats}
                            />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="xl:col-span-1 space-y-6">
                <div className="sticky top-4 space-y-6">
                  {/* Job Weekly Status - First Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Job Weekly Status</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Current week progress ({format(currentWeek, 'MMM d')} - {format(weekEnd, 'MMM d')})
                    </p>
                    
                    <div className="space-y-3">
                      {/* Job Applications */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Job Applications</h4>
                          </div>
                           <div className="space-y-2">
                             <div className="flex items-center justify-center">
                               <div className="text-center">
                                 <div className="text-3xl font-bold text-primary">{sidebarWeeklyStats.applied}</div>
                                 <div className="text-sm text-muted-foreground">of 5 completed</div>
                               </div>
                             </div>
                             <div className="w-full bg-muted rounded-full h-3">
                               <div 
                                 className="bg-primary h-3 rounded-full transition-all"
                                 style={{ width: `${Math.round((sidebarWeeklyStats.applied / 5) * 100)}%` }}
                               />
                             </div>
                             <div className="text-center">
                               <Badge variant={sidebarWeeklyStats.applied >= 5 ? "default" : "secondary"} className="text-sm font-medium">
                                 {Math.round((sidebarWeeklyStats.applied / 5) * 100)}% Complete
                               </Badge>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                      
                      {/* Referral Requests */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Referral Requests</h4>
                          </div>
                           <div className="space-y-2">
                             <div className="flex items-center justify-center">
                               <div className="text-center">
                                 <div className="text-3xl font-bold text-primary">{sidebarWeeklyStats.referrals}</div>
                                 <div className="text-sm text-muted-foreground">of 3 completed</div>
                               </div>
                             </div>
                             <div className="w-full bg-muted rounded-full h-3">
                               <div 
                                 className="bg-primary h-3 rounded-full transition-all"
                                 style={{ width: `${Math.round((sidebarWeeklyStats.referrals / 3) * 100)}%` }}
                               />
                             </div>
                             <div className="text-center">
                               <Badge variant={sidebarWeeklyStats.referrals >= 3 ? "default" : "outline"} className="text-sm font-medium">
                                 {Math.round((sidebarWeeklyStats.referrals / 3) * 100)}% Complete
                               </Badge>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                      
                      {/* Follow-ups */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">Follow-ups</h4>
                          </div>
                           <div className="space-y-2">
                             <div className="flex items-center justify-center">
                               <div className="text-center">
                                 <div className="text-3xl font-bold text-primary">{sidebarWeeklyStats.followUps}</div>
                                 <div className="text-sm text-muted-foreground">of 5 completed</div>
                               </div>
                             </div>
                             <div className="w-full bg-muted rounded-full h-3">
                               <div 
                                 className="bg-primary h-3 rounded-full transition-all"
                                 style={{ width: `${Math.round((sidebarWeeklyStats.followUps / 5) * 100)}%` }}
                               />
                             </div>
                             <div className="text-center">
                               <Badge variant={sidebarWeeklyStats.followUps >= 5 ? "default" : "secondary"} className="text-sm font-medium">
                                 {Math.round((sidebarWeeklyStats.followUps / 5) * 100)}% Complete
                               </Badge>
                             </div>
                           </div>
                        </CardContent>
                      </Card>
                      
                      {/* New Conversations */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <h4 className="font-medium text-sm">New Conversations</h4>
                          </div>
                           <div className="space-y-2">
                             <div className="flex items-center justify-center">
                               <div className="text-center">
                                 <div className="text-3xl font-bold text-primary">{sidebarWeeklyStats.conversations}</div>
                                 <div className="text-sm text-muted-foreground">of 3 completed</div>
                               </div>
                             </div>
                             <div className="w-full bg-muted rounded-full h-3">
                               <div 
                                 className="bg-primary h-3 rounded-full transition-all"
                                 style={{ width: `${Math.round((sidebarWeeklyStats.conversations / 3) * 100)}%` }}
                               />
                             </div>
                             <div className="text-center">
                               <Badge variant={sidebarWeeklyStats.conversations >= 3 ? "default" : "secondary"} className="text-sm font-medium">
                                 {Math.round((sidebarWeeklyStats.conversations / 3) * 100)}% Complete
                               </Badge>
                             </div>
                           </div>
                        </CardContent>
                      </Card>

                      {/* Total Points */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-yellow-600" />
                            <h4 className="font-medium text-sm">Total Points</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-600">{weekProgress.totalPoints}</div>
                                <div className="text-sm text-muted-foreground">of {weekProgress.maxPoints} possible</div>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3">
                              <div 
                                className="bg-yellow-500 h-3 rounded-full transition-all"
                                style={{ width: weekProgress.maxPoints > 0 ? `${Math.round((weekProgress.totalPoints / weekProgress.maxPoints) * 100)}%` : '0%' }}
                              />
                            </div>
                            <div className="text-center">
                              <Badge variant="outline" className="text-sm font-medium bg-yellow-50 text-yellow-700 border-yellow-200">
                                {weekProgress.maxPoints > 0 ? Math.round((weekProgress.totalPoints / weekProgress.maxPoints) * 100) : 0}% Earned
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Quick Links - Second Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ExternalLink className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Quick Links</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Access your job search profiles and tools
                    </p>
                    
                    <div className="space-y-3">
                      {/* LinkedIn Profile */}
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                        <CardContent className="p-4">
                          <div 
                            className="flex items-center gap-3"
                            onClick={() => {
                              const linkedinUrl = profile?.linkedin_url || 'https://linkedin.com/in/';
                              window.open(linkedinUrl, '_blank');
                            }}
                          >
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              <Linkedin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">LinkedIn Profile</p>
                              <p className="text-xs text-muted-foreground">Visit your profile</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Naukri Profile */}
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                        <CardContent className="p-4">
                          <div 
                            className="flex items-center gap-3"
                            onClick={() => {
                              const naukriUrl = (profile as any)?.naukri_url || 'https://www.naukri.com/';
                              window.open(naukriUrl, '_blank');
                            }}
                          >
                            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                              <Briefcase className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Naukri Profile</p>
                              <p className="text-xs text-muted-foreground">Visit Naukri.com</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Glassdoor */}
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                        <CardContent className="p-4">
                          <div 
                            className="flex items-center gap-3"
                            onClick={() => {
                              const glassdoorUrl = (profile as any)?.glassdoor_url || 'https://www.glassdoor.com/';
                              window.open(glassdoorUrl, '_blank');
                            }}
                          >
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                              <Globe className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Glassdoor</p>
                              <p className="text-xs text-muted-foreground">Company reviews</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Find Your Next Role */}
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                        <CardContent className="p-4">
                          <Link to="/dashboard/find-your-next-role" className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                              <Search className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Find Your Next Role</p>
                              <p className="text-xs text-muted-foreground">Job search tools</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </CardContent>
                      </Card>

                      {/* Job Status Tracker */}
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
                        <CardContent className="p-4">
                          <Link to="/dashboard/job-tracker" className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                              <Target className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Job Status Tracker</p>
                              <p className="text-xs text-muted-foreground">Track applications</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

              {/* History Tab - Period summaries, audit trail */}
              <TabsContent value="history" className="space-y-6">
                <JobHunterHistory 
                  onViewDetails={() => {
                    setActiveTab('assignments');
                    // Scroll to weekly progress targets section
                    setTimeout(() => {
                      const element = document.querySelector('[data-section="weekly-progress-targets"]');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  weeklyStats={sidebarWeeklyStats}
                />
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