import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Calendar,
  Shield
} from 'lucide-react';

interface CareerTaskAssignment {
  id: string;
  status: string;
  points_earned: number;
  due_date?: string;
  assigned_at: string;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
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
  const [existingFileInfo, setExistingFileInfo] = useState<string | null>(null);
  const [loadingExistingData, setLoadingExistingData] = useState(false);

  const task = assignment.career_task_templates;

  // Fetch existing evidence when modal opens for started or rejected assignments
  useEffect(() => {
    const fetchExistingEvidence = async () => {
      if (showEvidenceModal && (assignment.status === 'started' || assignment.status === 'rejected')) {
        setLoadingExistingData(true);
        try {
          console.log('🔍 Fetching existing evidence for assignment:', assignment.id);
          
          const { data, error } = await supabase
            .from('career_task_evidence')
            .select('*')
            .eq('assignment_id', assignment.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log('🔍 Raw query result:', { data, error });

          if (error) {
            console.error('🔍 Error fetching existing evidence:', error);
            return;
          }

          if (data) {
            console.log('🔍 Found evidence record:', {
              id: data.id,
              evidence_data: data.evidence_data,
              evidence_type: data.evidence_type,
              url: data.url,
              file_urls: data.file_urls,
              created_at: data.created_at
            });

            // Handle both new format (object) and old format (string)
            let foundData = false;
            
            // First try to parse evidence_data if it's a string
            let evidenceData = data.evidence_data;
            if (typeof evidenceData === 'string') {
              try {
                evidenceData = JSON.parse(evidenceData);
                console.log('🔍 Successfully parsed stringified evidence_data:', evidenceData);
              } catch (e) {
                console.log('🔍 Failed to parse evidence_data as JSON, treating as string:', evidenceData);
                evidenceData = null;
              }
            }
            
            if (evidenceData && typeof evidenceData === 'object' && !Array.isArray(evidenceData)) {
              console.log('🔍 Processing object evidence_data');
              
              if (evidenceData.url && typeof evidenceData.url === 'string') {
                setUrlInput(evidenceData.url);
                console.log('🔍 Set URL from evidence_data.url:', evidenceData.url);
                foundData = true;
              }
              if (evidenceData.description && typeof evidenceData.description === 'string') {
                setTextInput(evidenceData.description);
                console.log('🔍 Set description from evidence_data.description:', evidenceData.description);
                foundData = true;
              } else if (evidenceData.text && typeof evidenceData.text === 'string') {
                setTextInput(evidenceData.text);
                console.log('🔍 Set text from evidence_data.text:', evidenceData.text);
                foundData = true;
              }
              if (evidenceData.file_name && typeof evidenceData.file_name === 'string') {
                setExistingFileInfo(`Previously uploaded: ${evidenceData.file_name}`);
                console.log('🔍 Set file info from evidence_data.file_name:', evidenceData.file_name);
                foundData = true;
              }
            }
            
            // Fallback to individual columns if evidence_data doesn't contain the data
            if (!foundData) {
              console.log('🔍 No data in evidence_data object, checking individual columns');
              
              if (data.url && typeof data.url === 'string') {
                setUrlInput(data.url);
                console.log('🔍 Set URL from url column:', data.url);
                foundData = true;
              }
              
              if (data.file_urls && Array.isArray(data.file_urls) && data.file_urls.length > 0) {
                setExistingFileInfo(`Previously uploaded file: ${data.file_urls[0]}`);
                console.log('🔍 Set file info from file_urls:', data.file_urls);
                foundData = true;
              }
            }
            
            if (!foundData) {
              console.log('🔍 No usable data found in evidence record - legacy corrupted data');
              // Instead of showing error message, provide helpful context
              setTextInput('');
              setUrlInput('');
              setExistingFileInfo('Note: Previous submission had corrupted data. Please re-enter your information.');
            } else {
              console.log('🔍 Form pre-populated successfully');
            }
          } else {
            console.log('🔍 No existing evidence found for assignment:', assignment.id);
          }
        } catch (error) {
          console.error('🔍 Exception fetching existing evidence:', error);
        } finally {
          setLoadingExistingData(false);
        }
      } else if (!showEvidenceModal) {
        // Reset form when modal closes
        console.log('🔍 Modal closed, resetting form');
        setUrlInput('');
        setTextInput('');
        setSelectedFile(null);
        setExistingFileInfo(null);
      }
    };

    fetchExistingEvidence();
  }, [showEvidenceModal, assignment.id, assignment.status]);

  const getStatusColor = () => {
    switch (assignment.status) {
      case 'verified': return 'bg-green-500';
      case 'partially_verified': return 'bg-yellow-500'; 
      case 'submitted': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'started': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (assignment.status) {
      case 'verified': return 'Completed';
      case 'partially_verified': return 'Partially Verified';
      case 'submitted': return 'Under Review';
      case 'rejected': return 'Rejected - Resubmit';
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
    const evidenceData: any = {
      submitted_at: new Date().toISOString(),
      evidence_type: evidenceType.toLowerCase()
    };
    
    // Always include URL if provided
    if (urlInput.trim()) {
      evidenceData.url = urlInput.trim();
    }
    
    // Always include description if provided
    if (textInput.trim()) {
      evidenceData.description = textInput.trim();
      evidenceData.text = textInput.trim(); // Keep both for compatibility
    }
    
    // Include file info if file selected
    if (selectedFile) {
      evidenceData.file_name = selectedFile.name;
      evidenceData.file_size = selectedFile.size;
      evidenceData.file_type = selectedFile.type;
    }

    console.log('🔍 FIXED VERSION - Submitting evidence with data:', evidenceData);
    console.log('🔍 FIXED VERSION - Evidence type:', evidenceType);
    console.log('🔍 FIXED VERSION - Assignment ID:', assignment.id);
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
              {typeof task.instructions === 'string' ? (
                // Handle plain string instructions (from AI-generated content)
                <div className="whitespace-pre-line leading-relaxed">
                  {task.instructions.split('•').filter(step => step.trim()).map((step, index) => (
                    <div key={index} className="mb-2 pl-2 border-l-2 border-primary/20">
                      • {step.trim()}
                    </div>
                  ))}
                </div>
              ) : (
                // Handle object-based instructions (legacy format)
                <>
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
                </>
              )}
            </div>
          </div>
        )}

        {/* Admin Review Section */}
        {(assignment.status === 'verified' || assignment.status === 'rejected') && assignment.verification_notes && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Review:
            </Label>
            <div className={`p-3 rounded-md text-sm border-l-4 ${
              assignment.status === 'verified' 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <div className="font-medium mb-1">
                {assignment.status === 'verified' ? 'Approved' : 'Rejected'}
                {assignment.verified_at && (
                  <span className="text-xs font-normal ml-2">
                    on {new Date(assignment.verified_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line leading-relaxed">
                {assignment.verification_notes}
              </p>
            </div>
          </div>
        )}

        {assignment.status !== 'verified' && (
          <>
            {(assignment.status === 'started' || assignment.status === 'rejected') && (
              <Dialog open={showEvidenceModal} onOpenChange={setShowEvidenceModal}>
                <DialogTrigger asChild>
                  <Button className="w-full" onClick={() => setShowEvidenceModal(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    {assignment.status === 'rejected' ? 'Resubmit Assignment' : 'Submit Assignment'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {loadingExistingData && (
                      <div className="text-sm text-muted-foreground">
                        Loading existing data...
                      </div>
                    )}
                    
                    <div>
                      <Label>URL (if applicable)</Label>
                      <Input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Enter URL if applicable"
                      />
                    </div>
                    
                    <div>
                      <Label>File Upload</Label>
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {existingFileInfo && (
                        <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {existingFileInfo}
                          <br />
                          <span className="text-xs">Select a new file to replace the existing one</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        rows={3}
                        placeholder="Enter description of your work"
                      />
                    </div>

                    <Button onClick={handleSubmitEvidence} disabled={isSubmitting || loadingExistingData}>
                      {isSubmitting ? 'Submitting...' : loadingExistingData ? 'Loading...' : 'Submit'}
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
            
            {assignment.status === 'submitted' && (
              <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Under Review</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Your assignment is being reviewed by an administrator. 
                  You'll be able to make changes once it's approved or rejected.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};