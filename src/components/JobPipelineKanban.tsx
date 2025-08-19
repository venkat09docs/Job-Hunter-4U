import React, { useState } from 'react';
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
import { useJobHuntingPipeline, JobPipelineItem } from '@/hooks/useJobHuntingPipeline';
import { toast } from 'sonner';

export const JobPipelineKanban: React.FC = () => {
  const { 
    pipelineItems, 
    loading, 
    pipelineStages, 
    stageLabels, 
    stageColors,
    addPipelineItem,
    movePipelineStage,
    deletePipelineItem,
    getStageCounts,
    getItemsByStage,
    getTotalPoints,
    getWeeklyProgress
  } = useJobHuntingPipeline();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    company_name: '',
    job_title: '',
    job_url: '',
    source: '',
    priority: 'medium',
    pipeline_stage: 'leads'
  });

  const handleAddJob = async () => {
    if (!newJob.company_name || !newJob.job_title) {
      toast.error('Company name and job title are required');
      return;
    }

    try {
      await addPipelineItem(newJob);
      setNewJob({
        company_name: '',
        job_title: '',
        job_url: '',
        source: '',
        priority: 'medium',
        pipeline_stage: 'leads'
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const jobId = active.id as string;
    const newStage = over.id as string;
    
    if (!pipelineStages.includes(newStage)) {
      return;
    }
    
    await movePipelineStage(jobId, newStage);
  };

  const stageCounts = getStageCounts();
  const weeklyProgress = getWeeklyProgress();

  const renderJobCard = (job: JobPipelineItem) => (
    <Card key={job.id} className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm">{job.job_title}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building className="h-3 w-3" />
                {job.company_name}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={
                job.priority === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                job.priority === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                'border-green-200 text-green-700 bg-green-50'
              }
            >
              {job.priority}
            </Badge>
          </div>

          {job.job_url && (
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
              <a 
                href={job.job_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                View Job
              </a>
            </div>
          )}

          {job.application_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Applied: {new Date(job.application_date).toLocaleDateString()}
            </div>
          )}

          {job.points_earned > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Trophy className="h-3 w-3 text-yellow-600" />
              <span className="text-yellow-700 font-medium">{job.points_earned} points</span>
            </div>
          )}

          {job.source && (
            <Badge variant="secondary" className="text-xs">
              {job.source}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
                <p className="text-2xl font-bold">{pipelineItems.length}</p>
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
                <p className="text-sm font-medium">Total Points</p>
                <p className="text-2xl font-bold">{getTotalPoints()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Pipeline</h2>
          <p className="text-muted-foreground">Drag jobs between stages to track progress</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Job to Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={newJob.company_name}
                  onChange={(e) => setNewJob({...newJob, company_name: e.target.value})}
                  placeholder="Company name"
                />
              </div>
              
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={newJob.job_title}
                  onChange={(e) => setNewJob({...newJob, job_title: e.target.value})}
                  placeholder="Job title"
                />
              </div>
              
              <div>
                <Label htmlFor="job_url">Job URL (optional)</Label>
                <Input
                  id="job_url"
                  value={newJob.job_url}
                  onChange={(e) => setNewJob({...newJob, job_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select value={newJob.source} onValueChange={(value) => setNewJob({...newJob, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="company_website">Company Website</SelectItem>
                      <SelectItem value="job_board">Job Board</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newJob.priority} onValueChange={(value) => setNewJob({...newJob, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="pipeline_stage">Initial Stage</Label>
                <Select value={newJob.pipeline_stage} onValueChange={(value) => setNewJob({...newJob, pipeline_stage: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stageLabels[stage as keyof typeof stageLabels]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddJob} className="w-full">
                Add to Pipeline
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineStages.map((stage) => (
            <DroppableStatusColumn
              key={stage}
              status={stage}
              statusColor={stageColors[stage as keyof typeof stageColors]}
              statusLabel={stageLabels[stage as keyof typeof stageLabels]}
              count={stageCounts[stage] || 0}
            >
              <div className="space-y-3">
                {getItemsByStage(stage).map((job) => (
                  <DraggableKanbanCard
                    key={job.id}
                    job={{
                      id: job.id,
                      company_name: job.company_name,
                      job_title: job.job_title,
                      status: job.pipeline_stage,
                      application_date: job.application_date || job.created_at.split('T')[0],
                      notes: job.notes,
                      job_url: job.job_url,
                      salary_range: '',
                      location: '',
                      contact_person: '',
                      contact_email: '',
                      next_follow_up: '',
                      is_archived: false,
                      created_at: job.created_at,
                      updated_at: job.updated_at
                    }}
                    statusOptions={pipelineStages}
                    statusLabels={stageLabels}
                    hasActiveSubscription={true}
                    onStatusChange={(jobId, newStatus) => movePipelineStage(jobId, newStatus)}
                    onCardClick={() => {}}
                  />
                ))}
              </div>
            </DroppableStatusColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
};