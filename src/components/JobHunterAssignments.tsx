import React, { useState, useEffect } from 'react';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle2, Clock, XCircle, FileCheck, Users, MessageSquare, TrendingUp, Briefcase, Target, Zap } from 'lucide-react';
import { JobHuntingAssignmentCard } from './JobHuntingAssignmentCard';
import { DailyJobHuntingSessions } from './DailyJobHuntingSessions';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface JobHunterAssignmentsProps {
  weekProgress: any;
  assignments: any[];
  initializeUserWeek: () => void;
  onUpdateStatus: (assignmentId: string, status: string) => void;
}

export const JobHunterAssignments: React.FC<JobHunterAssignmentsProps> = ({ 
  weekProgress, 
  assignments, 
  initializeUserWeek,
  onUpdateStatus
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [weeklyJobStats, setWeeklyJobStats] = useState({
    applied: 0,
    referrals: 0,
    followUps: 0,
    conversations: 0
  });
  const { user } = useAuth();

  // Fetch current week job application stats
  useEffect(() => {
    const fetchWeeklyJobStats = async () => {
      if (!user) return;

      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      try {
        // Get jobs applied this week from job_tracker
        const { data: jobsApplied, error: jobsError } = await supabase
          .from('job_tracker')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'applied')
          .gte('created_at', format(currentWeekStart, 'yyyy-MM-dd HH:mm:ss'))
          .lte('created_at', format(currentWeekEnd, 'yyyy-MM-dd HH:mm:ss'));

        if (jobsError) throw jobsError;

        // Find the "Apply to 5 Job Roles" assignment
        const jobApplicationAssignment = assignments.find(a => 
          a.template?.title?.includes('Apply to 5 Job Roles') && 
          (a.status === 'verified' || a.status === 'VERIFIED')
        );

        // Get referral requests from assignments this week
        const referralAssignment = assignments.find(a => 
          a.template?.title?.includes('Referral') && 
          (a.status === 'verified' || a.status === 'VERIFIED')
        );

        // Get follow-ups from assignments this week  
        const followUpAssignment = assignments.find(a => 
          a.template?.title?.includes('Follow-up') && 
          (a.status === 'verified' || a.status === 'VERIFIED')
        );

        // Calculate total job applications
        let totalJobApplications = jobsApplied?.length || 0;
        
        // If "Apply to 5 Job Roles" assignment is completed, add 5 applications
        if (jobApplicationAssignment) {
          totalJobApplications += 5;
        }

        setWeeklyJobStats({
          applied: totalJobApplications,
          referrals: referralAssignment ? 3 : 0, // 3 referrals per completed assignment
          followUps: followUpAssignment ? 5 : 0, // 5 follow-ups per completed assignment
          conversations: 0 // This would need additional tracking
        });

      } catch (error) {
        console.error('Error fetching weekly job stats:', error);
      }
    };

    fetchWeeklyJobStats();
  }, [user, assignments]);

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

  // Weekly quotas with real data
  const weeklyQuotas = [
    { 
      id: 'applications', 
      label: 'Job Applications', 
      target: 5, 
      current: weeklyJobStats.applied, 
      icon: Briefcase 
    },
    { 
      id: 'referrals', 
      label: 'Referral Requests', 
      target: 3, 
      current: weeklyJobStats.referrals, 
      icon: Users 
    },
    { 
      id: 'follow_ups', 
      label: 'Follow-ups', 
      target: 5, 
      current: weeklyJobStats.followUps, 
      icon: MessageSquare 
    },
    { 
      id: 'conversations', 
      label: 'New Conversations', 
      target: 3, 
      current: weeklyJobStats.conversations, 
      icon: TrendingUp 
    }
  ];



  return (
    <div className="space-y-6">
      {/* Daily Job Hunting Sessions */}
      <DailyJobHuntingSessions />

      {/* Weekly Progress Quotas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Progress Targets
          </CardTitle>
          <CardDescription>
            Track your job hunting quotas for this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeklyQuotas.map((quota) => {
              const IconComponent = quota.icon;
              const progressPercentage = (quota.current / quota.target) * 100;
              const isCompleted = quota.current >= quota.target;
              
              return (
                <Card key={quota.id} className={`${isCompleted ? 'bg-green-50 border-green-200' : 'bg-muted/30'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <IconComponent className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          {quota.current}/{quota.target}
                        </span>
                        <Badge variant={isCompleted ? "default" : "secondary"}>
                          {Math.round(progressPercentage)}%
                        </Badge>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
                        {quota.label}
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Assignments */}
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Weekly Assignments
                  <Button 
                    onClick={initializeUserWeek}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Initialize Tasks
                  </Button>
                </CardTitle>
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
                     onUpdateStatus={onUpdateStatus}
                   />
                 ))}
              </div>
            )}
          </CardContent>
      </Card>

    </div>
  );
};