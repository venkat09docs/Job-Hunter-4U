import React, { useState } from 'react';
import { useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle2, Clock, XCircle, FileCheck, Users, MessageSquare, TrendingUp, Briefcase, Target, Zap } from 'lucide-react';
import { JobHuntingAssignmentCard } from './JobHuntingAssignmentCard';
import { DailyJobHuntingSessions } from './DailyJobHuntingSessions';

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


  return (
    <div className="space-y-6">
      {/* Daily Job Hunting Sessions */}
      <DailyJobHuntingSessions />

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
                  />
                ))}
              </div>
            )}
          </CardContent>
      </Card>

    </div>
  );
};