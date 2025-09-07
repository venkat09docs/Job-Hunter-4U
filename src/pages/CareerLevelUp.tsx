import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  Target, 
  Trophy, 
  Star, 
  Building, 
  Award,
  Flame,
  Rocket,
  Globe,
  Bot,
  Code,
  Server,
  Database,
  GitBranch,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  BookOpen,
  MessageCircle,
  Phone,
  User,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

const CareerLevelUp = () => {
  const { user } = useAuth();
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const techBadges = [
    { name: "AWS", icon: Server, color: "bg-orange/20 text-orange border-orange/30" },
    { name: "Kubernetes", icon: Building, color: "bg-sky/20 text-sky border-sky/30" },
    { name: "GitHub", icon: GitBranch, color: "bg-violet/20 text-violet border-violet/30" },
    { name: "AI", icon: Bot, color: "bg-emerald/20 text-emerald border-emerald/30" }
  ];

  const targetAudience = [
    {
      icon: Rocket,
      title: "Final year students & freshers",
      description: "Launch your tech career with in-demand skills",
      gradient: "from-rose to-pink",
      iconBg: "bg-rose/20",
      iconColor: "text-rose"
    },
    {
      icon: Globe,
      title: "IT professionals switching to DevOps & Cloud",
      description: "Transition to high-growth cloud technologies",
      gradient: "from-cyan to-sky",
      iconBg: "bg-cyan/20",
      iconColor: "text-cyan"
    },
    {
      icon: Bot,
      title: "DevOps engineers upskilling with GenAI",
      description: "Stay ahead with AI-powered automation",
      gradient: "from-lime to-emerald",
      iconBg: "bg-lime/20",
      iconColor: "text-lime"
    }
  ];

  const outcomes = [
    {
      title: "Build & deploy AI-powered apps on AWS",
      description: "Create scalable applications using cloud-native services"
    },
    {
      title: "Automate Kubernetes troubleshooting with AI",
      description: "Use AI tools to diagnose and fix cluster issues"
    },
    {
      title: "Ship 2 Capstone Projects + Job-ready Portfolio",
      description: "Showcase real-world projects to potential employers"
    },
    {
      title: "Crack interviews with Placement Toolkit",
      description: "Get comprehensive interview preparation and job support"
    }
  ];

  const curriculumLevels = [
    {
      level: "Level 1 – Foundations",
      topics: "Linux, Git, Python, Docker, AWS Basics (IAM/EC2/S3/VPC), CI/CD concepts, GenAI intro"
    },
    {
      level: "Level 2 – AI for Devs/DevOps",
      topics: "GitHub Copilot, Cursor, Amazon Q, automated docs/tests"
    },
    {
      level: "Level 3 – Cloud GenAI on AWS",
      topics: "Bedrock, SageMaker/Rekognition, CDK/Terraform workflows"
    },
    {
      level: "Level 4 – Kubernetes + AIOps",
      topics: "K8s essentials, K8sGPT diagnostics, PromptOps pipelines, Grafana/Prometheus"
    },
    {
      level: "Level 5 – Capstones & Job Readiness",
      topics: "Choose 2 capstones (AI SaaS on AWS / Secure CI/CD with AI Chatbot / Database Agent), portfolio showcase, mock interviews"
    }
  ];

  const projects = [
    {
      id: "ai-saas",
      title: "AI SaaS on AWS",
      description: "End-to-end SaaS with auth + billing",
      tech: ["AWS", "React", "Stripe", "AI"],
      gradient: "from-orange to-amber",
      borderColor: "border-orange/20"
    },
    {
      id: "k8sgpt",
      title: "K8sGPT AIOps",
      description: "AI-powered cluster troubleshooting",
      tech: ["Kubernetes", "AI", "Monitoring"],
      gradient: "from-sky to-cyan",
      borderColor: "border-sky/20"
    },
    {
      id: "cicd",
      title: "Secure CI/CD Pipeline",
      description: "AI chatbot with Jenkins, Docker, EC2",
      tech: ["Jenkins", "Docker", "AWS", "AI"],
      gradient: "from-violet to-purple",
      borderColor: "border-violet/20"
    },
    {
      id: "partyrock",
      title: "PartyRock Explainer",
      description: "AI-powered cloud learning app",
      tech: ["AWS", "PartyRock", "Education"],
      gradient: "from-emerald to-teal",
      borderColor: "border-emerald/20"
    },
    {
      id: "database-agent",
      title: "Database Agent",
      description: "Natural language queries on Postgres",
      tech: ["PostgreSQL", "NLP", "AI"],
      gradient: "from-pink to-rose",
      borderColor: "border-pink/20"
    },
    {
      id: "portfolio",
      title: "Portfolio Project",
      description: "Choose your own DevOps+AI build",
      tech: ["Custom", "DevOps", "AI"],
      gradient: "from-indigo to-violet",
      borderColor: "border-indigo/20"
    }
  ];

  const bonuses = [
    "GitHub Copilot & Cursor cheatsheets",
    "AWS PartyRock mini-build templates",
    "Bedrock cost calculator",
    "AWS AI Practitioner exam blueprint"
  ];

  const faqs = [
    {
      question: "Prerequisites?",
      answer: "Basic coding knowledge is helpful but not required. We'll start from fundamentals."
    },
    {
      question: "Tools provided?",
      answer: "AWS Free Tier, GitHub, Docker, VS Code - all tools and resources included."
    },
    {
      question: "Job Guarantee?",
      answer: "Comprehensive placement support with resume optimization, GitHub/LinkedIn enhancement, and job board strategies."
    },
    {
      question: "Refund policy?",
      answer: "30-day money-back guarantee if you're not satisfied with the program quality."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-orange to-rose text-white py-3 text-center animate-pulse">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-5 w-5 text-amber" />
          <span className="font-semibold">Early Bird Discount — Save ₹5,000 | Limited Seats!</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo via-violet to-purple text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-40 h-40 border border-white/20 rounded-full"></div>
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-16">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Master DevOps & AWS with AI
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-white/90">
                From Zero to Job-Ready
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-lg text-white/80">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  10-week cohort
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Evening classes
                </span>
                <span className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Hands-on labs
                </span>
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Capstone portfolio
                </span>
              </div>

              {/* Tech Badges */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                {techBadges.map((tech, index) => {
                  const IconComponent = tech.icon;
                  return (
                    <Badge key={index} variant="secondary" className={`${tech.color} backdrop-blur-sm px-4 py-2 font-medium hover:scale-105 transition-transform`}>
                      <IconComponent className="h-4 w-4 mr-2" />
                      {tech.name}
                    </Badge>
                  );
                })}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber to-orange text-white hover:from-orange hover:to-rose font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Enroll Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white text-white hover:bg-gradient-to-r hover:from-cyan/20 hover:to-sky/20 backdrop-blur-sm px-8 py-3 text-lg transition-all"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Syllabus
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-sky/5">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo to-violet bg-clip-text text-transparent">
            Who This Program Is For
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {targetAudience.map((audience, index) => {
              const IconComponent = audience.icon;
              return (
                <Card key={index} className={`bg-gradient-to-br ${audience.gradient}/5 border-2 ${audience.gradient.includes('rose') ? 'border-rose/20' : audience.gradient.includes('cyan') ? 'border-cyan/20' : 'border-lime/20'} hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={`w-16 h-16 mx-auto ${audience.iconBg} rounded-full flex items-center justify-center`}>
                      <IconComponent className={`h-8 w-8 ${audience.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold">{audience.title}</h3>
                    <p className="text-muted-foreground">{audience.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-20 bg-gradient-to-br from-emerald/5 to-teal/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-emerald to-teal bg-clip-text text-transparent">
            What You'll Achieve
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {outcomes.map((outcome, index) => {
              const colors = ['emerald', 'sky', 'violet', 'orange'];
              const color = colors[index % colors.length];
              return (
                <Card key={index} className={`p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-${color}/20 bg-gradient-to-br from-${color}/5 to-white`}>
                  <CardContent className="space-y-4 p-0">
                    <div className="flex items-start gap-4">
                      <CheckCircle className={`h-6 w-6 text-${color} mt-1 flex-shrink-0`} />
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{outcome.title}</h3>
                        <p className="text-muted-foreground">{outcome.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-gradient-to-br from-violet/5 to-purple/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-violet to-purple bg-clip-text text-transparent">
            Curriculum by Level
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {curriculumLevels.map((level, index) => {
                const levelColors = [
                  { bg: 'from-rose/10 to-pink/5', border: 'border-rose/20', text: 'text-rose' },
                  { bg: 'from-orange/10 to-amber/5', border: 'border-orange/20', text: 'text-orange' },
                  { bg: 'from-emerald/10 to-teal/5', border: 'border-emerald/20', text: 'text-emerald' },
                  { bg: 'from-sky/10 to-cyan/5', border: 'border-sky/20', text: 'text-sky' },
                  { bg: 'from-violet/10 to-purple/5', border: 'border-violet/20', text: 'text-violet' }
                ];
                const colorScheme = levelColors[index];
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

      {/* Projects Gallery */}
      <section className="py-20 bg-gradient-to-br from-slate/2 to-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo to-purple bg-clip-text text-transparent">
            Projects You'll Build
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {projects.map((project) => (
              <Card 
                key={project.id}
                className={`hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 bg-gradient-to-br ${project.gradient}/5 border-2 ${project.borderColor} hover:border-opacity-50`}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-full h-2 rounded-full bg-gradient-to-r ${project.gradient} mb-4`}></div>
                  <h3 className={`text-xl font-semibold bg-gradient-to-r ${project.gradient} bg-clip-text text-transparent`}>{project.title}</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, index) => {
                      const techColors = {
                        'AWS': 'bg-orange/20 text-orange',
                        'React': 'bg-sky/20 text-sky',
                        'Kubernetes': 'bg-violet/20 text-violet',
                        'AI': 'bg-emerald/20 text-emerald',
                        'Docker': 'bg-cyan/20 text-cyan',
                        'PostgreSQL': 'bg-indigo/20 text-indigo'
                      };
                      return (
                        <Badge key={index} variant="secondary" className={`text-xs ${techColors[tech as keyof typeof techColors] || 'bg-neutral/20 text-neutral-700'}`}>
                          {tech}
                        </Badge>
                      );
                    })}
                  </div>
                  {hoveredProject === project.id && (
                    <div className="animate-fade-in">
                      <Button variant="outline" size="sm" className={`w-full border-2 ${project.borderColor} hover:bg-gradient-to-r ${project.gradient}/10`}>
                        <Play className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Choose Your Plan
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Course Only</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-muted-foreground line-through">₹25,000</span>
                  </div>
                  <div className="text-4xl font-bold text-primary">₹20,000</div>
                  <p className="text-sm text-muted-foreground">Early Bird Price</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Full curriculum access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    2 capstone projects
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Weekly hands-on labs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Community access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Office hours support
                  </li>
                </ul>
                <Button className="w-full mt-6">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-emerald bg-gradient-to-br from-emerald/5 to-teal/5">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-emerald to-teal text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Placement Package</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-muted-foreground line-through">₹35,000</span>
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald to-teal bg-clip-text text-transparent">₹30,000</div>
                  <p className="text-sm text-muted-foreground">Early Bird Price</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Everything in Course Only +</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Resume revamp & optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    LinkedIn & GitHub optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    4 mock interviews
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Job tracker & application toolkit
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">👉 Start with Course Only, upgrade within 14 days by paying the difference.</p>
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald shadow-lg hover:shadow-xl transition-all">
                  Get Full Package
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bonuses */}
      <section className="py-20 bg-gradient-to-br from-amber/5 to-orange/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-amber to-orange bg-clip-text text-transparent">
            Exclusive Bonuses
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {bonuses.map((bonus, index) => {
              const bonusColors = ['amber', 'orange', 'rose', 'emerald'];
              const color = bonusColors[index % bonusColors.length];
              return (
                <div key={index} className={`flex items-center gap-3 p-4 bg-gradient-to-r from-${color}/10 to-${color}/5 rounded-lg border border-${color}/20 hover:shadow-lg transition-all`}>
                  <Star className={`h-5 w-5 text-${color} flex-shrink-0`} />
                  <span>{bonus}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Schedule & Format
          </h2>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Program Timeline</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Demo: 18th Sep 2025
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Mon-Fri: 8:30–10:00 AM IST (Live Classes)
                    </p>
                    <p className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      Sat: 8-10 PM IST (Hands-on Labs)
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Support & Resources</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      All class recordings available
                    </p>
                    <p className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      WhatsApp community access
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      24-hr TA support SLA
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
            Meet Your Instructor
          </h2>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                9+ years in IT, 2 years as DevOps Engineer, 12 years training experience. 
                Delivered 50+ projects across AWS, Python, DevOps, and AI.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
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
      <section className="py-20 bg-gradient-to-br from-indigo via-violet to-purple text-white relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 border border-cyan/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-emerald/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-32 w-40 h-40 border border-amber/30 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan bg-clip-text text-transparent">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-white/90">
              Join the next generation of AI-powered DevOps professionals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber to-orange hover:from-orange hover:to-rose text-white font-semibold px-8 py-3 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Enroll Now - Save ₹5,000
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-cyan text-cyan hover:bg-gradient-to-r hover:from-cyan/20 hover:to-sky/20 backdrop-blur-sm px-8 py-3 transition-all"
              >
                <Phone className="mr-2 h-5 w-5" />
                Book a Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-rose via-orange to-amber text-white p-4 shadow-2xl z-50 animate-pulse">
        <div className="container mx-auto text-center">
          <p className="font-semibold flex items-center justify-center gap-2">
            <Rocket className="h-5 w-5 text-cyan" />
            Join Now — Early Bird ₹5,000 Off | Limited to First 25 Seats
            <Flame className="h-5 w-5 text-yellow-300" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default CareerLevelUp;