import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, MapPin, Building, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JobResult {
  title: string;
  company: string;
  location: string;
  date_posted: string;
  job_url: string;
  description: string;
  salary?: string;
}

const FindYourNextRole = () => {
  const [formData, setFormData] = useState({
    query: "developer jobs in chicago",
    page: "1",
    num_pages: "1",
    date_posted: "all",
    country: "us",
    language: "en"
  });
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setJobs([]);

    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: {
          query: formData.query,
          page: parseInt(formData.page),
          num_pages: parseInt(formData.num_pages),
          date_posted: formData.date_posted,
          country: formData.country,
          language: formData.language
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.jobs) {
        setJobs(data.jobs);
        toast({
          title: "Jobs found successfully",
          description: `Found ${data.jobs.length} job opportunities for you.`,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Find Your Next Role</h1>
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
                <Label htmlFor="page">Page Number</Label>
                <Input
                  id="page"
                  type="number"
                  min="1"
                  value={formData.page}
                  onChange={(e) => handleInputChange('page', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_pages">Number of Pages</Label>
                <Input
                  id="num_pages"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.num_pages}
                  onChange={(e) => handleInputChange('num_pages', e.target.value)}
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
                <Card key={index} className="hover:shadow-lg transition-shadow">
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
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.date_posted}
                          </div>
                        </div>
                      </div>
                      {job.job_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={job.job_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Apply
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    
                    {job.salary && (
                      <div className="mb-3">
                        <span className="inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          {job.salary}
                        </span>
                      </div>
                    )}
                    
                    {job.description && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {job.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindYourNextRole;