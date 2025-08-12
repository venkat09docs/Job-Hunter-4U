import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfWeek, addDays, format } from "date-fns";

export type JobApplicationTaskId =
  | "review_new_postings"
  | "save_potential_opportunities"
  | "ats_resume_optimization"
  | "ai_generated_cover_letter"
  | "apply_quality_jobs"
  | "verify_application_completeness"
  | "log_applications_in_tracker"
  | "send_follow_up_message"
  | "research_target_company";

export interface JobApplicationActivityRecord {
  id?: string;
  user_id: string;
  activity_date: string; // yyyy-MM-dd
  task_id: JobApplicationTaskId;
  value: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useJobApplicationActivities() {
  const { user } = useAuth();

  const getWeekDatesMonToFri = useCallback((baseDate: Date = new Date()) => {
    const start = startOfWeek(baseDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  }, []);

  const fetchWeek = useCallback(
    async (baseDate: Date = new Date()) => {
      if (!user) return {} as Record<string, Partial<Record<JobApplicationTaskId, number>>>;

      const dates = getWeekDatesMonToFri(baseDate);
      const startDate = format(dates[0], "yyyy-MM-dd");
      const endDate = format(dates[dates.length - 1], "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("job_application_activities")
        .select("activity_date, task_id, value")
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("activity_date", { ascending: true });

      if (error) {
        console.error("Error fetching job application activities:", error);
        return {} as Record<string, Partial<Record<JobApplicationTaskId, number>>>;
      }

      const result: Record<string, Partial<Record<JobApplicationTaskId, number>>> = {};
      for (const d of dates) {
        result[format(d, "yyyy-MM-dd")] = {} as Partial<Record<JobApplicationTaskId, number>>;
      }

      (data || []).forEach((row) => {
        const dateKey = row.activity_date as string;
        if (!result[dateKey]) result[dateKey] = {} as Partial<Record<JobApplicationTaskId, number>>;
        (result[dateKey] as Partial<Record<JobApplicationTaskId, number>>)[row.task_id as JobApplicationTaskId] = row.value as number;
      });

      return result;
    },
    [user, getWeekDatesMonToFri]
  );

  const upsertActivity = useCallback(
    async (activity_date: string, task_id: JobApplicationTaskId, value: number, notes?: string) => {
      if (!user) throw new Error("No authenticated user");

      const payload: JobApplicationActivityRecord = {
        user_id: user.id,
        activity_date,
        task_id,
        value,
        notes: notes ?? null,
      };

      const { error } = await supabase
        .from("job_application_activities")
        .upsert(payload, { onConflict: "user_id,activity_date,task_id" });

      if (error) throw error;
    },
    [user]
  );

  return { fetchWeek, upsertActivity, getWeekDatesMonToFri };
}
