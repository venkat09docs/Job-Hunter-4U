import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import ActivityFeaturesShowcase from "@/components/ActivityFeaturesShowcase";
import JobTrackerShowcase from "@/components/JobTrackerShowcase";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import SocialProofPopup from "@/components/SocialProofPopup";
import MasterKeyActivities from "@/components/MasterKeyActivities";

const Index = () => {
  const { user, loading, hasLoggedOut } = useAuth();
  const { isRecruiter, isAdmin, isInstituteAdmin } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading, if user has just logged out, or to avoid premature redirects
    if (!loading && user && !hasLoggedOut) {
      // Redirect recruiters to their dashboard
      if (isRecruiter && !isAdmin && !isInstituteAdmin) {
        navigate('/recruiter', { replace: true });
        return;
      }
      // Default dashboard redirect for regular users
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, hasLoggedOut, navigate, isRecruiter, isAdmin, isInstituteAdmin]);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div id="hero">
        <Hero />
      </div>
      <div id="features">
        <Features />
      </div>
      <MasterKeyActivities />
      <About />
      <Testimonials />
      <ActivityFeaturesShowcase />
      <JobTrackerShowcase />
      <div id="pricing">
        <Pricing />
      </div>
      <Footer />
      
      {/* Social Proof Popup */}
      <SocialProofPopup />
    </div>
  );
};

export default Index;
