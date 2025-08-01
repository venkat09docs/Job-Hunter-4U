import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Download, FileText, Trash2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SavedResume {
  id: string;
  title: string;
  word_url?: string;
  pdf_url?: string;
  resume_data: any;
  created_at: string;
  updated_at: string;
}

const ResourcesLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedResumes();
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
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Resources Library</h1>
            <p className="text-muted-foreground">
              Access your saved resumes and career resources
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              Go to Dashboard
            </Button>
            <UserProfileDropdown />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="saved-resumes" className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:w-[400px]">
            <TabsTrigger value="saved-resumes">Saved Resumes</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default ResourcesLibrary;