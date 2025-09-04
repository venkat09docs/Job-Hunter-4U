import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JobApplicationTaskId } from "@/hooks/useJobApplicationActivities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, subDays, addWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function ApplicationMetricsCard() {
  const { user } = useAuth();
  
  const getWeekDatesMonToFri = (baseDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(baseDate);
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    currentDate.setDate(currentDate.getDate() + mondayOffset);
    
    for (let i = 0; i < 5; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const [jobWeekData, setJobWeekData] = useState<Record<string, Partial<Record<JobApplicationTaskId, number>>>>({});
  const [statusWeekData, setStatusWeekData] = useState<Record<string, Partial<Record<string, number>>>>({});
  const [weekOffset, setWeekOffset] = useState(0);

  const refreshApplicationMetrics = useCallback(async () => {
    const baseDate = addWeeks(new Date(), weekOffset);
    const weekDates = getWeekDatesMonToFri(baseDate);

    if (!user) return;

    // Aggregate job_tracker data for requested week - both activities and statuses
    try {
      const startDate = format(weekDates[0], 'yyyy-MM-dd');
      const lastWeekday = weekDates[weekDates.length - 1];
      const today = new Date();
      const isCurrentWeek = weekOffset === 0;
      const end = isCurrentWeek && today < lastWeekday ? today : lastWeekday;
      const endDate = format(end, 'yyyy-MM-dd');
      
      const { data: jobRows, error } = await supabase
        .from('job_tracker')
        .select('status, updated_at, created_at, user_id')
        .eq('user_id', user.id)
        .gte('updated_at', `${startDate}T00:00:00Z`)
        .lte('updated_at', `${endDate}T23:59:59Z`);
        
      if (error) {
        console.error('Error fetching job tracker data:', error);
        setJobWeekData({});
        setStatusWeekData({});
        return;
      }

      // Process job tracker data into activities and status changes
      const activityMap: Record<string, Partial<Record<JobApplicationTaskId, number>>> = {};
      const statusMap: Record<string, Partial<Record<string, number>>> = {};
      
      (jobRows || []).forEach((row: any) => {
        const updateKey = format(new Date(row.updated_at), 'yyyy-MM-dd');
        const createKey = format(new Date(row.created_at), 'yyyy-MM-dd');
        
        // Track status changes
        if (!statusMap[updateKey]) statusMap[updateKey] = {};
        const TARGET_STATUSES = ['interviewing','negotiating','accepted','not_selected','no_response'];
        if (TARGET_STATUSES.includes(row.status)) {
          statusMap[updateKey]![row.status] = ((statusMap[updateKey]![row.status] as number) || 0) + 1;
        }
        
        // Track job creation activities
        if (!activityMap[createKey]) activityMap[createKey] = {};
        if (row.status === 'wishlist') {
          activityMap[createKey]!['save_potential_opportunities'] = ((activityMap[createKey]!['save_potential_opportunities'] as number) || 0) + 1;
        } else {
          activityMap[createKey]!['apply_quality_jobs'] = ((activityMap[createKey]!['apply_quality_jobs'] as number) || 0) + 1;
        }
      });
      
      setJobWeekData(activityMap);
      setStatusWeekData(statusMap);
    } catch (e) {
      console.error('Failed to compute job tracker metrics', e);
    }
  }, [user, weekOffset]);

  useEffect(() => {
    refreshApplicationMetrics();
  }, [refreshApplicationMetrics]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('job-app-rt-report')
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
  const baseDate = addWeeks(new Date(), weekOffset);
  const weekDates = getWeekDatesMonToFri(baseDate);
  const isCurrentWeek = weekOffset === 0;
  const todayKey = format(today, 'yyyy-MM-dd');
  const weekDatesToShow = (isCurrentWeek
    ? weekDates.filter(d => format(d, 'yyyy-MM-dd') <= todayKey)
    : weekDates
  ).sort((a, b) => b.getTime() - a.getTime());

  const weekTotalWishlist = weekDates.reduce((sum, d) => sum + (jobWeekData[format(d, 'yyyy-MM-dd')]?.['save_potential_opportunities'] ?? 0), 0);
  const weekTotalApplied = weekDates.reduce((sum, d) => sum + (jobWeekData[format(d, 'yyyy-MM-dd')]?.['apply_quality_jobs'] ?? 0), 0);
  const weekTotalInterviewing = weekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['interviewing'] ?? 0), 0);
  const weekTotalNegotiating = weekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['negotiating'] ?? 0), 0);
  const weekTotalAccepted = weekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['accepted'] ?? 0), 0);
  const weekTotalNotSelected = weekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['not_selected'] ?? 0), 0);
  const weekTotalNoResponse = weekDates.reduce((sum, d) => sum + (statusWeekData[format(d, 'yyyy-MM-dd')]?.['no_response'] ?? 0), 0);

  const weekRangeLabel = `${format(weekDates[0], 'MMM d')} – ${format(weekDates[weekDates.length - 1], 'MMM d')}`;

  // Prepare chart data with different colors for each day
  const chartData = weekDates.map((date, index) => {
    const key = format(date, 'yyyy-MM-dd');
    const wishlist = jobWeekData[key]?.['save_potential_opportunities'] ?? 0;
    const applied = jobWeekData[key]?.['apply_quality_jobs'] ?? 0;
    const interviewing = statusWeekData[key]?.['interviewing'] ?? 0;
    const negotiating = statusWeekData[key]?.['negotiating'] ?? 0;
    const accepted = statusWeekData[key]?.['accepted'] ?? 0;
    const notSelected = statusWeekData[key]?.['not_selected'] ?? 0;
    const noResponse = statusWeekData[key]?.['no_response'] ?? 0;
    
    return {
      date: format(date, 'EEE'),
      fullDate: format(date, 'MMM d'),
      wishlist,
      applied,
      interviewing,
      negotiating,
      accepted,
      notSelected,
      noResponse,
      total: wishlist + applied + interviewing + negotiating + accepted + notSelected + noResponse,
      dayColor: `hsl(var(--chart-${index + 1}))`
    };
  });

  const chartConfig = {
    total: {
      label: "Total Applications",
      color: "hsl(var(--primary))"
    },
    wishlist: {
      label: "Wishlist",
      color: "hsl(var(--chart-1))"
    },
    applied: {
      label: "Applied", 
      color: "hsl(var(--chart-2))"
    },
    interviewing: {
      label: "Interviewing",
      color: "hsl(var(--chart-3))"
    },
    negotiating: {
      label: "Negotiating",
      color: "hsl(var(--chart-4))"
    },
    accepted: {
      label: "Accepted",
      color: "hsl(var(--chart-5))"
    },
    notSelected: {
      label: "Not Selected",
      color: "hsl(var(--destructive))"
    },
    noResponse: {
      label: "No Response",
      color: "hsl(var(--muted-foreground))"
    }
  };

  return (
    <Card className="shadow-elegant border-primary/20">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Application Metrics
          </CardTitle>
          <CardDescription>Actual job applications and status changes from your Job Tracker</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hover-scale" onClick={() => setWeekOffset((v) => v - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Previous Week
          </Button>
          <Badge variant="secondary">{weekRangeLabel}</Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="hover-scale" 
            onClick={() => setWeekOffset((v) => Math.min(0, v + 1))} 
            disabled={weekOffset === 0}
          >
            Next Week <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="animate-fade-in">
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Wishlist</TableHead>
                <TableHead className="text-center">Applied</TableHead>
                <TableHead className="text-center">Interviewing</TableHead>
                <TableHead className="text-center">Negotiating</TableHead>
                <TableHead className="text-center">Accepted</TableHead>
                <TableHead className="text-center">Not Selected</TableHead>
                <TableHead className="text-center">No Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekDatesToShow.map((date) => {
                const key = format(date, 'yyyy-MM-dd');
                const wishlist = jobWeekData[key]?.['save_potential_opportunities'] ?? 0;
                const applied = jobWeekData[key]?.['apply_quality_jobs'] ?? 0;
                const interviewing = statusWeekData[key]?.['interviewing'] ?? 0;
                const negotiating = statusWeekData[key]?.['negotiating'] ?? 0;
                const accepted = statusWeekData[key]?.['accepted'] ?? 0;
                const notSelected = statusWeekData[key]?.['not_selected'] ?? 0;
                const noResponse = statusWeekData[key]?.['no_response'] ?? 0;
                const label = isSameDay(date, today)
                  ? 'Today'
                  : isSameDay(date, subDays(today, 1))
                  ? 'Yesterday'
                  : format(date, 'EEE, MMM d');
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell className="text-center">{wishlist}</TableCell>
                    <TableCell className="text-center">{applied}</TableCell>
                    <TableCell className="text-center">{interviewing}</TableCell>
                    <TableCell className="text-center">{negotiating}</TableCell>
                    <TableCell className="text-center">{accepted}</TableCell>
                    <TableCell className="text-center">{notSelected}</TableCell>
                    <TableCell className="text-center">{noResponse}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-primary/10">
                <TableCell className="font-semibold">Week Total (Mon–Fri)</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalWishlist}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalApplied}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalInterviewing}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalNegotiating}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalAccepted}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalNotSelected}</TableCell>
                <TableCell className="text-center font-semibold">{weekTotalNoResponse}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="mt-6">
            <div className="text-sm font-medium mb-4">Daily Application Status Distribution</div>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      labelFormatter={(value, payload) => {
                        const data = payload?.[0]?.payload;
                        return data ? `${data.fullDate}` : value;
                      }}
                    />} 
                  />
                  <Bar dataKey="total" name="Total Applications" radius={[4,4,0,0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`day-cell-${index}`} fill={entry.dayColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
