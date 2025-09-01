import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, CheckCircle2, Circle, Upload, Target, Calendar as CalendarLucide, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  job_url?: string;
  location?: string;
  salary_range?: string;
  contact_person?: string;
  contact_email?: string;
  notes?: string;
  next_follow_up?: string;
}

interface ApplicationRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (updatedJob: Partial<JobEntry>, assignmentDetails: any) => void;
  job: JobEntry;
}

interface RequirementState {
  verified_job_details: boolean;
  added_resume_or_cover_letter: boolean;
  added_application_strategy: boolean;
  set_follow_up_reminder: boolean;
  added_contact_info: boolean;
}

export const ApplicationRequirementsModal: React.FC<ApplicationRequirementsModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  job
}) => {
  const [requirements, setRequirements] = useState<RequirementState>({
    verified_job_details: false,
    added_resume_or_cover_letter: false,
    added_application_strategy: false,
    set_follow_up_reminder: false,
    added_contact_info: false
  });

  const [jobData, setJobData] = useState({
    job_url: job.job_url || '',
    salary_range: job.salary_range || '',
    location: job.location || '',
    contact_person: job.contact_person || '',
    contact_email: job.contact_email || '',
    notes: job.notes || ''
  });

  const [followUpDate, setFollowUpDate] = useState<Date>();
  const [applicationStrategy, setApplicationStrategy] = useState('');

  const requirementsList = [
    {
      key: 'verified_job_details' as keyof RequirementState,
      title: 'Verify Job Details',
      description: 'Add job URL, salary range, and location',
      icon: FileText,
      isCompleted: () => jobData.job_url && jobData.salary_range && jobData.location,
      isRequired: true
    },
    {
      key: 'added_resume_or_cover_letter' as keyof RequirementState,
      title: 'Resume/Cover Letter Ready',
      description: 'Confirm you have prepared your application materials',
      icon: Upload,
      isCompleted: () => requirements.added_resume_or_cover_letter,
      isRequired: true
    },
    {
      key: 'added_application_strategy' as keyof RequirementState,
      title: 'Application Strategy',
      description: 'Add notes about your approach for this application',
      icon: Target,
      isCompleted: () => applicationStrategy.length > 0,
      isRequired: true
    },
    {
      key: 'set_follow_up_reminder' as keyof RequirementState,
      title: 'Follow-up Reminder',
      description: 'Set a date to follow up on this application',
      icon: CalendarLucide,
      isCompleted: () => followUpDate !== undefined,
      isRequired: true
    },
    {
      key: 'added_contact_info' as keyof RequirementState,
      title: 'Contact Information',
      description: 'Add hiring manager or recruiter contact (optional)',
      icon: User,
      isCompleted: () => jobData.contact_person || jobData.contact_email,
      isRequired: false
    }
  ];

  const completedRequirements = requirementsList.filter(req => req.isCompleted()).length;
  const requiredRequirements = requirementsList.filter(req => req.isRequired).length;
  const completedRequiredRequirements = requirementsList.filter(req => req.isRequired && req.isCompleted()).length;
  const progressPercentage = (completedRequirements / requirementsList.length) * 100;
  const canProceed = completedRequiredRequirements === requiredRequirements;

  const handleRequirementChange = (key: keyof RequirementState, checked: boolean) => {
    setRequirements(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleComplete = () => {
    const updatedJob: Partial<JobEntry> = {
      id: job.id,
      job_title: job.job_title,
      company_name: job.company_name,
      job_url: jobData.job_url,
      salary_range: jobData.salary_range,
      location: jobData.location,
      contact_person: jobData.contact_person,
      contact_email: jobData.contact_email,
      notes: applicationStrategy.trim() ? applicationStrategy + (jobData.notes ? '\n\n--- Original Notes ---\n' + jobData.notes : '') : jobData.notes
    };
    
    // Create assignment details structure
    const assignmentDetails = {
      requirements_completed: true,
      application_strategy: applicationStrategy,
      follow_up_date: followUpDate?.toISOString().split('T')[0] || null,
      resume_ready: requirements.added_resume_or_cover_letter,
      contact_added: !!(jobData.contact_person || jobData.contact_email),
      job_details_verified: !!(jobData.job_url && jobData.salary_range && jobData.location),
      completed_date: new Date().toISOString()
    };

    // Add follow-up date to job data if set
    if (followUpDate) {
      updatedJob.next_follow_up = followUpDate.toISOString().split('T')[0];
    }

    onComplete(updatedJob, assignmentDetails);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Complete Application Requirements
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Moving "{job.job_title}" at {job.company_name} to Applied status
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedRequirements}/{requirementsList.length} completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Requirements List */}
          <div className="space-y-4">
            {requirementsList.map((requirement) => {
              const Icon = requirement.icon;
              const isCompleted = requirement.isCompleted();
              
              return (
                <div
                  key={requirement.key}
                  className={cn(
                    "border rounded-lg p-4 space-y-3 transition-colors",
                    isCompleted ? "border-green-200 bg-green-50" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium flex items-center gap-2">
                        {requirement.title}
                        {requirement.isRequired && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{requirement.description}</p>
                    </div>
                  </div>

                  {/* Requirement-specific content */}
                  {requirement.key === 'verified_job_details' && (
                    <div className="ml-8 space-y-3">
                      <div>
                        <Label htmlFor="job_url">Job URL</Label>
                        <Input
                          id="job_url"
                          value={jobData.job_url}
                          onChange={(e) => setJobData(prev => ({ ...prev, job_url: e.target.value }))}
                          placeholder="https://company.com/careers/job-id"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="salary_range">Salary Range</Label>
                          <Input
                            id="salary_range"
                            value={jobData.salary_range}
                            onChange={(e) => setJobData(prev => ({ ...prev, salary_range: e.target.value }))}
                            placeholder="$80,000 - $100,000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={jobData.location}
                            onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="San Francisco, CA"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {requirement.key === 'added_resume_or_cover_letter' && (
                    <div className="ml-8">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="resume_ready"
                          checked={requirements.added_resume_or_cover_letter}
                          onCheckedChange={(checked) => 
                            handleRequirementChange('added_resume_or_cover_letter', !!checked)
                          }
                        />
                        <Label htmlFor="resume_ready">I have my resume and cover letter ready for this application</Label>
                      </div>
                    </div>
                  )}

                  {requirement.key === 'added_application_strategy' && (
                    <div className="ml-8">
                      <Label htmlFor="strategy">Application Strategy & Notes</Label>
                      <Textarea
                        id="strategy"
                        value={applicationStrategy}
                        onChange={(e) => setApplicationStrategy(e.target.value)}
                        placeholder="Why are you interested in this role? What's your approach for this application? Any key points to highlight..."
                        rows={3}
                      />
                    </div>
                  )}

                  {requirement.key === 'set_follow_up_reminder' && (
                    <div className="ml-8">
                      <Label>Follow-up Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !followUpDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {followUpDate ? format(followUpDate, 'PPP') : 'Select follow-up date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={followUpDate}
                            onSelect={setFollowUpDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {requirement.key === 'added_contact_info' && (
                    <div className="ml-8 space-y-3">
                      <div>
                        <Label htmlFor="contact_person">Hiring Manager/Recruiter Name</Label>
                        <Input
                          id="contact_person"
                          value={jobData.contact_person}
                          onChange={(e) => setJobData(prev => ({ ...prev, contact_person: e.target.value }))}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Contact Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={jobData.contact_email}
                          onChange={(e) => setJobData(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="jane.smith@company.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleComplete} 
              className="flex-1"
              disabled={!canProceed}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Application ({completedRequiredRequirements}/{requiredRequirements} required)
            </Button>
          </div>

          {!canProceed && (
            <p className="text-sm text-muted-foreground text-center">
              Complete all required fields to move this job to "Applied" status
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};