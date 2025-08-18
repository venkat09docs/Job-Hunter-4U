import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import ActivityFeaturesShowcase from "@/components/ActivityFeaturesShowcase";
import JobTrackerShowcase from "@/components/JobTrackerShowcase";
import AIToolsSection from "@/components/AIToolsSection";
import Pricing from "@/components/Pricing";
import BuildProfileCTA from "@/components/BuildProfileCTA";
import Footer from "@/components/Footer";
import { IndustrySelectionDialog } from "@/components/IndustrySelectionDialog";

const Index = () => {
  const { user, loading, hasLoggedOut } = useAuth();
  const { industry, loading: industryLoading } = useUserIndustry();
  const [showIndustryDialog, setShowIndustryDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect if still loading, if user has just logged out, or to avoid premature redirects
    if (!loading && user && !hasLoggedOut) {
      // Check if user needs to select industry
      if (!industryLoading && industry === null) {
        setShowIndustryDialog(true);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, loading, hasLoggedOut, industry, industryLoading, navigate]);

  const handleIndustryDialogClose = (open: boolean) => {
    setShowIndustryDialog(open);
    if (!open && user) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div id="hero">
        <Hero />
      </div>
      <div id="features">
        <Features />
      </div>
      <About />
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
      
      <IndustrySelectionDialog 
        open={showIndustryDialog} 
        onOpenChange={handleIndustryDialogClose}
      />
    </div>
  );
};

export default Index;
