import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useJobApplicationActivities, JobApplicationTaskId } from "@/hooks/useJobApplicationActivities";
import { format, isSameDay, subDays } from "date-fns";

export default function ApplicationMetricsCard() {
  const { user } = useAuth();
  const { fetchWeek, getWeekDatesMonToFri } = useJobApplicationActivities();

  const [jobWeekData, setJobWeekData] = useState<Record<string, Partial<Record<JobApplicationTaskId, number>>>>({});
  const [statusWeekData, setStatusWeekData] = useState<Record<string, Partial<Record<string, number>>>>({});
  const jobWeekDates = getWeekDatesMonToFri(new Date());

  const refreshApplicationMetrics = useCallback(async () => {
    // Fetch week activities (wishlist/applied counts)
    const data = await fetchWeek(new Date());
    setJobWeekData(data);

    if (!user) return;

    // Aggregate job_tracker statuses for requested week
    try {
      const dates = jobWeekDates;
      const startDate = format(dates[0], 'yyyy-MM-dd');
      const lastWeekday = dates[dates.length - 1];
      const today = new Date();
      const end = today > lastWeekday ? today : lastWeekday;
      const endDate = format(end, 'yyyy-MM-dd');
      const { data: statusRows, error } = await supabase
        .from('job_tracker')
        .select('status, updated_at, user_id')
        .eq('user_id', user.id)
        .gte('updated_at', `${startDate}T00:00:00Z`)
        .lte('updated_at', `${endDate}T23:59:59Z`);
      if (error) {
        console.error('Error fetching status metrics:', error);
        setStatusWeekData({});
        return;
      }
      const TARGET_STATUSES = ['interviewing','negotiating','accepted','not_selected','no_response'];
      const map: Record<string, Partial<Record<string, number>>> = {};
      (statusRows || []).forEach((row: any) => {
        const key = format(new Date(row.updated_at), 'yyyy-MM-dd');
        if (!map[key]) map[key] = {};
        const st = row.status as string;
        if (TARGET_STATUSES.includes(st)) {
          map[key]![st] = ((map[key]![st] as number) || 0) + 1;
        }
      });
      setStatusWeekData(map);
    } catch (e) {
      console.error('Failed to compute status metrics', e);
    }
  }, [user, fetchWeek, jobWeekDates]);

  useEffect(() => {
    refreshApplicationMetrics();
  }, [refreshApplicationMetrics]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('job-app-rt-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_application_activities' }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (!row || row.user_id !== user.id) return;
        refreshApplicationMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_tracker' }, (payload) => {
        const row: any = (payload as any).new || (payload as any).old;
        if (!row || row.user_id !== user.id) return;
        refreshApplicationMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshApplicationMetrics]);

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const weekDatesToShow = jobWeekDates
    .filter(d => format(d, 'yyyy-MM-dd') <= todayKey)
    .sort((a, b) => b.getTime() - a.getTime());

  const weekTotalWishlist = jobWeekDates.reduce((sum, d) => sum + (jobWeekData[format(d, 'yyyy-MM-dd')]?.['save_potential_opportunities'] ?? 0), 0);
  const weekTotalApplied = jobWeekDates.reduce((sum, d) => sum + (jobWeekData[format(d, 'yyyy-MM-dd')]?.['apply_quality_jobs'] ?? 0), 0);
  const weekTotalInterviewing = jobWeekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['interviewing'] ?? 0), 0);
  const weekTotalNegotiating = jobWeekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['negotiating'] ?? 0), 0);
  const weekTotalAccepted = jobWeekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['accepted'] ?? 0), 0);
  const weekTotalNotSelected = jobWeekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['not_selected'] ?? 0), 0);
  const weekTotalNoResponse = jobWeekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['no_response'] ?? 0), 0);

  return (
    <Card className="shadow-elegant border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Application Metrics - Current Week
        </CardTitle>
        <CardDescription>
          Today at top, then Yesterday, followed by earlier days of this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">No. Jobs Added to Wishlist</TableHead>
                <TableHead className="text-center">No. Jobs Applied</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-primary/10">
                <TableCell className="font-semibold">Week Total (Mon–Fri)</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalWishlist}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalApplied}</TableCell>
                <TableCell className="text-center text-muted-foreground">—</TableCell>
              </TableRow>
              {weekDatesToShow.map((date) => {
                const key = format(date, 'yyyy-MM-dd');
                const wishlist = jobWeekData[key]?.['save_potential_opportunities'] ?? 0;
                const applied = jobWeekData[key]?.['apply_quality_jobs'] ?? 0;
                const label = isSameDay(date, today)
                  ? 'Today'
                  : isSameDay(date, subDays(today, 1))
                  ? 'Yesterday'
                  : format(date, 'EEE, MMM d');
                const wishlistOk = wishlist >= 5;
                const appliedOk = applied >= 3;
                const ok = wishlistOk && appliedOk;
                return (
                  <TableRow key={key} className={!ok ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className={`text-center ${!wishlistOk ? 'text-destructive' : ''}`}>{wishlist}</TableCell>
                    <TableCell className={`text-center ${!appliedOk ? 'text-destructive' : ''}`}>{applied}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1">
                        {ok ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                        <span className={`text-sm font-medium ${ok ? 'text-green-600' : 'text-destructive'}`}>
                          {ok ? 'Target Met' : 'Not Met'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
