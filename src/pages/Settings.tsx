import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, User, Upload, X, Calendar, CreditCard, Link } from 'lucide-react';
import { ResizableLayout } from '@/components/ResizableLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscriptionStatus, SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const professionalDetailsSchema = z.object({
  bio_link_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  digital_profile_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  github_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  leetcode_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

const usernameSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
type ProfessionalDetailsFormData = z.infer<typeof professionalDetailsSchema>;
type UsernameFormData = z.infer<typeof usernameSchema>;

const Settings = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { canAccessFeature } = usePremiumFeatures();
  
  const hasActiveSubscription = () => {
    return profile?.subscription_active && 
           profile?.subscription_end_date && 
           new Date(profile.subscription_end_date) > new Date();
  };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savingProfessionalDetails, setSavingProfessionalDetails] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

  const professionalForm = useForm<ProfessionalDetailsFormData>({
    resolver: zodResolver(professionalDetailsSchema),
    defaultValues: {
      bio_link_url: profile?.bio_link_url || '',
      digital_profile_url: profile?.digital_profile_url || '',
      linkedin_url: profile?.linkedin_url || '',
      github_url: profile?.github_url || '',
      leetcode_url: profile?.leetcode_url || '',
    },
  });

  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: profile?.username || '',
    },
  });

  // Update forms when profile data loads
  useEffect(() => {
    if (profile) {
      professionalForm.reset({
        bio_link_url: profile.bio_link_url || '',
        digital_profile_url: profile.digital_profile_url || '',
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        leetcode_url: profile.leetcode_url || '',
      });
      const currentUsername = profile.username || '';
      setOriginalUsername(currentUsername);
      usernameForm.reset({
        username: currentUsername,
      });
    }
  }, [profile, professionalForm, usernameForm]);

  const onSubmit = async (data: PasswordResetFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: avatarUrl } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setImagePreview(avatarUrl);
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload profile picture.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = async () => {
    if (!user) return;

    setUploadingImage(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_image_url: null } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setImagePreview(null);
      toast({
        title: 'Profile picture removed',
        description: 'Your profile picture has been removed.',
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onUsernameSubmit = async (data: UsernameFormData) => {
    if (!user) return;

    setSavingUsername(true);
    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', data.username)
        .neq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existingUser) {
        toast({
          title: 'Username unavailable',
          description: 'This username is already taken. Please choose another one.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: data.username } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setOriginalUsername(data.username);
      toast({
        title: 'Username updated',
        description: 'Your username has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update username.',
        variant: 'destructive',
      });
    } finally {
      setSavingUsername(false);
    }
  };

  const onProfessionalDetailsSubmit = async (data: ProfessionalDetailsFormData) => {
    if (!user) return;

    setSavingProfessionalDetails(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio_link_url: data.bio_link_url || null,
          digital_profile_url: data.digital_profile_url || null,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          leetcode_url: data.leetcode_url || null,
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Professional details updated',
        description: 'Your professional links have been successfully saved.',
      });
    } catch (error: any) {
      console.error('Error updating professional details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update professional details.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfessionalDetails(false);
    }
  };

  return (
    <ResizableLayout>
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="gap-2 hidden sm:flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
              <div className="hidden sm:flex">
                <SubscriptionStatus />
              </div>
              <UserProfileDropdown />
            </div>
          </div>
        </header>

          {/* Main Content */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences.
                </p>
              </div>

              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Picture
                  </CardTitle>
                  <CardDescription>
                    Upload and manage your profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={imagePreview || profile?.profile_image_url || ""} />
                      <AvatarFallback className="text-lg">
                        {profile?.username?.substring(0, 2).toUpperCase() || 
                         user?.email?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <label htmlFor="avatar-upload">
                          <Button 
                            type="button" 
                            disabled={uploadingImage} 
                            className="gap-2"
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4" />
                              {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </span>
                          </Button>
                        </label>
                        {(imagePreview || profile?.profile_image_url) && (
                          <Button 
                            variant="outline" 
                            onClick={removeImage} 
                            disabled={uploadingImage}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. Max file size 5MB.
                      </p>
                    </div>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </CardContent>
              </Card>

              {/* Username */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Username
                  </CardTitle>
                  <CardDescription>
                    Change your unique username
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...usernameForm}>
                    <form onSubmit={usernameForm.handleSubmit(onUsernameSubmit)} className="space-y-4">
                      <FormField
                        control={usernameForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Username can only contain letters, numbers, and underscores
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={savingUsername || usernameForm.watch('username') === originalUsername} 
                        className="gap-2"
                      >
                        <User className="h-4 w-4" />
                        {savingUsername ? 'Saving...' : 'Update Username'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Professional Details
                  </CardTitle>
                  <CardDescription>
                    Configure your professional links and URLs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...professionalForm}>
                    <form onSubmit={professionalForm.handleSubmit(onProfessionalDetailsSubmit)} className="space-y-4">
                      <FormField
                        control={professionalForm.control}
                        name="bio_link_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio Link URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://your-bio-link.com" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={professionalForm.control}
                        name="digital_profile_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Digital Profile URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://your-digital-profile.com" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={professionalForm.control}
                        name="linkedin_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://www.linkedin.com/in/your-profile" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={professionalForm.control}
                        name="github_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://github.com/your-username" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={professionalForm.control}
                        name="leetcode_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LeetCode URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://leetcode.com/your-username" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={savingProfessionalDetails} className="gap-2">
                        <Link className="h-4 w-4" />
                        {savingProfessionalDetails ? 'Saving...' : 'Save Professional Details'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Subscription Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Subscription Status
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription and access to premium features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        Access all premium features with your active subscription
                      </p>
                      <SubscriptionStatus />
                    </div>
                    <SubscriptionUpgrade featureName="premium features">
                      <Button 
                        variant="premium" 
                        size="sm"
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        {hasActiveSubscription() ? 'Manage Plan' : 'View Plans'}
                      </Button>
                    </SubscriptionUpgrade>
                  </div>
                </CardContent>
              </Card>

              {/* Password Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password Reset
                  </CardTitle>
                  <CardDescription>
                    Send a password reset link to your email address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={loading} className="gap-2">
                        <Key className="h-4 w-4" />
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
      </main>
    </ResizableLayout>
  );
};

export default Settings;