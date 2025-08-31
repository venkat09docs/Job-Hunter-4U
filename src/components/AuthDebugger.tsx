import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthDebugger = () => {
  const { user, session, loading, isEmailVerified } = useAuth();

  if (loading) {
    return <div>Loading auth debug info...</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🔍 Auth Debug Info</CardTitle>
        <CardDescription>Current authentication and verification status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>User Status:</strong>
          <Badge variant={user ? "default" : "destructive"} className="ml-2">
            {user ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        <div>
          <strong>Email Verified Status:</strong>
          <Badge variant={isEmailVerified ? "default" : "destructive"} className="ml-2">
            {isEmailVerified ? "Verified" : "NOT Verified"}
          </Badge>
        </div>

        {user && (
          <>
            <div>
              <strong>User Email:</strong> {user.email}
            </div>
            
            <div>
              <strong>email_confirmed_at:</strong> 
              <Badge variant={user.email_confirmed_at ? "default" : "destructive"} className="ml-2">
                {user.email_confirmed_at || "NULL"}
              </Badge>
            </div>
            
            <div>
              <strong>confirmed_at:</strong> 
              <Badge variant={user.confirmed_at ? "default" : "destructive"} className="ml-2">
                {user.confirmed_at || "NULL"}
              </Badge>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <strong>Full User Object:</strong>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};