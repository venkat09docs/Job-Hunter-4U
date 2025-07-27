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
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { toast } from 'sonner';
import { Download, Plus, Search, Filter, Edit, Archive, Trash2, Coins } from 'lucide-react';

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
  const { profile } = useProfile();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEntry | null>(null);

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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Job Hunter Pro
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {profile?.tokens_remaining || 0} tokens
                  </span>
                </div>
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Job Tracker</h1>
                  <p className="text-muted-foreground">Track your job applications and interview progress</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setShowArchived(!showArchived)} size="sm">
                    {showArchived ? 'Show Active' : 'Show Archived'}
                  </Button>
                  
                  <Button onClick={exportToCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  
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
                </div>
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
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4">
                {getVisibleStatusOptions().map(status => {
                  const statusJobs = filteredJobs.filter(job => job.status === status);
                  const count = !showArchived ? getStatusCounts()[status] || 0 : statusJobs.length;
                  
                  return (
                    <div key={status} className="flex flex-col h-full min-w-[280px] md:min-w-[320px]">
                      {/* Pipeline Header */}
                      <div className={`${statusColors[status as keyof typeof statusColors]} text-white rounded-t-lg p-3 mb-3`}>
                        <div className="text-center">
                          <div className="text-xl md:text-2xl font-bold">{count}</div>
                          <div className="text-xs md:text-sm font-medium truncate">
                            {statusLabels[status as keyof typeof statusLabels]}
                          </div>
                        </div>
                      </div>
                      
                      {/* Board Column */}
                      <div className="flex-1 space-y-3 min-h-[250px] md:min-h-[300px] p-3 md:p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                        {statusJobs.map(job => (
                          <Card key={job.id} className="p-2 md:p-3 hover:shadow-md transition-all duration-200 cursor-pointer bg-background">
                            <div className="space-y-2">
                              <div className="font-medium text-xs md:text-sm line-clamp-2">{job.company_name}</div>
                              <div className="text-xs md:text-sm text-muted-foreground line-clamp-2">{job.job_title}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(job.application_date).toLocaleDateString()}
                              </div>
                              {job.location && (
                                <div className="text-xs text-muted-foreground truncate">📍 {job.location}</div>
                              )}
                              {job.salary_range && (
                                <div className="text-xs text-muted-foreground truncate">💰 {job.salary_range}</div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                                <Select 
                                  value={job.status} 
                                  onValueChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                                >
                                  <SelectTrigger className="h-7 md:h-8 text-xs w-full sm:w-auto">
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
                                <div className="flex items-center gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingJob(job)} className="h-7 w-7 p-0">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleArchiveJob(job.id, !job.is_archived)} className="h-7 w-7 p-0">
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                  {showArchived && (
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.id)} className="h-7 w-7 p-0">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {statusJobs.length === 0 && (
                          <div className="text-center text-muted-foreground text-xs md:text-sm py-6 md:py-8">
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
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {showArchived ? 'No archived jobs found.' : 'No jobs found. Start by adding your first job application!'}
                    </p>
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default JobTracker;