import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Target, Users, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-job-hunters.jpg";


const Hero = () => {
  const navigate = useNavigate();
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Hero content */}
      <div className="container relative z-10 px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text content */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Your Complete Career Success Platform
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Create stunning portfolios, track job applications with smart Kanban boards, and get AI-powered career insights - all in one powerful platform.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Your competitor is already using AI. Don't get left behind.
                </p>
              </div>
            </div>

            {/* Stats with urgency */}
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  <span className="text-xs md:text-sm font-medium">1000+ Got Hired</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  <span className="text-xs md:text-sm font-medium">92% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 md:w-5 md:h-5 text-success" />
                  <span className="text-xs md:text-sm font-medium">5x Faster Hiring</span>
                </div>
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
          <div className="relative space-y-6">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroImage}
                alt="Professional job hunters"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary/10" />
              
              {/* AI Cloud Bootcamp label */}
              <div className="absolute top-4 left-4 bg-gradient-primary rounded-lg px-3 py-2 shadow-glow">
                <span className="text-sm font-semibold text-primary-foreground">AI Cloud Bootcamp</span>
              </div>
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-card rounded-lg p-4 shadow-elegant border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live Job Alerts</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-card rounded-lg p-4 shadow-elegant border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">92%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Build Profile CTA */}
            <div className="bg-gradient-hero rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5"></div>
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary mb-4 shadow-glow">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
                  Build Profile for Free
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Start your career transformation journey today. Create your professional profile and explore our tools at no cost.
                </p>
                
                <Button
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 w-full font-semibold"
                  onClick={() => navigate('/auth')}
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className="text-xs text-muted-foreground mt-3">
                  No credit card required • Instant access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;