import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, GraduationCap, Settings } from 'lucide-react';
import { InstituteManagement } from '@/components/admin/InstituteManagement';
import { BatchManagement } from '@/components/admin/BatchManagement';
import { UserAssignmentManagement } from '@/components/admin/UserAssignmentManagement';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminDashboard() {
  const { isAdmin, isInstituteAdmin, loading } = useRole();
  const { user } = useAuth();
  const [instituteName, setInstituteName] = useState<string>('');

  useEffect(() => {
    if (isInstituteAdmin && user) {
      fetchInstituteName();
    }
  }, [isInstituteAdmin, user]);

  const fetchInstituteName = async () => {
    try {
      const { data, error } = await supabase
        .from('institute_admin_assignments')
        .select(`
          institutes (
            name
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (data?.institutes) {
        setInstituteName(data.institutes.name);
      }
    } catch (error) {
      console.error('Error fetching institute name:', error);
    }
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isAdmin ? 'Super Admin Dashboard' : 'Institute Admin Dashboard'}
            </h1>
            {isInstituteAdmin && instituteName && (
              <div className="mb-2">
                <span className="text-lg font-semibold text-primary">
                  {instituteName}
                </span>
              </div>
            )}
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Manage your organization\'s institutes, batches, and user assignments'
                : 'Manage your institute\'s batches and user assignments'
              }
            </p>
          </div>

          <Tabs defaultValue={isAdmin ? "institutes" : "batches"} className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {isAdmin && (
                <TabsTrigger value="institutes" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Institutes</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="batches" className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Batches</span>
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User Assignments</span>
              </TabsTrigger>
            </TabsList>

            {isAdmin && (
              <TabsContent value="institutes">
                <InstituteManagement />
              </TabsContent>
            )}

            <TabsContent value="batches">
              <BatchManagement />
            </TabsContent>

            <TabsContent value="assignments">
              <UserAssignmentManagement />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}