import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";

export default function DigitalPortfolio() {
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
            <div className="h-full w-full">
              <iframe
                src="https://app.funnelshubpro.com/"
                className="w-full h-full border border-border rounded-lg"
                style={{ minHeight: 'calc(100vh - 140px)' }}
                title="Digital Portfolio Builder"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}