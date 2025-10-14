import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, User, Users, Globe, CheckCircle, ArrowRight } from "lucide-react";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";

const MasterKeyActivities = () => {
  const activities = [
    {
      title: "ATS Resume Builder",
      description: "Comprehensive course covering fundamental concepts and practical applications for creating professional resumes that beat Applicant Tracking Systems",
      sections: [
        "Resume Templates & Formats",
        "ATS Optimization Techniques",
        "Keyword Integration Strategies",
        "Professional Summary Writing"
      ],
      gradient: "from-blue-600 via-cyan-600 to-teal-600"
    },
    {
      title: "LinkedIn Profile Optimization",
      description: "Master the art of building a powerful LinkedIn presence that attracts recruiters and opportunities",
      sections: [
        "Profile Headline Optimization",
        "About Section Crafting",
        "Experience Highlights",
        "Skill Endorsements Strategy"
      ],
      gradient: "from-gray-900 via-purple-900 to-pink-900"
    },
    {
      title: "GitHub Portfolio Building",
      description: "Create an impressive technical portfolio that showcases your coding skills and projects effectively",
      sections: [
        "Repository Organization",
        "README Documentation",
        "Project Showcasing",
        "Contribution Tracking"
      ],
      gradient: "from-emerald-600 via-green-600 to-teal-600"
    }
  ];

  return (
    <section className="py-20 px-4 bg-white dark:bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <Badge className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-0 font-bold">
            <Trophy className="w-4 h-4 mr-2" />
            Level 2 Program
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-foreground">
            Master These Key Activities
          </h2>
          <p className="text-xl text-gray-700 dark:text-muted-foreground max-w-3xl mx-auto">
            Build your professional foundation with our three core level-up activities
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity, index) => (
              <Card 
                key={index}
                className="h-full transition-all duration-300 border-0 shadow-2xl cursor-pointer rounded-3xl hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] hover:scale-[1.02] overflow-hidden"
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-1 bg-white dark:bg-card">
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-4 leading-tight">
                      {activity.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-700 dark:text-muted-foreground mb-4 leading-relaxed text-sm">
                      {activity.description}
                    </p>

                    {/* Important Course Sections Heading */}
                    <h4 className="text-gray-900 dark:text-foreground font-semibold text-base mb-3">
                      Important Course Sections
                    </h4>

                    {/* Course Sections as Bullet Points */}
                    <div className="space-y-2 flex-1 mb-4">
                      {activity.sections.map((section, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-muted-foreground text-sm leading-relaxed">{section}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <Link to="/ai-career-level-up">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg rounded-xl h-12 text-sm transform hover:scale-[1.02] transition-all duration-200"
                      >
                        View Course Content
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Level Up Stats - Core Activities Boards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Profile</h3>
                <p className="text-gray-700 dark:text-muted-foreground">Professional Foundation</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Network</h3>
                <p className="text-gray-700 dark:text-muted-foreground">Professional Connections</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-gray-600 to-gray-800 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Github className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Code</h3>
                <p className="text-gray-700 dark:text-muted-foreground">Technical Showcase</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-card/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Portfolio</h3>
                <p className="text-gray-700 dark:text-muted-foreground">Digital Showcase</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MasterKeyActivities;
