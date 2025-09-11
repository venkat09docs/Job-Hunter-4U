import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Star, ArrowRight, MessageSquare, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { Course } from '@/types/clp';

const AIGeneralistsTab: React.FC = () => {
  const { getCourses, loading } = useCareerLevelProgram();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const coursesData = await getCourses();
    setCourses(coursesData);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return `${hours}${hours === 1 ? ' hour' : ' hours'}`;
  };


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
      {/* Header with Three Equal Height Boards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Generalists Program Board */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-r from-primary/10 via-purple/10 to-teal/10 rounded-2xl p-6 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple bg-clip-text text-transparent mb-3">
                AI Generalists Program
              </h2>
              <p className="text-muted-foreground text-lg">
                Master the foundations and advanced concepts of Artificial Intelligence through hands-on projects and expert guidance
              </p>
            </div>
          </div>
        </div>
        
        {/* Join Community Board */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-emerald/10 via-teal/10 to-cyan/10 border-emerald/20 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="bg-gradient-to-r from-emerald to-teal w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Join Our Community
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Connect with 10,000+ AI professionals and enthusiasts worldwide. Share knowledge, get help, and grow together.
                </p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-emerald to-teal hover:from-emerald-dark hover:to-teal-dark shadow-lg"
                onClick={() => {
                  console.log('Join Community clicked');
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Join Community
              </Button>
            </CardContent>
          </Card>
          
          {/* Advanced Programs Board */}
          <Card className="bg-gradient-to-br from-violet/10 via-purple/10 to-pink/10 border-violet/20 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="bg-gradient-to-r from-violet to-purple w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Advanced Programs
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Explore specialized AI tracks including Machine Learning Engineering, AI Leadership, and Deep Learning Mastery.
                </p>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-violet to-purple hover:from-violet-dark hover:to-purple-dark shadow-lg"
                onClick={() => {
                  console.log('Advanced Programs clicked');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-primary/10 to-purple/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            No Courses Available Yet
          </h3>
          <p className="text-muted-foreground text-lg">
            AI Generalist courses will be available soon. Stay tuned for exciting learning opportunities!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="relative">
                {/* Course Image */}
                <div className="h-48 bg-gradient-to-br from-primary via-purple to-teal relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                      {course.code || 'AI Course'}
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
                      {course.description || "Comprehensive AI course covering fundamental concepts and practical applications"}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(8)}</span>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default AIGeneralistsTab;