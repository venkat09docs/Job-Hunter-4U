import { useState } from 'react';
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
import { ArrowLeft, Key, User, Upload, X, Calendar, CreditCard } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscriptionStatus } from '@/components/SubscriptionUpgrade';
import { SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';

const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

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

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: user?.email || '',
    },
  });

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;