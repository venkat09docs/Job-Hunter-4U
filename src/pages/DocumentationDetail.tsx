import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Circle, Clock, User, BookOpen, Target, Settings, Users, Trophy, BarChart } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";

const documentationContent = {
  1: {
    title: "Complete Platform Setup Guide",
    description: "Your first steps after signing in - complete walkthrough of the Digital Career Hub platform and its core features.",
    readTime: "10 min read",
    lastUpdated: "1 day ago",
    category: "Getting Started",
    steps: [
      {
        id: 1,
        title: "Welcome to Digital Career Hub",
        content: `Congratulations on joining Digital Career Hub! This comprehensive platform is designed to accelerate your career growth and help you get hired faster. Let's start with understanding what makes this platform unique:

• **AI-Powered Career Tools**: Get personalized recommendations and automated assistance
• **Gamification System**: Earn points for every career-building activity you complete
• **Complete Job Search Management**: Track applications, interviews, and progress
• **Professional Profile Building**: Create compelling profiles across multiple platforms
• **Learning & Development**: Access curated resources and track your skill growth`,
        icon: "BookOpen"
      },
      {
        id: 2,
        title: "Complete Your Initial Profile Setup",
        content: `Your profile is the foundation of your success on this platform. Complete these essential sections:

**Basic Information:**
• Navigate to Profile → Edit Profile
• Add your professional photo (increases profile views by 60%)
• Fill in your current role, location, and contact information
• Write a compelling professional summary (2-3 sentences)

**Skills & Experience:**
• List your top 10 technical and soft skills
• Add your work experience with specific achievements
• Include education details and certifications

**Career Preferences:**
• Set your desired job titles and industries
• Specify your preferred work location (remote/hybrid/onsite)
• Set salary expectations and availability date

**Pro Tip:** Completing your profile earns you valuable points and increases your visibility to recruiters by 85%!`,
        icon: "User"
      },
      {
        id: 3,
        title: "Connect Your Professional Accounts",
        content: `Linking your professional accounts enables powerful automation and tracking features:

**LinkedIn Integration:**
• Go to Settings → Connected Accounts
• Connect your LinkedIn profile for automatic activity tracking
• Enable LinkedIn automation tools (Premium feature)
• Sync your network growth and engagement metrics

**GitHub Integration:**
• Connect your GitHub account to showcase technical projects
• Enable automatic commit tracking and contribution analysis
• Display your coding activity and project portfolio

**Benefits of Integration:**
• Automatic profile updates and skill verification
• Real-time activity tracking and point earning
• Enhanced credibility with verified accounts
• Streamlined application processes`,
        icon: "Settings"
      },
      {
        id: 4,
        title: "Set Up Your Job Search Preferences",
        content: `Configure your job search settings for personalized opportunities:

**Job Tracker Setup:**
• Navigate to Job Tracker from the main menu
• Set up job search alerts for your preferred roles
• Configure automatic job matching based on your profile
• Enable email notifications for new opportunities

**Application Management:**
• Create application templates for different job types
• Set up interview scheduling integration
• Enable application status tracking and reminders

**AI Job Matching:**
• Complete the career assessment questionnaire
• Set your job search intensity (passive/active/urgent)
• Configure geographic and remote work preferences
• Enable AI-powered job recommendations`,
        icon: "Target"
      },
      {
        id: 5,
        title: "Understand the Points & Gamification System",
        content: `Our gamification system motivates consistent career-building activities:

**How Points Work:**
• Earn points for profile completion, job applications, networking, and learning
• View your point history and track daily/weekly progress
• Compete on leaderboards with other users in your institute or globally

**Point Categories:**
• **Profile Building**: Complete sections, add skills, update experience
• **Job Search**: Apply to jobs, attend interviews, update application status
• **Networking**: Connect on LinkedIn, engage with posts, attend events
• **Learning**: Complete courses, read documentation, set goals

**Viewing Your Progress:**
• Check your dashboard for daily point summary
• Access detailed point history from your profile menu
• Track your ranking on various leaderboards
• Set daily and weekly point targets`,
        icon: "Trophy"
      },
      {
        id: 6,
        title: "Explore AI-Powered Career Tools",
        content: `Leverage our AI tools to accelerate your career growth:

**AI Resume Builder:**
• Navigate to Resume Builder from the main menu
• Choose from ATS-optimized templates
• Get AI-powered content suggestions for each section
• Generate multiple versions for different job types

**AI Career Assistant:**
• Access the chat assistant from any page
• Ask for personalized career advice and job search strategies
• Get help with interview preparation and salary negotiation
• Request feedback on your applications and profiles

**AI Job Search:**
• Use AI-powered job matching for personalized recommendations
• Get automated application writing assistance
• Receive interview preparation based on specific job requirements`,
        icon: "BarChart"
      },
      {
        id: 7,
        title: "Join Your Institute Community (If Applicable)",
        content: `If you're part of an educational institution, maximize your community benefits:

**Institute Features:**
• Access your institute's private leaderboard
• Connect with classmates and alumni
• Participate in institute-specific challenges and competitions
• Access exclusive resources and job opportunities

**Networking Within Your Institute:**
• View and connect with fellow students
• Share job opportunities and referrals
• Participate in group learning activities
• Access mentor connections through faculty

**Competition & Motivation:**
• Compete for top positions on your institute leaderboard
• Participate in batch-wise competitions
• Earn recognition for consistent progress
• Access institute-specific rewards and incentives`,
        icon: "Users"
      },
      {
        id: 8,
        title: "Set Your Career Goals & Create an Action Plan",
        content: `Define clear objectives to stay focused and motivated:

**Goal Setting Process:**
• Navigate to Career Growth → Learning Goals
• Set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
• Break down long-term goals into weekly milestones
• Assign point values to track progress

**Recommended Initial Goals:**
• Complete profile to 100% within first week
• Apply to 5 relevant jobs within first month
• Build LinkedIn network by 50 connections
• Complete 3 skill assessments or courses

**Tracking & Adjustment:**
• Review goals weekly and adjust as needed
• Celebrate milestone achievements
• Use the platform's analytics to identify improvement areas
• Set increasingly challenging goals as you progress`,
        icon: "Target"
      },
      {
        id: 9,
        title: "Master Your Dashboard & Analytics",
        content: `Your dashboard is your career command center:

**Dashboard Overview:**
• Daily activity summary and point progress
• Recent applications and their status updates
• Upcoming interviews and important reminders
• Goal progress and achievement notifications

**Key Metrics to Monitor:**
• Profile completion percentage
• Application response rate
• Interview success rate
• Network growth rate
• Learning progress and skill development

**Using Analytics for Improvement:**
• Identify patterns in successful applications
• Track which networking strategies work best
• Monitor your most productive days and times
• Adjust strategies based on data insights

**Regular Review Process:**
• Check dashboard daily for 5 minutes
• Review weekly analytics every Sunday
• Adjust goals and strategies monthly
• Celebrate achievements and learn from setbacks`,
        icon: "BarChart"
      },
      {
        id: 10,
        title: "Take Your First Quick Win Actions",
        content: `Complete these high-impact activities in your first session:

**Immediate Actions (Next 30 Minutes):**
• Upload a professional profile photo
• Complete basic profile information
• Connect LinkedIn and GitHub accounts
• Set up 3 job search alerts

**This Week's Goals:**
• Complete profile to 90%+
• Apply to 3 relevant positions
• Connect with 10 new LinkedIn contacts
• Read 2 relevant documentation articles

**Success Metrics:**
• Earn your first 100 points
• Achieve "Profile Builder" badge
• Get featured on the newcomer leaderboard
• Receive your first job match recommendation

**Next Steps:**
• Explore the Knowledge Base for advanced strategies
• Join community discussions and forums
• Schedule regular platform usage (15-20 minutes daily)
• Consider upgrading to Premium for advanced features

**Remember:** Consistency beats intensity. Small daily actions compound into significant career progress!`,
        icon: "CheckCircle"
      }
    ]
  }
};

