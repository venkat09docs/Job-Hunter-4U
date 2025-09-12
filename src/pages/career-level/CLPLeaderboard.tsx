import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Users, BookOpen, Home } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useAuth } from '@/hooks/useAuth';
import type { LeaderboardEntry, Course, Module } from '@/types/clp';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

const CLPLeaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getLeaderboard, getCourses, getModulesByCourse, loading } = useCareerLevelProgram();
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    loadCourses();
    loadLeaderboard();
  }, []);

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

  const currentUserEntry = leaderboardData.find(entry => entry.user_id === user?.id);
  const currentUserRank = currentUserEntry 
    ? leaderboardData.findIndex(entry => entry.user_id === user?.id) + 1 
    : null;

  const stats = [
    {
      label: 'Total Participants',
      value: leaderboardData.length,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Your Rank',
      value: currentUserRank ? `#${currentUserRank}` : 'Not ranked',
      icon: Trophy,
      color: 'text-purple-600'
    },
    {
      label: 'Your Points',
      value: currentUserEntry?.points_total || 0,
      icon: Award,
      color: 'text-green-600'
    }
  ];

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
              <span className="font-semibold">Career Level Up Program</span>
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
            Career Level Up Program Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Track your progress and compete with peers across courses and modules
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-8">
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
          <Card className="mt-8">
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
      </div>
    </div>
  );
};

export default CLPLeaderboard;