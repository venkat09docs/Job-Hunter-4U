import { useState } from 'react';
import { ResizableLayout } from '@/components/ResizableLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useRole } from '@/hooks/useRole';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_paisa: number;
  original_price_paisa: number;
  duration_days: number;
  features: any;
  is_active: boolean;
  description: string;
  discount_per_member: number;
  member_limit: number;
  is_popular: boolean;
}

export default function InstitutesSubscriptionPlan() {
  const { plans, loading, refreshPlans } = useSubscriptionPlans();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({});
  const [isCreating, setIsCreating] = useState(false);

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setNewPlan({ ...plan });
  };

  const handleSavePlan = async () => {
    try {
      if (editingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: newPlan.name,
            price_paisa: newPlan.price_paisa,
            original_price_paisa: newPlan.original_price_paisa,
            duration_days: newPlan.duration_days,
            description: newPlan.description,
            discount_per_member: newPlan.discount_per_member,
            member_limit: newPlan.member_limit,
            is_popular: newPlan.is_popular,
            features: newPlan.features,
            is_active: newPlan.is_active,
          })
          .eq('id', editingPlan);

        if (error) throw error;
        toast({ title: 'Success', description: 'Plan updated successfully' });
      } else {
        // Create new plan
        const { error } = await supabase
          .from('subscription_plans')
          .insert([{
            name: newPlan.name,
            price_paisa: newPlan.price_paisa,
            original_price_paisa: newPlan.original_price_paisa,
            duration_days: newPlan.duration_days,
            description: newPlan.description,
            discount_per_member: newPlan.discount_per_member || 0,
            member_limit: newPlan.member_limit || 0,
            is_popular: newPlan.is_popular || false,
            features: newPlan.features || {},
            is_active: newPlan.is_active !== false,
          }]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Plan created successfully' });
      }

      setEditingPlan(null);
      setIsCreating(false);
      setNewPlan({});
      refreshPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save plan',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', planId);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Plan deactivated successfully' });
      refreshPlans();
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate plan',
        variant: 'destructive'
      });
    }
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setIsCreating(false);
    setNewPlan({});
  };

  if (!isAdmin) {
    return (
      <ResizableLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </ResizableLayout>
    );
  }

  return (
    <ResizableLayout>
      <div className="flex flex-col h-full bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Institutes Subscription Plans</h1>
              <p className="text-sm text-muted-foreground">
                Manage subscription plans for institutes
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Plan
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center">Loading plans...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isCreating && (
                <Card className="border-dashed border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      New Plan
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSavePlan} className="gap-2">
                          <Save className="h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-2">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        value={newPlan.name || ''}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="Enter plan name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newPlan.price_paisa ? newPlan.price_paisa / 100 : ''}
                          onChange={(e) => setNewPlan({ ...newPlan, price_paisa: parseFloat(e.target.value) * 100 })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (days)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newPlan.duration_days || ''}
                          onChange={(e) => setNewPlan({ ...newPlan, duration_days: parseInt(e.target.value) })}
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newPlan.description || ''}
                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                        placeholder="Plan description"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {editingPlan === plan.id ? (
                        <Input
                          value={newPlan.name || ''}
                          onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                          className="text-lg font-semibold"
                        />
                      ) : (
                        <>
                          {plan.name}
                          {plan.is_popular && (
                            <Badge variant="secondary">Popular</Badge>
                          )}
                        </>
                      )}
                      <div className="flex gap-2">
                        {editingPlan === plan.id ? (
                          <>
                            <Button size="sm" onClick={handleSavePlan} className="gap-2">
                              <Save className="h-4 w-4" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-2">
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)} className="gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePlan(plan.id)} className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingPlan === plan.id ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-price">Price (₹)</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              value={newPlan.price_paisa ? newPlan.price_paisa / 100 : ''}
                              onChange={(e) => setNewPlan({ ...newPlan, price_paisa: parseFloat(e.target.value) * 100 })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-duration">Duration (days)</Label>
                            <Input
                              id="edit-duration"
                              type="number"
                              value={newPlan.duration_days || ''}
                              onChange={(e) => setNewPlan({ ...newPlan, duration_days: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={newPlan.description || ''}
                            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">₹{(plan.price_paisa / 100).toLocaleString()}</span>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Duration: {plan.duration_days} days
                        </p>
                        <p className="text-sm">{plan.description}</p>
                        {plan.discount_per_member > 0 && (
                          <p className="text-sm text-green-600">
                            Discount per member: {plan.discount_per_member}%
                          </p>
                        )}
                        {plan.member_limit > 0 && (
                          <p className="text-sm text-blue-600">
                            Member limit: {plan.member_limit}
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ResizableLayout>
  );
}