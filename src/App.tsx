import "./styles/razorpay.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { IndustrySelectionDialog } from "@/components/IndustrySelectionDialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserIndustry } from "@/hooks/useUserIndustry";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

import PublicProfile from "./pages/PublicProfile";
import BlogDashboard from "./pages/BlogDashboard";
import PublicBlogs from "./pages/PublicBlogs";
import Settings from "./pages/Settings";
import TalentScreener from "./pages/TalentScreener";
import JobSearch from "./pages/JobSearch";
import JobTracker from "./pages/JobTracker";
import LinkedInAutomation from "./pages/LinkedInAutomation";
import ManageCareerHub from "./pages/ManageCareerHub";
import ManageSubscriptions from "./pages/ManageSubscriptions";
import DigitalCareerHub from "./pages/DigitalCareerHub";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import ResumeBuilder from "./pages/ResumeBuilder";
import MyProfileJourney from "./pages/MyProfileJourney";
import ResourcesLibrary from "./pages/ResourcesLibrary";
import LinkedInOptimization from "./pages/LinkedInOptimization";
import GitHubOptimization from "./pages/GitHubOptimization";
import GitHubActivityTracker from "./pages/GitHubActivityTracker";
import CareerGrowth from "./pages/CareerGrowth";

import FindYourNextRole from "./pages/FindYourNextRole";
import BuildMyProfile from "./pages/BuildMyProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import InstituteMembershipPlans from "./pages/InstituteMembershipPlans";
import KnowledgeBase from "./pages/KnowledgeBase";
import DocumentationDetail from "./pages/DocumentationDetail";
import StudentsReport from "./pages/StudentsReport";
import InstituteManagement from "./pages/InstituteManagement";
import BatchManagement from "./pages/BatchManagement";
import StudentsManagement from "./pages/StudentsManagement";
import LeaderBoardPoints from "./pages/LeaderBoardPoints";
import ProtectedRoute from "./components/ProtectedRoute";
import PremiumProtectedRoute from "./components/PremiumProtectedRoute";
import InstituteAdminRedirect from "./components/InstituteAdminRedirect";
import AIAssistantChat from "./components/AIAssistantChat";
import NotFound from "./pages/NotFound";
import SuperAI from "./pages/SuperAI";
import DigitalPortfolio from "./pages/DigitalPortfolio";
import CareerGrowthActivities from "./pages/CareerGrowthActivities";
import StatusView from "./pages/StatusView";
import LevelUp from "./pages/LevelUp";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import PostJob from "./pages/PostJob";

