import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Link2, Briefcase, MapPin, DollarSign, Calendar, Mail, ArrowLeft, ExternalLink } from "lucide-react";

interface JobDetails {
  jobTitle: string | null;
  companyName: string | null;
  location: string | null;
  jobType: string | null;
  salary: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  applicationDeadline: string | null;
  contactEmail: string | null;
  applyLink: string | null;
}

const FetchJobDetails = () => {
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [isSingleJob, setIsSingleJob] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFetchJobDetails = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid job URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-job-with-gemini', {
        body: { jobUrl: jobUrl.trim() }
      });

      if (error) throw error;

      if (data.success) {
        setJobs(data.jobs || []);
        setIsSingleJob(data.isSingleJob || false);
        toast({
          title: "Success",
          description: `Successfully fetched ${data.jobs?.length || 0} job(s)`,
        });
      } else {
        throw new Error(data.error || "Failed to fetch job details");
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch job details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Fetch Job Details
            </h1>
            <p className="text-muted-foreground mt-1">
              Extract comprehensive job information from any job posting URL
            </p>
          </div>
        </div>

        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Enter Job URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://example.com/job-posting"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleFetchJobDetails}
                disabled={isLoading || !jobUrl.trim()}
                className="min-w-[150px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Job Details"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {jobs.length > 0 && (
          <div className="space-y-6 animate-fade-in">
            {!isSingleJob && jobs.length > 1 && (
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Found {jobs.length} Job Listings
                </Badge>
              </div>
            )}
            
            {jobs.map((jobDetails, index) => (
              <Card key={index} className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="space-y-4 pb-6">
                <div className="space-y-2">
                  {jobDetails.jobTitle && (
                    <h2 className="text-3xl font-bold text-primary">
                      {jobDetails.jobTitle}
                    </h2>
                  )}
                  {jobDetails.companyName && (
                    <p className="text-xl text-muted-foreground font-medium">
                      {jobDetails.companyName}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {jobDetails.location && (
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <MapPin className="h-4 w-4 mr-1" />
                      {jobDetails.location}
                    </Badge>
                  )}
                  {jobDetails.jobType && (
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {jobDetails.jobType}
                    </Badge>
                  )}
                  {jobDetails.salary && (
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {jobDetails.salary}
                    </Badge>
                  )}
                  {jobDetails.applicationDeadline && (
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <Calendar className="h-4 w-4 mr-1" />
                      {jobDetails.applicationDeadline}
                    </Badge>
                  )}
                  {jobDetails.contactEmail && (
                    <Badge variant="secondary" className="px-3 py-1.5">
                      <Mail className="h-4 w-4 mr-1" />
                      {jobDetails.contactEmail}
                    </Badge>
                  )}
                </div>

                {jobDetails.applyLink && (
                  <div className="mt-4">
                    <Button
                      onClick={() => window.open(jobDetails.applyLink!, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {jobDetails.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-primary">
                      Job Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {jobDetails.description}
                    </p>
                  </div>
                )}

                {jobDetails.responsibilities && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">
                        Key Responsibilities
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {jobDetails.responsibilities}
                      </p>
                    </div>
                  </>
                )}

                {jobDetails.requirements && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">
                        Requirements
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {jobDetails.requirements}
                      </p>
                    </div>
                  </>
                )}

                {jobDetails.benefits && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">
                        Benefits
                      </h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {jobDetails.benefits}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchJobDetails;
