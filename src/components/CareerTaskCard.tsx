import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Trophy, 
  Upload, 
  Link, 
  Image, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Target,
  Lightbulb
} from 'lucide-react';
import { CareerTaskAssignment, useCareerTasks } from '@/hooks/useCareerTasks';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CareerTaskCardProps {
  assignment: CareerTaskAssignment;
}

export const CareerTaskCard: React.FC<CareerTaskCardProps> = ({ assignment }) => {
  const { updateAssignmentStatus, submitEvidence, uploadEvidenceFile } = useCareerTasks();
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState<string>('');
  const [evidenceData, setEvidenceData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const { template, status, due_date, points_earned } = assignment;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'submitted': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'linkedin_growth': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'networking': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'content_creation': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-50 text-green-600 border-green-200';
      case 'intermediate': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'advanced': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const handleStartTask = async () => {
    await updateAssignmentStatus(assignment.id, 'in_progress');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceType) {
      toast.error('Please select an evidence type');
      return;
    }

    setUploading(true);
    try {
      let fileUrls: string[] = [];
      
      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const url = await uploadEvidenceFile(assignment.id, file);
          fileUrls.push(url);
        }
      }

      // Prepare evidence data based on type
      let finalEvidenceData = { ...evidenceData };
      
      if (evidenceType === 'url' && evidenceData.url) {
        finalEvidenceData = { url: evidenceData.url, description: evidenceData.description || '' };
      } else if (evidenceType === 'text_description' && evidenceData.description) {
        finalEvidenceData = { description: evidenceData.description };
      }

      await submitEvidence(assignment.id, evidenceType as any, finalEvidenceData, fileUrls);
      
      // Reset form
      setShowSubmissionForm(false);
      setEvidenceType('');
      setEvidenceData({});
      setFiles([]);

    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderEvidenceForm = () => {
    return (
      <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="evidence-type">Evidence Type</Label>
          <select
            id="evidence-type"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md bg-background"
          >
            <option value="">Select evidence type...</option>
            {template.evidence_types.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {evidenceType === 'url' && (
          <>
            <div>
              <Label htmlFor="evidence-url">URL</Label>
              <Input
                id="evidence-url"
                type="url"
                placeholder="https://..."
                value={evidenceData.url || ''}
                onChange={(e) => setEvidenceData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="evidence-description">Description (optional)</Label>
              <Textarea
                id="evidence-description"
                placeholder="Describe your submission..."
                value={evidenceData.description || ''}
                onChange={(e) => setEvidenceData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </>
        )}

        {evidenceType === 'text_description' && (
          <div>
            <Label htmlFor="evidence-text">Description</Label>
            <Textarea
              id="evidence-text"
              placeholder="Provide detailed description of your work..."
              value={evidenceData.description || ''}
              onChange={(e) => setEvidenceData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>
        )}

        {(evidenceType === 'screenshot' || evidenceType === 'data_export' || evidenceType === 'email_forward') && (
          <div>
            <Label htmlFor="evidence-files">Upload Files</Label>
            <input
              id="evidence-files"
              type="file"
              multiple
              onChange={handleFileUpload}
              className="w-full mt-1 p-2 border rounded-md bg-background"
              accept={evidenceType === 'screenshot' ? 'image/*' : '*'}
            />
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Selected files:</p>
                <ul className="text-sm">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleSubmitEvidence} 
            disabled={uploading || !evidenceType}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Submit Evidence'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSubmissionForm(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className={getStatusColor(status)}>
              {getStatusIcon(status)}
              <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
            </Badge>
            <Badge variant="outline" className={getCategoryColor(template.category)}>
              {template.category.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Task Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>{template.points_reward} points</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{template.estimated_duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
              {template.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-500" />
            <span className="text-xs">Due {format(new Date(due_date), 'MMM d')}</span>
          </div>
        </div>

        {/* Instructions */}
        {template.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Instructions</span>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              {template.instructions.steps && (
                <div>
                  <p className="font-medium">Steps:</p>
                  <ol className="list-decimal list-inside pl-2 space-y-1">
                    {template.instructions.steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {template.instructions.tips && (
                <div>
                  <p className="font-medium">Tips:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    {template.instructions.tips.map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Status */}
        {assignment.evidence && assignment.evidence.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-sm">Submitted Evidence:</p>
            {assignment.evidence.map((evidence) => (
              <div key={evidence.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  {evidence.evidence_type === 'url' && <Link className="w-4 h-4" />}
                  {evidence.evidence_type === 'screenshot' && <Image className="w-4 h-4" />}
                  {evidence.evidence_type === 'text_description' && <FileText className="w-4 h-4" />}
                  <span className="text-sm capitalize">{evidence.evidence_type.replace('_', ' ')}</span>
                </div>
                <Badge variant="outline" className={getStatusColor(evidence.verification_status)}>
                  {evidence.verification_status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {status === 'assigned' && (
            <Button onClick={handleStartTask} variant="outline" className="flex-1">
              Start Task
            </Button>
          )}
          
          {(status === 'assigned' || status === 'in_progress') && (
            <Button 
              onClick={() => setShowSubmissionForm(true)} 
              className="flex-1"
              disabled={showSubmissionForm}
            >
              Submit Evidence
            </Button>
          )}

          {status === 'verified' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Completed - {points_earned} points earned</span>
            </div>
          )}

          {status === 'rejected' && (
            <Button 
              onClick={() => setShowSubmissionForm(true)} 
              variant="outline" 
              className="flex-1"
            >
              Resubmit Evidence
            </Button>
          )}
        </div>

        {/* Evidence Submission Form */}
        {showSubmissionForm && renderEvidenceForm()}
      </CardContent>
    </Card>
  );
};