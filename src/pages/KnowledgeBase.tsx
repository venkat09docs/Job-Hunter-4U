import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, FileText, Clock, User, ArrowLeft, Trophy, Star } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";
import { useActivityPointSettings } from "@/hooks/useActivityPointSettings";

const videoCategories = [
  {
    id: "career-development",
    name: "Career Development",
    videos: [
      {
        id: 1,
        title: "Building Your Professional Brand",
        description: "Learn how to create a strong professional brand that stands out in your industry.",
        duration: "12:45",
        instructor: "Sarah Johnson",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 2,
        title: "Effective Networking Strategies",
        description: "Master the art of networking both online and offline to advance your career.",
        duration: "18:20",
        instructor: "Michael Chen",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 3,
        title: "Resume Writing Best Practices",
        description: "Create compelling resumes that get noticed by hiring managers and ATS systems.",
        duration: "15:30",
        instructor: "Emily Davis",
        thumbnail: "/placeholder.svg"
      }
    ]
  },
  {
    id: "interview-skills",
    name: "Interview Skills",
    videos: [
      {
        id: 4,
        title: "Behavioral Interview Preparation",
        description: "Prepare for behavioral interviews using the STAR method and real examples.",
        duration: "22:15",
        instructor: "David Wilson",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 5,
        title: "Technical Interview Strategies",
        description: "Ace technical interviews with proven strategies and practice techniques.",
        duration: "28:40",
        instructor: "Alex Rodriguez",
        thumbnail: "/placeholder.svg"
      }
    ]
  },
  {
    id: "linkedin-optimization",
    name: "LinkedIn Optimization",
    videos: [
      {
        id: 6,
        title: "LinkedIn Profile Optimization",
        description: "Optimize your LinkedIn profile to attract recruiters and opportunities.",
        duration: "16:25",
        instructor: "Jennifer Thompson",
        thumbnail: "/placeholder.svg"
      },
      {
        id: 7,
        title: "LinkedIn Content Strategy",
        description: "Create engaging content that builds your professional network and influence.",
        duration: "20:10",
        instructor: "Mark Anderson",
        thumbnail: "/placeholder.svg"
      }
    ]
  }
];

