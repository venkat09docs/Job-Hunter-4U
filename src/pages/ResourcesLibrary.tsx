import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Download, FileText, Trash2, Calendar, Clock, Copy, Mail, ChevronDown, Edit, Save, X } from 'lucide-react';
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
}

interface SavedCoverLetter {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ResourcesLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [savedCoverLetters, setSavedCoverLetters] = useState<SavedCoverLetter[]>([]);
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

  useEffect(() => {
    if (user) {
      fetchSavedResumes();
      fetchSavedCoverLetters();
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
      setSavedResumes(data || []);
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

  const deleteSavedResume = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedResumes(prev => prev.filter(resume => resume.id !== id));
      toast({
        title: 'Resume deleted successfully',
        description: 'The saved resume has been removed from your library.',
      });
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
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="saved-resumes">Saved Resumes</TabsTrigger>
            <TabsTrigger value="saved-cover-letters">Saved Cover Letters</TabsTrigger>
          </TabsList>

          <TabsContent value="saved-resumes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Saved Resumes
                  <Badge variant="secondary">{savedResumes.length}/5</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedResumes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No saved resumes yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your resume and save final versions here
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard/resume-builder'}>
                      Go to Resume Builder
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedResumes.map((resume) => (
                      <Card key={resume.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-foreground mb-2">
                                {resume.title}
                              </h3>
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
                              <div className="flex gap-2">
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSavedResume(resume.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        </Tabs>
        
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
      </div>
    </div>
  );
};

export default ResourcesLibrary;