import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Building, Clock, ExternalLink, Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

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

const FindYourNextRole = () => {
  const { user } = useAuth();
  const { incrementAnalytics } = useProfile();
  const [formData, setFormData] = useState<JobSearchForm>({
    query: "developer jobs in chicago",
    num_pages: "1",
    date_posted: "all",
    country: "us",
    language: "en",
    job_requirements: "under_3_years_experience"
  });
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [wishlistedJobs, setWishlistedJobs] = useState<Set<string>>(new Set());

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        setJobs(data.data.jobs);
        
        // Save all job results to database
        await saveJobResultsToDatabase(data.data.jobs, formData);
        
        toast({
          title: "Jobs found successfully",
          description: `Found ${data.data.jobs.length} job opportunities for you.`,
        });
      } else {
        toast({
          title: "No jobs found",
          description: "Try adjusting your search criteria.",
        });
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
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

  const handleApplyAndWishlist = async (job: JobResult) => {
    // Add to wishlist first
    await handleAddToWishlist(job);
    
    // Then open the apply link
    if (job.job_apply_link) {
      window.open(job.job_apply_link, '_blank', 'noopener,noreferrer');
    }
  };

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

            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full md:w-auto"
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
          </CardContent>
        </Card>

              {jobs.length > 0 && (
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
              )}

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