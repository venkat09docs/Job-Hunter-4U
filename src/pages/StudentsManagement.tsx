import { StudentsManagement as StudentsManagementComponent } from '@/components/admin/StudentsManagement';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { useInstituteName } from '@/hooks/useInstituteName';
import { useRole } from '@/hooks/useRole';

export default function StudentsManagement() {
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
                {isInstituteAdmin ? `${instituteName} - Students Management` : 'Students Management'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isInstituteAdmin ? 'Manage students for your institute' : 'Manage students across all institutes and batches'}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <UserProfileDropdown />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6">
          <StudentsManagementComponent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}