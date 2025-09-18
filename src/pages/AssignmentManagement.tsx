import { useRole } from '@/hooks/useRole';
import AssignmentManagementTab from '@/components/admin/AssignmentManagementTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AssignmentManagement = () => {
  const { isAdmin, isInstituteAdmin, loading } = useRole();

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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AssignmentManagementTab />
    </div>
  );
};

export default AssignmentManagement;