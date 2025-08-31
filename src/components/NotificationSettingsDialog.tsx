import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificationAnalytics } from '@/hooks/useNotificationAnalytics';
import { toast } from 'sonner';
import { 
  Settings, 
  Clock, 
  Globe, 
  Mail, 
  Smartphone, 
  Bell, 
  Calendar,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NotificationSettingsDialogProps {
  children: React.ReactNode;
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' }
];

export function NotificationSettingsDialog({ children }: NotificationSettingsDialogProps) {
  const { userSettings, loading, updateUserSettings } = useNotificationAnalytics();
  const [settings, setSettings] = useState({
    timezone: 'UTC',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    weekend_notifications: true,
    max_daily_notifications: 10,
    digest_frequency: 'daily' as 'off' | 'daily' | 'weekly',
    digest_time: '09:00',
    notification_methods: {
      in_app: true,
      email: true,
      sms: false,
      push: true
    }
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userSettings) {
      setSettings({
        timezone: userSettings.timezone,
        quiet_hours_start: userSettings.quiet_hours_start,
        quiet_hours_end: userSettings.quiet_hours_end,
        weekend_notifications: userSettings.weekend_notifications,
        max_daily_notifications: userSettings.max_daily_notifications,
        digest_frequency: userSettings.digest_frequency as 'off' | 'daily' | 'weekly',
        digest_time: userSettings.digest_time,
        notification_methods: userSettings.notification_methods || {
          in_app: true,
          email: true,
          sms: false,
          push: true
        }
      });
    }
  }, [userSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateUserSettings(settings);
      if (result?.success) {
        toast.success('Notification settings updated successfully!');
      } else {
        toast.error('Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationMethod = (method: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_methods: {
        ...prev.notification_methods,
        [method]: enabled
      }
    }));
  };

  if (loading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Notification Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Delivery Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <Label>In-App Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.notification_methods.in_app}
                    onCheckedChange={(checked) => updateNotificationMethod('in_app', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label>Email Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.notification_methods.email}
                    onCheckedChange={(checked) => updateNotificationMethod('email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <Label>Push Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.notification_methods.push}
                    onCheckedChange={(checked) => updateNotificationMethod('push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <Label>SMS Notifications</Label>
                    <Badge variant="outline" className="text-xs">Premium</Badge>
                  </div>
                  <Switch
                    checked={settings.notification_methods.sms}
                    onCheckedChange={(checked) => updateNotificationMethod('sms', checked)}
                    disabled={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing & Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timing & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Daily Notifications</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.max_daily_notifications}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_daily_notifications: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Moon className="h-4 w-4" />
                  Quiet Hours
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">End Time</Label>
                    <Input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Notifications will be delayed during quiet hours (except critical alerts)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label>Weekend Notifications</Label>
                </div>
                <Switch
                  checked={settings.weekend_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weekend_notifications: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Digest Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Digest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Digest Frequency</Label>
                  <Select
                    value={settings.digest_frequency}
                    onValueChange={(value: 'off' | 'daily' | 'weekly') => setSettings(prev => ({ ...prev, digest_frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {settings.digest_frequency !== 'off' && (
                  <div className="space-y-2">
                    <Label>Digest Time</Label>
                    <Input
                      type="time"
                      value={settings.digest_time}
                      onChange={(e) => setSettings(prev => ({ ...prev, digest_time: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              
              {settings.digest_frequency !== 'off' && (
                <p className="text-sm text-muted-foreground">
                  Get a summary of your notifications via email {settings.digest_frequency} at {settings.digest_time}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Privacy & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Privacy & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Help us improve by tracking notification interactions</p>
                  </div>
                  <Badge variant="default">Always On</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Smart Scheduling</Label>
                    <p className="text-sm text-muted-foreground">Optimize notification timing based on your activity</p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}