import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Star, ArrowRight, Filter, Plus, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types/clp';
import PricingDialog from '@/components/PricingDialog';

// Course Card Component - Moved before main component
const CourseCard: React.FC<{ 
  course: Course; 
  isEnrolled: boolean;
  hasActiveSubscription: boolean;
  onEnrollCourse?: (course: Course) => void;
  onViewCourse?: (courseId: string) => void;
  onShowUpgrade?: () => void;
}> = ({ course, isEnrolled, hasActiveSubscription, onEnrollCourse, onViewCourse, onShowUpgrade }) => {
  const isLocked = !course.is_free && !hasActiveSubscription;
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        {/* Course Image */}
        <div className="h-56 relative overflow-hidden">
          {course.image ? (
            <img 
              src={course.image} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-purple to-teal" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              {course.code}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/90 text-primary text-xs">
              {course.category}
            </Badge>
          </div>
          <div className="absolute bottom-4 right-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              {isLocked ? (
                <Lock className="h-5 w-5 text-white" />
              ) : (
                <BookOpen className="h-5 w-5 text-white" />
              )}
            </div>
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
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.description || "Comprehensive course covering fundamental concepts and practical applications"}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>8 hours</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>124</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber text-amber" />
              <span className="text-sm font-medium">4.8</span>
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
  const { hasActiveSubscription } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Subscription plan options
  const subscriptionPlans = [
    { value: 'all', label: 'All Plans' },
    { value: 'free', label: 'Free Courses' },
    { value: 'one_month', label: 'One Month Plan' },
    { value: 'three_months', label: 'Three Months Plan' },
    { value: 'six_months', label: 'Six Months Plan' },
    { value: 'one_year', label: 'One Year Plan' }
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(coursesData.map(course => course.category || 'General'))];
      setCategories(uniqueCategories);
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

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return `${hours}${hours === 1 ? ' hour' : ' hours'}`;
  };

  // Helper function to determine course subscription plan
  const getCourseSubscriptionPlan = (course: Course) => {
    if (course.is_free) return 'free';
    
    // If no subscription_plan_id is set, assume it's a one-month plan
    if (!course.subscription_plan_id) return 'one_month';
    
    // Map actual subscription plan UUIDs from database to our filter values
    const planMapping: Record<string, string> = {
      // Exact UUID mappings from database
      '4f72fb43-6e55-407e-969e-c83acfa5b05f': 'one_month',    // One Month Plan (30 days)
      'f077e30e-bdb9-4b09-9fa2-9c33a355189d': 'three_months', // 3 Months Plan (90 days)
      '726be3fc-fdd5-4a59-883a-6b60cd2f68c5': 'six_months',   // 6 Months Plan (180 days)
      'c0aff632-80b0-4832-827a-ece42aa37ead': 'one_year',     // 1 Year Plan (365 days)
    };
    
    // Map the subscription_plan_id to filter value
    const mappedPlan = planMapping[course.subscription_plan_id];
    
    if (mappedPlan) {
      return mappedPlan;
    }
    
    // Default fallback to one_month for unmapped plans
    console.warn('Unknown subscription plan ID:', course.subscription_plan_id, 'defaulting to one_month');
    return 'one_month';
  };

  // Filter courses by selected category and subscription plan, then sort by order_index
  const filteredCourses = courses
    .filter(course => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || 
        (course.category || 'General') === selectedCategory;
      
      // Subscription plan filter
      const planMatch = selectedSubscriptionPlan === 'all' || 
        getCourseSubscriptionPlan(course) === selectedSubscriptionPlan;
      
      return categoryMatch && planMatch;
    })
    .sort((a, b) => {
      const orderA = (a as any).order_index || 999;
      const orderB = (b as any).order_index || 999;
      return orderA - orderB;
    });

  // Group courses by category for display and sort each category by order_index
  const coursesByCategory = courses
    .filter(course => {
      // Apply subscription plan filter to grouped courses too
      const planMatch = selectedSubscriptionPlan === 'all' || 
        getCourseSubscriptionPlan(course) === selectedSubscriptionPlan;
      return planMatch;
    })
    .reduce((acc, course) => {
      const category = course.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(course);
      return acc;
    }, {} as Record<string, Course[]>);

  // Sort courses within each category by order_index
  Object.keys(coursesByCategory).forEach(category => {
    coursesByCategory[category].sort((a, b) => {
      const orderA = (a as any).order_index || 999;
      const orderB = (b as any).order_index || 999;
      return orderA - orderB;
    });
  });

  if (loading || goalsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-muted rounded-2xl p-6 flex-1 animate-pulse">
            <div className="h-8 bg-muted-foreground/20 rounded mb-3 w-3/4" />
            <div className="h-5 bg-muted-foreground/20 rounded w-full" />
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-10 w-36 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-80 animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-4 w-3/4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check if no courses match the current filters
  if (courses.length > 0 && filteredCourses.length === 0 && selectedCategory !== 'all') {
    return (
      <div className="space-y-6">
        {/* Show filters even when no results */}
        {(categories.length > 0 || subscriptionPlans.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
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
            )}
            
            {/* Subscription Plan Filter */}
            <Select value={selectedSubscriptionPlan} onValueChange={setSelectedSubscriptionPlan}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-primary/10 to-purple/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            No Courses Found
          </h3>
          <p className="text-muted-foreground text-lg">
            No courses match your current filter criteria. Try adjusting your filters or check back later for new courses.
          </p>
        </div>
      </div>
    );
  }

  // Check if no courses match filters when viewing grouped by category (all categories)
  if (courses.length > 0 && selectedCategory === 'all' && Object.keys(coursesByCategory).length === 0) {
    return (
      <div className="space-y-6">
        {/* Show filters even when no results */}
        {(categories.length > 0 || subscriptionPlans.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
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
            )}
            
            {/* Subscription Plan Filter */}
            <Select value={selectedSubscriptionPlan} onValueChange={setSelectedSubscriptionPlan}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-primary/10 to-purple/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            No Courses Found
          </h3>
          <p className="text-muted-foreground text-lg">
            No courses match your current filter criteria. Try adjusting your filters or check back later for new courses.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {(categories.length > 0 || subscriptionPlans.length > 0) && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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
          )}
          
          {/* Subscription Plan Filter */}
          <Select value={selectedSubscriptionPlan} onValueChange={setSelectedSubscriptionPlan}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              {subscriptionPlans.map((plan) => (
                <SelectItem key={plan.value} value={plan.value}>
                  {plan.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Courses Display */}
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
      ) : selectedCategory === 'all' ? (
        // Display courses grouped by category when "All" is selected
        <div className="space-y-8">
          {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-foreground">{category}</h3>
                <Badge variant="secondary" className="text-xs">
                  {categoryCourses.length} course{categoryCourses.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categoryCourses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course}
                  isEnrolled={isUserEnrolled(course.id)}
                  hasActiveSubscription={hasActiveSubscription()}
                  onEnrollCourse={handleEnrollCourse}
                  onViewCourse={handleViewCourse}
                  onShowUpgrade={() => setShowUpgradeDialog(true)}
                />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Display filtered courses when specific category is selected
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course}
            isEnrolled={isUserEnrolled(course.id)}
            hasActiveSubscription={hasActiveSubscription()}
            onEnrollCourse={handleEnrollCourse}
            onViewCourse={handleViewCourse}
            onShowUpgrade={() => setShowUpgradeDialog(true)}
          />
          ))}
        </div>
      )}

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