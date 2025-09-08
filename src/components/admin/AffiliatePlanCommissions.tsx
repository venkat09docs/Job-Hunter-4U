import React, { useState } from 'react';
import { useAffiliatePlanCommissions } from '@/hooks/useAffiliatePlanCommissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Settings, DollarSign, TrendingUp, Save, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AffiliatePlanCommissions = () => {
  const { 
    planCommissions, 
    loading, 
    updateCommissionRate, 
    togglePlanActive 
  } = useAffiliatePlanCommissions();
  const { toast } = useToast();
  
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [savingRates, setSavingRates] = useState<Record<string, boolean>>({});

  const handleRateChange = (planId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setEditingRates(prev => ({ ...prev, [planId]: numValue }));
    }
  };

  const saveCommissionRate = async (planId: string) => {
    const newRate = editingRates[planId];
    if (newRate === undefined) return;

    setSavingRates(prev => ({ ...prev, [planId]: true }));
    
    try {
      await updateCommissionRate(planId, newRate);
      setEditingRates(prev => {
        const updated = { ...prev };
        delete updated[planId];
        return updated;
      });
    } finally {
      setSavingRates(prev => ({ ...prev, [planId]: false }));
    }
  };

  const cancelEdit = (planId: string) => {
    setEditingRates(prev => {
      const updated = { ...prev };
      delete updated[planId];
      return updated;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const totalActivePlans = planCommissions.filter(p => p.is_active).length;
  const averageCommission = planCommissions.length > 0 
    ? planCommissions.reduce((sum, p) => sum + p.commission_rate, 0) / planCommissions.length 
    : 0;
  const highestCommission = Math.max(...planCommissions.map(p => p.commission_rate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Affiliate Plan Commission Management
        </h2>
        <p className="text-muted-foreground">
          Configure commission rates for each subscription plan in the affiliate program
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivePlans}</div>
            <p className="text-xs text-muted-foreground">
              Out of {planCommissions.length} total plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Commission</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCommission.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestCommission}%</div>
            <p className="text-xs text-muted-foreground">
              Maximum earning rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plan Commission Rates</CardTitle>
          <CardDescription>
            Set different commission rates for each subscription plan to incentivize specific tiers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Commission Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planCommissions.map((plan) => {
                  const isEditing = editingRates.hasOwnProperty(plan.id);
                  const currentRate = isEditing ? editingRates[plan.id] : plan.commission_rate;
                  const isSaving = savingRates[plan.id];

                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.plan_name}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={currentRate}
                              onChange={(e) => handleRateChange(plan.id, e.target.value)}
                              className="w-20"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{plan.commission_rate}%</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRates(prev => ({ 
                                ...prev, 
                                [plan.id]: plan.commission_rate 
                              }))}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={(checked) => togglePlanActive(plan.id, checked)}
                          />
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(plan.updated_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelEdit(plan.id)}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveCommissionRate(plan.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving...' : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Current: {plan.commission_rate}%
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Commission Examples</span>
            </div>
            <div className="grid gap-2 text-xs text-muted-foreground">
              {planCommissions.filter(p => p.is_active).map(plan => (
                <div key={plan.id} className="flex justify-between">
                  <span>{plan.plan_name}:</span>
                  <span>
                    ₹1000 purchase = ₹{(1000 * plan.commission_rate / 100).toFixed(2)} commission
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliatePlanCommissions;