import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Sun, Sunset, Moon, Target, Briefcase, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDailyJobHuntingSessions } from '@/hooks/useDailyJobHuntingSessions';
import { useDailyJobHuntingTasks } from '@/hooks/useDailyJobHuntingTasks';
import { DailyTaskCard } from './DailyTaskCard';
import { JobHuntingRequestReenableDialog } from './JobHuntingRequestReenableDialog';
import { useJobHuntingExtensionRequests } from '@/hooks/useJobHuntingExtensionRequests';
import { Button } from './ui/button';

interface SessionTask {
  id: string;
  description: string;
  completed?: boolean;
}

interface DailySession {
  id: string;
  name: string;
  timeRange: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  tasks: SessionTask[];
  completed?: boolean;
  completedAt?: Date;
}

interface DailyActivity {
  date: Date;
  dayName: string;
  sessions: DailySession[];
  totalSessions: number;
  completedSessions: number;
}

interface DailySessionItemProps {
  day: DailyActivity;
  dayIndex: number;
  dayKey: string;
  isExpanded: boolean;
  onToggleDay: (dayKey: string) => void;
  canInteract: boolean;
  availabilityMessage: string;
  showExtensionRequest: boolean;
  dayAvailability: {
    isAvailable: boolean;
    isPastDue: boolean;
    isFutureDay: boolean;
    canRequestExtension: boolean;
  };
}

export const DailySessionItem: React.FC<DailySessionItemProps> = ({
  day,
  dayIndex,
  dayKey,
  isExpanded,
  onToggleDay,
  canInteract,
  availabilityMessage,
  showExtensionRequest,
  dayAvailability
}) => {
  const { user } = useAuth();
  const { getSessionStatus, completeSession } = useDailyJobHuntingSessions();
  const { getTasksForDate, fetchTasksForDate } = useDailyJobHuntingTasks();
  
  // Check for pending extension requests
  const { hasPendingRequest, refreshPendingStatus } = useJobHuntingExtensionRequests(
    `daily-sessions-${dayKey}`,
    user?.id
  );

  const isToday = isSameDay(day.date, new Date());
  const progressPercentage = day.totalSessions > 0 ? (day.completedSessions / day.totalSessions) * 100 : 0;
  const hasIncompleteSessions = day.completedSessions < day.totalSessions;

  const getProgressColor = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleCompleteSession = async (sessionId: string, sessionType: 'morning' | 'afternoon' | 'evening', tasks: SessionTask[]) => {
    try {
      const taskDescriptions = tasks.map(task => task.description);
      await completeSession(dayKey, sessionType, taskDescriptions);
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  return (
    <Collapsible key={dayKey} open={isExpanded} onOpenChange={() => onToggleDay(dayKey)}>
      <CollapsibleTrigger asChild>
        <Card className={`cursor-pointer transition-colors hover:bg-muted/50 ${isToday ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {day.dayName}
                      {isToday && (
                        <Badge variant="secondary" className="ml-2 text-xs">Today</Badge>
                      )}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(day.date, 'MMM dd')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {day.completedSessions}/{day.totalSessions} Sessions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(progressPercentage)}% Complete
                  </div>
                </div>
                
                <div className="w-16">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(day.completedSessions, day.totalSessions)}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
                
                {day.completedSessions === day.totalSessions && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <div className="grid gap-3 pl-4">
          
          {/* Day Availability Warning */}
          {!canInteract && day.totalSessions > 0 && hasIncompleteSessions && (
            <div className={`p-3 rounded-lg text-sm ${
              dayAvailability.isPastDue
                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                : dayAvailability.isFutureDay 
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4" />
                {availabilityMessage}
              </div>
              {dayAvailability.isPastDue && (
                <p className="text-xs mt-1">
                  You missed the deadline for this day's sessions. Request an extension to complete them.
                </p>
              )}
              {dayAvailability.isFutureDay && (
                <p className="text-xs mt-1">
                  These sessions will unlock automatically on {day.dayName}.
                </p>
              )}
            </div>
          )}
          
          {/* Extension Request Button */}
          {showExtensionRequest && (
            <div className="mb-3">
              <JobHuntingRequestReenableDialog
                assignmentId={`daily-sessions-${dayKey}`}
                taskTitle={`${day.dayName} Daily Job Hunting Sessions`}
                hasPendingRequest={hasPendingRequest}
                onRequestSent={refreshPendingStatus}
              />
            </div>
          )}
          
          {day.sessions.map((session) => (
            <Card key={session.id} className={session.completed ? 'bg-green-50 border-green-200' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <session.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{session.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {session.timeRange} • {session.duration}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {session.completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Completed
                      </Badge>
                    )}
                    
                    {canInteract && !session.completed && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteSession(session.id, 'morning', session.tasks)}
                        className="h-8"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
                
                {session.tasks.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks:</p>
                    {session.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-muted'}`} />
                        {task.description}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Daily Tasks Section */}
          <div className="mt-4">
            <div className="grid gap-3">
              {/* Job Applications - Only Monday through Thursday (day index 0-3) */}
              {dayIndex <= 3 && (
                <DailyTaskCard
                  taskType="job_applications"
                  date={dayKey}
                  task={getTasksForDate(dayKey).find(t => t.task_type === 'job_applications')}
                  onTaskUpdate={() => fetchTasksForDate(dayKey)}
                  canInteract={canInteract}
                  availabilityMessage={availabilityMessage}
                  showExtensionRequest={showExtensionRequest}
                  dayAvailability={dayAvailability}
                />
              )}
              <DailyTaskCard
                taskType="referral_requests"
                date={dayKey}
                task={getTasksForDate(dayKey).find(t => t.task_type === 'referral_requests')}
                onTaskUpdate={() => fetchTasksForDate(dayKey)}
                canInteract={canInteract}
                availabilityMessage={availabilityMessage}
                showExtensionRequest={showExtensionRequest}
                dayAvailability={dayAvailability}
              />
              <DailyTaskCard
                taskType="follow_up_messages"
                date={dayKey}
                task={getTasksForDate(dayKey).find(t => t.task_type === 'follow_up_messages')}
                onTaskUpdate={() => fetchTasksForDate(dayKey)}
                canInteract={canInteract}
                availabilityMessage={availabilityMessage}
                showExtensionRequest={showExtensionRequest}
                dayAvailability={dayAvailability}
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};