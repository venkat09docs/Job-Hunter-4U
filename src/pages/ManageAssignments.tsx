import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Play } from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  points_reward?: number;
  points_base?: number;
  difficulty?: string;
  is_active?: boolean;
  active?: boolean;
  created_at: string;
  updated_at?: string;
  sub_category_id?: string;
  display_order?: number;
  source?: string; // Track which table this comes from
}

interface SubCategory {
  id: string;
  name: string;
  description: string;
  parent_category: string;
  is_active: boolean;
  created_at: string;
}

const MAIN_CATEGORIES = [
  { id: 'profile', name: 'Profile Assignments' },
  { id: 'linkedin', name: 'LinkedIn Growth Assignments' },
  { id: 'job_hunter', name: 'Job Hunter Assignments' },
  { id: 'github', name: 'GitHub Weekly' }
];

// Valid category values for career_task_templates (based on database constraint)
const VALID_PROFILE_CATEGORIES = [
  'linkedin_growth',
  'supabase_practice',
  'n8n_practice',
  'networking',
  'content_creation',
  'resume_building',
  'resume_optimization',
  'resume_management',
  'cover_letter',
  'interview_preparation'
];

export default function ManageAssignments() {
  const { isAdmin, loading } = useRole();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [isGeneratingInstructions, setIsGeneratingInstructions] = useState(false);

  // Form states
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    points_reward: 10,
    difficulty: 'medium',
    is_active: true,
    display_order: 0
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    description: '',
    parent_category: activeCategory,
    is_active: true
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeCategory]);

  useEffect(() => {
    // Reset sub-category filter when changing main category
    setSelectedSubCategory('all');
  }, [activeCategory]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchSubCategories()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      let data: Assignment[] = [];
      
      if (activeCategory === 'profile') {
        const { data: profileData, error } = await supabase
          .from('career_task_templates')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        data = (profileData || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          instructions: typeof item.instructions === 'string' ? item.instructions : JSON.stringify(item.instructions || ''),
          category: item.category,
          points_reward: item.points_reward,
          difficulty: item.difficulty,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          sub_category_id: item.sub_category_id,
          display_order: item.display_order
        }));
      } else if (activeCategory === 'linkedin') {
        const { data: linkedinData, error } = await supabase
          .from('linkedin_tasks')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        data = (linkedinData || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: item.code || 'general',
          points_reward: item.points_base,
          difficulty: 'medium',
          is_active: item.active || false,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.created_at || new Date().toISOString(),
          display_order: item.display_order
        }));
      } else if (activeCategory === 'job_hunter') {
        // Fetch both job hunting task templates and interview preparation tasks
        const [jobHunterResponse, interviewPrepResponse] = await Promise.all([
          supabase
            .from('job_hunting_task_templates')
            .select('*')
            .order('display_order', { ascending: true }),
          supabase
            .from('career_task_templates')
            .select('*')
            .eq('category', 'interview_preparation')
            .order('display_order', { ascending: true })
        ]);
        
        if (jobHunterResponse.error) throw jobHunterResponse.error;
        if (interviewPrepResponse.error) throw interviewPrepResponse.error;

        // Combine both datasets
        const jobHunterData = (jobHunterResponse.data || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          instructions: typeof item.instructions === 'string' ? item.instructions : JSON.stringify(item.instructions || ''),
          category: item.category,
          points_reward: item.points_reward,
          difficulty: item.difficulty,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          display_order: item.display_order,
          source: 'job_hunting_task_templates'
        }));

        const interviewPrepData = (interviewPrepResponse.data || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          instructions: typeof item.instructions === 'string' ? item.instructions : JSON.stringify(item.instructions || ''),
          category: item.category,
          points_reward: item.points_reward,
          difficulty: item.difficulty,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          display_order: item.display_order,
          source: 'career_task_templates'
        }));

        // Combine and sort by display_order
        data = [...jobHunterData, ...interviewPrepData].sort((a, b) => 
          (a.display_order || 0) - (b.display_order || 0)
        );
      } else if (activeCategory === 'github') {
        const { data: githubData, error } = await supabase
          .from('github_tasks')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        data = (githubData || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          category: item.scope || 'general',
          points_reward: item.points_base,
          difficulty: 'medium',
          is_active: item.active || false,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at,
          display_order: item.display_order
        }));
      }
      
      setAssignments(data);
    } catch (error) {
      throw error;
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('*')
        .eq('parent_category', activeCategory)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubCategories(data || []);
    } catch (error) {
      console.error('Error fetching sub categories:', error);
      toast.error('Failed to load sub categories');
    }
  };

  const handleSaveAssignment = async () => {
    try {
      if (editingAssignment) {
        // Update existing assignment
        if (activeCategory === 'profile') {
          // Get the selected sub-category and map it to a valid category value for updates too
          const selectedSubCategory = subCategories.find(sc => sc.id === assignmentForm.category);
          const categoryValue = selectedSubCategory?.name.toLowerCase().replace(/\s+/g, '_') || 'networking';
          
          // Ensure the category value is valid according to database constraint
          const validCategory = VALID_PROFILE_CATEGORIES.includes(categoryValue) ? categoryValue : 'networking';
          
          const { error } = await supabase
            .from('career_task_templates')
            .update({
              title: assignmentForm.title,
              description: assignmentForm.description,
              instructions: assignmentForm.instructions,
              category: validCategory, // Use mapped valid category
              sub_category_id: assignmentForm.category, // Store sub-category ID
              points_reward: assignmentForm.points_reward,
              difficulty: assignmentForm.difficulty,
              is_active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingAssignment.id);
          
          if (error) throw error;
        } else if (activeCategory === 'linkedin') {
          // Generate unique code from title
          const uniqueCode = assignmentForm.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 30) + '_' + Date.now();
            
          const { error } = await supabase
            .from('linkedin_tasks')
            .update({
              title: assignmentForm.title,
              description: assignmentForm.description,
              code: uniqueCode,
              points_base: assignmentForm.points_reward,
              active: assignmentForm.is_active,
              display_order: assignmentForm.display_order
            })
            .eq('id', editingAssignment.id);
          
          if (error) throw error;
        } else if (activeCategory === 'job_hunter') {
          // Determine which table to update based on source or category
          const isInterviewPrep = editingAssignment.source === 'career_task_templates' || 
                                  editingAssignment.category === 'interview_preparation';
          
          if (isInterviewPrep) {
            // Update interview preparation assignment in career_task_templates
            const { error } = await supabase
              .from('career_task_templates')
              .update({
                title: assignmentForm.title,
                description: assignmentForm.description,
                instructions: assignmentForm.instructions,
                category: 'interview_preparation', // Keep as interview_preparation
                points_reward: assignmentForm.points_reward,
                difficulty: assignmentForm.difficulty,
                is_active: assignmentForm.is_active,
                display_order: assignmentForm.display_order,
                updated_at: new Date().toISOString()
              })
              .eq('id', editingAssignment.id);
            
            if (error) throw error;
          } else {
            // Update regular job hunter assignment
            const { error } = await supabase
              .from('job_hunting_task_templates')
              .update({
                title: assignmentForm.title,
                description: assignmentForm.description,
                instructions: assignmentForm.instructions,
                category: assignmentForm.category,
                points_reward: assignmentForm.points_reward,
                difficulty: assignmentForm.difficulty,
                is_active: assignmentForm.is_active,
                display_order: assignmentForm.display_order,
                updated_at: new Date().toISOString()
              })
              .eq('id', editingAssignment.id);
            
            if (error) throw error;
          }
        } else if (activeCategory === 'github') {
          const { error } = await supabase
            .from('github_tasks')
            .update({
              title: assignmentForm.title,
              description: assignmentForm.description,
              scope: assignmentForm.category,
              points_base: assignmentForm.points_reward,
              active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingAssignment.id);
          
          if (error) throw error;
        }
        
        toast.success('Assignment updated successfully');
      } else {
        // Create new assignment
        if (activeCategory === 'profile') {
          // Get the selected sub-category and map it to a valid category value
          const selectedSubCategory = subCategories.find(sc => sc.id === assignmentForm.category);
          const categoryValue = selectedSubCategory?.name.toLowerCase().replace(/\s+/g, '_') || 'networking';
          
          // Ensure the category value is valid according to database constraint
          const validCategory = VALID_PROFILE_CATEGORIES.includes(categoryValue) ? categoryValue : 'networking';
          
          const { error } = await supabase
            .from('career_task_templates')
            .insert({
              title: assignmentForm.title,
              description: assignmentForm.description,
              category: validCategory, // Use mapped valid category
              sub_category_id: assignmentForm.category, // Store sub-category ID
              points_reward: assignmentForm.points_reward,
              difficulty: assignmentForm.difficulty,
              is_active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              estimated_duration: 30,
              evidence_types: ['url', 'screenshot'],
              instructions: assignmentForm.instructions,
              verification_criteria: {}
            });
          
          if (error) throw error;
        } else if (activeCategory === 'linkedin') {
          // Generate unique code from title
          const uniqueCode = assignmentForm.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 30) + '_' + Date.now();
            
          const { error } = await supabase
            .from('linkedin_tasks')
            .insert({
              title: assignmentForm.title,
              description: assignmentForm.description,
              code: uniqueCode,
              points_base: assignmentForm.points_reward,
              active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              evidence_types: ['URL_REQUIRED']
            });
          
          if (error) throw error;
        } else if (activeCategory === 'job_hunter') {
          const { error } = await supabase
            .from('job_hunting_task_templates')
            .insert({
              title: assignmentForm.title,
              description: assignmentForm.description,
              category: assignmentForm.category,
              points_reward: assignmentForm.points_reward,
              difficulty: assignmentForm.difficulty,
              is_active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              estimated_duration: 30,
              evidence_types: ['url', 'screenshot'],
              instructions: assignmentForm.instructions,
              verification_criteria: {}
            });
          
          if (error) throw error;
        } else if (activeCategory === 'github') {
          const { error } = await supabase
            .from('github_tasks')
            .insert({
              title: assignmentForm.title,
              description: assignmentForm.description,
              scope: assignmentForm.category,
              points_base: assignmentForm.points_reward,
              active: assignmentForm.is_active,
              display_order: assignmentForm.display_order,
              code: assignmentForm.title.toLowerCase().replace(/\s+/g, '_'),
              evidence_types: ['URL_REQUIRED']
            });
          
          if (error) throw error;
        }
        
        toast.success('Assignment created successfully');
      }

      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      if (activeCategory === 'profile') {
        const { error } = await supabase
          .from('career_task_templates')
          .delete()
          .eq('id', assignmentId);
        
        if (error) throw error;
      } else if (activeCategory === 'linkedin') {
        // First delete all related linkedin_user_tasks
        const { error: userTasksError } = await supabase
          .from('linkedin_user_tasks')
          .delete()
          .eq('task_id', assignmentId);
        
        if (userTasksError) throw userTasksError;
        
        // Then delete the linkedin_tasks record
        const { error } = await supabase
          .from('linkedin_tasks')
          .delete()
          .eq('id', assignmentId);
        
        if (error) throw error;
      } else if (activeCategory === 'job_hunter') {
        // Determine which table to delete from based on the assignment
        const assignmentToDelete = assignments.find(a => a.id === assignmentId);
        const isInterviewPrep = assignmentToDelete?.source === 'career_task_templates' || 
                                assignmentToDelete?.category === 'interview_preparation';
        
        if (isInterviewPrep) {
          // Delete interview preparation assignment from career_task_templates
          const { error } = await supabase
            .from('career_task_templates')
            .delete()
            .eq('id', assignmentId);
          
          if (error) throw error;
        } else {
          // Delete regular job hunter assignment
          const { error } = await supabase
            .from('job_hunting_task_templates')
            .delete()
            .eq('id', assignmentId);
          
          if (error) throw error;
        }
      } else if (activeCategory === 'github') {
        const { error } = await supabase
          .from('github_tasks')
          .delete()
          .eq('id', assignmentId);
        
        if (error) throw error;
      }
      
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const handleGenerateInstructions = async () => {
    if (!assignmentForm.title || !assignmentForm.description) {
      toast.error('Please enter both title and description before generating instructions');
      return;
    }

    setIsGeneratingInstructions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-assignment-instructions', {
        body: {
          title: assignmentForm.title,
          description: assignmentForm.description
        }
      });

      if (error) {
        console.error('Error generating instructions:', error);
        toast.error('Failed to generate instructions');
        return;
      }

      if (data?.instructions) {
        setAssignmentForm({ ...assignmentForm, instructions: data.instructions });
        toast.success('Instructions generated successfully!');
      } else {
        toast.error('No instructions were generated');
      }
    } catch (error) {
      console.error('Error generating instructions:', error);
      toast.error('Failed to generate instructions');
    } finally {
      setIsGeneratingInstructions(false);
    }
  };


  const resetForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      instructions: '',
      category: '',
      points_reward: 10,
      difficulty: 'medium',
      is_active: true,
      display_order: 0
    });
    setEditingAssignment(null);
    setShowAddAssignment(false);
  };

  const startEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || '',
      category: activeCategory === 'profile' ? (assignment.sub_category_id || '') : assignment.category, // Use sub_category_id for profile assignments
      points_reward: assignment.points_reward || 10,
      difficulty: assignment.difficulty || 'medium',
      is_active: assignment.is_active,
      display_order: assignment.display_order || 0
    });
    setShowAddAssignment(true);
  };

  const startEditSubCategory = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name,
      description: subCategory.description,
      parent_category: subCategory.parent_category,
      is_active: subCategory.is_active
    });
    setShowAddSubCategory(true);
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    if (window.confirm('Are you sure you want to delete this sub category?')) {
      try {
        const { error } = await supabase
          .from('sub_categories')
          .update({ is_active: false })
          .eq('id', subCategoryId);

        if (error) throw error;
        
        // Refresh the data
        await fetchSubCategories();
        toast.success('Sub category deleted successfully');
      } catch (error) {
        console.error('Error deleting sub category:', error);
        toast.error('Failed to delete sub category');
      }
    }
  };

  const handleSaveSubCategory = async () => {
    try {
      if (editingSubCategory) {
        // Update existing sub category
        const { error } = await supabase
          .from('sub_categories')
          .update({
            name: subCategoryForm.name,
            description: subCategoryForm.description,
            is_active: subCategoryForm.is_active,
          })
          .eq('id', editingSubCategory.id);

        if (error) throw error;
        toast.success('Sub category updated successfully');
      } else {
        // Create new sub category
        const { error } = await supabase
          .from('sub_categories')
          .insert({
            name: subCategoryForm.name,
            description: subCategoryForm.description,
            parent_category: activeCategory,
            is_active: subCategoryForm.is_active,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast.success('Sub category created successfully');
      }
      
      // Refresh the data
      await fetchSubCategories();
      resetSubCategoryForm();
    } catch (error) {
      console.error('Error saving sub category:', error);
      toast.error('Failed to save sub category');
    }
  };

  const resetSubCategoryForm = () => {
    setSubCategoryForm({
      name: '',
      description: '',
      parent_category: activeCategory,
      is_active: true
    });
    setEditingSubCategory(null);
    setShowAddSubCategory(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-2xl font-bold">Manage Assignments</h1>
              <p className="text-muted-foreground">
                Create and manage assignments across all categories
              </p>
            </div>
            <UserProfileDropdown />
          </div>
        </div>

        <div className="container mx-auto p-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              {MAIN_CATEGORIES.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {MAIN_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                  <div className="flex gap-2">
                    {/* Only show "Add Sub Category" for non-LinkedIn assignments */}
                    {activeCategory !== 'linkedin' && (
                      <Button onClick={() => {
                        resetSubCategoryForm();
                        setShowAddSubCategory(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sub Category
                      </Button>
                    )}
                    <Button onClick={() => setShowAddAssignment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Assignment
                    </Button>
                  </div>
                </div>

                {/* Sub Categories Section - Only show for non-LinkedIn assignments */}
                {activeCategory !== 'linkedin' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sub Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {subCategories.map((subCategory) => (
                          <div key={subCategory.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{subCategory.name}</h4>
                              <Badge variant={subCategory.is_active ? "default" : "secondary"}>
                                {subCategory.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {subCategory.description}
                            </p>
                             <div className="flex gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => startEditSubCategory(subCategory)}
                               >
                                 <Edit className="h-3 w-3" />
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => handleDeleteSubCategory(subCategory.id)}
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                          </div>
                        ))}
                        {subCategories.length === 0 && (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            No sub categories found. Create one to get started.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assignments Section */}
                <Card>
                   <CardHeader>
                     <div className="flex justify-between items-center">
                       <CardTitle>Assignments</CardTitle>
                       {/* Show subcategory filter only for job_hunter */}
                       {activeCategory === 'job_hunter' && subCategories.length > 0 && (
                         <div className="flex items-center gap-2">
                           <Label htmlFor="subcategory-filter" className="text-sm font-medium">Filter by:</Label>
                           <Select
                             value={selectedSubCategory}
                             onValueChange={setSelectedSubCategory}
                           >
                             <SelectTrigger className="w-[180px]">
                               <SelectValue placeholder="All Categories" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Categories</SelectItem>
                               {subCategories.map((subCategory) => (
                                 <SelectItem key={subCategory.id} value={subCategory.id}>
                                   {subCategory.name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       )}
                     </div>
                   </CardHeader>
                   <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading assignments...</p>
                      </div>
                    ) : (
                       <div className="space-y-4">
                         {assignments
                           .filter(assignment => {
                             // Filter by selected subcategory for job_hunter
                             if (activeCategory === 'job_hunter' && selectedSubCategory !== 'all') {
                               return assignment.sub_category_id === selectedSubCategory;
                             }
                             return true;
                           })
                           .map((assignment) => (
                            <div key={assignment.id} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{assignment.title}</h4>
                                    {assignment.category === 'interview_preparation' && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        Interview Prep
                                      </Badge>
                                    )}
                                    {/* Show subcategory badge for job_hunter assignments */}
                                    {activeCategory === 'job_hunter' && assignment.sub_category_id && (
                                      <Badge variant="secondary" className="text-xs">
                                        {subCategories.find(sc => sc.id === assignment.sub_category_id)?.name || 'Uncategorized'}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {assignment.description}
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    <Badge variant="outline">{assignment.category}</Badge>
                                    {assignment.points_reward && (
                                      <Badge variant="secondary">{assignment.points_reward} pts</Badge>
                                    )}
                                    {assignment.difficulty && (
                                      <Badge variant="outline">{assignment.difficulty}</Badge>
                                    )}
                                    <Badge variant={assignment.is_active ? "default" : "secondary"}>
                                      {assignment.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    {assignment.source && (
                                      <Badge variant="outline" className="text-xs">
                                        {assignment.source === 'career_task_templates' ? 'Career Tasks' : 'Job Hunter Tasks'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => startEditAssignment(assignment)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                         ))}
                         {assignments
                           .filter(assignment => {
                             if (activeCategory === 'job_hunter' && selectedSubCategory !== 'all') {
                               return assignment.sub_category_id === selectedSubCategory;
                             }
                             return true;
                           }).length === 0 && (
                           <div className="text-center py-8 text-muted-foreground">
                             {selectedSubCategory !== 'all' ? 'No assignments found in this category.' : 'No assignments found. Create one to get started.'}
                           </div>
                         )}
                       </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Assignment Form Dialog */}
        <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="Enter assignment title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Enter assignment description"
                  rows={3}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateInstructions}
                    disabled={isGeneratingInstructions || !assignmentForm.title || !assignmentForm.description}
                    className="h-8"
                  >
                    {isGeneratingInstructions ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      'Generate Instructions'
                    )}
                  </Button>
                </div>
                <Textarea
                  id="instructions"
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  placeholder="Enter step-by-step instructions for users (use bullet points with •)"
                  rows={4}
                />
              </div>
              
              <div className={`grid ${activeCategory === 'linkedin' ? 'grid-cols-2' : 'grid-cols-2'} gap-4`}>
                {/* Only show category selector for non-LinkedIn assignments */}
                {activeCategory !== 'linkedin' && (
                  <div>
                    <Label htmlFor="category">
                      {activeCategory === 'profile' ? 'Sub-Category' : 'Category (Sub Category)'}
                    </Label>
                    <Select
                      value={assignmentForm.category}
                      onValueChange={(value) => setAssignmentForm({ ...assignmentForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          activeCategory === 'profile' ? 'Select a sub-category' : 'Select a sub category'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCategory === 'profile' ? (
                          // Show sub-categories for profile assignments
                          subCategories.length > 0 ? (
                            subCategories.map((subCategory) => (
                              <SelectItem key={subCategory.id} value={subCategory.id}>
                                {subCategory.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-categories" disabled>
                              No sub categories available
                            </SelectItem>
                          )
                        ) : (
                          // Show sub-categories for other tabs
                          subCategories.length > 0 ? (
                            subCategories.map((subCategory) => (
                              <SelectItem key={subCategory.id} value={subCategory.id}>
                                {subCategory.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-categories" disabled>
                              No sub categories available
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    value={assignmentForm.points_reward}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, points_reward: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={assignmentForm.display_order}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, display_order: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={assignmentForm.difficulty}
                    onValueChange={(value) => setAssignmentForm({ ...assignmentForm, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="active">Status</Label>
                  <Select
                    value={assignmentForm.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setAssignmentForm({ ...assignmentForm, is_active: value === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveAssignment}>
                <Save className="h-4 w-4 mr-2" />
                {editingAssignment ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sub Category Form Dialog */}
        <Dialog open={showAddSubCategory} onOpenChange={setShowAddSubCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubCategory ? 'Edit Sub Category' : 'Add New Sub Category'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="subcat-name">Name</Label>
                <Input
                  id="subcat-name"
                  value={subCategoryForm.name}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                  placeholder="Enter sub category name"
                />
              </div>
              
              <div>
                <Label htmlFor="subcat-description">Description</Label>
                <Textarea
                  id="subcat-description"
                  value={subCategoryForm.description}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                  placeholder="Enter sub category description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={resetSubCategoryForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveSubCategory}>
                <Save className="h-4 w-4 mr-2" />
                {editingSubCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}