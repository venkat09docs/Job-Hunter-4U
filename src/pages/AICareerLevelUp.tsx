import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Shield
} from "lucide-react";

// Import generated images
import heroImage from "@/assets/ai-career-hero.jpg";
import skillsImage from "@/assets/ai-skills-learning.jpg";
import portfolioImage from "@/assets/digital-portfolio.jpg";
import jobHuntingImage from "@/assets/smart-job-hunting.jpg";
import solopreneurImage from "@/assets/solopreneur-journey.jpg";

export default function AICareerLevelUp() {
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
    { icon: Users, value: "10,000+", label: "Students Enrolled", color: "text-blue-500" },
    { icon: Trophy, value: "95%", label: "Job Success Rate", color: "text-green-500" },
    { icon: Star, value: "4.9/5", label: "Average Rating", color: "text-yellow-500" },
    { icon: Clock, value: "6 Months", label: "Average Completion", color: "text-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-pink-900/80 to-blue-900/90"></div>
        
        <div className="relative container mx-auto max-w-7xl px-4 py-20 text-center z-10">
          <Badge variant="secondary" className="mb-8 bg-white/10 text-white border-white/20 backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-4 h-4 mr-2" />
            🚀 Transform Your Career Today
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in">
            AI Enhanced –<br />
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
              Career Level Up
            </span>
          </h1>
          
          <p className="text-xl md:text-3xl text-white/90 mb-12 max-w-4xl mx-auto font-light animate-fade-in">
            Transform Your Career into an AI Generalist
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in">
            <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-10 py-4 text-lg shadow-2xl transform hover:scale-105 transition-all">
              Start Your AI Career Today
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg">
              Explore Curriculum
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Floating Animation Elements */}
        <div className="absolute bottom-10 left-10 w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-xl opacity-60 animate-bounce"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full blur-xl opacity-60 animate-bounce delay-1000"></div>
      </section>

      {/* About the Program */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
              About the Program
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              From Beginner to AI Generalist
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Our comprehensive program is designed to take you from where you are today to becoming a confident AI generalist, 
              ready to tackle any challenge in the rapidly evolving tech landscape.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border-purple-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Accelerated Learning</h3>
                <p className="text-gray-300 leading-relaxed">
                  Cutting-edge curriculum designed for rapid skill acquisition and practical application.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-blue-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Industry Recognition</h3>
                <p className="text-gray-300 leading-relaxed">
                  Earn certifications and build projects that employers actively seek and value.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-sm border-green-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Career Transformation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Complete career makeover with skills, portfolio, and mindset for AI success.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Four Levels Overview */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-pink-600 text-white border-0">
              Learning Levels
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Four Levels to Master
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A structured journey from learning to launching your AI career
            </p>
          </div>
          
          <div className="space-y-12">
            {features.map((feature, index) => (
              <Card key={index} className={`relative overflow-hidden bg-gradient-to-r ${feature.gradient}/10 backdrop-blur-sm border-white/20 hover:scale-[1.02] transition-all duration-500 group`}>
                <CardContent className="p-0">
                  <div className={`grid md:grid-cols-2 gap-0 ${index % 2 === 1 ? 'md:grid-flow-col-dense' : ''}`}>
                    {/* Content */}
                    <div className="p-12 flex flex-col justify-center">
                      <div className={`bg-gradient-to-br ${feature.gradient} p-4 rounded-2xl w-16 h-16 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold mb-4 text-white">{feature.title}</h3>
                      <p className="text-xl text-gray-300 mb-8 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-4">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-lg">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Image */}
                    <div className={`relative overflow-hidden ${index % 2 === 1 ? 'md:order-first' : ''}`}>
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}/20`}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Join */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
              Join Our Community
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Who Can Join?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              This program is designed for ambitious individuals ready to embrace AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-blue-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Fresh Graduates</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  Recent graduates looking to enter the AI field with strong foundations
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-sm border-green-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">College Students</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  Students wanting to get ahead with AI skills before graduation
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 backdrop-blur-sm border-orange-500/30 hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-10 text-center">
                <div className="bg-gradient-to-br from-orange-500 to-pink-600 p-6 rounded-3xl w-24 h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">IT & Non-IT Professionals</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  Working professionals ready to transition or upskill in AI
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Simple 4-step journey to AI mastery
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className={`${step.color} p-8 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl`}>
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="absolute top-12 -right-12 h-8 w-8 text-gray-400 hidden md:block animate-pulse" />
                  )}
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                <p className="text-gray-300 text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
              Success Stories
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Hear from our successful graduates who transformed their careers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/20 hover:scale-105 transition-all duration-300 group relative overflow-hidden">
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
                  <blockquote className="text-gray-300 mb-8 italic text-lg leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className={`${testimonial.color} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{testimonial.name}</h4>
                      <p className="text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto max-w-5xl text-center z-10">
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
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-12 py-4 text-xl shadow-2xl transform hover:scale-105 transition-all">
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
      <footer className="relative bg-slate-900 border-t border-white/10 py-20 px-4">
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
              <h4 className="font-bold mb-6 text-white text-xl">Contact</h4>
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
              <h4 className="font-bold mb-6 text-white text-xl">Follow Us</h4>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="h-12 w-12 border-white/20 text-white hover:bg-purple-600/20 hover:border-purple-400">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-white/20 text-white hover:bg-blue-600/20 hover:border-blue-400">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="h-12 w-12 border-white/20 text-white hover:bg-red-600/20 hover:border-red-400">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-16 pt-12 text-center">
            <p className="text-gray-400 text-lg">&copy; 2024 AI Enhanced Career Level Up. All rights reserved.</p>
            <p className="text-gray-500 mt-2">Empowering the next generation of AI professionals</p>
          </div>
        </div>
      </footer>
    </div>
  );
}