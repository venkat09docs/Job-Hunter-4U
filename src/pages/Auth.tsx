import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import ManageSubscriptionDialog from '@/components/ManageSubscriptionDialog';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { validatePasswordStrength } from '@/lib/utils';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [industry, setIndustry] = useState<'IT' | 'Non-IT' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isSigningOut, hasLoggedOut } = useAuth();

  // Get affiliate referral code from URL
  const affiliateCode = searchParams.get('ref');

  // Redirect authenticated and verified users, but not if they're signing out or have just logged out
  useEffect(() => {
    if (!authLoading && user && !isSigningOut && !hasLoggedOut) {
      // Only redirect if email is verified
      const isVerified = user.email_confirmed_at !== null;
      if (isVerified) {
      // Always redirect to dashboard by default
      navigate('/dashboard', { replace: true });
      }
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
        description: "Please fill in all fields",
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
      // First, check if email already exists by attempting to get user data
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: 'Account Already Exists',
          description: 'An account with this email address already exists. Please use the Sign In tab instead.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Prepare user metadata with affiliate code if present
      const userData: any = {
        username: username,
        full_name: username,
        'Display Name': username,
        industry: industry
      };
      
      // Add affiliate code to metadata if user came from referral link
      if (affiliateCode) {
        userData.affiliate_code = affiliateCode;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        // Handle various "user already exists" error scenarios
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered') ||
            error.message.includes('already exists') ||
            error.message.toLowerCase().includes('user already')) {
          toast({
            title: 'Account Already Exists',
            description: 'An account with this email address already exists. Please use the Sign In tab instead.',
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Password reset email sent',
          description: 'Check your email for a link to reset your password.',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
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
            Career Level Up
          </h1>
          <p className="text-muted-foreground mt-2">
            Level up your career with our comprehensive growth platform
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
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
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
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot your password?
                    </Button>
                  </div>
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
                    <Label htmlFor="signup-industry">Industry</Label>
                    <Select value={industry} onValueChange={(value: 'IT' | 'Non-IT') => setIndustry(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">Information Technology</SelectItem>
                        <SelectItem value="Non-IT">Non-IT Industries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <PasswordStrengthMeter password={password} />
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
      
      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForgotPassword(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
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