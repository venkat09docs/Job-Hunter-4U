import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface PremiumFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_premium: boolean;
}

export default function ManageSubscriptions() {
  const [features, setFeatures] = useState<PremiumFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useRole();

  useEffect(() => {
    if (isAdmin) {
      fetchFeatures();
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
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription Features</CardTitle>
          <CardDescription>
            Configure which features require an active subscription. Premium features will show a lock icon for non-subscribed users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {features.map((feature) => (
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
        </CardContent>
      </Card>
    </div>
  );
}