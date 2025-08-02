import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, ArrowLeft, MousePointer, Lock } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { Link } from 'react-router-dom';

interface PremiumFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_premium: boolean;
}

interface DashboardClickPermission {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  requires_premium: boolean;
  is_active: boolean;
}

export default function ManageSubscriptions() {
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [dashboardPermissions, setDashboardPermissions] = useState<DashboardClickPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useRole();

  // Separate page features from other features
  const pageFeatures = features.filter(f => f.feature_key.startsWith('page_'));
  const otherFeatures = features.filter(f => !f.feature_key.startsWith('page_'));

  useEffect(() => {
    if (isAdmin) {
      fetchFeatures();
      fetchDashboardPermissions();
    }
  }, [isAdmin]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .order('feature_name');
      
      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching features',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchDashboardPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_click_permissions')
        .select('*')
        .order('feature_name');
      
      if (error) throw error;
      setDashboardPermissions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching dashboard permissions',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = async (id: string, updates: Partial<PremiumFeature>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('premium_features')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setFeatures(prev => prev.map(feature => 
        feature.id === id ? { ...feature, ...updates } : feature
      ));
      
      toast({
        title: 'Feature updated',
        description: 'Premium feature settings have been saved.'
      });
    } catch (error: any) {
      toast({
        title: 'Error updating feature',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePremium = (id: string, is_premium: boolean) => {
    updateFeature(id, { is_premium });
  };

  const updateDescription = (id: string, description: string) => {
    updateFeature(id, { description });
  };

  const updateDashboardPermission = async (id: string, updates: Partial<DashboardClickPermission>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('dashboard_click_permissions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setDashboardPermissions(prev => prev.map(permission => 
        permission.id === id ? { ...permission, ...updates } : permission
      ));
      
      toast({
        title: 'Permission updated',
        description: 'Dashboard click permission settings have been saved.'
      });
    } catch (error: any) {
      toast({
        title: 'Error updating permission',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDashboardPremium = (id: string, requires_premium: boolean) => {
    updateDashboardPermission(id, { requires_premium });
  };

  const updateDashboardDescription = (id: string, feature_description: string) => {
    updateDashboardPermission(id, { feature_description });
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Manage Subscription Features</h1>
      </div>
      
      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Page Access
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Other Features
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Dashboard Clicks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Page Access Control</CardTitle>
              <CardDescription>
                Control which pages require premium subscription access. Users without premium will be redirected to upgrade when trying to access restricted pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pageFeatures.map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`page-${feature.id}`} className="text-base font-medium">
                          {feature.feature_name}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`page-premium-${feature.id}`} className="text-sm">
                            Requires Premium
                          </Label>
                          <Switch
                            id={`page-premium-${feature.id}`}
                            checked={feature.is_premium}
                            onCheckedChange={(checked) => togglePremium(feature.id, checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Page Key: <code className="bg-muted px-1 rounded">{feature.feature_key}</code>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`page-desc-${feature.id}`} className="text-sm">
                          Description
                        </Label>
                        <Textarea
                          id={`page-desc-${feature.id}`}
                          value={feature.description || ''}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            setFeatures(prev => prev.map(f => 
                              f.id === feature.id ? { ...f, description: newDesc } : f
                            ));
                          }}
                          onBlur={(e) => updateDescription(feature.id, e.target.value)}
                          placeholder="Enter page description..."
                          className="min-h-[60px]"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {pageFeatures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No page-level features found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Other Premium Features</CardTitle>
              <CardDescription>
                Configure other application features that require an active subscription. Premium features will show a lock icon for non-subscribed users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {otherFeatures.map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`feature-${feature.id}`} className="text-base font-medium">
                          {feature.feature_name}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`premium-${feature.id}`} className="text-sm">
                            Premium Feature
                          </Label>
                          <Switch
                            id={`premium-${feature.id}`}
                            checked={feature.is_premium}
                            onCheckedChange={(checked) => togglePremium(feature.id, checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Feature Key: <code className="bg-muted px-1 rounded">{feature.feature_key}</code>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`desc-${feature.id}`} className="text-sm">
                          Description
                        </Label>
                        <Textarea
                          id={`desc-${feature.id}`}
                          value={feature.description || ''}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            setFeatures(prev => prev.map(f => 
                              f.id === feature.id ? { ...f, description: newDesc } : f
                            ));
                          }}
                          onBlur={(e) => updateDescription(feature.id, e.target.value)}
                          placeholder="Enter feature description..."
                          className="min-h-[60px]"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {otherFeatures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No other premium features found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Click Permissions</CardTitle>
              <CardDescription>
                Control which dashboard elements require premium access. Users without premium subscriptions will see upgrade prompts when clicking restricted items.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {dashboardPermissions.map((permission) => (
                <Card key={permission.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`dashboard-${permission.id}`} className="text-base font-medium">
                          {permission.feature_name}
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`dashboard-premium-${permission.id}`} className="text-sm">
                            Requires Premium
                          </Label>
                          <Switch
                            id={`dashboard-premium-${permission.id}`}
                            checked={permission.requires_premium}
                            onCheckedChange={(checked) => toggleDashboardPremium(permission.id, checked)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Feature Key: <code className="bg-muted px-1 rounded">{permission.feature_key}</code>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`dashboard-desc-${permission.id}`} className="text-sm">
                          Description
                        </Label>
                        <Textarea
                          id={`dashboard-desc-${permission.id}`}
                          value={permission.feature_description || ''}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            setDashboardPermissions(prev => prev.map(p => 
                              p.id === permission.id ? { ...p, feature_description: newDesc } : p
                            ));
                          }}
                          onBlur={(e) => updateDashboardDescription(permission.id, e.target.value)}
                          placeholder="Enter permission description..."
                          className="min-h-[60px]"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}