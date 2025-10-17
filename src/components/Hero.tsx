import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Target, Users, User, FileText, Brain, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import careerSuccessSteps from "@/assets/career-success-steps.jpg";


const Hero = () => {
  const navigate = useNavigate();
  return (
    <>
      <section id="hero" className="relative min-h-0 flex items-center justify-center overflow-visible pt-20 sm:pt-24 pb-8 sm:pb-12 md:pb-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero -z-10" />
        
        {/* Hero content */}
        <div className="container relative z-10 px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center">
            {/* Text content */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 text-center lg:text-left order-2 lg:order-1">
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight animate-fade-in">
                  <span className="text-foreground">
                    Your Complete Career Success Platform
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-in animation-delay-200">
                  <span className="font-semibold text-foreground">Create stunning portfolios</span>, track job applications with <span className="text-primary font-semibold">smart Kanban boards</span>, and get <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold">AI-powered career insights</span> - all in one powerful platform.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-destructive font-medium">
                    ⚠️ Your competitor is already using AI. Don't get left behind.
                  </p>
                </div>
              </div>

              {/* Rating and trust indicators */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className="text-sm sm:text-base">⭐⭐⭐⭐⭐</span>
                  <span className="hidden sm:inline">4.6/5 and 13 Years of Trust</span>
                  <span className="sm:hidden">4.6/5 Trust</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-success">No credit card</span>
                </div>
              </div>
            </div>

            {/* Hero image and CTA */}
            <div className="relative order-1 lg:order-2 w-full">
              {/* Career Level Up Box */}
              <div className="relative bg-gradient-to-br from-purple-600/60 via-pink-600/50 to-indigo-600/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-white/40 shadow-2xl overflow-visible">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-40 rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/40 via-pink-500/30 to-transparent"></div>
                  <div className="absolute top-1/4 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-pink-500/50 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 left-0 w-36 h-36 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-cyan-500/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                
                {/* Career Success Steps Image */}
                <div className="relative z-10 mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
                  <img 
                    src={careerSuccessSteps} 
                    alt="Career success journey - climbing steps to reach goals" 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Main Text */}
                <div className="text-center mb-2 sm:mb-3 relative z-10">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-white mb-1 sm:mb-2 drop-shadow-2xl" style={{
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 105, 180, 0.3)'
                  }}>
                    Career Level Up
                  </h3>
                </div>
                
                {/* Labels Grid - 5 items with better mobile layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-1.5 sm:p-2 transform hover:scale-105 transition-all duration-300 shadow-lg border border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate">Resume</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-1.5 sm:p-2 transform hover:scale-105 transition-all duration-300 shadow-lg border border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate">Portfolio</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-1.5 sm:p-2 transform hover:scale-105 transition-all duration-300 shadow-lg border border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate">Job Hunt</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-1.5 sm:p-2 transform hover:scale-105 transition-all duration-300 shadow-lg border border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate">LinkedIn</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg p-1.5 sm:p-2 transform hover:scale-105 transition-all duration-300 shadow-lg border border-white/30 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                      <span className="text-white font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate">GitHub</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Separate from Hero */}
      <section className="py-8 sm:py-10 md:py-12 px-3 sm:px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Analyze Resume CTA - Left */}
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 relative overflow-hidden border-2 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-pink-500/5"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-4 sm:mb-5 md:mb-6 shadow-glow">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
                
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Analyze Your Resume
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5 md:mb-6 leading-relaxed">
                  Get instant AI-powered insights to improve your resume and beat ATS systems.
                </p>
                
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-2xl transition-all duration-300 w-full transform hover:scale-105 text-sm sm:text-base"
                  onClick={() => navigate('/auth')}
                >
                  Analyze For Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                  No credit card required • Instant results
                </p>
              </div>
            </div>

            {/* Build Profile CTA - Right */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-primary mb-4 sm:mb-5 md:mb-6 shadow-glow">
                  <User className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Build Profile for Free
                </h3>
                
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5 md:mb-6 leading-relaxed">
                  Start your career transformation journey today. Create your professional profile and explore our tools at no cost.
                </p>
                
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 w-full font-semibold transform hover:scale-105 text-sm sm:text-base"
                  onClick={() => navigate('/auth')}
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                  No credit card required • Instant access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;