const docCategories = [
  {
    id: "getting-started",
    name: "Getting Started",
    docs: [
      {
        id: 1,
        title: "Complete Platform Setup Guide",
        description: "Your first steps after signing in - complete walkthrough of the Digital Career Hub platform and its core features.",
        readTime: "10 min read",
        lastUpdated: "1 day ago"
      },
      {
        id: 2,
        title: "First-Time User Onboarding",
        description: "Essential setup checklist for new users to maximize their career growth potential from day one.",
        readTime: "8 min read",
        lastUpdated: "2 days ago"
      },
      {
        id: 3,
        title: "Understanding Your Dashboard",
        description: "Navigate your personalized dashboard, understand key metrics, and access all available tools efficiently.",
        readTime: "6 min read",
        lastUpdated: "3 days ago"
      },
      {
        id: 4,
        title: "Setting Up Your Profile Foundation",
        description: "Build a strong profile foundation with essential information that recruiters and employers look for.",
        readTime: "12 min read",
        lastUpdated: "1 day ago"
      },
      {
        id: 5,
        title: "Premium vs Free Features Overview",
        description: "Understand the difference between free and premium features to make informed decisions about upgrades.",
        readTime: "7 min read",
        lastUpdated: "4 days ago"
      },
      {
        id: 6,
        title: "Understanding the Points & Gamification System",
        description: "Learn how to earn points through various activities and use gamification to stay motivated in your career journey.",
        readTime: "9 min read",
        lastUpdated: "2 days ago"
      },
      {
        id: 7,
        title: "Quick Win Activities for New Users",
        description: "Start earning points immediately with these simple activities that boost your profile visibility and readiness.",
        readTime: "5 min read",
        lastUpdated: "1 day ago"
      },
      {
        id: 8,
        title: "Setting Your Career Goals & Timeline",
        description: "Define clear, actionable career goals and create a timeline to track your progress towards getting hired.",
        readTime: "11 min read",
        lastUpdated: "3 days ago"
      },
      {
        id: 9,
        title: "Connecting Your Professional Accounts",
        description: "Link your LinkedIn, GitHub, and other professional accounts to maximize profile completeness and automation features.",
        readTime: "8 min read",
        lastUpdated: "2 days ago"
      },
      {
        id: 10,
        title: "Platform Navigation & Key Features Tour",
        description: "Comprehensive tour of all major sections including Job Tracker, AI Tools, Resume Builder, and Analytics.",
        readTime: "15 min read",
        lastUpdated: "1 day ago"
      }
    ]
  },
  {
    id: "job-search",
    name: "Job Search",
    docs: [
      {
        id: 4,
        title: "Using the Job Tracker",
        description: "Maximize your job search efficiency with our advanced job tracking system.",
        readTime: "10 min read",
        lastUpdated: "5 days ago"
      },
      {
        id: 5,
        title: "AI-Powered Job Matching",
        description: "How our AI algorithms match you with the perfect job opportunities.",
        readTime: "7 min read",
        lastUpdated: "1 week ago"
      },
      {
        id: 6,
        title: "Application Best Practices",
        description: "Proven strategies for crafting successful job applications.",
        readTime: "12 min read",
        lastUpdated: "4 days ago"
      }
    ]
  },
  {
    id: "ai-tools",
    name: "AI Tools",
    docs: [
      {
        id: 7,
        title: "AI Resume Builder Guide",
        description: "Create professional resumes using our AI-powered resume builder.",
        readTime: "15 min read",
        lastUpdated: "2 days ago"
      },
      {
        id: 8,
        title: "AI Career Assistant",
        description: "Get personalized career advice from our AI-powered assistant.",
        readTime: "9 min read",
        lastUpdated: "6 days ago"
      }
    ]
  }
];

export default function KnowledgeBase() {
  const [activeVideoCategory, setActiveVideoCategory] = useState("career-development");
  const [activeDocCategory, setActiveDocCategory] = useState("getting-started");
  const { settings, loading: pointsLoading, getSettingsByCategory } = useActivityPointSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Go to Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Knowledge Base
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access our comprehensive library of videos and step-by-step guides to accelerate your career growth.
          </p>
        </div>

        <div className="space-y-8">
          {/* Reward Points Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Reward Points
              </CardTitle>
              <CardDescription>
                Understand how you earn points for various activities in your career development journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile-building">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="profile-building" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Profile Building
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile-building">
                  <ScrollArea className="h-[400px] pr-4">
                    {pointsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getSettingsByCategory('resume').map((activity) => (
                          <Card key={activity.id} className="border-l-4 border-l-primary/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm">{activity.activity_name}</h3>
                                    <Badge variant={activity.is_active ? "default" : "secondary"} className="text-xs">
                                      {activity.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {activity.points} points
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {getSettingsByCategory('resume').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No profile building activities configured yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Videos Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Videos
                </CardTitle>
                <CardDescription>
                  Watch expert-led tutorials and career development videos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeVideoCategory} onValueChange={setActiveVideoCategory}>
                  <TabsList className="grid w-full grid-cols-3">
                    {videoCategories.map((category) => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="text-xs"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {videoCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id}>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                          {category.videos.map((video) => (
                            <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm mb-1 truncate">{video.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                      {video.description}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {video.duration}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {video.instructor}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Step by Step Docs Section */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Step by Step Docs
                </CardTitle>
                <CardDescription>
                  Follow detailed guides and documentation for all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeDocCategory} onValueChange={setActiveDocCategory}>
                  <TabsList className="grid w-full grid-cols-3">
                    {docCategories.map((category) => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="text-xs"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {docCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id}>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                          {category.docs.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm mb-1">{doc.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                      {doc.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <Badge variant="secondary" className="text-xs">
                                        {doc.readTime}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Updated {doc.lastUpdated}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}