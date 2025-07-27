import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Eye } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

const customLinkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
});

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  resume_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  blog_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(50, 'Slug must be less than 50 characters'),
  custom_links: z.array(customLinkSchema).max(5, 'Maximum 5 custom links allowed'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CustomLink {
  title: string;
  url: string;
}

const EditProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      bio: '',
      video_url: '',
      github_url: '',
      linkedin_url: '',
      resume_url: '',
      blog_url: '',
      slug: '',
      custom_links: [],
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        form.reset({
          full_name: data.full_name || '',
          bio: data.bio || '',
          video_url: data.video_url || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          resume_url: data.resume_url || '',
          blog_url: data.blog_url || '',
          slug: data.slug || '',
          custom_links: Array.isArray(data.custom_links) 
            ? (data.custom_links as unknown as CustomLink[])
            : [],
        });
      } else {
        // No profile exists, generate a default slug from user email
        const defaultSlug = user?.email?.split('@')[0] || 'user';
        form.setValue('slug', defaultSlug);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error loading profile',
        description: 'Failed to load your profile data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const profileData = {
        user_id: user?.id,
        full_name: data.full_name,
        bio: data.bio || null,
        video_url: data.video_url || null,
        github_url: data.github_url || null,
        linkedin_url: data.linkedin_url || null,
        resume_url: data.resume_url || null,
        blog_url: data.blog_url || null,
        slug: data.slug,
        custom_links: data.custom_links,
        is_public: true,
      };

      const { error } = await supabase
        .from('public_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: error.message || 'Failed to save your profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addCustomLink = () => {
    const currentLinks = form.getValues('custom_links');
    if (currentLinks.length < 5) {
      form.setValue('custom_links', [...currentLinks, { title: '', url: '' }]);
    }
  };

  const removeCustomLink = (index: number) => {
    const currentLinks = form.getValues('custom_links');
    form.setValue('custom_links', currentLinks.filter((_, i) => i !== index));
  };

  const generateSlugFromName = () => {
    const name = form.getValues('full_name');
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    form.setValue('slug', slug);
  };

  const viewProfile = () => {
    const slug = form.getValues('slug');
    if (slug) {
      window.open(`/profile/${slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={viewProfile}
                  disabled={!form.getValues('slug')}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)} 
                  disabled={saving}
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-2xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Edit Public Profile</h1>
                <p className="text-muted-foreground">
                  Customize your public profile page that others can view and share.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Your name and profile details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile URL</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="your-unique-url" 
                                  {...field}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={generateSlugFromName}
                                  size="sm"
                                >
                                  Generate
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your profile will be available at: /profile/{field.value || 'your-url'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell people about yourself..." 
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A short description that appears under your name (max 500 characters)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="video_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Introduction Video</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://youtube.com/embed/..." 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              YouTube or Vimeo embed URL for an introduction video
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Social & Professional Links</CardTitle>
                      <CardDescription>
                        Connect your social media and professional profiles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="github_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="resume_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resume URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-resume-link.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="blog_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Blog/Website URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-blog.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Custom Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Links</CardTitle>
                      <CardDescription>
                        Add up to 5 custom links to showcase your work, portfolio, or other profiles
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.watch('custom_links').map((_, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <FormField
                            control={form.control}
                            name={`custom_links.${index}.title`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Link Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Portfolio" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`custom_links.${index}.url`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeCustomLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {form.watch('custom_links').length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addCustomLink}
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Custom Link
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EditProfile;