import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useInstituteName } from '@/hooks/useInstituteName';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Building, GraduationCap, ClipboardList, Share2, TrendingUp } from "lucide-react";

import { InstituteLeaderBoard } from '@/components/InstituteLeaderBoard';
import { InstituteDashboard } from '@/components/admin/InstituteDashboard';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
import { UserAssignmentManagement } from "@/components/admin/UserAssignmentManagement";
import AffiliateManagement from "@/components/admin/AffiliateManagement";
import AdminSetup from '@/components/AdminSetup';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { InstituteSubscriptionBadge } from '@/components/InstituteSubscriptionBadge';

export default function AdminDashboard() {
  const { isAdmin, isInstituteAdmin, loading } = useRole();
  const { user } = useAuth();
  const { instituteName, instituteSubscription } = useInstituteName();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Extract max students from subscription plan name
  const getMaxStudentsFromPlan = (planName: string | null): number => {
    if (!planName) return 0;
    const match = planName.match(/(\d+)\s*Members?\s*Pack/i);
    return match ? parseInt(match[1]) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isInstituteAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the admin dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For Institute Admin, show layout with sidebar
  if (isInstituteAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Top Level Menu for Institute Admin */}
          <div className="border-b bg-card">
            <div className="container mx-auto flex items-center justify-between p-4">
              <div>
                <h1 className="text-xl font-semibold">
                  {instituteName ? `${instituteName} - Dashboard` : 'Institute Dashboard'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your institute's batches and students
                </p>
              </div>
              
            <div className="flex items-center gap-4">
              <InstituteSubscriptionBadge />
              {instituteSubscription && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{instituteSubscription.currentStudentCount}/{getMaxStudentsFromPlan(instituteSubscription.plan)}</span> students
                </div>
              )}
              <UserProfileDropdown />
            </div>
            </div>
          </div>
          
          <div className="container mx-auto p-6">
            <InstituteDashboard />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const adminTabs = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "institutes", label: "Institutes", icon: Building },
    { id: "batches", label: "Batches", icon: GraduationCap },
    { id: "assignments", label: "User Assignments", icon: ClipboardList },
    { id: "affiliates", label: "Affiliate Management", icon: Share2 }
  ];

  // For Super Admin, show the full layout with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>        
        <div className="container mx-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {adminTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard">
              <div className="space-y-6">
                <SuperAdminDashboard />
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Admin Setup</h3>
                  <AdminSetup />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="institutes">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Institute Management functionality has been moved to dedicated management pages.</p>
              </div>
            </TabsContent>

            <TabsContent value="batches">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Batch Management functionality has been moved to dedicated management pages.</p>
              </div>
            </TabsContent>

            <TabsContent value="assignments">
              <UserAssignmentManagement />
            </TabsContent>

            <TabsContent value="affiliates">
              <AffiliateManagement />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}