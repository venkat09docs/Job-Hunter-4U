import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Users, ClipboardCheck, Trophy, Plus, Edit2, Eye, Home, Search, MoreVertical, Trash2 } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Course, Module } from '@/types/clp';

const CLPCoursesManagement = () => {
  const { user } = useAuth();
  const { role: userRole, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { loading, getCourses } = useCareerLevelProgram();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateModuleOpen, setIsCreateModuleOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    code: ''
  });
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order_index: 0
  });

  useEffect(() => {
    if (user && userRole && !roleLoading) {
      fetchCoursesData();
    }
  }, [user, userRole, roleLoading]);

  const fetchCoursesData = async () => {
    setCoursesLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('clp_courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);

      // Fetch modules for each course
      const modulesData: Record<string, Module[]> = {};
      for (const course of coursesData || []) {
        const { data: courseModules, error: modulesError } = await supabase
          .from('clp_modules')
          .select('*')
          .eq('course_id', course.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!modulesError && courseModules) {
          modulesData[course.id] = courseModules;
        }
      }
      setModules(modulesData);
      
    } catch (error) {
      console.error('Error fetching courses data:', error);
      toast.error('Failed to load courses data');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('clp_courses')
        .insert([{
          title: courseForm.title,
          description: courseForm.description,
          code: courseForm.code,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => [data, ...prev]);
      setCourseForm({ title: '', description: '', code: '' });
      setIsCreateCourseOpen(false);
      toast.success('Course created successfully');
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      const { data, error } = await supabase
        .from('clp_courses')
        .update({
          title: courseForm.title,
          description: courseForm.description,
          code: courseForm.code
        })
        .eq('id', editingCourse.id)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => prev.map(c => c.id === editingCourse.id ? data : c));
      setCourseForm({ title: '', description: '', code: '' });
      setEditingCourse(null);
      toast.success('Course updated successfully');
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course');
    }
  };

  const handleCreateModule = async () => {
    if (!selectedCourseId) return;

    try {
      const { data, error } = await supabase
        .from('clp_modules')
        .insert([{
          title: moduleForm.title,
          description: moduleForm.description,
          course_id: selectedCourseId,
          order_index: moduleForm.order_index
        }])
        .select()
        .single();

      if (error) throw error;

      setModules(prev => ({
        ...prev,
        [selectedCourseId]: [...(prev[selectedCourseId] || []), data].sort((a, b) => a.order_index - b.order_index)
      }));
      setModuleForm({ title: '', description: '', order_index: 0 });
      setIsCreateModuleOpen(false);
      setSelectedCourseId(null);
      toast.success('Module created successfully');
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('clp_courses')
        .update({ is_active: false })
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteModule = async (moduleId: string, courseId: string) => {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('clp_modules')
        .update({ is_active: false })
        .eq('id', moduleId);

      if (error) throw error;

      setModules(prev => ({
        ...prev,
        [courseId]: prev[courseId]?.filter(m => m.id !== moduleId) || []
      }));
      toast.success('Module deleted successfully');
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      code: course.code
    });
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roleLoading || coursesLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/career-level/dashboard')}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">CLP Dashboard</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Course Management</span>
            </div>
          </div>
          
          <UserProfileDropdown />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Course Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage courses and modules for the Career Level Program
            </p>
          </div>

          <Dialog open={isCreateCourseOpen} onOpenChange={setIsCreateCourseOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Add a new course to the Career Level Program
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    placeholder="Enter course title"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="course-code">Course Code</Label>
                  <Input
                    id="course-code"
                    placeholder="Enter course code (e.g., CS101)"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    placeholder="Enter course description"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateCourseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse} disabled={!courseForm.title || !courseForm.code}>
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="secondary">{course.code}</Badge>
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditCourse(course)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Modules Section */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Modules ({modules[course.id]?.length || 0})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setModuleForm({ title: '', description: '', order_index: (modules[course.id]?.length || 0) + 1 });
                        setIsCreateModuleOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Module
                    </Button>
                  </div>

                  {modules[course.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {modules[course.id].slice(0, 3).map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{module.title}</p>
                            {module.description && (
                              <p className="text-xs text-muted-foreground">{module.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModule(module.id, course.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {modules[course.id].length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{modules[course.id].length - 3} more modules
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No modules yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No courses match your search criteria.' : 'Get started by creating your first course.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateCourseOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-course-title">Course Title</Label>
              <Input
                id="edit-course-title"
                placeholder="Enter course title"
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-course-code">Course Code</Label>
              <Input
                id="edit-course-code"
                placeholder="Enter course code (e.g., CS101)"
                value={courseForm.code}
                onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-course-description">Description</Label>
              <Textarea
                id="edit-course-description"
                placeholder="Enter course description"
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse} disabled={!courseForm.title || !courseForm.code}>
              Update Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Module Dialog */}
      <Dialog open={isCreateModuleOpen} onOpenChange={setIsCreateModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Module</DialogTitle>
            <DialogDescription>
              Add a new module to the selected course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="module-title">Module Title</Label>
              <Input
                id="module-title"
                placeholder="Enter module title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="module-description">Description</Label>
              <Textarea
                id="module-description"
                placeholder="Enter module description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="module-order">Order Index</Label>
              <Input
                id="module-order"
                type="number"
                placeholder="Enter order index"
                value={moduleForm.order_index}
                onChange={(e) => setModuleForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateModule} disabled={!moduleForm.title}>
              Create Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CLPCoursesManagement;