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
  UsersRound
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.1),transparent_50%)]"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 px-4 py-2 text-base bg-primary/10 text-primary border-primary/20">
              🎓 3-Month Intensive Program
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
              GenAI Career Accelerator
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
              Master the New AI Stack — From Cloud Infrastructure to Intelligent Apps
            </p>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform from a beginner to a job-ready AI professional. Learn AWS, DevOps, LLM Apps, and MLOps with 6+ real-world projects and guaranteed placement support.
            </p>

            {/* Early Bird Countdown */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 inline-block">
              <p className="text-sm font-semibold text-muted-foreground mb-3">⏰ Early Bird Offer Ends In:</p>
              <CountdownTimer targetDate="2025-11-30T23:59:59+05:30" />
              <p className="text-xs text-muted-foreground mt-3">Save ₹5,000 on enrollment!</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => setShowPricing(true)}>
                Join Now - Start Your AI Career <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/auth">Book Free Info Session</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Trusted by 45,000+ learners worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            🏆 Program Highlights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Calendar, text: '3 Months | Live + Recorded', color: 'from-blue-500 to-cyan-500' },
              { icon: Users, text: '1:1 Mentorship Sessions', color: 'from-purple-500 to-pink-500' },
              { icon: Code, text: '6+ Hands-On AI Projects', color: 'from-green-500 to-emerald-500' },
              { icon: Award, text: 'Internship Certificate', color: 'from-amber-500 to-orange-500' },
              { icon: GitBranch, text: 'GitHub Portfolio Builder', color: 'from-indigo-500 to-blue-500' },
              { icon: Briefcase, text: 'Job Hunting Automation', color: 'from-rose-500 to-red-500' },
            ].map((item, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-2 border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`bg-gradient-to-br ${item.color} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            📊 What You'll Master
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Industry-relevant skills that top companies are hiring for
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 max-w-6xl mx-auto">
            {skills.map((skill, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className={`bg-gradient-to-br ${skill.color} p-3 rounded-2xl w-14 h-14 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    <skill.icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{skill.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Structure */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            🧠 3-Month Curriculum Journey
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Structured learning path from fundamentals to production-ready AI systems
          </p>

          <div className="max-w-5xl mx-auto space-y-6">
            {/* Month 1 */}
            <Card className="bg-white/70 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg px-4 py-2">
                    Month 1
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">DevOps + Cloud + LLM Basics</h3>
                    <p className="text-gray-700">Foundation building with cloud infrastructure and AI fundamentals</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {[
                    'AWS Account Setup (EC2, S3, IAM)',
                    'DevOps Fundamentals & CI/CD',
                    'Introduction to LangChain & LLMs',
                    'Version Control with Git & GitHub'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg p-4 border-l-4 border-orange-500">
                  <p className="font-semibold text-gray-900 mb-2">📌 Projects:</p>
                  <p className="text-gray-700">• AI Travel Planner • CI/CD ML Pipeline</p>
                </div>
              </CardContent>
            </Card>

            {/* Month 2 */}
            <Card className="bg-white/70 backdrop-blur-sm border-2 border-blue-500/20 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg px-4 py-2">
                    Month 2
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">LLM Apps + RAG + Agents</h3>
                    <p className="text-gray-700">Advanced AI application development with intelligent agents</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {[
                    'RAG Applications with Vector DBs',
                    'Multi-Agent AI with CrewAI/LangGraph',
                    'Frontend Integration (Next.js & Vercel)',
                    'Prompt Engineering & Fine-tuning'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-500/10 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="font-semibold text-gray-900 mb-2">📌 Projects:</p>
                  <p className="text-gray-700">• PDF Q&A Platform • Medical RAG Chart Bot • Multi-Agent Assistant</p>
                </div>
              </CardContent>
            </Card>

            {/* Month 3 */}
            <Card className="bg-white/70 backdrop-blur-sm border-2 border-purple-500/20 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-lg px-4 py-2">
                    Month 3
                  </Badge>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">MLOps + LLMOps + Career Launch</h3>
                    <p className="text-gray-700">Production ML systems and career acceleration</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {[
                    'SageMaker, Feature Store, Model Tuning',
                    'MLOps Pipelines & Infrastructure as Code',
                    'Resume, LinkedIn & Portfolio Building',
                    'Job Hunting Automation'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-purple-500/5 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="font-semibold text-gray-900 mb-2">📌 Capstone Projects:</p>
                  <p className="text-gray-700">• Full MLOps Pipeline • SaaS AI Platform (Production-Ready)</p>
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

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            🏆 Success Stories
          </h2>
          <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
            Hear from our successful graduates
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                      {testimonial.image}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-700">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
