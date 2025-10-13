import React, { useState, useEffect } from 'react';
import { X, BookOpen, Play, FileText, Download, ChevronRight, ChevronDown, CheckSquare, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useChecklistProgress } from '@/hooks/useChecklistProgress';

interface CourseContentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'document' | 'checklist';
  content_data: any;
  order_index: number;
  duration_minutes?: number;
}

export const CourseContentViewer: React.FC<CourseContentViewerProps> = ({
  open,
  onOpenChange,
  courseId,
  courseTitle
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const { 
    getChecklistProgress, 
    updateChecklistItemProgress, 
    mergeChecklistWithProgress,
    getChecklistCompletionPercentage 
  } = useChecklistProgress();

  useEffect(() => {
    if (open && courseId) {
      loadCourseContent();
    }
  }, [open, courseId]);

  const loadCourseContent = async () => {
    setLoading(true);
    try {
      const sectionsData = await getSectionsByCourse(courseId);
      
      // Load chapters for each section
      const sectionsWithChapters = await Promise.all(
        sectionsData.map(async (section) => {
          const chapters = await getChaptersBySection(section.id);
          return {
            ...section,
            chapters: chapters.sort((a, b) => a.order_index - b.order_index)
          };
        })
      );

      setSections(sectionsWithChapters.sort((a, b) => a.order_index - b.order_index));
      
      // Auto-select first chapter if available
      const firstSection = sectionsWithChapters[0];
      if (firstSection?.chapters.length > 0) {
        setSelectedChapter(firstSection.chapters[0]);
        setOpenSections(new Set([firstSection.id]));
      }
    } catch (error) {
      console.error('Error loading course content:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <Download className="h-4 w-4" />;
      case 'checklist':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getContentTypeBadgeColor = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'article':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'document':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'checklist':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderChapterContent = (chapter: Chapter) => {
    const { content_type, content_data } = chapter;

    switch (content_type) {
      case 'video':
        if (content_data.video_url) {
          // Check if it's a YouTube, Vimeo, or Loom URL and convert to embed format
          let embedUrl = content_data.video_url;
          
          if (content_data.video_url.includes('youtube.com') || content_data.video_url.includes('youtu.be')) {
            const videoId = content_data.video_url.includes('youtu.be') 
              ? content_data.video_url.split('/').pop()?.split('?')[0]
              : new URL(content_data.video_url).searchParams.get('v');
            embedUrl = `https://www.youtube.com/embed/${videoId}`;
          } else if (content_data.video_url.includes('vimeo.com')) {
            const videoId = content_data.video_url.split('/').pop();
            embedUrl = `https://player.vimeo.com/video/${videoId}`;
          } else if (content_data.video_url.includes('loom.com')) {
            const videoId = content_data.video_url.split('/').pop()?.split('?')[0];
            embedUrl = `https://www.loom.com/embed/${videoId}`;
          }

          return (
            <div className="space-y-4">
              <div 
                className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden select-none"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onMouseDown={(e) => {
                  if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ 
                    border: 'none',
                    pointerEvents: 'none'
                  }}
                />
                {/* Multiple security layers to prevent interactions */}
                <div 
                  className="absolute inset-0 pointer-events-auto"
                  style={{
                    background: 'transparent',
                    cursor: 'default'
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 2) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  onClick={(e) => {
                    // Allow clicks to pass through for play button
                    const iframe = e.currentTarget.previousElementSibling as HTMLIFrameElement;
                    if (iframe && iframe.style) {
                      iframe.style.pointerEvents = 'auto';
                      setTimeout(() => {
                        if (iframe.style) iframe.style.pointerEvents = 'none';
                      }, 100);
                    }
                  }}
                />
              </div>
              {content_data.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">{content_data.description}</p>
                </div>
              )}
              {chapter.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="h-4 w-4" />
                  <span>Duration: {chapter.duration_minutes} minutes</span>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'article':
        return (
          <div className="prose prose-sm max-w-none">
            <div 
              dangerouslySetInnerHTML={{ 
                __html: content_data.article_content || '<p>No content available</p>' 
              }} 
            />
          </div>
        );

      case 'checklist':
        return <ChecklistViewer chapter={chapter} />;

      case 'document':
        return (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: content_data.document_content || '<p>No content available</p>' 
                }} 
              />
            </div>
            {content_data.attachments && content_data.attachments.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">Attachments:</h4>
                <div className="space-y-2">
                  {content_data.attachments.map((attachment: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {attachment.name || `Attachment ${index + 1}`}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Content not available</p>
          </div>
        );
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Content not available</p>
      </div>
    );
  };

  const ChecklistViewer = ({ chapter }: { chapter: Chapter }) => {
    const [checklistItems, setChecklistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (chapter.content_data?.checklist_items) {
        loadChecklistProgress();
      }
    }, [chapter.id]);

    const loadChecklistProgress = async () => {
      setLoading(true);
      try {
        const progress = await getChecklistProgress(chapter.id);
        const items = mergeChecklistWithProgress(
          chapter.content_data.checklist_items || [],
          progress
        );
        setChecklistItems(items);
      } catch (error) {
        console.error('Error loading checklist progress:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleToggleItem = async (itemId: string, completed: boolean) => {
      const success = await updateChecklistItemProgress(chapter.id, itemId, completed);
      if (success) {
        setChecklistItems(items =>
          items.map(item =>
            item.id === itemId ? { ...item, completed } : item
          )
        );
      }
    };

    if (!chapter.content_data?.checklist_items?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No checklist items available</p>
        </div>
      );
    }

    const completionPercentage = getChecklistCompletionPercentage(checklistItems);

    return (
      <div className="space-y-4">
        {/* Progress header */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h4 className="font-medium">Progress</h4>
            <p className="text-sm text-muted-foreground">
              {checklistItems.filter(item => item.completed).length} of {checklistItems.length} completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
            <div className="w-16 h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted animate-pulse rounded">
                <div className="w-5 h-5 bg-muted-foreground/20 rounded" />
                <div className="h-4 bg-muted-foreground/20 rounded flex-1" />
              </div>
            ))
          ) : (
            checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 hover:bg-muted/50 cursor-pointer ${
                  item.completed ? 'bg-green-50 border-green-200' : 'bg-background'
                }`}
                onClick={() => handleToggleItem(item.id, !item.completed)}
              >
                <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                  item.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-muted-foreground/30 hover:border-primary'
                }`}>
                  {item.completed && <Check className="w-3 h-3" />}
                </div>
                <span className={`flex-1 transition-all ${
                  item.completed ? 'line-through text-muted-foreground' : ''
                }`}>
                  {item.text}
                </span>
              </div>
            ))
          )}
        </div>

        {completionPercentage === 100 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <Check className="w-4 h-4" />
              Checklist completed! Great job!
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <div className="flex h-full">
          {/* Sidebar - Course Navigation */}
          <div className="w-80 border-r bg-muted/20 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{courseTitle}</h3>
                  <p className="text-sm text-muted-foreground">Course Content</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Course Content Navigation */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="ml-4 space-y-1">
                        <div className="h-3 bg-muted/70 rounded animate-pulse" />
                        <div className="h-3 bg-muted/70 rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No content available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <Collapsible
                      key={section.id}
                      open={openSections.has(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-muted/50 text-left">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {openSections.has(section.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{section.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {section.chapters.length}
                        </Badge>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-6 space-y-1">
                        {section.chapters.map((chapter) => (
                          <button
                            key={chapter.id}
                            onClick={() => setSelectedChapter(chapter)}
                            className={`w-full text-left p-2 rounded text-sm hover:bg-muted/50 transition-colors ${
                              selectedChapter?.id === chapter.id 
                                ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(chapter.content_type)}
                              <span className="flex-1">{chapter.title}</span>
                              {chapter.duration_minutes && (
                                <span className="text-xs text-muted-foreground">
                                  {chapter.duration_minutes}m
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedChapter ? (
              <>
                {/* Chapter Header */}
                <div className="p-6 border-b bg-background">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getContentTypeIcon(selectedChapter.content_type)}
                        <Badge 
                          variant="outline" 
                          className={getContentTypeBadgeColor(selectedChapter.content_type)}
                        >
                          {selectedChapter.content_type.charAt(0).toUpperCase() + selectedChapter.content_type.slice(1)}
                        </Badge>
                      </div>
                      <h2 className="text-xl font-semibold">{selectedChapter.title}</h2>
                      {selectedChapter.description && (
                        <p className="text-muted-foreground mt-1">{selectedChapter.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chapter Content */}
                <ScrollArea className="flex-1 p-6">
                  {renderChapterContent(selectedChapter)}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Select a Chapter</h3>
                  <p className="text-muted-foreground">
                    Choose a chapter from the sidebar to start learning
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};