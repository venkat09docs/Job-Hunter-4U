import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Github, Linkedin, Download, ExternalLink, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomLink {
  title: string;
  url: string;
  icon?: string;
}

interface PublicProfile {
  id: string;
  user_id: string;
  slug: string;
  profile_image_url: string | null;
  full_name: string;
  bio: string | null;
  video_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  blog_url: string | null;
  custom_links: CustomLink[];
  is_public: boolean;
}

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const fetchProfile = async () => {
    try {
    const { data, error } = await supabase
      .rpc('get_safe_public_profile', { profile_slug: slug });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      throw new Error('Profile not found');
    }

    // Transform RPC result to match component needs (omit sensitive fields)
    const transformedProfile: PublicProfile = {
      id: 'public',
      user_id: 'public',
      slug: row.slug,
      profile_image_url: row.profile_image_url ?? null,
      full_name: row.full_name,
      bio: row.bio ?? null,
      video_url: null, // intentionally not exposed publicly
      github_url: row.github_url ?? null,
      linkedin_url: row.linkedin_url ?? null,
      resume_url: null, // intentionally not exposed publicly
      blog_url: row.blog_url ?? null,
      custom_links: Array.isArray(row.custom_links)
        ? (row.custom_links as unknown as CustomLink[])
        : [],
      is_public: true,
    };

    setProfile(transformedProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Profile not found',
        description: 'The profile you are looking for does not exist or is not public.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (url: string, title: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    // Optional: Track analytics here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md mx-auto px-4">
          <div className="w-32 h-32 bg-muted rounded-full mx-auto"></div>
          <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
          <p className="text-muted-foreground">This profile doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Profile Header */}
        <div className="text-center space-y-6 mb-8">
          <Avatar className="w-32 h-32 mx-auto border-4 border-white/20 shadow-xl">
            <AvatarImage 
              src={profile.profile_image_url || undefined} 
              alt={profile.full_name}
              className="object-cover"
            />
            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
            {profile.bio && (
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                {profile.bio}
              </p>
            )}
            
            {/* Video Section - moved after bio */}
            {profile.video_url && (
              <div className="space-y-3">
                {!showVideo ? (
                  <Button 
                    onClick={() => setShowVideo(true)}
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white border-0 h-14 text-lg font-semibold shadow-lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Introduction Video
                  </Button>
                ) : (
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe 
                      src={profile.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Links Section */}
        <div className="space-y-4">
          {/* Main Action Links */}
          {profile.github_url && (
            <Button
              onClick={() => handleLinkClick(profile.github_url!, 'GitHub')}
              className="w-full bg-card hover:bg-card/80 text-foreground border border-border h-14 text-lg font-medium justify-start shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
              variant="outline"
            >
              <Github className="w-6 h-6 mr-4" />
              View GitHub Profile
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          )}

          {profile.linkedin_url && (
            <Button
              onClick={() => handleLinkClick(profile.linkedin_url!, 'LinkedIn')}
              className="w-full bg-card hover:bg-card/80 text-foreground border border-border h-14 text-lg font-medium justify-start shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
              variant="outline"
            >
              <Linkedin className="w-6 h-6 mr-4" />
              Connect on LinkedIn
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          )}

          {profile.resume_url && (
            <Button
              onClick={() => handleLinkClick(profile.resume_url!, 'Resume')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              <Download className="w-6 h-6 mr-4" />
              Download Resume
            </Button>
          )}

          {profile.blog_url && (
            <Button
              onClick={() => handleLinkClick(profile.blog_url!, 'Blog')}
              className="w-full bg-card hover:bg-card/80 text-foreground border border-border h-14 text-lg font-medium justify-start shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
              variant="outline"
            >
              <ExternalLink className="w-6 h-6 mr-4" />
              Read My Blog
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          )}

          {/* Custom Links */}
          {profile.custom_links && profile.custom_links.length > 0 && (
            <>
              {profile.custom_links.map((link, index) => (
                <Button
                  key={index}
                  onClick={() => handleLinkClick(link.url, link.title)}
                  className="w-full bg-card hover:bg-card/80 text-foreground border border-border h-14 text-lg font-medium justify-start shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
                  variant="outline"
                >
                  <ExternalLink className="w-6 h-6 mr-4" />
                  {link.title}
                  <ExternalLink className="w-4 h-4 ml-auto" />
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Create your own profile with JobSeeker Pro</p>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;