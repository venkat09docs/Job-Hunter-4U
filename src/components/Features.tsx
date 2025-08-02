import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      title: "LinkedIn Automation", 
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
    <section className="py-20 bg-muted/30">
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {painPoints.map((pain, index) => (
              <div key={index} className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">❌ {pain}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-card rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">
              Here's How{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                JobHunter Pro
              </span>{" "}
              Solves Every Problem
            </h3>
            <p className="text-muted-foreground">
              Stop struggling alone. Join the platform who transformed their career with our AI-powered platform.
            </p>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-gradient-card border-0 shadow-elegant hover:shadow-glow transition-all duration-300 group">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Testimonial section */}
        <div className="bg-gradient-card rounded-2xl p-8 md:p-12 shadow-elegant border">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-warning fill-current" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium">
                "I was rejected 312 times in 11 months, completely broke and depressed. 
                JobHunter Pro got me 14 interviews in 3 weeks and landed a dream job with 86% salary jump!"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">PK</span>
                </div>
                <div>
                  <div className="font-semibold">Priya Kumari</div>
                  <div className="text-muted-foreground">Senior SDE at Google</div>
                  <div className="text-xs text-success">₹7L → ₹32L salary explosion</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <div className="text-2xl font-bold text-primary">⏰ Limited Time Offer</div>
                <div className="text-sm text-muted-foreground">Join before midnight and save 70%</div>
              </div>
              
              <h3 className="text-2xl font-bold">Don't Be The Last To Know</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span><strong>73% average salary boost</strong> </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span><strong>5x faster job Hunting</strong> </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span><strong>97% success rate</strong> (vs 8% traditional methods)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span><strong>Works for all levels:</strong> Students to CXOs</span>
                </div>
              </div>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-warning font-medium">
                  🔥 2,847 people joined in the last 24 hours. Spots filling fast!
                </p>
              </div>
              
              <Button variant="hero" size="lg" className="w-full animate-pulse">
                Join JobHunter Pro Winners Platform Today - Just ₹299
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                30-day money-back guarantee • Cancel anytime • No hidden fees
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;