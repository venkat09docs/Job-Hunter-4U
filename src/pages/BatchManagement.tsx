import { BatchManagement as BatchManagementComponent } from '@/components/admin/BatchManagement';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { InstituteSubscriptionBadge } from '@/components/InstituteSubscriptionBadge';
import { useInstituteName } from '@/hooks/useInstituteName';
import { useRole } from '@/hooks/useRole';

export default function BatchManagement() {
  const { instituteName } = useInstituteName();
  const { isInstituteAdmin } = useRole();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold">
                {isInstituteAdmin ? `${instituteName} - Batch Management` : 'Batch Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isInstituteAdmin ? 'Manage batches for your institute' : 'Manage batches across all institutes'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <InstituteSubscriptionBadge />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6">
          <BatchManagementComponent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}