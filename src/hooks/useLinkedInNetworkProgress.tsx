import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface ActivityMetrics {
  [key: string]: number;
}

export const useLinkedInNetworkProgress = () => {
  const { user } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_TASKS = 10; // Total number of LinkedIn network activities

  useEffect(() => {
    if (user) {
      fetchNetworkProgress();
    }
  }, [user]);

  const fetchNetworkProgress = () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const savedProgress = localStorage.getItem(`linkedin_network_completed_${today}`);
      const completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
      const percentage = Math.round((completedTasks.length / TOTAL_TASKS) * 100);
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Error fetching LinkedIn network progress:', error);
      setCompletionPercentage(0);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskCompletion = (taskId: string, completed: boolean, date: string) => {
    try {
      const storageKey = `linkedin_network_completed_${date}`;
      const savedProgress = localStorage.getItem(storageKey);
      let completedTasks = savedProgress ? JSON.parse(savedProgress) : [];
      
      if (completed && !completedTasks.includes(taskId)) {
        completedTasks.push(taskId);
      } else if (!completed) {
        completedTasks = completedTasks.filter((id: string) => id !== taskId);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(completedTasks));
      
      // Update percentage for today's date
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        const percentage = Math.round((completedTasks.length / TOTAL_TASKS) * 100);
        setCompletionPercentage(percentage);
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const updateMetrics = (activityId: string, value: number, date: string) => {
    try {
      const storageKey = `linkedin_network_metrics_${date}`;
      const savedMetrics = localStorage.getItem(storageKey);
      const metrics = savedMetrics ? JSON.parse(savedMetrics) : {};
      
      metrics[activityId] = value;
      localStorage.setItem(storageKey, JSON.stringify(metrics));
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const getTodayMetrics = (date: string): ActivityMetrics => {
    try {
      const storageKey = `linkedin_network_metrics_${date}`;
      const savedMetrics = localStorage.getItem(storageKey);
      return savedMetrics ? JSON.parse(savedMetrics) : {};
    } catch (error) {
      console.error('Error fetching today metrics:', error);
      return {};
    }
  };

  const getWeeklyMetrics = (): ActivityMetrics => {
    try {
      const weekMetrics: ActivityMetrics = {};
      const today = new Date();
      
      // Get metrics for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const dayMetrics = getTodayMetrics(dateKey);
        
        // Aggregate metrics
        Object.entries(dayMetrics).forEach(([key, value]) => {
          weekMetrics[key] = (weekMetrics[key] || 0) + value;
        });
      }
      
      return weekMetrics;
    } catch (error) {
      console.error('Error fetching weekly metrics:', error);
      return {};
    }
  };

  return {
    completionPercentage,
    loading,
    updateTaskCompletion,
    updateMetrics,
    getTodayMetrics,
    getWeeklyMetrics,
    refreshProgress: fetchNetworkProgress
  };
};