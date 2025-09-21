import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types/clp';

interface RecentCoursesCardProps {
  courses: Course[];
  hasActiveSubscription: boolean;
  loading?: boolean;
}

export const RecentCoursesCard: React.FC<RecentCoursesCardProps> = ({ 
  courses, 
  hasActiveSubscription,
  loading = false 
}) => {
  const navigate = useNavigate();

  const handleViewCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Learning Goals with Courses</h3>
        <p className="text-muted-foreground mb-4">
          Create learning goals with associated courses to see them here.
        </p>
        <Button 
          onClick={() => navigate('/dashboard/skill-level?tab=completed-learning')}
          variant="outline"
        >
          Create Learning Goal
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {courses.slice(0, 3).map((course) => {
        const isLocked = !course.is_free && !hasActiveSubscription;
        
        return (
          <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative overflow-hidden h-[400px] flex flex-col">
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
              {course.image ? (
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <BookOpen className="h-16 w-16 text-white" />
                </div>
              )}
              
              {/* Lock overlay for premium courses */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Lock className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">Premium Course</p>
                  </div>
                </div>
              )}

              {/* Category badges overlay */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge variant="secondary" className="text-xs bg-white/90 text-foreground">
                  {course.category || 'General'}
                </Badge>
                <Badge variant="secondary" className="text-xs bg-white/90 text-foreground">
                  Certificate
                </Badge>
              </div>
            </div>

            <div className="flex flex-col flex-grow p-4">
              <div className="flex-grow">
                <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {course.description || course.title}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Beginner
                  </Badge>
                  {course.is_free && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      Free
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleViewCourse(course.id)}
                variant={isLocked ? "outline" : "default"}
                className="w-full group/btn mt-auto"
                disabled={isLocked}
              >
                {isLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="whitespace-nowrap">Upgrade to Access</span>
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap">Continue Learning</span>
                    <Play className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};