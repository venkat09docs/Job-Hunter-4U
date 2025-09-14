import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Briefcase, Bot } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import PricingDialog from "@/components/PricingDialog";
import { useState } from "react";

export default function DigitalPortfolio() {
  const { profile } = useProfile();
  const [showPricing, setShowPricing] = useState(false);

  const handleOpenPortfolio = () => {
    // Check if user has at least 6 months subscription (6 Months Plan or 1 Year Plan)
    const hasRequiredSubscription = profile?.subscription_active && 
      (profile?.subscription_plan === '6 Months Plan' || profile?.subscription_plan === '1 Year Plan');
    
    if (hasRequiredSubscription) {
      window.open("https://app.funnelshubpro.com/", "_blank", "noopener,noreferrer");
    } else {
      setShowPricing(true);
    }
  };

  const handleOpenSuperAI = () => {
    // Check if user has at least 6 months subscription (6 Months Plan or 1 Year Plan)
    const hasRequiredSubscription = profile?.subscription_active && 
      (profile?.subscription_plan === '6 Months Plan' || profile?.subscription_plan === '1 Year Plan');
    
    if (hasRequiredSubscription) {
      window.open("https://chatgpt.com/g/g-6748bbe08e948191a4f8ebcb26a77c94-superai-advanced-ai-assistant", "_blank", "noopener,noreferrer");
    } else {
      setShowPricing(true);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Digital Portfolio</h1>
              <div className="ml-auto flex items-center gap-4">
                <SubscriptionUpgrade />
                <UserProfileDropdown />
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Digital Portfolio Section */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Digital Portfolio Builder</CardTitle>
                  <CardDescription>
                    Create and manage your professional digital portfolio with advanced tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div 
                    onClick={handleOpenPortfolio}
                    className="cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <img 
                      src="/lovable-uploads/a310aed4-f8e4-4c88-b1e5-12ba23207190.png" 
                      alt="Digital Portfolio Builder Preview"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-muted-foreground">
                    Click the image above to open the Digital Portfolio application in a new window for the best experience.
                  </p>
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      For optimal performance and full functionality, the Digital Portfolio application opens in a new browser window.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Super AI Section */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Bot className="h-6 w-6" />
                    Super AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Access the powerful Super AI application with advanced AI capabilities for career assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div 
                    onClick={handleOpenSuperAI}
                    className="cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <img 
                      src="/lovable-uploads/d005493a-f4e8-4ac1-88fe-b291c81f9652.png" 
                      alt="Super AI Application Preview"
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-muted-foreground">
                    Click the image above to open the Super AI application in a new window for advanced AI assistance.
                  </p>
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Experience cutting-edge AI technology designed specifically for career development and professional growth.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      
      {showPricing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Subscription Required</h2>
              <p className="text-muted-foreground">
                Access to Digital Portfolio and Super AI requires either a 6 Months Plan or 1 Year Plan subscription. Please upgrade your plan to continue.
              </p>
            </div>
            <PricingDialog eligiblePlans={["6 Months Plan", "1 Year Plan"]} />
            <button
              onClick={() => setShowPricing(false)}
              className="mt-4 px-4 py-2 bg-muted rounded-md hover:bg-muted/80 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}