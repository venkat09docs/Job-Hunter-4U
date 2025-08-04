import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Briefcase, ExternalLink, Calendar, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pricing from "@/components/Pricing";

interface SavedJobResult {
  id: string;
  job_id: string;
  job_title: string;
  employer_name: string;
  job_location: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_employment_type?: string;
  search_query: any;
  created_at: string;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
  applyUrl: string;
}

interface SearchFilters {
  jobTitle: string;
  location: string;
  experienceLevel: string;
}

const JobSearch = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription, refreshProfile, incrementAnalytics } = useProfile();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<SearchFilters>({
    jobTitle: "",
    location: "",
    experienceLevel: ""
  });
  
  const [searching, setSearching] = useState(false);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPricing, setShowPricing] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  const hasValidSubscription = hasActiveSubscription();

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (5+ years)" },
    { value: "executive", label: "Executive Level" }
  ];

  const loadSavedJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedJobs(data || []);
    } catch (error) {
      console.error('Error loading saved jobs:', error);
      toast({
        title: "Error loading jobs",
        description: "Could not load your saved job results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSavedJobs = () => {
    if (!filters.jobTitle.trim() && !filters.location.trim() && !filters.experienceLevel) {
      return savedJobs;
    }

    return savedJobs.filter(job => {
      const titleMatch = !filters.jobTitle.trim() || 
        job.job_title.toLowerCase().includes(filters.jobTitle.toLowerCase());
      
      const locationMatch = !filters.location.trim() || 
        job.job_location.toLowerCase().includes(filters.location.toLowerCase());
      
      // For experience level, we would need to check the search_query
      const experienceMatch = !filters.experienceLevel || 
        job.search_query?.job_requirements === filters.experienceLevel;

      return titleMatch && locationMatch && experienceMatch;
    });
  };

  const formatSalary = (job: SavedJobResult) => {
    if (job.job_min_salary && job.job_max_salary) {
      return `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`;
    } else if (job.job_min_salary) {
      return `$${job.job_min_salary.toLocaleString()}+${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`;
    } else if (job.job_max_salary) {
      return `Up to $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`;
    }
    return null;
  };

  useEffect(() => {
    if (user) {
      loadSavedJobs();
    }
  }, [user]);

  const filteredJobs = filterSavedJobs();

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Job Search</h1>
              <p className="text-muted-foreground">
                View and filter your saved job results from "Find Your Next Role"
              </p>
            </div>
            
          </div>

          {/* Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Filters
              </CardTitle>
              <CardDescription>
                Filter through your saved job results from searches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Software Engineer"
                    value={filters.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY or Remote"
                    value={filters.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select value={filters.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4">
                <Button
                  onClick={loadSavedJobs}
                  disabled={loading}
                  className="min-w-32"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Loading..." : "Refresh Jobs"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Job Results */}
          {filteredJobs.length > 0 && (
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Saved Job Results</h2>
                <div className="text-sm text-muted-foreground">
                  {filteredJobs.length} jobs found from your searches
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold">{job.job_title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.employer_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.job_location}
                              </div>
                              {job.job_employment_type && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  {job.job_employment_type}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.job_description}
                          </p>

                          <div className="flex items-center gap-3">
                            {formatSalary(job) && (
                              <Badge variant="secondary">{formatSalary(job)}</Badge>
                            )}
                            {job.job_posted_at && (
                              <span className="text-xs text-muted-foreground">
                                Posted {job.job_posted_at}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Saved {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4">
                          {job.job_apply_link && (
                            <Button asChild>
                              <a
                                href={job.job_apply_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                Apply Now
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {filteredJobs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No saved jobs found</h3>
              <p className="text-muted-foreground">
                Search for jobs in "Find Your Next Role" to see them here
              </p>
            </div>
          )}
        </div>

        {/* Pricing Modal */}
        <Dialog open={showPricing} onOpenChange={setShowPricing}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Tokens</DialogTitle>
            </DialogHeader>
            <Pricing />
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default JobSearch;