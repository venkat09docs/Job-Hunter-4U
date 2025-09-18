import "./styles/razorpay.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import SkillAssignments from "./pages/SkillAssignments";
import InstituteManagement from "./pages/InstituteManagement";
import BatchManagement from "./pages/BatchManagement";
import StudentsManagement from "./pages/StudentsManagement";
import AssignmentManagement from "./pages/AssignmentManagement";
import LeaderBoardPoints from "./pages/LeaderBoardPoints";
import ProtectedRoute from "./components/ProtectedRoute";
import PremiumProtectedRoute from "./components/PremiumProtectedRoute";
import InstituteAdminRedirect from "./components/InstituteAdminRedirect";
import AIAssistantChat from "./components/AIAssistantChat";
import SocialProofPopup from "./components/SocialProofPopup";
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
import NotificationAnalytics from "./pages/NotificationAnalytics";
import NotificationManagement from "./pages/NotificationManagement";
import AffiliateManagementPage from "./pages/AffiliateManagement";
import SocialProofManagement from "./pages/SocialProofManagement";
import CareerLevelUp from "./pages/CareerLevelUp";
import ProgressLevelUp from "./pages/ProgressLevelUp";

// Career Level Program (CLP) imports
import CLPDashboard from "./pages/career-level/CLPDashboard";
import SkillLevelUpProgram from "./pages/career-level/SkillLevelUpProgram";
import AssignmentDetail from "./pages/career-level/AssignmentDetail";
import CreateAssignment from "./pages/career-level/CreateAssignment";
import ManageQuestions from "./pages/career-level/ManageQuestions";
import AttemptAssignment from "./pages/career-level/AttemptAssignment";
import AttemptResults from "./pages/career-level/AttemptResults";
import CourseContentView from "./pages/CourseContentView";
import CourseContentManagement from "./pages/CourseContentManagement";



import NotificationPreferences from "./pages/NotificationPreferences";
import AllNotifications from "./pages/AllNotifications";
import AICareerLevelUp from "./pages/AICareerLevelUp";
import Student from "./pages/Student";

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
          <Route path="/" element={<AICareerLevelUp />} />
          <Route path="/home" element={<Index />} />
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
            path="/dashboard/all-notifications" 
            element={
              <ProtectedRoute>
                <AllNotifications />
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
            path="/admin/skill-assignments"
            element={
              <ProtectedRoute>
                <SkillAssignments />
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
            path="/admin/manage-assignments" 
            element={
              <ProtectedRoute>
                <AssignmentManagement />
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
              path="/admin/notification-analytics"
              element={
                <ProtectedRoute>
                  <NotificationAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/notification-management"
              element={
                <ProtectedRoute>
                  <NotificationManagement />
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
          <Route 
            path="/admin/social-proof-management"
            element={
              <ProtectedRoute>
                <SocialProofManagement />
              </ProtectedRoute>
            } 
          />
          <Route path="/blogs" element={<PublicBlogs />} />
          <Route path="/profile/:slug" element={<PublicProfile />} />
          {/* Career Level Program (CLP) Routes */}
          <Route 
            path="/dashboard/career-level/dashboard" 
            element={
              <ProtectedRoute>
                <CLPDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/skill-level" 
            element={
              <ProtectedRoute>
                <SkillLevelUpProgram />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/progress-level-up" 
            element={
              <ProtectedRoute>
                <ProgressLevelUp />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/assignments/new" 
            element={
              <ProtectedRoute>
                <CreateAssignment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/assignments/:assignmentId/edit" 
            element={
              <ProtectedRoute>
                <CreateAssignment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/assignments/:assignmentId/questions" 
            element={
              <ProtectedRoute>
                <ManageQuestions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/assignments/:assignmentId" 
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/attempt/:attemptId" 
            element={
              <ProtectedRoute>
                <AttemptAssignment />
              </ProtectedRoute>
            } 
          />
            <Route 
              path="/dashboard/career-level/attempt/:attemptId/results" 
              element={
                <ProtectedRoute>
                  <AttemptResults />
                </ProtectedRoute>
              } 
            />
          <Route 
            path="/course/:courseId" 
            element={
              <ProtectedRoute>
                <CourseContentView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/career-level/course/:courseId/content" 
            element={
              <ProtectedRoute>
                <CourseContentManagement />
              </ProtectedRoute>
            } 
          />
           <Route 
            path="/dashboard/career-level/leaderboard" 
            element={<Navigate to="/dashboard/career-level/dashboard" replace />} 
           />
           
           <Route path="/careerlevelup" element={<CareerLevelUp />} />
            <Route path="/ai-career-level-up" element={<AICareerLevelUp />} />
            <Route path="/student" element={<Student />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIAssistantChat />
        <SocialProofPopup />
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
