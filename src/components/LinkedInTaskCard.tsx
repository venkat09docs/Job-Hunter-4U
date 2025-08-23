import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Upload, 
  Link2, 
  Camera, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trophy
} from 'lucide-react';
import { LinkedInUserTask, Evidence } from '@/hooks/useLinkedInTasks';
import { format } from 'date-fns';

interface LinkedInTaskCardProps {
  task: LinkedInUserTask;
  evidence: Evidence[];
  onSubmitEvidence: (data: {
    taskId: string;
    kind: 'URL' | 'EMAIL' | 'SCREENSHOT' | 'DATA_EXPORT';
    url?: string;
    file?: File;
  }) => void;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
  isSubmitting?: boolean;
}

export const LinkedInTaskCard: React.FC<LinkedInTaskCardProps> = ({
  task,
  evidence,
  onSubmitEvidence,
  onUpdateStatus,
  isSubmitting = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<string>('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-500';
      case 'PARTIALLY_VERIFIED': return 'bg-yellow-500'; 
      case 'SUBMITTED': return 'bg-blue-500';
      case 'STARTED': return 'bg-orange-500';
      case 'NOT_STARTED': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (task.status) {
      case 'VERIFIED': return 'Completed';
      case 'PARTIALLY_VERIFIED': return 'Partially Verified';
      case 'SUBMITTED': return 'Under Review';
      case 'STARTED': return 'Started';
      case 'NOT_STARTED': return 'Not Yet Started';
      default: return 'Not Yet Started';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return <Clock className="w-4 h-4" />;
      case 'STARTED': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'SUBMITTED': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'PARTIALLY_VERIFIED': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'VERIFIED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'URL_REQUIRED': return <Link2 className="w-4 h-4" />;
      case 'EMAIL_PROOF_OK': return <FileText className="w-4 h-4" />;
      case 'SCREENSHOT_OK': return <Camera className="w-4 h-4" />;
      case 'DATA_EXPORT_OK': return <Upload className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEvidenceTypeLabel = (type: string) => {
    switch (type) {
      case 'URL_REQUIRED': return 'Post/Comment URL';
      case 'EMAIL_PROOF_OK': return 'Email Notification';
      case 'SCREENSHOT_OK': return 'Screenshot';
      case 'DATA_EXPORT_OK': return 'Data Export';
      default: return type;
    }
  };

  const handleStartAssignment = () => {
    onUpdateStatus(task.id, 'STARTED');
  };

  const handleSubmit = () => {
    if (selectedEvidenceType === 'URL_REQUIRED' && url) {
      // Validate LinkedIn URL
      if (!url.includes('linkedin.com')) {
        alert('Please provide a valid LinkedIn URL');
        return;
      }
      onSubmitEvidence({
        taskId: task.id,
        kind: 'URL',
        url
      });
    } else if ((selectedEvidenceType === 'SCREENSHOT_OK' || selectedEvidenceType === 'DATA_EXPORT_OK') && selectedFile) {
      onSubmitEvidence({
        taskId: task.id,
        kind: selectedEvidenceType === 'SCREENSHOT_OK' ? 'SCREENSHOT' : 'DATA_EXPORT',
        file: selectedFile
      });
    }
    
    // Reset form
    setUrl('');
    setSelectedFile(null);
    setSelectedEvidenceType('');
    setIsModalOpen(false);
  };

  const taskEvidence = evidence.filter(e => e.user_task_id === task.id);
  const isCompleted = task.status === 'VERIFIED';
  const hasEvidence = taskEvidence.length > 0;

  return (
    <Card className={`transition-all hover:shadow-lg ${isCompleted ? 'ring-2 ring-green-500/20 bg-green-50/50' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {task.linkedin_tasks.title}
              {getStatusIcon(task.status)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {task.linkedin_tasks.description}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={`${getStatusColor(task.status)} text-white mb-2`}>
              {getStatusLabel()}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{task.score_awarded || task.linkedin_tasks.points_base} pts</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Due Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Due: {format(new Date(task.due_at), 'MMM dd, yyyy h:mm a')}</span>
        </div>

        {/* Evidence Types */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Accepted Evidence:</Label>
          <div className="flex flex-wrap gap-2">
            {task.linkedin_tasks.evidence_types.map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {getEvidenceIcon(type)}
                <span className="ml-1">{getEvidenceTypeLabel(type)}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Submitted Evidence */}
        {hasEvidence && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Submitted Evidence:</Label>
            <div className="space-y-2">
              {taskEvidence.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                  {getEvidenceIcon(ev.kind)}
                  <span>
                    {ev.kind === 'URL' && ev.url && (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        LinkedIn URL
                      </a>
                    )}
                    {ev.kind === 'SCREENSHOT' && 'Screenshot uploaded'}
                    {ev.kind === 'DATA_EXPORT' && 'Data export uploaded'}
                    {ev.kind === 'EMAIL' && 'Email notification'}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {format(new Date(ev.created_at), 'MMM dd, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons - Following Career Assignments Flow */}
        {task.status !== 'VERIFIED' && (
          <>
            {/* Start Assignment Button */}
            {task.status === 'NOT_STARTED' && (
              <Button className="w-full" onClick={handleStartAssignment}>
                <Upload className="w-4 h-4 mr-2" />
                Start Assignment
              </Button>
            )}
            
            {/* Submit/Update Assignment Button */}
            {(task.status === 'STARTED' || task.status === 'SUBMITTED') && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {task.status === 'STARTED' ? 'Submit Assignment' : 'Update Assignment'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{task.linkedin_tasks.title}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* Evidence Type Selection */}
                    <div className="space-y-2">
                      <Label>Select Evidence Type:</Label>
                      <div className="space-y-2">
                        {task.linkedin_tasks.evidence_types.map((type) => (
                          <Button
                            key={type}
                            variant={selectedEvidenceType === type ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setSelectedEvidenceType(type)}
                          >
                            {getEvidenceIcon(type)}
                            <span className="ml-2">{getEvidenceTypeLabel(type)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* URL Input */}
                    {selectedEvidenceType === 'URL_REQUIRED' && (
                      <div className="space-y-2">
                        <Label htmlFor="url">LinkedIn URL:</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://linkedin.com/posts/..."
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste the URL of your LinkedIn post or comment
                        </p>
                      </div>
                    )}

                    {/* File Upload */}
                    {(selectedEvidenceType === 'SCREENSHOT_OK' || selectedEvidenceType === 'DATA_EXPORT_OK') && (
                      <div className="space-y-2">
                        <Label htmlFor="file">
                          {selectedEvidenceType === 'SCREENSHOT_OK' ? 'Screenshot:' : 'Data Export File:'}
                        </Label>
                        <Input
                          id="file"
                          type="file"
                          accept={selectedEvidenceType === 'SCREENSHOT_OK' ? "image/*" : ".csv,.json,.zip,.xlsx"}
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {selectedEvidenceType === 'SCREENSHOT_OK' 
                            ? 'Upload a screenshot as proof of completion'
                            : 'Upload CSV, JSON, ZIP, or Excel file'
                          }
                        </p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      onClick={handleSubmit} 
                      disabled={
                        isSubmitting || 
                        !selectedEvidenceType || 
                        (selectedEvidenceType === 'URL_REQUIRED' && !url) ||
                        ((selectedEvidenceType === 'SCREENSHOT_OK' || selectedEvidenceType === 'DATA_EXPORT_OK') && !selectedFile)
                      }
                      className="w-full"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}

        {/* Bonus Rules */}
        {task.linkedin_tasks.bonus_rules && Object.keys(task.linkedin_tasks.bonus_rules).length > 0 && (
          <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded">
            <div className="font-medium mb-1">💡 Bonus Opportunity:</div>
            {task.linkedin_tasks.code === 'POST_ONCE' && 'Get +5 points for 3+ unique engagements'}
            {task.linkedin_tasks.code === 'COMMENT_3' && 'Get +2 points if someone mentions you'}
            {task.linkedin_tasks.code === 'INVITES_10' && 'Get +5 points for 1+ accepted invites'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};