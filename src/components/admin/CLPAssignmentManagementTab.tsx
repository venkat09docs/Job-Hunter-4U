import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Users,
  Filter,
  Plus,
  Send
} from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { Assignment, Course } from '@/types/clp';
import { useCourseContent } from '@/hooks/useCourseContent';
import { ASSIGNMENT_STATUS_LABELS } from '@/types/clp';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CLPAssignmentManagementTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    loading, 
    getAssignments, 
    getCourses, 
    deleteAssignment,
    publishAssignment
  } = useCareerLevelProgram();
  const { getSectionsByCourse } = useCourseContent();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      // Filter courses by category when category changes
      setSelectedCourse('all');
      setSelectedSection('all');
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Don't clear sections when filter changes - we need all sections for display
    setSelectedSection('all');
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      const [assignmentsData, coursesData] = await Promise.all([
        getAssignments(),
        getCourses()
      ]);
      
      setAssignments(assignmentsData);
      setCourses(coursesData);
      
      // Extract unique categories from courses
      const uniqueCategories = [...new Set(coursesData.map(course => course.category).filter(Boolean))];
      setCategories(uniqueCategories);

      // Load all sections for all courses to display assignment course/section info
      const allSections: CourseSection[] = [];
      for (const course of coursesData) {
        try {
          const courseSections = await getSectionsByCourse(course.id);
          allSections.push(...courseSections);
        } catch (error) {
          console.error(`Failed to load sections for course ${course.id}:`, error);
        }
      }
      setSections(allSections);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive"
      });
    }
  };

  const loadSections = async (courseId: string) => {
    try {
      const sectionsData = await getSectionsByCourse(courseId);
      setSections(sectionsData);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteAssignment(assignmentId);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
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
      // Update the assignment in the local state
      setAssignments(assignments.map(a => 
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

  // Get filtered courses based on selected category
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.instructions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Find the course that contains the section for this assignment
    const assignmentSection = sections.find(section => section.id === assignment.section_id);
    const assignmentCourse = assignmentSection ? courses.find(course => course.id === assignmentSection.course_id) : null;
    
    const matchesCategory = selectedCategory === 'all' || (assignmentCourse && assignmentCourse.category === selectedCategory);
    const matchesCourse = selectedCourse === 'all' || (assignmentSection && assignmentSection.course_id === selectedCourse);
    const matchesSection = selectedSection === 'all' || assignment.section_id === selectedSection;

    return matchesSearch && matchesCategory && matchesCourse && matchesSection;
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={selectedCategory !== 'all' && filteredCourses.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {filteredCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedCourse === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div>
        <p className="text-sm text-muted-foreground">
          Showing {filteredAssignments.length} of {assignments.length} assignments
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
            {assignments.length === 0 ? 
              "You haven't created any assignments yet." : 
              "No assignments match your current filters."}
          </p>
          {assignments.length === 0 && (
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
                      <span>
                        {(() => {
                          const section = sections.find(s => s.id === assignment.section_id);
                          const course = section ? courses.find(c => c.id === section.course_id) : null;
                          return course && section ? `${course.title} • ${section.title}` : 'Unknown Course • Unknown Section';
                        })()}
                      </span>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Navigating to questions for assignment:', assignment.id);
                      console.log('Target URL:', `/dashboard/career-level/assignments/${assignment.id}/questions`);
                      navigate(`/dashboard/career-level/assignments/${assignment.id}/questions`);
                    }}
                  >
                    <Plus className="w-4 h-4" />
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
};

export default CLPAssignmentManagementTab;