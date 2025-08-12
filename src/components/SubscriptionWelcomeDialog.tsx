import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useJobApplicationActivities, JobApplicationTaskId } from "@/hooks/useJobApplicationActivities";
import { useLinkedInNetworkProgress } from "@/hooks/useLinkedInNetworkProgress";
import { JOB_APP_TASKS, LINKEDIN_DAILY_ACTIVITIES } from "@/constants/activities";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SubscriptionWelcomeDialog() {
  const { user } = useAuth();
  const { profile, hasActiveSubscription, refreshProfile } = useProfile();
  const { fetchWeek } = useJobApplicationActivities();
  const { getTodayMetrics } = useLinkedInNetworkProgress();

  const [open, setOpen] = useState(false);
  const [pendingJobs, setPendingJobs] = useState<{ id: JobApplicationTaskId; title: string }[]>([]);
  const [pendingLinkedIn, setPendingLinkedIn] = useState<{ id: string; title: string; remaining: number; unit: string }[]>([]);

  // Ensure the dialog only shows once per session
  const markShown = () => sessionStorage.setItem("welcome_shown_for_session", "1");
  const alreadyShown = () => sessionStorage.getItem("welcome_shown_for_session") === "1";

  const fetchPending = async () => {
    if (!user) return;
    const todayKey = format(new Date(), "yyyy-MM-dd");

    // Job Applications pending (Mon–Fri tracker): tasks not checked (value !== 1)
    try {
      const week = await fetchWeek(new Date());
      const todayMap = week[todayKey] || {};
      const jobPending = JOB_APP_TASKS.filter(t => (todayMap[t.id] ?? 0) !== 1).map(t => ({ id: t.id, title: t.title }));
      setPendingJobs(jobPending);
    } catch (e) {
      // If fetch fails, don't block popup
      setPendingJobs([]);
    }

    // LinkedIn pending: compare today's metrics to dailyTarget
    try {
      const metrics = await getTodayMetrics(todayKey);
      const liPending = LINKEDIN_DAILY_ACTIVITIES
        .map(act => {
          const done = metrics?.[act.id] ?? 0;
          const remaining = Math.max((act.dailyTarget || 0) - done, 0);
          return { id: act.id, title: act.title, remaining, unit: act.unit };
        })
        .filter(item => item.remaining > 0);
      setPendingLinkedIn(liPending);
    } catch (e) {
      setPendingLinkedIn([]);
    }
  };

  useEffect(() => {
    // Listen for explicit SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setTimeout(async () => {
          try {
            await refreshProfile();
            if (!alreadyShown() && hasActiveSubscription()) {
              await fetchPending();
              setOpen(true);
              markShown();
            }
          } catch {
            // ignore
          }
        }, 0);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // If the app loads with an existing session (refresh), show once per session too
    (async () => {
      if (user && !alreadyShown() && hasActiveSubscription()) {
        await fetchPending();
        setOpen(true);
        markShown();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.subscription_active, profile?.subscription_end_date]);

  const displayName = profile?.full_name || profile?.username || user?.email || "there";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome back, {displayName}!</DialogTitle>
          <DialogDescription>
            Your premium subscription is active. Here's a quick look at today's pending activities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <h4 className="font-medium">Job Applications</h4>
            {pendingJobs.length > 0 ? (
              <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                {pendingJobs.map(item => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">All tasks completed for today. Great job!</p>
            )}
          </div>

          <div>
            <h4 className="font-medium">LinkedIn Growth</h4>
            {pendingLinkedIn.length > 0 ? (
              <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                {pendingLinkedIn.map(item => (
                  <li key={item.id}>{item.title} — {item.remaining} more {item.unit}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">You're all caught up on LinkedIn activities today.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => setOpen(false)}>Go to Activities</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
