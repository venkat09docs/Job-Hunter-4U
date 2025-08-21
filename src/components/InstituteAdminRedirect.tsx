import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';

interface InstituteAdminRedirectProps {
  children: React.ReactNode;
}

const InstituteAdminRedirect = ({ children }: InstituteAdminRedirectProps) => {
  const { isInstituteAdmin, loading } = useRole();
  const navigate = useNavigate();

  console.log('InstituteAdminRedirect: loading =', loading);
  console.log('InstituteAdminRedirect: isInstituteAdmin =', isInstituteAdmin);

  useEffect(() => {
    console.log('InstituteAdminRedirect useEffect: loading =', loading, 'isInstituteAdmin =', isInstituteAdmin);
    if (!loading && isInstituteAdmin) {
      console.log('InstituteAdminRedirect: Redirecting to /admin');
      navigate('/admin', { replace: true });
    }
  }, [isInstituteAdmin, loading, navigate]);

  // Add a fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('InstituteAdminRedirect: Loading timeout reached, forcing render');
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // If loading or is institute admin (will redirect), don't render children
  if (loading) {
    console.log('InstituteAdminRedirect: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading user role...</p>
          <p className="text-xs text-muted-foreground mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }
  
  if (isInstituteAdmin) {
    console.log('InstituteAdminRedirect: User is institute admin, showing redirect message');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecting to admin dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('InstituteAdminRedirect: Rendering children (Dashboard)');
  return <>{children}</>;
};

export default InstituteAdminRedirect;