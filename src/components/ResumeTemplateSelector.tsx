import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle } from 'lucide-react';

interface ResumeTemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

export const ResumeTemplateSelector = ({ selectedTemplate, onSelectTemplate }: ResumeTemplateSelectorProps) => {
  const [open, setOpen] = useState(false);

  const templates = [
    {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Traditional layout perfect for corporate roles',
    },
    {
      id: 'modern',
      name: 'Modern Minimal',
      description: 'Clean design for tech and creative industries',
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Professional layout for senior positions',
    },
    {
      id: 'ats',
      name: 'ATS-Optimized',
      description: 'Designed to pass applicant tracking systems',
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Stand out in design and creative fields',
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Ideal for developers and engineers',
    },
  ];

  const handleSelect = (templateId: string) => {
    onSelectTemplate(templateId);
    setOpen(false);
  };

  const selectedTemplateName = templates.find(t => t.id === selectedTemplate)?.name || 'No template selected';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div className="flex-1">
          <div className="text-sm font-medium">Selected Template</div>
          <div className="text-lg font-semibold text-primary">{selectedTemplateName}</div>
        </div>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Choose Template
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Resume Template</DialogTitle>
          <DialogDescription>
            Select a professional template that best suits your career level and industry
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate === template.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:ring-1 hover:ring-primary/50'
              }`}
              onClick={() => handleSelect(template.id)}
            >
              <CardContent className="p-4">
                <div className="aspect-[8.5/11] bg-muted rounded mb-3 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
