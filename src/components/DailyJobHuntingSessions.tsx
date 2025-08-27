import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Sun, Sunset, Moon, Target } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useDailyJobHuntingSessions } from '@/hooks/useDailyJobHuntingSessions';

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

export const DailyJobHuntingSessions: React.FC = () => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const { getDailyStats, getSessionStatus, completeSession, loading } = useDailyJobHuntingSessions();

  // Generate current week (Mon-Sat) with real session data
  const currentWeek = React.useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days: DailyActivity[] = [];
    
    for (let i = 0; i < 6; i++) {
      const date = addDays(weekStart, i);
      const dayKey = format(date, 'yyyy-MM-dd');
      const dailyStats = getDailyStats(dayKey);
      
      const sessions: DailySession[] = [
        {
          id: `${dayKey}-morning`,
          name: 'Morning Session',
          timeRange: '9:00 - 10:00 AM',
          duration: '30-45 min',
          icon: Sun,
          completed: !!getSessionStatus(dayKey, 'morning')?.completed,
          completedAt: getSessionStatus(dayKey, 'morning')?.completed_at 
            ? new Date(getSessionStatus(dayKey, 'morning')!.completed_at!) 
            : undefined,
          tasks: [
            { id: 'check-portals', description: 'Check all job portals (Naukri, Indeed, Foundit, LinkedIn Jobs)' },
            { id: 'apply-jobs', description: 'Apply to relevant jobs with customized resume/cover letter' },
            { id: 'update-tracker', description: 'Update tracker: Job Link + Date Applied + Status = Applied' }
          ]
        },
        {
          id: `${dayKey}-afternoon`,
          name: 'Afternoon Session',
          timeRange: '2:00 - 2:20 PM',
          duration: '15-20 min',
          icon: Sunset,
          completed: !!getSessionStatus(dayKey, 'afternoon')?.completed,
          completedAt: getSessionStatus(dayKey, 'afternoon')?.completed_at 
            ? new Date(getSessionStatus(dayKey, 'afternoon')!.completed_at!) 
            : undefined,
          tasks: [
            { id: 'recheck-portals', description: 'Re-check for new job postings since morning' },
            { id: 'apply-new', description: 'Apply immediately to any new relevant jobs' },
            { id: 'update-tracker-2', description: 'Update job tracker with new applications' }
          ]
        },
        {
          id: `${dayKey}-evening`,
          name: 'Evening Session',
          timeRange: '6:00 - 6:20 PM',
          duration: '15-20 min',
          icon: Moon,
          completed: !!getSessionStatus(dayKey, 'evening')?.completed,
          completedAt: getSessionStatus(dayKey, 'evening')?.completed_at 
            ? new Date(getSessionStatus(dayKey, 'evening')!.completed_at!) 
            : undefined,
          tasks: [
            { id: 'review-applications', description: 'Review all applications done today' },
            { id: 'add-recruiter', description: 'Add recruiter details if available' },
            { id: 'mark-priority', description: 'Mark high-priority jobs (dream companies/exact skill match)' }
          ]
        }
      ];
      
      days.push({
        date,
        dayName: format(date, 'EEEE'),
        sessions,
        totalSessions: 3,
        completedSessions: dailyStats.completed
      });
    }
    
    return days;
  }, [getDailyStats, getSessionStatus]);

  const handleCompleteSession = async (dayKey: string, sessionType: 'morning' | 'afternoon' | 'evening') => {
    await completeSession(dayKey, sessionType);
  };

  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const getProgressColor = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 67) return 'bg-yellow-500';
    if (percentage >= 33) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSessionIcon = (SessionIcon: React.ComponentType<{ className?: string }>, completed?: boolean) => (
    <SessionIcon className={`h-4 w-4 ${completed ? 'text-green-600' : 'text-muted-foreground'}`} />
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Job Hunting Sessions
        </CardTitle>
        <CardDescription>
          Complete 3 focused sessions daily (Mon-Sat) to maximize your job search effectiveness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWeek.map((day) => {
          const dayKey = format(day.date, 'yyyy-MM-dd');
          const isExpanded = expandedDays.has(dayKey);
          const isToday = isSameDay(day.date, new Date());
          const progressPercentage = (day.completedSessions / day.totalSessions) * 100;
          
          return (
            <Collapsible key={dayKey} open={isExpanded} onOpenChange={() => toggleDay(dayKey)}>
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
                  {day.sessions.map((session) => (
                    <Card key={session.id} className={session.completed ? 'bg-green-50 border-green-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getSessionIcon(session.icon, session.completed)}
                            <div>
                              <h4 className="font-medium text-sm">{session.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{session.timeRange}</span>
                                <Badge variant="outline" className="text-xs">
                                  {session.duration}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {session.completed ? (
                            <div className="text-right">
                              <Badge variant="default" className="text-xs">Completed</Badge>
                              {session.completedAt && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(session.completedAt, 'h:mm a')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCompleteSession(dayKey, session.id.includes('-morning') ? 'morning' : session.id.includes('-afternoon') ? 'afternoon' : 'evening')}
                              disabled={loading}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {session.tasks.map((task) => (
                            <div key={task.id} className="flex items-start gap-2 text-sm">
                              <div className={`mt-1 h-2 w-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-muted'}`} />
                              <span className={task.completed ? 'text-muted-foreground line-through' : ''}>
                                {task.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};