import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Briefcase, ExternalLink, Loader2, Building2, Heart, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useJobApplicationActivities } from "@/hooks/useJobApplicationActivities";


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
  query: string;
  date_posted: string;
  job_requirements: string;
  country: string;
  language: string;
}

const JobSearch = () => {
  const { user } = useAuth();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { incrementActivity } = useJobApplicationActivities();
  

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    date_posted: "all",
    job_requirements: "",
    country: "",
    language: ""
  });
  
  const [savedJobs, setSavedJobs] = useState<SavedJobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [jobStatuses, setJobStatuses] = useState<Map<string, string>>(new Map());

  const jobRequirementOptions = [
    { value: "under_3_years_experience", label: "Under 3 years experience" },
    { value: "more_than_3_years_experience", label: "More than 3 years experience" },
    { value: "no_experience", label: "No experience" },
    { value: "no_degree", label: "No degree required" }
  ];

  const countryOptions = [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "uk", label: "United Kingdom" },
    { value: "de", label: "Germany" },
    { value: "fr", label: "France" },
    { value: "au", label: "Australia" },
    { value: "in", label: "India" }
  ];

  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" }
  ];

  const datePostedOptions = [
    { value: "all", label: "All time" },
    { value: "today", label: "Today" },
    { value: "3days", label: "Last 3 days" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" }
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
      
      // Load job statuses from job_tracker
      await loadJobStatuses();
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

  const loadJobStatuses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('job_tracker')
        .select('job_title, company_name, status')
        .eq('user_id', user.id);

      if (error) throw error;

      const statusMap = new Map<string, string>();
      data?.forEach(job => {
        // Create a key based on job title and company for matching
        const key = `${job.job_title?.toLowerCase()}-${job.company_name?.toLowerCase()}`;
        statusMap.set(key, job.status);
      });
      setJobStatuses(statusMap);
    } catch (error) {
      console.error('Error loading job statuses:', error);
    }
  };

  const filterSavedJobs = () => {
    if (!filters.query.trim() && !filters.date_posted && !filters.job_requirements && !filters.country && !filters.language) {
      return savedJobs;
    }

    return savedJobs.filter(job => {
      const queryMatch = !filters.query.trim() || 
        job.job_title.toLowerCase().includes(filters.query.toLowerCase()) ||
        job.employer_name.toLowerCase().includes(filters.query.toLowerCase()) ||
        job.job_location.toLowerCase().includes(filters.query.toLowerCase());
      
      const dateMatch = !filters.date_posted || filters.date_posted === "all" ||
        job.search_query?.date_posted === filters.date_posted;
      
      const requirementsMatch = !filters.job_requirements || 
        job.search_query?.job_requirements === filters.job_requirements;

      const countryMatch = !filters.country || 
        job.search_query?.country === filters.country;

      const languageMatch = !filters.language || 
        job.search_query?.language === filters.language;

      return queryMatch && dateMatch && requirementsMatch && countryMatch && languageMatch;
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

  const getJobStatus = (job: SavedJobResult): string | null => {
    const key = `${job.job_title?.toLowerCase()}-${job.employer_name?.toLowerCase()}`;
    return jobStatuses.get(key) || null;
  };

  const handleAddToWishlist = async (job: SavedJobResult) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add jobs to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    setAddingToWishlist(job.job_id);
    
    try {
      const { error } = await supabase
        .from('job_tracker')
        .insert({
          user_id: user.id,
          company_name: job.employer_name || 'Unknown Company',
          job_title: job.job_title || 'Unknown Position',
          status: 'wishlist',
          application_date: new Date().toISOString().split('T')[0],
          job_url: job.job_apply_link || '',
          salary_range: formatSalary(job) || '',
          location: job.job_location || '',
          notes: job.job_description ? job.job_description.substring(0, 500) + (job.job_description.length > 500 ? '...' : '') : '',
        });

      if (error) {
        throw error;
      }

      // Update job statuses
      await loadJobStatuses();

      // Track wishlist metric in Application Metrics
      try {
        await incrementActivity('save_potential_opportunities');
      } catch (e) {
        console.warn('Failed to increment wishlist activity metric', e);
      }
      
      toast({
        title: "Added to Wishlist",
        description: `${job.job_title} at ${job.employer_name} has been added to your job tracker.`,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error adding to wishlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAddingToWishlist(null);
    }
  };

  const handleApplyAndWishlist = async (job: SavedJobResult) => {
    // Add to wishlist first
    await handleAddToWishlist(job);
    
    // Then open the apply link
    if (job.job_apply_link) {
      window.open(job.job_apply_link, '_blank', 'noopener,noreferrer');
    }
  };

  // Check premium access
  if (!canAccessFeature('job_search')) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </header>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Job Search History</h1>
              <p className="text-muted-foreground">
                View and filter all job results from your searches
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <SubscriptionUpgrade featureName="job_search">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Premium Feature</CardTitle>
                  <CardDescription>
                    Job Search is a premium feature. Upgrade your plan to access job search and filtering capabilities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Upgrade Now</Button>
                </CardContent>
              </Card>
            </SubscriptionUpgrade>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Menu */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job Search History</h1>
            <p className="text-muted-foreground">
              View and filter all job results from your searches in "Find Your Next Role"
            </p>
          </div>
        </div>

          {/* Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Job Search Parameters
              </CardTitle>
              <CardDescription>
                Filter through your job search history using the same parameters as "Find Your Next Role"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="query">Search Query</Label>
                  <Input
                    id="query"
                    placeholder="e.g., developer jobs in chicago"
                    value={filters.query}
                    onChange={(e) => handleInputChange('query', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_posted">Date Posted</Label>
                  <Select value={filters.date_posted} onValueChange={(value) => handleInputChange('date_posted', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      {datePostedOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_requirements">Job Requirements</Label>
                  <Select value={filters.job_requirements} onValueChange={(value) => handleInputChange('job_requirements', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRequirementOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={filters.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={filters.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                <h2 className="text-2xl font-bold">Job Search History</h2>
                <div className="text-sm text-muted-foreground">
                  {filteredJobs.length} jobs found from your searches
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map((job) => {
                  const jobStatus = getJobStatus(job);
                  const isInTracker = jobStatus !== null;
                  const isWishlisted = jobStatus === 'wishlist';
                  const isApplied = jobStatus === 'applied' || jobStatus === 'applying' || jobStatus === 'interviewing' || jobStatus === 'negotiating';
                  
                  return (
                    <Card key={job.id} className={`hover:shadow-md transition-shadow ${isInTracker ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold">{job.job_title}</h3>
                                {isInTracker && (
                                  <Badge variant={isApplied ? "default" : "secondary"} className="text-xs">
                                    {jobStatus}
                                  </Badge>
                                )}
                              </div>
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

                          <div className="ml-4 flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddToWishlist(job)}
                              disabled={addingToWishlist === job.job_id || isInTracker}
                              className="flex items-center gap-2"
                            >
                              {addingToWishlist === job.job_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                              )}
                              {isInTracker ? (isWishlisted ? 'Wishlisted' : 'In Tracker') : 'Wishlist'}
                            </Button>
                            {job.job_apply_link && (
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => handleApplyAndWishlist(job)}
                                disabled={addingToWishlist === job.job_id}
                                className="flex items-center gap-2"
                              >
                                {addingToWishlist === job.job_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-4 w-4" />
                                )}
                                {isInTracker ? 'Apply' : 'Apply & Add to Tracker'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

        {/* No results message */}
        {filteredJobs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No job history found</h3>
            <p className="text-muted-foreground">
              Search for jobs in "Find Your Next Role" to build your job search history
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearch;