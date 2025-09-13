import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NotFound = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect after 5 seconds - to dashboard if logged in, otherwise to home
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-6 p-8 max-w-lg">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary">Oops! Something went wrong</h1>
          <p className="text-lg text-muted-foreground">
            We couldn't find the page you're looking for. Don't worry, it happens to the best of us!
          </p>
          <p className="text-sm text-muted-foreground">
            You'll be automatically redirected to our home page in a few seconds.
          </p>
        </div>
        
        <Button 
          onClick={() => user ? navigate('/dashboard') : navigate('/')} 
          className="inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          {user ? 'Take me to dashboard' : 'Take me home now'}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
