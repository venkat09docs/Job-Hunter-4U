import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Play, Pause, Calendar, Target, Clock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pricing from "@/components/Pricing";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";

interface AutomationSettings {
  jobTitle: string;
  location: string;
  keywords: string;
  frequency: string;
}

interface AutomationStatus {
  isActive: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  jobMatches: number;
  status: 'running' | 'paused' | 'error' | 'idle';
}

const LinkedInAutomation = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription, refreshProfile, incrementAnalytics } = useProfile();
  const { canAccessFeature, loading: premiumLoading } = usePremiumFeatures();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AutomationSettings>({
    jobTitle: "",
    location: "",
    keywords: "",
    frequency: ""
  });
  
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    isActive: false,
    lastRun: null,
    nextRun: null,
    jobMatches: 0,
    status: 'idle'
  });
  
  const [isActivating, setIsActivating] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const hasValidSubscription = hasActiveSubscription();

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" }
  ];

  const handleInputChange = (field: keyof AutomationSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateNextRun = (frequency: string): Date => {
    const now = new Date();
    if (frequency === "daily") {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  };

  const logAutomationToSupabase = async (settings: AutomationSettings, status: string) => {
    try {
      const { error } = await supabase
        .from('linkedin_automations')
        .insert({
          user_id: user?.id,
          job_title: settings.jobTitle,
          location: settings.location,
          keywords: settings.keywords,
          frequency: settings.frequency,
          status: status,
          activated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging LinkedIn automation:', error);
      }
    } catch (error) {
      console.error('Error logging to Supabase:', error);
    }
  };

  const activateBot = async () => {
    if (!user || !settings.jobTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidSubscription) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to use LinkedIn automation. Please upgrade your plan.",
        variant: "destructive",
      });
      setShowPricing(true);
      return;
    }

    setIsActivating(true);

    try {
      // Call n8n webhook for LinkedIn automation
      const { data, error } = await supabase.functions.invoke('linkedin-automation', {
        body: {
          jobTitle: settings.jobTitle,
          location: settings.location,
          keywords: settings.keywords,
          frequency: settings.frequency,
          userId: user.id
        }
      });

      if (error) throw error;

      const nextRun = calculateNextRun(settings.frequency);
      
      setAutomationStatus({
        isActive: true,
        lastRun: new Date(),
        nextRun: nextRun,
        jobMatches: 0,
        status: 'running'
      });

      // Log automation to Supabase (commented out until table is available)
      // await logAutomationToSupabase(settings, 'activated');

      // Increment analytics only
      await incrementAnalytics('ai_query'); // Using existing analytics type
      await refreshProfile();

      toast({
        title: "LinkedIn Bot Activated!",
        description: "Automation is now running with your active subscription.",
      });

    } catch (error: any) {
      console.error('Error activating LinkedIn bot:', error);
      toast({
        title: "Error activating bot",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const pauseBot = async () => {
    setAutomationStatus(prev => ({
      ...prev,
      isActive: false,
      status: 'paused'
    }));

    // await logAutomationToSupabase(settings, 'paused');

    toast({
      title: "Bot Paused",
      description: "LinkedIn automation has been paused",
    });
  };

  const isActivateDisabled = !settings.jobTitle.trim() || !settings.frequency || !hasValidSubscription || isActivating;

  // Check premium access
  if (!canAccessFeature('linkedin_automation')) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">LinkedIn Automation</h1>
                <p className="text-muted-foreground">
                  Automate your LinkedIn job search with AI-powered matching
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <SubscriptionUpgrade featureName="linkedin_automation">
                <Card className="max-w-md">
                  <CardHeader>
                    <CardTitle>Premium Feature</CardTitle>
                    <CardDescription>
                      LinkedIn Automation is a premium feature. Upgrade your plan to access automated job search capabilities.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Upgrade Now</Button>
                  </CardContent>
                </Card>
              </SubscriptionUpgrade>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LinkedIn Automation</h1>
              <p className="text-muted-foreground">
                Automate your LinkedIn job search with AI-powered matching
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Subscription Active
              </span>
            </div>
          </div>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure your LinkedIn job search automation. Requires active subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Software Engineer"
                    value={settings.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={settings.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., React, TypeScript, Remote"
                    value={settings.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select value={settings.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Access:</span>
                  <Badge variant={hasValidSubscription ? "default" : "destructive"}>
                    {hasValidSubscription ? "Active Subscription" : "Subscription Required"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  {!hasValidSubscription && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPricing(true)}
                    >
                      Upgrade Plan
                    </Button>
                  )}
                  
                  {automationStatus.isActive ? (
                    <Button
                      onClick={pauseBot}
                      variant="outline"
                      className="min-w-32"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={activateBot}
                      disabled={isActivateDisabled}
                      className="min-w-32"
                    >
                      {isActivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isActivating ? "Activating..." : "Activate Bot"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Automation Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {automationStatus.status === 'running' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {automationStatus.status === 'paused' && <Pause className="h-4 w-4 text-yellow-500" />}
                    {automationStatus.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {automationStatus.status === 'idle' && <Bot className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-medium">Status</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {automationStatus.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Last Run</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {automationStatus.lastRun 
                      ? automationStatus.lastRun.toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Next Run</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {automationStatus.nextRun 
                      ? automationStatus.nextRun.toLocaleString()
                      : 'Not scheduled'
                    }
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="font-medium">Recent Activity</h4>
                <div className="text-sm text-muted-foreground">
                  {automationStatus.isActive 
                    ? `Found ${automationStatus.jobMatches} job matches in the last run`
                    : 'No recent activity. Activate the bot to start automation.'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Modal */}
        <Dialog open={showPricing} onOpenChange={setShowPricing}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upgrade Your Plan</DialogTitle>
            </DialogHeader>
            <Pricing />
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LinkedInAutomation;