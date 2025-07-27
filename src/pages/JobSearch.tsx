import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Briefcase, ExternalLink, Coins, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pricing from "@/components/Pricing";

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
  const { profile, updateTokens, refreshProfile, incrementAnalytics } = useProfile();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<SearchFilters>({
    jobTitle: "",
    location: "",
    experienceLevel: ""
  });
  
  const [searching, setSearching] = useState(false);
  const [jobResults, setJobResults] = useState<JobResult[]>([]);
  const [showPricing, setShowPricing] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  const REQUIRED_TOKENS = 2;
  const hasEnoughTokens = (profile?.tokens_remaining || 0) >= REQUIRED_TOKENS;

  const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (5+ years)" },
    { value: "executive", label: "Executive Level" }
  ];

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const logJobSearchToSupabase = async (searchQuery: SearchFilters, results: JobResult[]) => {
    try {
      const { error } = await supabase
        .from('job_searches')
        .insert({
          user_id: user?.id,
          search_query: searchQuery,
          results_count: results.length,
          results: results,
          searched_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging job search:', error);
      }
    } catch (error) {
      console.error('Error logging to Supabase:', error);
    }
  };

  const searchJobs = async () => {
    if (!user || !filters.jobTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a job title to search",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnoughTokens) {
      setShowPricing(true);
      return;
    }

    setSearching(true);

    try {
      // Call n8n webhook for job search
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: {
          jobTitle: filters.jobTitle,
          location: filters.location,
          experienceLevel: filters.experienceLevel,
          userId: user.id
        }
      });

      if (error) throw error;

      // Generate mock job results for demonstration
      const mockResults: JobResult[] = [
        {
          id: "1",
          title: filters.jobTitle,
          company: "TechCorp Inc.",
          location: filters.location || "Remote",
          description: "Exciting opportunity to work with cutting-edge technology...",
          salary: "$80,000 - $120,000",
          jobType: "Full-time",
          postedDate: "2 days ago",
          applyUrl: "https://example.com/apply/1"
        },
        {
          id: "2",
          title: `Senior ${filters.jobTitle}`,
          company: "Innovation Labs",
          location: filters.location || "New York, NY",
          description: "Join our team of experts and make a real impact...",
          salary: "$100,000 - $150,000",
          jobType: "Full-time",
          postedDate: "1 week ago",
          applyUrl: "https://example.com/apply/2"
        },
        {
          id: "3",
          title: `${filters.jobTitle} Specialist`,
          company: "StartupXYZ",
          location: filters.location || "San Francisco, CA",
          description: "Fast-paced startup environment with great growth opportunities...",
          salary: "$70,000 - $100,000",
          jobType: "Full-time",
          postedDate: "3 days ago",
          applyUrl: "https://example.com/apply/3"
        }
      ];

      setJobResults(mockResults);
      setLastSearchTime(new Date());

      // Log search to Supabase
      await logJobSearchToSupabase(filters, mockResults);

      // Deduct tokens and increment analytics
      await updateTokens((profile?.tokens_remaining || 0) - REQUIRED_TOKENS);
      await incrementAnalytics('job_search');
      await refreshProfile();

      toast({
        title: "Job search completed!",
        description: `Found ${mockResults.length} jobs. ${REQUIRED_TOKENS} tokens used.`,
      });

    } catch (error: any) {
      console.error('Error searching jobs:', error);
      toast({
        title: "Error searching jobs",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const isSearchDisabled = !filters.jobTitle.trim() || !hasEnoughTokens || searching;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Job Search</h1>
              <p className="text-muted-foreground">
                Find your next opportunity with AI-powered job matching
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {profile?.tokens_remaining || 0} tokens
              </span>
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
                Define your search criteria. Requires {REQUIRED_TOKENS} tokens per search.
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

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Cost per search:</span>
                  <Badge variant={hasEnoughTokens ? "default" : "destructive"}>
                    {REQUIRED_TOKENS} tokens
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  {!hasEnoughTokens && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPricing(true)}
                    >
                      Buy Tokens
                    </Button>
                  )}
                  
                  <Button
                    onClick={searchJobs}
                    disabled={isSearchDisabled}
                    className="min-w-32"
                  >
                    {searching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {searching ? "Searching..." : `Find Jobs (${REQUIRED_TOKENS} tokens)`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {jobResults.length > 0 && (
            <div className="space-y-4">
              <Separator />
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Job Results</h2>
                <div className="text-sm text-muted-foreground">
                  {jobResults.length} jobs found
                  {lastSearchTime && (
                    <span className="ml-2">
                      • Searched {lastSearchTime.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {jobResults.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                              {job.jobType && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  {job.jobType}
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex items-center gap-3">
                            {job.salary && (
                              <Badge variant="secondary">{job.salary}</Badge>
                            )}
                            {job.postedDate && (
                              <span className="text-xs text-muted-foreground">
                                Posted {job.postedDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button asChild>
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              Apply Now
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {jobResults.length === 0 && lastSearchTime && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or location
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