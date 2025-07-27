import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { JobTrackerForm } from '@/components/JobTrackerForm';
import { JobTrackerCard } from '@/components/JobTrackerCard';
import { toast } from 'sonner';
import { Download, Plus, Search, Filter } from 'lucide-react';

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
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEntry | null>(null);

  const statusOptions = [
    'applied', 'phone_screening', 'technical_interview', 'final_interview',
    'offer_received', 'rejected', 'withdrawn', 'hired'
  ];

  const statusColors = {
    applied: 'bg-blue-500',
    phone_screening: 'bg-yellow-500',
    technical_interview: 'bg-orange-500',
    final_interview: 'bg-purple-500',
    offer_received: 'bg-green-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-500',
    hired: 'bg-emerald-500'
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
    const matchesSearch = 
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const groupedJobs = () => {
    if (groupBy === 'status') {
      const grouped = filteredJobs.reduce((acc, job) => {
        if (!acc[job.status]) acc[job.status] = [];
        acc[job.status].push(job);
        return acc;
      }, {} as Record<string, JobEntry[]>);
      return grouped;
    } else if (groupBy === 'company') {
      const grouped = filteredJobs.reduce((acc, job) => {
        if (!acc[job.company_name]) acc[job.company_name] = [];
        acc[job.company_name].push(job);
        return acc;
      }, {} as Record<string, JobEntry[]>);
      return grouped;
    }
    return { 'All Jobs': filteredJobs };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Tracker</h1>
          <p className="text-muted-foreground">Track your job applications and interview progress</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
              </DialogHeader>
              <JobTrackerForm
                onSubmit={handleAddJob}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
                <SelectItem value="company">Group by Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-6">
        {Object.entries(groupedJobs()).map(([groupName, groupJobs]) => (
          <div key={groupName}>
            {groupBy !== 'none' && (
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {groupName.replace('_', ' ').toUpperCase()}
                </h2>
                <Badge variant="secondary">{groupJobs.length}</Badge>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupJobs.map((job) => (
                <JobTrackerCard
                  key={job.id}
                  job={job}
                  onEdit={setEditingJob}
                  onArchive={handleArchiveJob}
                  onDelete={handleDeleteJob}
                  statusColor={statusColors[job.status as keyof typeof statusColors]}
                  showArchived={showArchived}
                />
              ))}
            </div>
          </div>
        ))}
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
        <DialogContent className="max-w-2xl">
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
  );
};

export default JobTracker;