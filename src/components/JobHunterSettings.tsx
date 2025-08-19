import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Mail, Shield, Trash2, Copy, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const JobHunterSettings: React.FC = () => {
  const { user } = useAuth();
  const [emailAutoVerify, setEmailAutoVerify] = useState(false);
  const [userToken, setUserToken] = useState('abc123def456'); // Mock token - will be generated
  
  // Email forwarding address based on user
  const forwardingAddress = `inbox@myapp.com?u=${userToken}`;

  const handleCopyForwardingAddress = () => {
    navigator.clipboard.writeText(forwardingAddress);
    toast.success('Forwarding address copied to clipboard!');
  };

  const handleGenerateNewToken = () => {
    const newToken = Math.random().toString(36).substring(2, 15);
    setUserToken(newToken);
    toast.success('New token generated! Please update your email forwarding rules.');
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive a download link via email.');
  };

  const handleDeleteAllData = () => {
    // This would require confirmation dialog in real implementation
    toast.error('Data deletion requires additional confirmation for security.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Job Hunter Settings</h2>
        <p className="text-muted-foreground text-sm">
          Configure email auto-verification, manage your data, and control privacy settings
        </p>
      </div>

      {/* Email Auto-Verification Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Auto-Verification Setup
          </CardTitle>
          <CardDescription>
            Automatically verify job applications, interviews, and responses by forwarding emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-auto-verify" className="font-medium">Enable Email Auto-Verification</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect and verify job hunting activities from your emails
              </p>
            </div>
            <Switch 
              id="email-auto-verify"
              checked={emailAutoVerify} 
              onCheckedChange={setEmailAutoVerify}
            />
          </div>

          {emailAutoVerify && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label className="font-medium">Your Unique Forwarding Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={forwardingAddress}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyForwardingAddress}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateNewToken}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Forward job-related emails to this address for automatic verification
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Setup Instructions</h4>
                
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <Badge variant="outline" className="mb-2">Gmail Setup</Badge>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Go to Gmail Settings → Forwarding and POP/IMAP</li>
                      <li>Click "Add a forwarding address" and enter: <code className="bg-muted px-1 rounded">{forwardingAddress}</code></li>
                      <li>Create filters to forward job-related emails (from companies you're applying to)</li>
                      <li>Test by forwarding a job application confirmation email</li>
                    </ol>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <Badge variant="outline" className="mb-2">Outlook Setup</Badge>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Go to Outlook Settings → Mail → Forwarding</li>
                      <li>Enable forwarding to: <code className="bg-muted px-1 rounded">{forwardingAddress}</code></li>
                      <li>Set up rules to forward emails containing job-related keywords</li>
                      <li>Test the setup with a sample email</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">What emails to forward:</p>
                    <ul className="text-blue-800 mt-1 space-y-0.5">
                      <li>• Job application confirmations</li>
                      <li>• Interview invitations</li>
                      <li>• Rejection notifications</li>
                      <li>• Offer letters</li>
                      <li>• Follow-up responses from recruiters</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Data Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Data Controls
          </CardTitle>
          <CardDescription>
            Manage your data retention, exports, and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Data Retention Period</Label>
                <p className="text-sm text-muted-foreground">
                  How long to keep your job hunting data and evidence
                </p>
              </div>
              <select className="border rounded px-3 py-1 text-sm">
                <option value="1-year">1 Year</option>
                <option value="2-years">2 Years</option>
                <option value="indefinite">Indefinite</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Share Analytics Data</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the platform with anonymized usage data
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Email Processing Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when emails are processed and verified
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Data Management</h4>
            
            <div className="grid gap-3">
              <Button variant="outline" onClick={handleExportData} className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Export All My Data
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDeleteAllData}
                className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All My Data
              </Button>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Data Processing Policy</p>
                <p className="text-amber-800 mt-1">
                  Your forwarded emails are processed to extract job hunting signals (applications, interviews, etc.). 
                  Email content is not stored permanently - only the extracted metadata and verification status.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose what job hunting notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Weekly Task Reminders', description: 'Get reminded about upcoming weekly quotas' },
              { label: 'Evidence Verification Results', description: 'Know when your submitted evidence is verified' },
              { label: 'Streak Achievements', description: 'Celebrate when you hit new streak milestones' },
              { label: 'Pipeline Updates', description: 'Get notified about changes in your job pipeline' },
              { label: 'Weekly Progress Reports', description: 'Receive weekly summaries of your job hunting activity' }
            ].map((pref, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">{pref.label}</Label>
                  <p className="text-sm text-muted-foreground">{pref.description}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};