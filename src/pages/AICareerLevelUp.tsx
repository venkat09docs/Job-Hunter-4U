import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import type { Course } from "@/types/clp";
import Navigation from "@/components/Navigation";

// Import generated images
import heroImage from "@/assets/ai-career-hero.jpg";
import skillsImage from "@/assets/ai-skills-learning.jpg";
import portfolioImage from "@/assets/digital-portfolio.jpg";
import jobHuntingImage from "@/assets/smart-job-hunting.jpg";
import solopreneurImage from "@/assets/solopreneur-journey.jpg";
import devopsHeroImage from "@/assets/devops-aws-ai-hero.jpg";
import careerSuccessSteps from "@/assets/career-success-steps.jpg";

export default function AICareerLevelUp() {
  console.log("✅ AICareerLevelUp component starting");
  const { getCourses, loading } = useCareerLevelProgram();
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  console.log("✅ About to define handleEnrollClick");
  const handleEnrollClick = () => {
    console.log("✅ handleEnrollClick called");
    sessionStorage.setItem('enrollmentIntent', 'true');
    navigate('/auth');
  };

  console.log("✅ About to define handlePricingClick");
  const handlePricingClick = () => {
    console.log("✅ handlePricingClick called");
    sessionStorage.setItem('selectedPlan', 'true');
    navigate('/auth');
  };
  
  console.log("✅ Functions defined successfully");

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
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
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
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-fade-in">
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
                  Your Complete Career Success Platform
                </span>
              </h1>
              
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <span className="text-white/90">Create </span>
                <span className="text-yellow-300 font-bold">stunning portfolios</span>
                <span className="text-white/90">, track job applications with </span>
                <span className="text-pink-300 font-bold">smart Kanban boards</span>
                <span className="text-white/90">, and get </span>
                <span className="text-cyan-300 font-bold">AI-powered career insights</span>
                <span className="text-white/90"> - all in one powerful platform.</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center animate-fade-in">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-10 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => scrollToSection('pricing')}
                >
                  Start Your AI Career Today
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/80 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg font-semibold shadow-lg"
                  onClick={() => scrollToSection('features')}
                >
                  Explore Curriculum
                </Button>
              </div>
            </div>

            {/* Right side - Career Level Up with Labels and Image */}
            <div className="flex flex-col justify-center">
              <div className="relative bg-gradient-to-br from-purple-600/60 via-pink-600/50 to-indigo-600/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border-2 border-white/40 shadow-2xl overflow-hidden">
                {/* Strong Animated Background Pattern */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/40 via-pink-500/30 to-transparent"></div>
                  <div className="absolute top-1/4 right-0 w-96 h-96 bg-pink-500/50 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-cyan-500/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                
                {/* Career Success Steps Image */}
                <div className="relative z-10 mb-8 rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={careerSuccessSteps} 
                    alt="Career success journey - climbing steps to reach goals" 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Main Text */}
                <div className="text-center mb-6 relative z-10">
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl" style={{
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 105, 180, 0.3)'
                  }}>
                    Career Level Up
                  </h3>
                </div>
                
                {/* Labels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 relative z-10">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-3 md:p-4 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      <span className="text-white font-bold text-xs md:text-base drop-shadow-lg">ATS Resume</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-3 md:p-4 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-2">
                      <Brain className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      <span className="text-white font-bold text-xs md:text-base drop-shadow-lg">AI Generalist</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 md:p-4 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-2">
                      <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      <span className="text-white font-bold text-xs md:text-base drop-shadow-lg">Job Hunting</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-3 md:p-4 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      <span className="text-white font-bold text-xs md:text-base drop-shadow-lg">LinkedIn Optimization</span>
                    </div>
                  </div>
                </div>
                
                {/* Stronger Decorative Elements */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-yellow-400/60 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-pink-400/60 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 right-0 w-32 h-32 bg-cyan-400/50 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-0 left-1/3 w-36 h-36 bg-purple-400/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-white/70" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg group"
              >
                <stat.icon className={`h-12 w-12 ${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`} />
                <div className="text-4xl font-bold text-white mb-2 text-center">{stat.value}</div>
                <div className="text-base text-white/90 text-center font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
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
              Our comprehensive program is designed to take you from where you are today to becoming a confident AI generalist, 
              ready to tackle any challenge in the rapidly evolving tech landscape.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Accelerated Learning</h3>
                <p className="text-gray-700 leading-relaxed">
                  Cutting-edge curriculum designed for rapid skill acquisition and practical application.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Industry Recognition</h3>
                <p className="text-gray-700 leading-relaxed">
                  Earn certifications and build projects that employers actively seek and value.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Career Transformation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Complete career makeover with skills, portfolio, and mindset for AI success.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Four Levels Overview */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white border-0">
              Learning Levels
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Four Levels to Master
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              A structured journey from learning to launching your AI career
            </p>
          </div>
          
          <div className="space-y-12">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] border-0">
                <CardContent className="p-0">
                  <div className={`grid md:grid-cols-2 gap-0 ${index % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
                    {/* Content */}
                    <div className="p-12 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
                      <div className={`bg-gradient-to-br ${feature.gradient} p-4 rounded-2xl w-16 h-16 mb-6 flex items-center justify-center`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                      <p className="text-xl text-gray-700 mb-8 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-4">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-lg">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Image */}
                    <div className={`relative overflow-hidden ${index % 2 === 1 ? 'md:order-first' : ''}`}>
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}/10`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              Join Our Community
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Who Can Join?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              This program is designed for ambitious individuals ready to embrace AI
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-md h-full">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="bg-blue-500 p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Fresh Graduates</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  Recent graduates looking to enter the AI field with strong foundations
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-md h-full">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="bg-green-500 p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">College Students</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  Students wanting to get ahead with AI skills before graduation
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-md h-full">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="bg-orange-500 p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">IT & Non-IT Professionals</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  Working professionals ready to transition or upskill in AI
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              How It Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Simple 4-step journey to Land Your Dream Job
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className={`${step.color} p-8 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-xl`}>
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute top-12 -right-12 h-8 w-8 text-gray-400 hidden md:block animate-pulse" />
                  )}
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Level One Courses Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
              <BookOpen className="w-4 h-4 mr-2" />
              Level One Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Career Level Up Courses
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Comprehensive courses designed to elevate your career to the next level
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <GraduationCap className="h-24 w-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Courses Coming Soon
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Our comprehensive Career Level Up courses are being prepared. Stay tuned for exciting learning opportunities!
              </p>
            </div>
          ) : (
            <div className="relative">
              <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                <CarouselContent className="-ml-2 md:-ml-4">
                  {courses.map((course, index) => (
                    <CarouselItem key={course.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                      <Card className="h-full hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg overflow-hidden">
                        <CardContent className="p-0 h-full">
                          {/* Course Header */}
                          <div className={`bg-gradient-to-r ${
                            index % 4 === 0 ? 'from-indigo-500 to-purple-600' :
                            index % 4 === 1 ? 'from-blue-500 to-cyan-600' :
                            index % 4 === 2 ? 'from-purple-500 to-pink-600' :
                            'from-orange-500 to-red-600'
                          } p-6`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                                <BookOpen className="h-6 w-6 text-white" />
                              </div>
                              <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                                {course.category || 'General'}
                              </Badge>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                              {course.title}
                            </h3>
                            <p className="text-white/90 text-sm">
                              Course Code: {course.code}
                            </p>
                          </div>

                          {/* Course Content */}
                          <div className="p-6">
                            <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">
                              {course.description || 'Comprehensive course content designed to enhance your skills and advance your career in the modern workplace.'}
                            </p>

                            {/* Course Features */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Interactive Learning</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Practical Projects</span>
                              </div>
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Certification</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button className={`w-full bg-gradient-to-r ${
                              index % 4 === 0 ? 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700' :
                              index % 4 === 1 ? 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700' :
                              index % 4 === 2 ? 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' :
                              'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                            } text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300`}>
                              Explore Course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 bg-white/80 hover:bg-white shadow-lg border-0" />
                <CarouselNext className="right-2 bg-white/80 hover:bg-white shadow-lg border-0" />
              </Carousel>

              {/* Course Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{courses.length}+</h3>
                    <p className="text-gray-700">Available Courses</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">100%</h3>
                    <p className="text-gray-700">Practical Learning</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Certified</h3>
                    <p className="text-gray-700">Industry Recognition</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Level Up Activities Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 font-bold">
              <Trophy className="w-4 h-4 mr-2" />
              Level 2 Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Master These Key Activities
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Build your professional foundation with our three core level-up activities
            </p>
          </div>

          <div className="relative">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {/* Profile Build Activity */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-indigo-600 to-purple-700 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Activity Header */}
                      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <User className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Foundation
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Profile Build
                          </h3>
                          <p className="text-white/90 text-sm">
                            Build Your Professional Identity
                          </p>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Create a compelling professional profile that showcases your skills, experience, and achievements to stand out to employers.
                        </p>

                        {/* Activity Features */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Resume Optimization</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Personal Branding</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Professional Portfolio</span>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/80">Progress</span>
                            <span className="text-white font-semibold">Build Foundation</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full w-1/3"></div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-indigo-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Start Building Profile
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* LinkedIn Network Growth Activity */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-600 to-cyan-700 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Activity Header */}
                      <div className="bg-gradient-to-r from-blue-700 to-cyan-800 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Users className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Networking
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            LinkedIn Network Growth
                          </h3>
                          <p className="text-white/90 text-sm">
                            Expand Your Professional Network
                          </p>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Grow your LinkedIn network strategically, engage with industry professionals, and build meaningful connections.
                        </p>

                        {/* Activity Features */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Connection Building</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Content Creation</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Engagement Strategies</span>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/80">Progress</span>
                            <span className="text-white font-semibold">Growing Network</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full w-2/3"></div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-blue-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Grow Your Network
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* GitHub Repository Activity */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-900 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Activity Header */}
                      <div className="bg-gradient-to-r from-gray-900 to-black p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-500/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Github className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Development
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            GitHub Repository
                          </h3>
                          <p className="text-white/90 text-sm">
                            Showcase Your Technical Skills
                          </p>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Build and maintain a professional GitHub profile with quality repositories that demonstrate your coding abilities.
                        </p>

                        {/* Activity Features */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Repository Creation</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Code Quality</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Project Documentation</span>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/80">Progress</span>
                            <span className="text-white font-semibold">Building Portfolio</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full w-1/2"></div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-gray-800 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Build Repositories
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Digital Portfolio Activity */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-emerald-600 to-teal-700 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Activity Header */}
                      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Globe className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Portfolio
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Digital Portfolio
                          </h3>
                          <p className="text-white/90 text-sm">
                            Showcase Your Complete Journey
                          </p>
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Create a comprehensive digital portfolio that showcases your skills, projects, achievements, and professional journey.
                        </p>

                        {/* Activity Features */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Project Showcase</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Skills Documentation</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Achievement Gallery</span>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/80">Progress</span>
                            <span className="text-white font-semibold">Creating Showcase</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full w-3/4"></div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-emerald-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Build Portfolio
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-white/80 hover:bg-white shadow-lg border-0" />
              <CarouselNext className="right-2 bg-white/80 hover:bg-white shadow-lg border-0" />
            </Carousel>

            {/* Level Up Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Profile</h3>
                  <p className="text-gray-300">Professional Foundation</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Network</h3>
                  <p className="text-gray-300">Professional Connections</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Github className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Code</h3>
                  <p className="text-gray-300">Technical Showcase</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Portfolio</h3>
                  <p className="text-gray-300">Digital Showcase</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Level 3 Program - Job Hunter Level Up */}
      <section className="py-20 px-4 bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-700">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm font-bold">
              <Briefcase className="w-4 h-4 mr-2" />
              Level 3 Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Land Your Dream Job
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Advanced job hunting strategies and tools to secure your ideal position
            </p>
          </div>

          <div className="relative">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {/* Find Your Next Role */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-700 to-indigo-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Target className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Job Search
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Find Your Next Role
                          </h3>
                          <p className="text-white/90 text-sm">
                            AI-Powered Job Discovery
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Discover relevant job opportunities using AI-powered matching algorithms that align with your skills and career goals.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-blue-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Smart Job Matching</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Company Insights</span>
                          </div>
                          <div className="flex items-center gap-2 text-blue-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Application Tracking</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-blue-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Explore Opportunities
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Job Tracker */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-green-700 to-emerald-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-green-800 to-emerald-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Pipeline
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Job Tracker Pipeline
                          </h3>
                          <p className="text-white/90 text-sm">
                            Manage Your Applications
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Organize and track all your job applications through a comprehensive pipeline management system.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Application Pipeline</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Status Tracking</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Follow-up Reminders</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-green-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Manage Pipeline
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Job Search History */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-purple-700 to-violet-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-purple-800 to-violet-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Clock className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Analytics
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Job Search History
                          </h3>
                          <p className="text-white/90 text-sm">
                            Track Your Progress
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Analyze your job search journey with detailed history, statistics, and insights to improve your strategy.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-purple-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Search Analytics</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Performance Metrics</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Success Patterns</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-purple-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          View Analytics
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-white/80 hover:bg-white shadow-lg border-0" />
              <CarouselNext className="right-2 bg-white/80 hover:bg-white shadow-lg border-0" />
            </Carousel>

            {/* Job Hunter Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Smart Search</h3>
                  <p className="text-white/90">AI-Powered Job Discovery</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pipeline</h3>
                  <p className="text-white/90">Application Management</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Analytics</h3>
                  <p className="text-white/90">Success Tracking</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Level 4 Program - Vibe Coding */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm font-bold">
              <Rocket className="w-4 h-4 mr-2" />
              Level 4 Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Vibe Coding Mastery
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              For non-IT professionals ready to build SaaS applications and AI-powered solutions without traditional programming
            </p>
          </div>

          <div className="relative">
            <Carousel className="w-full" opts={{ align: "start", loop: true }}>
              <CarouselContent className="-ml-2 md:-ml-4">
                {/* SaaS Application Builder */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-violet-700 to-purple-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-violet-800 to-purple-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Code className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              No-Code
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            SaaS App Builder
                          </h3>
                          <p className="text-white/90 text-sm">
                            Visual Application Development
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Build fully functional SaaS applications using visual programming tools and AI-powered code generation.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-violet-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Drag & Drop Interface</span>
                          </div>
                          <div className="flex items-center gap-2 text-violet-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">AI Code Generation</span>
                          </div>
                          <div className="flex items-center gap-2 text-violet-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">One-Click Deployment</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-violet-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Start Building
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* AI Agents & Automation */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-pink-700 to-rose-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-pink-800 to-rose-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Cpu className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              AI Powered
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            AI Agents & Automation
                          </h3>
                          <p className="text-white/90 text-sm">
                            Intelligent Workflow Automation
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Create sophisticated AI agents and automated workflows that handle business processes intelligently.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-pink-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Conversational AI</span>
                          </div>
                          <div className="flex items-center gap-2 text-pink-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Process Automation</span>
                          </div>
                          <div className="flex items-center gap-2 text-pink-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Smart Integrations</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-pink-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Build AI Agents
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* Solopreneur Business Tools */}
                <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-amber-700 to-orange-800 border-0 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Feature Header */}
                      <div className="bg-gradient-to-r from-amber-800 to-orange-900 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 backdrop-blur-sm"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                              <Building2 className="h-8 w-8 text-white" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                              Business
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            Solopreneur Suite
                          </h3>
                          <p className="text-white/90 text-sm">
                            One-Person Business Empire
                          </p>
                        </div>
                      </div>

                      {/* Feature Content */}
                      <div className="p-6 text-white">
                        <p className="text-white/90 mb-6 leading-relaxed">
                          Launch and scale your one-person business with AI-powered tools for marketing, sales, and operations.
                        </p>

                        {/* Feature Benefits */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-amber-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Business Automation</span>
                          </div>
                          <div className="flex items-center gap-2 text-amber-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Revenue Optimization</span>
                          </div>
                          <div className="flex items-center gap-2 text-amber-200">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Market Analysis</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button className="w-full bg-white text-amber-700 hover:bg-gray-100 font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
                          Start Your Business
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-white/80 hover:bg-white shadow-lg border-0" />
              <CarouselNext className="right-2 bg-white/80 hover:bg-white shadow-lg border-0" />
            </Carousel>

            {/* Vibe Coding Features */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Profile Build</h3>
                  <p className="text-white/90">Digital Presence</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Network Growth</h3>
                  <p className="text-white/90">LinkedIn Expansion</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Cpu className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">AI Automation</h3>
                  <p className="text-white/90">Smart Workflows</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15">
                <CardContent className="p-6 text-center">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Business Scale</h3>
                  <p className="text-white/90">Revenue Growth</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Hear from our successful graduates who transformed their careers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg relative overflow-hidden">
                <CardContent className="p-8">
                  {/* Gradient Background */}
                  <div className={`absolute top-0 left-0 w-full h-2 ${testimonial.color}`}></div>
                  
                  {/* Stars */}
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className={`${testimonial.color} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                      <p className="text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* The Future Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
            The Future Belongs to Those who Master AI
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">DevOps specialist jobs are growing</p>
                <p className="text-2xl font-bold text-orange-600">3.5 times</p>
                <p className="text-gray-600">faster than other jobs.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">AI-enhanced DevOps engineers can demand</p>
                <p className="text-2xl font-bold text-orange-600">40-80%</p>
                <p className="text-gray-600">more than traditional IT roles.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">Jobseekers with generative AI skills could expect a nearly</p>
                <p className="text-2xl font-bold text-orange-600">50%</p>
                <p className="text-gray-600">salary bump.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">Demand for cloud professionals is surging</p>
                <p className="text-2xl font-bold text-orange-600">$12.7B</p>
                <p className="text-gray-600">investment in cloud infrastructure in India</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">AWS customer base growth</p>
                <p className="text-2xl font-bold text-orange-600">357%</p>
                <p className="text-gray-600">increase since 2020</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange-200 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-gray-600">Full-time AWS jobs annually by 2030</p>
                <p className="text-2xl font-bold text-orange-600">131,700</p>
                <p className="text-gray-600">careers available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Special Focus on AI Integration */}
      <section className="py-12 bg-gradient-to-br from-violet-50 via-indigo-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-violet-100 via-indigo-100 to-emerald-100 border-2 border-violet-200 relative overflow-hidden max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-50 via-transparent to-emerald-50"></div>
            <CardContent className="p-8 relative z-10">
              <div className="text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-violet-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Special Focus on AI Integration</h3>
                  <Zap className="h-6 w-6 text-violet-600" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Learn to build and deploy <span className="font-bold text-violet-600 px-2 py-1 bg-violet-100 rounded-md">AI Agents</span>, 
                  create powerful <span className="font-bold text-emerald-600 px-2 py-1 bg-emerald-100 rounded-md">AI Automations</span>, 
                  and design efficient <span className="font-bold text-orange-600 px-2 py-1 bg-orange-100 rounded-md">Vibe Coding</span> in every module
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Career Level Up */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-900">
              About Career Level Up
            </h2>
            <div className="bg-white rounded-2xl p-8 shadow-lg border">
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                <strong className="text-gray-900">Career Level Up</strong> is a flagship product from <span className="text-primary font-semibold">Rise n Shine Technologies</span>, designed to help students and professionals automate their job-hunting journey.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                With <span className="text-primary font-semibold">19+ years of training & IT experience</span>, Rise n Shine empowers job seekers with tools, AI automation, and proven strategies to land their dream careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Student Success Stories */}
      <section className="py-12 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Student Success Stories
          </h2>
          <p className="text-center text-lg text-gray-600 mb-16">
            Real outcomes from our alumni who transformed their careers
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">65%</div>
                  <div className="text-lg font-semibold mb-2">Salary Increase</div>
                  <div className="text-gray-600">Priya Singh</div>
                  <div className="text-sm text-gray-600">Jr. Developer → DevOps Engineer</div>
                  <div className="text-sm text-orange-600 font-medium mt-2">₹8L → ₹13.2L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">65</div>
                  <div className="text-lg font-semibold mb-2">Days to Job</div>
                  <div className="text-gray-600">Anjali Patel</div>
                  <div className="text-sm text-gray-600">Support Engineer → Cloud DevOps</div>
                  <div className="text-sm text-orange-600 font-medium mt-2">₹5L → ₹12L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-rose-600 mb-2">100%</div>
                  <div className="text-lg font-semibold mb-2">Remote Work</div>
                  <div className="text-gray-600">Sneha Reddy</div>
                  <div className="text-sm text-gray-600">IT Admin → DevOps Architect</div>
                  <div className="text-sm text-orange-600 font-medium mt-2">₹7L → ₹22L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-blue-100 border-2 border-indigo-200">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">90</div>
                  <div className="text-lg font-semibold mb-2">Days Training</div>
                  <div className="text-gray-600">Arjun Gupta</div>
                  <div className="text-sm text-gray-600">Network Engineer → AI-DevOps</div>
                  <div className="text-sm text-orange-600 font-medium mt-2">₹9L → ₹16L</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Exclusive Bonuses */}
      <section className="py-12 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Exclusive Bonuses Worth ₹10,000+
          </h2>
          <p className="text-center text-lg text-gray-600 mb-16">
            Get these premium resources absolutely FREE with your enrollment
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">GitHub Copilot & Cursor Cheat Sheets</h3>
                    <p className="text-gray-600">Complete reference guides for AI-powered coding with shortcuts, best practices, and advanced techniques</p>
                    <Badge className="mt-2 bg-orange-100 text-orange-600">Worth ₹2,000</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet-50 to-indigo-100 border-2 border-violet-200">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cpu className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AWS PartyRock Mini-Build Templates</h3>
                    <p className="text-gray-600">Ready-to-use templates for building AI applications on AWS with step-by-step implementation guides</p>
                    <Badge className="mt-2 bg-violet-100 text-violet-600">Worth ₹3,000</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">1000+ Prompts for Developers</h3>
                    <p className="text-gray-600">Comprehensive collection of AI prompts for coding, debugging, documentation, and system design</p>
                    <Badge className="mt-2 bg-emerald-100 text-emerald-600">Worth ₹3,500</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-sky-50 to-indigo-100 border-2 border-sky-200">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AWS AI Practitioner Exam Blueprint</h3>
                    <p className="text-gray-600">Complete study guide and practice tests for AWS AI certification with insider tips and strategies</p>
                    <Badge className="mt-2 bg-sky-100 text-sky-600">Worth ₹2,500</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full font-semibold">
              <Gift className="h-5 w-5" />
              Total Bonus Value: ₹11,000 - Yours FREE!
            </div>
          </div>
        </div>
      </section>

      {/* What Our Alumni Say */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900">
            What Our Alumni Say
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange-600 text-2xl mb-4">"</div>
                <p className="text-gray-600 italic">
                  "The AI integration in this program is incredible! Learning GitHub Copilot and Cursor transformed my coding speed by 300%. I went from struggling with basic DevOps to building AI-powered infrastructures. Best investment ever!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Priya Singh</p>
                    <p className="text-sm text-gray-600">DevOps Engineer at Infosys</p>
                    <p className="text-sm text-orange-600">₹8L → ₹13.2L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange-600 text-2xl mb-4">"</div>
                <p className="text-gray-600 italic">
                  "The placement support is outstanding! They didn't just teach me DevOps, they prepared my entire portfolio, optimized my LinkedIn, and I got 3 job offers within 45 days of completing the program."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Rahul Kumar</p>
                    <p className="text-sm text-gray-600">AI-DevOps Lead at TCS</p>
                    <p className="text-sm text-orange-600">₹6L → ₹18L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange-600 text-2xl mb-4">"</div>
                <p className="text-gray-600 italic">
                  "As a fresher, I was worried about competing with experienced developers. But the AI-enhanced learning approach and hands-on projects gave me confidence. Now I'm earning ₹15L as a Senior DevOps Engineer!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Vikram Sharma</p>
                    <p className="text-sm text-gray-600">Senior DevOps at Accenture</p>
                    <p className="text-sm text-orange-600">Fresher → ₹15L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange-600 text-2xl mb-4">"</div>
                <p className="text-gray-600 italic">
                  "The future is AI + DevOps, and this program nailed it! Learning to build AI agents for infrastructure monitoring and automated deployments set me apart from other candidates. Remote work at ₹22L - dream come true!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Neha Agarwal</p>
                    <p className="text-sm text-gray-600">DevOps Architect at Remote Company</p>
                    <p className="text-sm text-orange-600">₹10L → ₹22L</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment in Your Future */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing Plans
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Investment in Your Future
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Choose the perfect plan to accelerate your AI career transformation
            </p>
          </div>
          
          {/* Investment Plans - 4 Plans */}
          <div className="grid sm:grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {/* 1 Month Plan */}
            <Card className="relative p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">1 Month Plan</h3>
                  <p className="text-sm text-muted-foreground">Perfect for focused job searching</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <span className="text-2xl font-bold">1499.00</span>
                    <span className="text-sm text-muted-foreground">/1 month</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">ATS verified Resume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">Resume builder & optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">LinkedIn optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">Job tracker & analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">AI career assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Free Linux Shell and AWS Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Free DevOps with AWS and Python Course</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full"
                  onClick={handlePricingClick}
                >
                  Get Started
                </Button>
              </div>
            </Card>

            {/* 3 Months Plan - Most Popular */}
            <Card className="relative p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 ring-2 ring-primary ring-offset-2 scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
              
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">3 Months Plan</h3>
                  <p className="text-sm text-muted-foreground">Best value for comprehensive career growth</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <span className="text-2xl font-bold">3999.00</span>
                    <span className="text-sm text-muted-foreground">/3 months</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Level 1 Program Features */}
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">AI Resume Builder & ATS Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">LinkedIn Profile Enhancement Tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Job Application Tracking System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Interview Preparation Resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Career Growth Analytics Dashboard</span>
                  </div>
                  {/* Level 4 Program Features */}
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Advanced Portfolio Building Tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Technical Skills Assessment Platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Industry-Specific Job Matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Networking Strategy & Tools</span>
                  </div>
                  {/* Existing features */}
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Free Access to Career Growth Live Cohort on every Saturday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">1-time personal review of Resume, LinkedIn and GitHub Profile</span>
                  </div>
                </div>
                
                <Button 
                  variant="hero"
                  size="sm" 
                  className="w-full"
                  onClick={handlePricingClick}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </Card>

            {/* 6 Months Plan */}
            <Card className="relative p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">6 Months Plan</h3>
                  <p className="text-sm text-muted-foreground">Extended career development package</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <span className="text-2xl font-bold">6999.00</span>
                    <span className="text-sm text-muted-foreground">/6 months</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">Everything in 3 Months Plan +</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Video Based Bio Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Digital Profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">the AI-Powered Super AI Tools access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Vibe Coding Tools [No coding required]</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full"
                  onClick={handlePricingClick}
                >
                  Get Started
                </Button>
              </div>
            </Card>

            {/* 1 Year Plan */}
            <Card className="relative p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">1 Year Plan</h3>
                  <p className="text-sm text-muted-foreground">Complete career transformation package</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <span className="text-2xl font-bold">11999.00</span>
                    <span className="text-sm text-muted-foreground">/1 year</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">Everything in 6 Months Plan +</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Reverse Engineering Strategy to land Dream job as fast as</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-warning flex-shrink-0" />
                    <span className="text-base text-foreground">Automated Job-Hunting Process</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full"
                  onClick={handlePricingClick}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Shield className="w-4 h-4 mr-2" />
            Limited Time Offer
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Join thousands of successful graduates and start your AI journey today
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-12 py-4 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
              onClick={handleEnrollClick}
            >
              Enroll Now
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xl border-t">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-sm sm:text-base">
                🚀 Join Now to Land Your Career with AI Assistance
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <span className="text-white/60">•</span>
              <Link to="/terms-of-service" className="hover:underline">Terms</Link>
              <span className="text-white/60">•</span>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 pb-20">{/* Added pb-20 to account for sticky banner */}
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Enhanced Career Level Up
              </h3>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                Transform your career into an AI Generalist with our comprehensive program designed for the future of work.
              </p>
              <div className="flex items-center gap-3 text-gray-400">
                <Globe className="h-5 w-5 text-purple-400" />
                <span className="text-lg">aicareerlevelup.com</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-xl">Contact</h4>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>info@aicareerlevelup.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-400" />
                  <span>+91 9704462666</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-xl">Follow Us</h4>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 border-2 border-gray-600 text-gray-300 hover:bg-purple-600/30 hover:border-purple-400 hover:text-white transition-all duration-300 bg-gray-800/70 backdrop-blur-sm"
                  asChild
                >
                  <a href="https://www.linkedin.com/in/gvenkat09" target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 border-2 border-gray-600 text-gray-300 hover:bg-red-600/30 hover:border-red-400 hover:text-white transition-all duration-300 bg-gray-800/70 backdrop-blur-sm"
                  asChild
                >
                  <a href="https://www.youtube.com/@career-levelup" target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">YouTube</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 border-2 border-gray-600 text-gray-300 hover:bg-pink-600/30 hover:border-pink-400 hover:text-white transition-all duration-300 bg-gray-800/70 backdrop-blur-sm"
                  asChild
                >
                  <a href="https://www.instagram.com/rnstechnologies?igsh=MTM1emgzOHQxczJteg==&utm_source=ig_contact_invite" target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">&copy; 2025 AI Career Level Up. All rights reserved.</p>
            <p className="text-gray-500 mt-2">Empowering the next generation of AI professionals</p>
          </div>
        </div>
      </footer>
    </div>
  );
}