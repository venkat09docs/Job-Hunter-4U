import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Trophy,
  Home,
  Medal,
  Award,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { 
  AssignmentWithProgress, 
  LeaderboardEntry, 
  Course, 
  Module 
} from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import AIGeneralistsTab from '@/components/AIGeneralistsTab';
import AssignmentsTabContent from '@/components/AssignmentsTabContent';

const CareerLevelProgram: React.FC = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    loading, 
    getAssignmentsWithProgress, 
    getLeaderboard,
    getCourses,
    getModulesByCourse
  } = useCareerLevelProgram();
  
  // State for Assignments tab
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  
  // State for Leaderboard tab
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  
  // Get active tab from URL params or default to 'ai-generalists'
  const activeTab = searchParams.get('tab') || 'ai-generalists';

  useEffect(() => {
    if (user) {
      loadData();
      loadCourses();
      loadLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse !== 'all') {
      loadModules(selectedCourse);
    } else {
      setModules([]);
    }
    setSelectedModule('all');
    loadLeaderboard();
  }, [selectedCourse]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedModule]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Load data for Assignments
  const loadData = async () => {
    const assignmentsData = await getAssignmentsWithProgress();
    setAssignments(assignmentsData);
  };

  // Load data for Leaderboard
  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      const modulesData = await getModulesByCourse(courseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const courseId = selectedCourse !== 'all' ? selectedCourse : undefined;
      const moduleId = selectedModule !== 'all' ? selectedModule : undefined;
      
      const data = await getLeaderboard(courseId, moduleId);
      setLeaderboardData(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  // Helper functions for Leaderboard
  const getRankIcon = (position: number) => {
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
  };

  const getPositionStyles = (position: number) => {
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
  };

  // Leaderboard calculations
  const currentUserEntry = leaderboardData.find(entry => entry.user_id === user?.id);
  const currentUserRank = currentUserEntry 
    ? leaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
    : null;

  if (loading) {
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
          
          {/* Right side - User Profile */}
          <UserProfileDropdown />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-generalists">AI Generalists</TabsTrigger>
            <TabsTrigger value="assignments">My Assignments</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* AI Generalists Tab */}
          <TabsContent value="ai-generalists" className="space-y-6">
            <AIGeneralistsTab />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <AssignmentsTabContent assignments={assignments} onRefresh={loadData} />
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Participants
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {leaderboardData.length}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-blue-600">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Rank
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentUserRank ? `#${currentUserRank}` : 'Not ranked'}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-purple-600">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Points
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentUserEntry?.points_total || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-muted text-green-600">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Filter Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Course</label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger>
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
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Module</label>
                    <Select 
                      value={selectedModule} 
                      onValueChange={setSelectedModule}
                      disabled={selectedCourse === 'all'}
                    >
                      <SelectTrigger>
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
                  </div>

                  <div className="flex items-end">
                    <Button onClick={loadLeaderboard} disabled={loading}>
                      Refresh Rankings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Rankings
                  </span>
                  {selectedCourse !== 'all' && (
                    <Badge variant="secondary">
                      {courses.find(c => c.id === selectedCourse)?.title}
                      {selectedModule !== 'all' && modules.length > 0 && (
                        <span className="ml-2">
                          • {modules.find(m => m.id === selectedModule)?.title}
                        </span>
                      )}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      No rankings available
                    </h3>
                    <p className="text-muted-foreground">
                      Complete assignments to appear on the leaderboard
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData.map((entry, index) => {
                      const position = index + 1;
                      const isCurrentUser = entry.user_id === user?.id;
                      
                      return (
                        <div
                          key={entry.id}
                          className={`
                            flex items-center justify-between p-4 rounded-lg border transition-colors
                            ${getPositionStyles(position)}
                            ${isCurrentUser ? 'ring-2 ring-primary ring-opacity-50' : ''}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10">
                              {getRankIcon(position)}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.user?.profile_image_url} />
                                <AvatarFallback>
                                  {entry.user?.full_name?.charAt(0) || 
                                   entry.user?.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {entry.user?.full_name || entry.user?.username || 'Anonymous'}
                                  </p>
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-xs">
                                      You
                                    </Badge>
                                  )}
                                </div>
                                {entry.user?.username && entry.user?.full_name && (
                                  <p className="text-sm text-muted-foreground">
                                    @{entry.user.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              {entry.points_total}
                            </p>
                            <p className="text-sm text-muted-foreground">points</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Performance Section */}
            {currentUserEntry && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        #{currentUserRank}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Rank</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {currentUserEntry.points_total}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {leaderboardData.length > 0 ? 
                          Math.round(((leaderboardData.length - (currentUserRank || 0) + 1) / leaderboardData.length) * 100) : 0
                        }%
                      </div>
                      <div className="text-sm text-muted-foreground">Percentile</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CareerLevelProgram;