import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, CheckCircle, ArrowRight, X, Sparkles } from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useCareerLevelProgram } from "@/hooks/useCareerLevelProgram";
import { useCourseContent } from "@/hooks/useCourseContent";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course } from "@/types/clp";
import { useNavigate } from "react-router-dom";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";

const AICareerOffers = () => {
  const { getCourses, loading } = useCareerLevelProgram();
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const { plansWithPrices, loading: plansLoading } = useSubscriptionPlans();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseContent, setCourseContent] = useState<any[]>([]);
  const [showSplitView, setShowSplitView] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

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
    setSelectedCourse(course);
    await loadCourseContent(course.id);
    setShowSplitView(true);
  };

  const handlePlanSelect = (plan: any) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-primary/5">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
            <Badge className="mb-4 sm:mb-5 md:mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white border-0 font-bold text-xs sm:text-sm">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Limited Time Offers
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 md:mb-6 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI Career Level Up Courses
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
              Transform your career with our comprehensive courses. Get lifetime access with our special pricing offers!
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                Back to Home
              </Button>
            </div>
          </div>

          {/* Courses by Category */}
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
          ) : (
            Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
              <div key={category} className="mb-16">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
                    {category}
                  </h2>
                  <div className="h-1 w-24 bg-gradient-to-r from-primary to-purple-600 rounded-full"></div>
                </div>

                <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {categoryCourses.map((course) => (
                      <CarouselItem key={course.id} className="pl-2 md:pl-4 basis-[90%] sm:basis-[85%] md:basis-1/2 lg:basis-1/3">
                        <Card 
                          className="h-full transition-all duration-300 border-0 shadow-2xl cursor-pointer rounded-3xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] overflow-hidden bg-gradient-to-br from-card via-card to-primary/5"
                          onClick={() => handleCourseClick(course)}
                        >
                          <CardContent className="p-0 flex flex-col h-full">
                            {course.image && (
                              <div className="w-full h-56 bg-white/10 flex-shrink-0 overflow-hidden">
                                <img 
                                  src={course.image} 
                                  alt={course.title}
                                  className="w-full h-full object-cover rounded-t-3xl"
                                />
                              </div>
                            )}
                            
                            <div className={`p-6 flex flex-col flex-1 ${!course.image ? 'pt-12' : ''}`}>
                              <h3 className="text-2xl font-bold text-foreground mb-4 leading-tight">
                                {course.title}
                              </h3>

                              <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                                {course.description || "Comprehensive course covering fundamental concepts and practical applications"}
                              </p>

                              <h4 className="text-foreground font-semibold text-base mb-3">
                                Key Course Sections
                              </h4>

                              <div className="space-y-2 flex-1 mb-4">
                                {courseSections[course.id] && courseSections[course.id].length > 0 ? (
                                  courseSections[course.id].slice(0, 4).map((section, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-sm leading-relaxed">{section.title}</span>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-sm">Interactive Learning Content</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground text-sm">Practical Projects</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <Button 
                                className="w-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg rounded-xl h-12 text-sm transform hover:scale-[1.02] transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCourseClick(course);
                                }}
                              >
                                View Course & Pricing
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden lg:flex -left-12 h-12 w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                  <CarouselNext className="hidden lg:flex -right-12 h-12 w-12 bg-card/90 hover:bg-card border-0 shadow-xl" />
                </Carousel>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Split View Dialog - Course Content + Pricing */}
      <Dialog open={showSplitView} onOpenChange={setShowSplitView}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden">
          <div className="flex h-full w-full">
            {/* Left Side - Course Content (Read-only) */}
            <div className="flex-1 border-r border-border flex flex-col min-w-0">
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/50 flex-shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {selectedCourse?.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Course Content Preview</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSplitView(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                  <div className="p-4 sm:p-6 space-y-6 pb-12 pr-6">
                  {contentLoading ? (
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
                  )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Right Side - Pricing Plans */}
            <div className="w-[400px] bg-gradient-to-b from-primary/5 to-purple-600/5 flex flex-col flex-shrink-0">
              <div className="p-4 sm:p-6 border-b border-border flex-shrink-0">
                <Badge className="mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 font-bold">
                  <Trophy className="w-3 h-3 mr-1" />
                  Special Offer
                </Badge>
                <h3 className="text-xl font-bold text-foreground mb-1">Upgrade Your Access</h3>
                <p className="text-sm text-muted-foreground">Get full access to all courses and features</p>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                  <div className="p-4 space-y-4 pb-12 pr-6">
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
                  ) : plansWithPrices.length > 0 ? (
                    plansWithPrices.map((plan) => (
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
                </ScrollArea>
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
