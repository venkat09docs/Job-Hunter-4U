import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail } from 'lucide-react';
import ManageSubscriptionDialog from '@/components/ManageSubscriptionDialog';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { validatePasswordStrength } from '@/lib/utils';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [industry, setIndustry] = useState<'IT' | 'Non-IT'>('IT');
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isSigningOut, hasLoggedOut } = useAuth();

  // Redirect authenticated users, but not if they're signing out or have just logged out
  useEffect(() => {
    if (!authLoading && user && !isSigningOut && !hasLoggedOut) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, isSigningOut, hasLoggedOut, navigate]);

  useEffect(() => {
    // Check if user came from pricing page
    const selectedPlan = sessionStorage.getItem('selectedPlan');
    if (selectedPlan) {
      // We'll show the plan dialog after successful login
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username || !industry) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields including industry selection",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password too weak",
        description: "Please choose a stronger password that meets all requirements.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
            full_name: username,
            'Display Name': username,
            industry: industry
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account exists',
            description: 'An account with this email already exists. Please sign in instead.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link to complete your registration.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid credentials',
            description: 'Please check your email and password and try again.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
        
        // Check if user came from pricing page
        const selectedPlan = sessionStorage.getItem('selectedPlan');
        if (selectedPlan) {
          sessionStorage.removeItem('selectedPlan');
          setShowPlanDialog(true);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Job Hunter Pro
          </h1>
          <p className="text-muted-foreground mt-2">
            Access your job hunting dashboard
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="hero"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password (min 12 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={12}
                    />
                    <PasswordStrengthMeter password={password} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-industry">Industry</Label>
                    <Select value={industry} onValueChange={(value: 'IT' | 'Non-IT') => setIndustry(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT (Information Technology)</SelectItem>
                        <SelectItem value="Non-IT">Non-IT (Other Industries)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="hero"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground"
              >
                ← Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ManageSubscriptionDialog 
        open={showPlanDialog} 
        onOpenChange={(open) => {
          setShowPlanDialog(open);
          if (!open) {
            navigate('/dashboard');
          }
        }} 
      />
    </div>
  );
};

export default Auth;