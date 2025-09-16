import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from './RichTextEditor';
import { VideoEmbedComponent } from './VideoEmbedComponent';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useRole } from '@/hooks/useRole';
import { Plus, Edit3, Trash2, FileText, Video, File, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  chapters?: Chapter[];
}

interface Chapter {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'document';
  content_data: any;
  video_url?: string;
  article_content?: string;
  duration_minutes?: number;
  order_index: number;
  is_active: boolean;
}

export const CourseContentDialog: React.FC<CourseContentDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle
}) => {
  console.log('🚀 CourseContentDialog: Component rendering', {
    open,
    courseId,
    courseTitle,
    timestamp: new Date().toISOString()
  });
  
  const { isAdmin, role: userRole } = useRole();
  const { toast } = useToast();
  const {
    loading,
    createSection,
    getSectionsByCourse,
    updateSection,
    deleteSection,
    createChapter,
    getChaptersBySection,
    updateChapter,
    deleteChapter
  } = useCourseContent();

  const [sections, setSections] = useState<Section[]>([]);
  const [activeTab, setActiveTab] = useState('sections');
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Section form state
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');

  // Chapter form state
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [chapterType, setChapterType] = useState<'video' | 'article' | 'document'>('article');
  const [chapterVideoUrl, setChapterVideoUrl] = useState('');
  const [chapterArticleContent, setChapterArticleContent] = useState('');
  const [chapterDuration, setChapterDuration] = useState<number>(0);

  // Storage keys for persistence
  const STORAGE_KEY = `course-content-form-${courseId}`;

  // Save form state to localStorage immediately
  const saveFormState = useCallback(() => {
    if (!courseId) return;
    
    try {
      const formState = {
        activeTab,
        showSectionForm,
        showChapterForm,
        selectedSectionId,
        sectionTitle,
        sectionDescription,
        chapterTitle,
        chapterDescription,
        chapterType,
        chapterVideoUrl,
        chapterArticleContent,
        chapterDuration,
        editingSection: editingSection?.id || null,
        editingChapter: editingChapter?.id || null,
        timestamp: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
      console.log('📝 Form state SAVED to localStorage:', {
        key: STORAGE_KEY,
        sectionTitle,
        chapterTitle,
        chapterDescription,
        activeTab,
        timestamp: new Date(formState.timestamp).toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Error saving form state:', error);
    }
  }, [
    STORAGE_KEY, courseId, activeTab, showSectionForm, showChapterForm, selectedSectionId,
    sectionTitle, sectionDescription, chapterTitle, chapterDescription,
    chapterType, chapterVideoUrl, chapterArticleContent, chapterDuration,
    editingSection?.id, editingChapter?.id  // Use IDs only to prevent object reference changes
  ]);

  // Load form state from localStorage
  const loadFormState = useCallback(() => {
    if (!courseId) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('🔍 Loading form state from localStorage:', {
        key: STORAGE_KEY,
        found: !!saved,
        data: saved ? 'Data exists' : 'No data'
      });
      
      if (saved) {
        const formState = JSON.parse(saved);
        
        // Check if the saved state is recent (within 24 hours)
        const isRecent = formState.timestamp && (Date.now() - formState.timestamp) < 24 * 60 * 60 * 1000;
        
        if (isRecent) {
          console.log('✅ Restoring form state:', {
            sectionTitle: formState.sectionTitle,
            chapterTitle: formState.chapterTitle,
            chapterDescription: formState.chapterDescription,
            activeTab: formState.activeTab,
            savedAt: new Date(formState.timestamp).toLocaleTimeString()
          });
          
          setActiveTab(formState.activeTab || 'sections');
          setShowSectionForm(formState.showSectionForm || false);
          setShowChapterForm(formState.showChapterForm || false);
          setSelectedSectionId(formState.selectedSectionId || '');
          setSectionTitle(formState.sectionTitle || '');
          setSectionDescription(formState.sectionDescription || '');
          setChapterTitle(formState.chapterTitle || '');
          setChapterDescription(formState.chapterDescription || '');
          setChapterType(formState.chapterType || 'article');
          setChapterVideoUrl(formState.chapterVideoUrl || '');
          setChapterArticleContent(formState.chapterArticleContent || '');
          setChapterDuration(formState.chapterDuration || 0);
        } else {
          console.log('⏰ Saved state is too old, clearing:', {
            savedAt: formState.timestamp ? new Date(formState.timestamp).toLocaleTimeString() : 'Unknown',
            hoursAgo: formState.timestamp ? Math.round((Date.now() - formState.timestamp) / (1000 * 60 * 60)) : 'Unknown'
          });
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log('ℹ️ No saved form state found for key:', STORAGE_KEY);
      }
    } catch (error) {
      console.error('❌ Error loading form state:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY, courseId]);

  // Clear form state from localStorage
  const clearFormState = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Form state cleared from localStorage');
    } catch (error) {
      console.error('Error clearing form state:', error);
    }
  }, [STORAGE_KEY]);

  // Detect component mount/unmount cycles
  useEffect(() => {
    console.log('🎬 CourseContentDialog: Component MOUNTED');
    
    return () => {
      console.log('💀 CourseContentDialog: Component UNMOUNTING - This indicates a page reload!');
    };
  }, []);
  
  // Track state changes to detect resets
  useEffect(() => {
    console.log('📝 CourseContentDialog: Form state changed:', {
      sectionTitle: sectionTitle || 'empty',
      chapterTitle: chapterTitle || 'empty',
      chapterDescription: chapterDescription || 'empty',
      activeTab,
      hasFormData: !!(sectionTitle || chapterTitle || chapterDescription)
    });
  }, [sectionTitle, chapterTitle, chapterDescription, activeTab]);
  
  const loadSections = async () => {
    const sectionsData = await getSectionsByCourse(courseId);
    const sectionsWithChapters = await Promise.all(
      sectionsData.map(async (section) => {
        const chapters = await getChaptersBySection(section.id);
        return { ...section, chapters };
      })
    );
    setSections(sectionsWithChapters);
  };

  useEffect(() => {
    console.log('🚀 CourseContentDialog opened:', { open, courseId, isAdmin });
    if (open && courseId && isAdmin) {
      console.log('📂 Loading form state and sections...');
      loadFormState();
      loadSections();
    }
    
    // Removed problematic event listeners that were causing page reloads
  }, [open, courseId, isAdmin, loadFormState]);

  // Simple cleanup to save state when component unmounts
  useEffect(() => {
    return () => {
      if (courseId) {
        console.log('💾 Component unmounting, saving state...');
        // Save state synchronously during cleanup
        try {
          const formState = {
            activeTab,
            showSectionForm,
            showChapterForm,
            selectedSectionId,
            sectionTitle,
            sectionDescription,
            chapterTitle,
            chapterDescription,
            chapterType,
            chapterVideoUrl,
            chapterArticleContent,
            chapterDuration,
            editingSection: editingSection?.id || null,
            editingChapter: editingChapter?.id || null,
            timestamp: Date.now()
          };
          localStorage.setItem(`course-content-form-${courseId}`, JSON.stringify(formState));
        } catch (error) {
          console.error('Error saving state during cleanup:', error);
        }
      }
    };
  }, []); // Empty dependency array - this only runs on unmount

  // Save form state whenever form fields change (immediate save on typing)
  useEffect(() => {
    if (open && courseId) {
      const timeoutId = setTimeout(() => {
        saveFormState();
      }, 300); // Debounce saves by 300ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    open, courseId, activeTab, showSectionForm, showChapterForm,
    selectedSectionId, sectionTitle, sectionDescription, chapterTitle,
    chapterDescription, chapterType, chapterVideoUrl, chapterArticleContent,
    chapterDuration
  ]); // Removed saveFormState, editingSection, editingChapter to prevent circular deps

  // Restore editing states after sections load
  useEffect(() => {
    if (sections.length > 0) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const formState = JSON.parse(saved);
          if (formState.editingSection) {
            const section = sections.find(s => s.id === formState.editingSection);
            if (section) {
              setEditingSection(section);
            }
          }
          if (formState.editingChapter) {
            // Find chapter across all sections
            for (const section of sections) {
              const chapter = section.chapters?.find(c => c.id === formState.editingChapter);
              if (chapter) {
                setEditingChapter(chapter);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error restoring editing states:', error);
      }
    }
  }, [sections, STORAGE_KEY]);

  const handleSaveSection = async () => {
    if (!sectionTitle.trim()) {
      toast({
        title: "Error",
        description: "Section title is required",
        variant: "destructive"
      });
      return;
    }

    if (editingSection) {
      await updateSection(editingSection.id, {
        title: sectionTitle,
        description: sectionDescription
      });
    } else {
      await createSection({
        course_id: courseId,
        title: sectionTitle,
        description: sectionDescription,
        order_index: sections.length
      });
    }

    resetSectionForm();
    loadSections();
    toast({
      title: "Success",
      description: `Section ${editingSection ? 'updated' : 'created'} successfully`
    });
    // Clear form state after successful operation
    clearFormState();
  };

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim() || !selectedSectionId) {
      toast({
        title: "Error",
        description: "Chapter title and section are required",
        variant: "destructive"
      });
      return;
    }

    const chapterData = {
      section_id: selectedSectionId,
      title: chapterTitle,
      description: chapterDescription,
      content_type: chapterType,
      content_data: {},
      video_url: chapterType === 'video' ? chapterVideoUrl : undefined,
      article_content: chapterType === 'article' ? chapterArticleContent : undefined,
      duration_minutes: chapterDuration > 0 ? chapterDuration : undefined,
      order_index: sections.find(s => s.id === selectedSectionId)?.chapters?.length || 0
    };

    if (editingChapter) {
      await updateChapter(editingChapter.id, chapterData);
    } else {
      await createChapter(chapterData);
    }

    resetChapterForm();
    loadSections();
    toast({
      title: "Success",
      description: `Chapter ${editingChapter ? 'updated' : 'created'} successfully`
    });
    // Clear form state after successful operation
    clearFormState();
  };

  const resetSectionForm = () => {
    setSectionTitle('');
    setSectionDescription('');
    setEditingSection(null);
    setShowSectionForm(false);
    // Don't clear localStorage on reset - only clear after successful operations
  };

  const resetChapterForm = () => {
    setChapterTitle('');
    setChapterDescription('');
    setChapterType('article');
    setChapterVideoUrl('');
    setChapterArticleContent('');
    setChapterDuration(0);
    setEditingChapter(null);
    setShowChapterForm(false);
    setSelectedSectionId('');
    // Don't clear localStorage on reset - only clear after successful operations
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description || '');
    setShowSectionForm(true);
    setActiveTab('sections');
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setChapterDescription(chapter.description || '');
    setChapterType(chapter.content_type);
    setChapterVideoUrl(chapter.video_url || '');
    setChapterArticleContent(chapter.article_content || '');
    setChapterDuration(chapter.duration_minutes || 0);
    setSelectedSectionId(chapter.section_id);
    setShowChapterForm(true);
    setActiveTab('chapters');
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section? This will also delete all chapters in this section.')) {
      await deleteSection(sectionId);
      loadSections();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      await deleteChapter(chapterId);
      loadSections();
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <File className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'article':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'document':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Course Content Management - {courseTitle}
          </DialogTitle>
        </DialogHeader>

        {!isAdmin ? (
          <div className="text-center py-8">
            <p>Only super administrators can manage course content.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <div className="relative z-10" style={{ pointerEvents: 'auto' }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted" style={{ pointerEvents: 'auto' }}>
                <TabsTrigger 
                  value="sections" 
                  className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  style={{ pointerEvents: 'auto' }}
                >
                  Sections
                </TabsTrigger>
                <TabsTrigger 
                  value="chapters" 
                  className="cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  style={{ pointerEvents: 'auto' }}
                >
                  Chapters
                </TabsTrigger>
              </TabsList>

          <TabsContent value="sections" className="space-y-4" style={{ pointerEvents: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Course Sections</h3>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('➕ Add Section button clicked');
                  setShowSectionForm(true);
                }} 
                className="flex items-center gap-2 cursor-pointer hover:bg-primary/90"
                style={{ pointerEvents: 'auto' }}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>

            {showSectionForm && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingSection ? 'Edit Section' : 'New Section'}
                    <Button variant="ghost" size="sm" onClick={resetSectionForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      value={sectionTitle}
                      onChange={(e) => {
                        setSectionTitle(e.target.value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                      placeholder="Enter section title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="section-description">Description (optional)</Label>
                    <Textarea
                      id="section-description"
                      value={sectionDescription}
                      onChange={(e) => {
                        setSectionDescription(e.target.value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                      placeholder="Enter section description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSection} disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {editingSection ? 'Update' : 'Create'} Section
                    </Button>
                    <Button variant="outline" onClick={resetSectionForm}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4">
              {sections.map((section, index) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Section {index + 1}: {section.title}
                        </CardTitle>
                        {section.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🖊️ Edit section clicked for:', section.id);
                            handleEditSection(section);
                          }}
                          className="cursor-pointer"
                          style={{ pointerEvents: 'auto' }}
                          type="button"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🗑️ Delete section clicked for:', section.id);
                            handleDeleteSection(section.id);
                          }}
                          className="cursor-pointer"
                          style={{ pointerEvents: 'auto' }}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {section.chapters && section.chapters.length > 0 && (
                    <CardContent>
                      <p className="text-sm font-medium mb-2">Chapters ({section.chapters.length})</p>
                      <div className="space-y-2">
                        {section.chapters.map((chapter) => (
                          <div key={chapter.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(chapter.content_type)}
                              <span className="text-sm">{chapter.title}</span>
                              <Badge className={getContentTypeBadgeColor(chapter.content_type)}>
                                {chapter.content_type}
                              </Badge>
                              {chapter.duration_minutes && (
                                <Badge variant="secondary">{chapter.duration_minutes}min</Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🖊️ Edit chapter clicked for:', chapter.id);
                                  handleEditChapter(chapter);
                                }}
                                className="cursor-pointer"
                                style={{ pointerEvents: 'auto' }}
                                type="button"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('🗑️ Delete chapter clicked for:', chapter.id);
                                  handleDeleteChapter(chapter.id);
                                }}
                                className="cursor-pointer"
                                style={{ pointerEvents: 'auto' }}
                                type="button"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {sections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No sections created yet. Add your first section to get started.</p>
              </div>
            )}
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-4" style={{ pointerEvents: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Course Chapters</h3>
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('➕ Add Chapter button clicked');
                  setShowChapterForm(true);
                }} 
                className="flex items-center gap-2 cursor-pointer hover:bg-primary/90"
                style={{ pointerEvents: 'auto' }}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add Chapter
              </Button>
            </div>

            {showChapterForm && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {editingChapter ? 'Edit Chapter' : 'New Chapter'}
                    <Button variant="ghost" size="sm" onClick={resetChapterForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chapter-section">Section</Label>
                      <Select value={selectedSectionId} onValueChange={(value) => {
                        setSelectedSectionId(value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="chapter-type">Content Type</Label>
                      <Select value={chapterType} onValueChange={(value: 'video' | 'article' | 'document') => {
                        setChapterType(value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          {userRole === 'admin' && <SelectItem value="video">Video</SelectItem>}
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chapter-title">Chapter Title</Label>
                    <Input
                      id="chapter-title"
                      value={chapterTitle}
                      onChange={(e) => {
                        setChapterTitle(e.target.value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                      placeholder="Enter chapter title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="chapter-description">Description (optional)</Label>
                    <Textarea
                      id="chapter-description"
                      value={chapterDescription}
                      onChange={(e) => {
                        setChapterDescription(e.target.value);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                      placeholder="Enter chapter description"
                    />
                  </div>

                  <Separator />

                  {/* Content Type Specific Fields */}
                  {chapterType === 'video' && userRole === 'admin' && (
                    <VideoEmbedComponent
                      videoUrl={chapterVideoUrl}
                      onChange={(url) => {
                        setChapterVideoUrl(url);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                      duration={chapterDuration}
                      onDurationChange={(duration) => {
                        setChapterDuration(duration);
                        // Save immediately on change
                        setTimeout(() => saveFormState(), 100);
                      }}
                    />
                  )}

                  {chapterType === 'article' && (
                    <div>
                      <Label>Article Content</Label>
                      <div className="mt-2">
                        <RichTextEditor
                          value={chapterArticleContent}
                          onChange={(content) => {
                            setChapterArticleContent(content);
                            // Save immediately on change
                            setTimeout(() => saveFormState(), 100);
                          }}
                          placeholder="Write your article content here..."
                          height="400px"
                        />
                      </div>
                    </div>
                  )}

                  {chapterType === 'document' && (
                    <div>
                      <Label>Document Content</Label>
                      <div className="mt-2">
                        <RichTextEditor
                          value={chapterArticleContent}
                          onChange={(content) => {
                            setChapterArticleContent(content);
                            // Save immediately on change
                            setTimeout(() => saveFormState(), 100);
                          }}
                          placeholder="Enter document content or instructions..."
                          height="300px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Duration field for all content types (visible to recruiters for article/document, admins for all) */}
                  {(userRole === 'admin' || (userRole === 'recruiter' && chapterType !== 'video')) && (
                    <div>
                      <Label htmlFor="chapter-duration">Duration (minutes)</Label>
                      <Input
                        id="chapter-duration"
                        type="number"
                        value={chapterDuration}
                        onChange={(e) => {
                          setChapterDuration(parseInt(e.target.value) || 0);
                          setTimeout(() => saveFormState(), 100);
                        }}
                        placeholder={chapterType === 'video' ? "Video duration in minutes" : "Reading/completion time in minutes"}
                        min="0"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleSaveChapter} disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {editingChapter ? 'Update' : 'Create'} Chapter
                    </Button>
                    <Button variant="outline" onClick={resetChapterForm}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chapter List View */}
            <div className="space-y-4">
              {sections.map((section) => (
                section.chapters && section.chapters.length > 0 ? (
                  <Card key={section.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {section.chapters.map((chapter, index) => (
                        <div key={chapter.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(chapter.content_type)}
                              <span className="font-medium">{index + 1}. {chapter.title}</span>
                            </div>
                            <Badge className={getContentTypeBadgeColor(chapter.content_type)}>
                              {chapter.content_type}
                            </Badge>
                            {chapter.duration_minutes && (
                              <Badge variant="secondary">{chapter.duration_minutes}min</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditChapter(chapter)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteChapter(chapter.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null
              ))}
            </div>

            {sections.every(s => !s.chapters || s.chapters.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Video className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No chapters created yet. Add your first chapter to get started.</p>
                {sections.length === 0 && (
                  <p className="text-sm mt-2">You need to create sections first before adding chapters.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};