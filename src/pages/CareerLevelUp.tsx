import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Target, Trophy, Star, Building, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

const CareerLevelUp = () => {
  const { user } = useAuth();
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  const careerLevels = [
    {
      id: "foundation",
      title: "Foundation",
      subtitle: "For Students & New Graduates",
      description: "Build your career foundation with essential skills",
      participants: "10,000+",
      features: ["Resume Building", "Interview Prep", "Skill Assessment", "Career Guidance"],
      icon: Users,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "advanced",
      title: "Advanced",
      subtitle: "For Working Professionals",
      description: "Accelerate your career growth with advanced strategies",
      participants: "5,000+",
      features: ["Leadership Skills", "Network Building", "Industry Insights", "Mentorship"],
      icon: Target,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "professional",
      title: "Professional",
      subtitle: "For Senior Professionals",
      description: "Master executive-level career advancement",
      participants: "2,000+",
      features: ["Executive Coaching", "Strategic Planning", "Board Readiness", "C-Suite Prep"],
      icon: Trophy,
      color: "from-pink-500 to-red-600"
    }
  ];

  const trustMetrics = [
    { label: "Active Users", value: "50,000+", icon: Users },
    { label: "Career Transitions", value: "15,000+", icon: ArrowRight },
    { label: "Partner Companies", value: "500+", icon: Building },
    { label: "Success Rate", value: "89%", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-40 h-40 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-40 right-10 w-28 h-28 border border-white/20 rounded-full"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Career Level Up™
            </h1>
            
            <p className="text-2xl md:text-3xl font-medium text-white/90">
              Elevate Your Professional Journey
            </p>
            
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Millions will participate. Everyone will grow. Join the ultimate career transformation platform.
            </p>
            
            <Button 
              size="lg" 
              variant="secondary"
              className="mt-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Career Level Cards */}
        <div className="relative container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {careerLevels.map((level) => {
              const IconComponent = level.icon;
              return (
                <Card 
                  key={level.id}
                  className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onMouseEnter={() => setHoveredLevel(level.id)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${level.color} flex items-center justify-center`}>
                      <IconComponent className="h-10 w-10 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold">{level.title}</h3>
                    <p className="text-white/80 font-medium">{level.subtitle}</p>
                    <p className="text-white/70 text-sm">{level.description}</p>
                    
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm text-white/60">Active Participants</p>
                      <p className="text-lg font-bold text-white">{level.participants}</p>
                    </div>

                    {hoveredLevel === level.id && (
                      <div className="mt-4 space-y-2 animate-fade-in">
                        {level.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-center text-sm text-white/80">
                            <Star className="h-3 w-3 mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Trusted by Professionals Worldwide
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {trustMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-muted-foreground">{metric.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-foreground">
              Why Choose Career Level Up?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <Card className="p-8 text-left">
                <CardContent className="space-y-4 p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Personalized Learning Path</h3>
                  <p className="text-muted-foreground">
                    Get a customized career development plan based on your current level, goals, and industry requirements.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 text-left">
                <CardContent className="space-y-4 p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Expert Mentorship</h3>
                  <p className="text-muted-foreground">
                    Connect with industry leaders and experienced professionals who can guide your career journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 text-left">
                <CardContent className="space-y-4 p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Achievement Tracking</h3>
                  <p className="text-muted-foreground">
                    Monitor your progress with detailed analytics and celebrate milestones as you advance in your career.
                  </p>
                </CardContent>
              </Card>

              <Card className="p-8 text-left">
                <CardContent className="space-y-4 p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Industry Network</h3>
                  <p className="text-muted-foreground">
                    Access exclusive networking opportunities with top companies and fellow professionals in your field.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold">
              Ready to Level Up Your Career?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of professionals who have transformed their careers with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Get Started Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareerLevelUp;