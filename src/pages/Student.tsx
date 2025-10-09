import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Brain, 
  User, 
  Target, 
  Code, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Users,
  TrendingUp,
  Zap,
  Award,
  Rocket,
  Globe,
  Mail,
  Phone,
  Sparkles,
  Trophy,
  Clock,
  Shield,
  X,
  AlertTriangle,
  DollarSign,
  Briefcase,
  ChevronDown,
   BookOpen,
   GraduationCap,
   Cpu,
   Building2,
   Check,
   Loader2,
   Crown,
   Cloud,
   Building,
   Calendar,
   Gift,
   FileText,
   Lightbulb,
   Server
} from "lucide-react";
import { Github, Instagram } from "lucide-react";
import { useCareerLevelProgram } from "@/hooks/useCareerLevelProgram";
import { useState, useEffect } from "react";
import type { Course } from "@/types/clp";
import Navigation from "@/components/Navigation";

// Import generated images
import heroImage from "@/assets/ai-career-hero.jpg";
import skillsImage from "@/assets/ai-skills-learning.jpg";
import portfolioImage from "@/assets/digital-portfolio.jpg";
import jobHuntingImage from "@/assets/smart-job-hunting.jpg";
import solopreneurImage from "@/assets/solopreneur-journey.jpg";
import devopsHeroImage from "@/assets/devops-aws-ai-hero.jpg";

