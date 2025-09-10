import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Sun, Sunset, Moon, Target, Briefcase, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useDailyJobHuntingSessions } from '@/hooks/useDailyJobHuntingSessions';
import { useDailyJobHuntingTasks } from '@/hooks/useDailyJobHuntingTasks';
import { useAuth } from '@/hooks/useAuth';
import { DailyTaskCard } from './DailyTaskCard';
import { getTaskDayAvailability, canUserInteractWithDayBasedTask, getTaskAvailabilityMessage } from '@/utils/dayBasedTaskValidation';
import { DailySessionItem } from './DailySessionItem';

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
  const { user } = useAuth();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const { getDailyStats, getSessionStatus, completeSession, loading, sessions } = useDailyJobHuntingSessions();
  const { getTasksForDate, fetchTasksForDate, getDailyProgress } = useDailyJobHuntingTasks();

  // Generate current week (Mon-Sat) with real session data
  const currentWeek = React.useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days: DailyActivity[] = [];
    
    for (let i = 0; i < 6; i++) { // Monday to Saturday
      const date = addDays(weekStart, i);
      const dayName = format(date, 'EEEE');
      const dayKey = format(date, 'yyyy-MM-dd');
      
      // Get session stats for this day
      const dailyStats = getDailyStats(dayKey);
      
      // Create session objects based on day type
      const defaultSessions: DailySession[] = [
        {
          id: `${dayKey}-morning`,
          name: 'Morning Session',
          timeRange: '9:00 AM - 11:00 AM',
          duration: '2 hours',
          icon: Sun,
          tasks: [
            { id: '1', description: 'Review job market and identify 3-5 target companies' },
            { id: '2', description: 'Update resume with recent achievements' },
            { id: '3', description: 'Prepare cover letter templates' },
          ],
          completed: getSessionStatus(dayKey, 'morning')?.completed || false
        },
        {
          id: `${dayKey}-afternoon`,
          name: 'Afternoon Session',
          timeRange: '2:00 PM - 4:00 PM',
          duration: '2 hours',
          icon: Sunset,
          tasks: [
            { id: '1', description: 'Submit 2-3 job applications' },
            { id: '2', description: 'Connect with 5 professionals on LinkedIn' },
            { id: '3', description: 'Research company culture and values' },
          ],
          completed: getSessionStatus(dayKey, 'afternoon')?.completed || false
        },
        {
          id: `${dayKey}-evening`,
          name: 'Evening Session',
          timeRange: '7:00 PM - 8:30 PM',
          duration: '1.5 hours',
          icon: Moon,
          tasks: [
            { id: '1', description: 'Follow up on previous applications' },
            { id: '2', description: 'Practice interview questions' },
            { id: '3', description: 'Plan tomorrow\'s job search activities' },
          ],
          completed: getSessionStatus(dayKey, 'evening')?.completed || false
        }
      ];

      // Calculate completion stats
      const completedSessions = defaultSessions.filter(s => s.completed).length;
      const totalSessions = defaultSessions.length;
      
      days.push({
        date,
        dayName,
        sessions: defaultSessions,
        totalSessions,
        completedSessions
      });
    }
    
    return days;
  }, [sessions, getDailyStats, getSessionStatus]);

  const toggleDay = (dayKey: string) => {
    setExpandedDays(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(dayKey)) {
        newExpanded.delete(dayKey);
      } else {
        newExpanded.add(dayKey);
      }
      return newExpanded;
    });
  };

  const handleCompleteSession = async (sessionId: string, sessionType: 'morning' | 'afternoon' | 'evening', tasks: SessionTask[]) => {
    // Session completion is handled in the DailySessionItem component
  };

  // Calculate weekly progress
  const weeklyStats = React.useMemo(() => {
    const totalSessions = currentWeek.reduce((sum, day) => sum + day.totalSessions, 0);
    const completedSessions = currentWeek.reduce((sum, day) => sum + day.completedSessions, 0);
    const daysFullyCompleted = currentWeek.filter(day => day.completedSessions === day.totalSessions && day.totalSessions > 0).length;
    
    return {
      totalSessions,
      completedSessions,
      completionPercentage: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      daysFullyCompleted
    };
  }, [currentWeek]);

  const getProgressColor = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Daily Job Hunting Sessions</CardTitle>
            <CardDescription>Loading your weekly schedule...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Progress Overview
          </CardTitle>
          <CardDescription>
            Track your daily job hunting sessions throughout the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weeklyStats.completedSessions}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{weeklyStats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{weeklyStats.completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyStats.daysFullyCompleted}</div>
              <div className="text-sm text-muted-foreground">Days Completed</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Weekly Progress</span>
              <span>{weeklyStats.completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${getProgressColor(weeklyStats.completedSessions, weeklyStats.totalSessions)}`}
                style={{ width: `${weeklyStats.completionPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Sessions */}
      <div className="space-y-4">
        {currentWeek.map((day, dayIndex) => {
          const dayKey = format(day.date, 'yyyy-MM-dd');
          const isExpanded = expandedDays.has(dayKey);
          
          // Calculate day index (0 = Monday, 1 = Tuesday, etc.)
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const actualDayIndex = Math.floor((day.date.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
          
          // Day-based availability check for sessions
          const dayTaskTitle = `Day ${actualDayIndex + 1}`;
          const dayAvailability = getTaskDayAvailability(dayTaskTitle);
          const canInteract = canUserInteractWithDayBasedTask(dayTaskTitle, false); // No admin extension for now
          const availabilityMessage = getTaskAvailabilityMessage(dayTaskTitle, false);
          
          // Check if we should show extension request (when task is past due and not completed)
          const hasIncompleteSessions = day.completedSessions < day.totalSessions;
          const showExtensionRequest = !canInteract && dayAvailability.canRequestExtension && hasIncompleteSessions;
          
          return (
            <DailySessionItem
              key={dayKey}
              day={day}
              dayIndex={actualDayIndex}
              dayKey={dayKey}
              isExpanded={isExpanded}
              onToggleDay={toggleDay}
              canInteract={canInteract}
              availabilityMessage={availabilityMessage}
              showExtensionRequest={showExtensionRequest}
              dayAvailability={{
                ...dayAvailability,
                isAvailable: canInteract
              }}
            />
          );
        })}
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              Complete all daily sessions to maximize your job search effectiveness. Each session is designed to help you:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Stay organized and focused on your job search goals</li>
              <li>Build momentum through consistent daily activities</li>
              <li>Track your progress and identify improvement areas</li>
              <li>Maintain a healthy work-life balance during job hunting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};