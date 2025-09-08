import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Download,
  GraduationCap,
  Briefcase,
  Code,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  Phone,
  Target,
  Trophy,
  Star,
  Zap,
  User,
  Gift,
  FileText,
  Cpu,
  BookOpen,
  Award,
  Timer,
  ArrowRight,
  Cloud,
  TrendingUp,
  Users,
  Youtube,
  PlayCircle,
  ExternalLink,
  Terminal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import CareerLevelUpNavigation from "@/components/CareerLevelUpNavigation";

import heroImage from "@/assets/devops-aws-ai-hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CareerLevelUp = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Dynamic seat counts
  const [plan1Seats] = useState(17); // 17 out of 25 seats filled
  const [plan2Seats] = useState(7);  // 7 out of 10 seats filled

  // Timer state
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  // Callback dialog state
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Payment handler with authentication check
  async function handleEnrollment() {
    // Check if user is authenticated
    if (!user) {
      // Store the enrollment intent in sessionStorage
      sessionStorage.setItem('enrollmentIntent', JSON.stringify({
        courseName: 'DevOps AWS AI Course',
        amount: 2000000, // ₹20,000 in paise (20000 * 100)
        plan_duration: '10 weeks'
      }));
      // Navigate to auth page
      window.location.href = '/auth';
      return;
    }

    try {
      const res = await loadRazorpay();
      if (!res) {
        toast({
          title: "Error",
          description: "Razorpay SDK failed to load. Please check your internet connection and try again.",
          variant: "destructive"
        });
        return;
      }

      // Create order using our edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          amount: 2000000, // ₹20,000 in paise (20000 * 100)
          plan_name: 'DevOps AWS AI Course',
          plan_duration: '10 weeks',
        }
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        toast({
          title: "Error",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const options = {
        key: orderData.key,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DevOps AWS AI Course",
        description: "AI-Enhanced DevOps & AWS Bootcamp - Transform Your Career",
        image: "/favicon.ico",
        handler: async function (response: any) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyError || !verifyData?.success) {
              toast({
                title: "Payment Verification Failed",
                description: "Payment received but verification failed. Please contact support.",
                variant: "destructive"
              });
              return;
            }
            
            toast({
              title: "🎉 Payment Successful!",
              description: "Your enrollment is confirmed. Welcome to the DevOps AWS AI Course!",
            });
            
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Processing Error",
              description: "Payment may have been successful but activation failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: function() {
            // Payment modal dismissed
          },
          escape: true,
          backdropclose: false
        },
        theme: { 
          color: "#7c3aed",
          backdrop_color: "rgba(0, 0, 0, 0.8)"
        },
        prefill: {
          name: user?.user_metadata?.full_name || "",
          email: user?.email || "", 
          contact: ""
        },
        notes: {
          course: 'DevOps AWS AI Course',
          duration: '10 weeks'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        toast({
          title: "Payment Failed",
          description: `${response.error.description}. Please try again.`,
          variant: "destructive"
        });
      });
      
      paymentObject.open();
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Check for enrollment intent after authentication
  useEffect(() => {
    const enrollmentIntent = sessionStorage.getItem('enrollmentIntent');
    if (user && enrollmentIntent) {
      // Remove the intent and automatically start payment
      sessionStorage.removeItem('enrollmentIntent');
      // Small delay to ensure UI is ready
      setTimeout(() => {
        handleEnrollment();
      }, 500);
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const highlights = [
    {
      icon: GraduationCap,
      title: "Industry-focused Curriculum",
      description: "DevOps fundamentals | AWS Cloud | AI Integration | Capstone projects | Lab sessions"
    },
    {
      icon: Code,
      title: "Hands-on Learning", 
      description: "15+ tools | Group assignments | Real-world projects | Practical assessments"
    },
    {
      icon: Briefcase,
      title: "Dedicated Placement Support",
      description: "Industry mentors | Portfolio showcase | Mock interviews | Resume optimization"
    },
    {
      icon: Building,
      title: "Access to Premium DevOps Job Opportunities",
      description: "500+ Recruiters | Weekly drives* | Quarterly job fairs* | *T&C Apply"
    }
  ];

  const curriculumLevels = [
    {
      level: "Level 1 – Foundations (Weeks 1–2)",
      topics: "Linux, Git, Python, Docker fundamentals • AWS core: IAM, EC2, S3, VPC • CI/CD overview, GenAI basics"
    },
    {
      level: "Level 2 – AI for DevOps & Infrastructure (Weeks 3–4)",
      topics: "GitHub Copilot & Cursor workflows, Amazon Q Developer • Intro to PartyRock for AI-powered prototypes • AI-Driven IaC: Writing IaC with Terraform, Pulumi, Ansible, using AI assistants like Copilot, Cursor, and Kiro IDE; Agentic workflows, MCP servers, GitOps PR reviews, IaC security via Checkov/tfsec • StationOps for automated AWS infrastructure deployment and intelligent error handling; multi-env setup, domain integration, cost monitoring"
    },
    {
      level: "Level 3 – AIOps & Operational Intelligence (Week 5)",
      topics: "AIOps in DevOps: Use Python, Jupyter, and AI frameworks to automate root-cause analysis and incident response; integrate AI into SRE workflows • Broader AIOps concepts: anomaly detection, proactive logging, predictive maintenance, and self-healing ops"
    },
    {
      level: "Level 4 – AI Infrastructure Operations (Week 6–7)",
      topics: "Bedrock, IaC with CDK/Terraform in AI workloads • Kubernetes essentials, K8sGPT for AI-gen diagnostics with Prometheus/Grafana • PromptOps pipelines: AI-generated CI/CD using Jenkins, GitHub, Terraform, Docker"
    },
    {
      level: "Level 5 – Production-Readiness & Validation (Weeks 8–9)",
      topics: "MLOps & LLMOps Practice Tests: Hands-on scenario-based challenges in CI/CD pipelines for AI, Docker + Kubernetes troubleshooting, production LLM system design (RAG, monitoring, scaling)"
    },
    {
      level: "Level 6 – Capstones & Career Prep (Week 10)",
      topics: "Choose two: • AI SaaS on AWS (auth, storage, billing, CDK) • Secure CI/CD Pipeline for AI chatbot: Git → Jenkins → SonarQube → Docker → EC2 • K8s AIOps with K8sGPT monitoring and dashboards • StationOps-driven AI infra deployment with scaling and cost alerts • Database AI Agent project using LangChain and Bedrock"
    }
  ];

  const projects = [
    {
      id: "ai-saas",
      title: "AI SaaS on AWS",
      description: "End-to-end SaaS with auth + billing",
      tech: ["AWS", "React", "Stripe", "AI"]
    },
    {
      id: "k8sgpt",
      title: "K8sGPT AIOps",
      description: "AI-powered cluster troubleshooting",
      tech: ["Kubernetes", "AI", "Monitoring"]
    },
    {
      id: "cicd",
      title: "Secure CI/CD Pipeline",
      description: "AI chatbot with Jenkins, Docker, EC2",
      tech: ["Jenkins", "Docker", "AWS", "AI"]
    }
  ];

  const faqs = [
    {
      question: "What prerequisites do I need for this bootcamp?",
      answer: "Basic coding knowledge is helpful but not required. We'll start from fundamentals and guide you through Linux, Git, Python, and Docker basics."
    },
    {
      question: "What tools and resources are provided?",
      answer: "AWS Free Tier access, GitHub Pro, Docker Desktop, VS Code, and all premium tools are included. You'll also get exclusive cheat sheets and 1000+ developer prompts worth ₹11,000."
    },
    {
      question: "Do you guarantee job placement?",
      answer: "We provide comprehensive placement support with dedicated mentors, resume optimization, portfolio building, mock interviews, and access to our internal job portal with 100+ opportunities."
    },
    {
      question: "What's your refund policy?",
      answer: "This is a no refund policy as you get access to recorded videos and software that cannot be returned. All materials and resources become available to you immediately upon enrollment."
    },
    {
      question: "How is this different from other DevOps courses?",
      answer: "We're the first to integrate AI Agents, AI Automations, and Vibe Coding into DevOps training. You'll learn to leverage GitHub Copilot, Cursor, Amazon Q, and build AI-powered infrastructure."
    },
    {
      question: "Can I attend if I'm working full-time?",
      answer: "Yes! Classes are scheduled for early mornings (8:30-10:00 AM IST) with weekend labs. All sessions are recorded, and you get 24-hour TA support through WhatsApp community."
    },
    {
      question: "What AI tools will I master in this program?",
      answer: "GitHub Copilot, Cursor IDE, Amazon Q Developer, AWS Bedrock, PartyRock, K8sGPT, and custom AI agents for infrastructure automation and monitoring."
    },
    {
      question: "Are there any hidden costs or additional fees?",
      answer: "No hidden costs. Everything is included - AWS credits, tools access, placement support, and all bonus materials. The only optional upgrade is the Placement Package."
    },
    {
      question: "What happens after course completion?",
      answer: "You'll showcase your capstone projects, get portfolio reviewed by industry experts, receive job referrals, and access our alumni network for continuous career support."
    },
    {
      question: "Is there a free trial or demo available?",
      answer: "Yes! We offer demo sessions for each cohort where you can experience our AI-enhanced teaching methodology and interact with instructors before enrolling."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <CareerLevelUpNavigation />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange to-amber text-white py-3 text-center font-medium">
        Limited Seats Available | Admissions Open for Next Cohort
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-background/50 to-muted/20 py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Content */}
            <div className="space-y-8 lg:pr-8">
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground font-medium">Land your Premium Tech Job with</p>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
                  <span className="bg-gradient-to-r from-indigo to-violet bg-clip-text text-transparent">AI-Enhanced</span>{" "}
                  <span className="text-foreground">DevOps &</span>
                  <br />
                  <span className="text-foreground">AWS Bootcamp</span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Become an in-demand DevOps engineer mastering{" "}
                  <span className="font-semibold text-violet">AI Agents</span>,{" "}
                  <span className="font-semibold text-emerald">AI Automations</span>, and{" "}
                  <span className="font-semibold text-orange">Vibe Coding</span>
                  <br />
                  <span className="font-semibold text-foreground">leveraging the power of GenAI</span>
                </p>
              </div>

              {/* Duration Badges */}
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="px-4 py-2 text-base border-orange bg-orange/10 text-orange hover:bg-orange/20 transition-colors">
                  <Calendar className="h-4 w-4 mr-2" />
                  10 weeks Full-time
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-base border-emerald bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors">
                  <Zap className="h-4 w-4 mr-2" />
                  Live Online
                </Badge>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                 <Button 
                   size="lg" 
                   className="bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald text-white px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                   onClick={() => setIsCurriculumDialogOpen(true)}
                 >
                  <Download className="mr-2 h-5 w-5" />
                  Download Curriculum
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-violet text-violet hover:bg-violet/10 px-8 py-3 text-base font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  onClick={() => setIsCallbackDialogOpen(true)}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Get a Callback
                </Button>
              </div>
            </div>

            {/* Right Side - Image and Next Cohort Board */}
            <div className="space-y-6">
              {/* Hero Image */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet/20 via-indigo/10 to-emerald/20 rounded-3xl transform rotate-1 scale-105 blur-xl opacity-60"></div>
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src={heroImage} 
                    alt="AI-Enhanced DevOps & AWS Bootcamp" 
                    className="w-full h-auto object-cover"
                  />
                  {/* Enhanced Tech Keywords Overlay */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-orange/20">
                      <span className="text-sm font-bold text-orange">AWS</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-violet/20">
                      <span className="text-sm font-bold text-violet">AI</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-emerald/20">
                      <span className="text-sm font-bold text-emerald">DevOps</span>
                    </div>
                  </div>
                  
                  {/* Additional Keywords on Left Side */}
                  <div className="absolute top-4 left-4 space-y-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-sky/20">
                      <span className="text-sm font-bold text-sky">Vibe Coding</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-teal/20">
                      <span className="text-sm font-bold text-teal">AI Agents</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Cohort Board - Simplified */}
              <div className="bg-gradient-to-br from-violet/10 via-indigo/5 to-violet/5 rounded-2xl p-6 border-2 border-violet/20 shadow-lg backdrop-blur-sm">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-violet/10 rounded-full px-4 py-2">
                    <div className="w-2 h-2 bg-violet rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-violet">Next Cohort</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-2xl lg:text-3xl font-bold text-foreground">Starts on 18th Sept 2025</p>
                    <p className="text-lg font-medium text-muted-foreground">at 8:30AM IST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-orange mb-4">Career Level Up Bootcamp Highlights</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">19+</div>
              <div className="text-lg text-white/80">Years of<br />excellence</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">100+</div>
              <div className="text-lg text-white/80">Jobs from Internal<br />Job Portal</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">7,000+</div>
              <div className="text-lg text-white/80">Students<br />Placed</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Future Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            The Future Belongs to Those who Master AI
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 max-w-7xl mx-auto">
            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">"DevOps specialist jobs are growing</p>
                <p className="text-2xl font-bold text-orange">3.5 times</p>
                <p className="text-muted-foreground">faster than other jobs."</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">"AI-enhanced DevOps engineers can demand</p>
                <p className="text-2xl font-bold text-orange">40-80%</p>
                <p className="text-muted-foreground">more than traditional IT roles."</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">"Jobseekers with generative AI skills could expect a nearly</p>
                <p className="text-2xl font-bold text-orange">50%</p>
                <p className="text-muted-foreground">salary bump."</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <Cloud className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">Demand for cloud professionals is surging</p>
                <p className="text-2xl font-bold text-orange">$12.7B</p>
                <p className="text-muted-foreground">investment in cloud infrastructure in India</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">AWS customer base growth</p>
                <p className="text-2xl font-bold text-orange">357%</p>
                <p className="text-muted-foreground">increase since 2020</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-orange/20 hover:shadow-lg transition-all">
              <CardContent className="space-y-4 p-0">
                <div className="w-12 h-12 mx-auto bg-orange/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange" />
                </div>
                <p className="text-muted-foreground">Full-time AWS jobs annually by 2030</p>
                <p className="text-2xl font-bold text-orange">131,700</p>
                <p className="text-muted-foreground">careers available</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Course Highlights */}
      <section className="py-12 bg-gradient-to-br from-muted/30 to-sky/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            AI-Enhanced DevOps & AWS Course Highlights
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-16">
            Applications Open for New Cohort | Limited Scholarships Available
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-all bg-card/50 backdrop-blur-sm">
                  <CardContent className="space-y-4 p-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
                        <p className="text-muted-foreground">{highlight.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Schedule & Format Section */}
      <section className="py-16 bg-gradient-to-br from-violet/5 via-indigo/5 to-emerald/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Schedule & Format
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Designed for working professionals with flexible learning options and comprehensive support
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* Main Info Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Next Cohort Card */}
              <Card className="group relative overflow-hidden border-2 border-violet/20 bg-gradient-to-br from-violet/10 to-violet/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet to-indigo rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Next Cohort</h3>
                  <p className="text-2xl font-bold text-violet mb-1">18th Sep 2025</p>
                  <p className="text-sm text-muted-foreground">Registration Open</p>
                </CardContent>
              </Card>

              {/* Live Classes Card */}
              <Card className="group relative overflow-hidden border-2 border-emerald/20 bg-gradient-to-br from-emerald/10 to-emerald/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald to-teal rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Live Classes</h3>
                  <p className="text-lg font-bold text-emerald mb-1">Mon-Fri</p>
                  <p className="text-sm text-muted-foreground">8:30–10:00 AM IST</p>
                </CardContent>
              </Card>

              {/* Hands-on Labs Card */}
              <Card className="group relative overflow-hidden border-2 border-orange/20 bg-gradient-to-br from-orange/10 to-orange/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange to-amber rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Hands-on Labs</h3>
                  <p className="text-lg font-bold text-orange mb-1">Saturday</p>
                  <p className="text-sm text-muted-foreground">8-10 PM IST</p>
                </CardContent>
              </Card>
            </div>

            {/* Support Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Recordings Available Card */}
              <Card className="group relative overflow-hidden border-2 border-sky/20 bg-gradient-to-br from-sky/10 to-sky/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky to-blue rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">Recordings Available</h3>
                      <p className="text-muted-foreground">Access all session recordings anytime</p>
                      <div className="mt-2">
                        <Badge variant="outline" className="border-sky text-sky bg-sky/10">
                          + WhatsApp Community
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TA Support Card */}
              <Card className="group relative overflow-hidden border-2 border-rose/20 bg-gradient-to-br from-rose/10 to-rose/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rose to-pink rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">TA Support</h3>
                      <p className="text-muted-foreground">Dedicated Teaching Assistant support</p>
                      <div className="mt-2">
                        <Badge variant="outline" className="border-rose text-rose bg-rose/10">
                          24-hr SLA
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Special Focus Highlight */}
            <Card className="bg-gradient-to-r from-violet/10 via-indigo/10 to-emerald/10 border-2 border-violet/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet/5 via-transparent to-emerald/5"></div>
              <CardContent className="p-8 relative z-10">
                <div className="text-center">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <Zap className="h-6 w-6 text-violet" />
                    <h3 className="text-2xl font-bold text-foreground">Special Focus on AI Integration</h3>
                    <Zap className="h-6 w-6 text-violet" />
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Learn to build and deploy <span className="font-bold text-violet px-2 py-1 bg-violet/10 rounded-md">AI Agents</span>, 
                    create powerful <span className="font-bold text-emerald px-2 py-1 bg-emerald/10 rounded-md">AI Automations</span>, 
                    and design efficient <span className="font-bold text-orange px-2 py-1 bg-orange/10 rounded-md">Vibe Coding</span> in every module
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Career Level Up */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-foreground">
              About Career Level Up
            </h2>
            <div className="bg-card rounded-2xl p-8 shadow-elegant border">
              <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                <strong className="text-foreground">Career Level Up</strong> is a flagship product from <span className="text-primary font-semibold">Rise n Shine Technologies</span>, designed to help students and professionals automate their job-hunting journey.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                With <span className="text-primary font-semibold">19+ years of training & IT experience</span>, Rise n Shine empowers job seekers with tools, AI automation, and proven strategies to land their dream careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Comprehensive Curriculum
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {curriculumLevels.map((level, index) => {
                const levelColorClasses = [
                  { bg: 'from-rose/10 to-pink/5', border: 'border-rose/20', text: 'text-rose' },
                  { bg: 'from-orange/10 to-amber/5', border: 'border-orange/20', text: 'text-orange' },
                  { bg: 'from-emerald/10 to-teal/5', border: 'border-emerald/20', text: 'text-emerald' },
                  { bg: 'from-sky/10 to-cyan/5', border: 'border-sky/20', text: 'text-sky' },
                  { bg: 'from-violet/10 to-purple/5', border: 'border-violet/20', text: 'text-violet' },
                  { bg: 'from-indigo/10 to-blue/5', border: 'border-indigo/20', text: 'text-indigo' }
                ];
                const colorScheme = levelColorClasses[index] || levelColorClasses[0]; // Fallback to first color if index out of bounds
                return (
                  <AccordionItem key={index} value={`level-${index}`} className={`bg-gradient-to-r ${colorScheme.bg} rounded-lg border-2 ${colorScheme.border} hover:shadow-lg transition-all`}>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <span className={`text-lg font-semibold text-left ${colorScheme.text}`}>{level.level}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <p className="text-muted-foreground">{level.topics}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 bg-gradient-to-br from-muted/30 to-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Capstone Projects You'll Build
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {projects.map((project, index) => {
              const projectColorClasses = [
                { gradient: 'from-orange to-amber', bg: 'from-orange/5 to-amber/5', border: 'border-orange/20' },
                { gradient: 'from-sky to-cyan', bg: 'from-sky/5 to-cyan/5', border: 'border-sky/20' },
                { gradient: 'from-violet to-purple', bg: 'from-violet/5 to-purple/5', border: 'border-violet/20' }
              ];
              const colorClass = projectColorClasses[index];
              return (
                <Card 
                  key={project.id}
                  className={`hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br ${colorClass.bg} border-2 ${colorClass.border}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className={`w-full h-2 rounded-full bg-gradient-to-r ${colorClass.gradient} mb-4`}></div>
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="text-muted-foreground">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* YouTube Playlist Section */}
      <section className="py-16 bg-gradient-to-br from-red/5 via-orange/5 to-amber/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red to-orange text-white px-6 py-2 rounded-full font-semibold mb-6">
              <Youtube className="h-5 w-5" />
              FREE DevOps Master Course
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Complete DevOps Learning Path
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Subscribe to our YouTube channel and get access to comprehensive DevOps tutorials covering everything from basics to advanced concepts
            </p>

            {/* Highlighted Topics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-br from-blue/10 to-cyan/10 border border-blue/20 rounded-lg p-4">
                <div className="w-12 h-12 bg-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Code className="h-6 w-6 text-blue" />
                </div>
                <h3 className="font-semibold text-blue text-sm">Linux Mastery</h3>
              </div>
              
              <div className="bg-gradient-to-br from-emerald/10 to-teal/10 border border-emerald/20 rounded-lg p-4">
                <div className="w-12 h-12 bg-emerald/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Terminal className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="font-semibold text-emerald text-sm">Shell Scripting</h3>
              </div>

              <div className="bg-gradient-to-br from-yellow/10 to-orange/10 border border-yellow/20 rounded-lg p-4">
                <div className="w-12 h-12 bg-yellow/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-yellow-600 text-sm">Python</h3>
              </div>
              
              <div className="bg-gradient-to-br from-orange/10 to-amber/10 border border-orange/20 rounded-lg p-4">
                <div className="w-12 h-12 bg-orange/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Cloud className="h-6 w-6 text-orange" />
                </div>
                <h3 className="font-semibold text-orange text-sm">AWS Cloud</h3>
              </div>
              
              <div className="bg-gradient-to-br from-violet/10 to-purple/10 border border-violet/20 rounded-lg p-4">
                <div className="w-12 h-12 bg-violet/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Cpu className="h-6 w-6 text-violet" />
                </div>
                <h3 className="font-semibold text-violet text-sm">DevOps Tools</h3>
              </div>
            </div>

            {/* Subscribe CTA */}
            <div className="text-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-red to-orange hover:from-red-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => window.open('https://youtube.com/@RisenShineTechnologies?sub_confirmation=1', '_blank')}
              >
                <Youtube className="mr-3 h-6 w-6" />
                Subscribe Now for FREE Access
                <ExternalLink className="ml-3 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Join 50K+ DevOps learners • New videos every week • 100% FREE content
              </p>
            </div>
          </div>

          {/* YouTube Playlists Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Playlist 1 - Linux Fundamentals */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue/5 to-cyan/10 border-2 border-blue/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FJdJd3IKdiM4Om1hGo2Hsdt', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue to-cyan p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Code className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Linux Fundamentals</h3>
                        <p className="text-blue-100 text-sm">Complete Linux course from basics to advanced</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        25+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Master Linux commands, file systems, permissions, and shell scripting essential for DevOps
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist 2 - Shell Scripting */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-emerald/5 to-teal/10 border-2 border-emerald/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FI_MY7HDP6ZnOax0hzavama', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-emerald to-teal p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Terminal className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Shell Scripting Mastery</h3>
                        <p className="text-emerald-100 text-sm">Bash scripting from zero to hero</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        20+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Learn advanced bash scripting, automation, and scripting best practices for DevOps workflows
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist 3 - Python Programming */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-yellow/5 to-orange/10 border-2 border-yellow/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FJQYT5H2BuFSwYmfmKeS57P', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Python Programming</h3>
                        <p className="text-yellow-100 text-sm">Python for DevOps and automation</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        18+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Learn Python programming from basics to advanced concepts for DevOps automation and scripting
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist 4 - AWS Fundamentals */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-orange/5 to-amber/10 border-2 border-orange/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FKok5gI1v4g4S-g-PLaW9YD', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-orange to-amber p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Cloud className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">AWS Cloud Essentials</h3>
                        <p className="text-orange-100 text-sm">Complete AWS services and cloud computing</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        35+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Master AWS core services, IAM, EC2, S3, VPC, and cloud architecture patterns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist 5 - DevOps Tools */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-violet/5 to-purple/10 border-2 border-violet/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FJmEu_f4C4at8hGnUqU5SH4', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-violet to-purple p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Cpu className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">DevOps Tools & CI/CD</h3>
                        <p className="text-violet-100 text-sm">Docker, Kubernetes, Jenkins, and more</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        30+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete DevOps toolchain including Docker, Kubernetes, Jenkins, and CI/CD pipelines
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Playlist 6 - GenAI for OpenAPI */}
            <Card 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-pink/5 to-rose/10 border-2 border-pink/20 overflow-hidden"
              onClick={() => window.open('https://youtube.com/playlist?list=PLxzKY3wu0_FJHA8RGE98-zN8OBcCMcnFh', '_blank')}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <div className="bg-gradient-to-br from-pink to-rose p-8 text-white relative overflow-hidden">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">GenAI for OpenAPI</h3>
                        <p className="text-pink-100 text-sm">AI-powered API development and automation</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4" />
                        15+ Videos
                      </span>
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Watch Now
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Learn to integrate AI with APIs, OpenAPI specifications, and automated API documentation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Student Success Cards */}
      <section className="py-12 bg-gradient-to-br from-emerald/5 to-teal/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Student Success Stories
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-16">
            Real outcomes from our alumni who transformed their careers
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald/5 to-teal/10 border-2 border-emerald/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald mb-2">65%</div>
                  <div className="text-lg font-semibold mb-2">Salary Increase</div>
                  <div className="text-muted-foreground">Priya Singh</div>
                  <div className="text-sm text-muted-foreground">Jr. Developer → DevOps Engineer</div>
                  <div className="text-sm text-orange font-medium mt-2">₹8L → ₹13.2L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange/5 to-amber/10 border-2 border-orange/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange mb-2">65</div>
                  <div className="text-lg font-semibold mb-2">Days to Job</div>
                  <div className="text-muted-foreground">Anjali Patel</div>
                  <div className="text-sm text-muted-foreground">Support Engineer → Cloud DevOps</div>
                  <div className="text-sm text-orange font-medium mt-2">₹5L → ₹12L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-rose/5 to-pink/10 border-2 border-rose/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-rose mb-2">100%</div>
                  <div className="text-lg font-semibold mb-2">Remote Work</div>
                  <div className="text-muted-foreground">Sneha Reddy</div>
                  <div className="text-sm text-muted-foreground">IT Admin → DevOps Architect</div>
                  <div className="text-sm text-orange font-medium mt-2">₹7L → ₹22L</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo/5 to-blue/10 border-2 border-indigo/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo mb-2">90</div>
                  <div className="text-lg font-semibold mb-2">Days Training</div>
                  <div className="text-muted-foreground">Arjun Gupta</div>
                  <div className="text-sm text-muted-foreground">Network Engineer → AI-DevOps</div>
                  <div className="text-sm text-orange font-medium mt-2">₹9L → ₹16L</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bonuses Section */}
      <section className="py-12 bg-gradient-to-br from-orange/5 to-amber/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Exclusive Bonuses Worth ₹10,000+
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-16">
            Get these premium resources absolutely FREE with your enrollment
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange/5 to-amber/10 border-2 border-orange/20">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code className="h-6 w-6 text-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">GitHub Copilot & Cursor Cheat Sheets</h3>
                    <p className="text-muted-foreground">Complete reference guides for AI-powered coding with shortcuts, best practices, and advanced techniques</p>
                    <Badge className="mt-2 bg-orange/10 text-orange">Worth ₹2,000</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet/5 to-indigo/10 border-2 border-violet/20">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-violet/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cpu className="h-6 w-6 text-violet" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AWS PartyRock Mini-Build Templates</h3>
                    <p className="text-muted-foreground">Ready-to-use templates for building AI applications on AWS with step-by-step implementation guides</p>
                    <Badge className="mt-2 bg-violet/10 text-violet">Worth ₹3,000</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald/5 to-teal/10 border-2 border-emerald/20">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-emerald" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">1000+ Prompts for Developers</h3>
                    <p className="text-muted-foreground">Comprehensive collection of AI prompts for coding, debugging, documentation, and system design</p>
                    <Badge className="mt-2 bg-emerald/10 text-emerald">Worth ₹3,500</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-sky/5 to-indigo/10 border-2 border-sky/20">
              <CardContent className="space-y-4 p-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-sky" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">AWS AI Practitioner Exam Blueprint</h3>
                    <p className="text-muted-foreground">Complete study guide and practice tests for AWS AI certification with insider tips and strategies</p>
                    <Badge className="mt-2 bg-sky/10 text-sky">Worth ₹2,500</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange to-amber text-white px-6 py-3 rounded-full font-semibold">
              <Gift className="h-5 w-5" />
              Total Bonus Value: ₹11,000 - Yours FREE!
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            What Our Alumni Say
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-card/80 to-muted/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange text-2xl mb-4">"</div>
                <p className="text-muted-foreground italic">
                  "The AI integration in this program is incredible! Learning GitHub Copilot and Cursor transformed my coding speed by 300%. I went from struggling with basic DevOps to building AI-powered infrastructures. Best investment ever!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald" />
                  </div>
                  <div>
                    <p className="font-semibold">Priya Singh</p>
                    <p className="text-sm text-muted-foreground">DevOps Engineer at Infosys</p>
                    <p className="text-sm text-orange">₹8L → ₹13.2L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-card/80 to-muted/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange text-2xl mb-4">"</div>
                <p className="text-muted-foreground italic">
                  "The placement support is outstanding! They didn't just teach me DevOps, they prepared my entire portfolio, optimized my LinkedIn, and I got 3 job offers within 45 days of completing the program."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-violet" />
                  </div>
                  <div>
                    <p className="font-semibold">Rahul Kumar</p>
                    <p className="text-sm text-muted-foreground">AI-DevOps Lead at TCS</p>
                    <p className="text-sm text-orange">₹6L → ₹18L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-card/80 to-muted/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange text-2xl mb-4">"</div>
                <p className="text-muted-foreground italic">
                  "As a fresher, I was worried about competing with experienced developers. But the AI-enhanced learning approach and hands-on projects gave me confidence. Now I'm earning ₹15L as a Senior DevOps Engineer!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-sky" />
                  </div>
                  <div>
                    <p className="font-semibold">Vikram Sharma</p>
                    <p className="text-sm text-muted-foreground">Senior DevOps at Accenture</p>
                    <p className="text-sm text-orange">Fresher → ₹15L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all bg-gradient-to-br from-card/80 to-muted/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-orange text-2xl mb-4">"</div>
                <p className="text-muted-foreground italic">
                  "The future is AI + DevOps, and this program nailed it! Learning to build AI agents for infrastructure monitoring and automated deployments set me apart from other candidates. Remote work at ₹22L - dream come true!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose/20 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-rose" />
                  </div>
                  <div>
                    <p className="font-semibold">Sneha Reddy</p>
                    <p className="text-sm text-muted-foreground">DevOps Architect at Microsoft</p>
                    <p className="text-sm text-orange">₹7L → ₹22L Remote</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Investment in Your Future
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan A: Course Only */}
            <Card className="relative p-8 border-2 border-primary/20">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="text-xs">
                  {plan1Seats}/25 seats filled
                </Badge>
              </div>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl mb-4 text-primary">Plan A: Course Only</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-muted-foreground line-through">₹25,000</span>
                  </div>
                  <div className="text-4xl font-bold text-primary">₹20,000</div>
                  <p className="text-sm font-medium text-emerald">Early Bird Price</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Includes:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      Full curriculum with AI focus
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      2 capstone projects
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      Weekly hands-on labs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      WhatsApp community access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      Office hours with instructors
                    </li>
                  </ul>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white"
                  onClick={handleEnrollment}
                >
                  Enroll in Course Only
                </Button>
              </CardContent>
            </Card>

            {/* Plan B: Placement Package */}
            <Card className="relative border-2 border-emerald bg-gradient-to-br from-emerald/5 to-teal/5 p-8">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-emerald to-teal text-white px-4 py-1">Most Popular</Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="outline" className="text-xs border-emerald text-emerald">
                  {plan2Seats}/10 seats filled
                </Badge>
              </div>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl mb-4 text-emerald">Plan B: Placement Package</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-muted-foreground line-through">₹35,000</span>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald to-teal bg-clip-text text-transparent">₹30,000</div>
                  <p className="text-sm font-medium text-emerald">Early Bird Price</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Everything in Course Only +</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      Resume revamp & optimization
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      LinkedIn profile enhancement
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      GitHub portfolio optimization  
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      4 comprehensive mock interviews
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald" />
                      Job tracker & application toolkit
                    </li>
                  </ul>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald text-white"
                  onClick={handleEnrollment}
                >
                  Get Placement Package
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Upgrade Note */}
          <div className="mt-12 max-w-3xl mx-auto">
            <Card className="p-6 bg-gradient-to-r from-sky/5 to-indigo/5 border border-sky/20">
              <CardContent className="p-0 text-center">
                <p className="text-muted-foreground">
                  <span className="text-lg">👉</span> <strong>Start with Course Only</strong>, upgrade to Placement Package within 14 days by paying just the difference
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Early Access Benefit */}
      <section className="py-16 bg-gradient-to-r from-violet/10 via-indigo/10 to-purple/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-violet to-indigo bg-clip-text text-transparent mb-4">
              <Gift className="w-12 h-12 mx-auto mb-4 text-violet" />
              <h2 className="text-3xl md:text-4xl font-bold">
                🎁 Exclusive Early Access Benefit
              </h2>
              <div className="text-red-600 font-bold text-lg mt-4">
                ⏰ Hurry! Only {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} minutes left!
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-violet/20 p-8 md:p-12 mt-8">
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Enroll Now & Start Your Journey Today!
                </h3>
                
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Don't wait for the cohort to begin. <strong className="text-violet">Enroll today</strong> and get 
                  <strong className="text-emerald"> immediate access</strong> to all prerequisite courses and materials.
                </p>

                {/* Combined Exclusive Bonus Board */}
                <div className="bg-gradient-to-r from-violet/10 to-indigo/10 rounded-xl p-6 border-2 border-violet/20 mt-8">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-violet font-bold text-xl">
                      <BookOpen className="w-6 h-6" />
                      <span>🎁 EXCLUSIVE BONUS COURSES 🎁</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-4">
                      Get immediate access to these prerequisite courses:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-white/70 rounded-lg p-4 border border-violet/20">
                        <BookOpen className="w-6 h-6 text-violet mb-2 mx-auto" />
                        <div className="text-sm font-medium text-foreground">Linux & Git Fundamentals</div>
                        <div className="text-xs text-muted-foreground">Master the basics before day 1</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-emerald/20">
                        <Code className="w-6 h-6 text-emerald mb-2 mx-auto" />
                        <div className="text-sm font-medium text-foreground">Python Essentials</div>
                        <div className="text-xs text-muted-foreground">Get comfortable with scripting</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-4 border border-orange/20">
                        <Cloud className="w-6 h-6 text-orange mb-2 mx-auto" />
                        <div className="text-sm font-medium text-foreground">AWS Basics</div>
                        <div className="text-xs text-muted-foreground">Understand cloud fundamentals</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JobHunter Free Access */}
                <div className="bg-gradient-to-r from-emerald/10 to-teal/10 rounded-xl p-6 border-2 border-emerald/20 mt-8">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xl">
                      <Trophy className="w-6 h-6" />
                      <span>🎁 EXCLUSIVE BONUS 🎁</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      Get <span className="text-emerald-600">JobHunter 1-Year Plan FREE</span> with your enrollment!
                    </p>
                    <div className="bg-white/70 rounded-lg p-4 border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-600">Worth ₹12,000</div>
                      <p className="text-sm text-muted-foreground">Complete job hunting automation platform</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-success/10 to-emerald/10 rounded-xl p-6 border-2 border-success/20 mt-8">
                  <div className="flex items-center justify-center gap-3 text-success font-semibold text-lg">
                    <Timer className="w-6 h-6" />
                    <span>Start Today → Be Ahead → Excel in Cohort → Land Dream Job</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-violet to-indigo hover:from-indigo hover:to-violet text-white px-8 py-4 text-lg font-semibold shadow-lg"
                    onClick={handleEnrollment}
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Enroll Now & Start Today
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-violet text-violet hover:bg-violet/10 px-8 py-4 text-lg font-semibold"
                    onClick={() => setIsCallbackDialogOpen(true)}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Get More Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 bg-gradient-to-br from-muted/30 to-sky/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="bg-card rounded-lg border">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 bg-gradient-to-r from-emerald to-teal text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-white/90">
              Join the next generation of AI-powered DevOps professionals
            </p>
            
            {/* Next Cohort Highlight */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-1">🚀 Next Cohort</p>
                <p className="text-2xl font-bold text-white">Starts on 18th Sept 2025</p>
                <p className="text-lg font-medium text-white/80">at 8:30AM IST</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-emerald hover:bg-white/90 font-semibold px-8 py-3"
                onClick={handleEnrollment}
              >
                Enroll Now - Save ₹5,000
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white bg-white/10 text-white hover:bg-white hover:text-emerald backdrop-blur-sm px-8 py-3"
                onClick={() => setIsCallbackDialogOpen(true)}
              >
                <Phone className="mr-2 h-5 w-5" />
                Get a Callback
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-orange to-amber text-white shadow-2xl border-t">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-sm sm:text-base">
                🚀 Join Now — Early Bird ₹5,000 Off | Limited to First 25 Seats
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
              <span className="text-white/60">•</span>
              <a href="/terms-of-service" className="hover:underline">Terms</a>
              <span className="text-white/60">•</span>
              <a href="/contact" className="hover:underline">Contact</a>
            </div>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for sticky footer */}
      <div className="h-16"></div>

      {/* Callback Survey Dialog */}
      <Dialog open={isCallbackDialogOpen} onOpenChange={setIsCallbackDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>Get a Callback - Fill the Survey</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <iframe 
              src="https://app.risenshinetechnologies.com/widget/survey/Sc79wJpTEJecg4RKmXwp" 
              style={{
                border: "none",
                width: "100%",
                height: "700px",
                minHeight: "600px"
              }}
              scrolling="yes" 
              id="Sc79wJpTEJecg4RKmXwp" 
              title="survey"
              className="rounded-lg border border-border"
            />
            <script src="https://app.risenshinetechnologies.com/js/form_embed.js"></script>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Curriculum Dialog */}
      <Dialog open={isCurriculumDialogOpen} onOpenChange={setIsCurriculumDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle>Download Curriculum - Fill the Form</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <iframe
              src="https://app.risenshinetechnologies.com/widget/form/HOAiVP9Rs5P8XqcKn6p0"
              style={{
                width: "100%",
                height: "432px",
                border: "none",
                borderRadius: "3px"
              }}
              id="inline-HOAiVP9Rs5P8XqcKn6p0"
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Form - Download Curriculum for AI DevOps with AWS"
              data-height="432"
              data-layout-iframe-id="inline-HOAiVP9Rs5P8XqcKn6p0"
              data-form-id="HOAiVP9Rs5P8XqcKn6p0"
              title="Form - Download Curriculum for AI DevOps with AWS"
              className="rounded-lg border border-border"
            />
            <script src="https://app.risenshinetechnologies.com/js/form_embed.js"></script>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareerLevelUp;