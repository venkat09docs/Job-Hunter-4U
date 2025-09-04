import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useSocialProof } from '@/hooks/useSocialProof';
import { Settings, Eye, BarChart3, Users, RefreshCw } from 'lucide-react';

const SocialProofManagement: React.FC = () => {
  const { config, events, updateConfig, fetchEvents, fetchConfig, loading } = useSocialProof();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [previewEventTypes, setPreviewEventTypes] = useState<string[]>([]);

  const eventTypeOptions = [
    { value: 'signup', label: 'New Signups', description: 'Show when users sign up' },
    { value: 'premium_upgrade', label: 'Premium Upgrades', description: 'Show when users upgrade to premium' },
    { value: 'job_application', label: 'Job Applications', description: 'Show when users apply to jobs' },
    { value: 'resume_completion', label: 'Resume Completions', description: 'Show when users complete their resume' },
    { value: 'linkedin_optimization', label: 'LinkedIn Optimization', description: 'Show when users optimize LinkedIn' },
    { value: 'github_setup', label: 'GitHub Setup', description: 'Show when users set up GitHub' }
  ];

  const positionOptions = [
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' }
  ];

  const handleConfigUpdate = async (updates: any) => {
    if (!config) return;
    
    setSaving(true);
    try {
      await updateConfig(updates);
      toast({
        title: "Configuration Updated",
        description: "Social proof settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEventTypeToggle = (eventType: string, checked: boolean) => {
    if (!config) return;
    
    const updatedTypes = checked
      ? [...config.enabled_event_types, eventType]
      : config.enabled_event_types.filter(type => type !== eventType);
    
    handleConfigUpdate({ enabled_event_types: updatedTypes });
  };

  const handleRefresh = async () => {
    await Promise.all([fetchConfig(), fetchEvents()]);
    toast({
      title: "Refreshed",
      description: "Social proof data has been refreshed.",
    });
  };

  // Initialize preview event types with all enabled types when config loads
  React.useEffect(() => {
    if (config && previewEventTypes.length === 0) {
      setPreviewEventTypes(config.enabled_event_types);
    }
  }, [config, previewEventTypes.length]);

  const handlePreviewEventTypeToggle = (eventType: string, checked: boolean) => {
    const updatedTypes = checked
      ? [...previewEventTypes, eventType]
      : previewEventTypes.filter(type => type !== eventType);
    
    setPreviewEventTypes(updatedTypes);
  };

  const filteredEventsForPreview = events.filter(event => 
    previewEventTypes.includes(event.event_type)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No social proof configuration found. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Social Proof Management</h2>
          <p className="text-muted-foreground">Configure social proof notifications to increase conversions</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure when and where social proof notifications appear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show on Landing Page</Label>
                      <p className="text-sm text-muted-foreground">
                        Display for anonymous visitors
                      </p>
                    </div>
                    <Switch
                      checked={config.show_on_landing_page}
                      onCheckedChange={(checked) => handleConfigUpdate({ show_on_landing_page: checked })}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show After Sign In</Label>
                      <p className="text-sm text-muted-foreground">
                        Display for authenticated users
                      </p>
                    </div>
                    <Switch
                      checked={config.show_after_signin}
                      onCheckedChange={(checked) => handleConfigUpdate({ show_after_signin: checked })}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Social Proof</Label>
                      <p className="text-sm text-muted-foreground">
                        Master toggle for all notifications
                      </p>
                    </div>
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(checked) => handleConfigUpdate({ is_active: checked })}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="position">Notification Position</Label>
                    <Select
                      value={config.position}
                      onValueChange={(value) => handleConfigUpdate({ position: value })}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="displayDuration">Display Duration (ms)</Label>
                    <Input
                      id="displayDuration"
                      type="number"
                      value={config.display_duration}
                      onChange={(e) => handleConfigUpdate({ display_duration: parseInt(e.target.value) })}
                      disabled={saving}
                      min={1000}
                      max={30000}
                      step={1000}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rotationInterval">Rotation Interval (ms)</Label>
                    <Input
                      id="rotationInterval"
                      type="number"
                      value={config.rotation_interval}
                      onChange={(e) => handleConfigUpdate({ rotation_interval: parseInt(e.target.value) })}
                      disabled={saving}
                      min={5000}
                      max={60000}
                      step={1000}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxEvents">Max Events Shown</Label>
                    <Input
                      id="maxEvents"
                      type="number"
                      value={config.max_events_shown}
                      onChange={(e) => handleConfigUpdate({ max_events_shown: parseInt(e.target.value) })}
                      disabled={saving}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Types */}
          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>
                Choose which types of activities should trigger social proof notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventTypeOptions.map((eventType) => (
                  <div key={eventType.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={config.enabled_event_types.includes(eventType.value)}
                      onCheckedChange={(checked) => handleEventTypeToggle(eventType.value, checked as boolean)}
                      disabled={saving}
                    />
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{eventType.label}</Label>
                      <p className="text-xs text-muted-foreground">{eventType.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Preview Event Type Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Event Filters</CardTitle>
              <CardDescription>
                Select which event types to show in the preview below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eventTypeOptions.map((eventType) => (
                  <div key={eventType.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`preview-${eventType.value}`}
                      checked={previewEventTypes.includes(eventType.value)}
                      onCheckedChange={(checked) => handlePreviewEventTypeToggle(eventType.value, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`preview-${eventType.value}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {eventType.label}
                    </Label>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {previewEventTypes.length} of {eventTypeOptions.length} event types
                </span>
                <div className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewEventTypes(eventTypeOptions.map(e => e.value))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewEventTypes([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events Preview</CardTitle>
              <CardDescription>
                Preview of recent social proof events that would be displayed ({filteredEventsForPreview.length} events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEventsForPreview.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {previewEventTypes.length === 0 
                    ? "Select event types above to see preview"
                    : "No recent events to display for selected types"
                  }
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredEventsForPreview.slice(0, 10).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{event.display_text}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(event.created_at).toLocaleString()}</span>
                          {event.location && (
                            <>
                              <span>•</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{event.event_type}</Badge>
                    </div>
                  ))}
                  {filteredEventsForPreview.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      And {filteredEventsForPreview.length - 10} more events...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>
                Social proof performance and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Badge className="mb-2" variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-sm text-muted-foreground">System Status</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{config.enabled_event_types.length}</p>
                  <p className="text-sm text-muted-foreground">Enabled Event Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialProofManagement;