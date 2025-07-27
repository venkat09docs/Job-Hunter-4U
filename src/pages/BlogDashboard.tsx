import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Eye, EyeOff, Calendar, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { format } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export default function BlogDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    is_public: false
  });

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [user]);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .insert([{
          ...formData,
          user_id: user?.id
        }]);

      if (error) throw error;

      toast.success('Blog post created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchBlogs();
    } catch (error) {
      console.error('Error creating blog:', error);
      toast.error('Failed to create blog post');
    }
  };

  const handleUpdateBlog = async () => {
    if (!editingBlog || !formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .update(formData)
        .eq('id', editingBlog.id);

      if (error) throw error;

      toast.success('Blog post updated successfully');
      setEditingBlog(null);
      resetForm();
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('Failed to update blog post');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;

      toast.success('Blog post deleted successfully');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const handleToggleVisibility = async (blog: Blog) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ is_public: !blog.is_public })
        .eq('id', blog.id);

      if (error) throw error;

      toast.success(`Blog post ${!blog.is_public ? 'published' : 'unpublished'}`);
      fetchBlogs();
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      is_public: false
    });
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      is_public: blog.is_public
    });
  };

  const closeEditModal = () => {
    setEditingBlog(null);
    resetForm();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1">
          <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {profile?.username || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}
                </span>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </header>
            <div className="flex items-center justify-center h-96">
              <div className="text-center">Loading...</div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
            <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
              <SidebarTrigger />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {profile?.username || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}
                  </span>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </header>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Blog Dashboard</h1>
                <p className="text-muted-foreground">Manage your blog posts</p>
              </div>
              
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Write New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Blog Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter blog title..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Input
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Brief description..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your blog content..."
                        rows={8}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                      />
                      <Label htmlFor="is_public">Make this post public</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBlog}>
                        Create Post
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {blogs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PenTool className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start creating your first blog post to share your thoughts with the world.
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Write Your First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {blogs.map((blog) => (
                  <Card key={blog.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{blog.title}</CardTitle>
                          {blog.excerpt && (
                            <p className="text-muted-foreground text-sm">{blog.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                            </div>
                            <Badge variant={blog.is_public ? "default" : "secondary"}>
                              {blog.is_public ? "Public" : "Private"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVisibility(blog)}
                            title={blog.is_public ? "Make private" : "Make public"}
                          >
                            {blog.is_public ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(blog)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Edit Modal */}
            <Dialog open={!!editingBlog} onOpenChange={(open) => !open && closeEditModal()}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Blog Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter blog title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-excerpt">Excerpt</Label>
                    <Input
                      id="edit-excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your blog content..."
                      rows={8}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                    />
                    <Label htmlFor="edit-is_public">Make this post public</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeEditModal}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateBlog}>
                      Update Post
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}