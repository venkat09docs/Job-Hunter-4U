import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useInstituteName } from '@/hooks/useInstituteName';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap, Settings, TrendingUp } from 'lucide-react';


import { InstituteLeaderBoard } from '@/components/InstituteLeaderBoard';
import { InstituteDashboard } from '@/components/admin/InstituteDashboard';
import { SuperAdminDashboard } from '@/components/admin/SuperAdminDashboard';
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
                  <span className="font-medium">{instituteSubscription.currentStudentCount}/{instituteSubscription.maxStudents}</span> students
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

  // For Super Admin, show the full layout with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>        
        <div className="container mx-auto p-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <SuperAdminDashboard />
            </TabsContent>

            <TabsContent value="assignments">
              <div className="text-center py-8">
                <p className="text-muted-foreground">User Management functionality has been moved to dedicated management pages.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}