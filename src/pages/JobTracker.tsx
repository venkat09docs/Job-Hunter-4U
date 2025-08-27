import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { JobTrackerForm } from '@/components/JobTrackerForm';
import { DraggableKanbanCard } from '@/components/DraggableKanbanCard';
import { DroppableStatusColumn } from '@/components/DroppableStatusColumn';
import { ApplicationRequirementsModal } from '@/components/ApplicationRequirementsModal';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { SubscriptionStatus, SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';
import { toast } from 'sonner';
import { 
  Upload, Plus, Search, Filter, Edit, Archive, Trash2, Coins, ArrowLeft,
  MapPin, Building, Clock, ExternalLink, DollarSign
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { useJobApplicationActivities } from '@/hooks/useJobApplicationActivities';

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
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEntry | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const [pendingJobMove, setPendingJobMove] = useState<{
    jobId: string;
    job: JobEntry;
    newStatus: string;
  } | null>(null);
  const [showBackwardMoveAlert, setShowBackwardMoveAlert] = useState(false);
  const [backwardMoveData, setBackwardMoveData] = useState<{
    jobId: string;
    job: JobEntry;
    newStatus: string;
  } | null>(null);

  const { incrementActivity } = useJobApplicationActivities();

  const statusOptions = ['wishlist', 'applied', 'interviewing', 'negotiating', 'accepted', 'not_selected', 'no_response'];
  const statusColors = {
    wishlist: 'bg-gray-500',
    applied: 'bg-yellow-500',
    interviewing: 'bg-orange-500',
    negotiating: 'bg-purple-500',
    accepted: 'bg-green-500',
    not_selected: 'bg-red-500',
    no_response: 'bg-slate-500',
    archived: 'bg-gray-400'
  };
  const statusLabels = {
    wishlist: 'Wishlist',
    applied: 'Applied',
    interviewing: 'Interviewing',
    negotiating: 'Negotiating',
    accepted: 'Accepted',
    not_selected: 'Not Selected',
    no_response: 'No Response',
    archived: 'Archived'
  };

  // Helper function to check if backward movement to wishlist is prohibited
  const isBackwardMoveProhibited = (currentStatus: string, newStatus: string): boolean => {
    // Prevent moving back to wishlist from any status that comes after applied
    const progressiveStatuses = ['applied', 'interviewing', 'negotiating', 'accepted', 'not_selected', 'no_response'];
    return newStatus === 'wishlist' && progressiveStatuses.includes(currentStatus);
  };

  // Helper function to get friendly status name for messages
  const getStatusDisplayName = (status: string): string => {
    return statusLabels[status as keyof typeof statusLabels] || status;
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

  // Create notifications for stale job applications
  useEffect(() => {
    if (jobs.length > 0 && user) {
      createStaleJobNotifications();
    }
  }, [jobs, user]);

  const createStaleJobNotifications = async () => {
    const staleJobs = jobs.filter(job => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(job.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceUpdate > 1 && !job.is_archived;
    });

    if (staleJobs.length === 0) return;

    try {
      // First, delete existing stale job notifications to avoid duplicates
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id)
        .eq('type', 'job_status_stale');

      // Create new notifications for each stale job
      const notifications = staleJobs.map(job => {
        const daysSinceUpdate = Math.floor((Date.now() - new Date(job.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        return {
          user_id: user?.id,
          title: 'Job Application Needs Update',
          message: `${job.job_title} at ${job.company_name} hasn't been updated for ${daysSinceUpdate} days. Please verify and update the status.`,
          type: 'job_status_stale',
          related_id: job.id,
          is_read: false
        };
      });

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating stale job notifications:', error);
    }
  };

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

      // Create follow-up reminder notification if date is set
      if (jobData.next_follow_up) {
        try {
          const { error: notificationError } = await supabase.rpc('create_follow_up_reminder', {
            p_user_id: user.id,
            p_job_id: data.id,
            p_company_name: data.company_name,
            p_job_title: data.job_title,
            p_follow_up_date: jobData.next_follow_up
          });
          
          if (notificationError) {
            console.error('Failed to create follow-up reminder:', notificationError);
          }
        } catch (notificationError) {
          console.error('Failed to create follow-up reminder:', notificationError);
        }
      }

      // Auto-track metrics for Career Growth Activities
      try {
        if (data.status === 'wishlist') {
          await incrementActivity('save_potential_opportunities');
        }
        if (data.status === 'applied') {
          await incrementActivity('apply_quality_jobs');
        }
      } catch (e) {
        console.error('Failed to increment daily job application metrics', e);
      }

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
      
      // Create follow-up reminder notification if date is set
      if (jobData.next_follow_up) {
        try {
          const { error: notificationError } = await supabase.rpc('create_follow_up_reminder', {
            p_user_id: user?.id,
            p_job_id: editingJob.id,
            p_company_name: data.company_name,
            p_job_title: data.job_title,
            p_follow_up_date: jobData.next_follow_up
          });
          
          if (notificationError) {
            console.error('Failed to create follow-up reminder:', notificationError);
          }
        } catch (notificationError) {
          console.error('Failed to create follow-up reminder:', notificationError);
        }
      }
      
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
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Check for prohibited backward movement to wishlist
    if (isBackwardMoveProhibited(job.status, newStatus)) {
      setBackwardMoveData({ jobId, job, newStatus });
      setShowBackwardMoveAlert(true);
      return;
    }
    
    // Check if moving from wishlist to applied - require completion of requirements
    if (job.status === 'wishlist' && newStatus === 'applied') {
      setPendingJobMove({ jobId, job, newStatus });
      setIsRequirementsModalOpen(true);
      return;
    }
    
    // For other moves, proceed with direct status update
    await performStatusUpdate(jobId, newStatus, job.status);
  };

  const performStatusUpdate = async (jobId: string, newStatus: string, prevStatus?: string) => {
    try {
      if (!prevStatus) {
        prevStatus = jobs.find(j => j.id === jobId)?.status;
      }

      const { data, error } = await supabase
        .from('job_tracker')
        .update({ status: newStatus })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      setJobs(prev => prev.map(job => job.id === jobId ? data : job));

      // Auto-track transitions into key stages for daily metrics
      try {
        if (newStatus === 'wishlist' && prevStatus !== 'wishlist') {
          await incrementActivity('save_potential_opportunities');
        }
        const isApplyNew = (newStatus === 'applied');
        const wasApply = (prevStatus === 'applied');
        if (isApplyNew && !wasApply) {
          await incrementActivity('apply_quality_jobs');
        }
      } catch (e) {
        console.error('Failed to increment daily job application metrics', e);
      }

      toast.success('Status updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const jobId = active.id as string;
    const newStatus = over.id as string;
    
    // Check if the drop target is a valid status
    if (!statusOptions.includes(newStatus)) {
      return;
    }
    
    // Find the job being dragged
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === newStatus) {
      return;
    }
    
    // Check for prohibited backward movement to wishlist
    if (isBackwardMoveProhibited(job.status, newStatus)) {
      setBackwardMoveData({ jobId, job, newStatus });
      setShowBackwardMoveAlert(true);
      return;
    }
    
    // Check if moving from wishlist to applied - require completion of requirements
    if (job.status === 'wishlist' && newStatus === 'applied') {
      setPendingJobMove({ jobId, job, newStatus });
      setIsRequirementsModalOpen(true);
      return;
    }
    
    // For other moves, proceed normally
    await performStatusUpdate(jobId, newStatus, job.status);
  };

  const handleRequirementsComplete = async (updatedJobData: Partial<JobEntry>) => {
    if (!pendingJobMove) return;
    
    try {
      // Update the job with the additional data first
      const { data, error } = await supabase
        .from('job_tracker')
        .update({
          status: pendingJobMove.newStatus,
          ...updatedJobData,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingJobMove.jobId)
        .select()
        .single();

      if (error) throw error;
      
      setJobs(prev => prev.map(job => job.id === pendingJobMove.jobId ? data : job));
      
      // Auto-track the application activity
      try {
        await incrementActivity('apply_quality_jobs');
      } catch (e) {
        console.error('Failed to increment daily job application metrics', e);
      }
      
      toast.success('Application requirements completed! Job moved to Applied.');
      
      // Close modal and clear pending move
      setIsRequirementsModalOpen(false);
      setPendingJobMove(null);
    } catch (error: any) {
      toast.error('Failed to complete application: ' + error.message);
    }
  };

  const handleRequirementsCancel = () => {
    setIsRequirementsModalOpen(false);
    setPendingJobMove(null);
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

  if (loading || premiumLoading) {
    return (
      <div className="min-h-screen flex w-full bg-gradient-hero">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Check premium access
  if (!canAccessFeature('job_tracker')) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-gradient-hero">
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto flex items-center justify-center">
          <SubscriptionUpgrade featureName="job_tracker">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>Premium Feature</CardTitle>
                <CardDescription>
                  Job Tracker is a premium feature. Upgrade your plan to access advanced job tracking capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Upgrade Now</Button>
              </CardContent>
            </Card>
          </SubscriptionUpgrade>
        </main>
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
                  <Upload className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              ) : (
                <SubscriptionUpgrade featureName="job tracker">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
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
          <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-1 md:gap-2 overflow-x-auto min-h-[300px]">
              {getVisibleStatusOptions().map(status => {
                const statusJobs = filteredJobs.filter(job => job.status === status);
                const count = !showArchived ? getStatusCounts()[status] || 0 : statusJobs.length;
                
                return (
                  <div key={status} className="flex-1 min-w-[140px] max-w-[200px]">
                    <DroppableStatusColumn
                      status={status}
                      statusColor={statusColors[status as keyof typeof statusColors]}
                      statusLabel={statusLabels[status as keyof typeof statusLabels]}
                      count={count}
                    >
                     {statusJobs.map(job => (
                       <DraggableKanbanCard
                         key={job.id}
                         job={job}
                         statusOptions={statusOptions}
                         statusLabels={statusLabels}
                         hasActiveSubscription={hasActiveSubscription()}
                         onStatusChange={handleStatusChange}
                         onCardClick={setSelectedJob}
                       />
                     ))}
                    {statusJobs.length === 0 && (
                      <div className="text-center text-muted-foreground text-[9px] sm:text-xs py-2 sm:py-4">
                        No applications
                      </div>
                    )}
                    </DroppableStatusColumn>
                  </div>
                );
              })}
            </div>
          </DndContext>

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
                        <Coins className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </SubscriptionUpgrade>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Job Dialog */}
          {editingJob && (
            <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Job Application</DialogTitle>
                </DialogHeader>
                <JobTrackerForm 
                  initialData={editingJob} 
                  onSubmit={handleEditJob} 
                  onCancel={() => setEditingJob(null)} 
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Job Details Dialog */}
          {selectedJob && (
            <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Job Application Details</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedJob.job_title}</h3>
                      <p className="text-lg text-muted-foreground">{selectedJob.company_name}</p>
                    </div>
                    <Badge className={`${statusColors[selectedJob.status as keyof typeof statusColors]} text-white border-0`}>
                      {statusLabels[selectedJob.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Application Date</p>
                      <p>{new Date(selectedJob.application_date).toLocaleDateString()}</p>
                    </div>
                    
                    {selectedJob.location && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p>{selectedJob.location}</p>
                      </div>
                    )}
                    
                    {selectedJob.salary_range && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Salary Range</p>
                        <p>{selectedJob.salary_range}</p>
                      </div>
                    )}
                    
                    {selectedJob.contact_person && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                        <p>{selectedJob.contact_person}</p>
                      </div>
                    )}
                    
                    {selectedJob.contact_email && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                        <p>{selectedJob.contact_email}</p>
                      </div>
                    )}
                    
                    {selectedJob.next_follow_up && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Next Follow-up</p>
                        <p>{new Date(selectedJob.next_follow_up).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {selectedJob.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="whitespace-pre-wrap">{selectedJob.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {selectedJob.job_url && (
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(selectedJob.job_url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Job Posting
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => {
                        setEditingJob(selectedJob);
                        setSelectedJob(null);
                      }}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Application
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Application Requirements Modal */}
        {pendingJobMove && (
          <ApplicationRequirementsModal
            isOpen={isRequirementsModalOpen}
            onClose={handleRequirementsCancel}
            onComplete={handleRequirementsComplete}
            job={pendingJobMove.job}
          />
        )}

        {/* Backward Move Warning Alert */}
        <AlertDialog open={showBackwardMoveAlert} onOpenChange={setShowBackwardMoveAlert}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <span className="text-destructive text-lg">⚠️</span>
                </div>
                Invalid Status Change
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                {backwardMoveData && (
                  <>
                    You cannot move the job <strong>{backwardMoveData.job.job_title}</strong> at{" "}
                    <strong>{backwardMoveData.job.company_name}</strong> from{" "}
                    <strong>{getStatusDisplayName(backwardMoveData.job.status)}</strong> back to{" "}
                    <strong>{getStatusDisplayName(backwardMoveData.newStatus)}</strong>.
                    <br /><br />
                    Once a job application has progressed beyond the wishlist stage, it cannot be moved backward to maintain data integrity and proper tracking of your application progress.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setShowBackwardMoveAlert(false);
                  setBackwardMoveData(null);
                }}
              >
                Got it, thanks!
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default JobTracker;