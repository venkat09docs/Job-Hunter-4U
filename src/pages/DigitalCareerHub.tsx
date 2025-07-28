import { useState, useEffect, useMemo } from 'react';
import { useAITools } from '@/hooks/useAITools';
import { useProfile } from '@/hooks/useProfile';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { ToolNotesSidebar } from '@/components/ToolNotesSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, ExternalLink, Zap, ArrowLeft, FileText, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const DigitalCareerHub = () => {
  const { tools, categories, loading, categoriesLoading, useTool } = useAITools();
  const { profile, refreshProfile } = useProfile();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tool');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const organizedTools = useMemo(() => {
    const toolsByCategory = categories.reduce((acc, category) => {
      acc[category.id] = tools.filter(tool => tool.category_id === category.id);
      return acc;
    }, {} as Record<string, any[]>);
    
    const uncategorizedTools = tools.filter(tool => !tool.category_id);
    if (uncategorizedTools.length > 0) {
      toolsByCategory['uncategorized'] = uncategorizedTools;
    }
    
    return toolsByCategory;
  }, [tools, categories]);

  const handleToolAccess = async (tool: any) => {
    try {
      if ((profile?.tokens_remaining || 0) < tool.credit_points) {
        toast({
          title: 'Insufficient Credits',
          description: `You need ${tool.credit_points} credits to access this tool. Current balance: ${profile?.tokens_remaining || 0}`,
          variant: 'destructive'
        });
        return;
      }

      await useTool(tool.id, tool.credit_points);
      await refreshProfile();
      
      // Open the tool in a modal
      setSelectedTool(tool);
      setIsToolDialogOpen(true);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const renderEmbedCode = (embedCode: string) => {
    // Clean up the embed code and ensure it's properly formatted
    const cleanCode = embedCode.trim();
    
    // If it's an iframe, render it directly
    if (cleanCode.includes('<iframe')) {
      return (
        <div 
          className="w-full h-full absolute inset-0"
          dangerouslySetInnerHTML={{ __html: cleanCode.replace(/style="[^"]*"/g, 'style="width: 100%; height: 100%; border: none;"') }}
        />
      );
    }
    
    // If it's just a URL, create an iframe
    if (cleanCode.startsWith('http')) {
      return (
        <iframe
          src={cleanCode}
          className="w-full h-full absolute inset-0 border-none"
          title="AI Tool"
          frameBorder="0"
          allowFullScreen
        />
      );
    }
    
    // Fallback: display as text
    return (
      <div className="w-full h-full absolute inset-0 p-4 bg-muted overflow-auto">
        <p className="text-center text-muted-foreground">
          Unable to display tool. Please contact support.
        </p>
        <pre className="mt-4 text-xs overflow-auto">{cleanCode}</pre>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Digital Career Hub</h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Loading...</Badge>
              <UserProfileDropdown />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-8">Loading AI tools...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Digital Career Hub
          </h1>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {profile?.tokens_remaining || 0} Credits
            </Badge>
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">AI-Powered Career Tools</h2>
          <p className="text-muted-foreground">
            Access powerful AI tools to enhance your career journey. Each tool requires credits to use.
          </p>
        </div>

{tools.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">No AI Tools Available</h3>
              <p className="text-muted-foreground">
                AI tools are currently being added. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
              <TabsTrigger value="all">All Tools</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
              {organizedTools['uncategorized'] && (
                <TabsTrigger value="uncategorized">Uncategorized</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                  const category = categories.find(cat => cat.id === tool.category_id);
                  return (
                    <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        {tool.image_url && (
                          <div className="mb-4">
                            <img 
                              src={tool.image_url} 
                              alt={tool.tool_name}
                              className="w-full h-40 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                            <CardDescription className="mt-1">
                              {tool.tool_description || 'AI-powered career tool'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {tool.credit_points}
                          </Badge>
                        </div>
                        {category && (
                          <Badge variant="secondary" className="w-fit mt-2">
                            {category.name}
                          </Badge>
                        )}
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p>Credits Required: <span className="font-semibold">{tool.credit_points}</span></p>
                            <p>Your Balance: <span className="font-semibold">{profile?.tokens_remaining || 0}</span></p>
                          </div>
                          
                          {(profile?.tokens_remaining || 0) >= tool.credit_points ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Access Tool
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Access {tool.tool_name}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will deduct {tool.credit_points} credits from your account. 
                                    You currently have {profile?.tokens_remaining || 0} credits.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleToolAccess(tool)}>
                                    Use {tool.credit_points} Credits
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              Insufficient Credits
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizedTools[category.id]?.map((tool) => (
                    <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        {tool.image_url && (
                          <div className="mb-4">
                            <img 
                              src={tool.image_url} 
                              alt={tool.tool_name}
                              className="w-full h-40 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                            <CardDescription className="mt-1">
                              {tool.tool_description || 'AI-powered career tool'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {tool.credit_points}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p>Credits Required: <span className="font-semibold">{tool.credit_points}</span></p>
                            <p>Your Balance: <span className="font-semibold">{profile?.tokens_remaining || 0}</span></p>
                          </div>
                          
                          {(profile?.tokens_remaining || 0) >= tool.credit_points ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Access Tool
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Access {tool.tool_name}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will deduct {tool.credit_points} credits from your account. 
                                    You currently have {profile?.tokens_remaining || 0} credits.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleToolAccess(tool)}>
                                    Use {tool.credit_points} Credits
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              Insufficient Credits
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) || <p className="text-center text-muted-foreground py-8">No tools in this category yet.</p>}
                </div>
              </TabsContent>
            ))}

            {organizedTools['uncategorized'] && (
              <TabsContent value="uncategorized" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizedTools['uncategorized'].map((tool) => (
                    <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{tool.tool_name}</CardTitle>
                            <CardDescription className="mt-1">
                              {tool.tool_description || 'AI-powered career tool'}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {tool.credit_points}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <p>Credits Required: <span className="font-semibold">{tool.credit_points}</span></p>
                            <p>Your Balance: <span className="font-semibold">{profile?.tokens_remaining || 0}</span></p>
                          </div>
                          
                          {(profile?.tokens_remaining || 0) >= tool.credit_points ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button className="w-full">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Access Tool
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Access {tool.tool_name}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will deduct {tool.credit_points} credits from your account. 
                                    You currently have {profile?.tokens_remaining || 0} credits.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleToolAccess(tool)}>
                                    Use {tool.credit_points} Credits
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              Insufficient Credits
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      {/* Tool Modal */}
      <Dialog open={isToolDialogOpen} onOpenChange={setIsToolDialogOpen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 flex flex-col">
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
            <DialogTitle className="flex items-center justify-between">
              {selectedTool?.tool_name}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsToolDialogOpen(false)}
              >
                Close
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {isMobile ? (
            /* Mobile Layout - Tabs */
            <div className="flex-1 min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
                  <TabsTrigger value="tool" className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Tool
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tool" className="flex-1 min-h-0 m-0 p-2">
                  <div className="h-full relative rounded-lg overflow-hidden border">
                    {selectedTool && renderEmbedCode(selectedTool.embed_code)}
                  </div>
                </TabsContent>
                
                <TabsContent value="notes" className="flex-1 min-h-0 m-0 p-2">
                  <div className="h-full border rounded-lg overflow-hidden">
                    {selectedTool && (
                      <ToolNotesSidebar toolId={selectedTool.id} />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            /* Desktop Layout - Side by side */
            <div className="flex-1 min-h-0 flex">
              {/* Notes Sidebar */}
              {selectedTool && (
                <ToolNotesSidebar toolId={selectedTool.id} />
              )}
              
              {/* Main Content Area */}
              <div className="flex-1 min-h-0 relative">
                {selectedTool && renderEmbedCode(selectedTool.embed_code)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalCareerHub;