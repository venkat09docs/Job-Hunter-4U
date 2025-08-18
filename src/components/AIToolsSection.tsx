import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { Zap, Code, Users, Target, Brain, TrendingUp } from 'lucide-react';

interface AITool {
  id: string;
  tool_name: string;
  tool_description: string;
  image_url: string;
  credit_points: number;
  category_id: string;
}

interface AIToolCategory {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('code') || name.includes('development')) return Code;
  if (name.includes('network') || name.includes('social')) return Users;
  if (name.includes('career') || name.includes('growth')) return Target;
  if (name.includes('ai') || name.includes('intelligence')) return Brain;
  if (name.includes('analytics') || name.includes('data')) return TrendingUp;
  return Zap;
};

const AIToolsSection = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [categories, setCategories] = useState<AIToolCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchToolsAndCategories();
  }, []);

  const fetchToolsAndCategories = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('ai_tool_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch tools - SECURITY: Only select safe fields, exclude embed_code
      const { data: toolsData, error: toolsError } = await supabase
        .from('ai_tools')
        .select('id, tool_name, tool_description, image_url, credit_points, category_id, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at');

      if (toolsError) throw toolsError;

      setCategories(categoriesData || []);
      setTools(toolsData || []);
    } catch (error) {
      console.error('Error fetching tools and categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizedTools = {
    all: tools,
    ...tools.reduce((acc, tool) => {
      const categoryId = tool.category_id || 'uncategorized';
      if (!acc[categoryId]) acc[categoryId] = [];
      acc[categoryId].push(tool);
      return acc;
    }, {} as Record<string, AITool[]>),
    uncategorized: tools.filter(tool => !tool.category_id)
  };

  const handleToolClick = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            AI-Powered Career Tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access powerful AI tools to enhance your career journey. Join now to unlock all features.
          </p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-8">
            <TabsTrigger value="all" className="text-xs md:text-sm">
              All Tools
            </TabsTrigger>
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs md:text-sm flex items-center gap-1"
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
            {organizedTools.uncategorized?.length > 0 && (
              <TabsTrigger value="uncategorized" className="text-xs md:text-sm">
                Other
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={handleToolClick}
                >
                  <CardHeader className="space-y-3">
                    {tool.image_url && (
                      <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={tool.image_url} 
                          alt={tool.tool_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {tool.credit_points} credits
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {tool.tool_description}
                    </CardDescription>
                    <Button className="w-full mt-4" onClick={handleToolClick}>
                      Try Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-8">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold">{category.name}</h3>
                {category.description && (
                  <p className="text-muted-foreground">{category.description}</p>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizedTools[category.id]?.map((tool) => (
                  <Card 
                    key={tool.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                    onClick={handleToolClick}
                  >
                    <CardHeader className="space-y-3">
                      {tool.image_url && (
                        <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={tool.image_url} 
                            alt={tool.tool_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {tool.credit_points} credits
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3">
                        {tool.tool_description}
                      </CardDescription>
                      <Button className="w-full mt-4" onClick={handleToolClick}>
                        Try Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

          {organizedTools.uncategorized?.length > 0 && (
            <TabsContent value="uncategorized" className="space-y-8">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold">Other Tools</h3>
                <p className="text-muted-foreground">Additional career enhancement tools</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizedTools.uncategorized.map((tool) => (
                  <Card 
                    key={tool.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
                    onClick={handleToolClick}
                  >
                    <CardHeader className="space-y-3">
                      {tool.image_url && (
                        <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                          <img 
                            src={tool.image_url} 
                            alt={tool.tool_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {tool.credit_points} credits
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3">
                        {tool.tool_description}
                      </CardDescription>
                      <Button className="w-full mt-4" onClick={handleToolClick}>
                        Try Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </section>
  );
};

export default AIToolsSection;