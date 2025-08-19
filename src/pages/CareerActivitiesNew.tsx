import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  Trophy, 
  Target, 
  RefreshCw, 
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useCareerTasks } from '@/hooks/useCareerTasks';
import { CareerTaskCard } from '@/components/CareerTaskCard';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

const CareerActivitiesNew = () => {
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
    : assignments.filter(assignment => assignment.career_task_templates.category === selectedCategory);

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
      : assignments.filter(a => a.career_task_templates.category === category);
    
    const completed = categoryAssignments.filter(a => a.status === 'verified').length;
    const total = categoryAssignments.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return { completed, total, progress };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <NavLink to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </NavLink>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Career Activities</h1>
              <p className="text-muted-foreground">Weekly tasks to grow your career with evidence-based verification</p>
            </div>
          </div>
          <Button 
            onClick={handleGenerateTasks} 
            disabled={generating || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating...' : 'Generate New Tasks'}
          </Button>
        </div>

        {/* Weekly Overview */}
        {weeklySchedule && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Week of {format(new Date(weeklySchedule.week_start_date), 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{weeklySchedule.tasks_completed}</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{weeklySchedule.total_tasks_assigned}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{weeklySchedule.points_earned}</div>
                  <div className="text-sm text-muted-foreground">Points Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{weeklySchedule.total_points_possible}</div>
                  <div className="text-sm text-muted-foreground">Possible Points</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Weekly Progress</span>
                  <span>{Math.round((weeklySchedule.tasks_completed / weeklySchedule.total_tasks_assigned) * 100)}%</span>
                </div>
                <Progress 
                  value={(weeklySchedule.tasks_completed / weeklySchedule.total_tasks_assigned) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              All Tasks
            </TabsTrigger>
            <TabsTrigger value="linkedin_growth" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              LinkedIn Growth
            </TabsTrigger>
            <TabsTrigger value="networking" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Networking
            </TabsTrigger>
            <TabsTrigger value="content_creation" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Content Creation
            </TabsTrigger>
          </TabsList>

          {/* Category Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['linkedin_growth', 'networking', 'content_creation'].map(category => {
              const stats = getCategoryStats(category);
              return (
                <Card 
                  key={category} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCategory === category ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(category)}
                      <span className="font-medium text-sm capitalize">
                        {category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {stats.completed} of {stats.total} completed
                      </div>
                      <Progress value={stats.progress} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Task List */}
          <TabsContent value={selectedCategory} className="space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading tasks...</span>
              </div>
            )}

            {!loading && filteredAssignments.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <div className="space-y-4">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium">No tasks assigned yet</h3>
                      <p className="text-muted-foreground">
                        Click "Generate New Tasks" to get your weekly assignments
                      </p>
                    </div>
                    <Button onClick={handleGenerateTasks} disabled={generating}>
                      {generating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating Tasks...
                        </>
                      ) : (
                        'Generate Tasks Now'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && filteredAssignments.length > 0 && (
              <div className="grid gap-6">
                {filteredAssignments.map((assignment) => (
                  <CareerTaskCard 
                    key={assignment.id} 
                    assignment={assignment}
                    evidence={assignment.evidence || []}
                    onSubmitEvidence={() => {}}
                    isSubmitting={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Career Growth Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Evidence Submission Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Provide clear, high-quality screenshots</li>
                <li>• Include relevant URLs when available</li>
                <li>• Write detailed descriptions of your work</li>
                <li>• Submit evidence within the week deadline</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Maximizing Your Points</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete tasks early in the week</li>
                <li>• Focus on quality over quantity</li>
                <li>• Follow all task instructions carefully</li>
                <li>• Engage authentically on LinkedIn</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Timezone Notice */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          All times are in Asia/Kolkata timezone. Tasks reset every Monday.
        </div>
      </div>
    </div>
  );
};

export default CareerActivitiesNew;