import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobHuntingAssignmentCard } from '@/components/JobHuntingAssignmentCard';
import { JobPipelineKanban } from '@/components/JobPipelineKanban';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { useJobHuntingPipeline } from '@/hooks/useJobHuntingPipeline';
import { 
  Target, 
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface JobHunterAssignmentsProps {
  weekProgress: any;
  assignments: any[];
  initializeUserWeek: () => void;
}

export const JobHunterAssignments: React.FC<JobHunterAssignmentsProps> = ({ 
  weekProgress, 
  assignments, 
  initializeUserWeek 
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddJobDialog, setShowAddJobDialog] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState('');
  const [newJobUrl, setNewJobUrl] = useState('');
  
  const { addPipelineItem } = useJobHuntingPipeline();

  // Filter assignments based on active filter
  const filteredAssignments = assignments.filter(assignment => {
    switch (activeFilter) {
      case 'pending': return assignment.status === 'assigned' || assignment.status === 'in_progress';
      case 'submitted': return assignment.status === 'submitted';
      case 'completed': return assignment.status === 'verified';
      case 'overdue': return new Date(assignment.due_date) < new Date() && assignment.status !== 'verified';
      default: return true;
    }
  });

  // Weekly quotas - these would come from templates/settings
  const weeklyQuotas = [
    { id: 'applications', label: 'Job Applications', target: 5, current: 3, icon: Briefcase },
    { id: 'referrals', label: 'Referral Requests', target: 3, current: 1, icon: Users },
    { id: 'follow_ups', label: 'Follow-ups', target: 5, current: 4, icon: MessageSquare },
    { id: 'conversations', label: 'New Conversations', target: 3, current: 2, icon: TrendingUp }
  ];

  const handleAddJobLead = async () => {
    if (!newJobTitle || !newJobCompany) return;
    
    try {
      // Add to pipeline
      const newJob = await addPipelineItem({
        job_title: newJobTitle,
        company_name: newJobCompany,
        job_url: newJobUrl || undefined,
        pipeline_stage: 'leads',
        priority: 'medium',
        source: 'manual'
      });

      // TODO: Call instantiate_job_tasks edge function to create per-job tasks
      // await supabase.functions.invoke('instantiate-job-tasks', {
      //   body: { userId: user.id, jobId: newJob.id }
      // });

      setNewJobTitle('');
      setNewJobCompany('');
      setNewJobUrl('');
      setShowAddJobDialog(false);
    } catch (error) {
      console.error('Error adding job lead:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Weekly Quotas Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Quotas
          </CardTitle>
          <CardDescription>
            Your weekly job hunting targets and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyQuotas.map((quota) => {
              const IconComponent = quota.icon;
              const percentage = Math.round((quota.current / quota.target) * 100);
              
              return (
                <div key={quota.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <h4 className="font-medium text-sm">{quota.label}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{quota.current}</span>
                      <span className="text-sm text-muted-foreground">/ {quota.target}</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    <Badge 
                      variant={percentage >= 100 ? "default" : percentage >= 50 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {percentage}% Complete
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Job Leads and Per-Job Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Leads & Per-Job Tasks</CardTitle>
                <CardDescription>
                  Add job opportunities and track specific tasks for each job
                </CardDescription>
              </div>
              <Dialog open={showAddJobDialog} onOpenChange={setShowAddJobDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Job Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Job Lead</DialogTitle>
                    <DialogDescription>
                      Add a job opportunity to automatically generate per-job tasks
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Job Title *</label>
                      <Input 
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Company Name *</label>
                      <Input 
                        value={newJobCompany}
                        onChange={(e) => setNewJobCompany(e.target.value)}
                        placeholder="e.g., TechCorp Inc."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Job URL (optional)</label>
                      <Input 
                        value={newJobUrl}
                        onChange={(e) => setNewJobUrl(e.target.value)}
                        placeholder="https://company.com/jobs/123"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddJobLead} disabled={!newJobTitle || !newJobCompany}>
                        Add Job Lead
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddJobDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* This will show per-job tasks */}
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Add job leads to see per-job tasks here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Assignments</CardTitle>
                <CardDescription>
                  General job hunting tasks for this week
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                >
                  All ({assignments.length})
                </Button>
                <Button
                  variant={activeFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter('pending')}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Pending
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No assignments yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Generate your weekly assignments to start your job hunting journey
                </p>
                <Button onClick={initializeUserWeek}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate This Week's Tasks
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAssignments.map((assignment) => (
                  <JobHuntingAssignmentCard 
                    key={assignment.id} 
                    assignment={assignment}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};