import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Bell, 
  Users, 
  TrendingUp, 
  Activity, 
  Send, 
  Eye, 
  MousePointer, 
  Calendar,
  Settings,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

interface NotificationTrigger {
  id: string;
  trigger_name: string;
  trigger_type: string;
  conditions: any;
  notification_template: string;
  target_roles: string[];
  is_active: boolean;
  created_at: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export const NotificationAnalyticsDashboard = () => {
  const { isAdmin, isRecruiter } = useRole();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    open_rate: 0,
    click_rate: 0
  });
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  
  // Admin notification sending state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    target_roles: ['admin'],
    priority: 'medium',
    category: 'admin'
  });

  useEffect(() => {
    if (isAdmin || isRecruiter) {
      fetchAnalytics();
      fetchTriggers();
    }
  }, [isAdmin, isRecruiter, dateRange]);

  const fetchAnalytics = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      
      const { data, error } = await supabase.rpc('get_notification_analytics_summary', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const fetchTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notification_triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error fetching triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendBulkNotification = async () => {
    try {
      const { data, error } = await supabase.rpc('send_admin_notification', {
        notification_title: notificationForm.title,
        notification_message: notificationForm.message,
        target_roles: notificationForm.target_roles,
        priority: notificationForm.priority,
        notification_category: notificationForm.category
      });

      if (error) throw error;

      toast.success(`Notification sent to ${data} users!`);
      setNotificationForm({
        title: '',
        message: '',
        target_roles: ['admin'],
        priority: 'medium',
        category: 'admin'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_notification_triggers')
        .update({ is_active: !isActive })
        .eq('id', triggerId);

      if (error) throw error;

      setTriggers(prev => prev.map(t => 
        t.id === triggerId ? { ...t, is_active: !isActive } : t
      ));

      toast.success('Trigger updated successfully');
    } catch (error) {
      console.error('Error updating trigger:', error);
      toast.error('Failed to update trigger');
    }
  };

  if (!isAdmin && !isRecruiter) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const analyticsCards = [
    {
      title: 'Total Sent',
      value: analytics.total_sent.toLocaleString(),
      icon: Send,
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Opened',
      value: analytics.total_opened.toLocaleString(),
      icon: Eye,
      change: `${analytics.open_rate.toFixed(1)}%`,
      changeType: 'neutral' as const
    },
    {
      title: 'Total Clicked',
      value: analytics.total_clicked.toLocaleString(),
      icon: MousePointer,
      change: `${analytics.click_rate.toFixed(1)}%`,
      changeType: 'neutral' as const
    },
    {
      title: 'Engagement Rate',
      value: `${((analytics.total_clicked + analytics.total_opened) / Math.max(analytics.total_sent, 1) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      change: '+5%',
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notification Analytics</h2>
          <p className="text-muted-foreground">Manage and analyze notification performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Label>Date Range:</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${card.changeType === 'positive' ? 'text-green-600' : 'text-muted-foreground'}`}>
                {card.change} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="triggers">Auto Triggers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Open Rate</span>
                    <Badge variant="secondary">{analytics.open_rate.toFixed(1)}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min(analytics.open_rate, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Click Rate</span>
                    <Badge variant="secondary">{analytics.click_rate.toFixed(1)}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(analytics.click_rate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4" />
                    <span>System monitoring active</span>
                    <Badge variant="outline" className="ml-auto">Live</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4" />
                    <span>Auto-triggers enabled</span>
                    <Badge variant="outline" className="ml-auto">{triggers.filter(t => t.is_active).length} Active</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Analytics tracking</span>
                    <Badge variant="outline" className="ml-auto">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Notification</CardTitle>
              <p className="text-sm text-muted-foreground">Send notifications to multiple users based on their roles</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={notificationForm.priority} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your notification message..."
                />
              </div>

              <div className="space-y-2">
                <Label>Target Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {['admin', 'recruiter', 'institute_admin', 'user'].map((role) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationForm.target_roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotificationForm(prev => ({ ...prev, target_roles: [...prev.target_roles, role] }));
                          } else {
                            setNotificationForm(prev => ({ ...prev, target_roles: prev.target_roles.filter(r => r !== role) }));
                          }
                        }}
                      />
                      <Badge variant="outline">{role}</Badge>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={sendBulkNotification}
                disabled={!notificationForm.title || !notificationForm.message}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto Notification Triggers</CardTitle>
              <p className="text-sm text-muted-foreground">Configure automatic notifications based on system events</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.map((trigger) => (
                  <div key={trigger.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{trigger.trigger_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Type: {trigger.trigger_type} | Targets: {trigger.target_roles.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Template: {trigger.notification_template}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTrigger(trigger.id, trigger.is_active)}
                      >
                        {trigger.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
                
                {triggers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2" />
                    <p>No auto-triggers configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytics Tracking</h4>
                    <p className="text-sm text-muted-foreground">Track notification opens and clicks</p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto Scheduling</h4>
                    <p className="text-sm text-muted-foreground">Respect user quiet hours and preferences</p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Batch Processing</h4>
                    <p className="text-sm text-muted-foreground">Process notifications in batches for performance</p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};