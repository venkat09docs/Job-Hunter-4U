import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InternalJobDetailsDialog } from "./InternalJobDetailsDialog";

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
  const [jobs, setJobs] = useState<InternalJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<InternalJob | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
          .limit(5);

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
        {[...Array(5)].map((_, i) => (
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
        {jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {job.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {job.job_type && (
                  <Badge variant="secondary" className="text-xs">
                    {job.job_type}
                  </Badge>
                )}
                {job.experience_level && (
                  <Badge variant="outline" className="text-xs">
                    {job.experience_level}
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => handleViewDetails(job)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Eye className="h-3 w-3 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedJob && (
        <InternalJobDetailsDialog
          job={selectedJob}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
};
