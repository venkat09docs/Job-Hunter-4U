import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNotificationManagement } from '@/hooks/useNotificationManagement';
import { Mail, Bell, Eye } from 'lucide-react';

interface NotificationTemplate {
  id?: string;
  template_key: string;
  title_template: string;
  message_template: string;
  email_subject_template?: string;
  email_body_template?: string;
  category: string;
  is_active: boolean;
}

interface NotificationTemplateEditorProps {
  template?: NotificationTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function NotificationTemplateEditor({ 
  template, 
  open, 
  onOpenChange, 
  onSave 
}: NotificationTemplateEditorProps) {
  const { createTemplate, updateTemplate } = useNotificationManagement();
  const [formData, setFormData] = useState<NotificationTemplate>({
    template_key: '',
    title_template: '',
    message_template: '',
    email_subject_template: '',
    email_body_template: '',
    category: 'general',
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        template_key: '',
        title_template: '',
        message_template: '',
        email_subject_template: '',
        email_body_template: '',
        category: 'general',
        is_active: true
      });
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!formData.template_key || !formData.title_template || !formData.message_template) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (template?.id) {
        result = await updateTemplate(template.id, formData);
      } else {
        result = await createTemplate(formData);
      }

      if (result.success) {
        toast.success(`Template ${template?.id ? 'updated' : 'created'} successfully`);
        onSave();
        onOpenChange(false);
      } else {
        toast.error(`Failed to ${template?.id ? 'update' : 'create'} template`);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.category === 'email' ? (
              <Mail className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {template ? 'Edit' : 'Create'} Notification Template
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="in_app">In-App</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template Key</Label>
                    <Input
                      placeholder="unique_template_key"
                      value={formData.template_key}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        template_key: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title Template</Label>
                  <Input
                    placeholder="Notification title template"
                    value={formData.title_template}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      title_template: e.target.value 
                    }))}
                  />
                </div>

                {formData.category === 'email' && (
                  <div className="space-y-2">
                    <Label>Email Subject Template</Label>
                    <Input
                      placeholder="Email subject template"
                      value={formData.email_subject_template || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        email_subject_template: e.target.value 
                      }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Message Template</Label>
                  <Textarea
                    placeholder="Enter your message template here. Use {{variable_name}} for dynamic content."
                    value={formData.message_template}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      message_template: e.target.value 
                    }))}
                    rows={8}
                    className="font-mono"
                  />
                </div>

                {formData.category === 'email' && (
                  <div className="space-y-2">
                    <Label>Email Body Template</Label>
                    <Textarea
                      placeholder="Enter your email body template here. Use {{variable_name}} for dynamic content."
                      value={formData.email_body_template || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        email_body_template: e.target.value 
                      }))}
                      rows={10}
                      className="font-mono"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="mb-2 font-semibold border-b pb-2">
                    Title: {formData.title_template || 'No title yet...'}
                  </div>
                  {formData.category === 'email' && formData.email_subject_template && (
                    <div className="mb-2 font-semibold border-b pb-2">
                      Subject: {formData.email_subject_template}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    <strong>Message:</strong><br />
                    {formData.message_template || 'No message yet...'}
                  </div>
                  {formData.category === 'email' && formData.email_body_template && (
                    <div className="whitespace-pre-wrap text-sm mt-4">
                      <strong>Email Body:</strong><br />
                      {formData.email_body_template}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}