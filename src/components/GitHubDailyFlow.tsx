import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface FlowTask {
  id: string;
  title: string;
  description: string;
}

const DAILY_FLOW_TASKS: FlowTask[] = [
  { id: 'pull_latest', title: 'Pull Latest Changes', description: 'Run git fetch and git pull on active branches before starting work.' },
  { id: 'select_todays_issue', title: "Open or Select Today’s Issue", description: 'Create/choose one focused issue with a clear title and checklist.' },
  { id: 'create_new_branch', title: 'Create a New Branch', description: 'Use clear naming: feat/<short-task>, fix/<bug>, docs/<area>.' },
  { id: 'code_small_chunks', title: 'Code in Small Chunks', description: 'Work for 45–90 minutes max per task.' },
  { id: 'write_update_tests', title: 'Write/Update Unit Tests', description: 'Ensure changes are covered by tests.' },
  { id: 'document_as_you_go', title: 'Document as You Go', description: 'Update README or /docs/ for any new features or changes.' },
  { id: 'commit_early_small', title: 'Commit Early & Small', description: '1–3 commits with meaningful messages like “feat: add login validation”.' },
  { id: 'run_linters_formatters', title: 'Run Linters & Formatters', description: 'Keep code style consistent.' },
  { id: 'update_changelog', title: 'Update CHANGELOG or Daily Log', description: 'Short note of changes made today.' },
  { id: 'push_and_open_pr', title: 'Push Branch & Create a Pull Request', description: 'Include problem, solution, and test notes.' },
  { id: 'self_review_pr', title: 'Self-Review Your PR', description: 'Check for clarity and completeness.' },
];

function getTodayISODate(): string {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}

export default function GitHubDailyFlow() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tasksState, setTasksState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [weeklyCompleted, setWeeklyCompleted] = useState<number>(0);

  const allComplete = useMemo(
    () => DAILY_FLOW_TASKS.every((t) => tasksState[t.id]),
    [tasksState]
  );

  useEffect(() => {
    if (!user) return;
    // Initialize task state to all false
    setTasksState(
      DAILY_FLOW_TASKS.reduce((acc, t) => {
        acc[t.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );

    // Try loading today’s in-progress session
    loadExistingSession();
    // Load weekly stats
    refreshWeeklyCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadExistingSession = async () => {
    if (!user) return;
    const today = getTodayISODate();
    const { data, error } = await supabase
      .from('github_daily_flow_sessions')
      .select('id, tasks')
      .eq('user_id', user.id)
      .eq('session_date', today)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading session:', error);
      return;
    }

    if (data) {
      setSessionId(data.id);
      const tasksObj = (data as any).tasks as Record<string, boolean> | null;
      if (tasksObj && typeof tasksObj === 'object') {
        setTasksState((prev) => ({ ...prev, ...tasksObj }));
      }
    }
  };

  const refreshWeeklyCount = async () => {
    if (!user) return;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Sunday

    const { data, error } = await supabase
      .from('github_daily_flow_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('session_date', format(weekStart, 'yyyy-MM-dd'))
      .lte('session_date', format(weekEnd, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error loading weekly count:', error);
      return;
    }

    setWeeklyCompleted(data?.length || 0);
  };

  const ensureSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (!user) {
      toast.error('Please sign in to track your flow.');
      return null;
    }
    setLoading(true);
    const initialTasks = DAILY_FLOW_TASKS.reduce((acc, t) => {
      acc[t.id] = false;
      return acc;
    }, {} as Record<string, boolean>);

    const { data, error } = await supabase
      .from('github_daily_flow_sessions')
      .insert({
        user_id: user.id,
        session_date: getTodayISODate(),
        tasks: initialTasks,
        completed: false,
      })
      .select('id')
      .single();

    setLoading(false);

    if (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start a session');
      return null;
    }

    setSessionId(data.id);
    return data.id;
  };

  const handleToggle = async (taskId: string, checked: boolean) => {
    const sid = await ensureSession();
    if (!sid) return;

    const newState = { ...tasksState, [taskId]: checked };
    setTasksState(newState);

    const nowCompleted = DAILY_FLOW_TASKS.every((t) => newState[t.id]);

    const { error } = await supabase
      .from('github_daily_flow_sessions')
      .update({
        tasks: newState,
        completed: nowCompleted,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', sid);

    if (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to save progress');
      return;
    }

    if (nowCompleted) {
      toast.success('Great job! Daily flow session completed.');
      refreshWeeklyCount();
    }
  };

  const handleStartNewSession = async () => {
    const sid = await ensureSession();
    if (sid) toast.info('Session started. You can now check off tasks.');
  };

  const completionPct = Math.round(
    (Object.values(tasksState).filter(Boolean).length / DAILY_FLOW_TASKS.length) * 100
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily GitHub Management Flow</CardTitle>
            <CardDescription>
              Complete this checklist at least 3 times each week (Mon–Sun).
            </CardDescription>
          </div>
          <Badge variant="secondary">Weekly: {weeklyCompleted}/3</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{completionPct}%</span>
          </div>
          <Progress value={completionPct} className="h-2" />
        </div>

        {!sessionId && (
          <Button onClick={handleStartNewSession} disabled={loading} variant="outline">
            {loading ? 'Starting…' : 'Start New Session'}
          </Button>
        )}

        <div className="space-y-3">
          {DAILY_FLOW_TASKS.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox
                id={task.id}
                checked={!!tasksState[task.id]}
                onCheckedChange={(v) => handleToggle(task.id, Boolean(v))}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor={task.id}
                  className={`text-sm font-medium cursor-pointer ${tasksState[task.id] ? 'line-through text-muted-foreground' : ''}`}
                >
                  {task.title}
                </label>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
