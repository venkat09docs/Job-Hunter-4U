import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Users, 
  Target, 
  Shield, 
  Zap, 
  TrendingUp,
  CheckCircle,
  Star
} from "lucide-react";

const Features = () => {
  const painPoints = [
    "Sending 100+ applications with zero responses",
    "Getting rejected after multiple interview rounds", 
    "Not knowing how to optimize your resume for ATS",
    "Missing out on opportunities due to poor LinkedIn profile",
    "Struggling to stand out among thousands of candidates",
    "Accepting lower salaries due to lack of market insights"
  ];

  const features = [
    {
      icon: Search,
      title: "AI Resume Scanner",
      description: "Beat ATS systems with our AI that optimizes your resume for each job application. 94% pass rate vs 23% industry average."
    },
    {
      icon: Users,
      title: "LinkedIn Optimization", 
      description: "Grow your network 10x faster with complete tracking connection requests and engagement."
    },
    {
      icon: Target,
      title: "Job Application Tracker",
      description: "Never lose track of applications again. Get insights on response rates and optimize your approach based on data."
    },
    {
      icon: Shield,
      title: "Interview Preparation AI",
      description: "Practice with our AI interviewer trained on real interviews. Boost confidence and ace every interview."
    },
    {
      icon: Zap,
      title: "Salary Negotiation Tools",
      description: "Know your worth with real-time market data. Our users negotiate 40% higher salaries on average."
    },
    {
      icon: TrendingUp,
      title: "Portfolio Builder",
      description: "Create stunning portfolios that showcase your work. Stand out with professional presentations that impress recruiters."
    }
  ];

  return (
    <section className="section surface">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="kicker">🔥 The Problem Everyone Faces</div>
          <h2 className="h2">
            Are You Stuck in This{" "}
            <span style={{ color: 'var(--danger)' }}>
              Job Search Hell?
            </span>
          </h2>
          <p className="lead">
            If any of these sound familiar, you're not alone. 89% of job seekers face these exact problems.
          </p>
        </div>
        
        {/* Pain Points Grid */}
        <div className="boards mb-16">
          {painPoints.map((pain, index) => (
            <div key={index} className="board card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(239, 68, 68, 0.01))', border: '1px solid rgba(239, 68, 68, 0.08)' }}>
              <p style={{ color: 'var(--danger)', fontWeight: '500', fontSize: '14px', margin: '0' }}>❌ {pain}</p>
            </div>
          ))}
        </div>
        
        {/* Solution Header */}
        <div className="card p32 center mb-16" style={{ background: 'linear-gradient(135deg, rgba(108,139,255,.05), rgba(91,231,196,.02))' }}>
          <h3 className="h2 m0">
            Here's How{" "}
            <span style={{ color: 'var(--brand)' }}>
              JobHunter Pro
            </span>{" "}
            Solves Every Problem
          </h3>
          <p className="lead mt8">
            Stop struggling alone. Join the platform that transformed careers with our AI-powered platform.
          </p>
        </div>

        {/* Features Boards */}
        <div className="boards">
          {features.map((feature, index) => (
            <div key={index} className="board card">
              <div className="icon">
                <feature.icon style={{ width: '20px', height: '20px', color: 'var(--brand)' }} />
              </div>
              <h3 className="title">{feature.title}</h3>
              <p className="desc">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Testimonials Section */}
        <div className="card p32 mt24" style={{ background: 'linear-gradient(135deg, rgba(108,139,255,.04), rgba(91,231,196,.02))' }}>
          <div className="testimonials">
            {/* First Testimonial */}
            <div className="testimonial">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <blockquote style={{ fontSize: '16px', lineHeight: '1.6', margin: '0', fontStyle: 'italic' }}>
                "I tried every job board and networking hack, but nothing worked—until I automated my outreach. The AI agents found HR contacts, sent personalized messages, and followed up exactly when they needed to."
              </blockquote>
              <div className="author">
                <div className="avatar" style={{ backgroundColor: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '700' }}>
                  D
                </div>
                <div>
                  <div className="name">Deepak</div>
                  <div className="role">Software Engineer</div>
                </div>
              </div>
            </div>

            {/* Second Testimonial */}
            <div className="testimonial">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <blockquote style={{ fontSize: '16px', lineHeight: '1.6', margin: '0', fontStyle: 'italic' }}>
                "As a recent graduate, I didn't know where to start. The platform's step-by-step automation guided me through crafting a standout LinkedIn profile, targeting the right companies."
              </blockquote>
              <div className="author">
                <div className="avatar" style={{ backgroundColor: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: '700' }}>
                  K
                </div>
                <div>
                  <div className="name">Kavya</div>
                  <div className="role">Software Engineer</div>
                </div>
              </div>
            </div>
            
            {/* CTA Column */}
            <div className="testimonial">
              <div className="badge">⏰ Limited Time Offer</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '8px 0' }}>Don't Be The Last To Know</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  <span><strong>40% average salary boost</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  <span><strong>5x faster job hunting</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  <span><strong>87% success rate</strong></span>
                </div>
              </div>
              <button className="button mt16" style={{ width: '100%' }}>
                Join JobHunter Pro - ₹499
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;