import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { corsHeaders } from '../_shared/cors.ts';

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Get subscription plans API called');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { currentPlanName, currentPlanId, userId } = await req.json().catch(() => ({}));

    console.log('Request params:', { currentPlanName, currentPlanId, userId });

    // Fetch all active subscription plans, ordered by duration
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('duration_days', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      throw plansError;
    }

    console.log(`Fetched ${plans?.length || 0} subscription plans`);

    // Convert paisa to rupees for easier consumption
    const formattedPlans = plans?.map((plan: SubscriptionPlan) => ({
      ...plan,
      price_rupees: plan.price_paisa / 100,
      original_price_rupees: plan.original_price_paisa / 100,
      discount_percentage: Math.round(((plan.original_price_paisa - plan.price_paisa) / plan.original_price_paisa) * 100),
      duration_display: plan.duration_days === 7 ? '1 Week' :
                       plan.duration_days === 30 ? '1 Month' :
                       plan.duration_days === 90 ? '3 Months' :
                       plan.duration_days === 180 ? '6 Months' :
                       plan.duration_days === 365 ? '1 Year' :
                       `${plan.duration_days} Days`
    })) || [];

    // If current plan is provided, find it and suggest upgrades
    let currentPlan = null;
    let upgradablePlans = [];
    let userSubscriptionStatus = null;

    // If userId is provided, fetch their current subscription
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_active, subscription_end_date, subscription_start_date')
        .eq('user_id', userId)
        .single();

      if (!profileError && profile) {
        userSubscriptionStatus = {
          plan: profile.subscription_plan,
          active: profile.subscription_active,
          startDate: profile.subscription_start_date,
          endDate: profile.subscription_end_date,
          daysRemaining: profile.subscription_end_date 
            ? Math.max(0, Math.ceil((new Date(profile.subscription_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0
        };
        
        if (profile.subscription_plan) {
          currentPlan = formattedPlans.find(p => p.name === profile.subscription_plan);
        }
      }
    }

    // Find current plan by name or id if provided explicitly
    if (!currentPlan && (currentPlanName || currentPlanId)) {
      currentPlan = formattedPlans.find(p => 
        p.name === currentPlanName || p.id === currentPlanId
      );
    }

    // Find upgrade options (plans with longer duration than current)
    if (currentPlan) {
      upgradablePlans = formattedPlans
        .filter(p => p.duration_days > currentPlan.duration_days)
        .map(plan => ({
          ...plan,
          savingsFromCurrent: currentPlan.price_rupees - plan.price_rupees,
          additionalDays: plan.duration_days - currentPlan.duration_days,
          upgradeRecommendation: generateUpgradeRecommendation(currentPlan, plan)
        }));
    }

    const response = {
      success: true,
      data: {
        allPlans: formattedPlans,
        currentPlan: currentPlan || null,
        upgradablePlans: upgradablePlans,
        userSubscriptionStatus: userSubscriptionStatus,
        planCategories: {
          free: formattedPlans.filter(p => p.price_paisa === 0),
          weekly: formattedPlans.filter(p => p.duration_days <= 7 && p.price_paisa > 0),
          monthly: formattedPlans.filter(p => p.duration_days > 7 && p.duration_days <= 30),
          quarterly: formattedPlans.filter(p => p.duration_days > 30 && p.duration_days <= 90),
          halfYearly: formattedPlans.filter(p => p.duration_days > 90 && p.duration_days <= 180),
          yearly: formattedPlans.filter(p => p.duration_days > 180)
        },
        totalPlans: formattedPlans.length
      },
      timestamp: new Date().toISOString()
    };

    console.log('Successfully prepared subscription plans response');

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-subscription-plans:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function generateUpgradeRecommendation(currentPlan: any, upgradePlan: any): string {
  const additionalDays = upgradePlan.duration_days - currentPlan.duration_days;
  const pricePerDay = upgradePlan.price_rupees / upgradePlan.duration_days;
  const currentPricePerDay = currentPlan.price_rupees / currentPlan.duration_days;
  const savingsPercentage = Math.round(((currentPricePerDay - pricePerDay) / currentPricePerDay) * 100);

  if (savingsPercentage > 0) {
    return `Upgrade to ${upgradePlan.name} and save ${savingsPercentage}% on daily cost (₹${pricePerDay.toFixed(2)}/day vs ₹${currentPricePerDay.toFixed(2)}/day)`;
  } else {
    return `Upgrade to ${upgradePlan.name} for ${additionalDays} additional days of access`;
  }
}