export default function DocumentationDetail() {
  const { id } = useParams();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const docId = parseInt(id || "1");
  const doc = documentationContent[docId as keyof typeof documentationContent];

  useEffect(() => {
    // Load completed steps from localStorage
    const saved = localStorage.getItem(`doc-${docId}-progress`);
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, [docId]);

  const toggleStepComplete = (stepId: number) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    localStorage.setItem(`doc-${docId}-progress`, JSON.stringify(newCompleted));
  };

  const getIcon = (iconName: string) => {
    const icons = {
      BookOpen,
      User,
      Settings,
      Target,
      Trophy,
      Users,
      BarChart,
      CheckCircle
    };
    const IconComponent = icons[iconName as keyof typeof icons] || BookOpen;
    return <IconComponent className="h-6 w-6" />;
  };

  if (!doc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Documentation Not Found</h1>
          <Link to="/dashboard/knowledge-base" className="text-primary hover:underline">
            Return to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  const progress = (completedSteps.length / doc.steps.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard/knowledge-base"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Knowledge Base</span>
            </Link>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Badge variant="secondary">{doc.category}</Badge>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {doc.readTime}
              </div>
              <span>•</span>
              <span>Updated {doc.lastUpdated}</span>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">{doc.title}</h1>
            <p className="text-xl text-muted-foreground mb-6">{doc.description}</p>
            
            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps.length}/{doc.steps.length} steps completed
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {doc.steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <Card key={step.id} className={`transition-all ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() => toggleStepComplete(step.id)}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getIcon(step.icon)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Step {index + 1}: {step.title}
                            </CardTitle>
                            {isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      {step.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4 whitespace-pre-line text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant={isCompleted ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleStepComplete(step.id)}
                      >
                        {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(step.id)}
                      >
                        Focus on this step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Completion Message */}
          {completedSteps.length === doc.steps.length && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Congratulations! You've completed this guide.
                </h3>
                <p className="text-green-700 mb-4">
                  You're now ready to make the most of the Digital Career Hub platform. 
                  Continue exploring other documentation to accelerate your career growth!
                </p>
                <Link to="/dashboard/knowledge-base">
                  <Button>Explore More Guides</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}