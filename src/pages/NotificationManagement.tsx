import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useNotificationManagement } from '@/hooks/useNotificationManagement';
import { useNotificationAnalytics } from '@/hooks/useNotificationAnalytics';
import { NotificationTemplateEditor } from '@/components/NotificationTemplateEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Settings,
  Mail,
  Bell,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Target,
  BarChart3,
  Send,
  Users,
  Clock,
  Filter
} from 'lucide-react';

export default function NotificationManagement() {
  const { 
    templates, 
    schedules, 
    loading, 
    hasAccess,
    updateTemplate,
    deleteTemplate,
    updateSchedule,
    deleteSchedule
  } = useNotificationManagement();
  
  const {
    triggers,
    sendBulkNotification,
    toggleTrigger,
    analytics
  } = useNotificationAnalytics();

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkNotificationData, setBulkNotificationData] = useState({
    title: '',
    message: '',
    target_roles: ['user'],
    priority: 'medium',
    category: 'general'
  });
  const [sendingBulk, setSendingBulk] = useState(false);

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You need admin or recruiter permissions to manage notifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title_template.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.template_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || filterType === template.category;
    return matchesSearch && matchesType;
  });

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setEditorOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const result = await deleteTemplate(id);
      if (result.success) {
        toast.success('Template deleted successfully');
      } else {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleToggleTemplate = async (id: string, is_active: boolean) => {
    const result = await updateTemplate(id, { is_active: !is_active });
    if (result.success) {
      toast.success(`Template ${!is_active ? 'activated' : 'deactivated'}`);
    } else {
      toast.error('Failed to update template');
    }
  };

  const handleSendBulkNotification = async () => {
    if (!bulkNotificationData.title || !bulkNotificationData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    setSendingBulk(true);
    try {
      const result = await sendBulkNotification(bulkNotificationData);
      if (result.success) {
        toast.success(`Bulk notification sent to ${result.sentCount} users`);
        setBulkNotificationData({
          title: '',
          message: '',
          target_roles: ['user'],
          priority: 'medium',
          category: 'general'
        });
      } else {
        toast.error('Failed to send bulk notification');
      }
    } catch (error) {
      toast.error('Error sending notification');
    } finally {
      setSendingBulk(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage email templates, in-app notifications, schedules, and analytics
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{analytics.total_sent}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{analytics.open_rate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold">{analytics.click_rate}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Templates</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Triggers
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Bulk Send
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="in_app">In-App</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.category === 'email' ? (
                        <Mail className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                      {template.title_template}
                    </CardTitle>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Key: {template.template_key}</p>
                    {template.email_subject_template && (
                      <p className="text-sm text-muted-foreground">Subject: {template.email_subject_template}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={() => handleToggleTemplate(template.id, template.is_active)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {schedule.schedule_name}
                    </CardTitle>
                    <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Type:</strong> {schedule.schedule_type}</p>
                  <p><strong>Target Roles:</strong> {schedule.target_roles.join(', ')}</p>
                  {schedule.last_run_at && (
                    <p><strong>Last Run:</strong> {new Date(schedule.last_run_at).toLocaleString()}</p>
                  )}
                  {schedule.next_run_at && (
                    <p><strong>Next Run:</strong> {new Date(schedule.next_run_at).toLocaleString()}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {triggers.map((trigger) => (
              <Card key={trigger.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{trigger.trigger_name}</CardTitle>
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={() => toggleTrigger(trigger.id, trigger.is_active)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Type:</strong> {trigger.trigger_type}</p>
                  <p><strong>Target Roles:</strong> {trigger.target_roles.join(', ')}</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(trigger.conditions).map((key) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {trigger.conditions[key]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bulk Send Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Notification title"
                    value={bulkNotificationData.title}
                    onChange={(e) => setBulkNotificationData(prev => ({ 
                      ...prev, title: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={bulkNotificationData.priority}
                    onChange={(e) => setBulkNotificationData(prev => ({ 
                      ...prev, priority: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  placeholder="Notification message"
                  value={bulkNotificationData.message}
                  onChange={(e) => setBulkNotificationData(prev => ({ 
                    ...prev, message: e.target.value 
                  }))}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <Button
                onClick={handleSendBulkNotification}
                disabled={sendingBulk || !bulkNotificationData.title || !bulkNotificationData.message}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendingBulk ? 'Sending...' : 'Send Bulk Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NotificationTemplateEditor
        template={selectedTemplate}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={() => {
          // Refresh data will be handled by the hook
        }}
      />
    </div>
  );
}