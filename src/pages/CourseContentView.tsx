import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, FileText, Download, ChevronRight, ChevronDown, Home, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

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
  content_type: 'video' | 'article' | 'document';
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
  const { getSectionsByCourse, getChaptersBySection } = useCourseContent();
  const { getCourses } = useCareerLevelProgram();

  useEffect(() => {
    if (courseId) {
      loadCourseData();
      loadCourseContent();
    }
  }, [courseId]);

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

  const handleMarkComplete = () => {
    if (selectedChapter) {
      setCompletedChapters(prev => new Set([...prev, selectedChapter.id]));
      // Here you could also save to database or local storage
      console.log('Chapter marked as complete:', selectedChapter.id);
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
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={chapter.title}
                  />
                </div>
                {chapter.description && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground">{chapter.description}</p>
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

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Content type not supported: {content_type}</p>
          </div>
        );
    }
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
          <UserProfileDropdown />
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 border-r bg-muted/20 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b bg-background">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{course?.title || 'Course Content'}</h3>
              <p className="text-sm text-muted-foreground">Navigate through sections and chapters</p>
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
                          } ${
                            completedChapters.has(chapter.id) 
                              ? 'bg-green-50 border-l-2 border-green-400' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(chapter.content_type)}
                            <span className="flex-1">{chapter.title}</span>
                            <div className="flex items-center gap-1">
                              {completedChapters.has(chapter.id) && (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              )}
                              {chapter.duration_minutes && (
                                <span className="text-xs text-muted-foreground">
                                  {chapter.duration_minutes}m
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
        <div className="flex-1 flex flex-col">
          {selectedChapter ? (
            <>
              {/* Chapter Content - Full Height */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-6">
                  {renderChapterContent(selectedChapter)}
                </ScrollArea>
                
                {/* Navigation Controls */}
                <div className="border-t bg-background p-6">
                  <div className="flex items-center justify-between max-w-4xl mx-auto">
                    {/* Previous Button */}
                    <div className="flex-1">
                      {getPreviousChapter() ? (
                        <Button
                          variant="outline"
                          onClick={() => setSelectedChapter(getPreviousChapter()!)}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      ) : (
                        <div /> // Empty div for spacing
                      )}
                    </div>

                    {/* Mark as Complete */}
                    <div className="flex-1 flex justify-center">
                      <Button
                        onClick={handleMarkComplete}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Complete
                      </Button>
                    </div>

                    {/* Next Button or Next Section */}
                    <div className="flex-1 flex justify-end">
                      {getNextChapter() ? (
                        <Button
                          onClick={() => setSelectedChapter(getNextChapter()!)}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : getNextSection() ? (
                        <Button
                          onClick={handleGoToNextSection}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          Go to Next Section
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          disabled
                          className="flex items-center gap-2"
                        >
                          Course Complete
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Chapter Info */}
                  <div className="text-center mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      {getContentTypeIcon(selectedChapter.content_type)}
                      <span>{selectedChapter.title}</span>
                      {selectedChapter.duration_minutes && (
                        <>
                          <span>•</span>
                          <span>{selectedChapter.duration_minutes} minutes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default CourseContentView;