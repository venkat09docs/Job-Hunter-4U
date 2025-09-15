import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types/clp';

interface RecentCoursesCardProps {
  course: Course;
  hasActiveSubscription: boolean;
}

export const RecentCoursesCard: React.FC<RecentCoursesCardProps> = ({ 
  course, 
  hasActiveSubscription 
}) => {
  const navigate = useNavigate();
  const isLocked = !course.is_free && !hasActiveSubscription;

  const handleViewCourse = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 relative overflow-hidden">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {course.image ? (
          <img 
            src={course.image} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-16 w-16 text-primary/30" />
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

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs bg-white/90 text-foreground">
            {course.category || 'General'}
          </Badge>
        </div>

        {/* Free/Premium badge */}
        <div className="absolute top-3 right-3">
          <Badge 
            variant={course.is_free ? "default" : "outline"} 
            className={`text-xs ${course.is_free 
              ? 'bg-green-500 text-white' 
              : 'bg-white/90 text-foreground border-white/50'
            }`}
          >
            {course.is_free ? 'Free' : 'Premium'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
        {course.description && (
          <CardDescription className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          onClick={handleViewCourse}
          variant={isLocked ? "outline" : "default"}
          className="w-full group/btn"
          disabled={isLocked}
        >
          <Play className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
          <span className="whitespace-nowrap">Continue Learning</span>
        </Button>
      </CardContent>
    </Card>
  );
};