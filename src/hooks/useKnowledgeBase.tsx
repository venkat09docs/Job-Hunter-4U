import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  description: string;
  duration?: string;
  instructor?: string;
  readTime?: string;
  lastUpdated?: string;
  thumbnail?: string;
  isPublished: boolean;
  categoryId: string;
  content?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
}

export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  description?: string;
  categoryType: 'video' | 'documentation';
  videos?: KnowledgeBaseItem[];
  docs?: KnowledgeBaseItem[];
  displayOrder?: number;
  isActive?: boolean;
}

export const useKnowledgeBase = () => {
  const [videoData, setVideoData] = useState<KnowledgeBaseCategory[]>([]);
  const [docData, setDocData] = useState<KnowledgeBaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('knowledge_base_categories' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('knowledge_base_items' as any)
        .select('*')
        .order('display_order');

      if (itemsError) throw itemsError;

      // Transform and group data
      const videoCategories: KnowledgeBaseCategory[] = [];
      const docCategories: KnowledgeBaseCategory[] = [];

      categories?.forEach((category: any) => {
        const categoryItems = items
          ?.filter((item: any) => item.category_id === category.id)
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            duration: item.duration || undefined,
            instructor: item.instructor || undefined,
            readTime: item.read_time || undefined,
            thumbnail: item.thumbnail_url || '/placeholder.svg',
            thumbnailUrl: item.thumbnail_url || '/placeholder.svg',
            isPublished: item.is_published,
            categoryId: item.category_id,
            content: item.content || undefined,
            videoUrl: item.video_url || undefined,
            displayOrder: item.display_order || 0
          })) || [];

        const transformedCategory: KnowledgeBaseCategory = {
          id: category.id,
          name: category.name,
          description: category.description || undefined,
          categoryType: category.category_type as 'video' | 'documentation',
          displayOrder: category.display_order || 0,
          isActive: category.is_active
        };

        if (category.category_type === 'video') {
          transformedCategory.videos = categoryItems;
          videoCategories.push(transformedCategory);
        } else {
          transformedCategory.docs = categoryItems;
          docCategories.push(transformedCategory);
        }
      });

      setVideoData(videoCategories);
      setDocData(docCategories);
    } catch (err) {
      console.error('Error fetching knowledge base data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      toast.error('Failed to load knowledge base content');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoPublishStatus = async (videoId: string, categoryId: string) => {
    try {
      // Find current status
      const currentItem = videoData
        .find(cat => cat.id === categoryId)
        ?.videos?.find(video => video.id === videoId);
      
      if (!currentItem) return;

      const newStatus = !currentItem.isPublished;

      // Update in database
      const { error } = await supabase
        .from('knowledge_base_items' as any)
        .update({ is_published: newStatus })
        .eq('id', videoId);

      if (error) throw error;

      // Update local state
      setVideoData(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            videos: category.videos?.map(video => 
              video.id === videoId 
                ? { ...video, isPublished: newStatus }
                : video
            )
          };
        }
        return category;
      }));

      toast.success(`Video ${newStatus ? 'published' : 'unpublished'} successfully`);
    } catch (err) {
      console.error('Error toggling video publish status:', err);
      toast.error('Failed to update video status');
    }
  };

  const toggleDocPublishStatus = async (docId: string, categoryId: string) => {
    try {
      // Find current status
      const currentItem = docData
        .find(cat => cat.id === categoryId)
        ?.docs?.find(doc => doc.id === docId);
      
      if (!currentItem) return;

      const newStatus = !currentItem.isPublished;

      // Update in database
      const { error } = await supabase
        .from('knowledge_base_items' as any)
        .update({ is_published: newStatus })
        .eq('id', docId);

      if (error) throw error;

      // Update local state
      setDocData(prev => prev.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            docs: category.docs?.map(doc => 
              doc.id === docId 
                ? { ...doc, isPublished: newStatus }
                : doc
            )
          };
        }
        return category;
      }));

      toast.success(`Documentation ${newStatus ? 'published' : 'unpublished'} successfully`);
    } catch (err) {
      console.error('Error toggling doc publish status:', err);
      toast.error('Failed to update documentation status');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    videoData,
    docData,
    toggleVideoPublishStatus,
    toggleDocPublishStatus,
    loading,
    error,
    refetch: fetchData
  };
};