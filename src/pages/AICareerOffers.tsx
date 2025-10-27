import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle, ArrowRight, X, Sparkles, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCareerLevelProgram } from "@/hooks/useCareerLevelProgram";
import { useCourseContent } from "@/hooks/useCourseContent";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useInternalJobs } from "@/hooks/useInternalJobs";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/clp";
import type { InternalJob } from "@/hooks/useInternalJobs";
import { useNavigate } from "react-router-dom";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const AICareerOffers = () => {
  const { getCourses, loading } = useCareerLevelProgram();
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const { plansWithPrices, loading: plansLoading } = useSubscriptionPlans();
  const { jobs, loading: jobsLoading } = useInternalJobs();
  const { hasActiveSubscription } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Filter to show only AI Career Offers specific plans
  const aiCareerPlans = plansWithPrices.filter(plan => 
    plan.name === 'Quick 10 Days Access' || 
    plan.name === 'One Year Plan without Digital Profile' || 
    plan.name === 'One Year Plan with Digital Profile'
  );
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedJob, setSelectedJob] = useState<InternalJob | null>(null);
  const [itemType, setItemType] = useState<'course' | 'job'>('course');
  const [courseContent, setCourseContent] = useState<any[]>([]);
  const [showSplitView, setShowSplitView] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const coursesData = await getCourses();
    setCourses(coursesData);

    // Fetch sections for each course
    const sectionsMap: Record<string, any[]> = {};
    for (const course of coursesData) {
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

  const loadCourseContent = async (courseId: string) => {
    setContentLoading(true);
    try {
      const sections = await getSectionsByCourse(courseId);
      const sectionsWithChapters = await Promise.all(
        sections.map(async (section) => {
          const chapters = await getChaptersBySection(section.id);
          return { ...section, chapters };
        })
      );
      setCourseContent(sectionsWithChapters);
    } catch (error) {
      console.error('Error loading course content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleCourseClick = async (course: Course) => {
    setItemType('course');
    setSelectedCourse(course);
    setSelectedJob(null);
    await loadCourseContent(course.id);
    setShowSplitView(true);
  };

  const handleJobClick = (job: InternalJob) => {
    setItemType('job');
    setSelectedJob(job);
    setSelectedCourse(null);
    setShowSplitView(true);
  };

  const handlePlanSelect = (plan: any) => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan",
        variant: "default"
      });
      // Redirect to auth page with return URL
      navigate('/auth', { state: { returnTo: '/ai-career-offers' } });
      return;
    }

    // Convert subscription plan to payment plan format
    const paymentPlan = {
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice || plan.price,
      duration: plan.duration,
      description: plan.description || '',
      features: plan.features || [],
      bonuses: [],
      popular: plan.is_popular || false,
      variant: 'default' as const,
      icon: Trophy
    };
    setSelectedPlan(paymentPlan);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedPlan(null);
  };

  // Group courses by category
  const coursesByCategory = courses.reduce((acc, course) => {
    const category = course.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

  // Get all categories
  const categories = ['all', ...Object.keys(coursesByCategory)];

  // Filter courses based on selected category
  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : coursesByCategory[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5">
      {/* Hero Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in">
            <Badge className="mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white border-0 font-bold text-xs sm:text-sm px-3 py-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Limited Time Offers
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent px-2">
              AI Career Level Up Courses
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Transform your career with our comprehensive courses. Get lifetime access with our special pricing offers!
            </p>
            <div className="mt-4 sm:mt-6 flex justify-center gap-3">
              <Button onClick={() => navigate('/')} variant="outline" size="default" className="text-sm sm:text-base">
                Back to Home
              </Button>
            </div>
          </div>

          {/* Tabs for Courses and Jobs */}
          <Tabs defaultValue="courses" className="w-full px-2 sm:px-0">
            <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-2 mb-6 sm:mb-8">
              <TabsTrigger value="courses" className="text-xs sm:text-sm">Courses</TabsTrigger>
              <TabsTrigger value="jobs" className="text-xs sm:text-sm">Internal Jobs</TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <div className="mb-4 sm:mb-6 flex justify-center px-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-64 max-w-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-full animate-pulse">
                      <CardContent className="p-0">
                        <div className="h-40 sm:h-48 bg-muted"></div>
                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                          <div className="h-5 sm:h-6 bg-muted rounded"></div>
                          <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-8 sm:h-10 bg-muted rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Carousel className="w-full px-4 sm:px-0" opts={{ align: "start", loop: true }}>
                  <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4">
                    {filteredCourses.map((course) => (
                      <CarouselItem key={course.id} className="pl-2 sm:pl-3 md:pl-4 basis-full sm:basis-[85%] md:basis-1/2 lg:basis-1/3">
                        <Card 
                          className="h-full transition-all duration-300 border-0 shadow-xl sm:shadow-2xl cursor-pointer rounded-2xl sm:rounded-3xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] overflow-hidden bg-gradient-to-br from-card via-card to-primary/5"
                          onClick={() => handleCourseClick(course)}
                        >
                          <CardContent className="p-0 flex flex-col h-full">
                            {course.image && (
                              <div className="w-full h-40 sm:h-48 md:h-56 bg-white/10 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={course.image} 
                                  alt={course.title}
                                  className="w-full h-full object-cover rounded-t-2xl sm:rounded-t-3xl"
                                />
                              </div>
                            )}
                            
                            <div className={`p-4 sm:p-5 md:p-6 flex flex-col flex-1 ${!course.image ? 'pt-8 sm:pt-12' : ''}`}>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
                                {course.title}
                              </h3>

                              <p className="text-muted-foreground mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm line-clamp-2">
                                {course.description || "Comprehensive course covering fundamental concepts and practical applications"}
                              </p>

                              <h4 className="text-foreground font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                                Key Course Sections
                              </h4>

                              <div className="space-y-1.5 sm:space-y-2 flex-1 mb-3 sm:mb-4">
                                {courseSections[course.id] && courseSections[course.id].length > 0 ? (
                                  courseSections[course.id].slice(0, 3).map((section, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-1">{section.title}</span>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-xs sm:text-sm">Interactive Learning Content</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-xs sm:text-sm">Practical Projects</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <Button 
                                className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg rounded-xl h-10 sm:h-12 text-xs sm:text-sm transform hover:scale-[1.02] transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCourseClick(course);
                                }}
                              >
                                View Course & Pricing
                                <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex -left-8 lg:-left-12 h-10 w-10 sm:h-12 sm:w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                  <CarouselNext className="hidden md:flex -right-8 lg:-right-12 h-10 w-10 sm:h-12 sm:w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                </Carousel>
              )}
            </TabsContent>

            {/* Internal Jobs Tab */}
            <TabsContent value="jobs">
              {jobsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-full animate-pulse">
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className="h-5 sm:h-6 bg-muted rounded"></div>
                        <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 sm:h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-8 sm:h-10 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobs.length > 0 ? (
                <Carousel className="w-full px-4 sm:px-0" opts={{ align: "start", loop: true }}>
                  <CarouselContent className="-ml-2 sm:-ml-3 md:-ml-4">
                    {jobs.map((job) => (
                      <CarouselItem key={job.id} className="pl-2 sm:pl-3 md:pl-4 basis-full sm:basis-[85%] md:basis-1/2 lg:basis-1/3">
                        <Card 
                          className="h-full transition-all duration-300 border-0 shadow-xl sm:shadow-2xl cursor-pointer rounded-2xl sm:rounded-3xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] overflow-hidden bg-gradient-to-br from-card via-card to-primary/5"
                          onClick={() => handleJobClick(job)}
                        >
                          <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1.5 sm:mb-2 leading-tight">
                                  {job.title}
                                </h3>
                                <p className="text-sm sm:text-base md:text-lg text-primary font-semibold truncate">
                                  {job.company}
                                </p>
                              </div>
                              <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0 ml-2" />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 flex-1">
                              {job.location && (
                                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                              )}
                              {job.job_type && (
                                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">{job.job_type}</span>
                                </div>
                              )}
                              {(job.salary_min || job.salary_max) && (
                                <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {job.salary_min && job.salary_max 
                                      ? `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`
                                      : job.salary_min 
                                      ? `₹${job.salary_min.toLocaleString()}+`
                                      : `Up to ₹${job.salary_max?.toLocaleString()}`
                                    }
                                  </span>
                                </div>
                              )}
                              {job.experience_level && (
                                <Badge variant="secondary" className="mt-1 sm:mt-2 text-xs">
                                  {job.experience_level}
                                </Badge>
                              )}
                            </div>

                            <Button 
                              className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg rounded-xl h-10 sm:h-12 text-xs sm:text-sm transform hover:scale-[1.02] transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJobClick(job);
                              }}
                            >
                              View Details & Apply
                              <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex -left-8 lg:-left-12 h-10 w-10 sm:h-12 sm:w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                  <CarouselNext className="hidden md:flex -right-8 lg:-right-12 h-10 w-10 sm:h-12 sm:w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                </Carousel>
              ) : (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg text-muted-foreground">No internal jobs available at the moment</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Split View Dialog - Course/Job Content + Pricing */}
      <Dialog open={showSplitView} onOpenChange={setShowSplitView}>
        <DialogContent className="max-w-7xl w-[95vw] sm:w-full h-[90vh] sm:h-[85vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
          <DialogTitle className="sr-only">{itemType === 'course' ? 'Course' : 'Job'} Details and Pricing</DialogTitle>
          <style>{`
            .dialog-scroll::-webkit-scrollbar {
              width: 14px;
              background: transparent;
            }
            .dialog-scroll::-webkit-scrollbar-track {
              background: hsl(var(--muted) / 0.2);
              border-radius: 8px;
              margin: 8px 0;
            }
            .dialog-scroll::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.7));
              border-radius: 8px;
              border: 3px solid hsl(var(--muted) / 0.2);
              box-shadow: 0 0 10px rgba(0,0,0,0.3);
            }
            .dialog-scroll::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, hsl(var(--primary)), hsl(var(--primary) / 0.9));
              box-shadow: 0 0 15px rgba(0,0,0,0.4);
            }
            .dialog-scroll::-webkit-scrollbar-thumb:active {
              background: hsl(var(--primary));
            }
            .dialog-scroll {
              scrollbar-width: thin;
              scrollbar-color: hsl(var(--primary) / 0.8) hsl(var(--muted) / 0.2);
            }
          `}</style>
          <div className="flex flex-col sm:flex-row h-full w-full">
            {/* Left Side - Course/Job Content */}
            <div className="flex-1 sm:border-r-2 border-primary/10 flex flex-col bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="p-3 sm:p-4 md:p-6 border-b-2 border-primary/10 flex items-center justify-between bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 flex-shrink-0 backdrop-blur-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                    {itemType === 'course' ? selectedCourse?.title : selectedJob?.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5 sm:gap-2">
                    {itemType === 'course' ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Course Content Preview</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">Job Details</span>
                      </>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSplitView(false)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-scroll dialog-scroll min-h-0" style={{ maxHeight: 'calc(50vh - 60px)' }}>
                <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 pb-8 sm:pb-12 pr-3 sm:pr-4 md:pr-6">
                  {itemType === 'course' ? (
                    // Course Content
                    contentLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-6 bg-muted rounded mb-2"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : courseContent.length > 0 ? (
                      courseContent.map((section, sectionIdx) => (
                        <Card key={section.id} className="overflow-hidden border-2">
                          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-4 border-b">
                            <h3 className="text-lg font-bold text-foreground">
                              Section {sectionIdx + 1}: {section.title}
                            </h3>
                            {section.description && (
                              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                            )}
                          </div>
                          <CardContent className="p-4">
                            {section.chapters && section.chapters.length > 0 ? (
                              <div className="space-y-3">
                                {section.chapters.map((chapter: any, chapterIdx: number) => (
                                  <div key={chapter.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                      {chapterIdx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-foreground">{chapter.title}</h4>
                                      {chapter.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No chapters available</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No content available for this course yet.</p>
                      </div>
                    )
                  ) : selectedJob ? (
                    // Job Details
                    <>
                      <Card className="border-2">
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Company</h3>
                            <p className="text-xl text-primary font-semibold">{selectedJob.company}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {selectedJob.location && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Location</h4>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>{selectedJob.location}</span>
                                </div>
                              </div>
                            )}
                            {selectedJob.job_type && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Job Type</h4>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{selectedJob.job_type}</span>
                                </div>
                              </div>
                            )}
                            {selectedJob.experience_level && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Experience Level</h4>
                                <Badge variant="secondary">{selectedJob.experience_level}</Badge>
                              </div>
                            )}
                            {(selectedJob.salary_min || selectedJob.salary_max) && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Salary Range</h4>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="h-4 w-4" />
                                  <span>
                                    {selectedJob.salary_min && selectedJob.salary_max 
                                      ? `₹${selectedJob.salary_min.toLocaleString()} - ₹${selectedJob.salary_max.toLocaleString()}`
                                      : selectedJob.salary_min 
                                      ? `₹${selectedJob.salary_min.toLocaleString()}+`
                                      : `Up to ₹${selectedJob.salary_max?.toLocaleString()}`
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-bold text-foreground mb-3">Job Description</h3>
                          <div className="prose prose-sm max-w-none text-muted-foreground">
                            <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-bold text-foreground mb-3">Requirements</h3>
                          <div className="prose prose-sm max-w-none text-muted-foreground">
                            <p className="whitespace-pre-wrap">{selectedJob.requirements}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {selectedJob.benefits && (
                        <Card className="border-2">
                          <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-foreground mb-3">Benefits</h3>
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                              <p className="whitespace-pre-wrap">{selectedJob.benefits}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {selectedJob.job_url && (
                        user && hasActiveSubscription() ? (
                          <Button 
                            onClick={() => window.open(selectedJob.job_url, '_blank')}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                            size="lg"
                          >
                            Visit Job Page
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Button 
                              disabled
                              className="w-full"
                              size="lg"
                              variant="outline"
                            >
                              Visit Job Page {!user ? "(Login Required)" : "(Requires Subscription)"}
                            </Button>
                            <p className="text-sm text-center text-muted-foreground">
                              {!user 
                                ? "Please sign in to access job application links"
                                : "Upgrade to a premium plan to access job application links"
                              }
                            </p>
                          </div>
                        )
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right Side - Pricing Plans */}
            <div className="w-full sm:w-80 md:w-96 lg:w-[420px] bg-gradient-to-b from-yellow-500/5 via-orange-500/5 to-pink-500/5 flex flex-col flex-shrink-0 backdrop-blur-sm overflow-hidden border-t-2 sm:border-t-0 sm:border-l-2 border-primary/10">
              <div className="p-3 sm:p-4 md:p-6 border-b-2 border-primary/10 flex-shrink-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10 backdrop-blur-sm">
                <Badge className="mb-2 sm:mb-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white border-0 font-bold shadow-lg animate-pulse text-xs">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  Limited Time Offer
                </Badge>
                <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  Upgrade Your Access
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Get lifetime access to all courses and premium features</p>
              </div>

              <div className="flex-1 overflow-y-scroll dialog-scroll min-h-0" style={{ maxHeight: 'calc(40vh - 80px)' }}>
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-8 sm:pb-12 pr-3 sm:pr-4 md:pr-6">
                  {plansLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="h-6 bg-muted rounded mb-2"></div>
                            <div className="h-8 bg-muted rounded mb-2"></div>
                            <div className="h-4 bg-muted rounded"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : aiCareerPlans.length > 0 ? (
                    aiCareerPlans.map((plan) => (
                      <Card 
                        key={plan.id} 
                        className={`overflow-hidden border-2 transition-all hover:shadow-lg cursor-pointer ${
                          plan.is_popular ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-foreground">{plan.name}</h4>
                              {plan.is_popular && (
                                <Badge className="mt-1 bg-primary text-primary-foreground text-xs">Most Popular</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                              {plan.originalPrice > plan.price && (
                                <span className="text-sm text-muted-foreground line-through">₹{plan.originalPrice}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{plan.duration}</p>
                          </div>

                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                          )}

                          <Button 
                            onClick={() => handlePlanSelect(plan)}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white font-semibold"
                            size="sm"
                          >
                            Select Plan
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No pricing plans available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {selectedPlan && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <PaymentGatewaySelector
              plan={selectedPlan}
              onSuccess={handlePaymentSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AICareerOffers;
