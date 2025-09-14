import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Star, ArrowRight, MessageSquare, ExternalLink, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { Course } from '@/types/clp';

// Course Card Component - Moved before main component
const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
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
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </div>
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
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Beginner
              </Badge>
              <Badge variant="outline" className="text-xs">
                Certificate
              </Badge>
            </div>
            
            <Button 
              size="sm" 
              className="group/btn"
              onClick={() => {
                // TODO: Navigate to course detail or enrollment
                console.log('Enroll in course:', course.id);
              }}
            >
              <span>Enroll</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SkillDeveloperProgramsTab: React.FC = () => {
  const { getCourses, loading } = useCareerLevelProgram();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

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

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return `${hours}${hours === 1 ? ' hour' : ' hours'}`;
  };

  // Filter courses by selected category and sort by order_index
  const filteredCourses = (selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => (course.category || 'General') === selectedCategory))
    .sort((a, b) => {
      const orderA = (a as any).order_index || 999;
      const orderB = (b as any).order_index || 999;
      return orderA - orderB;
    });

  // Group courses by category for display and sort each category by order_index
  const coursesByCategory = courses.reduce((acc, course) => {
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

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Header with Three Boards in Same Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* YouTube Channel Access Board - Takes more space */}
        <div className="lg:col-span-6">
          <Card className="bg-gradient-to-r from-red-500/10 via-red-600/10 to-red-700/10 border-red-500/20 hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                onClick={() => window.open('https://youtube.com', '_blank')}>
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 w-12 h-12 rounded-full flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Join Our Community Advanced Programs
                  </h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Access exclusive video tutorials, live sessions, and advanced programming courses on our YouTube channel
                </p>
                <Button 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open('https://youtube.com', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to YouTube Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Join Community Board */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-br from-emerald/10 via-teal/10 to-cyan/10 border-emerald/20 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="bg-gradient-to-r from-emerald to-teal w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  Join Our Community
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect with 10,000+ professionals and enthusiasts worldwide
                </p>
              </div>
              <Button 
                size="sm"
                className="w-full bg-gradient-to-r from-emerald to-teal hover:from-emerald-dark hover:to-teal-dark"
                onClick={() => {
                  console.log('Join Community clicked');
                }}
              >
                Join Now
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Advanced Programs Board */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-br from-violet/10 via-purple/10 to-pink/10 border-violet/20 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="bg-gradient-to-r from-violet to-purple w-10 h-10 rounded-full flex items-center justify-center mb-3">
                  <ExternalLink className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  Advanced Programs
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Explore specialized tracks and advanced learning paths
                </p>
              </div>
              <Button 
                size="sm"
                className="w-full bg-gradient-to-r from-violet to-purple hover:from-violet-dark hover:to-purple-dark"
                onClick={() => {
                  console.log('Advanced Programs clicked');
                }}
              >
                View Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Category:</span>
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {categoryCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Display filtered courses when specific category is selected
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillDeveloperProgramsTab;