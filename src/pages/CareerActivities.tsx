import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings
} from 'lucide-react';
import { useCareerTasks } from '@/hooks/useCareerTasks';
import { CareerTaskCard } from '@/components/CareerTaskCard';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

const CareerActivities = () => {
  const { 
    loading, 
    assignments, 
    weeklySchedule, 
    generateWeeklyTasks,
    getCurrentWeekStart
  } = useCareerTasks();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generating, setGenerating] = useState(false);

  // Filter assignments by category
  const filteredAssignments = selectedCategory === 'all' 
    ? assignments 
    : assignments.filter(assignment => assignment.template.category === selectedCategory);

  // Get week dates for display
  const getWeekDates = () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(monday, i));
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      await generateWeeklyTasks(true); // Force regenerate
      toast.success('New tasks generated successfully!');
    } catch (error) {
      toast.error('Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'linkedin_growth': return <Users className="w-4 h-4" />;
      case 'networking': return <MessageSquare className="w-4 h-4" />;
      case 'content_creation': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryStats = (category: string) => {
    const categoryAssignments = category === 'all' 
      ? assignments 
      : assignments.filter(a => a.template.category === category);
    
    const completed = categoryAssignments.filter(a => a.status === 'verified').length;
    const total = categoryAssignments.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, progress };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">Career Activities Management</h1>
              <p className="text-muted-foreground mt-2">Manage and monitor career development activities across the platform</p>
            </div>
          </div>
          <Button 
            onClick={handleGenerateTasks} 
            disabled={generating || loading}
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate New Tasks'}
          </Button>
        </div>

        {/* Admin Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">1,234</p>
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
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">5,678</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">892</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            {/* Weekly Overview */}
            {weeklySchedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    Week of {format(new Date(weeklySchedule.week_start_date), 'MMMM d, yyyy')} - System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{weeklySchedule.tasks_completed}</div>
                      <div className="text-sm text-muted-foreground">Tasks Completed</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{weeklySchedule.total_tasks_assigned}</div>
                      <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">{weeklySchedule.points_earned}</div>
                      <div className="text-sm text-muted-foreground">Points Earned</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{weeklySchedule.total_points_possible}</div>
                      <div className="text-sm text-muted-foreground">Possible Points</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Overall Weekly Progress</span>
                      <span>{Math.round((weeklySchedule.tasks_completed / weeklySchedule.total_tasks_assigned) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(weeklySchedule.tasks_completed / weeklySchedule.total_tasks_assigned) * 100} 
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Management Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="all" className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  All Categories
                </TabsTrigger>
                <TabsTrigger value="linkedin_growth" className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  LinkedIn Growth
                </TabsTrigger>
                <TabsTrigger value="networking" className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Networking
                </TabsTrigger>
                <TabsTrigger value="content_creation" className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Content Creation
                </TabsTrigger>
              </TabsList>

              {/* Category Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['linkedin_growth', 'networking', 'content_creation'].map(category => {
                  const stats = getCategoryStats(category);
                  return (
                    <Card 
                      key={category} 
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedCategory === category ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getCategoryIcon(category)}
                          </div>
                          <span className="font-semibold text-lg capitalize">
                            {category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{stats.completed}</span> of <span className="font-medium text-foreground">{stats.total}</span> tasks completed
                          </div>
                          <Progress value={stats.progress} className="h-2" />
                          <div className="text-right text-sm font-medium text-primary">
                            {Math.round(stats.progress)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Task Management */}
              <TabsContent value={selectedCategory} className="space-y-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                      <span className="mt-2 text-muted-foreground">Loading career activities...</span>
                    </div>
                  </div>
                )}

                {!loading && filteredAssignments.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <div className="space-y-6">
                        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">No activities found</h3>
                          <p className="text-muted-foreground">
                            No career activities are currently assigned for this category.
                          </p>
                        </div>
                        <Button onClick={handleGenerateTasks} disabled={generating} size="lg">
                          {generating ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Generating Activities...
                            </>
                          ) : (
                            <>
                              <Target className="w-5 h-5 mr-2" />
                              Generate New Activities
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!loading && filteredAssignments.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">
                        {selectedCategory === 'all' 
                          ? `All Activities (${filteredAssignments.length})` 
                          : `${selectedCategory.replace('_', ' ')} Activities (${filteredAssignments.length})`
                        }
                      </h3>
                      <Badge variant="outline" className="text-sm">
                        {filteredAssignments.filter(a => a.status === 'verified').length} Completed
                      </Badge>
                    </div>
                    
                    <div className="grid gap-6">
                      {filteredAssignments.map((assignment) => (
                        <CareerTaskCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-6 h-6" />
                  Career Activities Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Task Generation Settings</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Configure automatic task generation frequency</p>
                      <p>• Set difficulty levels for different user segments</p>
                      <p>• Customize point rewards for task completion</p>
                      <p>• Manage task categories and templates</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-primary">Notification Settings</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Configure reminder notifications for pending tasks</p>
                      <p>• Set up admin alerts for task submissions</p>
                      <p>• Customize weekly progress reports</p>
                    </div>
                  </div>
                  <Button className="mt-6">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Admin Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Career Activities Management Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Task Generation & Management</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Tasks are automatically generated weekly for all active users</li>
                    <li>• Focus on LinkedIn growth, networking, and content creation</li>
                    <li>• Monitor completion rates and adjust difficulty as needed</li>
                    <li>• Review and verify evidence submissions promptly</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Quality Assurance</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Ensure evidence submissions meet verification criteria</li>
                    <li>• Provide constructive feedback for rejected submissions</li>
                    <li>• Track user engagement and progress trends</li>
                    <li>• Maintain high standards for career development activities</li>
                  </ul>
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