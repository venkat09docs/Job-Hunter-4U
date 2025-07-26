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
  const features = [
    {
      icon: Search,
      title: "Smart Job Matching",
      description: "AI-powered algorithm matches you with relevant job opportunities based on your skills, experience, and preferences."
    },
    {
      icon: Users,
      title: "Network Building", 
      description: "Connect with industry professionals, mentors, and potential employers to expand your professional network."
    },
    {
      icon: Target,
      title: "Career Coaching",
      description: "Get personalized career guidance from experienced professionals to accelerate your career growth."
    },
    {
      icon: Shield,
      title: "Privacy Protection",
      description: "Your profile remains confidential until you choose to reveal it to interested employers."
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description: "Get real-time alerts for new job openings that match your criteria and never miss an opportunity."
    },
    {
      icon: TrendingUp,
      title: "Salary Insights",
      description: "Access market salary data and negotiate better compensation with confidence."
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything You Need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools and resources you need 
            to land your dream job and advance your career.
          </p>
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
                "This platform completely transformed my job search. I landed my dream role 
                in just 3 weeks thanks to their amazing matching algorithm and career coaching."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">SJ</span>
                </div>
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-muted-foreground">Senior Software Engineer</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Join 50,000+ Successful Job Hunters</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Average 40% salary increase</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>Land interviews 3x faster</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span>95% job placement success rate</span>
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full">
                Start Your Success Story
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;