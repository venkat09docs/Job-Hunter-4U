import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, User, Users, Globe, CheckCircle, ArrowRight } from "lucide-react";
import { Github } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCareerLevelProgram } from "@/hooks/useCareerLevelProgram";
import { useCourseContent } from "@/hooks/useCourseContent";
import { CourseContentViewer } from "@/components/CourseContentViewer";
import type { Course } from "@/types/clp";

const MasterKeyActivities = () => {
  const { getCourses, loading } = useCareerLevelProgram();
  const { getSectionsByCourse } = useCourseContent();
  const [buildProfileCourses, setBuildProfileCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseContent, setShowCourseContent] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const coursesData = await getCourses();
    
    // Filter courses for "Build Profile" category
    const buildProfileCoursesData = coursesData.filter(
      course => course.category === 'Build Profile'
    );
    setBuildProfileCourses(buildProfileCoursesData);

    // Fetch sections for each Build Profile course
    const sectionsMap: Record<string, any[]> = {};
    for (const course of buildProfileCoursesData) {
      try {
        const sections = await getSectionsByCourse(course.id);
        sectionsMap[course.id] = sections;
      } catch (error) {
        console.error(`Error fetching sections for course ${course.id}:`, error);
        sectionsMap[course.id] = [];
      }
    }
    setCourseSections(sectionsMap);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseContent(true);
  };

  return (
    <>
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-white dark:bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
            <Badge className="mb-4 sm:mb-5 md:mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 font-bold text-xs sm:text-sm">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Level 2 Program
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 text-gray-900 dark:text-foreground px-2">
              Master These Key Activities
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-muted-foreground max-w-3xl mx-auto px-2">
              Build your professional foundation with our three core level-up activities
            </p>
          </div>

          <div className="relative">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-full animate-pulse">
                    <CardContent className="p-0">
                      <div className="h-48 bg-muted"></div>
                      <div className="p-6 space-y-4">
                        <div className="h-6 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : buildProfileCourses.length > 0 ? (
              <div className="relative">
                <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {buildProfileCourses.map((course, index) => (
                      <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-[90%] sm:basis-[85%] md:basis-1/2 lg:basis-1/3">
                        <Card 
                          className="h-full transition-all duration-300 border-0 shadow-2xl cursor-pointer rounded-3xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] overflow-hidden"
                          onClick={() => handleCourseClick(course)}
                        >
                          <CardContent className="p-0 flex flex-col h-full">
                            {/* Course Image Header - Only if image exists */}
                            {course.image && (
                              <div className="w-full h-56 bg-white/10 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={course.image} 
                                  alt={course.title}
                                  className="w-full h-full object-cover rounded-t-3xl"
                                />
                              </div>
                            )}
                            
                            {/* Content Section */}
                            <div className={`p-6 flex flex-col flex-1 bg-white dark:bg-card ${!course.image ? 'pt-12' : ''}`}>
                              {/* Title */}
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4 leading-tight">
                                {course.title}
                              </h3>

                              {/* Description */}
                              <p className="text-gray-700 dark:text-muted-foreground mb-4 leading-relaxed text-sm">
                                {course.description || "Comprehensive course covering fundamental concepts and practical applications"}
                              </p>

                              {/* Important Course Sections Heading */}
                              <h4 className="text-gray-900 dark:text-foreground font-semibold text-base mb-3">
                                Important Course Sections
                              </h4>

                              {/* Course Sections as Bullet Points */}
                              <div className="space-y-2 flex-1 mb-4">
                                {courseSections[course.id] && courseSections[course.id].length > 0 ? (
                                  courseSections[course.id].slice(0, 4).map((section, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700 dark:text-muted-foreground text-sm leading-relaxed">{section.title}</span>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700 dark:text-muted-foreground text-sm">Interactive Learning Content</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-gray-700 dark:text-muted-foreground text-sm">Practical Projects</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Action Button */}
                              <Button 
                                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg rounded-xl h-12 text-sm transform hover:scale-[1.02] transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCourseClick(course);
                                }}
                              >
                                View Course Content
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden lg:flex -left-12 h-12 w-12 bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card border-0 shadow-xl" />
                  <CarouselNext className="hidden lg:flex -right-12 h-12 w-12 bg-white/90 dark:bg-card/90 hover:bg-white dark:hover:bg-card border-0 shadow-xl" />
                </Carousel>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No courses available in Build Profile category yet.</p>
              </div>
            )}

            {/* Level Up Stats - Core Activities Boards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mt-8 sm:mt-12 md:mt-16">
              <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <User className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground mb-1 sm:mb-2">Profile</h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-muted-foreground">Professional Foundation</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground mb-1 sm:mb-2">Network</h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-muted-foreground">Professional Connections</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                  <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Github className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground mb-1 sm:mb-2">Code</h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-muted-foreground">Technical Showcase</p>
                </CardContent>
              </Card>

              <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6 text-center">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Globe className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-foreground mb-1 sm:mb-2">Portfolio</h3>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-muted-foreground">Digital Showcase</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content Viewer Dialog */}
      {selectedCourse && (
        <CourseContentViewer
          open={showCourseContent}
          onOpenChange={setShowCourseContent}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
        />
      )}
    </>
  );
};

export default MasterKeyActivities;
