import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users, Award, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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

export const JobPipelineStats: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Map job_tracker statuses to pipeline stages for consistent display
  const pipelineStages = ['wishlist', 'applied', 'interviewing', 'accepted', 'not_selected', 'no_response'];

  useEffect(() => {
    if (user) {
      fetchJobs();
      setupRealtimeSubscription();
    }
  }, [user]);

  // Setup real-time subscription for synchronization
  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('job-tracker-changes-stats')
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
    } finally {
      setLoading(false);
    }
  };

  const getStageCounts = () => {
    return pipelineStages.reduce((counts, stage) => {
      counts[stage] = jobs.filter(job => job.status === stage).length;
      return counts;
    }, {} as Record<string, number>);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Job Pipeline</h2>
          <p className="text-sm text-muted-foreground">Track your job applications through different stages</p>
        </div>
        <Link to="/dashboard/job-tracker">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Job Hunter Pro
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
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
    </div>
  );
};