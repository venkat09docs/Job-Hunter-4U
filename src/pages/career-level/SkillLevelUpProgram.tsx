import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Trophy,
  FileText,
  Timer,
  PlayCircle,
  Home,
  Medal,
  Award,
  Users,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { 
  AssignmentWithProgress, 
  Attempt, 
  LeaderboardEntry, 
  Course, 
  Module 
} from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS, ATTEMPT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import SkillDeveloperProgramsTab from '@/components/SkillDeveloperProgramsTab';
import { LearningGoalsSection } from '@/components/LearningGoalsSection';
import PricingDialog from '@/components/PricingDialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const SkillLevelUpProgram: React.FC = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  
  const { 
    loading, 
    getAssignmentsWithProgress, 
    getAttemptsByUser,
    getLeaderboard,
    getCourses,
    getModulesByCourse
  } = useCareerLevelProgram();
  
  // State for My Assignments tab
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  // State for Leaderboard tab
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
  // State for course enrollment flow
  const [pendingCourseEnrollment, setPendingCourseEnrollment] = useState<{ id: string; title: string } | null>(null);
  const [shouldOpenLearningGoalForm, setShouldOpenLearningGoalForm] = useState(false);
  
  // Internal loading state to avoid multiple loading indicators
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Get active tab from URL params or default to 'skill-programs'
  const activeTab = searchParams.get('tab') || 'skill-programs';

  // Optimized initial data loading - combine all API calls
  const loadAllData = useCallback(async () => {
    if (!user) return;
    
    setIsInitialLoading(true);
    try {
      // Load all data in parallel for better performance
      const [assignmentsData, attemptsData, coursesData, leaderboardData] = await Promise.all([
        getAssignmentsWithProgress(),
        getAttemptsByUser(),
        getCourses(),
        getLeaderboard()
      ]);
      
      setAssignments(assignmentsData);
      setAttempts(attemptsData);
      setCourses(coursesData);
      setLeaderboardData(leaderboardData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user, getAssignmentsWithProgress, getAttemptsByUser, getCourses, getLeaderboard]);

  // Load initial data only once
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle course/module changes for leaderboard (optimized)
  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadModules(selectedCourse);
    } else {
      setModules([]);
    }
    setSelectedModule('all');
  }, [selectedCourse]);

  // Optimized leaderboard loading
  const loadLeaderboardOptimized = useCallback(async () => {
    try {
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      const moduleId = selectedModule !== 'all' ? selectedModule : undefined;
      
      const data = await getLeaderboard(courseId, moduleId);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, [selectedCourse, selectedModule, getLeaderboard]);

  useEffect(() => {
    if (!isInitialLoading) {
      loadLeaderboardOptimized();
    }
  }, [selectedModule, loadLeaderboardOptimized, isInitialLoading]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Handle course enrollment - redirect to learning goals tab
  const handleCourseEnrollment = (courseId: string, courseTitle: string) => {
    setPendingCourseEnrollment({ id: courseId, title: courseTitle });
    setShouldOpenLearningGoalForm(true);
    setSearchParams({ tab: 'completed-learning' });
  };

  // Handle learning goal creation - redirect to course content
  const handleLearningGoalCreated = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  // Handle learning goal form closed
  const handleLearningGoalFormClosed = () => {
    setPendingCourseEnrollment(null);
    setShouldOpenLearningGoalForm(false);
  };

  // Load modules for selected course
  const loadModules = useCallback(async (courseId: string) => {
    try {
      const modulesData = await getModulesByCourse(courseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  }, [getModulesByCourse]);

  // Memoized calculations for better performance
  const filteredAssignments = useMemo(() => {
    const safeAssignments = assignments || [];
    return {
      upcoming: safeAssignments.filter(a => 
        a.status === 'scheduled' || (a.status === 'open' && a.canAttempt)
      ),
      active: safeAssignments.filter(a => 
        a.userAttempts.some(attempt => attempt.status === 'started')
      ),
      completed: safeAssignments.filter(a => 
        a.userAttempts.some(attempt => 
          attempt.status === 'submitted' || attempt.status === 'auto_submitted'
        )
      )
    };
  }, [assignments]);

  // Memoized leaderboard calculations
  const leaderboardStats = useMemo(() => {
    const safeLeaderboardData = leaderboardData || [];
    const currentUserEntry = safeLeaderboardData.find(entry => entry.user_id === user?.id);
    const currentUserRank = currentUserEntry 
      ? safeLeaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
      : null;
    
    return { currentUserEntry, currentUserRank };
  }, [leaderboardData, user?.id]);

  // Helper functions for My Assignments (memoized)
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getAttemptStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-500';
      case 'started': return 'bg-blue-500';
      case 'auto_submitted': return 'bg-orange-500';
      case 'invalidated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getDaysRemaining = useCallback((dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Helper functions for Leaderboard (memoized)
  const getRankIcon = useCallback((position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  }, []);

  const getPositionStyles = useCallback((position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default:
        return "bg-background border-border";
    }
  }, []);

  // Memoized assignment card rendering for better performance
  const renderAssignmentCard = useCallback((assignment: AssignmentWithProgress) => {
    const hasActiveAttempt = assignment.userAttempts.some(a => a.status === 'started');
    const isCompleted = assignment.userAttempts.some(a => 
      a.status === 'submitted' || a.status === 'auto_submitted'
    );
    
    const bestScore = assignment.userAttempts
      .filter(a => a.score_numeric !== null)
      .reduce((max, attempt) => 
        Math.max(max, attempt.score_numeric || 0), 0
      );

    return (
      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{assignment.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{assignment.module?.course?.title} • {assignment.module?.title}</span>
              </div>
            </div>
            <Badge 
              className={cn('text-white', getStatusColor(assignment.status))}
            >
              {ASSIGNMENT_STATUS_LABELS[assignment.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Assignment Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Timer className="w-4 h-4 mr-2" />
              <span>
                {assignment.duration_minutes ? 
                  `${assignment.duration_minutes} minutes` : 
                  'No time limit'
                }
              </span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Trophy className="w-4 h-4 mr-2" />
              <span>{assignment.max_attempts} attempt{assignment.max_attempts !== 1 ? 's' : ''}</span>
            </div>
            {assignment.due_at && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Due: {formatDateTime(assignment.due_at)}</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
              <FileText className="w-4 h-4 mr-2" />
              <span>Type: {assignment.type.toUpperCase()}</span>
            </div>
          </div>

          {/* Progress/Status */}
          {assignment.userAttempts.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Attempts: {assignment.userAttempts.length}/{assignment.max_attempts}</span>
                {bestScore > 0 && <span>Best Score: {bestScore.toFixed(1)}%</span>}
              </div>
              <Progress 
                value={(assignment.userAttempts.length / assignment.max_attempts) * 100} 
                className="h-2" 
              />
            </div>
          )}

          {/* Due Date Warning */}
          {assignment.due_at && assignment.status === 'open' && (
            <div className="text-sm">
              {(() => {
                const daysRemaining = getDaysRemaining(assignment.due_at);
                if (daysRemaining <= 1) {
                  return (
                    <div className="flex items-center text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Due {daysRemaining === 0 ? 'today' : 'tomorrow'}!</span>
                    </div>
                  );
                } else if (daysRemaining <= 3) {
                  return (
                    <div className="flex items-center text-orange-600 bg-orange-50 p-2 rounded">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Due in {daysRemaining} days</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Instructions */}
          {assignment.instructions && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">{assignment.instructions}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {hasActiveAttempt ? (
              <Button asChild className="flex-1">
                <Link to={`/career-level/attempt/${assignment.userAttempts.find(a => a.status === 'started')?.id}`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Attempt
                </Link>
              </Button>
            ) : assignment.canAttempt && assignment.status === 'open' ? (
              <Button asChild className="flex-1">
                <Link to={`/career-level/assignment/${assignment.id}/start`}>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Assignment
                </Link>
              </Button>
            ) : isCompleted ? (
              <Button variant="outline" asChild className="flex-1">
                <Link to={`/career-level/feedback/${assignment.userAttempts[0]?.id}`}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  View Results
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled className="flex-1">
                {assignment.status === 'scheduled' ? 'Not Started' : 
                 assignment.status === 'closed' ? 'Closed' : 
                 'No Attempts Remaining'}
              </Button>
            )}
            
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/career-level/assignment/${assignment.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [getStatusColor, formatDateTime, getDaysRemaining]); // Added dependencies for useCallback

  // Check if user needs to upgrade (no subscription)
  const needsUpgrade = !hasActiveSubscription();

  if (loading || isInitialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Dashboard</span>
              </Button>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Skill Level Up Program</span>
              </div>
            </div>
            <UserProfileDropdown />
          </div>
        </header>
        
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade page for unsubscribed users
  if (needsUpgrade) {
    return (
      <>
        <div className="min-h-screen bg-background">
          {/* Top Navigation Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-6">
              {/* Left side - Navigation */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Skill Level Up Program</span>
                </div>
              </div>
              
              {/* Right side - Action Buttons and User Profile */}
              <div className="flex items-center gap-3">
                {/* YouTube Channel Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.youtube.com/@career-levelup', '_blank')}
                  className="flex items-center gap-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">Go to YouTube Channel</span>
                </Button>
                
                {/* Career Level Up Community Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://members.risenshinetechnologies.com/communities/groups/career-level-up/home', '_blank')}
                  className="flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Career Level Up Community</span>
                </Button>
                
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-16 max-w-4xl">
            <div className="text-center">
              <div className="mb-8">
                <Lock className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Unlock Skill Level Up Program
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {profile?.subscription_plan === 'One Month Plan' 
                    ? `Upgrade from your ${profile.subscription_plan} to access advanced skill development programs, assignments, and compete on leaderboards.`
                    : 'Access advanced skill development programs, track assignments, and compete on leaderboards with a subscription plan.'
                  }
                </p>
              </div>

              <Card className="max-w-md mx-auto mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    <Trophy className="h-6 w-6 text-purple-500" />
                    Premium Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-left space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Interactive skill development programs</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Timed assignments and assessments</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Competitive leaderboards</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Progress tracking and analytics</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Certificates and badges</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => setPricingDialogOpen(true)}
                size="lg"
                className="px-8 py-6 text-lg"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <PricingDialog />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="container flex h-16 items-center justify-between px-6">
           {/* Left side - Navigation */}
           <div className="flex items-center gap-4">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => navigate('/dashboard')}
               className="flex items-center gap-2"
             >
               <Home className="h-4 w-4" />
               <span className="hidden sm:inline">Dashboard</span>
             </Button>
             <div className="hidden sm:block h-4 w-px bg-border" />
             <div className="flex items-center gap-2">
               <Trophy className="h-5 w-5 text-purple-500" />
               <span className="font-semibold">Skill Level Up Program</span>
             </div>
           </div>
           
           {/* Right side - Action Buttons and User Profile */}
           <div className="flex items-center gap-3">
             {/* YouTube Channel Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={() => window.open('https://www.youtube.com/@career-levelup', '_blank')}
               className="flex items-center gap-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors"
             >
               <ExternalLink className="h-4 w-4" />
               <span className="hidden sm:inline">Go to YouTube Channel</span>
             </Button>
             
             {/* Career Level Up Community Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={() => window.open('https://members.risenshinetechnologies.com/communities/groups/career-level-up/home', '_blank')}
               className="flex items-center gap-2 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
             >
               <Users className="h-4 w-4" />
               <span className="hidden sm:inline">Career Level Up Community</span>
             </Button>
             
             <UserProfileDropdown />
           </div>
         </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Skill Level Up Program
          </h1>
          <p className="text-muted-foreground">
            Track your assignments and compete with peers in your learning journey
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skill-programs">Skill Development Programs</TabsTrigger>
            <TabsTrigger value="assignments">My Assignments</TabsTrigger>
            <TabsTrigger value="completed-learning">Track Learning Goals</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Skill Developer Programs Tab */}
          <TabsContent value="skill-programs" className="space-y-6">
            <SkillDeveloperProgramsTab onEnrollCourse={handleCourseEnrollment} />
          </TabsContent>

          {/* My Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center">
                  <PlayCircle className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold">{filteredAssignments.upcoming.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{filteredAssignments.active.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{filteredAssignments.completed.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center">
                  <Trophy className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                     <p className="text-2xl font-bold">
                       {(assignments || []).reduce((total, assignment) => {
                         const bestAttempt = assignment.userAttempts
                           .filter(a => a.score_points !== null)
                           .reduce((max, attempt) => 
                             Math.max(max, attempt.score_points || 0), 0
                           );
                         return total + bestAttempt;
                       }, 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assignment Subtabs */}
            <Tabs defaultValue="available" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available" className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Available ({filteredAssignments.upcoming.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({filteredAssignments.active.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed ({filteredAssignments.completed.length})
                </TabsTrigger>
              </TabsList>

              {/* Available Assignments Tab */}
              <TabsContent value="available" className="space-y-4">
                {filteredAssignments.upcoming.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.upcoming.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No Available Assignments</h3>
                      <p className="text-sm text-muted-foreground">
                        All assignments are either in progress or completed.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Pending Assignments Tab */}
              <TabsContent value="pending" className="space-y-4">
                {filteredAssignments.active.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.active.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No Pending Assignments</h3>
                      <p className="text-sm text-muted-foreground">
                        You don't have any assignments in progress at the moment.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Completed Assignments Tab */}
              <TabsContent value="completed" className="space-y-4">
                {filteredAssignments.completed.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAssignments.completed.map(renderAssignmentCard)}
                  </div>
                ) : (
                  <Card className="p-8">
                    <div className="text-center">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No Completed Assignments</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete some assignments to see them here.
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Empty State for no assignments at all */}
            {assignments.length === 0 && (
              <Card className="p-12">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground">
                    Check back later for new assignments to complete.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Completed Learning Tab */}
          <TabsContent value="completed-learning" className="space-y-6">
            <LearningGoalsSection 
              shouldOpenForm={shouldOpenLearningGoalForm}
              courseInfo={pendingCourseEnrollment}
              onGoalCreated={handleLearningGoalCreated}
              onFormClosed={handleLearningGoalFormClosed}
            />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedCourse !== 'all' && (
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Current User Rank */}
            {leaderboardStats.currentUserRank && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Your Rank</h3>
                        <p className="text-sm text-muted-foreground">
                          You're currently ranked #{leaderboardStats.currentUserRank} out of {leaderboardData.length} participants
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {leaderboardStats.currentUserEntry?.points_total || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard
              </h2>
              
              <div className="space-y-2">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((entry, index) => {
                    const position = index + 1;
                    const isCurrentUser = entry.user_id === user?.id;
                    
                    return (
                      <Card 
                        key={entry.id}
                        className={cn(
                          "transition-colors duration-200",
                          getPositionStyles(position),
                          isCurrentUser && "ring-2 ring-primary"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8">
                                {getRankIcon(position)}
                              </div>
                              
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="text-sm">
                                  {entry.user?.full_name?.charAt(0) || 
                                   entry.user?.username?.charAt(0) ||
                                   entry.user_id.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <p className="font-medium">
                                  {entry.user?.full_name || entry.user?.username || `User ${entry.user_id.slice(-4)}`}
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      You
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Position #{position}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {entry.points_total}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                points
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
                    <p className="text-muted-foreground">
                      Complete assignments to appear on the leaderboard.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillLevelUpProgram;