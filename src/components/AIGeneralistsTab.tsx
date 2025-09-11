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
    <div className="flex gap-4">
      {/* Main Content - Courses Grid */}
      <div className="flex-1 max-w-none">
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
          <>
            <div className="mb-8">
              <div className="bg-gradient-to-r from-primary/10 via-purple/10 to-teal/10 rounded-2xl p-6 mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple bg-clip-text text-transparent mb-3">
                  AI Generalists Program
                </h2>
                <p className="text-muted-foreground text-lg">
                  Master the foundations and advanced concepts of Artificial Intelligence through hands-on projects and expert guidance
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Card key={course.id} className="group hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                  <div className="relative">
                    {/* Course Image with dynamic gradient */}
                    <div className="h-52 bg-gradient-to-br from-primary via-purple to-teal relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 backdrop-blur-sm text-primary border-0 font-medium">
                          AI Course
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white/20 backdrop-blur-md rounded-full p-3 group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      {/* Floating elements for visual appeal */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
                        <div className="w-32 h-32 rounded-full bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h3 className="font-bold text-xl text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {course.description || "Comprehensive AI course covering fundamental concepts, practical applications, and real-world projects to accelerate your career in artificial intelligence"}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="bg-info/10 p-1.5 rounded-full">
                            <Clock className="h-3.5 w-3.5 text-info" />
                          </div>
                          <span className="font-medium">{formatDuration(8)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald/10 p-1.5 rounded-full">
                            <Users className="h-3.5 w-3.5 text-emerald" />
                          </div>
                          <span className="font-medium">124</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber/10 px-2 py-1 rounded-full">
                        <Star className="h-4 w-4 fill-amber text-amber" />
                        <span className="text-sm font-bold text-amber">4.8</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          Beginner
                        </Badge>
                        <Badge variant="outline" className="text-xs border-emerald/30 text-emerald hover:bg-emerald/10">
                          Certificate
                        </Badge>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="group/btn bg-gradient-to-r from-primary to-purple hover:from-primary-dark hover:to-purple shadow-lg hover:shadow-glow"
                        onClick={() => {
                          // TODO: Navigate to course detail or enrollment
                          console.log('Enroll in course:', course.id);
                        }}
                      >
                        <span className="font-medium">Enroll Now</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sidebar - Advertisements */}
      <div className="w-64 flex-shrink-0">
        <div className="space-y-4">
          <h3 className="font-bold text-foreground mb-4 text-lg">
            Explore More
          </h3>
          
          {sidebarAds.map((ad, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-card to-card/60 backdrop-blur-sm">
              <div className={`h-1 ${ad.color}`} />
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${ad.color.replace('bg-gradient-to-r', 'bg-gradient-to-br')} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <ad.icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">
                        {ad.title}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className="text-xs ml-2 flex-shrink-0 bg-primary/10 text-primary"
                      >
                        {ad.badge}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                      {ad.description}
                    </p>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-3 text-xs w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    >
                      <span>Learn More</span>
                      <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Community CTA */}
          <Card className="bg-gradient-to-br from-primary/10 via-purple/10 to-teal/10 border-primary/20 overflow-hidden">
            <CardContent className="p-4 text-center">
              <div className="bg-gradient-to-r from-primary to-purple w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-bold text-foreground mb-2">
                Join Our Community
              </h4>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Connect with 10,000+ AI professionals and enthusiasts worldwide
              </p>
              <Button size="sm" className="w-full bg-gradient-to-r from-primary to-purple hover:from-primary-dark hover:to-purple shadow-lg">
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