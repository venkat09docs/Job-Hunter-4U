import "./styles/razorpay.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import PublicProfile from "./pages/PublicProfile";
import Portfolio from "./pages/Portfolio";
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
import ProtectedRoute from "./components/ProtectedRoute";
import AIAssistantChat from "./components/AIAssistantChat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/portfolio" 
              element={
                <ProtectedRoute>
                  <Portfolio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <ProtectedRoute>
                  <EditProfile />
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
                <ProtectedRoute>
                  <JobSearch />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/job-tracker" 
              element={
                <ProtectedRoute>
                  <JobTracker />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/linkedin-automation" 
              element={
                <ProtectedRoute>
                  <LinkedInAutomation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/manage-career-hub" 
              element={
                <ProtectedRoute>
                  <ManageCareerHub />
                </ProtectedRoute>
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
              path="/dashboard/digital-career-hub" 
              element={
                <ProtectedRoute>
                  <DigitalCareerHub />
                </ProtectedRoute>
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
              <ProtectedRoute>
                <ResumeBuilder />
              </ProtectedRoute>
            } />
            <Route path="/blogs" element={<PublicBlogs />} />
            <Route path="/profile/:slug" element={<PublicProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistantChat />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
