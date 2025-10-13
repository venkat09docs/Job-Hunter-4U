import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CourseChapter {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'document' | 'checklist' | 'embed_code';
  content_data: any;
  video_url?: string;
  article_content?: string;
  duration_minutes?: number;
  order_index: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateSectionData {
  course_id: string;
  title: string;
  description?: string;
  order_index?: number;
}

interface CreateChapterData {
  section_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'document' | 'checklist' | 'embed_code';
  content_data?: any;
  video_url?: string;
  article_content?: string;
  duration_minutes?: number;
  order_index?: number;
}

export const useCourseContent = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Course Sections CRUD operations
  const createSection = async (data: CreateSectionData): Promise<CourseSection | null> => {
    try {
      setLoading(true);
      const { data: section, error } = await supabase
        .from('course_sections')
        .insert({
          ...data,
          order_index: data.order_index || 0,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section created successfully"
      });

      return section as CourseSection;
    } catch (error) {
      console.error('Error creating section:', error);
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSectionsByCourse = async (courseId: string): Promise<CourseSection[]> => {
    try {
      const { data, error } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sections:', error);
      return [];
    }
  };

  const updateSection = async (sectionId: string, data: Partial<CreateSectionData>): Promise<CourseSection | null> => {
    try {
      setLoading(true);
      const { data: section, error } = await supabase
        .from('course_sections')
        .update(data)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section updated successfully"
      });

      return section as CourseSection;
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSection = async (sectionId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('course_sections')
        .update({ is_active: false })
        .eq('id', sectionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Course Chapters CRUD operations
  const createChapter = async (data: CreateChapterData): Promise<CourseChapter | null> => {
    try {
      setLoading(true);
      const { data: chapter, error } = await supabase
        .from('course_chapters')
        .insert({
          ...data,
          order_index: data.order_index || 0,
          content_data: data.content_data || {},
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chapter created successfully"
      });

      return chapter as CourseChapter;
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast({
        title: "Error",
        description: "Failed to create chapter",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getChaptersBySection = async (sectionId: string): Promise<CourseChapter[]> => {
    try {
      const { data, error } = await supabase
        .from('course_chapters')
        .select('*')
        .eq('section_id', sectionId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return (data || []) as CourseChapter[];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  };

  const updateChapter = async (chapterId: string, data: Partial<CreateChapterData>): Promise<CourseChapter | null> => {
    try {
      setLoading(true);
      const { data: chapter, error } = await supabase
        .from('course_chapters')
        .update(data)
        .eq('id', chapterId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chapter updated successfully"
      });

      return chapter as CourseChapter;
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteChapter = async (chapterId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('course_chapters')
        .update({ is_active: false })
        .eq('id', chapterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chapter deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createSection,
    getSectionsByCourse,
    updateSection,
    deleteSection,
    createChapter,
    getChaptersBySection,
    updateChapter,
    deleteChapter
  };
};