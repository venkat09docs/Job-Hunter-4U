import { useState, useEffect } from 'react';
import { useAITools } from '@/hooks/useAITools';
import { useProfile } from '@/hooks/useProfile';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { ToolChatSidebar } from '@/components/ToolChatSidebar';
import { ToolChatInterface } from '@/components/ToolChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, ExternalLink, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DigitalCareerHub = () => {
  const { tools, loading, useTool } = useAITools();
  const { profile, refreshProfile } = useProfile();
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [currentChatMessages, setCurrentChatMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('tool');

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
      setCurrentChatMessages([]);
      setActiveTab('tool');
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

  const handleLoadChat = (messages: ChatMessage[]) => {
    setCurrentChatMessages(messages);
    setActiveTab('chat');
  };

  const handleSendMessage = async (message: string) => {
    // This is where you would integrate with your AI service
    // For now, we'll just simulate a response
    const aiResponse: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `You asked: "${message}". This would be processed by the AI tool.`,
      timestamp: new Date().toISOString()
    };
    
    setCurrentChatMessages(prev => [...prev, aiResponse]);
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
      {/* Top Menu */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Digital Career Hub</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
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
            ))}
          </div>
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
          
          <div className="flex-1 min-h-0 flex">
            {/* Chat Sidebar */}
            {selectedTool && (
              <ToolChatSidebar
                toolId={selectedTool.id}
                currentMessages={currentChatMessages}
                onLoadChat={handleLoadChat}
              />
            )}
            
            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="mx-4 mt-4 mb-0">
                  <TabsTrigger value="tool">AI Tool</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tool" className="flex-1 m-0 relative">
                  {selectedTool && renderEmbedCode(selectedTool.embed_code)}
                </TabsContent>
                
                <TabsContent value="chat" className="flex-1 m-4 mt-0">
                  <div className="h-full border rounded-lg">
                    <ToolChatInterface
                      messages={currentChatMessages}
                      onMessagesChange={setCurrentChatMessages}
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DigitalCareerHub;