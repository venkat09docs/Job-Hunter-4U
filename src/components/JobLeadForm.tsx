import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { JobPipelineItem } from '@/hooks/useJobHuntingPipeline';

interface JobLeadFormData {
  company_name: string;
  job_title: string;
  pipeline_stage: string;
  priority: string;
  source: string;
  application_date?: string;
  job_url?: string;
  salary_range?: string;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  next_follow_up?: string;
  notes_text?: string;
}

interface JobLeadFormProps {
  onSubmit: (data: Partial<JobPipelineItem>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'leads', label: 'Lead' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offers', label: 'Offer Received' },
  { value: 'closed', label: 'Closed' }
];

const priorityOptions = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' }
];

const sourceOptions = [
  { value: 'direct', label: 'Company Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'referral', label: 'Referral' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'other', label: 'Other' }
];

export const JobLeadForm = ({ onSubmit, onCancel, isLoading = false }: JobLeadFormProps) => {
  const [formData, setFormData] = useState<JobLeadFormData>({
    company_name: '',
    job_title: '',
    pipeline_stage: 'leads',
    priority: 'medium',
    source: 'direct',
    application_date: '',
    job_url: '',
    salary_range: '',
    location: '',
    contact_person: '',
    contact_email: '',
    next_follow_up: '',
    notes_text: ''
  });

  const [applicationDate, setApplicationDate] = useState<Date | undefined>();
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.job_title) {
      return;
    }

    // Create the pipeline item data structure
    const pipelineData: Partial<JobPipelineItem> = {
      company_name: formData.company_name,
      job_title: formData.job_title,
      pipeline_stage: formData.pipeline_stage,
      priority: formData.priority,
      source: formData.source,
      job_url: formData.job_url || null,
      application_date: applicationDate?.toISOString().split('T')[0] || null,
      notes: {
        general: formData.notes_text || '',
        salary_range: formData.salary_range || '',
        location: formData.location || '',
        contact_person: formData.contact_person || '',
        contact_email: formData.contact_email || '',
        next_follow_up: followUpDate?.toISOString().split('T')[0] || null
      }
    };

    onSubmit(pipelineData);
  };

  const updateFormData = (field: keyof JobLeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => updateFormData('company_name', e.target.value)}
            required
            placeholder="e.g., Google, Microsoft"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title *</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => updateFormData('job_title', e.target.value)}
            required
            placeholder="e.g., Software Engineer, Product Manager"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pipeline_stage">Status</Label>
          <Select 
            value={formData.pipeline_stage} 
            onValueChange={(value) => updateFormData('pipeline_stage', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => updateFormData('priority', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select 
            value={formData.source} 
            onValueChange={(value) => updateFormData('source', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Application Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-background"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {applicationDate ? format(applicationDate, "PPP") : "Pick a date (optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border border-border">
              <Calendar
                mode="single"
                selected={applicationDate}
                onSelect={setApplicationDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-2">
        <Label htmlFor="job_url">Job URL</Label>
        <Input
          id="job_url"
          type="url"
          value={formData.job_url}
          onChange={(e) => updateFormData('job_url', e.target.value)}
          placeholder="https://company.com/careers/job-123"
          className="bg-background"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
            placeholder="e.g., San Francisco, CA / Remote"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_range">Salary Range</Label>
          <Input
            id="salary_range"
            value={formData.salary_range}
            onChange={(e) => updateFormData('salary_range', e.target.value)}
            placeholder="e.g., $80k - $120k / ₹12-18 LPA"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => updateFormData('contact_person', e.target.value)}
            placeholder="e.g., John Smith, HR Manager"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => updateFormData('contact_email', e.target.value)}
            placeholder="recruiter@company.com"
            className="bg-background"
          />
        </div>
      </div>

      {/* Follow-up and Notes */}
      <div className="space-y-2">
        <Label>Next Follow-up Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal bg-background"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {followUpDate ? format(followUpDate, "PPP") : "Pick a date (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background border border-border">
            <Calendar
              mode="single"
              selected={followUpDate}
              onSelect={setFollowUpDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes_text">Notes</Label>
        <Textarea
          id="notes_text"
          value={formData.notes_text}
          onChange={(e) => updateFormData('notes_text', e.target.value)}
          rows={3}
          placeholder="Add any notes about this opportunity, interview details, requirements, etc."
          className="bg-background"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.company_name || !formData.job_title || isLoading}>
          {isLoading ? 'Adding...' : 'Add Job Lead'}
        </Button>
      </div>
    </form>
  );
};