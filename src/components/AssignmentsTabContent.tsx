import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Medal,
  Award,
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  Plus,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { 
  AssignmentWithProgress, 
  Assignment,
  Attempt, 
  Course, 
  Module 
} from '@/types/clp';
import { ASSIGNMENT_STATUS_LABELS, ATTEMPT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AssignmentsTabContentProps {
  assignments: AssignmentWithProgress[];
  attempts: Attempt[];
}

const AssignmentsTabContent: React.FC<AssignmentsTabContentProps> = ({
  assignments,
  attempts
}) => {
  const { user } = useAuth();
  const { role: userRole } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    loading, 
    getAssignments, 
    getCourses, 
    getModulesByCourse,
    deleteAssignment,
    publishAssignment
  } = useCareerLevelProgram();

  // Admin states
  const [adminAssignments, setAdminAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const isAdmin = userRole === 'admin' || userRole === 'recruiter' || userRole === 'institute_admin';

  useEffect(() => {
    if (isAdmin && user) {
      fetchAdminData();
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (isAdmin && selectedCourse !== 'all') {
      loadModules(selectedCourse);
    } else {
      setModules([]);
    }
    setSelectedModule('all');
  }, [selectedCourse, isAdmin]);

  const fetchAdminData = async () => {
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        getAssignments(),
        getCourses()
      ]);
      
      setAdminAssignments(assignmentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive"
      });
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

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAssignment(assignmentId);
      setAdminAssignments(adminAssignments.filter(a => a.id !== assignmentId));
      toast({
        title: "Success",
        description: "Assignment deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive"
      });
    }
  };

  const handlePublishAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to publish this assignment? Students will be able to access it immediately.')) {
      return;
    }

    try {
      await publishAssignment(assignmentId);
      setAdminAssignments(adminAssignments.map(a => 
        a.id === assignmentId ? { ...a, is_published: true } : a
      ));
      toast({
        title: "Success",
        description: "Assignment published successfully"
      });
    } catch (error) {
      console.error('Error publishing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to publish assignment",
        variant: "destructive"
      });
    }
  };

  const getAssignmentStatus = (assignment: Assignment): string => {
    const now = new Date();
    const visible_from = assignment.visible_from ? new Date(assignment.visible_from) : null;
    const start_at = assignment.start_at ? new Date(assignment.start_at) : null;
    const end_at = assignment.end_at ? new Date(assignment.end_at) : null;
    
    if (!assignment.is_published) return 'draft';
    if (end_at && now > end_at) return 'closed';
    if (start_at && now < start_at) return 'scheduled';
    if (visible_from && now < visible_from) return 'scheduled';
    return 'open';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'closed': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter assignments based on search and filters (admin view)
  const filteredAssignments = adminAssignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.instructions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse === 'all' || assignment.module?.course_id === selectedCourse;
    const matchesModule = selectedModule === 'all' || assignment.module_id === selectedModule;
    const matchesStatus = selectedStatus === 'all' || getAssignmentStatus(assignment) === selectedStatus;
    const matchesType = selectedType === 'all' || assignment.type === selectedType;

    return matchesSearch && matchesCourse && matchesModule && matchesStatus && matchesType;
  });

  // Student view helper functions
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter assignments by status for student view
  const upcomingAssignments = assignments.filter(a => 
    a.status === 'scheduled' || (a.status === 'open' && a.canAttempt)
  );
  
  const activeAssignments = assignments.filter(a => 
    a.userAttempts.some(attempt => attempt.status === 'started')
  );
  
  const completedAssignments = assignments.filter(a => 
    a.userAttempts.some(attempt => 
      attempt.status === 'submitted' || attempt.status === 'auto_submitted'
    )
  );

  const renderStudentAssignmentCard = (assignment: AssignmentWithProgress) => {
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
  };

  // Admin view
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Manage Assignments
            </h2>
            <p className="text-muted-foreground">
              View, edit, and manage all your course assignments
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/career-level/assignments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Module</label>
                <Select value={selectedModule} onValueChange={setSelectedModule} disabled={selectedCourse === 'all'}>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredAssignments.length} of {adminAssignments.length} assignments
          </p>
        </div>

        {/* Assignments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-muted-foreground mb-4">
              {adminAssignments.length === 0 ? 
                "You haven't created any assignments yet." : 
                "No assignments match your current filters."}
            </p>
            {adminAssignments.length === 0 && (
              <Button onClick={() => navigate('/dashboard/career-level/assignments/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assignment
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 line-clamp-2">{assignment.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span>{assignment.module?.course?.title} • {assignment.module?.title}</span>
                      </div>
                    </div>
                    <Badge className={cn('text-white ml-2', getStatusColor(getAssignmentStatus(assignment)))}>
                      {ASSIGNMENT_STATUS_LABELS[getAssignmentStatus(assignment) as keyof typeof ASSIGNMENT_STATUS_LABELS]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Assignment Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {assignment.duration_minutes ? 
                          `${assignment.duration_minutes}m` : 
                          'No limit'
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{assignment.max_attempts} attempt{assignment.max_attempts !== 1 ? 's' : ''}</span>
                    </div>
                    {assignment.due_at && (
                      <div className="flex items-center text-muted-foreground col-span-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  {assignment.instructions && (
                    <div className="text-sm text-muted-foreground">
                      <p className="line-clamp-2">{assignment.instructions}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/dashboard/career-level/assignments/${assignment.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/dashboard/career-level/assignments/${assignment.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!assignment.is_published && (
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handlePublishAssignment(assignment.id)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student view
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <PlayCircle className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{upcomingAssignments.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{activeAssignments.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedAssignments.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold">
                {attempts.reduce((sum, attempt) => sum + attempt.score_points, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignment Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Available ({upcomingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            In Progress ({activeAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingAssignments.map(renderStudentAssignmentCard)}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No assignments available</h3>
              <p className="text-sm text-muted-foreground">
                Check back later for new assignments or contact your instructor.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAssignments.map(renderStudentAssignmentCard)}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No active assignments</h3>
              <p className="text-sm text-muted-foreground">
                Start an assignment to see it here.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedAssignments.map(renderStudentAssignmentCard)}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No completed assignments</h3>
              <p className="text-sm text-muted-foreground">
                Complete assignments to see them here.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssignmentsTabContent;