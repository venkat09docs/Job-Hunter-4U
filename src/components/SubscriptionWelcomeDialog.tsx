import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function SubscriptionWelcomeDialog() {
  const { user } = useAuth();
  const { profile, hasActiveSubscription, refreshProfile } = useProfile();
  const [open, setOpen] = useState(false);

  // Ensure the dialog only shows once per session
  const markShown = () => sessionStorage.setItem("welcome_shown_for_session", "1");
  const alreadyShown = () => sessionStorage.getItem("welcome_shown_for_session") === "1";

  useEffect(() => {
    // Listen for explicit SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // Defer any Supabase calls or heavy logic
        setTimeout(async () => {
          try {
            await refreshProfile();
          } catch {}
          if (!alreadyShown() && hasActiveSubscription()) {
            setOpen(true);
            markShown();
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
    if (user && !alreadyShown() && hasActiveSubscription()) {
      setOpen(true);
      markShown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.subscription_active, profile?.subscription_end_date]);

  const displayName = profile?.full_name || profile?.username || user?.email || "there";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome back, {displayName}!</DialogTitle>
          <DialogDescription>
            Thanks for being a premium member. Your subscription is active—enjoy all premium features.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => setOpen(false)}>Explore</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
