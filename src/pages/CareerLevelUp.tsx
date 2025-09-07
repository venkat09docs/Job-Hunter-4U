import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/devops-aws-ai-hero.jpg";

const CareerLevelUp = () => {
  const { user } = useAuth();

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
      level: "Level 1 – Foundations",
      topics: "Linux, Git, Python, Docker, AWS Basics (IAM/EC2/S3/VPC), CI/CD concepts, GenAI intro"
    },
    {
      level: "Level 2 – AI for Devs/DevOps",
      topics: "AI Agents for code generation, AI Automations for testing, GitHub Copilot, Cursor, Amazon Q"
    },
    {
      level: "Level 3 – Cloud GenAI on AWS",
      topics: "AI Workflows with Bedrock, SageMaker/Rekognition, CDK/Terraform AI Automations"
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
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange to-amber text-white py-3 text-center font-medium">
        Limited Scholarships Available | Admissions Open for Next Cohort
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-neutral-50 to-sky/5 py-16">
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
                <strong className="text-emerald"> AI Automations</strong>, and <strong className="text-orange">AI Workflows</strong>
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

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald to-teal hover:from-teal hover:to-emerald text-white px-8 py-3 text-lg font-semibold shadow-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Curriculum
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-foreground text-foreground hover:bg-muted px-8 py-3 text-lg font-semibold"
                >
                  Get a Callback
                </Button>
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
                    <span className="text-sm font-semibold text-sky">AI Workflows</span>
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
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">9+</div>
              <div className="text-lg text-white/80">Years of<br />excellence</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">500+</div>
              <div className="text-lg text-white/80">Recruitment<br />Partners</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange mb-2">15,000+</div>
              <div className="text-lg text-white/80">Students<br />Placed</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Future Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            The Future Belongs to Those who Master AI
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* Course Highlights */}
      <section className="py-20 bg-gradient-to-br from-muted/30 to-sky/5">
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
      <section className="py-20 bg-gradient-to-br from-violet/5 to-indigo/5">
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
                        <h4 className="font-semibold">Demo Session</h4>
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
                  <p className="text-center text-muted-foreground">Learn to build and deploy <strong className="text-violet">AI Agents</strong>, create powerful <strong className="text-emerald">AI Automations</strong>, and design efficient <strong className="text-orange">AI Workflows</strong> in every module</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-background">
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
                  { bg: 'from-violet/10 to-purple/5', border: 'border-violet/20', text: 'text-violet' }
                ];
                const colorScheme = levelColorClasses[index];
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
      <section className="py-20 bg-gradient-to-br from-muted/30 to-neutral-50">
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

      {/* Pricing */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
            Investment in Your Future
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan A: Course Only */}
            <Card className="relative p-8 border-2 border-primary/20">
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
      <section className="py-20 bg-gradient-to-br from-muted/30 to-sky/5">
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
      <section className="py-20 bg-gradient-to-r from-emerald to-teal text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-white/90">
              Join the next generation of AI-powered DevOps professionals
            </p>
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
    </div>
  );
};

export default CareerLevelUp;