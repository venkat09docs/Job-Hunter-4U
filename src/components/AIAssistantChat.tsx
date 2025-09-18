import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot, User, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pricing from "@/components/Pricing";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantChat = () => {
  const { user } = useAuth();
  const { profile, hasActiveSubscription, getRemainingDays, refreshProfile, incrementAnalytics } = useProfile();
  const { toast } = useToast();
  const location = useLocation();
  
  // Hide AI Assistant Chat on specific pages
  const hideOnRoutes = ['/dashboard/crack-interview'];
  const shouldHide = hideOnRoutes.some(route => location.pathname === route);
  
  if (shouldHide) {
    return null;
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Hide AI assistant on course content view pages
  const shouldHideAssistant = location.pathname.startsWith('/course/');

  const hasValidSubscription = hasActiveSubscription();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Find the actual scrollable viewport within the ScrollArea component
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // Re-focus input after loading completes and scroll to bottom
  useEffect(() => {
    if (!isLoading && hasValidSubscription && isOpen) {
      const inputElement = document.querySelector('input[placeholder*="Type your message"]') as HTMLInputElement;
      if (inputElement) {
        setTimeout(() => {
          inputElement.focus();
          // Also scroll to bottom after AI response
          if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight;
            }
          }
        }, 100);
      }
    }
  }, [isLoading, hasValidSubscription, isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Hello! I\'m your AI assistant. I can help you with job search advice, resume tips, career guidance, and answer any questions you have. How can I assist you today?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const logChatToSupabase = async (userMessage: string, aiResponse: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_logs')
        .insert({
          user_id: user?.id,
          user_message: userMessage,
          ai_response: aiResponse,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging chat:', error);
      }
    } catch (error) {
      console.error('Error logging to Supabase:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    if (!hasValidSubscription) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to use the AI assistant. Please upgrade your plan.",
        variant: "destructive"
      });
      setShowPricing(true);
      return;
    }

    const userMessage = inputMessage.trim();
    const userMessageObj: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessageObj]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call n8n webhook via Supabase function for AI response
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: userMessage,
          userId: user.id,
          context: 'career_assistant'
        }
      });

      if (error) throw error;

      // Mock AI response for demonstration
      const aiResponse = data?.response || `I understand you're asking about "${userMessage}". As your AI career assistant, I'd be happy to help you with job search strategies, resume optimization, interview preparation, and career development advice. Could you provide more specific details about what you'd like to know?`;

      const aiMessageObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessageObj]);

      // Log conversation to Supabase (commented out until table is available)
      // await logChatToSupabase(userMessage, aiResponse);

      // Increment analytics
      await incrementAnalytics('ai_query');
      await refreshProfile();

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render AI assistant on course content view pages
  if (shouldHideAssistant) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        aria-label="Open AI Assistant"
        title="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              <span>{getRemainingDays()} days left</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 min-h-0">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      {message.type === 'user' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-background shrink-0">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder={hasValidSubscription ? "Type your message..." : "Subscription required"}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !hasValidSubscription}
                className="flex-1"
                autoFocus={hasValidSubscription}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !hasValidSubscription}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {!hasValidSubscription && (
              <div className="text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowPricing(true)}
                  className="text-xs"
                >
                  Upgrade subscription to continue chatting
                </Button>
              </div>
            )}
            
            {hasValidSubscription && (
              <div className="text-xs text-muted-foreground text-center">
                Press Enter to send • Continuous chat enabled
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Modal */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upgrade Your Plan</DialogTitle>
          </DialogHeader>
          <Pricing />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIAssistantChat;