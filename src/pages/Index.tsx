import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ActivityFeaturesShowcase from "@/components/ActivityFeaturesShowcase";
import JobTrackerShowcase from "@/components/JobTrackerShowcase";
import AIToolsSection from "@/components/AIToolsSection";
import Pricing from "@/components/Pricing";
import BuildProfileCTA from "@/components/BuildProfileCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading to avoid premature redirects
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <ActivityFeaturesShowcase />
      <JobTrackerShowcase />
      <AIToolsSection />
      <Pricing />
      <BuildProfileCTA />
      <Footer />
    </div>
  );
};

export default Index;
