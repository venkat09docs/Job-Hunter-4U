import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';

interface InstituteAdminRedirectProps {
  children: React.ReactNode;
}

const InstituteAdminRedirect = ({ children }: InstituteAdminRedirectProps) => {
  const { isInstituteAdmin, loading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isInstituteAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isInstituteAdmin, loading, navigate]);

  // If loading or is institute admin (will redirect), don't render children
  if (loading || isInstituteAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default InstituteAdminRedirect;