import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, addDays } from 'date-fns';

type SessionType = 'morning' | 'afternoon' | 'evening';

interface DailySession {
  id: string;
  user_id: string;
  session_date: string;
  session_type: SessionType;
  completed: boolean;
  completed_at?: string | null;
  tasks_completed: any; // JSONB from Supabase
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export const useDailyJobHuntingSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch sessions for the current week
  const fetchSessions = async () => {
    if (!user?.id) {
      console.warn('No user ID available for fetching daily sessions');
      return;
    }

    try {
      setLoading(true);
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 5); // Monday to Saturday

      const { data, error } = await supabase
        .from('daily_job_hunting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('session_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('session_date', { ascending: true });

      if (error) {
        console.error('Supabase error fetching daily sessions:', error);
        throw error;
      }
      
      setSessions((data as DailySession[]) || []);
    } catch (error) {
      console.error('Error fetching daily sessions:', error);
      // Only show toast error if it's not a table doesn't exist error
      if (error?.code !== 'PGRST116') {
        toast.error('Failed to load daily sessions');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Complete a session
  const completeSession = async (date: string, sessionType: 'morning' | 'afternoon' | 'evening', tasksCompleted: string[] = []) => {
    if (!user) return;

    try {
      const sessionData = {
        user_id: user.id,
        session_date: date,
        session_type: sessionType,
        completed: true,
        completed_at: new Date().toISOString(),
        tasks_completed: tasksCompleted,
      };

      const { data, error } = await supabase
        .from('daily_job_hunting_sessions')
        .upsert(sessionData, {
          onConflict: 'user_id,session_date,session_type'
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSessions(prev => {
        const index = prev.findIndex(s => 
          s.session_date === date && s.session_type === sessionType
        );
        
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data as DailySession;
          return updated;
        } else {
          return [...prev, data as DailySession];
        }
      });

      toast.success(`${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session completed!`);
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
    }
  };

  // Mark session as incomplete
  const incompleteSession = async (date: string, sessionType: 'morning' | 'afternoon' | 'evening') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('daily_job_hunting_sessions')
        .update({ 
          completed: false, 
          completed_at: null,
          tasks_completed: []
        })
        .eq('user_id', user.id)
        .eq('session_date', date)
        .eq('session_type', sessionType)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSessions(prev => prev.map(session => 
        session.session_date === date && session.session_type === sessionType 
          ? data as DailySession
          : session
      ));

      toast.success('Session marked as incomplete');
    } catch (error) {
      console.error('Error marking session incomplete:', error);
      toast.error('Failed to update session');
    }
  };

  // Get session status for a specific date and type
  const getSessionStatus = (date: string, sessionType: 'morning' | 'afternoon' | 'evening') => {
    return sessions.find(s => 
      s.session_date === date && s.session_type === sessionType
    );
  };

  // Get daily completion stats
  const getDailyStats = (date: string) => {
    const dailySessions = sessions.filter(s => s.session_date === date);
    const completed = dailySessions.filter(s => s.completed).length;
    const total = 3; // morning, afternoon, evening
    
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      sessions: dailySessions
    };
  };

  // Get weekly completion stats  
  const getWeeklyStats = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 6 }, (_, i) => 
      format(addDays(weekStart, i), 'yyyy-MM-dd')
    );
    
    let totalCompleted = 0;
    let totalPossible = weekDays.length * 3; // 6 days * 3 sessions each

    weekDays.forEach(date => {
      const dailyStats = getDailyStats(date);
      totalCompleted += dailyStats.completed;
    });

    return {
      totalCompleted,
      totalPossible,
      percentage: Math.round((totalCompleted / totalPossible) * 100),
      daysCompleted: weekDays.filter(date => getDailyStats(date).completed === 3).length
    };
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user?.id]);

  return {
    sessions,
    loading,
    fetchSessions,
    completeSession,
    incompleteSession,
    getSessionStatus,
    getDailyStats,
    getWeeklyStats
  };
};