import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { industry, loading: industryLoading } = useUserIndustry();
  const [showIndustryDialog, setShowIndustryDialog] = useState(false);
  const [industryCheckComplete, setIndustryCheckComplete] = useState(false);

  useEffect(() => {
    console.log('🚪 Industry dialog logic:', { 
      authLoading, 
      industryLoading, 
      user: user?.id, 
      industry,
      showIndustryDialog,
      industryCheckComplete
    });
    
    // Only proceed if auth and industry loading are complete
    if (!authLoading && !industryLoading) {
      setIndustryCheckComplete(true);
      
      // Show industry selection dialog for authenticated users without industry
      if (user && !industry) {
        console.log('🚪 Showing industry dialog - user has no industry set');
        setShowIndustryDialog(true);
      } else {
        console.log('🚪 Not showing industry dialog - user has industry or not authenticated');
        setShowIndustryDialog(false);
      }
    } else {
      console.log('🚪 Still loading - auth or industry data not ready');
    }
  }, [user, industry, authLoading, industryLoading]);

  // Close dialog when industry is set
  useEffect(() => {
    if (industry && showIndustryDialog) {
      console.log('🚪 Closing industry dialog - industry is now set:', industry);
      setShowIndustryDialog(false);
    }
  }, [industry, showIndustryDialog]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <InstituteAdminRedirect>
                  <Dashboard />
                </InstituteAdminRedirect>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/blog" 
            element={
              <ProtectedRoute>
                <BlogDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/notification-preferences" 
            element={
              <ProtectedRoute>
                <NotificationPreferences />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/talent-screener" 
            element={
              <ProtectedRoute>
                <TalentScreener />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/job-search" 
            element={
              <PremiumProtectedRoute featureKey="page_job_search">
                <JobSearch />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/job-tracker" 
            element={
              <PremiumProtectedRoute featureKey="page_job_tracker">
                <JobTracker />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/linkedin-automation" 
            element={
              <PremiumProtectedRoute featureKey="page_linkedin_automation">
                <LinkedInAutomation />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/manage-career-hub" 
            element={
              <PremiumProtectedRoute featureKey="page_manage_career_hub">
                <ManageCareerHub />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/manage-subscriptions" 
            element={
              <ProtectedRoute>
                <ManageSubscriptions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/institute-membership-plans" 
            element={
              <ProtectedRoute>
                <InstituteMembershipPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/digital-career-hub" 
            element={
              <PremiumProtectedRoute featureKey="page_digital_career_hub">
                <DigitalCareerHub />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
          } 
          />
          <Route path="/dashboard/resume-builder" element={
            <PremiumProtectedRoute featureKey="page_resume_builder">
              <ResumeBuilder />
            </PremiumProtectedRoute>
          } />
          <Route 
            path="/dashboard/my-profile-journey" 
            element={
              <PremiumProtectedRoute featureKey="page_my_profile_journey">
                <MyProfileJourney />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/library" 
            element={
              <PremiumProtectedRoute featureKey="page_resources_library">
                <ResourcesLibrary />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/linkedin-optimization" 
            element={
              <PremiumProtectedRoute featureKey="page_linkedin_optimization">
                <LinkedInOptimization />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/github-optimization" 
            element={
              <PremiumProtectedRoute featureKey="page_github_optimization">
                <GitHubOptimization />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/github-activity-tracker" 
            element={
              <PremiumProtectedRoute featureKey="page_github_activity_tracker">
                <GitHubActivityTracker />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-growth" 
            element={
              <PremiumProtectedRoute featureKey="career_growth_report">
                <CareerGrowth />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/find-your-next-role" 
            element={
              <PremiumProtectedRoute featureKey="page_find_your_next_role">
                <FindYourNextRole />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/build-my-profile" 
            element={
              <ProtectedRoute>
                <BuildMyProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/knowledge-base" 
            element={
              <ProtectedRoute>
                <KnowledgeBase />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/knowledge-base/doc/:id" 
            element={
              <ProtectedRoute>
                <DocumentationDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/super-ai" 
            element={
              <PremiumProtectedRoute featureKey="super_ai">
                <SuperAI />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/digital-portfolio" 
            element={
              <PremiumProtectedRoute featureKey="digital_portfolio">
                <DigitalPortfolio />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-growth-activities" 
            element={
              <PremiumProtectedRoute featureKey="career_growth_activities">
                <CareerGrowthActivities />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/status-view" 
            element={
              <ProtectedRoute>
                <StatusView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/level-up" 
            element={
              <ProtectedRoute>
                <LevelUp />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students-report"
            element={
              <ProtectedRoute>
                <StudentsReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/institute-management" 
            element={
              <ProtectedRoute>
                <InstituteManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/batch-management" 
            element={
              <ProtectedRoute>
                <BatchManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/students-management" 
            element={
              <ProtectedRoute>
                <StudentsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter" 
            element={
              <ProtectedRoute>
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/post-job" 
            element={
              <ProtectedRoute>
                <PostJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard-points"
            element={
              <ProtectedRoute>
                <LeaderBoardPoints />
              </ProtectedRoute>
            } 
          />
          <Route path="/blogs" element={<PublicBlogs />} />
          <Route path="/profile/:slug" element={<PublicProfile />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIAssistantChat />
      </BrowserRouter>
      
      <IndustrySelectionDialog
        open={showIndustryDialog}
        onOpenChange={setShowIndustryDialog}
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
