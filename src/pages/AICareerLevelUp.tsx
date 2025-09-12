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
  GraduationCap
} from "lucide-react";
import { useCareerLevelProgram } from "@/hooks/useCareerLevelProgram";
import { useState, useEffect } from "react";
import type { Course } from "@/types/clp";

// Import generated images
import heroImage from "@/assets/ai-career-hero.jpg";
import skillsImage from "@/assets/ai-skills-learning.jpg";
import portfolioImage from "@/assets/digital-portfolio.jpg";
import jobHuntingImage from "@/assets/smart-job-hunting.jpg";
import solopreneurImage from "@/assets/solopreneur-journey.jpg";

export default function AICareerLevelUp() {
  const { getCourses, loading } = useCareerLevelProgram();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const coursesData = await getCourses();
    setCourses(coursesData);
  };

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
      icon: Code,
      title: "Solopreneur Journey with Vibe Coding",
      description: "Implement SaaS applications and learn digital marketing",
      benefits: ["Build real applications", "Digital marketing mastery", "Entrepreneurial mindset"],
      image: solopreneurImage,
      gradient: "from-green-500 to-teal-500"
    }
  ];

  const steps = [
    { title: "Learn", description: "Master AI fundamentals and tools", icon: Brain, color: "bg-purple-500" },
    { title: "Build", description: "Create your digital portfolio", icon: Award, color: "bg-blue-500" },
    { title: "Apply", description: "Land your dream job", icon: Target, color: "bg-orange-500" },
    { title: "Launch", description: "Start your solopreneur journey", icon: Rocket, color: "bg-green-500" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "AI Engineer at TechCorp",
      quote: "This program transformed my career from a traditional role to an AI specialist in just 6 months!",
      rating: 5,
      avatar: "SJ",
      color: "bg-gradient-to-br from-pink-500 to-purple-600"
    },
    {
      name: "Raj Patel",
      role: "Freelance AI Consultant",
      quote: "The solopreneur track helped me build my own SaaS product. Now I'm running a profitable business.",
      rating: 5,
      avatar: "RP",
      color: "bg-gradient-to-br from-blue-500 to-cyan-600"
    },
    {
      name: "Emily Chen",
      role: "Fresh Graduate",
      quote: "As a fresh graduate, this program gave me the competitive edge I needed to land my first AI job.",
      rating: 5,
      avatar: "EC",
      color: "bg-gradient-to-br from-green-500 to-teal-600"
    }
  ];

  const stats = [
    { icon: Users, value: "10,000+", label: "Students Enrolled", color: "text-blue-600" },
    { icon: Trophy, value: "95%", label: "Job Success Rate", color: "text-green-600" },
    { icon: Star, value: "4.9/5", label: "Average Rating", color: "text-yellow-600" },
    { icon: Clock, value: "6 Months", label: "Average Completion", color: "text-purple-600" }
  ];

  return (
    <div className="min-h-screen bg-white">
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
        
        <div className="relative container mx-auto max-w-7xl px-4 py-20 text-center z-10">
          <Badge variant="secondary" className="mb-8 bg-white/20 text-white border-white/30 backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" />
            🚀 Transform Your Career Today
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in">
            AI Enhanced –<br />
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              Career Level Up
            </span>
          </h1>
          
          {/* Highlighted Tagline */}
          <div className="relative mb-12 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-cyan-400/20 blur-xl rounded-full"></div>
            <p className="relative text-2xl md:text-4xl font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent border-2 border-white/30 rounded-2xl py-6 px-8 backdrop-blur-sm">
              #TransformYourCareerIntoAnAIGeneralist
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-10 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all duration-300">
              Start Your AI Career Today
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg">
              Explore Curriculum
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/90">{stat.label}</div>
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
              From Beginner to AI Generalist
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
      <section className="py-20 px-4 bg-white">
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
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              Join Our Community
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Who Can Join?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              This program is designed for ambitious individuals ready to embrace AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Fresh Graduates</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Recent graduates looking to enter the AI field with strong foundations
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">College Students</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Students wanting to get ahead with AI skills before graduation
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0 shadow-lg">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">IT & Non-IT Professionals</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
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
              Simple 4-step journey to AI mastery
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
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-12 py-4 text-xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              Enroll Now - 50% Off
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-4 text-xl">
              Download Free Guide
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 inline-block">
            <p className="text-white font-semibold text-lg mb-2">🎯 Early Bird Special Ending Soon!</p>
            <p className="text-white/90">Save $500 + Get Premium Mentorship Included</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
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
                <span className="text-lg">careerlevelup.pro</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-xl">Contact</h4>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>info@careerlevelup.pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-400" />
                  <span>+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-xl">Follow Us</h4>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="h-12 w-12 border-gray-700 text-gray-400 hover:bg-purple-600/20 hover:border-purple-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-gray-700 text-gray-400 hover:bg-blue-600/20 hover:border-blue-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-gray-700 text-gray-400 hover:bg-red-600/20 hover:border-red-400 hover:text-white transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">&copy; 2024 AI Enhanced Career Level Up. All rights reserved.</p>
            <p className="text-gray-500 mt-2">Empowering the next generation of AI professionals</p>
          </div>
        </div>
      </footer>
    </div>
  );
}