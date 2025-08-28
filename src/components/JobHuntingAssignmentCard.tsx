import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Trophy, 
  Upload, 
  FileText, 
  Link as LinkIcon, 
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { JobHuntingAssignment, useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { validateEvidenceFiles } from '@/utils/fileValidation';
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { useTranslation } from '@/i18n';

interface JobHuntingAssignmentCardProps {
  assignment: JobHuntingAssignment;
  onUpdateStatus: (assignmentId: string, status: string) => void;
}

export const JobHuntingAssignmentCard: React.FC<JobHuntingAssignmentCardProps> = ({
  assignment,
  onUpdateStatus
}) => {
  const { submitEvidence } = useJobHuntingAssignments();
  const { t } = useTranslation();
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileValidationErrors, setFileValidationErrors] = useState<string[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'submitted': return 'bg-yellow-500';
      case 'started': return 'bg-blue-500';
      case 'in_progress': return 'bg-blue-500'; // Keep for backward compatibility
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500'; // assigned or other statuses
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'started': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />; // Keep for backward compatibility  
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />; // assigned or other statuses
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research': return '🔍';
      case 'apply': return '📝';
      case 'network': return '🤝';
      case 'follow_up': return '📧';
      case 'interview': return '💼';
      default: return '📋';
    }
  };

  const handleStartAssignment = () => {
    onUpdateStatus(assignment.id, 'started');
    toast.success('Assignment started!');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    // For the new combined approach, we'll do basic validation without requiring evidenceType
    const validation = validateEvidenceFiles(Array.from(selectedFiles), 'file');
    
    if (validation.invalid.length > 0) {
      const errors = validation.invalid.map(v => `${v.file.name}: ${v.error}`);
      setFileValidationErrors(errors);
      toast.error('Some files have validation errors');
    } else {
      setFileValidationErrors([]);
    }

    if (validation.valid.length > 0) {
      const dt = new DataTransfer();
      validation.valid.forEach(file => dt.items.add(file));
      setFiles(dt.files);
    }
  };

  const handleSubmitEvidence = async () => {
    // Check if at least one evidence type is provided
    if (!evidenceUrl && !evidenceText && !files) {
      toast.error('Please provide at least one form of evidence (URL, description, or file).');
      return;
    }

    if (fileValidationErrors.length > 0) {
      toast.error(t('fileValidation.fixErrors'));
      return;
    }

    setSubmitting(true);
    try {
      // Create evidence data object with all provided information
      const evidenceData = {
        url: evidenceUrl.trim() || null,
        text: evidenceText.trim() || null,
        notes: `Evidence submitted for: ${assignment.template?.title}`,
        submission_date: new Date().toISOString(),
        evidence_types: []
      };

      // Add evidence types based on what was provided
      if (evidenceUrl.trim()) evidenceData.evidence_types.push('url');
      if (evidenceText.trim()) evidenceData.evidence_types.push('text');
      if (files && files.length > 0) evidenceData.evidence_types.push('file');

      const filesArray = files ? Array.from(files) : undefined;
      
      // Determine primary evidence type for compatibility
      const primaryEvidenceType = evidenceData.evidence_types[0] || 'text';
      
      await retryWithBackoff(async () => {
        await submitEvidence(assignment.id, primaryEvidenceType, evidenceData, filesArray);
      });
      
      toast.success('Evidence submitted successfully!');
      setIsSubmissionOpen(false);
      setEvidenceText('');
      setEvidenceUrl('');
      setFiles(null);
      setFileValidationErrors([]);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(t('messages.submissionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = new Date(assignment.due_date) < new Date() && assignment.status !== 'verified';
  const daysUntilDue = Math.ceil((new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={`transition-all duration-200 ${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCategoryIcon(assignment.template?.category || '')}</span>
            <div>
              <CardTitle className="text-lg">{assignment.template?.title}</CardTitle>
              <CardDescription className="mt-1">
                {assignment.template?.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`${getStatusColor(assignment.status)} text-white`}>
              {getStatusIcon(assignment.status)}
              <span className="ml-1 capitalize">{assignment.status.replace('_', ' ')}</span>
            </Badge>
            {assignment.template && (
              <Badge variant="outline" className={getDifficultyColor(assignment.template.difficulty)}>
                {assignment.template.difficulty}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress and Points */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-muted-foreground">Points:</span>
            <span className="font-semibold">
              {assignment.points_earned || 0}/{assignment.template?.points_reward || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-semibold">{assignment.template?.estimated_duration || 0}min</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-muted-foreground">Due:</span>
            <span className={`font-semibold ${isOverdue ? 'text-red-600' : daysUntilDue <= 1 ? 'text-yellow-600' : 'text-green-600'}`}>
              {daysUntilDue > 0 ? `${daysUntilDue}d` : 'Overdue'}
            </span>
          </div>
        </div>

        {/* Instructions */}
        {assignment.template?.instructions?.steps && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Instructions:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {assignment.template.instructions.steps.map((step: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons - Following LinkedIn/CareerTaskCard Assignment Flow */}
        {assignment.status !== 'verified' && (
          <>
            {/* Start Assignment Button */}
            {assignment.status === 'assigned' && (
              <Button onClick={handleStartAssignment} className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Start Assignment
              </Button>
            )}
            
            {/* Submit Assignment Button */}
            {(assignment.status === 'started' || assignment.status === 'rejected') && (
              <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {assignment.status === 'rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Evidence - {assignment.template?.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Provide evidence of your completed assignment. You can submit any combination of the options below.
                    </div>

                    {/* URL Input - Always Available */}
                    <div className="space-y-2">
                      <Label htmlFor="evidenceUrl" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        URL Evidence (Optional)
                      </Label>
                      <Input
                        id="evidenceUrl"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://example.com/your-proof"
                      />
                      <p className="text-xs text-muted-foreground">
                        Share a link to your completed work or relevant proof
                      </p>
                    </div>

                    {/* File Upload - Always Available */}
                    <div className="space-y-2">
                      <Label htmlFor="files" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        File Attachment (Optional)
                      </Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                        onChange={handleFileChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload screenshots, documents, or other proof files
                      </p>
                      {fileValidationErrors.length > 0 && (
                        <div className="space-y-1">
                          {fileValidationErrors.map((error, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Description - Always Available */}
                    <div className="space-y-2">
                      <Label htmlFor="evidenceText" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="evidenceText"
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder="Describe what you completed, provide additional context, or explain your submission..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide details about your completed task or additional context
                      </p>
                    </div>

                    {/* Accepted Evidence Types Display */}
                    {assignment.template?.evidence_types?.length > 0 && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Accepted Evidence Types:</h5>
                        <div className="flex flex-wrap gap-2">
                          {assignment.template.evidence_types.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type === 'url' && <LinkIcon className="h-3 w-3 mr-1" />}
                              {type === 'screenshot' && <Camera className="h-3 w-3 mr-1" />}
                              {type === 'file' && <FileText className="h-3 w-3 mr-1" />}
                              {type === 'text' && <FileText className="h-3 w-3 mr-1" />}
                              {type === 'email' && <FileText className="h-3 w-3 mr-1" />}
                              <span className="capitalize">{type}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleSubmitEvidence} 
                      disabled={submitting || (!evidenceUrl && !evidenceText && !files)}
                      className="w-full"
                    >
                      {submitting ? 'Submitting...' : 'Submit Evidence'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Under Review State */}
            {assignment.status === 'submitted' && (
              <div className="w-full p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center">
                <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-200">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Under Review</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Your submission is being verified
                </p>
              </div>
            )}
          </>
        )}

        {/* Completed State */}
        {assignment.status === 'verified' && (
          <div className="w-full p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-center">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Assignment Completed</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">
              {assignment.points_earned} points earned
            </p>
          </div>
        )}

        {/* Verification Criteria */}
        {assignment.template?.verification_criteria?.required && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-medium text-sm text-blue-900 mb-2">Required Evidence:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {assignment.template.verification_criteria.required.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};