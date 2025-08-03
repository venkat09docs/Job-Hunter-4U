import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JobTrackerForm } from '@/components/JobTrackerForm';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus, SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { toast } from 'sonner';
import { 
  Download, Plus, Search, Filter, Edit, Archive, Trash2, Coins, ArrowLeft,
  MapPin, Building, Clock, ExternalLink, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  notes?: string;
  job_url?: string;
  salary_range?: string;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  next_follow_up?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

const JobTracker = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEntry | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);

  const statusOptions = ['wishlist', 'applying', 'applied', 'interviewing', 'negotiating', 'accepted'];
  const statusColors = {
    wishlist: 'bg-gray-500',
    applying: 'bg-blue-500',
    applied: 'bg-yellow-500',
    interviewing: 'bg-orange-500',
    negotiating: 'bg-purple-500',
    accepted: 'bg-green-500'
  };
  const statusLabels = {
    wishlist: 'Wishlist',
    applying: 'Applying',
    applied: 'Applied',
    interviewing: 'Interviewing',
    negotiating: 'Negotiating',
    accepted: 'Accepted'
  };

  const getStatusCounts = () => {
    return statusOptions.reduce((counts, status) => {
      counts[status] = jobs.filter(job => job.status === status && !job.is_archived).length;
      return counts;
    }, {} as Record<string, number>);
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, showArchived]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', showArchived)
        .order('application_date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (jobData: Partial<JobEntry>) => {
    try {
      if (!jobData.company_name || !jobData.job_title || !user?.id) {
        toast.error('Company name and job title are required');
        return;
      }

      const { data, error } = await supabase
        .from('job_tracker')
        .insert({
          company_name: jobData.company_name,
          job_title: jobData.job_title,
          status: jobData.status || 'applied',
          application_date: jobData.application_date || new Date().toISOString().split('T')[0],
          notes: jobData.notes || null,
          job_url: jobData.job_url || null,
          salary_range: jobData.salary_range || null,
          location: jobData.location || null,
          contact_person: jobData.contact_person || null,
          contact_email: jobData.contact_email || null,
          next_follow_up: jobData.next_follow_up || null,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setJobs(prev => [data, ...prev]);
      setIsAddDialogOpen(false);
      toast.success('Job added successfully!');
    } catch (error: any) {
      toast.error('Failed to add job: ' + error.message);
    }
  };

  const handleEditJob = async (jobData: Partial<JobEntry>) => {
    if (!editingJob) return;
    try {
      const { data, error } = await supabase
        .from('job_tracker')
        .update(jobData)
        .eq('id', editingJob.id)
        .select()
        .single();

      if (error) throw error;
      setJobs(prev => prev.map(job => job.id === editingJob.id ? data : job));
      setEditingJob(null);
      toast.success('Job updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update job: ' + error.message);
    }
  };

  const handleArchiveJob = async (jobId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('job_tracker')
        .update({ is_archived: archive })
        .eq('id', jobId);

      if (error) throw error;
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success(archive ? 'Job archived successfully!' : 'Job unarchived successfully!');
    } catch (error: any) {
      toast.error('Failed to archive job: ' + error.message);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_tracker')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Job deleted permanently!');
    } catch (error: any) {
      toast.error('Failed to delete job: ' + error.message);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('job_tracker')
        .update({ status: newStatus })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      setJobs(prev => prev.map(job => job.id === jobId ? data : job));
      toast.success('Status updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Company', 'Job Title', 'Status', 'Application Date', 'Location', 'Salary Range', 'Notes'].join(','),
      ...filteredJobs.map(job => [
        job.company_name,
        job.job_title,
        job.status,
        job.application_date,
        job.location || '',
        job.salary_range || '',
        job.notes?.replace(/,/g, ';') || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get visible status columns - only show columns that have matching jobs or when no search/filter is active
  const getVisibleStatusOptions = () => {
    if (searchTerm || statusFilter !== 'all') {
      return statusOptions.filter(status => {
        const statusJobs = filteredJobs.filter(job => job.status === status);
        return statusJobs.length > 0;
      });
    }
    return statusOptions;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-gradient-hero">
      {/* Top Menu Header */}
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
              Job Hunter Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <SubscriptionStatus />
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-full mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Job Status Tracker</h1>
              <p className="text-muted-foreground">Complete job tracking system from application to hire</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {hasActiveSubscription() ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowArchived(!showArchived)} 
                  size="sm"
                >
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </Button>
              ) : (
                <SubscriptionUpgrade featureName="job tracker">
                  <Button variant="outline" size="sm">
                    {showArchived ? 'Show Active' : 'Show Archived'}
                  </Button>
                </SubscriptionUpgrade>
              )}
              
              {hasActiveSubscription() ? (
                <Button 
                  onClick={exportToCSV} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              ) : (
                <SubscriptionUpgrade featureName="job tracker">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </SubscriptionUpgrade>
              )}
              
              {hasActiveSubscription() ? (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Job</DialogTitle>
                    </DialogHeader>
                    <JobTrackerForm onSubmit={handleAddJob} onCancel={() => setIsAddDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              ) : (
                <SubscriptionUpgrade featureName="job tracker">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job
                  </Button>
                </SubscriptionUpgrade>
              )}
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {statusOptions.map(status => {
              const count = getStatusCounts()[status];
              return (
                <Card key={status} className="p-4">
                  <div className="text-center">
                    <div className={`${statusColors[status as keyof typeof statusColors]} text-white rounded-lg p-2 mb-2`}>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {statusLabels[status as keyof typeof statusLabels]}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search Applications..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-8" 
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status as keyof typeof statusLabels]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Integrated Kanban Board with Pipeline */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 md:gap-3">
            {getVisibleStatusOptions().map(status => {
              const statusJobs = filteredJobs.filter(job => job.status === status);
              const count = !showArchived ? getStatusCounts()[status] || 0 : statusJobs.length;
              
              return (
                <div key={status} className="flex flex-col">
                  {/* Pipeline Header */}
                  <div className={`${statusColors[status as keyof typeof statusColors]} text-white rounded-t-lg p-1 sm:p-2 md:p-3 mb-1 sm:mb-2`}>
                    <div className="text-center">
                      <div className="text-sm sm:text-lg md:text-xl font-bold">{count}</div>
                      <div className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight break-words">
                        {statusLabels[status as keyof typeof statusLabels]}
                      </div>
                    </div>
                  </div>
                  
                  {/* Board Column */}
                   <div className="flex-1 space-y-1 sm:space-y-2 min-h-[150px] sm:min-h-[200px] md:min-h-[250px] p-1 sm:p-2 md:p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                     {statusJobs.map(job => (
                       <Card 
                         key={job.id} 
                         className="p-1 sm:p-2 md:p-3 hover:shadow-md transition-all duration-200 cursor-pointer bg-background"
                         onClick={() => setSelectedJob(job)}
                       >
                         <div className="space-y-1">
                          <div className="font-medium text-[10px] sm:text-xs md:text-sm line-clamp-2">{job.company_name}</div>
                          <div className="text-[9px] sm:text-xs text-muted-foreground line-clamp-2">{job.job_title}</div>
                          <div className="text-[9px] sm:text-xs text-muted-foreground">
                            {new Date(job.application_date).toLocaleDateString()}
                          </div>
                          {job.location && (
                            <div className="text-[9px] sm:text-xs text-muted-foreground truncate">📍 {job.location}</div>
                          )}
                          {job.salary_range && (
                            <div className="text-[9px] sm:text-xs text-muted-foreground truncate">💰 {job.salary_range}</div>
                          )}
                            <div className="flex flex-col gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                              {hasActiveSubscription() ? (
                                <Select
                                 value={job.status} 
                                 onValueChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                               >
                                 <SelectTrigger className="h-5 sm:h-6 md:h-7 text-[9px] sm:text-xs w-full">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {statusOptions.map(statusOption => (
                                     <SelectItem key={statusOption} value={statusOption}>
                                       {statusLabels[statusOption as keyof typeof statusLabels]}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             ) : (
                               <SubscriptionUpgrade featureName="job tracker">
                                 <Select value={job.status}>
                                   <SelectTrigger className="h-5 sm:h-6 md:h-7 text-[9px] sm:text-xs w-full">
                                     <SelectValue />
                                   </SelectTrigger>
                                 </Select>
                               </SubscriptionUpgrade>
                              )}
                              <div className="flex items-center gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
                                {hasActiveSubscription() ? (
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => setEditingJob(job)} 
                                   className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                 >
                                   <Edit className="h-2 w-2 sm:h-3 sm:w-3" />
                                 </Button>
                               ) : (
                                 <SubscriptionUpgrade featureName="job tracker">
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                   >
                                     <Edit className="h-2 w-2 sm:h-3 sm:w-3" />
                                   </Button>
                                 </SubscriptionUpgrade>
                               )}
                               {hasActiveSubscription() ? (
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => handleArchiveJob(job.id, !job.is_archived)} 
                                   className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                 >
                                   <Archive className="h-2 w-2 sm:h-3 sm:w-3" />
                                 </Button>
                               ) : (
                                 <SubscriptionUpgrade featureName="job tracker">
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                   >
                                     <Archive className="h-2 w-2 sm:h-3 sm:w-3" />
                                   </Button>
                                 </SubscriptionUpgrade>
                               )}
                               {showArchived && (
                                 hasActiveSubscription() ? (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => handleDeleteJob(job.id)} 
                                     className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                   >
                                     <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                                   </Button>
                                 ) : (
                                   <SubscriptionUpgrade featureName="job tracker">
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                                     >
                                       <Trash2 className="h-2 w-2 sm:h-3 sm:w-3" />
                                     </Button>
                                   </SubscriptionUpgrade>
                                 )
                               )}
                             </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {statusJobs.length === 0 && (
                      <div className="text-center text-muted-foreground text-[9px] sm:text-xs py-2 sm:py-4">
                        No applications
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  {showArchived ? 'No archived jobs found.' : 'No jobs found. Start by adding your first job application!'}
                </p>
                {!hasActiveSubscription() && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upgrade to premium to start tracking your job applications.
                    </p>
                    <SubscriptionUpgrade featureName="job tracker">
                      <Button variant="outline">
                        Upgrade to Premium
                      </Button>
                    </SubscriptionUpgrade>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job</DialogTitle>
              </DialogHeader>
              {editingJob && (
                <JobTrackerForm 
                  initialData={editingJob} 
                  onSubmit={handleEditJob} 
                  onCancel={() => setEditingJob(null)} 
                />
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
                      <span className="font-medium">{selectedJob.company_name}</span>
                    </div>
                    {selectedJob.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-5 w-5" />
                        <span>{selectedJob.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-5 w-5" />
                      <span>Applied {new Date(selectedJob.application_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Status</h3>
                    <Badge className={`${statusColors[selectedJob.status as keyof typeof statusColors]} text-white`}>
                      {statusLabels[selectedJob.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>

                  {/* Salary Information */}
                  {selectedJob.salary_range && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Salary Range</h3>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg font-medium">{selectedJob.salary_range}</span>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(selectedJob.contact_person || selectedJob.contact_email) && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
                      <div className="space-y-2">
                        {selectedJob.contact_person && (
                          <div>
                            <span className="font-medium">Contact Person: </span>
                            <span>{selectedJob.contact_person}</span>
                          </div>
                        )}
                        {selectedJob.contact_email && (
                          <div>
                            <span className="font-medium">Email: </span>
                            <a href={`mailto:${selectedJob.contact_email}`} className="text-primary hover:underline">
                              {selectedJob.contact_email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next Follow-up */}
                  {selectedJob.next_follow_up && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Next Follow-up</h3>
                      <span>{new Date(selectedJob.next_follow_up).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedJob.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {selectedJob.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t">
                    {selectedJob.job_url && (
                      <Button className="flex items-center gap-2" asChild>
                        <a 
                          href={selectedJob.job_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View Job Posting
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    {hasActiveSubscription() && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setEditingJob(selectedJob);
                          setSelectedJob(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Job
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

export default JobTracker;