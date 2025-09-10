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
  content?: string;
  categoryId?: string;
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

      const documentationCategories: KnowledgeBaseCategory[] = [
        {
          id: 'job-hunting',
          name: 'Job Hunting Assignments',
          description: 'Complete job hunting assignments with daily and weekly tasks plus points system',
          categoryType: 'documentation',
          displayOrder: 1,
          isActive: true,
          docs: [
            {
              id: 'job-hunting-complete-guide',
              title: 'Job Hunting Assignments - Complete Guide',
              description: 'Master job hunting with structured daily and weekly assignments, application tracking, and comprehensive points system',
              readTime: '30 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'job-hunting',
              displayOrder: 1,
              content: 'Complete guide for job hunting assignments with daily tasks, weekly goals, and points system for tracking progress.'
            }
          ]
        },
        {
          id: 'linkedin-growth',
          name: 'LinkedIn Growth',
          description: 'Grow your LinkedIn network and professional presence with daily and weekly assignments',
          categoryType: 'documentation',
          displayOrder: 3,
          isActive: true,
          docs: [
            {
              id: 'linkedin-growth-complete-guide',
              title: 'LinkedIn Growth Assignments - Complete Guide',
              description: 'Build your professional network and establish thought leadership through structured LinkedIn activities',
              readTime: '35 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'linkedin-growth',
              displayOrder: 1,
              content: 'Comprehensive guide for LinkedIn growth with networking strategies, content creation, and engagement tactics.'
            }
          ]
        },
        {
          id: 'github-weekly',
          name: 'GitHub Weekly Assignments',
          description: 'Complete GitHub development assignments with daily commits and weekly project goals',
          categoryType: 'documentation',
          displayOrder: 5,
          isActive: true,
          docs: [
            {
              id: 'github-weekly-complete-guide',
              title: 'GitHub Weekly Assignments - Complete Guide',
              description: 'Master GitHub development with structured weekly assignments and daily coding tasks',
              readTime: '45 min read',
              lastUpdated: '1 day ago',
              isPublished: true,
              categoryId: 'github-weekly',
              displayOrder: 1,
              content: 'Step-by-step guide for GitHub weekly assignments including project development and contribution strategies.'
            }
          ]
        }
      ];

      setDocData(documentationCategories);
    } catch (err) {
      console.error('Error fetching knowledge base data:', err);
      setError('Failed to load knowledge base data');
      toast.error('Failed to load knowledge base data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleDocPublishStatus = (docId: string, categoryId: string) => {
    setDocData(prevData => 
      prevData.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            docs: category.docs?.map(doc => 
              doc.id === docId 
                ? { ...doc, isPublished: !doc.isPublished }
                : doc
            )
          };
        }
        return category;
      })
    );
  };

  const getDocumentById = (docId: string): KnowledgeBaseItem | undefined => {
    for (const category of docData) {
      const doc = category.docs?.find(d => d.id === docId);
      if (doc) return doc;
    }
    return undefined;
  };

  return {
    videoData,
    docData,
    loading,
    error,
    toggleDocPublishStatus,
    getDocumentById,
    refetch: fetchData
  };
};