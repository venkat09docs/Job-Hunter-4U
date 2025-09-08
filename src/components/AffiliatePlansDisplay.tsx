import React from 'react';
import { useAffiliatePlanCommissions } from '@/hooks/useAffiliatePlanCommissions';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Zap, Star } from 'lucide-react';

const AffiliatePlansDisplay = () => {
  const { planCommissions, loading: commissionsLoading } = useAffiliatePlanCommissions();
  const { plansWithPrices, loading: plansLoading } = useSubscriptionPlans();

  const loading = commissionsLoading || plansLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const activePlans = planCommissions.filter(plan => plan.is_active);

  // Function to get actual plan price from database
  const getActualPlanPrice = (planName: string): number => {
    const matchingPlan = plansWithPrices.find(plan => 
      plan.name.toLowerCase() === planName.toLowerCase()
    );
    // If plan exists in database and has a valid price (not 0), use it; otherwise use estimated price
    return matchingPlan && matchingPlan.price > 0 ? matchingPlan.price : getEstimatedPlanPrice(planName);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Available Plans & Commission Rates</h3>
        <p className="text-muted-foreground">
          Earn commissions when users subscribe to these plans using your affiliate link
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activePlans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                <Badge variant="default" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {plan.commission_rate}%
                </Badge>
              </div>
              <CardDescription>
                Earn ₹{((plan.commission_rate / 100) * getActualPlanPrice(plan.plan_name)).toFixed(2)} 
                {' '}commission per successful referral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Commission Rate</p>
                  <p className="text-2xl font-bold text-primary">{plan.commission_rate}%</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plan Price:</span>
                  <span className="font-medium">₹{getActualPlanPrice(plan.plan_name).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Earning Per Sale:</span>
                  <span className="font-bold text-green-600">
                    ₹{((plan.commission_rate / 100) * getActualPlanPrice(plan.plan_name)).toFixed(2)}
                  </span>
                </div>
              </div>

              {plan.commission_rate >= 15 && (
                <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Star className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    High Commission Plan
                  </span>
                </div>
              )}

              {plan.commission_rate >= 20 && (
                <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Premium Commission Rate
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activePlans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No Active Plans Available</p>
            <p className="text-muted-foreground">
              Commission plans will appear here once they are configured by the admin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to estimate plan prices based on plan names
const getEstimatedPlanPrice = (planName: string): number => {
  const normalizedName = planName.toLowerCase();
  
  if (normalizedName.includes('one week') || normalizedName.includes('7 day')) {
    return 699; // Updated to correct price
  } else if (normalizedName.includes('one month') || normalizedName.includes('1 month')) {
    return 1499; // Updated to correct price
  } else if (normalizedName.includes('3 month') || normalizedName.includes('quarterly')) {
    return 3999; // Updated to correct price
  } else if (normalizedName.includes('6 month')) {
    return 6999;
  } else if (normalizedName.includes('1 year') || normalizedName.includes('annual') || normalizedName.includes('yearly') || normalizedName.includes('12 month')) {
    return 11999; // Updated to correct price
  } else if (normalizedName.includes('plan a') || normalizedName.includes('course only')) {
    return 20000;
  } else if (normalizedName.includes('plan b') || normalizedName.includes('placement')) {
    return 30000;
  } else if (normalizedName.includes('premium')) {
    return 1999;
  }
  
  // Default fallback
  return 999;
};

export default AffiliatePlansDisplay;