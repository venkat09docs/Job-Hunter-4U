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
              Optimize your resume<br />
              to get more interviews
            </h1>
            <p className="lead">
              Our platform helps you optimize your resume for any job, highlighting the key experience and skills recruiters need to see.
            </p>

            {/* CTA */}
            <div className="hook-ctas" style={{ marginTop: '32px' }}>
              <button 
                className="button"
                onClick={() => navigate('/auth')}
              >
                Scan your resume
              </button>
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
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>Live Job Alerts</span>
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