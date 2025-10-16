import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Loader2
} from "lucide-react";
import type { InternalJob } from "@/hooks/useInternalJobs";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InternalJobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: InternalJob | null;
}

export const InternalJobDetailsDialog = ({
  open,
  onOpenChange,
  job
}: InternalJobDetailsDialogProps) => {
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const { toast } = useToast();

  if (!job) return null;

  const handleAddToWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to add jobs to your wishlist.",
          variant: "destructive",
        });
        return;
      }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company and Basic Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5 text-primary" />
                <span className="font-semibold">{job.company}</span>
              </div>

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
          <div className="flex gap-3 pt-4 border-t">
            {job.job_url && (
              <Button
                variant="default"
                className="flex-1"
                onClick={() => window.open(job.job_url, '_blank')}
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
      </DialogContent>
    </Dialog>
  );
};
