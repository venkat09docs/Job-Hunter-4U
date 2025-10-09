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
import { FileText } from 'lucide-react';
import { ResumeTemplatePreview } from '@/components/ResumeTemplatePreview';

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

      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Choose Your Resume Template</DialogTitle>
          <DialogDescription>
            Select a professional template that best suits your career level and industry
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
          {templates.map((template) => (
            <ResumeTemplatePreview
              key={template.id}
              template={template.id}
              selected={selectedTemplate === template.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
