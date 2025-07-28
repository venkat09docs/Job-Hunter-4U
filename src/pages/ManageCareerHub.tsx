import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAITools } from '@/hooks/useAITools';
import { useProfile } from '@/hooks/useProfile';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Tag, Folder } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface ToolForm {
  tool_name: string;
  tool_description: string;
  embed_code: string;
  credit_points: number;
  is_active: boolean;
  image_url?: string;
  category_id?: string;
}

interface CategoryForm {
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

const ManageCareerHub = () => {
  const { role, loading: roleLoading } = useRole();
  const { profile } = useProfile();
  const { 
    tools, 
    categories, 
    loading: toolsLoading, 
    categoriesLoading,
    createTool, 
    updateTool, 
    deleteTool,
    createCategory,
    updateCategory,
    deleteCategory
  } = useAITools();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [formData, setFormData] = useState<ToolForm>({
    tool_name: '',
    tool_description: '',
    embed_code: '',
    credit_points: 1,
    is_active: true,
    image_url: '',
    category_id: ''
  });
  
  const [categoryFormData, setCategoryFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });
  
  const [isExtractingInfo, setIsExtractingInfo] = useState(false);

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const extractToolInfo = async (embedCode: string) => {
    if (!embedCode.trim()) return;
    
    setIsExtractingInfo(true);
    try {
      // Extract URL from embed code (looking for src attribute)
      const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
      if (!srcMatch) {
        toast({
          title: 'Info',
          description: 'Could not extract URL from embed code. Please fill tool name and description manually.',
          variant: 'default'
        });
        return;
      }

      const url = srcMatch[1];
      
      // Simple extraction based on URL patterns
      if (url.includes('formwise.ai')) {
        // Extract potential tool name from URL
        const urlParts = new URL(url).pathname.split('/');
        const potentialName = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        
        if (potentialName && potentialName !== 'form') {
          setFormData(prev => ({
            ...prev,
            tool_name: potentialName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            tool_description: `AI tool powered by Formwise.ai`
          }));
        }
      } else {
        // For other domains, try to extract from hostname
        const hostname = new URL(url).hostname;
        const domain = hostname.replace('www.', '').split('.')[0];
        
        setFormData(prev => ({
          ...prev,
          tool_name: domain.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Tool',
          tool_description: `AI tool from ${hostname}`
        }));
      }
      
      toast({
        title: 'Info Extracted',
        description: 'Tool information has been extracted from the embed code.',
      });
      
    } catch (error) {
      console.error('Error extracting tool info:', error);
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract tool information. Please fill manually.',
        variant: 'destructive'
      });
    } finally {
      setIsExtractingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTool) {
        await updateTool(editingTool.id, formData);
      } else {
        await createTool(formData);
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData);
      } else {
        await createCategory(categoryFormData);
      }
      
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      tool_name: '',
      tool_description: '',
      embed_code: '',
      credit_points: 1,
      is_active: true,
      image_url: '',
      category_id: ''
    });
    setEditingTool(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      display_order: categories.length,
      is_active: true
    });
    setEditingCategory(null);
  };

  const handleEdit = (tool: any) => {
    setEditingTool(tool);
    setFormData({
      tool_name: tool.tool_name,
      tool_description: tool.tool_description || '',
      embed_code: tool.embed_code,
      credit_points: tool.credit_points,
      is_active: tool.is_active,
      image_url: tool.image_url || '',
      category_id: tool.category_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async (toolId: string) => {
    try {
      await deleteTool(toolId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Menu */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Manage Career Hub</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {profile?.tokens_remaining || 0} Credits
            </Badge>
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Digital Career Hub Management</h2>
          <p className="text-muted-foreground">Manage AI tools and categories available in the Digital Career Hub</p>
        </div>

        <Tabs defaultValue="tools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* AI Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">AI Tools</h3>
                <p className="text-sm text-muted-foreground">Manage individual AI tools</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Tool
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingTool ? 'Edit AI Tool' : 'Add New AI Tool'}</DialogTitle>
                    <DialogDescription>
                      {editingTool ? 'Update the AI tool details below.' : 'Add a new AI tool to the Digital Career Hub.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="embed_code">Embed Code</Label>
                      <Textarea
                        id="embed_code"
                        value={formData.embed_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, embed_code: e.target.value }))}
                        placeholder="Paste the embed code (iframe) here..."
                        className="min-h-[100px]"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => extractToolInfo(formData.embed_code)}
                        disabled={!formData.embed_code.trim() || isExtractingInfo}
                      >
                        {isExtractingInfo ? 'Extracting...' : 'Extract Tool Info'}
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Tool Image URL (Optional)</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="Enter image URL for the tool"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tool_name">Tool Name</Label>
                        <Input
                          id="tool_name"
                          value={formData.tool_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, tool_name: e.target.value }))}
                          placeholder="Enter tool name"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="credit_points">Credit Points</Label>
                        <Input
                          id="credit_points"
                          type="number"
                          min="1"
                          value={formData.credit_points}
                          onChange={(e) => setFormData(prev => ({ ...prev, credit_points: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tool_description">Tool Description</Label>
                      <Textarea
                        id="tool_description"
                        value={formData.tool_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, tool_description: e.target.value }))}
                        placeholder="Enter tool description"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active (visible to users)</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingTool ? 'Update Tool' : 'Create Tool'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {toolsLoading ? (
              <div className="text-center py-8">Loading tools...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                  const category = categories.find(cat => cat.id === tool.category_id);
                  return (
                    <Card key={tool.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                            <CardDescription className="mt-1">
                              {tool.tool_description || 'No description available'}
                            </CardDescription>
                          </div>
                          <Badge variant={tool.is_active ? 'default' : 'secondary'}>
                            {tool.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {category && (
                          <Badge variant="outline" className="w-fit mt-2">
                            {category.name}
                          </Badge>
                        )}
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Credit Points: <span className="font-semibold">{tool.credit_points}</span></p>
                          <p>Created: {new Date(tool.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tool)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete AI Tool</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{tool.tool_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(tool.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {!toolsLoading && tools.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">No AI Tools Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first AI tool to the Digital Career Hub.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Tool
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Categories</h3>
                <p className="text-sm text-muted-foreground">Organize AI tools into categories</p>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'Update the category details below.' : 'Create a new category for organizing AI tools.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_name">Category Name</Label>
                      <Input
                        id="category_name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category_description">Description</Label>
                      <Textarea
                        id="category_description"
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter category description"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input
                        id="display_order"
                        type="number"
                        min="0"
                        value={categoryFormData.display_order}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="category_active"
                        checked={categoryFormData.is_active}
                        onCheckedChange={(checked) => setCategoryFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="category_active">Active (visible to users)</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Update Category' : 'Create Category'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const toolsInCategory = tools.filter(tool => tool.category_id === category.id);
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {category.description || 'No description available'}
                            </CardDescription>
                          </div>
                          <Badge variant={category.is_active ? 'default' : 'secondary'}>
                            {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Display Order: <span className="font-semibold">{category.display_order}</span></p>
                          <p>Tools: <span className="font-semibold">{toolsInCategory.length}</span></p>
                          <p>Created: {new Date(category.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-destructive hover:text-destructive"
                                disabled={toolsInCategory.length > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                  {toolsInCategory.length > 0 && (
                                    <div className="mt-2 p-2 bg-destructive/10 rounded">
                                      Warning: This category has {toolsInCategory.length} tools. Please reassign or delete them first.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={toolsInCategory.length > 0}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {!categoriesLoading && categories.length === 0 && (
              <Card className="text-center py-8">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first category to organize AI tools.
                  </p>
                  <Button onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Category
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManageCareerHub;