import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { 
  FileText, 
  Linkedin, 
  BriefcaseIcon, 
  Github, 
  TrendingUp, 
  Target, 
  CheckCircle,
  ArrowRight 
} from "lucide-react";

const ActivityFeaturesShowcase = () => {
  const navigate = useNavigate();
  const { isIT } = useUserIndustry();

  const allFeatures = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Resume Builder & Tracker",
      description: "Build professional resumes with AI assistance and track your progress with completion percentage.",
      features: ["AI-powered resume optimization", "Progress tracking", "Multiple templates", "ATS-friendly formats"],
      color: "bg-blue-500/10 text-blue-600",
      route: "/resume-builder"
    },
    {
      icon: <Linkedin className="w-6 h-6" />,
      title: "LinkedIn Growth Activities",
      description: "Boost your LinkedIn presence with daily activities and track your networking progress.",
      features: ["Daily activity targets", "Network growth metrics", "Profile optimization", "Weekly progress tracking"],
      color: "bg-blue-700/10 text-blue-700",
      route: "/linkedin-optimization"
    },
    {
      icon: <BriefcaseIcon className="w-6 h-6" />,
      title: "Job Application Tracker",
      description: "Organize your job search with our Kanban-style tracker from application to hire.",
      features: ["Kanban-style tracking", "Application status updates", "Interview scheduling", "Follow-up reminders"],
      color: "bg-green-500/10 text-green-600",
      route: "/job-tracker"
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: "GitHub Activity Tracker",
      description: "Track your coding activities and maintain a strong developer profile on GitHub.",
      features: ["Commit tracking", "Repository analytics", "Contribution insights", "Developer profile optimization"],
      color: "bg-gray-500/10 text-gray-600",
      route: "/github-activity-tracker"
    }
  ];

  // Filter features based on user industry
  const features = isIT() ? allFeatures : allFeatures.filter(feature => feature.route !== "/github-activity-tracker");

  const handleFeatureClick = (route: string) => {
    navigate('/auth');
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Career Growth Activities
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Track Every Step of Your Career Journey
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive activity tracking system helps you build a strong professional presence across all platforms. 
            Monitor your progress and achieve your career goals faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50"
              onClick={() => handleFeatureClick(feature.route)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-card rounded-2xl p-8 border border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold text-foreground">92%</span>
              </div>
              <p className="text-sm text-muted-foreground">Profile Completion Rate</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">3x</span>
              </div>
              <p className="text-sm text-muted-foreground">Faster Job Search</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-2xl font-bold text-foreground">1000+</span>
              </div>
              <p className="text-sm text-muted-foreground">Users Hired</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-warning" />
                <span className="text-2xl font-bold text-foreground">40%</span>
              </div>
              <p className="text-sm text-muted-foreground">Avg Salary Increase</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            onClick={() => navigate('/auth')}
          >
            Start Tracking Your Career Growth
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ActivityFeaturesShowcase;