export default function Student() {
  console.log("✅ Student page loading - Bot icons replaced with Cpu");
  const { getCourses, loading } = useCareerLevelProgram();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const coursesData = await getCourses();
    setCourses(coursesData);
  };

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Data structures from CareerLevelUp page
  const highlights = [
    {
      icon: GraduationCap,
      title: "Industry-focused Curriculum",
      description: "DevOps fundamentals | AWS Cloud | AI Integration | Capstone projects | Lab sessions"
    },
    {
      icon: Code,
      title: "Hands-on Learning", 
      description: "15+ tools | Group assignments | Real-world projects | Practical assessments"
    },
    {
      icon: Briefcase,
      title: "Dedicated Placement Support",
      description: "Industry mentors | Portfolio showcase | Mock interviews | Resume optimization"
    },
    {
      icon: Building,
      title: "Access to Premium DevOps Job Opportunities",
      description: "500+ Recruiters | Weekly drives* | Quarterly job fairs* | *T&C Apply"
    }
  ];

  const benefits = [
    {
      icon: Briefcase,
      title: "High-Paying AI Jobs",
      description: "Access to roles paying $80K-150K+ annually in the rapidly growing AI industry",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: TrendingUp,
      title: "Future-Proof Career",
      description: "Stay ahead of automation and remain relevant in the evolving job market",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: Rocket,
      title: "Entrepreneurial Opportunities",
      description: "Build and launch your own AI-powered SaaS products and services",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Trophy,
      title: "Industry Recognition",
      description: "Gain credible certifications and build a portfolio that stands out",
      color: "from-orange-500 to-red-600"
    }
  ];

  const problems = [
    {
      icon: AlertTriangle,
      title: "Job Displacement Risk",
      description: "Traditional roles are being automated - without AI skills, you're vulnerable to replacement",
      impact: "67% of jobs may be affected by AI automation"
    },
    {
      icon: DollarSign,
      title: "Salary Stagnation",
      description: "Non-AI professionals see slower salary growth compared to AI-skilled counterparts",
      impact: "AI professionals earn 40% more on average"
    },
    {
      icon: X,
      title: "Limited Career Growth",
      description: "Companies prioritize AI-capable employees for leadership and strategic roles",
      impact: "85% of executives prefer AI-literate candidates"
    },
    {
      icon: Target,
      title: "Missed Opportunities",
      description: "Unable to capitalize on the $15.7 trillion AI market opportunity",
      impact: "Missing out on the fastest-growing industry"
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "Skill Level Up with AI",
      description: "Master essential AI skills and become a generalist",
      benefits: ["Learn cutting-edge AI tools", "Hands-on projects", "Industry-relevant skills"],
      image: skillsImage,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: User,
      title: "Build a Digital Profile",
      description: "Showcase achievements and create professional presence",
      benefits: ["Professional portfolio", "Digital certifications", "Personal branding"],
      image: portfolioImage,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Job Hunting",
      description: "Smart strategies and tools to land your dream job",
      benefits: ["Resume optimization", "Interview preparation", "Job search automation"],
      image: jobHuntingImage,
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Briefcase,
      title: "Land Your Dream Job",
      description: "Master job search strategies and ace your interviews",
      benefits: ["Smart job search tactics", "Interview mastery", "Career positioning"],
      image: jobHuntingImage,
      gradient: "from-green-500 to-teal-500"
    }
  ];

  const steps = [
    { title: "Learn", description: "Master AI fundamentals and tools", icon: Brain, color: "bg-purple-500" },
    { title: "Build", description: "Create your digital portfolio", icon: Award, color: "bg-blue-500" },
    { title: "Apply", description: "Automate Job Hunting", icon: Target, color: "bg-orange-500" },
    { title: "Get Hired", description: "Land Your Dream Job", icon: Rocket, color: "bg-green-500" }
  ];

  const testimonials = [
    {
      name: "Aparna",
      role: "AI Engineer",
      quote: "This program transformed my career from a traditional role to an AI specialist in just 6 months!",
      rating: 5,
      avatar: "AP",
      color: "bg-gradient-to-br from-pink-500 to-purple-600"
    },
    {
      name: "Pruthvi Raju",
      role: "Freelance AI Consultant",
      quote: "The solopreneur track helped me build my own SaaS product. Now I'm running a profitable business.",
      rating: 5,
      avatar: "PR",
      color: "bg-gradient-to-br from-blue-500 to-cyan-600"
    },
    {
      name: "Venugopal",
      role: "Fresh Graduate",
      quote: "As a fresh graduate, this program gave me the competitive edge I needed to land my first AI job.",
      rating: 5,
      avatar: "VG",
      color: "bg-gradient-to-br from-green-500 to-teal-600"
    }
  ];

  const stats = [
    { icon: Users, value: "6,000+", label: "Students Enrolled", color: "text-blue-600" },
    { icon: Trophy, value: "95%", label: "Job Success Rate", color: "text-green-600" },
    { icon: Star, value: "4.8/5", label: "Average Rating", color: "text-yellow-600" },
    { icon: Clock, value: "3-4 Months", label: "Average Completion", color: "text-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative container mx-auto max-w-7xl px-4 py-12 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left side - Content */}
            <div className="text-center lg:text-left flex flex-col justify-center min-h-[500px] pt-8 lg:pt-0">
              <Badge variant="secondary" className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm animate-fade-in mx-auto lg:mx-0 w-fit">
                <Sparkles className="w-4 h-4 mr-2" />
                🚀 Transform Your Career Today
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight animate-fade-in">
                AI Enhanced –<br />
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
                  Career Level Up
                </span>
              </h1>
              
              {/* Updated Tagline */}
              <div className="relative mb-12 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-cyan-400/20 blur-xl rounded-full"></div>
                <p className="relative text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent border-2 border-white/30 rounded-2xl py-6 px-8 backdrop-blur-sm">
                  Transform Your Career Into An AI Generalist
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center animate-fade-in">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-10 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => scrollToSection('investment-plans')}
                >
                  Start Your AI Career Today
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/80 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg font-semibold shadow-lg"
                  onClick={() => scrollToSection('four-levels')}
                >
                  Explore Curriculum
                </Button>
              </div>
            </div>

            {/* Right side - Image and Stats */}
            <div className="flex flex-col justify-center">
              <div className="relative mb-8">
                <img 
                  src={devopsHeroImage} 
                  alt="AI DevOps AWS Career Transformation with AI Agents, Vibe Coding, GenAI, Cloud & DevOps" 
                  className="w-full h-auto rounded-2xl shadow-2xl border border-white/20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-2xl"></div>
              </div>
              
              {/* Stats Grid - Below Image */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                    <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                    <div className="text-lg font-bold text-white mb-1 text-center">{stat.value}</div>
                    <div className="text-xs text-white/90 text-center">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Stats Grid - Show on mobile */}
          <div className="lg:hidden grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <stat.icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-lg font-bold text-white mb-1 text-center">{stat.value}</div>
                <div className="text-xs text-white/90 text-center">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-white/70" />
          </div>
        </div>
      </section>

      {/* Problems Without AI Skills Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-red-500 to-orange-600 text-white border-0">
              Wake-Up Call
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Without AI Skills, You Risk...
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              The AI revolution is happening now. Don't get left behind.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <Card key={index} className="border-red-200 hover:border-red-300 transition-all duration-300 transform hover:scale-105 bg-white shadow-lg hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-lg flex-shrink-0">
                      <problem.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">{problem.title}</h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">{problem.description}</p>
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                        <p className="text-red-800 font-semibold text-sm">{problem.impact}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              Your Transformation
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Benefits of Joining Our Program
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Unlock unlimited opportunities in the AI-driven future
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-green-200 hover:border-green-300 transition-all duration-300 transform hover:scale-105 bg-white shadow-lg hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className={`bg-gradient-to-br ${benefit.color} p-3 rounded-lg flex-shrink-0`}>
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">{benefit.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About the Program */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
              About the Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Build Your Next Gen AI Career
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Our comprehensive program transforms you into a versatile AI professional through hands-on learning, 
              real-world projects, and industry mentorship. Join thousands of successful graduates who've 
              revolutionized their careers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((highlight, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 bg-white shadow-lg">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <highlight.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">{highlight.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Program Features Section */}
      <section id="four-levels" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              Complete Journey
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Four Levels of Mastery
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              A structured pathway to becoming an AI generalist
            </p>
          </div>
          
          <div className="space-y-20">
            {features.map((feature, index) => (
              <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <div className={`inline-block bg-gradient-to-r ${feature.gradient} text-white px-4 py-2 rounded-full text-sm font-semibold mb-6`}>
                    Level {index + 1}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 flex items-center gap-4">
                    <div className={`bg-gradient-to-br ${feature.gradient} p-3 rounded-lg`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    {feature.title}
                  </h3>
                  <p className="text-xl text-gray-700 mb-8 leading-relaxed">{feature.description}</p>
                  <div className="space-y-4">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <span className="text-lg text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-auto rounded-2xl shadow-2xl"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} opacity-10 rounded-2xl`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              How It Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Simple 4-step journey to Land Your Dream Job
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
                <CardContent className="p-0">
                  <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                  <div className="bg-gray-100 text-gray-600 text-sm font-semibold px-3 py-1 rounded-full mb-4 inline-block">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-700">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Available Courses Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
              Available Courses
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Choose Your Learning Path
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Structured courses designed to take you from beginner to expert
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Courses Coming Soon</h3>
              <p className="text-gray-700 max-w-md mx-auto">
                We're preparing amazing courses for you. Check back soon for updates!
              </p>
            </div>
          ) : (
            <Carousel className="w-full max-w-5xl mx-auto">
              <CarouselContent>
                {courses.map((course) => (
                  <CarouselItem key={course.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-bold mb-4 text-gray-900 flex-grow">
                          {course.title}
                        </h3>
                        
                        {course.description && (
                          <p className="text-gray-700 mb-6 leading-relaxed">
                            {course.description}
                          </p>
                        )}
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Category</span>
                            <span className="font-semibold text-gray-900">
                              {course.category}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status</span>
                            <Badge variant="outline" className="text-xs">
                              {course.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          Enroll Now
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>
      </section>

      {/* Level Up Activities Showcase */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-teal-600 text-white border-0">
              Level Up Activities
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Build Real Skills
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Hands-on activities that build your portfolio and expertise
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Profile Build</h3>
                <p className="text-gray-700 mb-6">Create a professional digital presence with portfolio, resume, and LinkedIn optimization</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Professional Portfolio</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">LinkedIn Optimization</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Resume Building</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">LinkedIn Network Growth</h3>
                <p className="text-gray-700 mb-6">Build a powerful professional network and establish thought leadership</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Strategic Networking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Content Strategy</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Engagement Tactics</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Code className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">GitHub Repository</h3>
                <p className="text-gray-700 mb-6">Showcase your coding skills with impressive projects and contributions</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Project Showcase</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Open Source Contributions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Code Quality</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Digital Portfolio</h3>
                <p className="text-gray-700 mb-6">Create a stunning online presence that showcases your skills and projects</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Personal Website</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Case Studies</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Achievement Gallery</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Can Join Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
              Who Can Join
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Perfect for Everyone
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Our program is designed for individuals at any career stage
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-blue-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Students & Fresh Graduates</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Get a competitive edge in the job market with AI skills that employers are actively seeking. 
                  Start your career with future-ready capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-purple-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Working Professionals</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Upskill to stay relevant in your current role or transition to high-paying AI positions. 
                  Future-proof your career with in-demand skills.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-green-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Career Changers</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Transition from any field into the lucrative AI industry with comprehensive training 
                  and hands-on experience. No prior tech background required.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Entrepreneurs</h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Learn to build AI-powered products and services. Master the skills needed to create 
                  innovative solutions and launch successful AI startups.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Level 3 Program - Job Hunter Level Up */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
              Level 3 Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Job Hunter Level Up
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Master the art of landing high-paying AI jobs with our comprehensive job hunting program. 
              From resume optimization to interview mastery, we'll guide you to your dream career.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg flex-shrink-0">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Strategic Job Search</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Learn advanced job search techniques, including hidden job market access, 
                      networking strategies, and leveraging AI tools for job discovery.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg flex-shrink-0">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Resume & Portfolio Optimization</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Create ATS-friendly resumes and compelling portfolios that stand out. 
                      Learn to showcase your AI skills effectively to hiring managers.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg flex-shrink-0">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Interview Mastery</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Master technical interviews, behavioral questions, and salary negotiations. 
                      Practice with mock interviews and real-world scenarios.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Salary Negotiation</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Learn proven strategies to negotiate competitive salaries and benefits. 
                      Understand market rates and how to position yourself for maximum compensation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={jobHuntingImage} 
                alt="Job Hunter Level Up Program"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent rounded-2xl"></div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <Trophy className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">95%</div>
                    <div className="text-sm text-gray-600">Job Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Level 4 Program - Vibe Coding Mastery */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              Level 4 Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Vibe Coding Mastery
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Transform into a solopreneur with our advanced coding and digital marketing program. 
              Build, launch, and scale your own AI-powered SaaS applications.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src={solopreneurImage} 
                alt="Vibe Coding Mastery Program"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent rounded-2xl"></div>
              
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <Rocket className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">50+</div>
                    <div className="text-sm text-gray-600">SaaS Projects Built</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg flex-shrink-0">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Full-Stack Development</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Master modern web technologies including React, Node.js, databases, and cloud deployment. 
                      Build production-ready applications from scratch.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg flex-shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">AI Integration</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Learn to integrate cutting-edge AI APIs and models into your applications. 
                      Build intelligent features that provide real user value.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg flex-shrink-0">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Digital Marketing</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Master digital marketing strategies including SEO, content marketing, 
                      social media, and paid advertising to grow your SaaS business.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-900">Monetization Strategies</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Learn proven business models, pricing strategies, and revenue optimization 
                      techniques to build profitable SaaS applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Success Stories */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Real Results from Real Students
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Join thousands of successful graduates who transformed their careers
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-xl`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{testimonial.name}</h3>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: testimonial.rating }, (_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-700 leading-relaxed italic">
                    "{testimonial.quote}"
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Plans */}
      <section id="investment-plans" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
              Investment Plans
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Choose Your Investment
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Flexible payment options to fit your budget and learning goals
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* 3 Month Plan */}
            <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 bg-white shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">3 Month Plan</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">₹15,000</div>
                  <div className="text-gray-600">One-time payment</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Complete Level 1 & 2 Programs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">AI Skills Development</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Digital Portfolio Creation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Weekly Mentorship</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Community Access</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg py-3">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* 6 Month Plan - Most Popular */}
            <Card className="border-2 border-purple-300 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 bg-white shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 px-4 py-2">
                  <Crown className="w-4 h-4 mr-2" />
                  Most Popular
                </Badge>
              </div>
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">6 Month Complete</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">₹25,000</div>
                  <div className="text-gray-600">Best value package</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">All 4 Level Programs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">AI Generalist Certification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Job Hunting Program</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Vibe Coding Mastery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">1-on-1 Mentorship</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Lifetime Community Access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Job Placement Support</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg py-3">
                  Start Complete Journey
                </Button>
              </CardContent>
            </Card>

            {/* 12 Month Plan */}
            <Card className="border-2 border-gray-200 hover:border-green-300 transition-all duration-300 transform hover:scale-105 bg-white shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">12 Month Enterprise</h3>
                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">₹40,000</div>
                  <div className="text-gray-600">Premium experience</div>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Everything in 6 Month Plan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Advanced AI Specializations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Industry Capstone Project</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Executive Mentorship</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">Premium Job Network</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-lg py-3">
                  Go Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            Don't Wait for the Future –<br />
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Create It Today
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Join 6,000+ students who've already transformed their careers with AI. 
            The future belongs to those who act today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-12 py-6 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
              onClick={() => scrollToSection('investment-plans')}
            >
              <Gift className="mr-3 h-6 w-6" />
              Start Your AI Journey Now
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">Special Launch Price</div>
              <div className="text-white/80">Save 50% - Limited Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 mb-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Career Level Up
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Transform your career with comprehensive AI education and hands-on experience. 
                Join the AI revolution today.
              </p>
              <div className="flex gap-4">
                <div className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <Github className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Programs</h4>
              <div className="space-y-3">
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">AI Skills Development</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Digital Portfolio</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Job Hunting</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Vibe Coding</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Resources</h4>
              <div className="space-y-3">
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Course Catalog</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Success Stories</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Community</div>
                <div className="text-gray-400 hover:text-white cursor-pointer transition-colors">Blog</div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-400">support@aicareer.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-400">www.aicareer.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 AI Career Level Up. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}