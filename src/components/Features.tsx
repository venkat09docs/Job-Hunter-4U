import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Users, 
  Target, 
  Shield, 
  Zap, 
  TrendingUp,
  CheckCircle,
  Star
} from "lucide-react";

const Features = () => {
  const navigate = useNavigate();
  const painPoints = [
    "Sending 100+ applications with zero responses",
    "Getting rejected after multiple interview rounds", 
    "Not knowing how to optimize your resume for ATS",
    "Missing out on opportunities due to poor LinkedIn profile",
    "Struggling to stand out among thousands of candidates",
    "Accepting lower salaries due to lack of market insights"
  ];

  const features = [
    {
      icon: Search,
      title: "AI Resume Scanner",
      description: "Beat ATS systems with our AI that optimizes your resume for each job application. 94% pass rate vs 23% industry average."
    },
    {
      icon: Users,
      title: "LinkedIn Optimization", 
      description: "Grow your network 10x faster with complete tracking connection requests and engagement."
    },
    {
      icon: Target,
      title: "Job Application Tracker",
      description: "Never lose track of applications again. Get insights on response rates and optimize your approach based on data."
    },
    {
      icon: Shield,
      title: "Interview Preparation AI",
      description: "Practice with our AI interviewer trained on real interviews. Boost confidence and ace every interview."
    },
    {
      icon: Zap,
      title: "Salary Negotiation Tools",
      description: "Know your worth with real-time market data. Our users negotiate 40% higher salaries on average."
    },
    {
      icon: TrendingUp,
      title: "Portfolio Builder",
      description: "Create stunning portfolios that showcase your work. Stand out with professional presentations that impress recruiters."
    }
  ];

  return (
    <section className="py-12 bg-gradient-feature">
      <div className="container px-4">
        {/* Pain Points Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-destructive">
              Are You Stuck in This{" "}
              <span className="bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">
                Job Search Hell?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              If any of these sound familiar, you're not alone. 89% of job seekers face these exact problems.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
            {painPoints.map((pain, index) => (
              <div key={index} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-destructive font-medium">❌ {pain}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-card rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">
              Here's How{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Career Level Up
              </span>{" "}
              Solves Every Problem
            </h3>
            <p className="text-muted-foreground">
              Stop struggling alone. Join the platform who transformed their career with our AI-powered platform.
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-4 md:p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 group hover:border-primary/30">
              <div className="space-y-3 md:space-y-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-primary text-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-card rounded-2xl p-8 border border-primary/20 text-center space-y-6">
          <h3 className="text-2xl font-bold">Don't Be The Last To Know</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <span><strong>40% average salary boost</strong> </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <span><strong>5x faster job Hunting</strong> </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <span><strong>87% success rate</strong> (vs 12% traditional methods)</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <span><strong>Works for all levels:</strong> Students to CXOs</span>
            </div>
          </div>
          
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full animate-pulse"
            onClick={() => navigate('/auth')}
          >
            Join Career Level Up Winners Platform Today - Just ₹699
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;