import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, FileText, Download, ChevronRight, ChevronDown, Home, CheckCircle2, ArrowRight, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useChapterCompletion } from '@/hooks/useChapterCompletion';
import { useChecklistProgress } from '@/hooks/useChecklistProgress';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { CircularProgress } from '@/components/CircularProgress';
import { toast } from 'sonner';

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
  video_url?: string;
  article_content?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
}

const CourseContentView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const [courseProgressPercentage, setCourseProgressPercentage] = useState(0);
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const { getCourses } = useCareerLevelProgram();
  const { markChapterComplete, isChapterComplete, loading: chapterLoading, getCourseProgress } = useChapterCompletion();
  const { 
    getChecklistProgress, 
    updateChecklistItemProgress, 
    mergeChecklistWithProgress,
    getChecklistCompletionPercentage 
  } = useChecklistProgress();

  useEffect(() => {
    if (courseId) {
      loadCourseData();
      loadCourseContent();
    }
  }, [courseId]);

  useEffect(() => {
    if (sections.length > 0) {
      loadCompletedChapters();
      loadCourseProgress();
    }
  }, [sections]);

  // Load course progress when chapters are completed
  useEffect(() => {
    if (courseId) {
      loadCourseProgress();
    }
  }, [completedChapters, courseId]);

  const loadCourseData = async () => {
    try {
      const courses = await getCourses();
      const foundCourse = courses.find(c => c.id === courseId);
      if (foundCourse) {
        setCourse(foundCourse);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const loadCourseContent = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      console.log('Loading course content for courseId:', courseId);
      const sectionsData = await getSectionsByCourse(courseId);
      console.log('Sections data received:', sectionsData);
      
      // Load chapters for each section
      const sectionsWithChapters = await Promise.all(
        sectionsData.map(async (section) => {
          console.log('Loading chapters for section:', section.id);
          const chapters = await getChaptersBySection(section.id);
          console.log('Chapters for section', section.id, ':', chapters);
          return {
            ...section,
            chapters: chapters.sort((a, b) => a.order_index - b.order_index)
          };
        })
      );

      console.log('All sections with chapters:', sectionsWithChapters);
      setSections(sectionsWithChapters.sort((a, b) => a.order_index - b.order_index));
      
      // Auto-select first chapter if available
      const firstSection = sectionsWithChapters[0];
      if (firstSection?.chapters.length > 0) {
        const firstChapter = firstSection.chapters[0];
        console.log('Auto-selecting first chapter:', firstChapter);
        setSelectedChapter(firstChapter);
        setOpenSections(new Set([firstSection.id]));
      }
    } catch (error) {
      console.error('Error loading course content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedChapters = async () => {
    try {
      const allChapters: string[] = [];
      sections.forEach(section => {
        section.chapters.forEach(chapter => {
          allChapters.push(chapter.id);
        });
      });

      const completedIds = await Promise.all(
        allChapters.map(async (chapterId) => {
          const isComplete = await isChapterComplete(chapterId);
          return isComplete ? chapterId : null;
        })
      );

      const completed = completedIds.filter(Boolean) as string[];
      setCompletedChapters(new Set(completed));
    } catch (error) {
      console.error('Error loading completed chapters:', error);
    }
  };

  const loadCourseProgress = async () => {
    if (!courseId) return;
    
    try {
      const progressData = await getCourseProgress(courseId);
      if (progressData) {
        setCourseProgressPercentage(progressData.progress_percentage);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
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

  // Navigation helper functions
  const getPreviousChapter = (): Chapter | null => {
    if (!selectedChapter) return null;
    
    let allChapters: Chapter[] = [];
    sections.forEach(section => {
      allChapters = [...allChapters, ...section.chapters];
    });
    
    const currentIndex = allChapters.findIndex(ch => ch.id === selectedChapter.id);
    return currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  };

  const getNextChapter = (): Chapter | null => {
    if (!selectedChapter) return null;
    
    let allChapters: Chapter[] = [];
    sections.forEach(section => {
      allChapters = [...allChapters, ...section.chapters];
    });
    
    const currentIndex = allChapters.findIndex(ch => ch.id === selectedChapter.id);
    return currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
  };

  const getNextSection = (): Section | null => {
    if (!selectedChapter) return null;
    
    const currentSection = sections.find(section => 
      section.chapters.some(ch => ch.id === selectedChapter.id)
    );
    
    if (!currentSection) return null;
    
    const currentSectionIndex = sections.findIndex(s => s.id === currentSection.id);
    return currentSectionIndex < sections.length - 1 ? sections[currentSectionIndex + 1] : null;
  };

  const handleMarkComplete = async () => {
    if (selectedChapter) {
      const success = await markChapterComplete(selectedChapter.id);
      if (success) {
        setCompletedChapters(prev => new Set([...prev, selectedChapter.id]));
        
        // Check if entire course is now complete and show congratulations
        if (courseId) {
          try {
            const progressData = await getCourseProgress(courseId);
            if (progressData && progressData.progress_percentage >= 100) {
              toast.success('🎉 Congratulations! You have completed the entire course and earned 100 points!', {
                duration: 5000,
              });
            }
          } catch (error) {
            console.error('Error checking course progress:', error);
          }
        }
        
        // Auto-navigate to next chapter if available
        const nextChapter = getNextChapter();
        if (nextChapter) {
          setSelectedChapter(nextChapter);
          // Open the section containing the next chapter
          const nextSection = sections.find(section => 
            section.chapters.some(ch => ch.id === nextChapter.id)
          );
          if (nextSection) {
            setOpenSections(prev => new Set([...prev, nextSection.id]));
          }
        } else {
          toast.success('Congratulations! You have completed this course section!');
        }
      }
    }
  };

  const handleGoToNextSection = () => {
    const nextSection = getNextSection();
    if (nextSection && nextSection.chapters.length > 0) {
      setSelectedChapter(nextSection.chapters[0]);
      setOpenSections(prev => new Set([...prev, nextSection.id]));
    }
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
    console.log('Rendering chapter content:', chapter);
    const { content_type, content_data } = chapter;
    console.log('Content type:', content_type);
    console.log('Raw chapter data:', JSON.stringify(chapter, null, 2));

    switch (content_type) {
      case 'video':
        // Check for video URL in multiple locations - it's stored directly on chapter, not in content_data
        let videoUrl = null;
        
        if (chapter) {
          videoUrl = (chapter as any).video_url ||  // Direct property on chapter
                    content_data?.video_url || 
                    content_data?.videoUrl || 
                    content_data?.url || 
                    content_data?.video ||
                    (content_data?.content && content_data.content.video_url) ||
                    (content_data?.content && content_data.content.videoUrl) ||
                    (content_data?.video_data && content_data.video_data.url) ||
                    (content_data?.video_data && content_data.video_data.video_url);
        }
        
        console.log('Video URL found:', videoUrl);
        console.log('Chapter keys:', chapter ? Object.keys(chapter) : 'No chapter data');
        console.log('Content data keys:', content_data ? Object.keys(content_data) : 'No content_data');
        
        if (videoUrl) {
          // Check if it's a YouTube, Vimeo, or Loom URL and convert to embed format
          let embedUrl = videoUrl;
          
          try {
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
              const videoId = videoUrl.includes('youtu.be') 
                ? videoUrl.split('/').pop()?.split('?')[0]
                : new URL(videoUrl).searchParams.get('v');
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
            } else if (videoUrl.includes('vimeo.com')) {
              const videoId = videoUrl.split('/').pop();
              embedUrl = `https://player.vimeo.com/video/${videoId}`;
            } else if (videoUrl.includes('loom.com')) {
              const videoId = videoUrl.split('/').pop()?.split('?')[0];
              embedUrl = `https://www.loom.com/embed/${videoId}`;
            }

            console.log('Final embed URL:', embedUrl);

            return (
              <div className="relative w-full">
                {/* Responsive video container with maximum space utilization */}
                <div 
                  className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
                  style={{ 
                    aspectRatio: '16/9',
                    maxHeight: 'min(90vh, 900px)' // Increased height limit for maximum space usage
                  }}
                >
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={chapter.title}
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            );
          } catch (error) {
            console.error('Error processing video URL:', error);
            return (
              <div className="text-center py-8 text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Error loading video</p>
                <p className="text-xs mt-2">Invalid video URL format</p>
              </div>
            );
          }
        } else {
          console.log('No video URL found. Chapter data:', chapter);
          return (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Video content not available</p>
              <p className="text-xs mt-2">No video URL found</p>
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs">Debug: Show chapter data</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(chapter, null, 2)}
                </pre>
              </details>
            </div>
          );
        }

      case 'article':
        // Check for article content in chapter or content_data
        const articleContent = (chapter as any).article_content || content_data?.article_content || content_data?.content;
        if (articleContent) {
          return (
            <div className="prose prose-sm max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: articleContent
                }} 
              />
            </div>
          );
        } else {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Article content not available</p>
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs">Debug: Show chapter data</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(chapter, null, 2)}
                </pre>
              </details>
            </div>
          );
        }

      case 'document':
        // Check for document content in chapter or content_data
        const documentContent = (chapter as any).article_content || content_data?.document_content || content_data?.content;
        return (
          <div className="space-y-4">
            {documentContent ? (
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: documentContent
                  }} 
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Document content not available</p>
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs">Debug: Show chapter data</summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(chapter, null, 2)}
                  </pre>
                </details>
              </div>
            )}
            {content_data?.attachments && content_data.attachments.length > 0 && (
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

      case 'checklist':
        return <ChecklistViewer chapterId={chapter.id} checklistItems={content_data?.checklist_items || []} />;

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Content type not supported: {content_type}</p>
          </div>
        );
    }
  };

  // ChecklistViewer component for rendering checklist items
  const ChecklistViewer = ({ chapterId, checklistItems }: { chapterId: string; checklistItems: string[] }) => {
    const [checklistWithProgress, setChecklistWithProgress] = useState<Array<{
      id: string;
      text: string;
      completed: boolean;
    }>>([]);
    const [loading, setLoading] = useState(true);

    console.log('ChecklistViewer props:', { chapterId, checklistItems });

    useEffect(() => {
      const loadChecklistProgress = async () => {
        if (!checklistItems || checklistItems.length === 0) {
          setLoading(false);
          return;
        }

        // Create checklist items from the actual database data
        const dynamicChecklist = checklistItems.map((item, index) => ({
          id: `item_${index}`,
          text: item,
          completed: false
        }));
        
        setChecklistWithProgress(dynamicChecklist);
        setLoading(false);

        // TODO: Later we can re-enable database progress tracking
        // try {
        //   const progress = await getChecklistProgress(chapterId);
        //   const mergedChecklist = mergeChecklistWithProgress(checklistItems, progress);
        //   setChecklistWithProgress(mergedChecklist);
        // } catch (error) {
        //   console.error('Error loading progress:', error);
        //   setChecklistWithProgress(dynamicChecklist);
        // }
      };

      loadChecklistProgress();
    }, [chapterId, JSON.stringify(checklistItems)]);

    const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
      console.log('Toggling item:', itemId, 'to:', isCompleted);
      
      // Update local state immediately for better UX
      setChecklistWithProgress(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, completed: isCompleted } : item
        )
      );
      
      // TODO: Re-enable database update later
      // try {
      //   const success = await updateChecklistItemProgress(chapterId, itemId, isCompleted);
      //   if (!success) {
      //     // Revert on failure
      //     setChecklistWithProgress(prev => 
      //       prev.map(item => 
      //         item.id === itemId ? { ...item, completed: !isCompleted } : item
      //       )
      //     );
      //   }
      // } catch (error) {
      //   console.error('Error updating checklist item:', error);
      //   // Revert on error
      //   setChecklistWithProgress(prev => 
      //     prev.map(item => 
      //       item.id === itemId ? { ...item, completed: !isCompleted } : item
      //     )
      //   );
      // }
    };

    console.log('ChecklistViewer render - loading:', loading, 'items:', checklistWithProgress);

    if (loading) {
      console.log('Showing loading state');
      return (
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-5 w-5 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!checklistItems || checklistItems.length === 0) {
      console.log('Showing empty state - no items');
      return (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No checklist items available</p>
          <p className="text-xs mt-2">This checklist appears to be empty</p>
        </div>
      );
    }

    console.log('Rendering checklist items:', checklistWithProgress.length);
    const completionPercentage = getChecklistCompletionPercentage(checklistWithProgress);

    return (
      <div className="space-y-6 p-4">
        {/* Progress indicator */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}% Complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-3">
          {checklistWithProgress.length === 0 ? (
            <p className="text-muted-foreground">No checklist items loaded</p>
          ) : (
            checklistWithProgress.map((item, index) => (
              <label 
                key={`${item.id}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-2 border-primary text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.text}
                </span>
                {item.completed && (
                  <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                )}
              </label>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/skill-level')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Courses</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold">{course?.title || 'Course Content'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CircularProgress 
              value={courseProgressPercentage} 
              size={48}
              className="text-primary"
            />
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar - Course Navigation */}
        <div className="w-full lg:w-80 xl:w-96 border-b lg:border-r lg:border-b-0 bg-muted/20 flex flex-col max-h-64 lg:max-h-none overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 lg:p-6 border-b bg-background">
            <div>
              <h3 className="font-semibold text-lg lg:text-xl line-clamp-1">{course?.title || 'Course Content'}</h3>
              <p className="text-sm lg:text-base text-muted-foreground">Navigate through sections and chapters</p>
            </div>
          </div>

          {/* Course Content Navigation */}
          <ScrollArea className="flex-1 p-4 lg:p-6">
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
              <div className="space-y-3">
                {sections.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={openSections.has(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-lg hover:bg-muted/50 transition-all duration-200 group text-left border border-transparent hover:border-muted-foreground/20 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {openSections.has(section.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </div>
                        <span className="font-semibold text-base lg:text-lg group-hover:text-primary transition-colors">{section.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs lg:text-sm px-2 py-1">
                        {section.chapters.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-8 space-y-2 mt-2">
                      {section.chapters.map((chapter) => (
                         <button
                           key={chapter.id}
                           onClick={() => setSelectedChapter(chapter)}
                           className={`w-full text-left p-4 rounded-lg transition-all duration-200 group border ${
                             selectedChapter?.id === chapter.id 
                               ? 'bg-primary/10 text-primary border-primary/30 shadow-sm' 
                               : 'hover:bg-muted/50 border-transparent hover:border-muted-foreground/20 hover:shadow-sm'
                           } ${
                             completedChapters.has(chapter.id) 
                               ? 'bg-green-50 border-green-300' 
                               : ''
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2">
                               {getContentTypeIcon(chapter.content_type)}
                               {completedChapters.has(chapter.id) && (
                                 <CheckCircle2 className="h-4 w-4 text-green-600" />
                               )}
                             </div>
                             <div className="flex-1 min-w-0">
                               <span className="font-semibold text-sm lg:text-base block line-clamp-1 group-hover:text-primary transition-colors">
                                 {chapter.title}
                               </span>
                               {chapter.duration_minutes && (
                                 <span className="text-xs lg:text-sm text-muted-foreground mt-1 block">
                                   {chapter.duration_minutes} minutes
                                 </span>
                               )}
                             </div>
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
        <div className="flex-1 flex flex-col min-h-0">
          {selectedChapter ? (
            <>
              {/* Chapter Content - Full Height */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1">
                  <div className="p-2 lg:p-4 h-full">
                    <div className="max-w-7xl mx-auto h-full">
                      {renderChapterContent(selectedChapter)}
                    </div>
                  </div>
                </div>
                
                {/* Navigation Controls */}
                <div className="border-t bg-background p-4 lg:p-6">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Chapter Description */}
                    {selectedChapter.description && (
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <div 
                          className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-semibold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-p:leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: selectedChapter.description
                              .replace(/\n/g, '<br/>')
                              .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Previous Button */}
                      <div className="w-full sm:flex-1 sm:w-auto">
                      {getPreviousChapter() ? (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedChapter(getPreviousChapter()!)}
                          className="flex items-center gap-2 w-full sm:w-auto"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      ) : (
                        <div className="hidden sm:block" /> // Empty div for spacing on desktop
                      )}
                    </div>

                    {/* Mark as Complete */}
                    <div className="w-full sm:flex-1 sm:w-auto flex justify-center">
                      <Button
                        onClick={handleMarkComplete}
                        disabled={completedChapters.has(selectedChapter.id) || chapterLoading}
                        className={`flex items-center gap-2 w-full sm:w-auto ${
                          completedChapters.has(selectedChapter.id)
                            ? 'bg-green-600 hover:bg-green-600 cursor-default'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {completedChapters.has(selectedChapter.id)
                          ? 'Completed'
                          : chapterLoading
                          ? 'Marking...'
                          : 'Mark as Complete'
                        }
                      </Button>
                    </div>

                     {/* Next Button or Next Section */}
                     <div className="w-full sm:flex-1 sm:w-auto flex justify-end">
                       {getNextChapter() ? (
                         <Button
                           onClick={() => setSelectedChapter(getNextChapter()!)}
                           className="flex items-center gap-2 w-full sm:w-auto"
                         >
                           Next
                           <ArrowRight className="h-4 w-4" />
                         </Button>
                       ) : getNextSection() ? (
                         <Button
                           onClick={handleGoToNextSection}
                           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                         >
                           Go to Next Section
                           <ArrowRight className="h-4 w-4" />
                         </Button>
                       ) : (
                         <Button
                           variant="outline"
                           disabled
                           className="flex items-center gap-2 w-full sm:w-auto"
                         >
                           Course Complete
                           <CheckCircle2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg lg:text-xl font-medium mb-2">Select a Chapter</h3>
                <p className="text-muted-foreground">
                  Choose a chapter from the sidebar to start learning
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContentView;