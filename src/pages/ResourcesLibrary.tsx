import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useATSHistory } from '@/hooks/useATSHistory';

import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Download, FileText, Trash2, Calendar, Clock, Copy, Mail, ChevronDown, Edit, Save, X, Star, Upload, CheckCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SavedResume {
  id: string;
  title: string;
  word_url?: string;
  pdf_url?: string;
  resume_data: any;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

interface ATSAnalysis {
  score: number;
  analysis: string;
  isAnalyzing?: boolean;
  role?: string;
  jobDescription?: string;
}

interface SavedCoverLetter {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SavedReadmeFile {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ResourcesLibrary = () => {
  console.log('ResourcesLibrary component initializing');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [savedCoverLetters, setSavedCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [savedReadmeFiles, setSavedReadmeFiles] = useState<SavedReadmeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'saved-resumes';
  });
  
  // Edit functionality state
  const [editingCoverLetter, setEditingCoverLetter] = useState<SavedCoverLetter | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingDefault, setUpdatingDefault] = useState<string | null>(null);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  
  // ATS Score verification state
  const [atsDialogOpen, setAtsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedResumeForATS, setSelectedResumeForATS] = useState<SavedResume | null>(null);
  const [atsRole, setAtsRole] = useState('');
  const [atsJobDescription, setAtsJobDescription] = useState('');
  const [atsResults, setAtsResults] = useState<Record<string, ATSAnalysis>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  console.log('State variables declared, historyDialogOpen:', historyDialogOpen);
  
  const { isLoading: isHistoryLoading, history, saveATSResult, fetchATSHistory } = useATSHistory();

  useEffect(() => {
    if (user) {
      fetchSavedResumes();
      fetchSavedCoverLetters();
      fetchSavedReadmeFiles();
    }
  }, [user]);

  const fetchSavedResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_resumes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const resumes = data || [];
      
      // If there's exactly one resume and it's not marked as default, set it as default
      if (resumes.length === 1 && !resumes[0].is_default) {
        try {
          const { error: updateError } = await supabase
            .from('saved_resumes')
            .update({ is_default: true })
            .eq('id', resumes[0].id);

          if (!updateError) {
            resumes[0].is_default = true;
          }
        } catch (updateError) {
          console.error('Error setting single resume as default:', updateError);
        }
      }
      
      setSavedResumes(resumes);
    } catch (error) {
      console.error('Error fetching saved resumes:', error);
      toast({
        title: 'Error loading saved resumes',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCoverLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_cover_letters')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedCoverLetters(data || []);
    } catch (error) {
      console.error('Error fetching saved cover letters:', error);
      toast({
        title: 'Error loading saved cover letters',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const fetchSavedReadmeFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_readme_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedReadmeFiles(data || []);
    } catch (error) {
      console.error('Error fetching saved README files:', error);
      toast({
        title: 'Error loading saved README files',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const setDefaultResume = async (id: string) => {
    setUpdatingDefault(id);
    try {
      // First, set all resumes as non-default
      const { error: resetError } = await supabase
        .from('saved_resumes')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      if (resetError) throw resetError;

      // Then set the selected resume as default
      const { error: setError } = await supabase
        .from('saved_resumes')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;

      // Update local state
      setSavedResumes(prev => 
        prev.map(resume => ({
          ...resume,
          is_default: resume.id === id
        }))
      );

      toast({
        title: 'Default resume updated',
        description: 'This resume will be used for job applications.',
      });
    } catch (error) {
      console.error('Error setting default resume:', error);
      toast({
        title: 'Error updating default resume',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingDefault(null);
    }
  };

  const deleteSavedResume = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state first
      const updatedResumes = savedResumes.filter(resume => resume.id !== id);
      setSavedResumes(updatedResumes);

      // If only one resume remains, automatically set it as default
      if (updatedResumes.length === 1) {
        const remainingResume = updatedResumes[0];
        if (!remainingResume.is_default) {
          try {
            const { error: defaultError } = await supabase
              .from('saved_resumes')
              .update({ is_default: true })
              .eq('id', remainingResume.id);

            if (defaultError) throw defaultError;

            // Update local state to reflect the default status
            setSavedResumes(prev => 
              prev.map(resume => ({
                ...resume,
                is_default: resume.id === remainingResume.id
              }))
            );

            toast({
              title: 'Resume deleted successfully',
              description: 'The remaining resume has been automatically set as default.',
            });
          } catch (defaultError) {
            console.error('Error setting remaining resume as default:', defaultError);
            toast({
              title: 'Resume deleted successfully',
              description: 'The saved resume has been removed from your library.',
            });
          }
        } else {
          toast({
            title: 'Resume deleted successfully',
            description: 'The saved resume has been removed from your library.',
          });
        }
      } else {
        toast({
          title: 'Resume deleted successfully',
          description: 'The saved resume has been removed from your library.',
        });
      }
    } catch (error) {
      console.error('Error deleting saved resume:', error);
      toast({
        title: 'Error deleting resume',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const deleteSavedCoverLetter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_cover_letters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedCoverLetters(prev => prev.filter(coverLetter => coverLetter.id !== id));
      toast({
        title: 'Cover letter deleted successfully',
        description: 'The saved cover letter has been removed from your library.',
      });
    } catch (error) {
      console.error('Error deleting saved cover letter:', error);
      toast({
        title: 'Error deleting cover letter',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (coverLetter: SavedCoverLetter) => {
    setEditingCoverLetter(coverLetter);
    setEditTitle(coverLetter.title);
    setEditContent(coverLetter.content);
    setIsEditDialogOpen(true);
  };

  const updateCoverLetter = async () => {
    if (!editingCoverLetter || !editTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a title for your cover letter.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_cover_letters')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCoverLetter.id);

      if (error) throw error;

      // Update local state
      setSavedCoverLetters(prev => 
        prev.map(cl => 
          cl.id === editingCoverLetter.id 
            ? { ...cl, title: editTitle.trim(), content: editContent.trim() }
            : cl
        )
      );

      setIsEditDialogOpen(false);
      setEditingCoverLetter(null);
      toast({
        title: 'Cover letter updated successfully',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Error updating cover letter:', error);
      toast({
        title: 'Error updating cover letter',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Copied to clipboard',
        description: 'Cover letter content has been copied.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const downloadFile = (url: string, filename: string) => {
    if (url.startsWith('#')) {
      toast({
        title: 'Download not available',
        description: 'This file was not properly generated. Please regenerate your resume.',
        variant: 'destructive'
      });
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCoverLetterTXT = (coverLetter: SavedCoverLetter) => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${coverLetter.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'TXT Download Started',
      description: 'Your cover letter has been downloaded as TXT.',
    });
  };

  const downloadCoverLetterPDF = (coverLetter: SavedCoverLetter) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(coverLetter.title, 20, 25);
    
    // Add content
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    const splitText = doc.splitTextToSize(coverLetter.content, 170);
    doc.text(splitText, 20, 40);
    
    doc.save(`${coverLetter.title}.pdf`);
    
    toast({
      title: 'PDF Download Started',
      description: 'Your cover letter has been downloaded as PDF.',
    });
  };

  const downloadCoverLetterWord = async (coverLetter: SavedCoverLetter) => {
    try {
      console.log('Starting Word document download for:', coverLetter.title);
      
      // Split content into paragraphs to handle line breaks properly
      const contentParagraphs = coverLetter.content.split('\n').filter(para => para.trim() !== '');
      
      const children = [
        new Paragraph({
          children: [
            new TextRun({
              text: coverLetter.title,
              bold: true,
              size: 32,
            }),
          ],
          spacing: {
            after: 400,
          },
        }),
      ];

      // Add each paragraph as a separate Paragraph element
      contentParagraphs.forEach(paragraph => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: 24,
              }),
            ],
            spacing: {
              after: 200,
              line: 276,
            },
          })
        );
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });

      console.log('Document created, generating blob...');
      // Use toBlob instead of toBuffer for browser compatibility
      const blob = await Packer.toBlob(doc);
      console.log('Blob generated successfully');
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `${coverLetter.title.replace(/[^a-z0-9\s]/gi, '_')}.docx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      // Clean up URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('Word document download initiated');
      toast({
        title: 'Word Download Started',
        description: 'Your cover letter has been downloaded as Word document.',
      });
    } catch (error) {
      console.error('Error downloading Word document:', error);
      toast({
        title: 'Download Error',
        description: `Failed to download Word document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const deleteSavedReadmeFile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_readme_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedReadmeFiles(prev => prev.filter(readme => readme.id !== id));
      toast({
        title: 'README file deleted successfully',
        description: 'The saved README file has been removed from your library.',
      });
    } catch (error) {
      console.error('Error deleting saved README file:', error);
      toast({
        title: 'Error deleting README file',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const downloadReadmeFile = (readme: SavedReadmeFile) => {
    const element = document.createElement('a');
    const file = new Blob([readme.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${readme.title.replace(/[^a-z0-9\s]/gi, '_')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: 'README Download Started',
      description: 'Your README file has been downloaded.',
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF or Word document (.pdf, .doc, .docx)',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUploadResume = async () => {
    if (!selectedFile || !uploadTitle.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a file and enter a title',
        variant: 'destructive'
      });
      return;
    }

    // Check limit before upload
    if (savedResumes.length >= 5) {
      toast({
        title: 'Upload limit reached',
        description: 'You have reached the maximum limit of 5 saved resumes. Please delete a resume before uploading a new one.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Save to database
      const resumeData = {
        user_id: user?.id,
        title: uploadTitle.trim(),
        ...(selectedFile.type === 'application/pdf' 
          ? { pdf_url: publicUrl }
          : { word_url: publicUrl }
        ),
        resume_data: {
          uploaded: true,
          originalFileName: selectedFile.name,
          fileSize: selectedFile.size,
          uploadedAt: new Date().toISOString()
        },
        is_default: savedResumes.length === 0 // Set as default if it's the first resume
      };

      const { data, error } = await supabase
        .from('saved_resumes')
        .insert(resumeData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSavedResumes(prev => [data, ...prev]);
      
      // Reset upload state
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDialogOpen(false);

      toast({
        title: 'Resume uploaded successfully',
        description: `Your resume "${uploadTitle}" has been saved to your library.`,
      });

    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload resume. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const openUploadDialog = () => {
    if (savedResumes.length >= 5) {
      toast({
        title: 'Upload limit reached',
        description: 'You have reached the maximum limit of 5 saved resumes. Please delete a resume before uploading a new one.',
        variant: 'destructive'
      });
      return;
    }
    setUploadDialogOpen(true);
  };

  // ATS Score verification functions
  const openATSDialog = (resume: SavedResume) => {
    setSelectedResumeForATS(resume);
    setAtsRole('');
    setAtsJobDescription('');
    setAtsDialogOpen(true);
  };

  const verifyATSScore = async () => {
    if (!selectedResumeForATS || !atsRole.trim() || !atsJobDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter both role and job description.',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Extract resume text from resume_data
      let resumeText = '';
      
      if (selectedResumeForATS.resume_data) {
        const data = selectedResumeForATS.resume_data;
        
        // Build resume text from structured data
        if (data.personalDetails) {
          resumeText += `Name: ${data.personalDetails.fullName || ''}\n`;
          resumeText += `Email: ${data.personalDetails.email || ''}\n`;
          resumeText += `Phone: ${data.personalDetails.phone || ''}\n`;
          resumeText += `Location: ${data.personalDetails.location || ''}\n\n`;
        }

        if (data.professionalSummary) {
          resumeText += `Professional Summary: ${data.professionalSummary}\n\n`;
        }

        if (data.experience && Array.isArray(data.experience)) {
          resumeText += 'Experience:\n';
          data.experience.forEach((exp: any) => {
            resumeText += `- ${exp.role} at ${exp.company} (${exp.duration})\n`;
            resumeText += `  ${exp.description}\n`;
          });
          resumeText += '\n';
        }

        if (data.education && Array.isArray(data.education)) {
          resumeText += 'Education:\n';
          data.education.forEach((edu: any) => {
            resumeText += `- ${edu.degree} from ${edu.institution} (${edu.duration})\n`;
            if (edu.gpa) resumeText += `  GPA: ${edu.gpa}\n`;
          });
          resumeText += '\n';
        }

        if (data.skills_interests) {
          if (data.skills_interests.skills && Array.isArray(data.skills_interests.skills)) {
            resumeText += `Skills: ${data.skills_interests.skills.join(', ')}\n`;
          }
          if (data.skills_interests.interests && Array.isArray(data.skills_interests.interests)) {
            resumeText += `Interests: ${data.skills_interests.interests.join(', ')}\n`;
          }
          resumeText += '\n';
        }

        if (data.certifications_awards && Array.isArray(data.certifications_awards)) {
          resumeText += `Certifications: ${data.certifications_awards.join(', ')}\n\n`;
        }
      }

      // If no structured data, use a fallback message
      if (!resumeText.trim()) {
        resumeText = `Resume: ${selectedResumeForATS.title}\nThis is an uploaded resume file. Please analyze the resume content for ATS compatibility.`;
      }

      console.log('Calling ATS verification with:', { resumeText: resumeText.substring(0, 200) + '...', role: atsRole, jobDescription: atsJobDescription });

      const { data, error } = await supabase.functions.invoke('verify-ats-score', {
        body: {
          resumeText,
          role: atsRole.trim(),
          jobDescription: atsJobDescription.trim()
        }
      });

      if (error) {
        console.error('ATS verification error:', error);
        throw error;
      }

      const analysisResult = data as { analysis: string; score: number };

      // Store the result
      setAtsResults(prev => ({
        ...prev,
        [selectedResumeForATS.id]: {
          score: analysisResult.score,
          analysis: analysisResult.analysis,
          isAnalyzing: false,
          role: atsRole,
          jobDescription: atsJobDescription
        }
      }));

      // Close dialog
      setAtsDialogOpen(false);
      setSelectedResumeForATS(null);
      setAtsRole('');
      setAtsJobDescription('');

      toast({
        title: 'ATS Analysis Complete',
        description: `Your resume scored ${analysisResult.score}/100 for the ${atsRole} role.`,
      });

    } catch (error) {
      console.error('Error verifying ATS score:', error);
      toast({
        title: 'Verification failed',
        description: 'Failed to analyze resume. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveATSResult = async (resumeId: string) => {
    const result = atsResults[resumeId];
    const resume = savedResumes.find(r => r.id === resumeId);
    
    if (!result || !resume) return;
    
    try {
      await saveATSResult(
        resume.title,
        result.role || '',
        result.jobDescription || '',
        result.score,
        result.analysis
      );
    } catch (error) {
      console.error('Error saving ATS result:', error);
    }
  };

  const handleViewHistory = async (resume: SavedResume) => {
    try {
      await fetchATSHistory(resume.title);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getATSScoreColor = (score: number) => {
    return score >= 80 ? 'text-green-600' : 'text-orange-600';
  };

  const getATSScoreBadgeVariant = (score: number) => {
    return score >= 80 ? 'default' : 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading your library...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              Go to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Resources Library</h1>
              <p className="text-muted-foreground">
                Access your saved resumes and career resources
              </p>
            </div>
          </div>
          <UserProfileDropdown />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="saved-resumes">Saved Resumes</TabsTrigger>
            <TabsTrigger value="saved-cover-letters">Saved Cover Letters</TabsTrigger>
            <TabsTrigger value="saved-readme-files">README Files</TabsTrigger>
          </TabsList>

          <TabsContent value="saved-resumes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Your Saved Resumes
                    <Badge variant="secondary">{savedResumes.length}/5</Badge>
                  </CardTitle>
                  <Button 
                    onClick={openUploadDialog}
                    className="flex items-center gap-2"
                    disabled={savedResumes.length >= 5}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Resume
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {savedResumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved resumes yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your existing resume or build a new one using our Resume Builder
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={openUploadDialog} className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Resume
                      </Button>
                      <Button variant="outline" onClick={() => window.location.href = '/dashboard/resume-builder'}>
                        Go to Resume Builder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedResumes.map((resume) => (
                      <Card key={resume.id} className={`border-2 hover:border-primary/50 transition-colors ${resume.is_default ? 'border-primary bg-primary/5' : ''}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-foreground">
                                  {resume.title}
                                </h3>
                                {resume.is_default && (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <Star className="h-3 w-3" />
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Saved: {format(new Date(resume.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{format(new Date(resume.created_at), 'hh:mm a')}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {!resume.is_default && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDefaultResume(resume.id)}
                                    disabled={updatingDefault === resume.id}
                                    className="flex items-center gap-1"
                                  >
                                    <Star className="h-4 w-4" />
                                    {updatingDefault === resume.id ? 'Setting...' : 'Set as Default'}
                                  </Button>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openATSDialog(resume)}
                                    className="flex items-center gap-1"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Verify ATS Score
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewHistory(resume)}
                                    className="flex items-center gap-1"
                                  >
                                    <History className="h-4 w-4" />
                                    View ATS History
                                  </Button>
                                </div>
                                {atsResults[resume.id] && (
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={getATSScoreBadgeVariant(atsResults[resume.id].score)}
                                      className={`${getATSScoreColor(atsResults[resume.id].score)} flex items-center gap-1`}
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      ATS: {atsResults[resume.id].score}/100
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleSaveATSResult(resume.id)}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <Save className="h-3 w-3" />
                                      Save Report
                                    </Button>
                                  </div>
                                )}
                                {resume.pdf_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(resume.pdf_url!, `${resume.title}.pdf`)}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                  </Button>
                                )}
                                {resume.word_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(resume.word_url!, `${resume.title}.docx`)}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download Word
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{resume.title}"? This action cannot be undone.
                                      {resume.is_default && " This is your default resume for job applications."}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSavedResume(resume.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved-cover-letters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Your Saved Cover Letters
                  <Badge variant="secondary">{savedCoverLetters.length}/10</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedCoverLetters.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved cover letters yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your cover letters and save final versions here
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard/resume-builder?tab=cover-letter'}>
                      Go to Cover Letter Builder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedCoverLetters.map((coverLetter) => (
                      <Card key={coverLetter.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground mb-2">
                                {coverLetter.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Saved: {format(new Date(coverLetter.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{format(new Date(coverLetter.created_at), 'hh:mm a')}</span>
                                </div>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                                  {coverLetter.content.length > 300 
                                    ? `${coverLetter.content.substring(0, 300)}...` 
                                    : coverLetter.content}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(coverLetter)}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(coverLetter.content)}
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy Content
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => downloadCoverLetterTXT(coverLetter)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Download as TXT
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadCoverLetterPDF(coverLetter)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Download as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadCoverLetterWord(coverLetter)}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Download as Word
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Cover Letter</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{coverLetter.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSavedCoverLetter(coverLetter.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved-readme-files" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Saved README Files
                  <Badge variant="secondary">{savedReadmeFiles.length}/3</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedReadmeFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved README files yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create README files using the GitHub Profile README Generator and save them here
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard/github-optimization'}>
                      Go to README Generator
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedReadmeFiles.map((readme) => (
                      <Card key={readme.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground mb-2">
                                {readme.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Saved: {format(new Date(readme.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{format(new Date(readme.created_at), 'hh:mm a')}</span>
                                </div>
                              </div>
                              <div className="bg-muted/30 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-mono">
                                  {readme.content.length > 300 
                                    ? `${readme.content.substring(0, 300)}...` 
                                    : readme.content}
                                </pre>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(readme.content)}
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy Content
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadReadmeFile(readme)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="h-4 w-4" />
                                  Download README.md
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete README File</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{readme.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSavedReadmeFile(readme.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ATS Verification Dialog */}
        <Dialog open={atsDialogOpen} onOpenChange={setAtsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Verify ATS Score</DialogTitle>
              <DialogDescription>
                Enter the role and job description to analyze your resume's ATS compatibility.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ats-role">Role/Position</Label>
                <Input
                  id="ats-role"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  value={atsRole}
                  onChange={(e) => setAtsRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ats-job-description">Job Description / Required Skills</Label>
                <Textarea
                  id="ats-job-description"
                  placeholder="Enter the job description or list of required skills for this role"
                  className="min-h-[150px] resize-none"
                  value={atsJobDescription}
                  onChange={(e) => setAtsJobDescription(e.target.value)}
                />
              </div>
              {selectedResumeForATS && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Analyzing Resume:</p>
                  <p className="text-sm text-muted-foreground">{selectedResumeForATS.title}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setAtsDialogOpen(false);
                  setSelectedResumeForATS(null);
                  setAtsRole('');
                  setAtsJobDescription('');
                }}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={verifyATSScore}
                disabled={isAnalyzing || !atsRole.trim() || !atsJobDescription.trim()}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Verify ATS Score
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Upload Resume Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Resume</DialogTitle>
              <DialogDescription>
                Upload your resume in PDF or Word format. Maximum file size: 5MB.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resume-title">Resume Title</Label>
                <Input
                  id="resume-title"
                  placeholder="Enter resume title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="resume-file">Select File</Label>
                <Input
                  id="resume-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                {selectedFile && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <p className="text-sm text-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadResume}
                disabled={!selectedFile || !uploadTitle.trim() || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Cover Letter Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Cover Letter</DialogTitle>
              <DialogDescription>
                Update your cover letter title and content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter cover letter title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Enter your cover letter content"
                  className="min-h-[300px] resize-none"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={updateCoverLetter}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ATS History Dialog */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ATS Score History</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {isHistoryLoading ? (
                <div className="text-center py-8">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No ATS score history found for this resume.
                </div>
              ) : (
                history.map((entry) => (
                  <Card key={entry.id} className="w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{entry.role}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString()} at{' '}
                            {new Date(entry.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge 
                          className={entry.ats_score >= 80 ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}
                        >
                          Score: {entry.ats_score}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Job Description:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {entry.job_description}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Analysis Result:</h4>
                          <div className="bg-muted p-3 rounded text-sm max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">
                              {entry.analysis_result.content}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ResourcesLibrary;