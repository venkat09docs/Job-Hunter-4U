import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, Eye, LayoutDashboard, Calendar, Edit, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useRecruiterStats } from "@/hooks/useRecruiterStats";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ResizableLayout } from "@/components/ResizableLayout";
import { BadgeLeadersSlider } from "@/components/BadgeLeadersSlider";
import LeaderBoard from "@/components/LeaderBoard";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { stats, loading, error } = useRecruiterStats();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header with User Profile */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Recruiter Dashboard</h2>
          </div>
          <UserProfileDropdown />
        </div>
      </header>

      <ResizableLayout>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
                <p className="text-muted-foreground mt-2">Manage your job postings and find the perfect candidates</p>
              </div>
              <Button onClick={() => navigate('/recruiter/post-job')} className="gap-2">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </div>

          {/* Assignment Statuses section removed as requested */}

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Badge Leaders</h2>
              <p className="text-muted-foreground">Top performers across different skill categories</p>
            </div>
            <BadgeLeadersSlider />
          </div>

          <LeaderBoard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stats.activeJobs}</div>
                )}
                <p className="text-xs text-muted-foreground">Currently active job postings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stats.totalApplications}</div>
                )}
                <p className="text-xs text-muted-foreground">Applications received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stats.profileViews}</div>
                )}
                <p className="text-xs text-muted-foreground">Job posting views</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Job Postings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stats.recentJobs.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          <p className="text-xs text-muted-foreground">{job.location}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={job.is_active ? "default" : "secondary"}>
                            {job.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(job.created_at), "MMM dd")}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedJob(job)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Job Details</DialogTitle>
                                </DialogHeader>
                                {selectedJob && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Job Title</Label>
                                        <p className="text-sm text-muted-foreground">{selectedJob.title}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Company</Label>
                                        <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">Location</Label>
                                        <p className="text-sm text-muted-foreground">{selectedJob.location}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Badge variant={selectedJob.is_active ? "default" : "secondary"}>
                                          {selectedJob.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Posted On</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(selectedJob.created_at), "MMMM dd, yyyy")}
                                      </p>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={() => {
                                          setIsViewDialogOpen(false);
                                          navigate(`/recruiter/post-job?edit=${selectedJob.id}`);
                                        }}
                                        className="gap-2"
                                      >
                                        <Edit className="h-4 w-4" />
                                        Edit Job
                                      </Button>
                                      {selectedJob.job_url && (
                                        <Button
                                          variant="outline"
                                          onClick={() => window.open(selectedJob.job_url, '_blank')}
                                          className="gap-2"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                          View Application URL
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            {job.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/recruiter/post-job?edit=${job.id}`)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No job postings yet</p>
                    <Button 
                      onClick={() => navigate('/recruiter/post-job')} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Post Your First Job
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet</p>
                  <p className="text-sm">Applications will appear here once you post jobs</p>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </main>
      </ResizableLayout>
    </div>
  );
}