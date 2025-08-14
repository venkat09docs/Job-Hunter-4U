import { StudentsManagement as StudentsManagementComponent } from '@/components/admin/StudentsManagement';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

export default function StudentsManagement() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold">Students Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage students across all institutes and batches
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