import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useRole } from "@/hooks/useRole";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function NotificationPreferences() {
  const { role, loading: roleLoading } = useRole();
  const {
    preferences,
    loading,
    updatePreference,
    toggleAll,
    getPreferencesByCategory,
    getCategoryDisplayName,
    getNotificationDisplayName
  } = useNotificationPreferences();

  const categories = getPreferencesByCategory();

  if (loading || roleLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'institute_admin': return 'secondary';
      case 'recruiter': return 'outline';
      default: return 'default';
    }
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'admin': return 'Super Admin';
      case 'institute_admin': return 'Institute Admin';
      case 'recruiter': return 'Recruiter';
      default: return 'User';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Notification Preferences</h1>
              <p className="text-muted-foreground">
                Manage your notification settings and choose what updates you want to receive
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant()}>
              {getRoleDisplayName()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              • {preferences.length} notification types available
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Enable or disable all notifications at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  categories.forEach(category => {
                    toggleAll(category.category, true);
                  });
                }}
                className="flex items-center gap-2"
              >
                <ToggleRight className="h-4 w-4" />
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  categories.forEach(category => {
                    toggleAll(category.category, false);
                  });
                }}
                className="flex items-center gap-2"
              >
                <ToggleLeft className="h-4 w-4" />
                Disable All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Categories */}
        {categories.map((category) => {
          const allEnabled = category.preferences.every(p => p.is_enabled);
          const someEnabled = category.preferences.some(p => p.is_enabled);
          
          return (
            <Card key={category.category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryDisplayName(category.category)}
                      <Badge variant="secondary" className="text-xs">
                        {category.preferences.filter(p => p.is_enabled).length}/{category.preferences.length}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Manage notifications for {getCategoryDisplayName(category.category).toLowerCase()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAll(category.category, !allEnabled)}
                      className="text-xs"
                    >
                      {allEnabled ? 'Disable All' : 'Enable All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.preferences.map((preference, index) => (
                  <div key={preference.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <label 
                          htmlFor={preference.notification_type}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {getNotificationDisplayName(preference.notification_type)}
                        </label>
                      </div>
                      <Switch
                        id={preference.notification_type}
                        checked={preference.is_enabled}
                        onCheckedChange={(checked) => 
                          updatePreference(preference.notification_type, checked)
                        }
                      />
                    </div>
                    {index < category.preferences.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {categories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notification Preferences</h3>
              <p className="text-muted-foreground text-center max-w-md">
                No notification preferences have been set up for your account. 
                Contact your administrator if you believe this is an error.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}