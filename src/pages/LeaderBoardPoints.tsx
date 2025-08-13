import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Trophy, TrendingUp, Github, Briefcase } from 'lucide-react';
import { useActivityPointSettings, ActivityPointSetting } from '@/hooks/useActivityPointSettings';
import { AppSidebar } from '@/components/AppSidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

const LeaderBoardPoints = () => {
  const { settings, loading, updateActivityPoints, toggleActivityStatus, getSettingsByCategory } = useActivityPointSettings();
  const [editingPoints, setEditingPoints] = useState<Record<string, number>>({});

  const handlePointsChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditingPoints(prev => ({ ...prev, [id]: numValue }));
  };

  const handleSavePoints = async (setting: ActivityPointSetting) => {
    const newPoints = editingPoints[setting.id];
    if (newPoints !== undefined && newPoints !== setting.points) {
      try {
        await updateActivityPoints(setting.id, newPoints);
        setEditingPoints(prev => {
          const updated = { ...prev };
          delete updated[setting.id];
          return updated;
        });
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'resume': return <Trophy className="h-5 w-5" />;
      case 'linkedin': return <TrendingUp className="h-5 w-5" />;
      case 'github': return <Github className="h-5 w-5" />;
      case 'job_application': return <Briefcase className="h-5 w-5" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'resume': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'linkedin': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'github': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'job_application': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const renderCategorySection = (category: string, title: string) => {
    const categorySettings = getSettingsByCategory(category);
    
    if (categorySettings.length === 0) return null;

    return (
      <Card key={category}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getCategoryIcon(category)}
            {title}
            <Badge variant="outline" className={getCategoryColor(category)}>
              {categorySettings.length} activities
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{setting.activity_name}</h4>
                    <Badge variant={setting.is_active ? "default" : "secondary"}>
                      {setting.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={editingPoints[setting.id] !== undefined ? editingPoints[setting.id] : setting.points}
                      onChange={(e) => handlePointsChange(setting.id, e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">pts</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSavePoints(setting)}
                    disabled={editingPoints[setting.id] === undefined || editingPoints[setting.id] === setting.points}
                  >
                    Save
                  </Button>
                  <Switch
                    checked={setting.is_active}
                    onCheckedChange={(checked) => toggleActivityStatus(setting.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <h1 className="text-xl font-semibold">Leader Board Points</h1>
              <div className="ml-auto">
                <UserProfileDropdown />
              </div>
            </header>
            <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg" />
                ))}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <h1 className="text-xl font-semibold">Leader Board Points Management</h1>
            <div className="ml-auto">
              <UserProfileDropdown />
            </div>
          </header>
          <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Activity Points Configuration</h2>
              <p className="text-muted-foreground">
                Configure points for different user activities. These points will be used to calculate leaderboard rankings.
              </p>
            </div>

            <div className="space-y-6">
              {renderCategorySection('resume', 'Resume & Profile Building')}
              {renderCategorySection('linkedin', 'LinkedIn Network Growth')}
              {renderCategorySection('github', 'GitHub Activities')}
              {renderCategorySection('job_application', 'Job Application Activities')}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LeaderBoardPoints;