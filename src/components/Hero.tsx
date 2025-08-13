import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-job-hunters.jpg";


const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="hook-section section">
      <div className="container">
        <div className="hook-inner">
          {/* Text content */}
          <div className="hook-copy">
            <div className="kicker">🚀 Join 1000+ Who Got Hired</div>
            <h1 className="h1">
              Stop Getting{" "}
              <span className="line-through opacity-60" style={{ color: 'var(--danger)' }}>
                Rejected
              </span>{" "}
              Start Getting{" "}
              <span style={{ color: 'var(--brand)' }}>
                Hired
              </span>
            </h1>
            <p className="lead">
              <strong>Tired of endless applications with no responses?</strong> Join the Platform where job seekers landed their dream jobs 3x faster using our AI-powered career platform. <span style={{ color: 'var(--brand)', fontWeight: '600' }}>Average salary increase: 40%</span>
            </p>
            
            {/* Urgency alert */}
            <div className="card mt16 p20" style={{ background: 'linear-gradient(135deg, rgba(255, 108, 140, 0.1), rgba(255, 108, 140, 0.05))', border: '1px solid rgba(255, 108, 140, 0.2)' }}>
              <p style={{ color: 'var(--danger)', fontWeight: '500', fontSize: '14px', margin: '0' }}>
                ⚠️ Your competition is already using AI. Don't get left behind.
              </p>
            </div>

            {/* Stats */}
            <div className="hook-trust">
              <div className="row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>1000+ Got Hired</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>95% Success Rate</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span>3x Faster Hiring</span>
                </div>
              </div>
              
              <div className="card p16 mt16" style={{ background: 'linear-gradient(135deg, rgba(255, 195, 108, 0.1), rgba(255, 195, 108, 0.05))', border: '1px solid rgba(255, 195, 108, 0.2)' }}>
                <p style={{ color: 'var(--warning)', fontWeight: '500', fontSize: '14px', margin: '0' }}>
                  🕒 Limited Time: Get access for just ₹499/week (Regular price: ₹1,999)
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="hook-ctas">
              <button 
                className="button"
                onClick={() => navigate('/auth')}
              >
                Build Profile - for Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hook-trust">
              <span>⭐⭐⭐⭐⭐</span>
              <span>4.6/5 and 13 Years of Trust</span>
              <span>•</span>
              <span style={{ color: 'var(--success)' }}>No credit card required</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="hook-media">
            <img
              src={heroImage}
              alt="Professional job hunters"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            
            {/* Floating cards */}
            <div className="card p16" style={{ position: 'absolute', top: '-16px', left: '-16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--success)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Live Job Alerts</span>
              </div>
            </div>
            
            <div className="card p16" style={{ position: 'absolute', bottom: '-16px', right: '-16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand)' }}>92%</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;