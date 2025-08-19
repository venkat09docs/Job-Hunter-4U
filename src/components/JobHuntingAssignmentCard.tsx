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
  Calendar
} from 'lucide-react';
import { JobHuntingAssignment, useJobHuntingAssignments } from '@/hooks/useJobHuntingAssignments';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface JobHuntingAssignmentCardProps {
  assignment: JobHuntingAssignment;
}

export const JobHuntingAssignmentCard: React.FC<JobHuntingAssignmentCardProps> = ({
  assignment
}) => {
  const { submitEvidence, updateAssignmentStatus } = useJobHuntingAssignments();
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState<string>('');
  const [evidenceText, setEvidenceText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'submitted': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const handleStartTask = async () => {
    await updateAssignmentStatus(assignment.id, 'in_progress');
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceType || (!evidenceText && !evidenceUrl && !files)) {
      toast.error('Please provide evidence for your submission');
      return;
    }

    setSubmitting(true);
    try {
      const evidenceData = {
        text: evidenceText || null,
        url: evidenceUrl || null,
        notes: `Evidence submitted for: ${assignment.template?.title}`,
        submission_date: new Date().toISOString()
      };

      const filesArray = files ? Array.from(files) : undefined;
      await submitEvidence(assignment.id, evidenceType, evidenceData, filesArray);
      
      setIsSubmissionOpen(false);
      setEvidenceType('');
      setEvidenceText('');
      setEvidenceUrl('');
      setFiles(null);
    } catch (error) {
      console.error('Submission error:', error);
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          {assignment.status === 'assigned' && (
            <Button onClick={handleStartTask} size="sm">
              Start Task
            </Button>
          )}
          
          {(assignment.status === 'in_progress' || assignment.status === 'assigned') && (
            <Dialog open={isSubmissionOpen} onOpenChange={setIsSubmissionOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Evidence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit Evidence</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="evidenceType">Evidence Type</Label>
                    <Select value={evidenceType} onValueChange={setEvidenceType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select evidence type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignment.template?.evidence_types?.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {type === 'url' && <LinkIcon className="h-4 w-4" />}
                              {type === 'screenshot' && <Camera className="h-4 w-4" />}
                              {type === 'file' && <FileText className="h-4 w-4" />}
                              {type === 'text' && <FileText className="h-4 w-4" />}
                              {type === 'email' && <FileText className="h-4 w-4" />}
                              <span className="capitalize">{type}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {evidenceType === 'url' && (
                    <div>
                      <Label htmlFor="evidenceUrl">URL</Label>
                      <Input
                        id="evidenceUrl"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  {(evidenceType === 'text' || evidenceType === 'email') && (
                    <div>
                      <Label htmlFor="evidenceText">Description</Label>
                      <Textarea
                        id="evidenceText"
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder="Provide details about your completed task..."
                        rows={4}
                      />
                    </div>
                  )}

                  {(evidenceType === 'file' || evidenceType === 'screenshot') && (
                    <div>
                      <Label htmlFor="files">Upload Files</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept={evidenceType === 'screenshot' ? 'image/*' : '*'}
                        onChange={(e) => setFiles(e.target.files)}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleSubmitEvidence} 
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit Evidence'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {assignment.status === 'verified' && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed - {assignment.points_earned} points earned
            </Badge>
          )}

          {assignment.status === 'submitted' && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              <AlertCircle className="h-4 w-4 mr-1" />
              Under Review
            </Badge>
          )}
        </div>

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