import { useState, useEffect } from "react";
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
import { Loader2, MapPin, Building, Clock, ExternalLink, Heart, ArrowLeft, Save, FolderOpen, Trash2, Search, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useInternalJobs, type InternalJob } from "@/hooks/useInternalJobs";
import { useJobMatching } from "@/hooks/useJobMatching";
import { Progress } from "@/components/ui/progress";

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
  job_application_deadline?: string;
}

interface JobSearchForm {
  query: string;
  date_posted: string;
  country: string;
  job_requirements: string;
  employment_type: string;
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
  const { incrementAnalytics, profile } = useProfile();
  const { jobs: internalJobs, loading: internalJobsLoading, filters: internalFilters, updateFilter, clearFilters } = useInternalJobs();
  const { calculateJobMatch, loading: profileLoading } = useJobMatching();
  const [formData, setFormData] = useState<JobSearchForm>({
    query: "developer jobs in Hyderabad",
    date_posted: "all",
    country: "in",
    job_requirements: "under_3_years_experience",
    employment_type: "ALL"
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
  const [searchType, setSearchType] = useState("regular-search");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [addingToWishlist, setAddingToWishlist] = useState<string | null>(null);
  const [addingInternalToWishlist, setAddingInternalToWishlist] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);
  const [wishlistedJobs, setWishlistedJobs] = useState<Set<string>>(new Set());
  const [wishlistedInternalJobs, setWishlistedInternalJobs] = useState<Set<string>>(new Set());
  const [savedSearches, setSavedSearches] = useState<SavedJobSearch[]>([]);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showProfileMatchDialog, setShowProfileMatchDialog] = useState(false);
  const [profileMatchJob, setProfileMatchJob] = useState<JobResult | null>(null);

  // Debug effect to track jobs state changes
  useEffect(() => {
    console.log('Jobs state changed:', {
      jobsLength: jobs.length,
      loading: loading,
      searchType: searchType,
      jobs: jobs.slice(0, 2) // Show first 2 jobs for debugging
    });
  }, [jobs, loading, searchType]);

  // Fetch existing wishlisted jobs on component mount
  useEffect(() => {
    const fetchWishlistedJobs = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('job_title, company_name, job_url')
          .eq('user_id', user.id)
          .eq('status', 'wishlist');

        if (error) {
          console.error('Error fetching wishlisted jobs:', error);
          return;
        }

        if (data && data.length > 0) {
          // Create a set of wishlisted job identifiers (using company-title combination)
          const wishlistedJobIds = new Set<string>();
          const wishlistedInternalJobIds = new Set<string>();
          
          data.forEach(item => {
            // Create a unique identifier from company and job title
            const jobIdentifier = `${item.company_name?.toLowerCase()}-${item.job_title?.toLowerCase()}`.replace(/\s+/g, '-');
            wishlistedJobIds.add(jobIdentifier);
          });
          
          setWishlistedJobs(wishlistedJobIds);
        }
      } catch (error) {
        console.error('Error fetching wishlisted jobs:', error);
      }
    };

