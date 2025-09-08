import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, ClipboardCheck, Trophy, Plus, Eye } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';

const CLPDashboard = () => {
  const { user } = useAuth();
  const { role: userRole, loading: roleLoading } = useRole();
  const { loading } = useCareerLevelProgram();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to load before checking permissions
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'recruiter' || userRole === 'institute_admin';

  if (!isAdmin) {
    return <Navigate to="/dashboard/career-level/my-assignments" replace />;
  }

  const stats = [
    {
      title: 'Total Courses',
      value: '8',
      change: '+2 this month',
      icon: BookOpen,
      color: 'text-blue-600'
    },
    {
      title: 'Active Students',
      value: '245',
      change: '+18 this week',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Pending Reviews',
      value: '23',
      change: '4 urgent',
      icon: ClipboardCheck,
      color: 'text-orange-600'
    },
    {
      title: 'Assignments',
      value: '156',
      change: '12 published today',
      icon: Trophy,
      color: 'text-purple-600'
    }
  ];

  const quickActions = [
    {
      title: 'Create Assignment',
      description: 'Build a new assignment for your course',
      icon: Plus,
      path: '/dashboard/career-level/assignments/new',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      title: 'Review Submissions',
      description: 'Check pending assignment submissions',
      icon: ClipboardCheck,
      path: '/dashboard/career-level/reviews',
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
    },
    {
      title: 'View Leaderboard',
      description: 'Monitor student progress and rankings',
      icon: Trophy,
      path: '/dashboard/career-level/leaderboard',
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      title: 'Manage Courses',
      description: 'Organize courses and modules',
      icon: Eye,
      path: '/dashboard/career-level/courses',
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Career Level Program
          </h1>
          <p className="text-muted-foreground">
            Manage courses, assignments, and track student progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
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

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-6 justify-start ${action.color}`}
                  asChild
                >
                  <div className="cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-background/50">
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm opacity-80">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">React Fundamentals Quiz</p>
                        <p className="text-sm text-muted-foreground">John Doe</p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {item}
                      </div>
                      <div>
                        <p className="font-medium">Sarah Wilson</p>
                        <p className="text-sm text-muted-foreground">Advanced React</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-primary">
                      {95 - item * 2}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CLPDashboard;