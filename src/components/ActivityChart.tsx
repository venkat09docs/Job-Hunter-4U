import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Analytics {
  date: string;
  resume_opens: number;
  job_searches: number;
  ai_queries: number;
}

interface ActivityChartProps {
  analytics: Analytics[];
}

const ActivityChart = ({ analytics }: ActivityChartProps) => {
  // Format data for the chart
  const chartData = analytics.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Resume Opens': item.resume_opens,
    'Job Searches': item.job_searches,
    'AI Queries': item.ai_queries
  }));

  // Fill in missing days with 0 values
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const existingData = analytics.find(a => a.date === dateStr);
    
    last7Days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Resume Opens': existingData?.resume_opens || 0,
      'Job Searches': existingData?.job_searches || 0,
      'AI Queries': existingData?.ai_queries || 0
    });
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <CardDescription>Your activity over the past 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Resume Opens" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="Job Searches" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="AI Queries" 
              stroke="hsl(var(--warning))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;