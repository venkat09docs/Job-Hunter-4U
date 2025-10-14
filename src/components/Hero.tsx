import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Target, Users, User, FileText, Brain, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import careerSuccessSteps from "@/assets/career-success-steps.jpg";


const Hero = () => {
  const navigate = useNavigate();
  return (
    <>
      <section id="hero" className="relative min-h-[75vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero" />
        
        {/* Hero content */}
        <div className="container relative z-10 px-4 py-4">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Text content */}
            <div className="space-y-4 md:space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in">
                  <span className="text-foreground">
                    Your Complete Career Success Platform
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in animation-delay-200">
                  <span className="font-semibold text-foreground">Create stunning portfolios</span>, track job applications with <span className="text-primary font-semibold">smart Kanban boards</span>, and get <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent font-semibold">AI-powered career insights</span> - all in one powerful platform.
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Your competitor is already using AI. Don't get left behind.
                  </p>
                </div>
              </div>

              {/* Rating and trust indicators */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 md:gap-2 text-sm md:text-base text-muted-foreground">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="hidden sm:inline">4.6/5 and 13 Years of Trust</span>
                  <span className="sm:hidden">4.6/5 Trust Score</span>
                  <span>•</span>
                  <span className="text-success">No credit card required</span>
                </div>
              </div>
            </div>

            {/* Hero image and CTA */}
            <div className="relative">
              {/* Career Level Up Box from AI Career Level Up page */}
              <div className="relative bg-gradient-to-br from-purple-600/60 via-pink-600/50 to-indigo-600/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border-2 border-white/40 shadow-2xl overflow-hidden">
                {/* Strong Animated Background Pattern */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/40 via-pink-500/30 to-transparent"></div>
                  <div className="absolute top-1/4 right-0 w-96 h-96 bg-pink-500/50 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-cyan-500/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                
                {/* Career Success Steps Image */}
                <div className="relative z-10 mb-6 rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={careerSuccessSteps} 
                    alt="Career success journey - climbing steps to reach goals" 
                    className="w-full h-auto"
                  />
                </div>
                
                {/* Main Text */}
                <div className="text-center mb-4 relative z-10">
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 drop-shadow-2xl" style={{
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 105, 180, 0.3)'
                  }}>
                    Career Level Up
                  </h3>
                </div>
                
                {/* Labels Grid - 5 items */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 relative z-10">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-2 md:p-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-lg">ATS Resume</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2 md:p-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-lg">Digital Portfolio</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-2 md:p-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-lg">Job Hunting</span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-2 md:p-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-lg">LinkedIn</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-2 md:p-3 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border-2 border-white/30 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="h-3 w-3 md:h-4 md:w-4 text-white" />
                      <span className="text-white font-bold text-[10px] md:text-xs drop-shadow-lg">GitHub</span>
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
        </div>
      </section>

      {/* CTA Section - Separate from Hero */}
      <section className="py-12 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analyze Resume CTA - Left */}
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-2xl p-8 relative overflow-hidden border-2 border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-pink-500/5"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-6 shadow-glow">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Analyze Your Resume
                </h3>
                
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  Get instant AI-powered insights to improve your resume and beat ATS systems.
                </p>
                
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-2xl transition-all duration-300 w-full transform hover:scale-105"
                  onClick={() => navigate('/auth')}
                >
                  Analyze For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Instant results
                </p>
              </div>
            </div>

            {/* Build Profile CTA - Right */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-6 shadow-glow">
                  <User className="h-8 w-8 text-primary-foreground" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  Build Profile for Free
                </h3>
                
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                  Start your career transformation journey today. Create your professional profile and explore our tools at no cost.
                </p>
                
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 w-full font-semibold transform hover:scale-105"
                  onClick={() => navigate('/auth')}
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-sm text-muted-foreground mt-4">
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