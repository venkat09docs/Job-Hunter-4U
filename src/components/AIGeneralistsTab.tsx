import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, Users, Star, ArrowRight, Zap, TrendingUp, MessageSquare } from 'lucide-react';
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

  const sidebarAds = [
    {
      title: "Advanced AI Engineering",
      description: "Master advanced AI concepts and build production-ready systems",
      badge: "Coming Soon",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      icon: Zap
    },
    {
      title: "AI Leadership Program", 
      description: "Learn to lead AI teams and drive organizational transformation",
      badge: "Premium",
      color: "bg-gradient-to-r from-blue-500 to-indigo-500",
      icon: TrendingUp
    },
    {
      title: "Join AI Community",
      description: "Connect with fellow AI enthusiasts and industry experts",
      badge: "Free",
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      icon: MessageSquare
    }
  ];

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="flex-1">
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
        <div className="w-80">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Content - Courses Grid */}
      <div className="flex-1">
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No Courses Available
            </h3>
            <p className="text-muted-foreground">
              AI Generalist courses will be available soon. Stay tuned!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                AI Generalists Program
              </h2>
              <p className="text-muted-foreground">
                Master the foundations and advanced concepts of Artificial Intelligence
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="relative">
                    {/* Course Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                          AI Course
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
                            <span>{formatDuration(8)}</span> {/* Default duration */}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>124</span> {/* Placeholder enrolled count */}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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
          </>
        )}
      </div>

      {/* Sidebar - Advertisements */}
      <div className="w-80">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground mb-4">
            Explore More Programs
          </h3>
          
          {sidebarAds.map((ad, index) => (
            <Card key={index} className="group hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden">
              <div className={`h-2 ${ad.color}`} />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${ad.color.replace('bg-gradient-to-r', 'bg-gradient-to-br')} text-white`}>
                    <ad.icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm text-foreground line-clamp-1">
                        {ad.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className="text-xs ml-2 flex-shrink-0"
                      >
                        {ad.badge}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {ad.description}
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-3 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Learn More
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Community CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="bg-gradient-primary w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium text-foreground mb-2">
                Join Our Community
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Connect with 10,000+ AI professionals and enthusiasts
              </p>
              <Button size="sm" className="w-full">
                Join Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIGeneralistsTab;