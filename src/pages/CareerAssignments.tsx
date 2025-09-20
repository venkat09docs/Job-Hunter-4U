import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Home, Target, Trophy, Clock, FileText, Users, User, Github, 
  Copy, RefreshCw, Settings, Lock, History, Activity, Shield, Mail, BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { CareerTaskCard } from '@/components/CareerTaskCard';
import { useUserInputs } from '@/hooks/useUserInputs';
import { useCareerAssignments } from '@/hooks/useCareerAssignments';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useGitHubProgress } from '@/hooks/useGitHubProgress';
import { useProfile } from '@/hooks/useProfile';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChapterCompletion } from '@/hooks/useChapterCompletion';

interface SubCategory {
  id: string;
  name: string;
  description: string;
  parent_category: string;
  is_active: boolean;
  created_at: string;
}

const CareerAssignments = () => {
  const { canAccessFeature } = usePremiumFeatures();
  const { user } = useAuth();
  const { inputs, saveInput, getInput } = useUserInputs();
  const { profile } = useProfile();
  const { industry, isIT } = useUserIndustry();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  // Use the proper hook instead of local state
  const {
    assignments,
    evidence,
    templates,
    loading: isLoading,
    submittingEvidence,
    submitEvidence,
    updateAssignmentStatus,
    initializeUserWeek,
    getModuleProgress,
    getTasksByModule,
    refreshData
  } = useCareerAssignments();

  // Progress hooks for different modules
  const { completionPercentage: linkedinProgress } = useLinkedInProgress();
  const { getCompletionPercentage: getGitHubProgress } = useGitHubProgress();
  const { getCourseProgress } = useChapterCompletion();
  
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [resumeCourseProgress, setResumeCourseProgress] = useState<number>(0);
  const [linkedinCourseProgress, setLinkedInCourseProgress] = useState<number>(0);
  const [digitalProfileCourseProgress, setDigitalProfileCourseProgress] = useState<number>(0);
  const [githubCourseProgress, setGitHubCourseProgress] = useState<number>(0);
  
  // Stats
  const [totalPoints, setTotalPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  
  // Course IDs
  const RESUME_COURSE_ID = '3656d01b-f153-4480-8c69-28155b271077';
  // LinkedIn "Supercharge Your LinkedIn" course
  const LINKEDIN_COURSE_ID = 'f1f6a708-abd7-4b13-af1e-db854adf5445';
  // TODO: Replace with actual Digital Profile course ID from database (user will create this course)
  const DIGITAL_PROFILE_COURSE_ID = 'digital-profile-course-id-placeholder';
  // GitHub and Blog Management course
  const GITHUB_COURSE_ID = '33ea49c2-b87d-43bb-99d6-6133070da95e';

  const fetchResumeCourseProgress = async () => {
    try {
      console.log('🎓 Fetching resume course progress for course ID:', RESUME_COURSE_ID);
      const progress = await getCourseProgress(RESUME_COURSE_ID);
      console.log('🎓 Raw course progress response:', progress);
      setResumeCourseProgress(progress?.progress_percentage || 0);
      console.log('🎓 Resume course progress set to:', progress?.progress_percentage || 0);
    } catch (error) {
      console.error('🎓 Error fetching resume course progress:', error);
      setResumeCourseProgress(0);
    }
  };

  const fetchLinkedInCourseProgress = async () => {
    try {
      console.log('🎓 Fetching LinkedIn course progress for course ID:', LINKEDIN_COURSE_ID);
      const progress = await getCourseProgress(LINKEDIN_COURSE_ID);
      console.log('🎓 Raw LinkedIn course progress response:', progress);
      setLinkedInCourseProgress(progress?.progress_percentage || 0);
      console.log('🎓 LinkedIn course progress set to:', progress?.progress_percentage || 0);
    } catch (error) {
      console.error('🎓 Error fetching LinkedIn course progress:', error);
      setLinkedInCourseProgress(0);
    }
  };

  const fetchDigitalProfileCourseProgress = async () => {
    try {
      console.log('🎓 Fetching Digital Profile course progress for course ID:', DIGITAL_PROFILE_COURSE_ID);
      const progress = await getCourseProgress(DIGITAL_PROFILE_COURSE_ID);
      console.log('🎓 Raw Digital Profile course progress response:', progress);
      setDigitalProfileCourseProgress(progress?.progress_percentage || 0);
      console.log('🎓 Digital Profile course progress set to:', progress?.progress_percentage || 0);
    } catch (error) {
      console.error('🎓 Error fetching Digital Profile course progress:', error);
      setDigitalProfileCourseProgress(0);
    }
  };

  const fetchGitHubCourseProgress = async () => {
    try {
      console.log('🎓 Fetching GitHub course progress for course ID:', GITHUB_COURSE_ID);
      const progress = await getCourseProgress(GITHUB_COURSE_ID);
      console.log('🎓 Raw GitHub course progress response:', progress);
      setGitHubCourseProgress(progress?.progress_percentage || 0);
      console.log('🎓 GitHub course progress set to:', progress?.progress_percentage || 0);
    } catch (error) {
      console.error('🎓 Error fetching GitHub course progress:', error);
      setGitHubCourseProgress(0);
    }
  };

  // Fetch subcategories and course progress
  useEffect(() => {
    console.log('🔍 CareerAssignments useEffect triggered', { user: user?.id, hasUser: !!user });
    if (user && !isLoading) {
      // Only fetch subcategories after assignments are loaded
      fetchSubCategories();
      fetchResumeCourseProgress();
      fetchLinkedInCourseProgress();
      fetchDigitalProfileCourseProgress();
      fetchGitHubCourseProgress();
      setupRealtimeSubscription();
    }
  }, [user, isLoading]);
   
  const fetchSubCategories = async () => {
    try {
      console.log('🔍 Fetching subcategories...');
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('parent_category', 'profile')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('🔍 Subcategories loaded:', data?.length || 0);
      setSubCategories(data || []);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      // Don't show toast error for this as it's secondary data
    }
  };

  // Calculate stats when assignments change
  useEffect(() => {
    console.log('🔍 CareerAssignments stats calculation triggered', { assignmentsLength: assignments?.length || 0, isLoading });
    if (!isLoading && assignments && assignments.length > 0) {
      // Only count active profile-building tasks (tasks with sub_category_id)
      const profileTasks = assignments.filter(a => 
        a.career_task_templates?.sub_category_id
      );
      
      const completed = profileTasks.filter(a => a.status === 'verified').length;
      const points = assignments.reduce((sum, a) => sum + (a.points_earned || 0), 0);
      const maxPts = profileTasks.reduce((sum, a) => sum + (a.career_task_templates?.points_reward || 0), 0);
      
      console.log('🔍 Calculated stats:', { 
        totalAssignments: assignments.length,
        profileTasks: profileTasks.length,
        completed, 
        points, 
        maxPts 
      });
      setCompletedTasks(completed);
      setTotalPoints(points);
      setMaxPoints(maxPts);
    }
  }, [assignments, isLoading]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('profile-assignments-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_categories',
          filter: `parent_category=eq.profile`
        },
        () => {
          fetchSubCategories();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_templates'
        },
        () => {
          // Data will be refreshed by the hook
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_assignments',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          // Data will be refreshed by the hook
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'career_task_evidence'
        },
        (payload) => {
          console.log('🔍 Evidence changed, refreshing data...', payload);
          // Refresh assignments when evidence changes
          refreshData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'career_task_assignments'
        },
        (payload) => {
          console.log('🔍 Assignment status updated, refreshing data...', payload);
          // Refresh assignments when status changes (approved/rejected by admin)
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  const getTasksBySubCategory = (subCategoryId: string) => {
    console.log('getTasksBySubCategory called with:', subCategoryId);
    console.log('assignments available:', assignments?.length || 0);
    console.log('isLoading:', isLoading);
    
    // Return empty array if still loading or no assignments
    if (isLoading || !assignments || assignments.length === 0) {
      console.log('Returning empty - still loading or no assignments');
      return [];
    }
    
    // Filter assignments by sub_category_id from the related template
    const filtered = assignments
      .filter(assignment => {
        console.log('Checking assignment:', assignment.id, 'template sub_category_id:', assignment.career_task_templates?.sub_category_id);
        return assignment.career_task_templates?.sub_category_id === subCategoryId;
      });
    
    console.log('Filtered assignments:', filtered.length);
    
    return filtered
      .sort((a, b) => {
        console.log('Sorting assignments:', a.id, 'vs', b.id);
        // Sort by display_order if available, otherwise by created_at
        const orderA = a.career_task_templates?.display_order || 0;
        const orderB = b.career_task_templates?.display_order || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  };

  const getSubCategoryProgress = (subCategoryId: string) => {
    if (isLoading) return 0;
    const tasks = getTasksBySubCategory(subCategoryId);
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'verified').length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Helper function to check if a subcategory should be enabled
  const isSubCategoryEnabled = (subCategory: SubCategory) => {
    const categoryName = subCategory.name.toLowerCase();
    console.log('🎓 Checking if subcategory enabled:', categoryName, 'progress:', resumeCourseProgress);
    
    // Resume building requires course completion first
    if (categoryName.includes('resume')) {
      const enabled = resumeCourseProgress >= 100;
      console.log('🎓 Resume category enabled:', enabled);
      return enabled;
    }
    
    // Find Resume subcategory and check if it's completed
    const resumeSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('resume'));
    const resumeProgress = resumeSubCat ? getSubCategoryProgress(resumeSubCat.id) : 0;
    
    // LinkedIn profile requires Resume to be 100% complete AND LinkedIn course to be completed
    if (categoryName.includes('linkedin')) {
      const prerequisitesMet = resumeProgress >= 100 && linkedinCourseProgress >= 100;
      
      console.log('🔍 LinkedIn enablement check:', {
        categoryName,
        resumeProgress,
        linkedinCourseProgress,
        resumeCompleted: resumeProgress >= 100,
        courseCompleted: linkedinCourseProgress >= 100,
        prerequisitesMet,
        enabled: prerequisitesMet
      });
      
      return prerequisitesMet;
    }
    
    // Digital profile requires LinkedIn to be completed AND Digital Profile course to be completed
    if (categoryName.includes('digital')) {
      const linkedinSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('linkedin'));
      const linkedinProgress = linkedinSubCat ? getSubCategoryProgress(linkedinSubCat.id) : 0;
      
      const prerequisitesMet = linkedinProgress >= 100 && digitalProfileCourseProgress >= 100;
      
      console.log('🔍 Digital profile check:', {
        categoryName,
        prerequisitesMet,
        linkedinProgress,
        digitalProfileCourseProgress,
        profile: {
          subscription_active: profile?.subscription_active,
          subscription_plan: profile?.subscription_plan,
          hasProfile: !!profile
        }
      });
      
      // Digital profile is only available for 6-month or 1-year plans, not 3-month
      const hasValidSubscription = profile?.subscription_active && (
        profile?.subscription_plan === '6-month' || 
        profile?.subscription_plan === '1-year' ||
        profile?.subscription_plan?.includes('6-month') ||
        profile?.subscription_plan?.includes('1-year') ||
        profile?.subscription_plan?.includes('6 Months') ||
        profile?.subscription_plan?.includes('1 Year') ||
        profile?.subscription_plan?.includes('12 Months') ||
        (profile?.subscription_plan?.includes('Year') && !profile?.subscription_plan?.includes('3'))
      );
      // Explicitly exclude 3-month plans
      const isThreeMonthPlan = profile?.subscription_plan === '3-month' || 
                              profile?.subscription_plan?.includes('3-month') ||
                              profile?.subscription_plan?.includes('3 month') ||
                              profile?.subscription_plan?.includes('3 Months');
      
      console.log('🔍 Digital profile subscription check:', {
        hasValidSubscription,
        isThreeMonthPlan,
        finalResult: prerequisitesMet && hasValidSubscription && !isThreeMonthPlan
      });
      
      return prerequisitesMet && hasValidSubscription && !isThreeMonthPlan;
    }
    
    // GitHub profile requires LinkedIn to be completed AND GitHub course to be completed AND IT industry
    if (categoryName.includes('github')) {
      const linkedinSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('linkedin'));
      const linkedinProgress = linkedinSubCat ? getSubCategoryProgress(linkedinSubCat.id) : 0;
      
      const prerequisitesMet = linkedinProgress >= 100 && githubCourseProgress >= 100;
      return prerequisitesMet && isIT();
    }
    
    return true;
  };

  const getDisabledMessage = (subCategory: SubCategory) => {
    const categoryName = subCategory.name.toLowerCase();
    
    // Resume building requires course completion
    if (categoryName.includes('resume') && resumeCourseProgress < 100) {
      return 'Complete the "Build ATS Supported Resume" course first to unlock resume building tasks';
    }
    
    const resumeSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('resume'));
    const resumeProgress = resumeSubCat ? getSubCategoryProgress(resumeSubCat.id) : 0;
    
    if (categoryName.includes('linkedin')) {
      console.log('🔍 LinkedIn prerequisite check:', {
        resumeProgress,
        linkedinCourseProgress,
        resumeRequired: resumeProgress < 100,
        courseRequired: linkedinCourseProgress < 100
      });
      
      if (resumeProgress < 100) {
        return 'Complete Resume Building tasks first to unlock LinkedIn Profile';
      }
      if (linkedinCourseProgress < 100) {
        return 'Complete the "Supercharge Your LinkedIn" course first to unlock LinkedIn Profile tasks';
      }
    }
    
    if (categoryName.includes('digital')) {
      const linkedinSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('linkedin'));
      const linkedinProgress = linkedinSubCat ? getSubCategoryProgress(linkedinSubCat.id) : 0;
      
      if (linkedinProgress < 100) {
        return 'Complete LinkedIn Profile tasks first to unlock Digital Profile';
      }
      
      if (digitalProfileCourseProgress < 100) {
        return 'Complete the "Build Digital Profile" course first to unlock Digital Profile tasks';
      }
      
      // Check if user has 3-month plan (should be excluded)
      const isThreeMonthPlan = profile?.subscription_plan === '3-month' || 
                              profile?.subscription_plan?.includes('3-month') ||
                              profile?.subscription_plan?.includes('3 month');
      
      if (isThreeMonthPlan) {
        return 'Digital profile is only available for 6-month or 1-year subscription plans';
      }
      
      const hasValidSubscription = profile?.subscription_active && (
        profile?.subscription_plan === '6-month' || 
        profile?.subscription_plan === '1-year' ||
        profile?.subscription_plan?.includes('6-month') ||
        profile?.subscription_plan?.includes('1-year') ||
        profile?.subscription_plan?.includes('6 Months') ||
        profile?.subscription_plan?.includes('1 Year') ||
        profile?.subscription_plan?.includes('12 Months') ||
        (profile?.subscription_plan?.includes('Year') && !profile?.subscription_plan?.includes('3'))
      );
      
      if (!hasValidSubscription) {
        return 'Subscription is required either 6 months or 1 year plan for the digital profile';
      }
    }
    
    if (categoryName.includes('github')) {
      const linkedinSubCat = subCategories.find(sc => sc.name.toLowerCase().includes('linkedin'));
      const linkedinProgress = linkedinSubCat ? getSubCategoryProgress(linkedinSubCat.id) : 0;
      
      if (linkedinProgress < 100) {
        return 'Complete LinkedIn Profile tasks first to unlock GitHub Profile';
      }
      
      if (githubCourseProgress < 100) {
        return 'Complete the "GitHub and Blog Management" course first to unlock GitHub Profile tasks';
      }
      
      if (!isIT()) {
        return 'GitHub profile is available only for IT professionals';
      }
    }
    
    return 'Prerequisites not met';
  };

  const initializeSubCategoryTasks = async (subCategoryId: string) => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Get templates for this specific sub-category
      const subCategoryTemplates = templates.filter(t => t.sub_category_id === subCategoryId);
      
      if (subCategoryTemplates.length === 0) {
        toast.info('No templates found for this category');
        return;
      }

      let createdCount = 0;
      
      for (const template of subCategoryTemplates) {
        // Check if assignment already exists
        const existingAssignment = assignments.find(a => 
          a.template_id === template.id && a.user_id === user.id
        );
        
        if (!existingAssignment) {
          const { error } = await supabase
            .from('career_task_assignments')
            .insert({
              user_id: user.id,
              template_id: template.id,
              period: template.cadence === 'weekly' ? 
                new Date().toISOString().split('T')[0] : null,
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              week_start_date: new Date().toISOString().split('T')[0],
              status: 'assigned',
              points_earned: 0
            });
          
          if (error) throw error;
          createdCount++;
        }
      }
      
      if (createdCount > 0) {
        toast.success(`Initialized ${createdCount} tasks for this category`);
        // Data will be refreshed automatically by the hook
      } else {
        toast.info('All tasks in this category are already initialized');
      }
      
    } catch (error) {
      console.error('Error initializing sub-category tasks:', error);
      toast.error('Failed to initialize tasks for this category');
    }
  };

  // Functions are now provided by useCareerAssignments hook


  const handleInitialize = async () => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current ISO week
      const getISOWeek = (date: Date): string => {
        const year = date.getFullYear();
        const start = new Date(year, 0, 1);
        const diff = date.getTime() - start.getTime();
        const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
        return `${year}-W${week.toString().padStart(2, '0')}`;
      };

      const getWeekStartDate = (period: string): string => {
        const [year, week] = period.split('-W');
        const startOfYear = new Date(parseInt(year), 0, 1);
        const weekStart = new Date(startOfYear.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000);
        return weekStart.toISOString().split('T')[0];
      };

      const getWeekEndDate = (period: string): string => {
        const [year, week] = period.split('-W');
        const startOfYear = new Date(parseInt(year), 0, 1);
        const weekStart = new Date(startOfYear.getTime() + (parseInt(week) - 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        return weekEnd.toISOString();
      };

      const currentPeriod = getISOWeek(new Date());
      
      // Get weekly templates
      const weeklyTemplates = templates.filter(t => t.cadence === 'weekly');
      
      let createdCount = 0;
      
      // Create assignments for weekly tasks
      for (const template of weeklyTemplates) {
        // Check if assignment already exists
        const { data: existing } = await supabase
          .from('career_task_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .eq('period', currentPeriod)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase
            .from('career_task_assignments')
            .insert({
              user_id: user.id,
              template_id: template.id,
              period: currentPeriod,
              due_date: getWeekEndDate(currentPeriod),
              week_start_date: getWeekStartDate(currentPeriod),
              status: 'assigned',
              points_earned: 0
            });
          
          if (error) throw error;
          createdCount++;
        }
      }

      // Create assignments for one-off tasks that haven't been created yet
      const oneoffTemplates = templates.filter(t => t.cadence === 'oneoff');
      
      for (const template of oneoffTemplates) {
        // Check if assignment already exists (one-off tasks don't need period matching)
        const { data: existing } = await supabase
          .from('career_task_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('template_id', template.id)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await supabase
            .from('career_task_assignments')
            .insert({
              user_id: user.id,
              template_id: template.id,
              period: null, // One-off tasks don't have a period
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              week_start_date: new Date().toISOString().split('T')[0],
              status: 'assigned',
              points_earned: 0
            });
          
          if (error) throw error;
          createdCount++;
        }
      }
      
      if (createdCount > 0) {
        toast.success(`Created ${createdCount} new task assignments`);
      } else {
        toast.info('All tasks are already initialized');
      }
      
      // Data will be refreshed automatically by the hook
    } catch (error) {
      console.error('Error initializing tasks:', error);
      toast.error('Failed to initialize tasks');
    }
  };

  const handleVerify = async () => {
    if (!canAccessFeature("career_assignments")) return;
    
    try {
      // Call edge function to verify all assignments
      const response = await fetch(`https://moirryvajzyriagqihbe.supabase.co/functions/v1/verify-all-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user?.id })
      });

      if (!response.ok) throw new Error('Failed to verify assignments');
      
      toast.success('Assignments verified successfully');
      // Data will be refreshed automatically by the hook
    } catch (error) {
      console.error('Error verifying assignments:', error);
      toast.error('Failed to verify assignments');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Target className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Profile Assignments</h1>
              <p className="text-muted-foreground mt-2">
                {categoryFilter 
                  ? `Complete ${categoryFilter} tasks to build your professional profile`
                  : 'Complete tasks to build your professional profile'
                }
              </p>
            </div>
          </div>
          
          {/* Build Profile Button */}
          <Button 
            onClick={() => navigate('/dashboard/build-my-profile')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <User className="w-4 h-4 mr-2" />
            Build Profile
          </Button>
        </div>

        {/* Premium Feature Notice */}
        {!canAccessFeature("career_assignments") && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Premium Feature</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Career Assignments is available for premium subscribers. You can view the interface but cannot modify or submit tasks.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Boards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Progress Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              // Calculate digital portfolio progress based on profile completion
              const getDigitalProfileProgress = () => {
                if (!profile) return 0;
                
                 let completedFields = 0;
                 const totalFields = 7; // Basic fields to check
                
                 if (profile.full_name) completedFields++;
                 if (profile.username) completedFields++;
                 if (profile.profile_image_url) completedFields++;
                 if (profile.linkedin_url) completedFields++;
                 if (profile.github_url) completedFields++;
                 if (profile.subscription_plan) completedFields++;
                 if (profile.industry) completedFields++;
                
                return Math.round((completedFields / totalFields) * 100);
              };

              // Get tasks by sub-category name (matching the actual assignment tabs)
              const getTasksBySubCategoryName = (categoryName: string) => {
                if (isLoading) return [];
                const subCategory = subCategories.find(sc => 
                  sc.name.toLowerCase().includes(categoryName.toLowerCase())
                );
                return subCategory ? getTasksBySubCategory(subCategory.id) : [];
              };

              const getProgressBySubCategoryName = (categoryName: string) => {
                const subCategory = subCategories.find(sc => 
                  sc.name.toLowerCase().includes(categoryName.toLowerCase())
                );
                return subCategory ? getSubCategoryProgress(subCategory.id) : 0;
              };

              // Status board data using sub-category matching
              const statusBoards = [
                {
                  id: 'resume',
                  title: 'Resume Profile',
                  icon: User,
                  progress: getModuleProgress('RESUME'),
                  total: getTasksByModule('RESUME').length,
                  completed: getTasksByModule('RESUME').filter(task => task.status === 'verified').length,
                  color: 'bg-blue-500',
                  description: 'Build your professional resume'
                },
                {
                  id: 'linkedin',
                  title: 'LinkedIn Profile',
                  icon: Users,
                  progress: (() => {
                    const linkedinTasks = getTasksBySubCategoryName('linkedin');
                    return linkedinTasks.length > 0 
                      ? Math.round((linkedinTasks.filter(t => t.status === 'verified').length / linkedinTasks.length) * 100)
                      : 0;
                  })(),
                  total: getTasksBySubCategoryName('linkedin').length,
                  completed: getTasksBySubCategoryName('linkedin').filter(task => task.status === 'verified').length,
                  color: 'bg-blue-600',
                  description: 'Optimize your LinkedIn presence'
                },
                {
                  id: 'github',
                  title: 'GitHub Profile',
                  icon: Github,
                  progress: (() => {
                    const githubTasks = getTasksBySubCategoryName('github');
                    return githubTasks.length > 0 
                      ? Math.round((githubTasks.filter(t => t.status === 'verified').length / githubTasks.length) * 100)
                      : 0;
                  })(),
                  total: getTasksBySubCategoryName('github').length,
                  completed: getTasksBySubCategoryName('github').filter(task => task.status === 'verified').length,
                  color: 'bg-gray-800',
                  description: 'Showcase your coding projects'
                },
                {
                  id: 'digital',
                  title: 'Digital Portfolio',
                  icon: FileText,
                  progress: (() => {
                    const digitalTasks = getTasksBySubCategoryName('digital');
                    return digitalTasks.length > 0 
                      ? Math.round((digitalTasks.filter(t => t.status === 'verified').length / digitalTasks.length) * 100)
                      : 0;
                  })(),
                  total: getTasksBySubCategoryName('digital').length,
                  completed: getTasksBySubCategoryName('digital').filter(task => task.status === 'verified').length,
                  color: 'bg-purple-500',
                  description: 'Complete your online presence'
                }
              ];

              return statusBoards.map((board) => {
                const IconComponent = board.icon;
                return (
                  <Card key={board.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-200">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${board.color}`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${board.color} bg-opacity-10`}>
                            <IconComponent className={`h-4 w-4 ${board.color.replace('bg-', 'text-')}`} />
                          </div>
                          {board.title}
                        </CardTitle>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{board.progress}%</div>
                          <div className="text-xs text-muted-foreground">
                            {board.completed}/{board.total} tasks
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Progress value={board.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{board.description}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-2 py-1 rounded-full ${
                          board.progress >= 100 ? 'bg-green-100 text-green-800' :
                          board.progress >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {board.progress >= 100 ? 'Complete' : 
                           board.progress >= 50 ? 'In Progress' : 'Getting Started'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <Accordion type="multiple" className="space-y-4" defaultValue={categoryFilter ? [subCategories.find(sc => sc.name.toLowerCase().includes(categoryFilter))?.id].filter(Boolean) : []}>
                   {/* Dynamic Sub-Categories - Show all subcategories in assignments tab */}
                   {subCategories
                     .filter((subCategory) => {
                       // Hide digital profile subcategory for 3-month subscription users
                       const categoryName = subCategory.name.toLowerCase();
                       if (categoryName.includes('digital')) {
                         const isThreeMonthPlan = profile?.subscription_plan === '3-month' || 
                                                profile?.subscription_plan?.includes('3-month') ||
                                                profile?.subscription_plan?.includes('3 month');
                         if (isThreeMonthPlan) {
                           return false; // Hide digital profile for 3-month users
                         }
                       }
                       return true; // Show all other subcategories
                     })
                     .map((subCategory) => {
                     const categoryTasks = getTasksBySubCategory(subCategory.id);
                     const categoryProgress = getSubCategoryProgress(subCategory.id);
                     const isEnabled = isSubCategoryEnabled(subCategory);
                     const disabledMessage = !isEnabled ? getDisabledMessage(subCategory) : '';
                    
                     return (
                       <AccordionItem key={subCategory.id} value={subCategory.id} className={!isEnabled ? 'opacity-60' : ''}>
                         <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                           <div className="flex items-center justify-between w-full">
                             <div className="flex items-center gap-3">
                               {isEnabled ? (
                                 <Target className="w-5 h-5 text-primary" />
                               ) : (
                                 <Lock className="w-5 h-5 text-muted-foreground" />
                               )}
                               <span className={!isEnabled ? 'text-muted-foreground' : ''}>
                                 {subCategory.name} ({categoryTasks.length} tasks)
                               </span>
                               <Progress value={categoryProgress} className="w-24 h-2" />
                             </div>
                           </div>
                         </AccordionTrigger>
                         <AccordionContent className="space-y-4 pt-4">
                           {(() => {
                             const categoryName = subCategory.name.toLowerCase();
                             return !isEnabled ? (
                               <div className="text-center py-8 text-muted-foreground">
                                 {categoryName.includes('resume') && resumeCourseProgress < 100 ? (
                                   <>
                                     <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                     <p className="font-medium mb-2">Complete Course First</p>
                                     <p className="text-sm mb-4">{getDisabledMessage(subCategory)}</p>
                                     <div className="mb-4">
                                       <p className="text-xs mb-2">Course Progress: {Math.round(resumeCourseProgress)}%</p>
                                       <Progress value={resumeCourseProgress} className="w-48 mx-auto h-2" />
                                     </div>
                                       <Button 
                                         onClick={() => {
                                           console.log('🎓 Complete Course button clicked in accordion content');
                                           navigate('/course/3656d01b-f153-4480-8c69-28155b271077');
                                         }}
                                         className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                         size="lg"
                                       >
                                         <BookOpen className="w-4 h-4 mr-2" />
                                         Complete Course
                                       </Button>
                                   </>
                                 ) : (
                                   <>
                                     <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                     <p className="font-medium">{disabledMessage}</p>
                                   </>
                                 )}
                               </div>
                             ) : (
                               <>
                                 {categoryTasks.map(assignment => (
                                   <CareerTaskCard
                                     key={assignment.id}
                                     assignment={assignment}
                                     evidence={evidence.filter(e => e.assignment_id === assignment.id)}
                                     onSubmitEvidence={canAccessFeature("career_assignments") ? submitEvidence : () => {}}
                                     onUpdateStatus={canAccessFeature("career_assignments") ? updateAssignmentStatus : () => {}}
                                     isSubmitting={submittingEvidence}
                                   />
                                 ))}
                                 {categoryTasks.length === 0 && (
                                   <div className="text-center py-8 text-muted-foreground">
                                     <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                     <p>No {subCategory.name.toLowerCase()} tasks assigned yet</p>
                                     <Button 
                                       onClick={handleInitialize} 
                                       className="mt-3"
                                       disabled={!canAccessFeature("career_assignments")}
                                     >
                                       Initialize Tasks
                                       {!canAccessFeature("career_assignments") && <Lock className="w-4 h-4 ml-2" />}
                                     </Button>
                                   </div>
                                 )}
                               </>
                             );
                           })()}
                         </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                  
                  {/* Fallback for when no sub-categories exist */}
                  {subCategories.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Assignment Categories</h3>
                      <p className="mb-4">No sub-categories have been created yet. Contact your administrator to set up assignment categories.</p>
                    </div>
                  )}
                </Accordion>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weekly Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Weekly Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{totalPoints}</div>
                      <div className="text-sm text-muted-foreground">points earned</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {completedTasks}/{assignments.filter(a => 
                          a.career_task_templates?.sub_category_id
                        ).length} tasks completed
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Inputs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Quick Inputs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm">LinkedIn Profile URL</Label>
                      <Input
                        placeholder="https://linkedin.com/in/yourname"
                        value={getInput('linkedin_profile_url')}
                        onChange={(e) => saveInput('linkedin_profile_url', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">GitHub Username</Label>
                      <Input
                        placeholder="yourusername"
                        value={getInput('github_username')}
                        onChange={(e) => saveInput('github_username', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Target Role</Label>
                      <Input
                        placeholder="Software Engineer"
                        value={getInput('resume_target_role')}
                        onChange={(e) => saveInput('resume_target_role', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {evidence.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No activity yet</p>
                      </div>
                    ) : (
                        <div className="space-y-3">
                          {evidence.slice(0, 5).map(e => (
                            <div key={e.id} className="flex items-center gap-3 text-sm">
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {e.career_task_assignments?.career_task_templates?.title || 'Evidence submitted'}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {e.career_task_assignments?.career_task_templates?.category && (
                                    <span className="mr-2">
                                      {e.career_task_assignments.career_task_templates.category} •
                                    </span>
                                  )}
                                  {new Date(e.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                    )}
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Progress Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Points Progress</span>
                      <span>{totalPoints}/{maxPoints}</span>
                    </div>
                    <Progress value={maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0} />
                    
                     {subCategories.map((subCategory) => {
                       const progress = getSubCategoryProgress(subCategory.id);
                       const taskCount = getTasksBySubCategory(subCategory.id).length;
                      
                      return (
                        <div key={subCategory.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{subCategory.name}</span>
                            <span>{taskCount} tasks</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Assignment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
                      <p className="text-muted-foreground">
                        Complete some assignments to see your history here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignments.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{assignment.career_task_templates?.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.career_task_templates?.category} • {assignment.status.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{assignment.points_earned || 0} pts</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(assignment.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Automation Setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Forwarding Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Privacy Notice</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          We verify using forwarded emails and files you upload. No scraping. 
                          You can revoke access anytime.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Your Auto-Verify Email:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={`career.verify@yourdomain.com`}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('career.verify@yourdomain.com')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Forward LinkedIn notifications to this email for automatic verification
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub Webhook */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    GitHub Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">Webhook URL:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value="https://moirryvajzyriagqihbe.supabase.co/functions/v1/github-webhook"
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('https://moirryvajzyriagqihbe.supabase.co/functions/v1/github-webhook')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium">Webhook Secret:</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value="github_webhook_secret_123"
                        readOnly
                        className="font-mono text-sm"
                        type="password"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('github_webhook_secret_123')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>1. Go to your GitHub repo → Settings → Webhooks</p>
                    <p>2. Add webhook with URL above</p>
                    <p>3. Set content type to application/json</p>
                    <p>4. Add the secret above</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleVerify}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-verify All Tasks
                  </Button>
                  <Button variant="outline" onClick={() => {
                    // This would implement data deletion
                    toast.info('Data deletion functionality coming soon');
                  }}>
                    Delete My Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CareerAssignments;