    fetchWishlistedJobs();
  }, [user]);

  // Update wishlisted jobs when jobs are loaded
  useEffect(() => {
    const updateJobWishlistStatus = async () => {
      if (!user || jobs.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('job_title, company_name')
          .eq('user_id', user.id)
          .eq('status', 'wishlist');

        if (error) {
          console.error('Error fetching wishlisted jobs:', error);
          return;
        }

        if (data && data.length > 0) {
          const wishlistedJobIds = new Set<string>();
          
          data.forEach(wishlistItem => {
            // Find matching jobs by title and company
            const matchingJob = jobs.find(job => 
              job.job_title?.toLowerCase() === wishlistItem.job_title?.toLowerCase() &&
              job.employer_name?.toLowerCase() === wishlistItem.company_name?.toLowerCase()
            );
            
            if (matchingJob) {
              wishlistedJobIds.add(matchingJob.job_id);
            }
          });
          
          setWishlistedJobs(prev => new Set([...prev, ...wishlistedJobIds]));
        }
      } catch (error) {
        console.error('Error updating job wishlist status:', error);
      }
    };

    updateJobWishlistStatus();
  }, [user, jobs]);

  // Update wishlisted internal jobs when internal jobs are loaded
  useEffect(() => {
    const updateInternalJobWishlistStatus = async () => {
      if (!user || internalJobs.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('job_title, company_name')
          .eq('user_id', user.id)
          .eq('status', 'wishlist');

        if (error) {
          console.error('Error fetching wishlisted internal jobs:', error);
          return;
        }

        if (data && data.length > 0) {
          const wishlistedInternalJobIds = new Set<string>();
          
          data.forEach(wishlistItem => {
            // Find matching internal jobs by title and company
            const matchingJob = internalJobs.find(job => 
              job.title?.toLowerCase() === wishlistItem.job_title?.toLowerCase() &&
              job.company?.toLowerCase() === wishlistItem.company_name?.toLowerCase()
            );
            
            if (matchingJob) {
              wishlistedInternalJobIds.add(matchingJob.id);
            }
          });
          
          setWishlistedInternalJobs(prev => new Set([...prev, ...wishlistedInternalJobIds]));
        }
      } catch (error) {
        console.error('Error updating internal job wishlist status:', error);
      }
    };

    updateInternalJobWishlistStatus();
  }, [user, internalJobs]);

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
            date_posted: "24hrs",
            country: linkedInFormData.location,
            job_requirements: linkedInFormData.seniority || "any",
            employment_type: "FULLTIME"
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
          date_posted: searchForm.date_posted,
          country: searchForm.country,
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

  const handleTestWebhook = async () => {
    setLoading(true);
    setJobs([]);

    try {
      // Call the test n8n webhook
      const response = await fetch('https://rnstech.app.n8n.cloud/webhook-test/jsearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: formData.query,
          date_posted: formData.date_posted,
          country: formData.country,
          job_requirements: formData.job_requirements,
          employment_type: formData.employment_type === "ALL" ? "FULLTIME,CONTRACTOR,PARTTIME,INTERN" : formData.employment_type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Test webhook response structure:', data);
      console.log('Data keys:', Object.keys(data || {}));
      console.log('Single job check - has job_id:', !!data?.job_id, 'has job_title:', !!data?.job_title);
      console.log('Response data type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Check different possible response structures
      let jobsArray = [];
      
      if (data && Array.isArray(data)) {
        console.log('Processing as array of jobs - length:', data.length);
        // If response is directly an array of jobs, map each job to our format
        jobsArray = data.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.jobs && Array.isArray(data.jobs)) {
        console.log('Processing as jobs array at root level - length:', data.jobs.length);
        // If response has jobs at root level, map each job
        jobsArray = data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        console.log('Processing as nested data.jobs array - length:', data.data.jobs.length);
        // If response has nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.success && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        console.log('Processing as success response with nested data.jobs array - length:', data.data.jobs.length);
        // If response has success flag with nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.job_id && data.job_title) {
        console.log('Processing as single job object - wrapping in array');
        console.log('Single job data:', {
          job_id: data.job_id,
          job_title: data.job_title,
          employer_name: data.employer_name,
          job_apply_link: data.job_apply_link
        });
        // If response is a single job object, wrap it in an array
        jobsArray = [{
          job_id: data.job_id,
          job_title: data.job_title,
          employer_name: data.employer_name,
          job_location: data.job_location || 'Remote',
          job_description: data.job_description,
          job_employment_type: data.job_employment_type || 'Full-time',
          job_apply_link: data.job_apply_link,
          job_posted_at: data.job_posted_at || 'Recently',
          job_min_salary: data.job_min_salary,
          job_max_salary: data.job_max_salary,
          job_salary_period: data.job_salary_period,
          job_benefits: data.job_benefits,
          job_is_remote: data.job_is_remote,
          employer_logo: data.employer_logo,
          employer_website: data.employer_website
        }];
      } else {
        console.log('No matching condition found for response processing');
        console.log('Data structure:', {
          hasJobId: !!data?.job_id,
          hasJobTitle: !!data?.job_title,
          hasJobs: !!data?.jobs,
          hasDataJobs: !!data?.data?.jobs,
          keys: Object.keys(data || {})
        });
      }
      
      console.log('Final jobs array:', jobsArray);
      console.log('Jobs array length:', jobsArray?.length);
      
      if (data && Array.isArray(data)) {
        // If response is directly an array of jobs, map each job to our format
        jobsArray = data.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.jobs && Array.isArray(data.jobs)) {
        // If response has jobs at root level, map each job
        jobsArray = data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        // If response has nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.success && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        // If response has success flag with nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.job_id && data.job_title) {
        // If response is a single job object, wrap it in an array
        jobsArray = [{
          job_id: data.job_id,
          job_title: data.job_title,
          employer_name: data.employer_name,
          job_location: data.job_location || 'Remote',
          job_description: data.job_description,
          job_employment_type: data.job_employment_type || 'Full-time',
          job_apply_link: data.job_apply_link,
          job_posted_at: data.job_posted_at || 'Recently',
          job_min_salary: data.job_min_salary,
          job_max_salary: data.job_max_salary,
          job_salary_period: data.job_salary_period,
          job_benefits: data.job_benefits,
          job_is_remote: data.job_is_remote,
          employer_logo: data.employer_logo,
          employer_website: data.employer_website
        }];
      }
      
      console.log('Jobs array found:', jobsArray);
      
      if (jobsArray && jobsArray.length > 0) {
        setJobs(jobsArray);
        setSearchType("regular-search"); // Ensure we're showing the right section
        setLoading(false); // Set loading to false immediately when jobs are found
        
        // Save job results to database
        await saveJobResultsToDatabase(jobsArray, formData);
        
        toast({
          title: "Test Webhook Success", 
          description: `Found ${jobsArray.length} jobs from test webhook`,
        });
      } else {
        setJobs([]);
        setLoading(false); // Set loading to false even when no jobs found
        toast({
          title: "Test Webhook Success",
          description: "Test webhook called successfully but no jobs returned. Check console for response structure.",
        });
      }

    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Test Webhook Error",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setJobs([]);

    try {
      // Track job search analytics
      await incrementAnalytics('job_search');

      // Call the n8n webhook
      const response = await fetch('https://rnstech.app.n8n.cloud/webhook/jsearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: formData.query,
          date_posted: formData.date_posted,
          country: formData.country,
          job_requirements: formData.job_requirements,
          employment_type: formData.employment_type === "ALL" ? "FULLTIME,CONTRACTOR,PARTTIME,INTERN" : formData.employment_type
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Main webhook response structure:', data);
      console.log('Data keys:', Object.keys(data || {}));
      
      // Check different possible response structures (same as test webhook)
      let jobsArray = [];
      
      if (data && Array.isArray(data)) {
        // If response is directly an array of jobs, map each job to our format
        jobsArray = data.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.jobs && Array.isArray(data.jobs)) {
        // If response has jobs at root level, map each job
        jobsArray = data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        // If response has nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.success && data.data && data.data.jobs && Array.isArray(data.data.jobs)) {
        // If response has success flag with nested structure, map each job
        jobsArray = data.data.jobs.map(jobItem => ({
          job_id: jobItem.job_id || jobItem.id,
          job_title: jobItem.job_title || jobItem.title,
          employer_name: jobItem.employer_name || jobItem.company,
          job_location: jobItem.job_location || jobItem.location || 'Remote',
          job_description: jobItem.job_description || jobItem.description,
          job_employment_type: jobItem.job_employment_type || 'Full-time',
          job_apply_link: jobItem.job_apply_link || jobItem.job_url,
          job_posted_at: jobItem.job_posted_at || 'Recently',
          job_min_salary: jobItem.job_min_salary || jobItem.salary_min,
          job_max_salary: jobItem.job_max_salary || jobItem.salary_max,
          job_salary_period: jobItem.job_salary_period,
          job_benefits: jobItem.job_benefits || jobItem.benefits,
          job_is_remote: jobItem.job_is_remote,
          employer_logo: jobItem.employer_logo,
          employer_website: jobItem.employer_website
        }));
      } else if (data && data.job_id && data.job_title) {
        // If response is a single job object, wrap it in an array
        jobsArray = [{
          job_id: data.job_id,
          job_title: data.job_title,
          employer_name: data.employer_name,
          job_location: data.job_location || 'Remote',
          job_description: data.job_description,
          job_employment_type: data.job_employment_type || 'Full-time',
          job_apply_link: data.job_apply_link,
          job_posted_at: data.job_posted_at || 'Recently',
          job_min_salary: data.job_min_salary,
          job_max_salary: data.job_max_salary,
          job_salary_period: data.job_salary_period,
          job_benefits: data.job_benefits,
          job_is_remote: data.job_is_remote,
          employer_logo: data.employer_logo,
          employer_website: data.employer_website
        }];
      }
      
      console.log('Jobs array found:', jobsArray);
      
      if (jobsArray && jobsArray.length > 0) {
        setJobs(jobsArray);
        setSearchType("regular-search"); // Ensure we're showing the right section
        
        // Save job results to database
        await saveJobResultsToDatabase(jobsArray, formData);
        
        toast({
          title: "Jobs found successfully", 
          description: `Found ${jobsArray.length} job opportunities for you.`,
        });
      } else {
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

    // Check if job is already wishlisted
    if (wishlistedJobs.has(job.job_id)) {
      toast({
        title: "Already in wishlist",
        description: `${job.job_title} at ${job.employer_name} is already in your wishlist.`,
      });
      return;
    }

    setAddingToWishlist(job.job_id);
    
    try {
      // Check if job already exists in database to prevent duplicates
      const { data: existingJob, error: checkError } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_name', job.employer_name)
        .eq('job_title', job.job_title)
        .eq('status', 'wishlist')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingJob) {
        // Job already exists in wishlist
        setWishlistedJobs(prev => new Set([...prev, job.job_id]));
        toast({
          title: "Already in wishlist",
          description: `${job.job_title} at ${job.employer_name} is already in your wishlist.`,
        });
        return;
      }

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

  const handleAddInternalJobToWishlist = async (job: InternalJob) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add jobs to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    // Check if job is already wishlisted
    if (wishlistedInternalJobs.has(job.id)) {
      toast({
        title: "Already in wishlist",
        description: `${job.title} at ${job.company} is already in your wishlist.`,
      });
      return;
    }

    setAddingInternalToWishlist(job.id);
    
    try {
      // Check if job already exists in database to prevent duplicates
      const { data: existingJob, error: checkError } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_name', job.company || 'Unknown Company')
        .eq('job_title', job.title || 'Unknown Position')
        .eq('status', 'wishlist')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingJob) {
        // Job already exists in wishlist
        setWishlistedInternalJobs(prev => new Set([...prev, job.id]));
        toast({
          title: "Already in wishlist",
          description: `${job.title} at ${job.company} is already in your wishlist.`,
        });
        return;
      }

      const { error } = await supabase
        .from('job_tracker')
        .insert({
          user_id: user.id,
          company_name: job.company || 'Unknown Company',
          job_title: job.title || 'Unknown Position',
          status: 'wishlist',
          application_date: new Date().toISOString().split('T')[0],
          job_url: job.job_url || '',
          salary_range: job.salary_min && job.salary_max 
            ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
            : job.salary_min 
            ? `$${job.salary_min.toLocaleString()}+`
            : job.salary_max
            ? `Up to $${job.salary_max.toLocaleString()}`
            : '',
          location: job.location || '',
          notes: job.description ? job.description.substring(0, 500) + (job.description.length > 500 ? '...' : '') : '',
        });

      if (error) {
        throw error;
      }

      // Add to wishlist state
      setWishlistedInternalJobs(prev => new Set([...prev, job.id]));
      
      toast({
        title: "Added to Wishlist",
        description: `${job.title} at ${job.company} has been added to your job tracker.`,
      });
    } catch (error) {
      console.error('Error adding internal job to wishlist:', error);
      toast({
        title: "Error adding to wishlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAddingInternalToWishlist(null);
    }
  };

  const handleApplyInternalJob = (job: InternalJob) => {
    if (job.job_url) {
      window.open(job.job_url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "No application link",
        description: "This job doesn't have an application link available.",
        variant: "destructive",
      });
    }
  };

  const handleApplyAndWishlistInternal = async (job: InternalJob) => {
    // Add to wishlist first
    await handleAddInternalJobToWishlist(job);
    
    // Then open the apply link
    if (job.job_url) {
      window.open(job.job_url, '_blank', 'noopener,noreferrer');
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
    setFormData({
      ...savedSearch.search_criteria,
      employment_type: savedSearch.search_criteria.employment_type || 'ALL'
    });
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

  // Check if user has access to LinkedIn 24-hour Jobs
  const isLinkedInJobsAccessible = () => {
    if (!profile?.subscription_plan) return false;
    const eligiblePlans = ["3 Months Plan", "6 Months Plan", "1 Year Plan"];
    return eligiblePlans.includes(profile.subscription_plan);
  };

  const handleProfileMatch = (job: JobResult) => {
    setProfileMatchJob(job);
    setShowProfileMatchDialog(true);
  };

  const handleInternalProfileMatch = (job: InternalJob) => {
    const jobResult: JobResult = {
      job_id: job.id,
      job_title: job.title,
      employer_name: job.company || 'Unknown Company',
      job_location: job.location || '',
      job_posted_at: new Date(job.created_at).toLocaleDateString(),
      job_apply_link: job.job_url || '',
      job_description: job.description || '',
      job_min_salary: job.salary_min,
      job_max_salary: job.salary_max
    };
    setProfileMatchJob(jobResult);
    setShowProfileMatchDialog(true);
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

          <div className="space-y-6">
            {/* Search Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Job Search Type</CardTitle>
                <CardDescription>
                  Choose the type of job search you want to perform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setSearchType("regular-search")}
                    variant={searchType === "regular-search" ? "default" : "outline"}
                    className="flex-1 min-w-[200px]"
                  >
                    Find Your Next Role
                  </Button>
                  <Button
                    onClick={() => {
                      if (!isLinkedInJobsAccessible()) return;
                      setSearchType("linkedin-jobs");
                    }}
                    variant={searchType === "linkedin-jobs" ? "default" : "outline"}
                    className={`flex-1 min-w-[200px] ${!isLinkedInJobsAccessible() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isLinkedInJobsAccessible()}
                  >
                    LinkedIn 24-hour Jobs
                  </Button>
                  <Button
                    onClick={() => setSearchType("internal-jobs")}
                    variant={searchType === "internal-jobs" ? "default" : "outline"}
                    className="flex-1 min-w-[200px]"
                  >
                    Internal Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Regular Job Search */}
            {searchType === "regular-search" && (
              <>
                {console.log('Regular search section - jobs.length:', jobs.length, 'loading:', loading, 'searchType:', searchType)}
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
                        <Label htmlFor="employment_type">Employment Type</Label>
                        <Select value={formData.employment_type} onValueChange={(value) => handleInputChange('employment_type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            <SelectItem value="FULLTIME">Full-time</SelectItem>
                            <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                            <SelectItem value="PARTTIME">Part-time</SelectItem>
                            <SelectItem value="INTERN">Intern</SelectItem>
                          </SelectContent>
                        </Select>
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

                      <Button 
                        onClick={handleTestWebhook} 
                        disabled={loading}
                        variant="outline"
                        className="flex-1 md:flex-none"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Test Webhook"
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
                        <Card 
                          key={job.job_id || index} 
                          className="hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-6">
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
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAddToWishlist(job)}
                                  disabled={addingToWishlist === job.job_id || wishlistedJobs.has(job.job_id)}
                                  className="flex items-center gap-2"
                                >
                                  {addingToWishlist === job.job_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Heart className={`h-4 w-4 ${wishlistedJobs.has(job.job_id) ? 'fill-red-500 text-red-500' : ''}`} />
                                  )}
                                  {wishlistedJobs.has(job.job_id) ? 'In Wishlist' : 'Add to Wishlist'}
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => handleProfileMatch(job)}
                                  className="flex items-center gap-2"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                  Profile Match
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
                ) : !loading && searchType === "regular-search" && (
                  <Card>
                    <CardContent className="p-6">
                      {renderNoResultsMessage()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* LinkedIn Jobs Search */}
            {searchType === "linkedin-jobs" && (
              <>
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

                {jobs.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Jobs List */}
                    <div className="lg:col-span-2">
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        LinkedIn Job Results ({jobs.length} found)
                      </h2>
                      <div className="space-y-4">
                        {jobs.map((job, index) => (
                          <Card 
                            key={job.job_id || index} 
                            className={`hover:shadow-lg transition-shadow cursor-pointer ${
                              selectedJob?.job_id === job.job_id ? 'ring-2 ring-primary' : ''
                            }`}
                          >
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
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => handleProfileMatch(job)}
                                    className="flex items-center gap-2"
                                  >
                                    <BarChart3 className="h-4 w-4" />
                                    Profile Match
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

                    {/* Profile Matching Column */}
                    <div className="lg:col-span-1">
                      {selectedJob ? (
                        <div className="sticky top-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Profile Match Analysis
                              </CardTitle>
                              <CardDescription>
                                How well does your profile match this job?
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {(() => {
                                const matchResult = calculateJobMatch(
                                  selectedJob.job_title,
                                  selectedJob.job_description || '',
                                  selectedJob.employer_name
                                );
                                
                                return (
                                  <>
                                    {/* Match Percentage */}
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-primary mb-2">
                                        {matchResult.matchPercentage}%
                                      </div>
                                      <Progress value={matchResult.matchPercentage} className="h-3 mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        {matchResult.matchPercentage >= 80 ? 'Excellent match!' : 
                                         matchResult.matchPercentage >= 60 ? 'Good match' : 
                                         'Needs improvement'}
                                      </p>
                                    </div>

                                    {/* Strengths */}
                                    {matchResult.strengths.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-green-600 mb-2">Your Strengths</h4>
                                        <ul className="space-y-1">
                                          {matchResult.strengths.map((strength, index) => (
                                            <li key={index} className="text-sm flex items-start gap-2">
                                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                              {strength}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Suggestions */}
                                    <div>
                                      <h4 className="font-semibold text-orange-600 mb-2">
                                        {matchResult.matchPercentage >= 80 ? 'Additional Tips' : 'Improvement Suggestions'}
                                      </h4>
                                      <ul className="space-y-1">
                                        {matchResult.suggestions.map((suggestion, index) => (
                                          <li key={index} className="text-sm flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                            {suggestion}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Missing Skills */}
                                    {matchResult.missingSkills.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-red-600 mb-2">Skills to Develop</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {matchResult.missingSkills.slice(0, 6).map((skill, index) => (
                                            <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Matched Skills */}
                                    {matchResult.matchedSkills.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-green-600 mb-2">Your Matching Skills</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {matchResult.matchedSkills.slice(0, 6).map((skill, index) => (
                                            <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Click on a job to see how well your profile matches</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : !loading && searchType === "linkedin-jobs" && (
                  <Card>
                    <CardContent className="p-6">
                      {renderNoResultsMessage()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Internal Jobs Search */}
            {searchType === "internal-jobs" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Job Opportunities</CardTitle>
                    <CardDescription>
                      Browse job opportunities posted within the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="internal-search">Search</Label>
                        <Input
                          id="internal-search"
                          placeholder="Search by title, company..."
                          value={internalFilters.search}
                          onChange={(e) => updateFilter('search', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-location">Location</Label>
                        <Input
                          id="internal-location"
                          placeholder="Location"
                          value={internalFilters.location}
                          onChange={(e) => updateFilter('location', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-job-type">Job Type</Label>
                        <Select 
                          value={internalFilters.job_type} 
                          onValueChange={(value) => updateFilter('job_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-experience">Experience Level</Label>
                        <Select 
                          value={internalFilters.experience_level} 
                          onValueChange={(value) => updateFilter('experience_level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="mid">Mid Level</SelectItem>
                            <SelectItem value="senior">Senior Level</SelectItem>
                            <SelectItem value="lead">Lead/Principal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-salary-min">Min Salary</Label>
                        <Input
                          id="internal-salary-min"
                          type="number"
                          placeholder="Min salary"
                          value={internalFilters.salary_min}
                          onChange={(e) => updateFilter('salary_min', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internal-salary-max">Max Salary</Label>
                        <Input
                          id="internal-salary-max"
                          type="number"
                          placeholder="Max salary"
                          value={internalFilters.salary_max}
                          onChange={(e) => updateFilter('salary_max', e.target.value)}
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

                {internalJobsLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading internal jobs...</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : internalJobs.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Jobs List */}
                    <div className="lg:col-span-2">
                      <h2 className="text-2xl font-bold text-foreground mb-4">
                        Internal Job Opportunities ({internalJobs.length} found)
                      </h2>
                      <div className="space-y-4">
                        {internalJobs.map((job: InternalJob) => (
                          <Card 
                            key={job.id} 
                            className={`hover:shadow-lg transition-shadow cursor-pointer ${
                              selectedJob?.job_id === job.id ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <CardContent className="p-6" onClick={() => setSelectedJob({
                              job_id: job.id,
                              job_title: job.title,
                              employer_name: job.company || 'Unknown Company',
                              job_location: job.location || '',
                              job_posted_at: new Date(job.created_at).toLocaleDateString(),
                              job_apply_link: job.job_url || '',
                              job_description: job.description || '',
                              job_min_salary: job.salary_min,
                              job_max_salary: job.salary_max,
                              job_application_deadline: job.application_deadline
                            })}>
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
                                    {job.job_type && (
                                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                                        {job.job_type}
                                      </span>
                                    )}
                                    {job.experience_level && (
                                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                                        {job.experience_level}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAddInternalJobToWishlist(job)}
                                    disabled={addingInternalToWishlist === job.id || wishlistedInternalJobs.has(job.id)}
                                  >
                                    {addingInternalToWishlist === job.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : wishlistedInternalJobs.has(job.id) ? (
                                      <Heart className="h-4 w-4 fill-current" />
                                    ) : (
                                      <Heart className="h-4 w-4" />
                                    )}
                                    {wishlistedInternalJobs.has(job.id) ? 'Wishlisted' : 'Wishlist'}
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => handleInternalProfileMatch(job)}
                                    className="flex items-center gap-2"
                                  >
                                    <BarChart3 className="h-4 w-4" />
                                    Profile Match
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleApplyInternalJob(job)}
                                    disabled={!job.job_url}
                                  >
                                    Apply Now
                                  </Button>
                                </div>
                              </div>
                              
                              {(job.salary_min || job.salary_max) && (
                                <div className="mb-3">
                                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                    {job.salary_min && job.salary_max 
                                      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                                      : job.salary_min 
                                      ? `$${job.salary_min.toLocaleString()}+`
                                      : `Up to $${job.salary_max?.toLocaleString()}`
                                    }
                                  </span>
                                </div>
                              )}
                              
                              <p className="text-muted-foreground text-sm line-clamp-3">
                                {job.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Profile Matching Column */}
                    <div className="lg:col-span-1">
                      {selectedJob ? (
                        <div className="sticky top-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Profile Match Analysis
                              </CardTitle>
                              <CardDescription>
                                How well does your profile match this job?
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {(() => {
                                const matchResult = calculateJobMatch(
                                  selectedJob.job_title,
                                  selectedJob.job_description || '',
                                  selectedJob.employer_name
                                );
                                
                                return (
                                  <>
                                    {/* Match Percentage */}
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-primary mb-2">
                                        {matchResult.matchPercentage}%
                                      </div>
                                      <Progress value={matchResult.matchPercentage} className="h-3 mb-2" />
                                      <p className="text-sm text-muted-foreground">
                                        {matchResult.matchPercentage >= 80 ? 'Excellent match!' : 
                                         matchResult.matchPercentage >= 60 ? 'Good match' : 
                                         'Needs improvement'}
                                      </p>
                                    </div>

                                    {/* Strengths */}
                                    {matchResult.strengths.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-green-600 mb-2">Your Strengths</h4>
                                        <ul className="space-y-1">
                                          {matchResult.strengths.map((strength, index) => (
                                            <li key={index} className="text-sm flex items-start gap-2">
                                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                              {strength}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Suggestions */}
                                    <div>
                                      <h4 className="font-semibold text-orange-600 mb-2">
                                        {matchResult.matchPercentage >= 80 ? 'Additional Tips' : 'Improvement Suggestions'}
                                      </h4>
                                      <ul className="space-y-1">
                                        {matchResult.suggestions.map((suggestion, index) => (
                                          <li key={index} className="text-sm flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                            {suggestion}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Missing Skills */}
                                    {matchResult.missingSkills.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-red-600 mb-2">Skills to Develop</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {matchResult.missingSkills.slice(0, 6).map((skill, index) => (
                                            <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Matched Skills */}
                                    {matchResult.matchedSkills.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-green-600 mb-2">Your Matching Skills</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {matchResult.matchedSkills.slice(0, 6).map((skill, index) => (
                                            <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Card>
                          <CardContent className="p-6 text-center text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Click on a job to see how well your profile matches</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : !internalJobsLoading && searchType === "internal-jobs" && (
                  <Card>
                    <CardContent className="p-6">
                      {renderNoResultsMessage()}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Profile Match Dialog */}
          <Dialog open={showProfileMatchDialog} onOpenChange={setShowProfileMatchDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Profile Match Analysis
                </DialogTitle>
              </DialogHeader>
              
              {profileMatchJob && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">{profileMatchJob.job_title}</h3>
                    <p className="text-muted-foreground">{profileMatchJob.employer_name}</p>
                  </div>

                  {(() => {
                    const matchResult = calculateJobMatch(
                      profileMatchJob.job_title,
                      profileMatchJob.job_description || '',
                      profileMatchJob.employer_name
                    );
                    
                    return (
                      <>
                        {/* Match Percentage */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-3">
                            {matchResult.matchPercentage}%
                          </div>
                          <Progress value={matchResult.matchPercentage} className="h-4 mb-3" />
                          <p className="text-lg font-medium">
                            {matchResult.matchPercentage >= 80 ? 'Excellent match!' : 
                             matchResult.matchPercentage >= 60 ? 'Good match' : 
                             'Needs improvement'}
                          </p>
                        </div>

                        {/* Strengths */}
                        {matchResult.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-3 text-lg">Your Strengths</h4>
                            <ul className="space-y-2">
                              {matchResult.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                  <span className="text-foreground">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions */}
                        <div>
                          <h4 className="font-semibold text-orange-600 mb-3 text-lg">
                            {matchResult.matchPercentage >= 80 ? 'Additional Tips' : 'Improvement Suggestions'}
                          </h4>
                          <ul className="space-y-2">
                            {matchResult.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-foreground">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Missing Skills */}
                        {matchResult.missingSkills.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-red-600 mb-3 text-lg">Skills to Develop</h4>
                            <div className="flex flex-wrap gap-2">
                              {matchResult.missingSkills.slice(0, 10).map((skill, index) => (
                                <span key={index} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Matched Skills */}
                        {matchResult.matchedSkills.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-3 text-lg">Your Matching Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {matchResult.matchedSkills.slice(0, 10).map((skill, index) => (
                                <span key={index} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </DialogContent>
          </Dialog>

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
                         {selectedJob.job_application_deadline && (
                           <div className="flex items-center gap-1 text-orange-600">
                             <Clock className="h-5 w-5" />
                             <span>Apply by {new Date(selectedJob.job_application_deadline).toLocaleDateString()}</span>
                           </div>
                         )}
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
