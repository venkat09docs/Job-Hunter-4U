import "./styles/razorpay.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { ensureConsistentDomain } from "@/utils/domainRedirect";
import { useEffect } from "react";
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
import GitHubWeekly from "./pages/GitHubWeekly";
import GitHubActivityTracker from "./pages/GitHubActivityTracker";
import CareerGrowth from "./pages/CareerGrowth";
import Affiliate from "./pages/Affiliate";

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
import DigitalPortfolio from "./pages/DigitalPortfolio";
import CareerActivitiesNew from "./pages/CareerActivitiesNew";
import LevelUp from "./pages/LevelUp";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import PostJob from "./pages/PostJob";
import CareerActivities from "./pages/CareerActivities";
import CareerAssignments from "./pages/CareerAssignments";
import CareerGrowthActivities from "./pages/CareerGrowthActivities";
import { JobHuntingAssignments } from "./pages/JobHuntingAssignments";
import VerifyAssignments from "./pages/VerifyAssignments";
import ManageAssignments from "./pages/ManageAssignments";
import NotificationAnalytics from "./pages/NotificationAnalytics";
import AffiliateManagementPage from "./pages/AffiliateManagement";

import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

const AppContent = () => {
  // Ensure consistent domain usage on app load
  useEffect(() => {
    ensureConsistentDomain();
  }, []);

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
          <Route 
            path="/career-activities" 
            element={
              <ProtectedRoute>
                <CareerActivities />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-assignments" 
            element={
              <ProtectedRoute>
                <CareerAssignments />
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
            path="/affiliate" 
            element={
              <ProtectedRoute>
                <Affiliate />
              </ProtectedRoute>
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
            path="/dashboard/digital-portfolio" 
            element={
              <PremiumProtectedRoute featureKey="digital_portfolio">
                <DigitalPortfolio />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-activities-new" 
            element={
              <PremiumProtectedRoute featureKey="career_growth_activities">
                <CareerActivitiesNew />
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
            path="/dashboard/job-hunting-assignments" 
            element={
              <PremiumProtectedRoute featureKey="job_hunting_assignments">
                <JobHuntingAssignments />
              </PremiumProtectedRoute>
            } 
          />
          <Route 
            path="/github-weekly" 
            element={
              <ProtectedRoute>
                <GitHubWeekly />
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
          <Route 
            path="/admin/verify-assignments"
            element={
              <ProtectedRoute>
                <VerifyAssignments />
              </ProtectedRoute>
            } 
          />
            <Route 
              path="/admin/manage-assignments"
              element={
                <ProtectedRoute>
                  <ManageAssignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/notification-analytics"
              element={
                <ProtectedRoute>
                  <NotificationAnalytics />
                </ProtectedRoute>
              } 
            />
          <Route 
            path="/admin/affiliate-management"
            element={
              <ProtectedRoute>
                <AffiliateManagementPage />
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
