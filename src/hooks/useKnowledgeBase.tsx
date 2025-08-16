import { useState } from "react";

export interface KnowledgeBaseItem {
  id: number;
  title: string;
  description: string;
  duration?: string;
  instructor?: string;
  readTime?: string;
  lastUpdated?: string;
  thumbnail?: string;
  isPublished: boolean;
}

export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  videos?: KnowledgeBaseItem[];
  docs?: KnowledgeBaseItem[];
}

// Temporary static data - will be replaced with database integration later
const videoCategories: KnowledgeBaseCategory[] = [
  {
    id: "career-development",
    name: "Career Development",
    videos: [
      {
        id: 1,
        title: "Building Your Professional Brand",
        description: "Learn how to create a strong professional brand that stands out in your industry.",
        duration: "12:45",
        instructor: "Sarah Johnson",
        thumbnail: "/placeholder.svg",
        isPublished: true
      },
      {
        id: 2,
        title: "Effective Networking Strategies",
        description: "Master the art of professional networking and build meaningful connections.",
        duration: "15:30",
        instructor: "Michael Chen",
        thumbnail: "/placeholder.svg",
        isPublished: true
      },
      {
        id: 3,
        title: "Resume Writing Best Practices",
        description: "Create compelling resumes that get noticed by recruiters and hiring managers.",
        duration: "18:20",
        instructor: "Lisa Rodriguez",
        thumbnail: "/placeholder.svg",
        isPublished: false
      }
    ]
  },
  {
    id: "interview-preparation",
    name: "Interview Preparation",
    videos: [
      {
        id: 4,
        title: "Behavioral Interview Preparation",
        description: "Master behavioral interviews with the STAR method and common question types.",
        duration: "22:15",
        instructor: "David Park",
        thumbnail: "/placeholder.svg",
        isPublished: true
      },
      {
        id: 5,
        title: "Technical Interview Strategies",
        description: "Prepare for technical interviews across various industries and roles.",
        duration: "28:45",
        instructor: "Jennifer Kim",
        thumbnail: "/placeholder.svg",
        isPublished: true
      }
    ]
  },
  {
    id: "linkedin-optimization",
    name: "LinkedIn Optimization",
    videos: [
      {
        id: 6,
        title: "LinkedIn Profile Optimization",
        description: "Optimize your LinkedIn profile to attract recruiters and opportunities.",
        duration: "16:30",
        instructor: "Alex Turner",
        thumbnail: "/placeholder.svg",
        isPublished: true
      },
      {
        id: 7,
        title: "LinkedIn Content Strategy",
        description: "Build your personal brand through strategic LinkedIn content creation.",
        duration: "20:45",
        instructor: "Maria Garcia",
        thumbnail: "/placeholder.svg",
        isPublished: false
      }
    ]
  }
];

const docCategories: KnowledgeBaseCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    docs: [
      {
        id: 1,
        title: "Complete Platform Setup Guide",
        description: "Everything you need to know to get started with your career growth journey.",
        readTime: "8 min read",
        lastUpdated: "2024-01-15",
        isPublished: true
      },
      {
        id: 2,
        title: "First-Time User Onboarding",
        description: "Step-by-step guide for new users to navigate the platform effectively.",
        readTime: "5 min read",
        lastUpdated: "2024-01-10",
        isPublished: true
      },
      {
        id: 3,
        title: "Understanding Your Dashboard",
        description: "Learn about all the features and metrics available on your main dashboard.",
        readTime: "6 min read",
        lastUpdated: "2024-01-08",
        isPublished: true
      },
      {
        id: 4,
        title: "Setting Up Your Profile Foundation",
        description: "Build a strong foundation for your professional profile from day one.",
        readTime: "12 min read",
        lastUpdated: "2024-01-05",
        isPublished: false
      },
      {
        id: 5,
        title: "Premium vs Free Features Overview",
        description: "Understand the difference between free and premium features to make informed decisions.",
        readTime: "4 min read",
        lastUpdated: "2024-01-12",
        isPublished: true
      },
      {
        id: 6,
        title: "Understanding the Points & Gamification System",
        description: "Learn how our points system works and how to maximize your progress.",
        readTime: "7 min read",
        lastUpdated: "2024-01-14",
        isPublished: true
      },
      {
        id: 7,
        title: "Quick Win Activities for New Users",
        description: "Get started with these easy activities that provide immediate value.",
        readTime: "10 min read",
        lastUpdated: "2024-01-11",
        isPublished: true
      },
      {
        id: 8,
        title: "Setting Your Career Goals & Timeline",
        description: "Define clear, achievable career goals and create a timeline for success.",
        readTime: "15 min read",
        lastUpdated: "2024-01-06",
        isPublished: false
      },
      {
        id: 9,
        title: "Connecting Your Professional Accounts",
        description: "Link your LinkedIn, GitHub, and other professional accounts for better tracking.",
        readTime: "6 min read",
        lastUpdated: "2024-01-09",
        isPublished: true
      },
      {
        id: 10,
        title: "Platform Navigation & Key Features Tour",
        description: "A comprehensive tour of all platform features and how to use them effectively.",
        readTime: "12 min read",
        lastUpdated: "2024-01-13",
        isPublished: true
      }
    ]
  }
];

export const useKnowledgeBase = () => {
  const [videoData, setVideoData] = useState(videoCategories);
  const [docData, setDocData] = useState(docCategories);

  const toggleVideoPublishStatus = (videoId: number, categoryId: string) => {
    setVideoData(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          videos: category.videos?.map(video => 
            video.id === videoId 
              ? { ...video, isPublished: !video.isPublished }
              : video
          )
        };
      }
      return category;
    }));
  };

  const toggleDocPublishStatus = (docId: number, categoryId: string) => {
    setDocData(prev => prev.map(category => {
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
    }));
  };

  return {
    videoData,
    docData,
    toggleVideoPublishStatus,
    toggleDocPublishStatus,
    loading: false,
    error: null
  };
};