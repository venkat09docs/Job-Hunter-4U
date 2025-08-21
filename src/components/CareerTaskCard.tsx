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
  isSubmitting: boolean;
}

export const CareerTaskCard: React.FC<CareerTaskCardProps> = ({
  assignment,
  evidence,
  onSubmitEvidence,
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
      case 'VERIFIED': return 'bg-green-500';
      case 'PARTIALLY_VERIFIED': return 'bg-yellow-500'; 
      case 'SUBMITTED': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
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
            {assignment.status}
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
                  <strong>🤖 AI Tool Required:</strong> {task.instructions.ai_tool}
                </div>
              )}
            </div>
          </div>
        )}

        {assignment.status !== 'VERIFIED' && (
          <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Start Assignment
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
      </CardContent>
    </Card>
  );
};