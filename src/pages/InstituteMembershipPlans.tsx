import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Calendar, IndianRupee } from "lucide-react";

const plans = [
  {
    id: "50-members",
    name: "50 Members Pack",
    members: 50,
    price: 112500,
    originalPrice: 125000,
    discount: 250,
    duration: "3 Months",
    popular: false,
    features: [
      "50 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Email Support"
    ]
  },
  {
    id: "100-members",
    name: "100 Members Pack",
    members: 100,
    price: 200000,
    originalPrice: 250000,
    discount: 500,
    duration: "3 Months",
    popular: true,
    features: [
      "100 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Priority Email Support",
      "Bulk User Management"
    ]
  },
  {
    id: "200-members",
    name: "200 Members Pack",
    members: 200,
    price: 350000,
    originalPrice: 500000,
    discount: 750,
    duration: "3 Months",
    popular: false,
    features: [
      "200 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "Priority Email Support",
      "Bulk User Management",
      "Custom Reports"
    ]
  },
  {
    id: "500-members",
    name: "500 Members Pack",
    members: 500,
    price: 750000,
    originalPrice: 1250000,
    discount: 1000,
    duration: "3 Months",
    popular: false,
    features: [
      "500 Student Accounts",
      "3 Months Access",
      "Full Dashboard Access",
      "Progress Tracking",
      "Report Generation",
      "24/7 Phone Support",
      "Bulk User Management",
      "Custom Reports",
      "Dedicated Account Manager"
    ]
  }
];

const InstituteMembershipPlans = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = (planId: string) => {
    // Handle plan selection - this will be implemented later
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Institute Membership Plans
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Choose the perfect plan for your institute. All plans include full access to our digital career hub 
          with significant savings per student.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                Perfect for institutes with {plan.members} students
              </CardDescription>
              
              <div className="mt-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(plan.price).replace('₹', '')}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground line-through">
                  {formatPrice(plan.originalPrice)}
                </div>
                <Badge variant="secondary" className="mt-2">
                  Save ₹{plan.discount} per member
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-muted rounded-lg">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">{plan.members} Members</span>
                <Calendar className="h-4 w-4 text-primary ml-2" />
                <span className="font-semibold">{plan.duration}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan.id)}
              >
                Select Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted p-6 rounded-lg max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Need a Custom Plan?</h3>
          <p className="text-muted-foreground mb-4">
            If you have more than 500 students or need a customized solution, 
            contact our sales team for enterprise pricing.
          </p>
          <Button variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstituteMembershipPlans;