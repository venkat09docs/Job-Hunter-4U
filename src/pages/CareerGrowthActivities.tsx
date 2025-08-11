import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Target, CheckCircle, Clock, BookOpen, Users, Star, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";

interface Activity {
  id: string;
  title: string;
  description: string;
  category: 'skill' | 'networking' | 'learning' | 'application';
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  progress: number;
  estimatedTime: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Complete React.js Certification',
    description: 'Enhance your frontend development skills with React.js certification',
    category: 'skill',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-01-15',
    progress: 65,
    estimatedTime: '2 weeks'
  },
  {
    id: '2',
    title: 'Attend Tech Networking Event',
    description: 'Connect with industry professionals at the local tech meetup',
    category: 'networking',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-01-10',
    progress: 0,
    estimatedTime: '1 day'
  },
  {
    id: '3',
    title: 'Update LinkedIn Profile',
    description: 'Optimize LinkedIn profile with recent achievements and skills',
    category: 'application',
    status: 'completed',
    priority: 'high',
    progress: 100,
    estimatedTime: '2 hours'
  },
  {
    id: '4',
    title: 'Read "Clean Code" Book',
    description: 'Improve coding practices by reading Robert Martin\'s Clean Code',
    category: 'learning',
    status: 'in-progress',
    priority: 'medium',
    progress: 40,
    estimatedTime: '3 weeks'
  },
  {
    id: '5',
    title: 'Apply to 5 New Positions',
    description: 'Submit applications to target companies in your field',
    category: 'application',
    status: 'pending',
    priority: 'high',
    dueDate: '2024-01-12',
    progress: 0,
    estimatedTime: '1 week'
  }
];

export default function CareerGrowthActivities() {
  const [activities] = useState<Activity[]>(mockActivities);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getCategoryIcon = (category: Activity['category']) => {
    switch (category) {
      case 'skill': return <Target className="h-4 w-4" />;
      case 'networking': return <Users className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      case 'application': return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const completedCount = activities.filter(a => a.status === 'completed').length;
  const inProgressCount = activities.filter(a => a.status === 'in-progress').length;
  const pendingCount = activities.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <NavLink to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </NavLink>
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Career Growth Activities</h1>
            <p className="text-muted-foreground">Track and manage your professional development activities</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Activities</TabsTrigger>
            <TabsTrigger value="skill">Skills</TabsTrigger>
            <TabsTrigger value="networking">Networking</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(activity.category)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{activity.title}</h3>
                        <Badge className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                        {getStatusIcon(activity.status)}
                      </div>
                      <p className="text-muted-foreground mb-3">{activity.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Category: {activity.category}</span>
                        <span>Time: {activity.estimatedTime}</span>
                        {activity.dueDate && (
                          <span>Due: {new Date(activity.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{activity.progress}%</span>
                  </div>
                </div>
                
                {activity.status !== 'completed' && (
                  <div className="space-y-2">
                    <Progress value={activity.progress} className="h-2" />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Update Progress
                      </Button>
                      {activity.status === 'pending' && (
                        <Button size="sm">
                          Start Activity
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activities found</h3>
            <p className="text-muted-foreground">No activities match your current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}