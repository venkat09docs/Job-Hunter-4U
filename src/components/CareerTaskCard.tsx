import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Trophy, 
  Upload, 
  Link, 
  Camera, 
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface CareerTaskAssignment {
  id: string;
  status: string;
  points_earned: number;
  due_date?: string;
  assigned_at: string;
  career_task_templates: {
    code: string;
    title: string;
    description: string;
    points_reward: number;
    difficulty: string;
    estimated_duration: number;
    evidence_types: string[];
    instructions: any;
    verification_criteria: any;
  };
}

interface CareerTaskCardProps {
  assignment: CareerTaskAssignment;
  evidence: any[];
  onSubmitEvidence: (
    assignmentId: string,
    evidenceType: 'URL' | 'SCREENSHOT' | 'DATA_EXPORT',
    evidenceData: any,
    file?: File
  ) => void;
  onUpdateStatus: (assignmentId: string, newStatus: string) => void;
  isSubmitting: boolean;
}

export const CareerTaskCard: React.FC<CareerTaskCardProps> = ({
  assignment,
  evidence,
  onSubmitEvidence,
  onUpdateStatus,
  isSubmitting
}) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceType, setEvidenceType] = useState<'URL' | 'SCREENSHOT' | 'DATA_EXPORT'>('URL');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const task = assignment.career_task_templates;

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'verified': return 'bg-green-500';
      case 'partially_verified': return 'bg-yellow-500'; 
      case 'submitted': return 'bg-blue-500';
      case 'started': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (assignment.status) {
      case 'verified': return 'Completed';
      case 'partially_verified': return 'Partially Verified';
      case 'submitted': return 'Under Review';
      case 'started': return 'Started';
      case 'assigned': return 'Not Yet Started';
      default: return 'Not Yet Started';
    }
  };

  const handleStartAssignment = () => {
    // Only update status, no modal or other actions
    onUpdateStatus(assignment.id, 'started');
  };

  const handleSubmitEvidence = () => {
    const evidenceData: any = {};
    if (evidenceType === 'URL' && urlInput.trim()) {
      evidenceData.url = urlInput.trim();
    }
    if (textInput.trim()) {
      evidenceData.text = textInput.trim();
    }

    onSubmitEvidence(assignment.id, evidenceType, evidenceData, selectedFile || undefined);
    setUrlInput('');
    setTextInput('');
    setSelectedFile(null);
    setShowEvidenceModal(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <Badge variant="outline" className={`${getStatusColor()} text-white`}>
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{task.points_reward} points</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{task.estimated_duration} min</span>
          </div>
          <Badge variant="secondary">{task.difficulty}</Badge>
        </div>

        {/* Instructions Section */}
        {task.instructions && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Instructions:</Label>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              {task.instructions.steps && (
                <ul className="list-disc list-inside space-y-1">
                  {task.instructions.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              )}
              {task.instructions.ai_tool && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
                  <strong>🤖 AI Tool Required:</strong>{' '}
                  <button
                    onClick={() => {
                      const toolUrls: Record<string, string> = {
                        'Resume Builder - Top 6 Skills': '/dashboard/digital-career-hub?toolId=24b5bb05-e871-4c7a-a7cb-8a7e6c87b3cd',
                        'Resume Builder - Achievements': '/dashboard/digital-career-hub?toolId=20c53c53-70c1-4d50-b0af-655fe09aef7b',
                        'Generate Resume Summary': '/dashboard/digital-career-hub?toolId=55b57cf9-4781-4b80-8e40-eb154420ce49',
                        'Resume Score Tracking': '/dashboard/digital-career-hub?toolId=c0df061d-c6de-400f-a33e-2ea98f425d75'
                      };
                      const url = toolUrls[task.instructions.ai_tool] || '/dashboard/digital-career-hub';
                      window.open(url, '_blank');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors"
                  >
                    {task.instructions.ai_tool}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {assignment.status !== 'verified' && (
          <>
            {(assignment.status === 'started' || assignment.status === 'submitted') && (
              <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => setShowEvidenceModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    {assignment.status === 'started' ? 'Submit Assignment' : 'Update Assignment'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>URL (if applicable)</Label>
                      <Input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>File Upload</Label>
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button onClick={handleSubmitEvidence} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {assignment.status === 'assigned' && (
              <Button className="w-full" onClick={handleStartAssignment}>
                <Upload className="w-4 h-4 mr-2" />
                Start Assignment
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};