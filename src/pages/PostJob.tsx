import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get('edit');
  const isEditMode = !!editJobId;
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    jobType: "",
    experienceLevel: "",
    salaryMin: "",
    salaryMax: "",
    description: "",
    requirements: "",
    benefits: "",
    applicationDeadline: "",
    jobUrl: "",
  });

  // Load job data for editing
  useEffect(() => {
    if (isEditMode && editJobId) {
      loadJobData();
    }
  }, [isEditMode, editJobId]);

  const loadJobData = async () => {
    setLoadingJob(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', editJobId)
        .eq('posted_by', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          company: data.company || "",
          location: data.location || "",
          jobType: data.job_type || "",
          experienceLevel: data.experience_level || "",
          salaryMin: data.salary_min?.toString() || "",
          salaryMax: data.salary_max?.toString() || "",
          description: data.description || "",
          requirements: data.requirements || "",
          benefits: data.benefits || "",
          applicationDeadline: data.application_deadline || "",
          jobUrl: data.job_url || "",
        });
      }
    } catch (error: any) {
      console.error('Error loading job data:', error);
      toast({
        title: "Error",
        description: "Failed to load job data. Please try again.",
        variant: "destructive",
      });
      navigate('/recruiter');
    } finally {
      setLoadingJob(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        job_type: formData.jobType,
        experience_level: formData.experienceLevel,
        salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        application_deadline: formData.applicationDeadline || null,
        job_url: formData.jobUrl || null,
        posted_by: user.id,
        related_id: null,
      };

      if (isEditMode && editJobId) {
        // Update existing job
        const { data, error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', editJobId)
          .eq('posted_by', user.id)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Job updated successfully!",
        });
      } else {
        // Create new job
        const { data, error } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Job posted successfully! All institute users will be notified.",
        });
        
        // Reset form for new job
        setFormData({
          title: "",
          company: "",
          location: "",
          jobType: "",
          experienceLevel: "",
          salaryMin: "",
          salaryMax: "",
          description: "",
          requirements: "",
          benefits: "",
          applicationDeadline: "",
          jobUrl: "",
        });
      }
      
      navigate('/recruiter');
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditMode ? 'update' : 'post'} job. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/recruiter')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update the job posting details' : 'Fill in the details to create your job posting'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJob ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p>Loading job details...</p>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name*</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="e.g. Tech Solutions Inc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location*</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type*</Label>
                <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level*</Label>
                <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 Year</SelectItem>
                    <SelectItem value="1-3">1-3 Years</SelectItem>
                    <SelectItem value="3-5">3-5 Years</SelectItem>
                    <SelectItem value="5+">More than 5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary (₹)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                  placeholder="e.g. 500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary (₹)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                  placeholder="e.g. 800000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description*</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements*</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="List the required skills, experience, education, etc."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                placeholder="Health insurance, flexible hours, remote work, etc."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application Deadline</Label>
              <Input
                id="applicationDeadline"
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobUrl">Job Application URL</Label>
              <Input
                id="jobUrl"
                type="url"
                value={formData.jobUrl}
                onChange={(e) => handleInputChange('jobUrl', e.target.value)}
                placeholder="e.g. https://company.com/careers/apply/job-123"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (isEditMode ? "Updating..." : "Posting...") : (isEditMode ? "Update Job" : "Post Job")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/recruiter')}>
                Cancel
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}