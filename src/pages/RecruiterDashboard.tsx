import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, Eye, LayoutDashboard, Calendar, Edit, ExternalLink, Trash2, Search, Filter, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useRecruiterStats } from "@/hooks/useRecruiterStats";
import { useRecruiterJobs } from "@/hooks/useRecruiterJobs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizableLayout } from "@/components/ResizableLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { stats, loading, error } = useRecruiterStats();
  const { jobs, loading: jobsLoading, filters, updateFilter, clearFilters, deleteJob, toggleJobStatus } = useRecruiterJobs();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Job Postings</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search jobs..."
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job_type">Job Type</Label>
                    <Select value={filters.job_type} onValueChange={(value) => updateFilter('job_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
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
                  <div className="col-span-full">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {jobsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : jobs.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Posted Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{job.company}</TableCell>
                          <TableCell>{job.location || 'N/A'}</TableCell>
                          <TableCell className="capitalize">{job.job_type?.replace('-', ' ') || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(job.created_at), "MMM dd, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={job.is_active ? "default" : "secondary"}>
                              {job.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
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
                                    <DialogDescription>View complete job posting information</DialogDescription>
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
                                          <p className="text-sm text-muted-foreground">{selectedJob.location || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Job Type</Label>
                                          <p className="text-sm text-muted-foreground capitalize">{selectedJob.job_type?.replace('-', ' ') || 'Not specified'}</p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-sm font-medium">Experience Level</Label>
                                          <p className="text-sm text-muted-foreground">{selectedJob.experience_level || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-sm font-medium">Status</Label>
                                          <Badge variant={selectedJob.is_active ? "default" : "secondary"}>
                                            {selectedJob.is_active ? "Active" : "Inactive"}
                                          </Badge>
                                        </div>
                                      </div>
                                      {(selectedJob.salary_min || selectedJob.salary_max) && (
                                        <div>
                                          <Label className="text-sm font-medium">Salary Range</Label>
                                          <p className="text-sm text-muted-foreground">
                                            ₹{selectedJob.salary_min?.toLocaleString() || 'N/A'} - ₹{selectedJob.salary_max?.toLocaleString() || 'N/A'}
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-sm font-medium">Description</Label>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                                      </div>
                                      {selectedJob.requirements && (
                                        <div>
                                          <Label className="text-sm font-medium">Requirements</Label>
                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.requirements}</p>
                                        </div>
                                      )}
                                      {selectedJob.benefits && (
                                        <div>
                                          <Label className="text-sm font-medium">Benefits</Label>
                                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.benefits}</p>
                                        </div>
                                      )}
                                      <div>
                                        <Label className="text-sm font-medium">Posted On</Label>
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(selectedJob.created_at), "MMMM dd, yyyy")}
                                        </p>
                                      </div>
                                      {selectedJob.application_deadline && (
                                        <div>
                                          <Label className="text-sm font-medium">Application Deadline</Label>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(selectedJob.application_deadline), "MMMM dd, yyyy")}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/recruiter/post-job?edit=${job.id}`)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleJobStatus(job.id, job.is_active)}
                                className="h-8 w-8 p-0"
                                title={job.is_active ? "Deactivate job" : "Activate job"}
                              >
                                <Power className={`h-4 w-4 ${job.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this job posting? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteJob(job.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No job postings found</p>
                  <p className="text-sm mb-4">Start by creating your first job posting</p>
                  <Button onClick={() => navigate('/recruiter/post-job')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Post Your First Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </main>
      </ResizableLayout>
    </div>
  );
}