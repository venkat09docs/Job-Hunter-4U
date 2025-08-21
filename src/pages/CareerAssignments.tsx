import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Home, Target, Trophy, Clock, FileText, Users, User, Github, 
  Copy, RefreshCw, Settings, Lock, History, Activity, Shield, Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { CareerTaskCard } from '@/components/CareerTaskCard';
import { useUserInputs } from '@/hooks/useUserInputs';

interface SubCategory {
  id: string;
  name: string;
  description: string;
  parent_category: string;
  is_active: boolean;
  created_at: string;
}

const CareerAssignments = () => {
  const { canAccessFeature } = usePremiumFeatures();
  const { user } = useAuth();
  const { inputs, saveInput, getInput } = useUserInputs();
  
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats
  const [totalPoints, setTotalPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSubCategories(),
        fetchAssignments(),
        fetchEvidence(),
        fetchTemplates()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('parent_category', 'profile')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('career_task_assignments')
        .select(`
          *,
          template:career_task_templates(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
      
      // Calculate stats
      const completed = data?.filter(a => a.status === 'completed').length || 0;
      const points = data?.reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0;
      const maxPts = data?.reduce((sum, a) => sum + (a.template?.points_reward || 0), 0) || 0;
      
      setCompletedTasks(completed);
      setTotalPoints(points);
      setMaxPoints(maxPts);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from('career_task_evidence')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('career_task_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('profile-assignments-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_categories',
          filter: `parent_category=eq.profile`
        },
        () => {
          fetchSubCategories();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_templates'
        },
        () => {
          fetchTemplates();
          fetchAssignments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_assignments',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTasksBySubCategory = (subCategoryName: string) => {
    return assignments.filter(assignment => 
      assignment.template?.category === subCategoryName
    );
  };

  const getSubCategoryProgress = (subCategoryName: string) => {
    const tasks = getTasksBySubCategory(subCategoryName);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const submitEvidence = async (assignmentId: string, evidenceData: any) => {
    if (!canAccessFeature("career_assignments")) return;
    
    setSubmittingEvidence(true);
    try {
      const { error } = await supabase
        .from('career_task_evidence')
        .insert({
          assignment_id: assignmentId,
          evidence_type: evidenceData.type || 'url',
          evidence_data: evidenceData,
          verification_status: 'pending'
        });

      if (error) throw error;
      
      // Update assignment status
      await supabase
        .from('career_task_assignments')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      toast.success('Evidence submitted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error submitting evidence:', error);
      toast.error('Failed to submit evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string) => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      const { error } = await supabase
        .from('career_task_assignments')
        .update({ status })
        .eq('id', assignmentId);

      if (error) throw error;
      
      toast.success('Assignment status updated');
      await fetchData();
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Failed to update assignment status');
    }
  };

  const handleInitialize = async () => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      // Call edge function to initialize tasks
      const response = await fetch(`https://moirryvajzyriagqihbe.supabase.co/functions/v1/instantiate-week`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user?.id })
      });

      if (!response.ok) throw new Error('Failed to initialize tasks');
      
      toast.success('Tasks initialized successfully');
      await fetchData();
    } catch (error) {
      console.error('Error initializing tasks:', error);
      toast.error('Failed to initialize tasks');
    }
  };

  const handleVerify = async () => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      // Call edge function to verify all assignments
      const response = await fetch(`https://moirryvajzyriagqihbe.supabase.co/functions/v1/verify-all-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user?.id })
      });

      if (!response.ok) throw new Error('Failed to verify assignments');
      
      toast.success('Assignments verified successfully');
      await fetchData();
    } catch (error) {
      console.error('Error verifying assignments:', error);
      toast.error('Failed to verify assignments');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="mr-4"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Profile Assignments</h1>
              <p className="text-muted-foreground mt-2">Complete tasks to build your professional profile</p>
            </div>
          </div>
        </div>

        {/* Premium Feature Notice */}
        {!canAccessFeature("career_assignments") && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Premium Feature</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Career Assignments is available for premium subscribers. You can view the interface but cannot modify or submit tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Accordion type="multiple" className="space-y-4">
                  {/* Dynamic Sub-Categories */}
                  {subCategories.map((subCategory) => {
                    const categoryTasks = getTasksBySubCategory(subCategory.name);
                    const categoryProgress = getSubCategoryProgress(subCategory.name);
                    
                    return (
                      <AccordionItem key={subCategory.id} value={subCategory.id}>
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-primary" />
                            <span>{subCategory.name} ({categoryTasks.length} tasks)</span>
                            <Progress value={categoryProgress} className="w-24 h-2" />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          {categoryTasks.map(assignment => (
                            <CareerTaskCard
                              key={assignment.id}
                              assignment={assignment}
                              evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                              onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                              onUpdateStatus={canAccessFeature("career_assignments") ? updateAssignmentStatus : () => {}}
                              isSubmitting={submittingEvidence}
                            />
                          ))}
                          {categoryTasks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No {subCategory.name.toLowerCase()} tasks assigned yet</p>
                              <Button 
                                onClick={handleInitialize} 
                                className="mt-3"
                                disabled={!canAccessFeature("career_assignments")}
                              >
                                Initialize Tasks
                                {!canAccessFeature("career_assignments") && <Lock className="w-4 h-4 ml-2" />}
                              </Button>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                  
                  {/* Fallback for when no sub-categories exist */}
                  {subCategories.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Assignment Categories</h3>
                      <p className="mb-4">No sub-categories have been created yet. Contact your administrator to set up assignment categories.</p>
                    </div>
                  )}
                </Accordion>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Weekly Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                      <div className="text-sm text-muted-foreground">points earned</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Tasks Completed</span>
                      <span>{completedTasks}/{assignments.length}</span>
                    </div>
                    <Progress value={assignments.length > 0 ? (completedTasks / assignments.length) * 100 : 0} />
                    
                    <div className="flex justify-between text-sm">
                      <span>Points Progress</span>
                      <span>{totalPoints}/{maxPoints}</span>
                    </div>
                    <Progress value={maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0} />
                  </CardContent>
                </Card>

                {/* Sub-Categories Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subCategories.map((subCategory) => {
                      const progress = getSubCategoryProgress(subCategory.name);
                      const taskCount = getTasksBySubCategory(subCategory.name).length;
                      
                      return (
                        <div key={subCategory.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{subCategory.name}</span>
                            <span>{taskCount} tasks</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                      );
                    })}
                    {subCategories.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No categories available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Inputs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Inputs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">LinkedIn Profile URL</Label>
                      <Input
                        placeholder="https://linkedin.com/in/yourname"
                        value={getInput('linkedin_profile_url')}
                        onChange={(e) => saveInput('linkedin_profile_url', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">GitHub Username</Label>
                      <Input
                        placeholder="yourusername"
                        value={getInput('github_username')}
                        onChange={(e) => saveInput('github_username', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Target Role</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={getInput('resume_target_role')}
                        onChange={(e) => saveInput('resume_target_role', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {evidence.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {evidence.slice(0, 5).map(e => (
                          <div key={e.id} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <div className="flex-1">
                              <p className="font-medium">{e.evidence_type} evidence</p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(e.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                      <p className="text-muted-foreground">
                        Complete some assignments to see your history here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{assignment.template?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.template?.category} • {assignment.status.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{assignment.points_earned || 0} pts</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(assignment.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Automation Setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Forwarding Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Privacy Notice</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          We verify using forwarded emails and files you upload. No scraping. 
                          You can revoke access anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Your Auto-Verify Email:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={`career.verify@yourdomain.com`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('career.verify@yourdomain.com')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Forward LinkedIn notifications to this email for automatic verification
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub Webhook */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">Webhook URL:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value="https://moirryvajzyriagqihbe.supabase.co/functions/v1/github-webhook"
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('https://moirryvajzyriagqihbe.supabase.co/functions/v1/github-webhook')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Webhook Secret:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value="github_webhook_secret_123"
                        readOnly
                        className="font-mono text-sm"
                        type="password"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('github_webhook_secret_123')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. Go to your GitHub repo → Settings → Webhooks</p>
                    <p>2. Add webhook with URL above</p>
                    <p>3. Set content type to application/json</p>
                    <p>4. Add the secret above</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleVerify}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-verify All Tasks
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // This would implement data deletion
                    toast.info('Data deletion functionality coming soon');
                  }}>
                    Delete My Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CareerAssignments;