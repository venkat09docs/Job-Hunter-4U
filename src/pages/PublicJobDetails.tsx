import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building, 
  MapPin, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Mail,
  FileText,
  Award,
  Heart,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InternalJob } from "@/hooks/useInternalJobs";

const PublicJobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<InternalJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setJob(data as InternalJob);
      } catch (error) {
        console.error('Error fetching job:', error);
        toast({
          title: "Error",
          description: "Job not found or no longer available.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, toast]);

  const handleAuthRequired = async (action: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: `Please sign in to ${action}.`,
      });
      // Store the current URL to redirect back after sign in
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      navigate('/auth');
      return false;
    }
    return true;
  };

  const handleApplyNow = async () => {
    const canProceed = await handleAuthRequired("apply for this job");
    if (canProceed && job?.job_url) {
      window.open(job.job_url, '_blank');
    }
  };

  const handleAddToWishlist = async () => {
    const canProceed = await handleAuthRequired("add jobs to wishlist");
    if (!canProceed || !job) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setAddingToWishlist(true);

      // Check if job already exists in wishlist
      const { data: existingJob, error: checkError } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_name', job.company)
        .eq('job_title', job.title)
        .eq('status', 'wishlist')
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing job:', checkError);
        throw checkError;
      }

      if (existingJob) {
        toast({
          title: "Already in wishlist",
          description: `${job.title} is already in your wishlist.`,
        });
        return;
      }

      // Add to wishlist
      const { error: insertError } = await supabase
        .from('job_tracker')
        .insert({
          user_id: user.id,
          company_name: job.company || 'Unknown Company',
          job_title: job.title || 'Unknown Position',
          status: 'wishlist',
          application_date: new Date().toISOString().split('T')[0],
          job_url: job.job_url || '',
          location: job.location || '',
          notes: job.description ? job.description.substring(0, 500) + (job.description.length > 500 ? '...' : '') : '',
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Added to Wishlist",
        description: `${job.title} has been added to your job tracker.`,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error adding to wishlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <p className="text-muted-foreground">The job you're looking for is no longer available.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <Building className="h-5 w-5" />
              <span>{job.company}</span>
            </div>
          </div>

          {/* Company and Basic Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                )}

                {job.job_type && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <Badge variant="secondary">{job.job_type}</Badge>
                  </div>
                )}

                {job.experience_level && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <Badge variant="secondary">{job.experience_level}</Badge>
                  </div>
                )}

                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      {job.salary_min && job.salary_max 
                        ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                        : job.salary_min 
                        ? `$${job.salary_min.toLocaleString()}+`
                        : `Up to $${job.salary_max?.toLocaleString()}`
                      }
                    </span>
                  </div>
                )}

                {job.application_deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>
                      Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Job Description</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed pl-7 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Requirements</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7 whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Benefits</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-7 whitespace-pre-wrap">
                {job.benefits}
              </p>
            </div>
          )}

          {/* Contact Email */}
          {(job as any).email && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Contact</h3>
              <div className="flex items-center gap-2 text-muted-foreground pl-4">
                <Mail className="h-4 w-4" />
                <a 
                  href={`mailto:${(job as any).email}`}
                  className="hover:text-primary transition-colors"
                >
                  {(job as any).email}
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background py-4">
            {job.job_url && (
              <Button
                variant="default"
                className="flex-1"
                onClick={handleApplyNow}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleAddToWishlist}
              disabled={addingToWishlist}
            >
              {addingToWishlist ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              Add to Wishlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicJobDetails;
