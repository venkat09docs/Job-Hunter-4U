import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Briefcase } from "lucide-react";

export default function DigitalPortfolio() {
  const handleOpenPortfolio = () => {
    window.open("https://app.funnelshubpro.com/", "_blank", "noopener,noreferrer");
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
            <div className="max-w-2xl mx-auto">
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}