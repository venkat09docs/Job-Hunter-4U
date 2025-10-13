import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Edit2, Trash2, ArrowLeft, Save, VideoIcon, FileText, CheckSquare, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import type { Course } from '@/types/clp';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Section Component
const SortableSection = ({ section, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4" />
                <h4 className="font-medium">{section.title}</h4>
                <Badge variant="secondary">
                  {section.chapters?.length || 0} chapters
                </Badge>
              </div>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(section)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Sortable Chapter Component
const SortableChapter = ({ chapter, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center justify-between p-3 border rounded">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          {chapter.content_type === 'video' && <VideoIcon className="h-4 w-4" />}
          {chapter.content_type === 'article' && <FileText className="h-4 w-4" />}
          {chapter.content_type === 'checklist' && <CheckSquare className="h-4 w-4" />}
          {chapter.content_type === 'embed_code' && <VideoIcon className="h-4 w-4" />}
          <div>
            <h5 className="font-medium">{chapter.title}</h5>
            {chapter.description && (
              <p className="text-sm text-muted-foreground">{chapter.description}</p>
            )}
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{chapter.content_type}</Badge>
              {chapter.duration_minutes > 0 && (
                <Badge variant="secondary">{chapter.duration_minutes} min</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(chapter)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(chapter.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const CourseContentManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role: userRole } = useRole();
  const { loading, getCourses } = useCareerLevelProgram();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('sections');
  
  // Form states
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [chapterType, setChapterType] = useState<'video' | 'article' | 'document' | 'checklist' | 'embed_code'>('video');
  const [chapterVideoUrl, setChapterVideoUrl] = useState('');
  const [chapterArticleContent, setChapterArticleContent] = useState('');
  const [chapterEmbedCode, setChapterEmbedCode] = useState('');
  const [chapterDuration, setChapterDuration] = useState<number>(0);
  
  // Checklist states
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [currentChecklistItem, setCurrentChecklistItem] = useState('');
  
  // Editing states
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Load course data
  useEffect(() => {
    if (!courseId) return;
    
    const loadCourseData = async () => {
      try {
        const courses = await getCourses();
        const foundCourse = courses.find(c => c.id === courseId);
        if (foundCourse) {
          setCourse(foundCourse);
          console.log('📚 Course loaded:', foundCourse.title);
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Failed to load course data');
      }
    };

    loadCourseData();
  }, [courseId, getCourses]);

  // Load sections
  const loadSections = useCallback(async () => {
    if (!courseId) return;
    
    try {
      const { data: sectionsData, error } = await supabase
        .from('course_sections')
        .select(`
          *,
          chapters:course_chapters(*)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      
      setSections(sectionsData || []);
      console.log('📖 Sections loaded:', sectionsData?.length || 0);
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Failed to load sections');
    }
  }, [courseId]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  // Auto-save form state
  useEffect(() => {
    if (!courseId) return;
    
    const formState = {
      sectionTitle,
      sectionDescription,
      chapterTitle,
      chapterDescription,
      chapterType,
      chapterVideoUrl,
      chapterArticleContent,
      chapterDuration,
      activeTab,
      selectedSectionId,
      editingSection: editingSection?.id,
      editingChapter: editingChapter?.id,
    };

    const key = `course-content-form-${courseId}`;
    localStorage.setItem(key, JSON.stringify(formState));
    console.log('📝 Form state auto-saved');
  }, [
    courseId, sectionTitle, sectionDescription, chapterTitle, chapterDescription,
    chapterType, chapterVideoUrl, chapterArticleContent, chapterDuration,
    activeTab, selectedSectionId, editingSection, editingChapter
  ]);

  // Create section
  const handleCreateSection = async () => {
    if (!courseId || !sectionTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('course_sections')
        .insert({
          course_id: courseId,
          title: sectionTitle,
          description: sectionDescription,
          order_index: sections.length,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSectionTitle('');
      setSectionDescription('');
      loadSections();
      toast.success('Section created successfully');
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    }
  };

  // Create chapter
  const handleCreateChapter = async () => {
    if (!selectedSectionId || !chapterTitle.trim()) {
      toast.error('Please select a section and provide chapter title');
      return;
    }

    try {
      const selectedSection = sections.find(s => s.id === selectedSectionId);
      const chapterCount = selectedSection?.chapters?.length || 0;

      const chapterData: any = {
        section_id: selectedSectionId,
        title: chapterTitle,
        description: chapterDescription,
        content_type: chapterType,
        order_index: chapterCount,
        duration_minutes: chapterDuration,
        created_by: user!.id,
      };

      if (chapterType === 'video') {
        chapterData.video_url = chapterVideoUrl;
        chapterData.content_data = {};
      } else if (chapterType === 'article') {
        chapterData.article_content = chapterArticleContent;
        chapterData.content_data = {};
      } else if (chapterType === 'checklist') {
        if (checklistItems.length === 0) {
          toast.error('Please add at least one checklist item');
          return;
        }
        chapterData.content_data = { checklist_items: checklistItems };
      } else if (chapterType === 'embed_code') {
        chapterData.content_data = { embed_code: chapterEmbedCode };
      } else {
        chapterData.content_data = {};
      }

      const { data, error } = await supabase
        .from('course_chapters')
        .insert(chapterData)
        .select()
        .single();

      if (error) throw error;

      // Reset form
      setChapterTitle('');
      setChapterDescription('');
      setChapterVideoUrl('');
      setChapterArticleContent('');
      setChapterEmbedCode('');
      setChapterDuration(0);
      setSelectedSectionId('');
      setChecklistItems([]);
      
      loadSections();
      toast.success('Chapter created successfully');
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast.error('Failed to create chapter');
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section and all its chapters?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('course_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      loadSections();
      toast.success('Section deleted successfully');
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('course_chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      loadSections();
      toast.success('Chapter deleted successfully');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  };

  // Update section
  const handleUpdateSection = async () => {
    if (!editingSection || !sectionTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_sections')
        .update({
          title: sectionTitle,
          description: sectionDescription,
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      setSectionTitle('');
      setSectionDescription('');
      setEditingSection(null);
      loadSections();
      toast.success('Section updated successfully');
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Failed to update section');
    }
  };

  // Update chapter
  const handleUpdateChapter = async () => {
    if (!editingChapter || !chapterTitle.trim()) {
      toast.error('Chapter title is required');
      return;
    }

    try {
      const chapterData: any = {
        title: chapterTitle,
        description: chapterDescription,
        content_type: chapterType,
        duration_minutes: chapterDuration,
      };

      if (chapterType === 'video') {
        chapterData.video_url = chapterVideoUrl;
        chapterData.content_data = {};
      } else if (chapterType === 'article') {
        chapterData.article_content = chapterArticleContent;
        chapterData.content_data = {};
      } else if (chapterType === 'checklist') {
        if (checklistItems.length === 0) {
          toast.error('Please add at least one checklist item');
          return;
        }
        chapterData.content_data = { checklist_items: checklistItems };
      } else if (chapterType === 'embed_code') {
        chapterData.content_data = { embed_code: chapterEmbedCode };
      } else {
        chapterData.content_data = {};
      }

      const { error } = await supabase
        .from('course_chapters')
        .update(chapterData)
        .eq('id', editingChapter.id);

      if (error) throw error;

      // Reset form
      setChapterTitle('');
      setChapterDescription('');
      setChapterVideoUrl('');
      setChapterArticleContent('');
      setChapterEmbedCode('');
      setChapterDuration(0);
      setEditingChapter(null);
      setChecklistItems([]);
      
      loadSections();
      toast.success('Chapter updated successfully');
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast.error('Failed to update chapter');
    }
  };

  // Start editing section
  const startEditingSection = (section: any) => {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description || '');
  };

  // Start editing chapter
  const startEditingChapter = (chapter: any) => {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setChapterDescription(chapter.description || '');
    setChapterType(chapter.content_type);
    setChapterVideoUrl(chapter.video_url || '');
    setChapterArticleContent(chapter.article_content || '');
    setChapterEmbedCode(chapter.content_data?.embed_code || '');
    setChapterDuration(chapter.duration_minutes || 0);
    setSelectedSectionId(chapter.section_id);
    setChecklistItems(chapter.content_data?.checklist_items || []);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null);
    setEditingChapter(null);
    setSectionTitle('');
    setSectionDescription('');
    setChapterTitle('');
    setChapterDescription('');
    setChapterVideoUrl('');
    setChapterArticleContent('');
    setChapterEmbedCode('');
    setChapterDuration(0);
    setSelectedSectionId('');
    setChecklistItems([]);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle section reorder
  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    // Update order_index in database
    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('course_sections')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast.success('Section order updated');
    } catch (error) {
      console.error('Error updating section order:', error);
      toast.error('Failed to update section order');
      loadSections(); // Reload to reset order
    }
  };

  // Handle chapter reorder within a section
  const handleChapterDragEnd = async (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.chapters) return;

    const oldIndex = section.chapters.findIndex((c: any) => c.id === active.id);
    const newIndex = section.chapters.findIndex((c: any) => c.id === over.id);

    const newChapters = arrayMove(section.chapters, oldIndex, newIndex);

    // Update local state
    setSections(sections.map((s) => 
      s.id === sectionId ? { ...s, chapters: newChapters } : s
    ));

    // Update order_index in database
    try {
      const updates = newChapters.map((chapter: any, index: number) => ({
        id: chapter.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('course_chapters')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast.success('Chapter order updated');
    } catch (error) {
      console.error('Error updating chapter order:', error);
      toast.error('Failed to update chapter order');
      loadSections(); // Reload to reset order
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard/career-level/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Course Content Management</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingSection ? 'Edit Section' : 'Create New Section'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="section-title">Section Title</Label>
                  <Input
                    id="section-title"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    placeholder="Enter section title"
                  />
                </div>
                <div>
                  <Label htmlFor="section-description">Description</Label>
                  <Textarea
                    id="section-description"
                    value={sectionDescription}
                    onChange={(e) => setSectionDescription(e.target.value)}
                    placeholder="Enter section description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  {editingSection ? (
                    <>
                      <Button onClick={handleUpdateSection} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Update Section
                      </Button>
                      <Button variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleCreateSection} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Section
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Existing Sections */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Existing Sections</h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSectionDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      onEdit={startEditingSection}
                      onDelete={handleDeleteSection}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingChapter && (
                  <div>
                    <Label htmlFor="section-select">Select Section</Label>
                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a section" />
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
                )}

                <div>
                  <Label htmlFor="chapter-title">Chapter Title</Label>
                  <Input
                    id="chapter-title"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Enter chapter title"
                  />
                </div>

                <div>
                  <Label htmlFor="chapter-description">Description</Label>
                  <Textarea
                    id="chapter-description"
                    value={chapterDescription}
                    onChange={(e) => setChapterDescription(e.target.value)}
                    placeholder="Enter chapter description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="chapter-type">Content Type</Label>
                  <Select value={chapterType} onValueChange={(value: 'video' | 'article' | 'document' | 'checklist' | 'embed_code') => setChapterType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-background">
                      <SelectItem value="article">📝 Article</SelectItem>
                      {userRole === 'admin' && <SelectItem value="video">🎥 Video</SelectItem>}
                      {userRole === 'admin' && <SelectItem value="checklist">✅ Checklist</SelectItem>}
                      {userRole === 'admin' && <SelectItem value="embed_code">🔗 Embed Code</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {chapterType === 'video' && userRole === 'admin' && (
                  <div>
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      value={chapterVideoUrl}
                      onChange={(e) => setChapterVideoUrl(e.target.value)}
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    />
                  </div>
                )}

                {chapterType === 'article' && (
                  <div>
                    <Label htmlFor="article-content">Article Content</Label>
                    <Textarea
                      id="article-content"
                      value={chapterArticleContent}
                      onChange={(e) => setChapterArticleContent(e.target.value)}
                      placeholder="Enter article content"
                      rows={6}
                    />
                  </div>
                )}

                {chapterType === 'embed_code' && userRole === 'admin' && (
                  <div>
                    <Label htmlFor="embed-code">Embed Code or Video URL</Label>
                    <Textarea
                      id="embed-code"
                      value={chapterEmbedCode}
                      onChange={(e) => setChapterEmbedCode(e.target.value)}
                      placeholder="Paste iframe embed code or video URL (YouTube, Vimeo, Loom)"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can paste either an iframe embed code or a direct video URL
                    </p>
                  </div>
                )}

                {chapterType === 'checklist' && userRole === 'admin' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Checklist Items</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={currentChecklistItem}
                            onChange={(e) => setCurrentChecklistItem(e.target.value)}
                            placeholder="Enter checklist item"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (currentChecklistItem.trim()) {
                                  setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
                                  setCurrentChecklistItem('');
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (currentChecklistItem.trim()) {
                                setChecklistItems([...checklistItems, currentChecklistItem.trim()]);
                                setCurrentChecklistItem('');
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {checklistItems.length > 0 && (
                          <div className="space-y-2">
                            {checklistItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                <span>{item}</span>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setChecklistItems(checklistItems.filter((_, i) => i !== index));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(userRole === 'admin' || (userRole === 'recruiter' && chapterType === 'article')) && (
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={chapterDuration}
                      onChange={(e) => setChapterDuration(parseInt(e.target.value) || 0)}
                      placeholder={chapterType === 'video' ? "Enter video duration in minutes" : "Enter reading/completion time in minutes"}
                      min="0"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {editingChapter ? (
                    <>
                      <Button onClick={handleUpdateChapter} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Update Chapter
                      </Button>
                      <Button variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleCreateChapter} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Chapter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Existing Chapters by Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Existing Chapters</h3>
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.chapters && section.chapters.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleChapterDragEnd(event, section.id)}
                      >
                        <SortableContext
                          items={section.chapters.map((c: any) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {section.chapters.map((chapter: any) => (
                              <SortableChapter
                                key={chapter.id}
                                chapter={chapter}
                                onEdit={startEditingChapter}
                                onDelete={handleDeleteChapter}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <p className="text-muted-foreground">No chapters in this section yet.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseContentManagement;
