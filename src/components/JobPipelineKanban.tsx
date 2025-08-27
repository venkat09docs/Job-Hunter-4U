import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { DroppableStatusColumn } from '@/components/DroppableStatusColumn';
import { DraggableKanbanCard } from '@/components/DraggableKanbanCard';
import { 
  Plus, 
  Building, 
  ExternalLink, 
  Calendar,
  Trophy,
  TrendingUp,
  Users,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

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

export const JobPipelineKanban: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_url: '',
    location: '',
    salary_range: '',
    contact_person: '',
    contact_email: '',
    status: 'wishlist',
    notes: ''
  });

  // Map job_tracker statuses to pipeline stages for consistent display
  const pipelineStages = ['wishlist', 'applied', 'interviewing', 'accepted'];
  const stageLabels = {
    wishlist: 'Wish List',
    applied: 'Applied',
    interviewing: 'Interviewing',
    accepted: 'Offers'
  };
  const stageColors = {
    wishlist: 'bg-gray-500',
    applied: 'bg-yellow-500',
    interviewing: 'bg-orange-500',
    accepted: 'bg-green-500'
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
      setupRealtimeSubscription();
    }
  }, [user]);

  // Setup real-time subscription for synchronization
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('job-tracker-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_tracker',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Job tracker change detected:', payload);
          fetchJobs(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .in('status', pipelineStages) // Only show pipeline-relevant statuses
        .order('application_date', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (jobData: any) => {
    try {
      if (!formData.company_name || !formData.job_title || !user?.id) {
        toast.error('Company name and job title are required');
        return;
      }

      const { data, error } = await supabase
        .from('job_tracker')
        .insert({
          company_name: formData.company_name,
          job_title: formData.job_title,
          status: formData.status || 'wishlist',
          application_date: new Date().toISOString().split('T')[0],
          notes: formData.notes || null,
          job_url: formData.job_url || null,
          salary_range: formData.salary_range || null,
          location: formData.location || null,
          contact_person: formData.contact_person || null,
          contact_email: formData.contact_email || null,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setJobs(prev => [data, ...prev]);
      setIsAddDialogOpen(false);
      setFormData({
        company_name: '',
        job_title: '',
        job_url: '',
        location: '',
        salary_range: '',
        contact_person: '',
        contact_email: '',
        status: 'wishlist',
        notes: ''
      });
      toast.success('Job added to pipeline!');
    } catch (error: any) {
      toast.error('Failed to add job: ' + error.message);
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const jobId = active.id as string;
    const newStatus = over.id as string;
    
    if (!pipelineStages.includes(newStatus)) {
      return;
    }
    
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === newStatus) {
      return;
    }
    
    await handleStatusChange(jobId, newStatus);
  };

  const getStageCounts = () => {
    return pipelineStages.reduce((counts, stage) => {
      counts[stage] = jobs.filter(job => job.status === stage).length;
      return counts;
    }, {} as Record<string, number>);
  };

  const getJobsByStage = (stage: string) => {
    return jobs.filter(job => job.status === stage);
  };

  const getWeeklyProgress = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyJobs = jobs.filter(job => 
      new Date(job.created_at) >= oneWeekAgo
    );
    
    return {
      totalAdded: weeklyJobs.length,
      applied: weeklyJobs.filter(job => job.status === 'applied').length,
      interviewing: weeklyJobs.filter(job => job.status === 'interviewing').length,
      offers: weeklyJobs.filter(job => job.status === 'accepted').length
    };
  };

  const stageCounts = getStageCounts();
  const weeklyProgress = getWeeklyProgress();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Progress Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Pipeline</p>
                <p className="text-2xl font-bold">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold">{weeklyProgress.totalAdded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Interviewing</p>
                <p className="text-2xl font-bold">{stageCounts.interviewing || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Offers</p>
                <p className="text-2xl font-bold">{stageCounts.accepted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Pipeline</h2>
          <p className="text-muted-foreground">Drag jobs between stages to track progress - synced with Job Hunter Pro</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Job to Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  placeholder="Company name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                  placeholder="Job title"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job_url">Job URL (optional)</Label>
                <Input
                  id="job_url"
                  value={formData.job_url}
                  onChange={(e) => setFormData({...formData, job_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, State/Country"
                  />
                </div>
                
                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="Hiring manager name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    type="email"
                    placeholder="email@company.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wishlist">Wish List</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="accepted">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about this opportunity..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddJob}
                  className="flex-1"
                >
                  Add to Pipeline
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => (
            <DroppableStatusColumn
              key={stage}
              status={stage}
              statusColor={stageColors[stage as keyof typeof stageColors]}
              statusLabel={stageLabels[stage as keyof typeof stageLabels]}
              count={stageCounts[stage] || 0}
            >
              <div className="space-y-3">
                {getJobsByStage(stage).map((job) => (
                  <DraggableKanbanCard
                    key={job.id}
                    job={job}
                    statusOptions={pipelineStages}
                    statusLabels={stageLabels}
                    hasActiveSubscription={true}
                    onStatusChange={(jobId, newStatus) => handleStatusChange(jobId, newStatus)}
                    onCardClick={() => {}}
                  />
                ))}
                {getJobsByStage(stage).length === 0 && (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    No jobs in this stage
                  </div>
                )}
              </div>
            </DroppableStatusColumn>
          ))}
        </div>
      </DndContext>
      
      {jobs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">
              No jobs in your pipeline yet. Start by adding your first job opportunity!
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Job
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};