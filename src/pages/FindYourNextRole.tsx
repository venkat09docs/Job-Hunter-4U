import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Building, Clock, ExternalLink, Heart, ArrowLeft, Save, FolderOpen, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useInternalJobs, type InternalJob } from "@/hooks/useInternalJobs";

interface JobResult {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_location: string;
  job_posted_at: string;
  job_apply_link: string;
  job_description: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
}

interface JobSearchForm {
  query: string;
  num_pages: string;
  date_posted: string;
  country: string;
  language: string;
  job_requirements: string;
}

interface SavedJobSearch {
  id: string;
  name: string;
  search_criteria: JobSearchForm;
  created_at: string;
}

interface LinkedInJobSearchForm {
  title: string;
  location: string;
  type: string;
  remote: boolean;
  industry: string;
  seniority: string;
  external_apply: boolean;
  directapply: boolean;
}

const FindYourNextRole = () => {
  const { user } = useAuth();
  const { incrementAnalytics } = useProfile();
  const { jobs: internalJobs, loading: internalJobsLoading, filters: internalFilters, updateFilter, clearFilters } = useInternalJobs();
  const [formData, setFormData] = useState<JobSearchForm>({
    query: "developer jobs in chicago",
    num_pages: "1",
    date_posted: "all",
    country: "us",
    language: "en",
    job_requirements: "under_3_years_experience"
  });
  const [linkedInFormData, setLinkedInFormData] = useState<LinkedInJobSearchForm>({
    title: "",
    location: '"United States" OR "United Kingdom"',
    type: "FULL_TIME",
    remote: false,
    industry: "",
    seniority: "",
    external_apply: false,
    directapply: false
  });
  const [activeTab, setActiveTab] = useState("regular-search");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [wishlistedJobs, setWishlistedJobs] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<SavedJobSearch[]>([]);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkedInInputChange = (field: string, value: string | boolean) => {
    setLinkedInFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkedInSubmit = async () => {
    setLoading(true);
    setJobs([]);

    try {
      // Track job search analytics
      await incrementAnalytics('job_search');

      const { data, error } = await supabase.functions.invoke('linkedin-job-search', {
        body: {
          title: linkedInFormData.title,
          location: linkedInFormData.location,
          type: linkedInFormData.type,
          remote: linkedInFormData.remote,
          industry: linkedInFormData.industry,
          seniority: linkedInFormData.seniority,
          external_apply: linkedInFormData.external_apply,
          directapply: linkedInFormData.directapply
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.success && data.data && data.data.jobs) {
        if (data.data.jobs.length === 0) {
          // Display no results message
          toast({
            title: "No LinkedIn jobs found",
            description: "No job opportunities found matching your criteria. Try adjusting your search parameters.",
          });
          setJobs([]);
        } else {
          setJobs(data.data.jobs);
          
          // Save all job results to database
          await saveJobResultsToDatabase(data.data.jobs, {
            query: `LinkedIn: ${linkedInFormData.title}`,
            num_pages: "1",
            date_posted: "24hrs",
            country: linkedInFormData.location,
            language: "en",
            job_requirements: linkedInFormData.seniority || "any"
          });
          
          toast({
            title: "LinkedIn jobs found successfully",
            description: `Found ${data.data.jobs.length} LinkedIn job opportunities for you.`,
          });
        }
      } else {
        // No data received or empty response
        setJobs([]);
        toast({
          title: "No LinkedIn jobs found",
          description: "No job opportunities found matching your criteria. Try adjusting your search parameters.",
        });
      }
    } catch (error) {
      console.error('Error searching LinkedIn jobs:', error);
      setJobs([]);
      toast({
        title: "LinkedIn search unavailable",
        description: "LinkedIn job search is temporarily unavailable. Please try the regular job search or try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveJobResultsToDatabase = async (jobResults: JobResult[], searchForm: JobSearchForm) => {
    if (!user) return;

    try {
      const jobData = jobResults.map(job => ({
        user_id: user.id,
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        job_location: job.job_location || '',
        job_description: job.job_description || '',
        job_apply_link: job.job_apply_link || '',
        job_posted_at: job.job_posted_at || '',
        job_min_salary: job.job_min_salary || null,
        job_max_salary: job.job_max_salary || null,
        job_salary_period: job.job_salary_period || null,
        job_employment_type: '', // Add this if available in the job data
        search_query: {
          query: searchForm.query,
          num_pages: searchForm.num_pages,
          date_posted: searchForm.date_posted,
          country: searchForm.country,
          language: searchForm.language,
          job_requirements: searchForm.job_requirements
        }
      }));

      // Use upsert to prevent duplicates based on user_id and job_id
      const { error } = await supabase
        .from('job_results')
        .upsert(jobData, { 
          onConflict: 'user_id,job_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving job results:', error);
        // Don't show error to user as this is background operation
      }
    } catch (error) {
      console.error('Error saving job results:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setJobs([]);

    try {
      // Track job search analytics
      await incrementAnalytics('job_search');

      const { data, error } = await supabase.functions.invoke('job-search', {
        body: {
          query: formData.query,
          num_pages: parseInt(formData.num_pages),
          date_posted: formData.date_posted,
          country: formData.country,
          language: formData.language,
          job_requirements: formData.job_requirements
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.success && data.data && data.data.jobs) {
        if (data.data.jobs.length === 0) {
          // Display no results message
          toast({
            title: "No jobs found",
            description: "No job opportunities found matching your criteria. Try adjusting your search parameters.",
          });
          setJobs([]);
        } else {
          setJobs(data.data.jobs);
          
          // Save all job results to database
          await saveJobResultsToDatabase(data.data.jobs, formData);
          
          toast({
            title: "Jobs found successfully",
            description: `Found ${data.data.jobs.length} job opportunities for you.`,
          });
        }
      } else {
        // No data received or empty response
        setJobs([]);
        toast({
          title: "No jobs found",
          description: "No job opportunities found matching your criteria. Try adjusting your search parameters.",
        });
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      setJobs([]);
      toast({
        title: "Error searching jobs",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWishlist = async (job: JobResult) => {
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
          salary_range: job.job_min_salary && job.job_max_salary 
            ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
            : job.job_min_salary 
            ? `$${job.job_min_salary.toLocaleString()}+${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
            : job.job_max_salary
            ? `Up to $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
            : '',
          location: job.job_location || '',
          notes: job.job_description ? job.job_description.substring(0, 500) + (job.job_description.length > 500 ? '...' : '') : '',
        });

      if (error) {
        throw error;
      }

      // Add to wishlist state
      setWishlistedJobs(prev => new Set([...prev, job.job_id]));
      
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

  const handleApply = (job: JobResult) => {
    if (job.job_apply_link) {
      window.open(job.job_apply_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleApplyAndWishlist = async (job: JobResult) => {
    // Add to wishlist first
    await handleAddToWishlist(job);
    
    // Then open the apply link
    if (job.job_apply_link) {
      window.open(job.job_apply_link, '_blank', 'noopener,noreferrer');
    }
  };

  const fetchSavedSearches = async () => {
    if (!user) return;
    
    setLoadingSavedSearches(true);
    try {
      const { data, error } = await supabase
        .from('saved_job_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSavedSearches((data || []).map(item => ({
        id: item.id,
        name: item.name,
        search_criteria: item.search_criteria as unknown as JobSearchForm,
        created_at: item.created_at
      })));
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast({
        title: "Error loading saved searches",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingSavedSearches(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!user || !saveSearchName.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a name for your search.",
        variant: "destructive",
      });
      return;
    }

    setSavingSearch(true);
    try {
      const { error } = await supabase
        .from('saved_job_searches')
        .insert({
          user_id: user.id,
          name: saveSearchName.trim(),
          search_criteria: formData as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Search saved successfully",
        description: `"${saveSearchName}" has been saved for future use.`,
      });

      setSaveSearchName("");
      setShowSaveDialog(false);
      fetchSavedSearches(); // Refresh the list
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error saving search",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSavingSearch(false);
    }
  };

  const handleLoadSearch = (savedSearch: SavedJobSearch) => {
    setFormData(savedSearch.search_criteria);
    setShowLoadDialog(false);
    toast({
      title: "Search loaded",
      description: `Loaded search criteria: "${savedSearch.name}"`,
    });
  };

  const handleDeleteSavedSearch = async (searchId: string, searchName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_job_searches')
        .delete()
        .eq('id', searchId);

      if (error) {
        throw error;
      }

      toast({
        title: "Search deleted",
        description: `"${searchName}" has been deleted.`,
      });

      fetchSavedSearches(); // Refresh the list
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error deleting search",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const renderNoResultsMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Records Found</h3>
      <p className="text-muted-foreground max-w-md">
        We couldn't find any job opportunities matching your search criteria. 
        Try adjusting your search parameters or check back later for new listings.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Find Your Next Role
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Find Your Next Role</h2>
            <p className="text-muted-foreground mt-2">
              Search for job opportunities that match your skills and preferences
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="regular-search">Find Your Next Role</TabsTrigger>
              <TabsTrigger value="linkedin-jobs">LinkedIn - 24 Hrs Jobs</TabsTrigger>
              <TabsTrigger value="internal-jobs">Internal Jobs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="regular-search" className="space-y-6">
              <Card>
          <CardHeader>
            <CardTitle>Job Search Parameters</CardTitle>
            <CardDescription>
              Enter your search criteria to find relevant job opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  value={formData.query}
                  onChange={(e) => handleInputChange('query', e.target.value)}
                  placeholder="e.g., developer jobs in chicago"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_posted">Date Posted</Label>
                <Select value={formData.date_posted} onValueChange={(value) => handleInputChange('date_posted', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="3days">Last 3 days</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_requirements">Job Requirements</Label>
                <Select value={formData.job_requirements} onValueChange={(value) => handleInputChange('job_requirements', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_3_years_experience">Under 3 years experience</SelectItem>
                    <SelectItem value="more_than_3_years_experience">More than 3 years experience</SelectItem>
                    <SelectItem value="no_experience">No experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ie">Ireland</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="in">India</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_pages">Number of Records (Ex: 1 = 10, 2 = 20)</Label>
                <Input
                  id="num_pages"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.num_pages}
                  onChange={(e) => handleInputChange('num_pages', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="flex-1 md:flex-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Find Your Next Role"
                )}
              </Button>

              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none">
                    <Save className="mr-2 h-4 w-4" />
                    Save Search
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Search Criteria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search-name">Search Name</Label>
                      <Input
                        id="search-name"
                        value={saveSearchName}
                        onChange={(e) => setSaveSearchName(e.target.value)}
                        placeholder="e.g., Frontend Developer Jobs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveSearch}
                        disabled={savingSearch || !saveSearchName.trim()}
                        className="flex-1"
                      >
                        {savingSearch ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSaveDialog(false);
                          setSaveSearchName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showLoadDialog} onOpenChange={(open) => {
                setShowLoadDialog(open);
                if (open) fetchSavedSearches();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Load Search
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Load Saved Search</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {loadingSavedSearches ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading saved searches...</span>
                      </div>
                    ) : savedSearches.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No saved searches found. Save your current search criteria first.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {savedSearches.map((savedSearch) => (
                          <div 
                            key={savedSearch.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium">{savedSearch.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Query: {savedSearch.search_criteria.query}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Saved: {new Date(savedSearch.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleLoadSearch(savedSearch)}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteSavedSearch(savedSearch.id, savedSearch.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
              </CardContent>
            </Card>

            {jobs.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Job Results ({jobs.length} found)
                  </h2>
                  <div className="space-y-4">
                    {jobs.map((job, index) => (
                      <Card key={job.job_id || index} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6" onClick={() => setSelectedJob(job)}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-2">
                                {job.job_title}
                              </h3>
                              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {job.employer_name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.job_location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {job.job_posted_at}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAddToWishlist(job)}
                                disabled={addingToWishlist === job.job_id}
                                className="flex items-center gap-2"
                              >
                                {addingToWishlist === job.job_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Heart className={`h-4 w-4 ${wishlistedJobs.has(job.job_id) ? 'fill-red-500 text-red-500' : ''}`} />
                                )}
                                Wishlist
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
                            Apply & Add to Tracker
                          </Button>
                        )}
                            </div>
                          </div>
                          
                          {(job.job_min_salary || job.job_max_salary) && (
                            <div className="mb-3">
                              <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                {job.job_min_salary && job.job_max_salary 
                                  ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                  : job.job_min_salary 
                                  ? `$${job.job_min_salary.toLocaleString()}+${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                  : `$${job.job_max_salary?.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                }
                              </span>
                            </div>
                          )}
                          
                          {job.job_description && (
                            <p className="text-muted-foreground text-sm line-clamp-3">
                              {job.job_description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
              </div>
            ) : !loading && activeTab === "regular-search" && (
                <Card>
                  <CardContent className="p-6">
                    {renderNoResultsMessage()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="linkedin-jobs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn 24 Hours Jobs Search</CardTitle>
                  <CardDescription>
                    Search for recent LinkedIn job postings with advanced filtering options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin-title">Job Title *</Label>
                      <Input
                        id="linkedin-title"
                        value={linkedInFormData.title}
                        onChange={(e) => handleLinkedInInputChange('title', e.target.value)}
                        placeholder="Ex: Data Engineer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-location">Location</Label>
                      <Input
                        id="linkedin-location"
                        value={linkedInFormData.location}
                        onChange={(e) => handleLinkedInInputChange('location', e.target.value)}
                        placeholder='"United States" OR "United Kingdom"'
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-type">Employment Type</Label>
                      <Select value={linkedInFormData.type} onValueChange={(value) => handleLinkedInInputChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="INTERN">Intern</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="TEMPORARY">Temporary</SelectItem>
                          <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-industry">Industry</Label>
                      <Input
                        id="linkedin-industry"
                        value={linkedInFormData.industry}
                        onChange={(e) => handleLinkedInInputChange('industry', e.target.value)}
                        placeholder="Ex: Accounting, Staffing and Recruiting"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-seniority">Seniority Level</Label>
                      <Select value={linkedInFormData.seniority} onValueChange={(value) => handleLinkedInInputChange('seniority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seniority level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Associate">Associate</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                          <SelectItem value="Mid-Senior level">Mid-Senior level</SelectItem>
                          <SelectItem value="Entry level">Entry level</SelectItem>
                          <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-remote">Remote Work</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="linkedin-remote"
                          checked={linkedInFormData.remote}
                          onCheckedChange={(checked) => handleLinkedInInputChange('remote', checked)}
                        />
                        <Label htmlFor="linkedin-remote" className="text-sm">
                          {linkedInFormData.remote ? 'Remote' : 'On-site'}
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-external-apply">External Apply</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="linkedin-external-apply"
                          checked={linkedInFormData.external_apply}
                          onCheckedChange={(checked) => handleLinkedInInputChange('external_apply', checked)}
                        />
                        <Label htmlFor="linkedin-external-apply" className="text-sm">
                          {linkedInFormData.external_apply ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-directapply">Direct Apply</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="linkedin-directapply"
                          checked={linkedInFormData.directapply}
                          onCheckedChange={(checked) => handleLinkedInInputChange('directapply', checked)}
                        />
                        <Label htmlFor="linkedin-directapply" className="text-sm">
                          {linkedInFormData.directapply ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    </div>
                  </div>


                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleLinkedInSubmit}
                      disabled={!linkedInFormData.title || !linkedInFormData.location || loading}
                      className="flex-1 md:flex-none"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching LinkedIn...
                        </>
                      ) : (
                        "Search LinkedIn Jobs"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Job Results */}
              {jobs.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    LinkedIn Job Results ({jobs.length} found)
                  </h2>
                  <div className="space-y-4">
                    {jobs.map((job, index) => (
                      <Card key={job.job_id || index} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6" onClick={() => setSelectedJob(job)}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-2">
                                {job.job_title}
                              </h3>
                              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {job.employer_name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.job_location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {job.job_posted_at}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAddToWishlist(job)}
                                disabled={addingToWishlist === job.job_id}
                                className="flex items-center gap-2"
                              >
                                {addingToWishlist === job.job_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Heart className={`h-4 w-4 ${wishlistedJobs.has(job.job_id) ? 'fill-red-500 text-red-500' : ''}`} />
                                )}
                                Wishlist
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApply(job)}
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Apply Now
                              </Button>
                            </div>
                          </div>

                          {/* Salary Information */}
                          {(job.job_min_salary || job.job_max_salary) && (
                            <div className="mb-3">
                              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                {job.job_min_salary && job.job_max_salary 
                                  ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                  : job.job_min_salary 
                                  ? `$${job.job_min_salary.toLocaleString()}+${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                  : `Up to $${job.job_max_salary?.toLocaleString()}${job.job_salary_period ? ` / ${job.job_salary_period.toLowerCase()}` : ''}`
                                }
                              </span>
                            </div>
                          )}

                          {/* Job Description Preview */}
                          {job.job_description && (
                            <div className="text-sm text-muted-foreground">
                              <p className="line-clamp-3">
                                {job.job_description}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : !loading && activeTab === "linkedin-jobs" && (
                <Card>
                  <CardContent className="p-6">
                    {renderNoResultsMessage()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="internal-jobs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Internal Job Opportunities</CardTitle>
                  <CardDescription>
                    Browse job opportunities posted within our platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search Jobs</Label>
                      <Input
                        id="search"
                        value={internalFilters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder="Search by title, company, or description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={internalFilters.location}
                        onChange={(e) => updateFilter('location', e.target.value)}
                        placeholder="Enter location"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_type">Job Type</Label>
                      <Select value={internalFilters.job_type} onValueChange={(value) => updateFilter('job_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <Select value={internalFilters.experience_level} onValueChange={(value) => updateFilter('experience_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Levels</SelectItem>
                          <SelectItem value="Entry Level">Entry Level</SelectItem>
                          <SelectItem value="Mid Level">Mid Level</SelectItem>
                          <SelectItem value="Senior Level">Senior Level</SelectItem>
                          <SelectItem value="Executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary_min">Min Salary</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={internalFilters.salary_min}
                        onChange={(e) => updateFilter('salary_min', e.target.value)}
                        placeholder="Minimum salary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary_max">Max Salary</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={internalFilters.salary_max}
                        onChange={(e) => updateFilter('salary_max', e.target.value)}
                        placeholder="Maximum salary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Job Results */}
              {internalJobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading internal jobs...</span>
                </div>
              ) : internalJobs.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Internal Job Opportunities ({internalJobs.length} found)
                  </h2>
                  <div className="space-y-4">
                    {internalJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground mb-2">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {job.company}
                                </div>
                                {job.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {job.location}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(job.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.job_type && (
                              <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                {job.job_type}
                              </span>
                            )}
                            {job.experience_level && (
                              <span className="inline-block bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                                {job.experience_level}
                              </span>
                            )}
                            {job.application_deadline && (
                              <span className="inline-block bg-destructive/10 text-destructive px-2 py-1 rounded-full text-xs font-medium">
                                Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {(job.salary_min || job.salary_max) && (
                            <div className="mb-3">
                              <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                {job.salary_min && job.salary_max 
                                  ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                                  : job.salary_min 
                                  ? `$${job.salary_min.toLocaleString()}+`
                                  : `Up to $${job.salary_max?.toLocaleString()}`
                                }
                              </span>
                            </div>
                          )}
                          
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {job.description}
                          </p>

                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => handleAddToWishlist({
                                job_id: job.id,
                                job_title: job.title,
                                employer_name: job.company,
                                job_location: job.location || '',
                                job_posted_at: new Date(job.created_at).toISOString(),
                                job_apply_link: '',
                                job_description: job.description,
                                job_min_salary: job.salary_min,
                                job_max_salary: job.salary_max,
                                job_salary_period: 'year'
                              })}
                              disabled={addingToWishlist === job.id || wishlistedJobs.has(job.id)}
                            >
                              {addingToWishlist === job.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : wishlistedJobs.has(job.id) ? (
                                <Heart className="h-4 w-4 mr-2 fill-current" />
                              ) : (
                                <Heart className="h-4 w-4 mr-2" />
                              )}
                              {wishlistedJobs.has(job.id) ? 'In Wishlist' : 'Add to Wishlist'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    {renderNoResultsMessage()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Job Details Modal */}
              <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      {selectedJob?.job_title}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {selectedJob && (
                    <div className="space-y-6">
                      {/* Company and Location Info */}
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-5 w-5" />
                          <span className="font-medium">{selectedJob.employer_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-5 w-5" />
                          <span>{selectedJob.job_location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-5 w-5" />
                          <span>Posted {selectedJob.job_posted_at}</span>
                        </div>
                      </div>

                      {/* Salary Information */}
                      {(selectedJob.job_min_salary || selectedJob.job_max_salary) && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Salary Range</h3>
                          <span className="inline-block bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-lg font-medium">
                            {selectedJob.job_min_salary && selectedJob.job_max_salary 
                              ? `$${selectedJob.job_min_salary.toLocaleString()} - $${selectedJob.job_max_salary.toLocaleString()}${selectedJob.job_salary_period ? ` / ${selectedJob.job_salary_period.toLowerCase()}` : ''}`
                              : selectedJob.job_min_salary 
                              ? `$${selectedJob.job_min_salary.toLocaleString()}+${selectedJob.job_salary_period ? ` / ${selectedJob.job_salary_period.toLowerCase()}` : ''}`
                              : `Up to $${selectedJob.job_max_salary?.toLocaleString()}${selectedJob.job_salary_period ? ` / ${selectedJob.job_salary_period.toLowerCase()}` : ''}`
                            }
                          </span>
                        </div>
                      )}

                      {/* Job Description */}
                      {selectedJob.job_description && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Job Description</h3>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                              {selectedJob.job_description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => handleAddToWishlist(selectedJob)}
                          disabled={addingToWishlist === selectedJob.job_id}
                          className="flex items-center gap-2"
                        >
                          {addingToWishlist === selectedJob.job_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                          Add to Wishlist
                        </Button>
                        
                        {selectedJob.job_apply_link && (
                          <Button 
                            className="flex items-center gap-2"
                            onClick={() => handleApplyAndWishlist(selectedJob)}
                            disabled={addingToWishlist === selectedJob.job_id}
                          >
                            {addingToWishlist === selectedJob.job_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                            Apply & Add to Tracker
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
        </div>
      </main>
    </div>
  );
};

export default FindYourNextRole;
