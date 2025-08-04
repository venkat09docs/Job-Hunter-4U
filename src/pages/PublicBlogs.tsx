import { useState, useEffect } from "react";
import { Search, Grid3X3, List, Calendar, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Profile {
  full_name: string;
  user_id: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'title';

export default function PublicBlogs() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    fetchBlogs();
  }, [userId]);

  useEffect(() => {
    filterAndSortBlogs();
  }, [blogs, searchTerm, sortBy]);

  const fetchBlogs = async () => {
    try {
      // Build query based on whether we're filtering by user
      let query = supabase
        .from('blogs')
        .select('*');
      
      if (userId) {
        // Show all blogs for specific user (both public and private)
        query = query.eq('user_id', userId);
      } else {
        // Show only public blogs for general viewing
        query = query.eq('is_public', true);
      }
      
      const { data: blogsData, error: blogsError } = await query
        .order('created_at', { ascending: false });

      if (blogsError) throw blogsError;

      const blogsList = blogsData || [];
      setBlogs(blogsList);

      // Fetch profiles for blog authors
      if (blogsList.length > 0) {
        const userIds = [...new Set(blogsList.map(blog => blog.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, Profile>);

        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching public blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBlogs = () => {
    let filtered = blogs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredBlogs(filtered);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getAuthorName = (userId: string) => {
    return profiles[userId]?.full_name || 'Anonymous';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading blogs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {userId ? 'My Blog Posts' : 'Public Blogs'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userId 
                  ? 'Your published blog posts' 
                  : 'Discover stories and insights from our community'
                }
              </p>
            </div>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredBlogs.length} blog{filteredBlogs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Blogs Display */}
        {filteredBlogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Eye className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No blogs found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? 'Try adjusting your search terms.' : 'No public blogs have been published yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredBlogs.map((blog) => (
              <Card key={blog.id} className={viewMode === 'list' ? "hover:shadow-md transition-shadow" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className={viewMode === 'grid' ? "text-lg" : "text-xl"}>
                        {blog.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span>By {getAuthorName(blog.user_id)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(blog.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    <Badge variant={blog.is_public ? "default" : "secondary"}>
                      {userId ? (blog.is_public ? "Public" : "Private") : "Public"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {blog.excerpt && (
                    <p className="text-muted-foreground text-sm mb-3">
                      {blog.excerpt}
                    </p>
                  )}
                  {blog.content && (
                    <p className="text-sm">
                      {truncateContent(blog.content, viewMode === 'grid' ? 120 : 200)}
                    </p>
                  )}
                  <div className="mt-4">
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}