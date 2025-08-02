import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-job-hunters.jpg";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Hero content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                🔥 Last 24hrs: 1,247 people got hired
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Stop Getting{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent line-through opacity-60">
                  Rejected
                </span>{" "}
                Start Getting{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Hired
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Tired of endless applications with no responses?</strong> Join 50K+ students and job seekers who landed their dream jobs 3x faster using our AI-powered career platform. <span className="text-primary font-semibold">Average salary increase: 40%</span>
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Your competition is already using AI. Don't get left behind.
                </p>
              </div>
            </div>

            {/* Stats with urgency */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">50K+ Got Hired</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">95% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium">3x Faster Hiring</span>
                </div>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <p className="text-sm text-warning font-medium">
                  🕒 Limited Time: Get access for just ₹299/week (Regular price: ₹1,999)
                </p>
              </div>
            </div>

            {/* CTA buttons with urgency */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="group animate-pulse"
                  onClick={() => navigate('/auth')}
                >
                  Get Hired in 30 Days - Start Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/blogs')}
                >
                  See Success Stories
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>⭐⭐⭐⭐⭐</span>
                <span>4.9/5 from 10K+ reviews</span>
                <span>•</span>
                <span className="text-success">No credit card required</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroImage}
                alt="Professional job hunters"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary/10" />
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
        </div>
      </div>
    </section>
  );
};

export default Hero;