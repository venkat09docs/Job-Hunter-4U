import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CountdownTimer from '@/components/CountdownTimer';
import PricingDialog from '@/components/PricingDialog';
import { 
  CheckCircle, 
  Award, 
  Users, 
  Briefcase, 
  Globe, 
  Code, 
  Zap,
  Cloud,
  GitBranch,
  Database,
  Bot,
  Laptop,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  Star,
  ChevronRight,
  FileText,
  Rocket,
  GraduationCap,
  DollarSign,
  Clock,
  Workflow,
  Box,
  Settings,
  Container,
  MousePointer2,
  Sparkles,
  Server,
  Cpu,
  Network,
  UsersRound,
  AlertTriangle,
  X
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import heroImage from '@/assets/genai-accelerator-hero.jpg';

const GenAICareerAccelerator = () => {
  const [showPricing, setShowPricing] = useState(false);

  const skills = [
    { icon: Cloud, name: 'AWS Cloud', color: 'from-orange-500 to-orange-600' },
    { icon: Settings, name: 'DevOps', color: 'from-blue-500 to-blue-600' },
    { icon: Bot, name: 'LangChain', color: 'from-green-500 to-green-600' },
    { icon: Database, name: 'MLOps', color: 'from-purple-500 to-purple-600' },
    { icon: Code, name: 'Python', color: 'from-yellow-500 to-yellow-600' },
    { icon: Box, name: 'Bedrock', color: 'from-indigo-500 to-indigo-600' },
    { icon: Workflow, name: 'N8N', color: 'from-pink-500 to-pink-600' },
    { icon: Container, name: 'Kubernetes', color: 'from-cyan-500 to-blue-500' },
    { icon: MousePointer2, name: 'Cursor', color: 'from-slate-600 to-gray-700' },
    { icon: Sparkles, name: 'GitHub Copilot', color: 'from-violet-500 to-purple-500' },
    { icon: Server, name: 'MCP Servers', color: 'from-emerald-500 to-green-600' },
    { icon: Cpu, name: 'Ollama', color: 'from-red-500 to-rose-600' },
    { icon: Network, name: 'LangGraph', color: 'from-teal-500 to-cyan-600' },
    { icon: UsersRound, name: 'Crew AI', color: 'from-fuchsia-500 to-pink-600' },
  ];

  const capstoneProjects = [
    { 
      title: 'AI Travel Planner', 
      description: 'Intelligent travel planning with personalized recommendations',
      tech: ['LangChain', 'React', 'AWS'],
      color: 'from-cyan-500 to-blue-600'
    },
    { 
      title: 'RAG PDF Q&A Bot', 
      description: 'Document intelligence with vector databases',
      tech: ['RAG', 'ChromaDB', 'FastAPI'],
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      title: 'Medical RAG Chart Bot', 
      description: 'Healthcare AI assistant with medical chart analysis',
      tech: ['RAG', 'LangChain', 'Medical APIs'],
      color: 'from-rose-500 to-pink-600'
    },
    { 
      title: 'Multi-Agent Research Assistant', 
      description: 'Intelligent research automation with multiple AI agents',
      tech: ['LangGraph', 'OpenAI', 'Supabase'],
      color: 'from-violet-500 to-purple-600'
    },
    { 
      title: 'MLOps Pipeline with SageMaker', 
      description: 'End-to-end ML deployment and monitoring',
      tech: ['SageMaker', 'CI/CD', 'CloudWatch'],
      color: 'from-amber-500 to-orange-600'
    },
    { 
      title: 'SaaS AI Platform', 
      description: 'Full-stack production-ready AI application',
      tech: ['Next.js', 'LangChain', 'Supabase', 'Vercel'],
      color: 'from-indigo-500 to-blue-600'
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'ML Engineer at TechCorp',
      image: 'PS',
      text: 'This program transformed my career! From a fresher to an ML Engineer in just 4 months. The hands-on projects and mentorship were invaluable.'
    },
    {
      name: 'Anjali Patel',
      role: 'DevOps Engineer at StartupXYZ',
      image: 'AP',
      text: 'Best investment I made in my career. The curriculum is cutting-edge and the placement support helped me land my dream job!'
    },
  ];

  const faqs = [
    {
      question: 'What are the prerequisites for this program?',
      answer: 'Basic programming knowledge (Python preferred) and enthusiasm to learn! The program is designed for beginners and working professionals looking to transition into AI/ML.'
    },
    {
      question: 'Is this program online or offline?',
      answer: 'It\'s a hybrid format - live online sessions plus recorded content you can access anytime. Some optional offline workshops may be arranged based on location.'
    },
    {
      question: 'What kind of support do I get?',
      answer: 'You get 1:1 mentorship sessions, 24/7 community support, career guidance, resume building, interview prep, and job placement assistance throughout and after the program.'
    },
    {
      question: 'Are there any hidden costs?',
      answer: 'No hidden costs! The program fee includes everything - course materials, projects, mentorship, certification, and one year access to content. AWS costs for projects are minimal (<₹500).'
    },
    {
      question: 'What if I miss a live session?',
      answer: 'All live sessions are recorded and available within 24 hours. You can catch up at your own pace and still participate in the community discussions.'
    },
    {
      question: 'Do you provide placement guarantee?',
      answer: 'While we don\'t guarantee placements, we provide comprehensive job hunting support, resume optimization, LinkedIn profile building, interview prep, and connect you with our hiring partners. Our track record shows 85% placement rate within 6 months.'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-cyan-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 px-4 py-2 text-base bg-primary/10 text-primary border-primary/20">
                🎓 3-Month Intensive Program
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
                GenAI Career Accelerator
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
                Master the New AI Stack — From Cloud Infrastructure to Intelligent Apps
              </p>
              
              <p className="text-lg text-muted-foreground mb-8">
                Transform from a beginner to a job-ready AI professional. Learn AWS, DevOps, LLM Apps, and MLOps with 6+ real-world projects and guaranteed placement support.
              </p>

              {/* Next Cohort Section */}
              <div className="bg-gradient-to-br from-card/80 to-purple-500/5 backdrop-blur-sm border-2 border-purple-500/30 rounded-3xl p-8 mb-8 inline-block shadow-xl">
                <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 px-6 py-2 text-base">
                  Next Cohort
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  Starts on 18th Sept 2025
                </h3>
                <p className="text-lg text-muted-foreground mb-6">at 8:30AM IST</p>
                <CountdownTimer targetDate="2025-09-18T08:30:00+05:30" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button size="lg" className="text-lg px-8 py-6" onClick={() => setShowPricing(true)}>
                  Join Now - Start Your AI Career <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/auth">Book Free Info Session</Link>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Trusted by 45,000+ learners worldwide</span>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-primary/10 to-cyan-500/20 rounded-3xl transform rotate-3 scale-105 blur-2xl"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20">
                <img 
                  src={heroImage} 
                  alt="GenAI Career Accelerator - Professional working with AI tools" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Without AI Skills Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="mb-6 bg-gradient-to-r from-red-500 to-orange-600 text-white border-0 px-6 py-2">
              Wake-Up Call
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-foreground">
              Without AI Skills, You Risk...
            </h2>
            <p className="text-xl text-gray-700 dark:text-muted-foreground max-w-3xl mx-auto">
              The AI revolution is happening now. Don't get left behind.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: AlertTriangle,
                title: "Job Displacement Risk",
                description: "Traditional roles are being automated - without AI skills, you're vulnerable to replacement",
                impact: "67% of jobs may be affected by AI automation"
              },
              {
                icon: DollarSign,
                title: "Salary Stagnation",
                description: "Non-AI professionals see slower salary growth compared to AI-skilled counterparts",
                impact: "AI professionals earn 40% more on average"
              },
              {
                icon: X,
                title: "Limited Career Growth",
                description: "Companies prioritize AI-capable employees for leadership and strategic roles",
                impact: "85% of executives prefer AI-literate candidates"
              },
              {
                icon: Target,
                title: "Missed Opportunities",
                description: "Unable to capitalize on the $15.7 trillion AI market opportunity",
                impact: "Missing out on the fastest-growing industry"
              }
            ].map((problem, index) => (
              <Card key={index} className="border-red-200 dark:border-red-900/50 hover:border-red-300 dark:hover:border-red-800/70 transition-all duration-300 transform hover:scale-105 bg-white dark:bg-card shadow-lg hover:shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-lg flex-shrink-0">
                      <problem.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-foreground">{problem.title}</h3>
                      <p className="text-gray-700 dark:text-muted-foreground mb-4 leading-relaxed">{problem.description}</p>
                      <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 dark:border-red-600 p-4 rounded">
                        <p className="text-red-800 dark:text-red-400 font-semibold text-sm">{problem.impact}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-background dark:via-background dark:to-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-violet-600 to-cyan-600 bg-clip-text text-transparent">
            🏆 Program Highlights
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to launch your AI career
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Calendar, text: '3 Months | Live + Recorded', color: 'from-blue-500 via-cyan-500 to-blue-600', borderColor: 'border-blue-500/30' },
              { icon: Users, text: '1:1 Mentorship Sessions', color: 'from-purple-500 via-violet-500 to-purple-600', borderColor: 'border-purple-500/30' },
              { icon: Code, text: '6+ Hands-On AI Projects', color: 'from-green-500 via-emerald-500 to-teal-600', borderColor: 'border-green-500/30' },
              { icon: Award, text: 'Internship Certificate', color: 'from-amber-500 via-orange-500 to-amber-600', borderColor: 'border-amber-500/30' },
              { icon: GitBranch, text: 'GitHub Portfolio Builder', color: 'from-indigo-500 via-blue-500 to-indigo-600', borderColor: 'border-indigo-500/30' },
              { icon: Briefcase, text: 'Job Hunting Automation', color: 'from-rose-500 via-pink-500 to-rose-600', borderColor: 'border-rose-500/30' },
            ].map((item, index) => (
              <Card key={index} className={`bg-white/90 dark:bg-card/90 backdrop-blur-sm border-2 ${item.borderColor} shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group overflow-hidden relative`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <CardContent className="p-6 flex items-center gap-4 relative z-10">
                  <div className={`bg-gradient-to-br ${item.color} p-3 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-foreground group-hover:text-primary transition-colors">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-cyan-50/20 to-blue-50/20 dark:from-background dark:via-background dark:to-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📊 What You'll Master
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Industry-relevant skills that top companies are hiring for
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 max-w-6xl mx-auto">
            {skills.map((skill, index) => (
              <Card key={index} className="bg-white/90 dark:bg-card/90 backdrop-blur-sm border-2 border-transparent hover:border-primary/30 hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <CardContent className="p-5 text-center relative z-10">
                  <div className={`bg-gradient-to-br ${skill.color} p-3 rounded-2xl w-14 h-14 mx-auto mb-3 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 shadow-lg group-hover:shadow-2xl`}>
                    <skill.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-bold text-sm group-hover:text-primary transition-colors">{skill.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Structure */}
      <section className="py-20 px-4 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 dark:from-background dark:via-background dark:to-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🧠 3-Month Curriculum Journey
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Structured learning path from fundamentals to production-ready AI systems
          </p>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Month 1 */}
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 dark:from-card dark:via-card dark:to-card backdrop-blur-sm border-2 border-orange-500/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <Badge className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-lg px-5 py-2 shadow-lg">
                    Month 1
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">DevOps + Cloud + LLM Basics</h3>
                    <p className="text-muted-foreground">Foundation building with cloud infrastructure and AI fundamentals</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    'AWS Account Setup (EC2, S3, IAM)',
                    'DevOps Fundamentals & CI/CD',
                    'Introduction to LangChain & LLMs',
                    'Version Control with Git & GitHub'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-orange-500/5 transition-colors">
                      <CheckCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-xl p-5 border-l-4 border-orange-500 shadow-md">
                  <p className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-orange-600" />
                    Projects:
                  </p>
                  <p className="text-muted-foreground font-medium">• AI Travel Planner • CI/CD ML Pipeline</p>
                </div>
              </CardContent>
            </Card>

            {/* Month 2 */}
            <Card className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/30 dark:from-card dark:via-card dark:to-card backdrop-blur-sm border-2 border-blue-500/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <Badge className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white text-lg px-5 py-2 shadow-lg">
                    Month 2
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">LLM Apps + RAG + Agents</h3>
                    <p className="text-muted-foreground">Advanced AI application development with intelligent agents</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    'RAG Applications with Vector DBs',
                    'Multi-Agent AI with CrewAI/LangGraph',
                    'Frontend Integration (Next.js & Vercel)',
                    'Prompt Engineering & Fine-tuning'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-500/5 transition-colors">
                      <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 rounded-xl p-5 border-l-4 border-blue-500 shadow-md">
                  <p className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-blue-600" />
                    Projects:
                  </p>
                  <p className="text-muted-foreground font-medium">• PDF Q&A Platform • Medical RAG Chart Bot • Multi-Agent Assistant</p>
                </div>
              </CardContent>
            </Card>

            {/* Month 3 */}
            <Card className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-card dark:via-card dark:to-card backdrop-blur-sm border-2 border-purple-500/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <Badge className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 text-white text-lg px-5 py-2 shadow-lg">
                    Month 3
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">MLOps + LLMOps + Career Launch</h3>
                    <p className="text-muted-foreground">Production ML systems and career acceleration</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    'SageMaker, Feature Store, Model Tuning',
                    'MLOps Pipelines & Infrastructure as Code',
                    'Resume, LinkedIn & Portfolio Building',
                    'Job Hunting Automation'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-500/5 transition-colors">
                      <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground font-medium">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-xl p-5 border-l-4 border-purple-500 shadow-md">
                  <p className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-600" />
                    Capstone Projects:
                  </p>
                  <p className="text-muted-foreground font-medium">• Full MLOps Pipeline • SaaS AI Platform (Production-Ready)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why This Program Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            🧠 Why This Program Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our proven methodology that transforms beginners into industry-ready professionals
          </p>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4 relative">
              {/* Arrow connectors on desktop */}
              <div className="hidden md:block absolute top-1/4 left-0 right-0 h-1 bg-gradient-to-r from-primary via-info to-success -z-10"></div>
              
              {[
                { icon: GraduationCap, title: 'Learn Skills', desc: 'Master in-demand AI & Cloud technologies', color: 'from-primary to-primary' },
                { icon: Code, title: 'Build Projects', desc: '6+ real-world portfolio projects', color: 'from-info to-info' },
                { icon: Globe, title: 'Create Portfolio', desc: 'GitHub + LinkedIn optimization', color: 'from-success to-success' },
                { icon: Briefcase, title: 'Land Job', desc: 'Placement support & automation', color: 'from-warning to-warning' },
              ].map((step, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 relative z-10">
                  <CardContent className="p-6 text-center">
                    <div className={`bg-gradient-to-br ${step.color} p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capstone Projects Gallery */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            📸 Capstone Projects You'll Build
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Real-world AI projects that will make your portfolio stand out
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {capstoneProjects.map((project, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-2 border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden">
                <CardContent className="p-6">
                  <div className={`bg-gradient-to-br ${project.color} p-4 rounded-xl w-14 h-14 mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <Rocket className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                  <p className="text-gray-700 mb-4 text-sm leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, techIndex) => (
                      <Badge key={techIndex} className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-primary/10 hover:to-primary/20 border-0">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What Students Get */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            📈 What You'll Receive
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Complete package for your AI career success
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Rocket, title: '6+ Real-World Projects', desc: 'Production-ready AI applications for your portfolio' },
              { icon: GitBranch, title: 'GitHub + Live Deployments', desc: 'Showcase your work with deployed projects' },
              { icon: Award, title: 'Internship Certificate', desc: 'Industry-recognized certification' },
              { icon: Target, title: 'Job Automation System', desc: 'AI-powered job hunting tools' },
              { icon: Users, title: 'Community + Placement Prep', desc: '24/7 support and interview preparation' },
              { icon: Clock, title: 'One Year Access', desc: 'One year access to all course materials' },
            ].map((item, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="bg-gradient-primary p-3 rounded-xl w-12 h-12 mb-4 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            💰 Choose Your Plan
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Flexible pricing options to match your career goals
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <Card className="bg-white/70 backdrop-blur-sm border-2 border-border shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-primary/10 text-primary">Starter</Badge>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">₹19,999</span>
                    <span className="text-muted-foreground line-through">₹24,999</span>
                  </div>
                  <p className="text-sm text-gray-700">3-month program access</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    'Complete 3-month curriculum',
                    '6+ hands-on projects',
                    'Live + recorded sessions',
                    'Internship certificate',
                    'Community support',
                    'GitHub portfolio building'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full" size="lg" onClick={() => setShowPricing(true)}>
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1">
                  ⭐ MOST POPULAR
                </Badge>
              </div>
              <CardContent className="p-8">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-purple-600 text-white">Pro</Badge>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">₹29,999</span>
                    <span className="text-muted-foreground line-through">₹39,999</span>
                  </div>
                  <p className="text-sm text-gray-700">Everything in Starter +</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {[
                    'All Starter features',
                    '1:1 mentorship sessions',
                    'Job automation system',
                    'Resume & LinkedIn optimization',
                    'Mock interviews & job prep',
                    'Priority placement support',
                    'Extended career guidance'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90" size="lg" onClick={() => setShowPricing(true)}>
                  Get Started - Pro
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              Secure payment • Instant access • No hidden fees
            </p>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            💼 Career Outcomes
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Real results from our students
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">85%</div>
                <p className="text-lg font-semibold mb-2">Placement Rate</p>
                <p className="text-sm text-muted-foreground">Within 6 months of completion</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">₹6.5L</div>
                <p className="text-lg font-semibold mb-2">Average Package</p>
                <p className="text-sm text-muted-foreground">For freshers and career switchers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Student Success Stories - Copied from CareerLevelUp */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            🌟 Student Success Stories
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Real career transformations from our alumni
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/90 to-emerald-500/5 border-2 border-emerald-500/20 hover:border-emerald-500/40">
              <CardContent className="space-y-4 p-0">
                <div className="text-primary text-3xl mb-4">"</div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "The AI integration in this program is incredible! Learning GitHub Copilot and Cursor transformed my coding speed by 300%. I went from struggling with basic DevOps to building AI-powered infrastructures. Best investment ever!"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Priya Singh</p>
                    <p className="text-sm text-muted-foreground">DevOps Engineer at Infosys</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₹8L → ₹13.2L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/90 to-violet-500/5 border-2 border-violet-500/20 hover:border-violet-500/40">
              <CardContent className="space-y-4 p-0">
                <div className="text-primary text-3xl mb-4">"</div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "The placement support is outstanding! They didn't just teach me DevOps, they prepared my entire portfolio, optimized my LinkedIn, and I got 3 job offers within 45 days of completing the program."
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Rahul Kumar</p>
                    <p className="text-sm text-muted-foreground">AI-DevOps Lead at TCS</p>
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">₹6L → ₹18L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/90 to-blue-500/5 border-2 border-blue-500/20 hover:border-blue-500/40">
              <CardContent className="space-y-4 p-0">
                <div className="text-primary text-3xl mb-4">"</div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "As a fresher, I was worried about competing with experienced developers. But the AI-enhanced learning approach and hands-on projects gave me confidence. Now I'm earning ₹15L as a Senior DevOps Engineer!"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Vikram Sharma</p>
                    <p className="text-sm text-muted-foreground">Senior DevOps at Accenture</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Fresher → ₹15L</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/90 to-rose-500/5 border-2 border-rose-500/20 hover:border-rose-500/40">
              <CardContent className="space-y-4 p-0">
                <div className="text-primary text-3xl mb-4">"</div>
                <p className="text-muted-foreground italic leading-relaxed">
                  "The future is AI + DevOps, and this program nailed it! Learning to build AI agents for infrastructure monitoring and automated deployments set me apart from other candidates. Remote work at ₹22L - dream come true!"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Sneha Reddy</p>
                    <p className="text-sm text-muted-foreground">DevOps Architect at Microsoft</p>
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">₹7L → ₹22L Remote</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            🧠 Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to know about the program
          </p>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-purple-500/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Ready to Start Your AI Career Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 45,000+ learners who transformed their careers with Rise n Shine Technologies
          </p>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 inline-block">
            <p className="text-sm font-semibold text-muted-foreground mb-3">⏰ Early Bird Offer Ends In:</p>
            <CountdownTimer targetDate="2025-11-30T23:59:59+05:30" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => setShowPricing(true)}>
              Enroll Now - Save ₹5,000 <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
              <Link to="/auth">Book Free Info Session</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            💬 Have questions? Email us at info@aicareerlevelup.com
          </p>
        </div>
      </section>

      <Footer />

      {/* Pricing Dialog */}
      {showPricing && (
        <PricingDialog />
      )}
    </div>
  );
};

export default GenAICareerAccelerator;
