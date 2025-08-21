import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Target,
  Trophy,
  Calendar,
  Settings,
  History,
  FileText,
  Users,
  User,
  Github,
  RefreshCw,
  Copy,
  Mail,
  Shield,
  Activity,
  TrendingUp,
  Home,
  Lock
} from 'lucide-react';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useUserInputs } from '@/hooks/useUserInputs';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { CareerTaskCard } from '@/components/CareerTaskCard';
import { toast } from 'sonner';

const CareerAssignments = () => {
  const { canAccessFeature } = usePremiumFeatures();
  const {
    assignments,
    templates,
    evidence,
    loading,
    submittingEvidence,
    initializeUserWeek,
    submitEvidence,
    verifyAssignments,
    getTasksByModule,
    getModuleProgress,
    getTotalPoints,
    getMaxPoints
  } = useCareerAssignments();

  const { inputs, saveInput, getInput } = useUserInputs();

  const handleInitialize = () => {
    initializeUserWeek();
  };

  const handleVerify = () => {
    verifyAssignments();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getOverallProgress = () => {
    const totalTasks = assignments.length;
    if (totalTasks === 0) return 0;
    const completedTasks = assignments.filter(a => a.status === 'VERIFIED').length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const resumeTasks = getTasksByModule('RESUME');
  const linkedinTasks = getTasksByModule('LINKEDIN');
  const digitalProfileTasks = getTasksByModule('DIGITAL_PROFILE');
  const githubTasks = getTasksByModule('GITHUB');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading career assignments...</p>
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
          <div className="flex gap-3">
            <Button 
              onClick={handleVerify} 
              variant="outline"
              disabled={!canAccessFeature("career_assignments")}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verify Tasks
              {!canAccessFeature("career_assignments") && <Lock className="w-4 h-4 ml-2" />}
            </Button>
            <Button 
              onClick={handleInitialize}
              disabled={!canAccessFeature("career_assignments")}
            >
              <Target className="w-4 h-4 mr-2" />
              Initialize Tasks
              {!canAccessFeature("career_assignments") && <Lock className="w-4 h-4 ml-2" />}
            </Button>
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

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Progress</h3>
              <div className="text-sm text-muted-foreground">
                {getTotalPoints()} / {getMaxPoints()} points
              </div>
            </div>
            <Progress value={getOverallProgress()} className="h-3" />
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getModuleProgress('RESUME')}%</div>
                <div className="text-sm text-muted-foreground">Resume</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{getModuleProgress('LINKEDIN')}%</div>
                <div className="text-sm text-muted-foreground">LinkedIn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getModuleProgress('DIGITAL_PROFILE')}%</div>
                <div className="text-sm text-muted-foreground">Digital Profile</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{getModuleProgress('GITHUB')}%</div>
                <div className="text-sm text-muted-foreground">GitHub</div>
              </div>
            </div>
          </CardContent>
        </Card>

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

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <Accordion type="multiple" defaultValue={["resume", "linkedin", "digital-profile", "github"]} className="space-y-4">
                  {/* Resume Section */}
                  <AccordionItem value="resume">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>Resume ({resumeTasks.length} tasks)</span>
                        <Progress value={getModuleProgress('RESUME')} className="w-24 h-2" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {resumeTasks.map(assignment => (
                      <CareerTaskCard
                        key={assignment.id}
                        assignment={{
                          ...assignment,
                          assigned_at: assignment.created_at
                        }}
                        evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                        onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                        isSubmitting={submittingEvidence}
                      />
                      ))}
                      {resumeTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No resume tasks assigned yet</p>
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

                  {/* LinkedIn Section */}
                  <AccordionItem value="linkedin">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>LinkedIn ({linkedinTasks.length} tasks)</span>
                        <Progress value={getModuleProgress('LINKEDIN')} className="w-24 h-2" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {linkedinTasks.map(assignment => (
                        <CareerTaskCard
                          key={assignment.id}
                          assignment={assignment}
                          evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                          onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                          isSubmitting={submittingEvidence}
                        />
                      ))}
                      {linkedinTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No LinkedIn tasks assigned yet</p>
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

                  {/* Digital Profile Section */}
                  <AccordionItem value="digital-profile">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <span>Digital Profile ({digitalProfileTasks.length} tasks)</span>
                        <Progress value={getModuleProgress('DIGITAL_PROFILE')} className="w-24 h-2" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {digitalProfileTasks.map(assignment => (
                        <CareerTaskCard
                          key={assignment.id}
                          assignment={assignment}
                          evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                          onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                          isSubmitting={submittingEvidence}
                        />
                      ))}
                      {digitalProfileTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No digital profile tasks assigned yet</p>
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

                  {/* GitHub Section */}
                  <AccordionItem value="github">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Github className="w-5 h-5 text-green-600" />
                        <span>GitHub ({githubTasks.length} tasks)</span>
                        <Progress value={getModuleProgress('GITHUB')} className="w-24 h-2" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {githubTasks.map(assignment => (
                        <CareerTaskCard
                          key={assignment.id}
                          assignment={assignment}
                          evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                          onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                          isSubmitting={submittingEvidence}
                        />
                      ))}
                      {githubTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Github className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No GitHub tasks assigned yet</p>
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
                      <div className="text-3xl font-bold text-primary">{getTotalPoints()}</div>
                      <div className="text-sm text-muted-foreground">points earned</div>
                    </div>
                    <Progress value={(getTotalPoints() / Math.max(getMaxPoints(), 1)) * 100} className="mt-4" />
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
                              <p className="font-medium">{e.kind.toLowerCase()} evidence</p>
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
                            <p className="font-medium">{assignment.career_task_templates?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.career_task_templates?.module} • {assignment.status.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{assignment.points_earned} pts</p>
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