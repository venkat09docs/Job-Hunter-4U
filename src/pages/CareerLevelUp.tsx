import { useState, useEffect } from "react";
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
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/devops-aws-ai-hero.jpg";

const CareerLevelUp = () => {
  const { user } = useAuth();
  
  // Dynamic seat counts
  const [plan1Seats] = useState(17); // 17 out of 25 seats filled
  const [plan2Seats] = useState(7);  // 7 out of 10 seats filled

  // Timer state
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  // Callback dialog state
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);

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
      <Navigation />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange to-amber text-white py-3 text-center font-medium">
        Limited Scholarships Available | Admissions Open for Next Cohort
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-neutral-50 to-sky/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <p className="text-lg text-muted-foreground">Land your Premium Tech Job with</p>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                <span className="bg-gradient-to-r from-indigo to-violet bg-clip-text text-transparent">AI-Enhanced</span> DevOps & AWS Bootcamp
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground">
                Become an in-demand DevOps engineer mastering <strong className="text-violet">AI Agents</strong>, 
                <strong className="text-emerald"> AI Automations</strong>, and <strong className="text-orange">Vibe Coding</strong>
                <br />
                <strong>leveraging the power of GenAI</strong>
              </p>

              {/* Duration Badges */}
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="px-4 py-2 text-base border-orange bg-orange/10 text-orange">
                  <Calendar className="h-4 w-4 mr-2" />
                  10 weeks Full-time
                </Badge>
                <Badge variant="outline" className="px-4 py-2 text-base border-emerald bg-emerald/10 text-emerald">
                  <Zap className="h-4 w-4 mr-2" />
                  Live Online
                </Badge>
              </div>

              {/* Next Cohort Highlight */}
              <div className="bg-gradient-to-r from-violet/10 to-indigo/10 rounded-lg p-6 border-2 border-violet/20">
                <div className="text-center space-y-4">
                  <p className="text-lg font-semibold text-violet mb-1">🚀 Next Cohort</p>
                  <p className="text-2xl font-bold text-foreground">Starts on 18th Sept 2025</p>
                  <p className="text-lg font-medium text-muted-foreground">at 8:30AM IST</p>
                  
                  {/* CTA Buttons inside the board */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald text-white px-6 py-2 text-base font-semibold shadow-lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Curriculum
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-violet text-violet hover:bg-violet/10 px-6 py-2 text-base font-semibold"
                      onClick={() => setIsCallbackDialogOpen(true)}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Get a Callback
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="DevOps AWS AI Hero" 
                  className="w-full h-auto"
                />
                {/* AI Tool Logos Overlay */}
                <div className="absolute top-4 right-4 space-y-2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <span className="text-sm font-semibold text-orange">AWS</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <span className="text-sm font-semibold text-violet">Kubernetes</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <span className="text-sm font-semibold text-emerald">AI Agents</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <span className="text-sm font-semibold text-sky">Vibe Coding</span>
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
      <section className="py-12 bg-gradient-to-br from-violet/5 to-indigo/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Schedule & Format
          </h2>
          <p className="text-center text-lg text-muted-foreground mb-16">
            Designed for working professionals with flexible learning options
          </p>
          
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-card/80 to-muted/20 backdrop-blur-sm border-2 border-violet/20">
              <CardContent className="p-0 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet/20 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-violet" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Next Cohort</h4>
                        <p className="text-muted-foreground">18th Sep 2025</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald/20 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-emerald" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Live Classes</h4>
                        <p className="text-muted-foreground">Mon-Fri 8:30–10:00 AM IST</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange/20 rounded-full flex items-center justify-center">
                        <Code className="h-5 w-5 text-orange" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Hands-on Labs</h4>
                        <p className="text-muted-foreground">Sat 8-10 PM IST</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-sky" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Recordings Available</h4>
                        <p className="text-muted-foreground">+ WhatsApp Community</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-rose" />
                      </div>
                      <div>
                        <h4 className="font-semibold">TA Support</h4>
                        <p className="text-muted-foreground">24-hr SLA</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-violet/10 to-indigo/10 rounded-lg border border-violet/20">
                  <h4 className="font-semibold text-center mb-2">Special Focus on AI Integration</h4>
                  <p className="text-center text-muted-foreground">Learn to build and deploy <strong className="text-violet">AI Agents</strong>, create powerful <strong className="text-emerald">AI Automations</strong>, and design efficient <strong className="text-orange">Vibe Coding</strong> in every module</p>
                </div>
              </CardContent>
            </Card>
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
                  <div className="text-sm text-orange font-medium mt-2">₹8L → ₹13.2L at Infosys</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-violet/5 to-indigo/10 border-2 border-violet/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-violet mb-2">3</div>
                  <div className="text-lg font-semibold mb-2">Job Offers</div>
                  <div className="text-muted-foreground">Rahul Kumar</div>
                  <div className="text-sm text-muted-foreground">Manual Tester → AI-DevOps Lead</div>
                  <div className="text-sm text-orange font-medium mt-2">₹6L → ₹18L at TCS</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange/5 to-amber/10 border-2 border-orange/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange mb-2">45</div>
                  <div className="text-lg font-semibold mb-2">Days to Job</div>
                  <div className="text-muted-foreground">Anjali Patel</div>
                  <div className="text-sm text-muted-foreground">Support Engineer → Cloud DevOps</div>
                  <div className="text-sm text-orange font-medium mt-2">₹5L → ₹12L at Wipro</div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-sky/5 to-cyan/10 border-2 border-sky/20">
              <CardContent className="space-y-4 p-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-sky mb-2">2x</div>
                  <div className="text-lg font-semibold mb-2">Career Growth</div>
                  <div className="text-muted-foreground">Vikram Sharma</div>
                  <div className="text-sm text-muted-foreground">Fresher → Senior DevOps</div>
                  <div className="text-sm text-orange font-medium mt-2">₹0 → ₹15L at Accenture</div>
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
                  <div className="text-sm text-orange font-medium mt-2">₹7L → ₹22L at Microsoft</div>
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
                  <div className="text-sm text-orange font-medium mt-2">₹9L → ₹16L at Capgemini</div>
                </div>
              </CardContent>
            </Card>
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
            
            {/* Limited Time Offer Timer */}
            <Card className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-2 border-red-500/20 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="h-5 w-5 text-red-500" />
                  <span className="font-semibold text-red-500">Limited Time Offer</span>
                </div>
                <div className="text-2xl font-bold text-red-500 mb-2">{formatTime(timeLeft)}</div>
                <div className="text-sm text-muted-foreground mb-3">Enroll now to get</div>
                <div className="bg-gradient-to-r from-emerald to-teal text-white px-4 py-2 rounded-lg font-semibold text-sm">
                  Job Hunter 1 Year Plan FREE
                  <div className="text-xs opacity-90">(Worth ₹12,000)</div>
                </div>
                <Button className="mt-3 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1">
                  View Job Hunter Pricing <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </Card>
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
                <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white">
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
                <Button className="w-full bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald text-white">
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
              >
                Enroll Now - Save ₹5,000
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm px-8 py-3"
              >
                <Phone className="mr-2 h-5 w-5" />
                Schedule a Call
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Get a Callback - Fill the Survey</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            <iframe 
              src="https://app.risenshinetechnologies.com/widget/survey/Sc79wJpTEJecg4RKmXwp" 
              style={{
                border: "none",
                width: "100%",
                height: "500px",
                minHeight: "500px"
              }}
              scrolling="no" 
              id="Sc79wJpTEJecg4RKmXwp" 
              title="survey"
              className="rounded-lg"
            />
            <script src="https://app.risenshinetechnologies.com/js/form_embed.js"></script>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CareerLevelUp;