import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import JobTrackerShowcase from "@/components/JobTrackerShowcase";
import AIToolsSection from "@/components/AIToolsSection";
import Pricing from "@/components/Pricing";
import BuildProfileCTA from "@/components/BuildProfileCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <JobTrackerShowcase />
      <AIToolsSection />
      <Pricing />
      <BuildProfileCTA />
      <Footer />
    </div>
  );
};

export default Index;
