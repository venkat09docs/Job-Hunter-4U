import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ActivityFeaturesShowcase from "@/components/ActivityFeaturesShowcase";
import JobTrackerShowcase from "@/components/JobTrackerShowcase";
import AIToolsSection from "@/components/AIToolsSection";
import Pricing from "@/components/Pricing";
import BuildProfileCTA from "@/components/BuildProfileCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading, hasLoggedOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading, if user has just logged out, or to avoid premature redirects
    if (!loading && user && !hasLoggedOut) {
      navigate('/dashboard');
    }
  }, [user, loading, hasLoggedOut, navigate]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <div id="hero">
        <Hero />
      </div>
      <div id="features">
        <Features />
      </div>
      <ActivityFeaturesShowcase />
      <JobTrackerShowcase />
      <div id="ai-tools">
        <AIToolsSection />
      </div>
      <div id="pricing">
        <Pricing />
      </div>
      <BuildProfileCTA />
      <Footer />
    </div>
  );
};

export default Index;
