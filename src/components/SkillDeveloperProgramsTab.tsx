import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Star, ArrowRight, Plus, Lock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { useCourseContent } from '@/hooks/useCourseContent';
import type { Course } from '@/types/clp';
import PricingDialog from '@/components/PricingDialog';

// Course Card Component - Moved before main component
const CourseCard: React.FC<{ 
  course: Course; 
  isEnrolled: boolean;
  canAccess: boolean;
  sectionsCount: number;
  lecturesCount: number;
  onEnrollCourse?: (course: Course) => void;
  onViewCourse?: (courseId: string) => void;
  onShowUpgrade?: () => void;
}> = ({ course, isEnrolled, canAccess, sectionsCount, lecturesCount, onEnrollCourse, onViewCourse, onShowUpgrade }) => {
  const isLocked = !canAccess;
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        {/* Course Image */}
        <div className="h-56 relative overflow-hidden bg-muted/30">
          {course.image ? (
            <img 
              src={course.image} 
              alt={course.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-purple to-teal" />
          )}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              {course.code}
            </Badge>
          </div>
          <div className="absolute bottom-4 right-16">
            <Badge className="bg-white/90 text-primary text-xs">
              {course.category}
            </Badge>
          </div>
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
          </div>
          
          {/* Course Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{sectionsCount} {sectionsCount === 1 ? 'Section' : 'Sections'}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{lecturesCount} {lecturesCount === 1 ? 'Lecture' : 'Lectures'}</span>
            </div>
          </div>
          
          <div className="flex items-start justify-between pt-2 gap-3">
            <div className="flex flex-wrap gap-2 flex-1">
              <Badge variant="secondary" className="text-xs">
                Beginner
              </Badge>
              <Badge variant="outline" className="text-xs">
                Certificate
              </Badge>
              {course.is_free && (
                <Badge variant="outline" className="text-xs text-success">
                  Free
                </Badge>
              )}
            </div>
            
            <Button 
              size="sm" 
              variant={isLocked ? "outline" : (isEnrolled ? "outline" : "default")}
              className="group/btn flex-shrink-0 min-w-fit"
              onClick={() => {
                if (isLocked) {
                  onShowUpgrade?.();
                } else if (isEnrolled) {
                  onViewCourse?.(course.id);
                } else {
                  onEnrollCourse?.(course);
                }
              }}
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 mr-1" />
                  <span className="whitespace-nowrap">Upgrade</span>
                </>
              ) : (
                <>
                  <span className="whitespace-nowrap">{isEnrolled ? "View Course" : "Enroll Now"}</span>
                  <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SkillDeveloperProgramsTabProps {
  onEnrollCourse?: (course: Course) => void;
}

const SkillDeveloperProgramsTab: React.FC<SkillDeveloperProgramsTabProps> = ({ onEnrollCourse }) => {
  const navigate = useNavigate();
  const { getCourses, loading } = useCareerLevelProgram();
  const { goals, loading: goalsLoading } = useLearningGoals();
  const { hasActiveSubscription, subscriptionPlan } = useProfile();
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [courseCounts, setCourseCounts] = useState<Record<string, { sections: number; lectures: number }>>({});


  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
      
      // Extract unique categories from both single category and categories array
      const allCategories = new Set<string>();
      coursesData.forEach(course => {
        // Add single category
        if (course.category) {
          allCategories.add(course.category);
        }
        // Add multiple categories if they exist
        if (course.categories && Array.isArray(course.categories)) {
          course.categories.forEach(cat => allCategories.add(cat));
        }
        // Fallback to General if no category
        if (!course.category && (!course.categories || course.categories.length === 0)) {
          allCategories.add('General');
        }
      });
      
      const uniqueCategories = ['all', ...Array.from(allCategories).sort()];
      setCategories(uniqueCategories);
      
      // Load sections and lectures count for each course
      const counts: Record<string, { sections: number; lectures: number }> = {};
      await Promise.all(
        coursesData.map(async (course) => {
          const sections = await getSectionsByCourse(course.id);
          let totalLectures = 0;
          
          // Get all chapters for all sections
          await Promise.all(
            sections.map(async (section) => {
              const chapters = await getChaptersBySection(section.id);
              totalLectures += chapters.length;
            })
          );
          
          counts[course.id] = {
            sections: sections.length,
            lectures: totalLectures
          };
        })
      );
      
      setCourseCounts(counts);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
      setCategories([]);
    }
  };

  const handleEnrollCourse = (course: Course) => {
    // Pass the full course object to parent handler
    if (onEnrollCourse) {
      onEnrollCourse(course);
    } else {
      // Fallback to direct navigation if no handler provided
      navigate(`/course/${course.id}`);
    }
  };

  const handleViewCourse = (courseId: string) => {
    // Navigate directly to course content view
    navigate(`/course/${courseId}`);
  };

  const isUserEnrolled = (courseId: string) => {
    return goals.some(goal => goal.course_id === courseId);
  };

  // Check if user can access a specific course
  // Simple logic: Free courses OR user has active subscription
  const canAccessCourse = (course: Course) => {
    // Free courses are always accessible
    if (course.is_free) return true;
    
    // Paid courses require active subscription
    return hasActiveSubscription();
  };

  // Helper function to check if course belongs to a category
  const courseMatchesCategory = (course: Course, category: string) => {
    if (category === 'all') return true;
    
    // Check single category field
    if (course.category === category) return true;
    
    // Check categories array
    if (course.categories && Array.isArray(course.categories)) {
      return course.categories.includes(category);
    }
    
    // Check for General fallback
    if (category === 'General' && !course.category && (!course.categories || course.categories.length === 0)) {
      return true;
    }
    
    return false;
  };

  // Filter courses by selected category and sort by order_index
  const filteredCourses = courses
    .filter(course => courseMatchesCategory(course, selectedCategory))
    .sort((a, b) => {
      const orderA = (a as any).order_index || 999;
      const orderB = (b as any).order_index || 999;
      return orderA - orderB;
    });

  if (loading || goalsLoading) {
    return (
      <div className="flex w-full gap-6">
        {/* Left Sidebar Skeleton - Hidden on mobile */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <div className="h-12 bg-muted rounded-lg mb-4 animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Content Skeleton */}
        <div className="flex-1 w-full px-4 md:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-full animate-pulse">
                <div className="h-56 bg-muted rounded-t-lg" />
                <CardContent className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div>
      {/* Mobile Category Buttons - Horizontal Scroll */}
      <div className="md:hidden mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max px-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full whitespace-nowrap"
            >
              {category === 'all' ? 'All Categories' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop Layout with Sidebar */}
      <div className="flex w-full gap-6">
        {/* Left Sidebar - Categories (Hidden on mobile) */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-4">
            <h3 className="text-lg font-bold mb-4 px-4 py-2 bg-muted/50 rounded-lg">
              Roadmaps
            </h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Courses Grid */}
        <div className="flex-1 w-full px-4 md:px-0">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-primary/10 to-purple/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                No Courses Available Yet
              </h3>
              <p className="text-muted-foreground text-lg">
                Skill Developer courses will be available soon. Stay tuned for exciting learning opportunities!
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-primary/10 to-purple/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                No Courses Found
              </h3>
              <p className="text-muted-foreground text-lg">
                No courses in this category. Try selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={isUserEnrolled(course.id)}
                  canAccess={canAccessCourse(course)}
                  sectionsCount={courseCounts[course.id]?.sections || 0}
                  lecturesCount={courseCounts[course.id]?.lectures || 0}
                  onEnrollCourse={handleEnrollCourse}
                  onViewCourse={handleViewCourse}
                  onShowUpgrade={() => setShowUpgradeDialog(true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Upgrade to Access Premium Courses
            </DialogTitle>
          </DialogHeader>
          <PricingDialog />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillDeveloperProgramsTab;