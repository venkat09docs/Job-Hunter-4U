import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InternalJobDetailsDialog } from "./InternalJobDetailsDialog";
import { useSubscription } from "./SubscriptionUpgrade";
import PricingDialog from "@/components/PricingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown } from "lucide-react";

interface InternalJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  description: string;
  requirements: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  job_url?: string;
  created_at: string;
  posted_by: string;
  is_active: boolean;
  email?: string;
}

export const LatestInternalJobs = () => {
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [jobs, setJobs] = useState<InternalJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<InternalJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUpgradePricingDialog, setShowUpgradePricingDialog] = useState(false);

  useEffect(() => {
    const fetchLatestJobs = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setJobs(data || []);
      } catch (error) {
        console.error('Error fetching latest internal jobs:', error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestJobs();
  }, [user]);

  const handleViewDetails = (job: InternalJob) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No internal job opportunities available at the moment.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job, index) => {
          // Cycle through different accent colors for variety
          const accentColors = [
            { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-primary' },
            { bg: 'bg-purple/10', icon: 'text-purple', border: 'border-l-purple' },
            { bg: 'bg-info/10', icon: 'text-info', border: 'border-l-info' },
          ];
          const colorScheme = accentColors[index % accentColors.length];

          return (
            <Card 
              key={job.id} 
              className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 ${colorScheme.border} bg-gradient-to-br from-card to-muted/20`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`${colorScheme.bg} p-2 rounded-lg`}>
                    <Briefcase className={`h-5 w-5 ${colorScheme.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {job.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className={`h-3 w-3 ${colorScheme.icon}`} />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className={`h-3 w-3 ${colorScheme.icon}`} />
                    <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {job.job_type && (
                    <Badge variant="secondary" className="text-xs bg-emerald/15 text-emerald border-emerald/20">
                      {job.job_type}
                    </Badge>
                  )}
                  {job.experience_level && (
                    <Badge variant="outline" className="text-xs border-amber text-amber">
                      {job.experience_level}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => handleViewDetails(job)}
                  variant="outline"
                  size="sm"
                  className={`w-full ${colorScheme.border} hover:${colorScheme.bg} hover:${colorScheme.icon} transition-colors`}
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedJob && (
        <InternalJobDetailsDialog
          job={selectedJob}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          hasActiveSubscription={hasActiveSubscription}
          onUpgradeClick={() => setShowUpgradePricingDialog(true)}
        />
      )}

      {/* Upgrade Pricing Dialog for Premium Features */}
      <Dialog open={showUpgradePricingDialog} onOpenChange={setShowUpgradePricingDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Upgrade to Premium
            </DialogTitle>
          </DialogHeader>
          <div className="mb-6">
            <p className="text-muted-foreground text-center">
              Unlock wishlist and sharing features to better manage your job search. Choose a plan that works for you:
            </p>
          </div>
          <PricingDialog />
        </DialogContent>
      </Dialog>
    </>
  );
};
