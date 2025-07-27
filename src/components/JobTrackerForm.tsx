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

interface JobEntry {
  id?: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  notes?: string;
  job_url?: string;
  salary_range?: string;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  next_follow_up?: string;
  is_archived?: boolean;
}

interface JobTrackerFormProps {
  initialData?: JobEntry;
  onSubmit: (data: Partial<JobEntry>) => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'accepted', label: 'Accepted' }
];

export const JobTrackerForm = ({ initialData, onSubmit, onCancel }: JobTrackerFormProps) => {
  const [formData, setFormData] = useState({
    company_name: initialData?.company_name || '',
    job_title: initialData?.job_title || '',
    status: initialData?.status || 'wishlist',
    application_date: initialData?.application_date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    job_url: initialData?.job_url || '',
    salary_range: initialData?.salary_range || '',
    location: initialData?.location || '',
    contact_person: initialData?.contact_person || '',
    contact_email: initialData?.contact_email || '',
    next_follow_up: initialData?.next_follow_up || ''
  });

  const [applicationDate, setApplicationDate] = useState<Date | undefined>(
    initialData?.application_date ? new Date(initialData.application_date) : new Date()
  );
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    initialData?.next_follow_up ? new Date(initialData.next_follow_up) : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      application_date: applicationDate?.toISOString().split('T')[0] || formData.application_date,
      next_follow_up: followUpDate?.toISOString().split('T')[0] || null
    };

    onSubmit(submitData);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => updateFormData('company_name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="job_title">Job Title *</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => updateFormData('job_title', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
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
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {applicationDate ? format(applicationDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={applicationDate}
                onSelect={setApplicationDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateFormData('location', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary_range">Salary Range</Label>
          <Input
            id="salary_range"
            value={formData.salary_range}
            onChange={(e) => updateFormData('salary_range', e.target.value)}
            placeholder="e.g., $80k - $120k"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => updateFormData('contact_person', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => updateFormData('contact_email', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="job_url">Job URL</Label>
        <Input
          id="job_url"
          type="url"
          value={formData.job_url}
          onChange={(e) => updateFormData('job_url', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Next Follow-up Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {followUpDate ? format(followUpDate, "PPP") : "Pick a date (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={followUpDate}
              onSelect={setFollowUpDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
          rows={3}
          placeholder="Add any notes about this application..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Job' : 'Add Job'}
        </Button>
      </div>
    </form>
  );
};