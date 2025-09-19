import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Code, FileText, Wrench, Mic, MicOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CodingCopilot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecorder({
    onTranscriptionComplete: (text: string) => {
      setInputMessage(text);
    }
  });

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      role: 'assistant',
      content: `👋 Welcome to your Coding Copilot! I'm here to help you with:

🔧 **Code Generation** - Get code snippets in any programming language
🐛 **Debugging Help** - Find and fix errors in your code  
📚 **Concept Explanations** - Learn programming concepts and algorithms
📖 **Documentation Lookup** - Quick access to programming resources
🎯 **Interactive Learning** - Coding challenges tailored to your skill level

What coding challenge can I help you with today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);


  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('coding-copilot-chat', {
        body: { message: inputMessage }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response from Coding Copilot. Please try again.",
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

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getSubscriptionStatus = () => {
    if (hasActiveSubscription() && profile?.subscription_plan) {
      return {
        plan: profile.subscription_plan,
        status: 'Active',
        variant: 'default' as const
      };
    }
    return {
      plan: 'Free Plan',
      status: 'Free',
      variant: 'secondary' as const
    };
  };

  const subscriptionInfo = getSubscriptionStatus();

  const formatMessage = (content: string) => {
    // Simple formatting for code blocks and emphasis
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code class="text-sm">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/interview-preparation')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Interview Preparation
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <Badge variant={subscriptionInfo.variant} className="mb-1">
                  {subscriptionInfo.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Status: {subscriptionInfo.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{profile?.username || 'user'}
                  </p>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile?.profile_image_url || ''}
                    alt={profile?.username || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Coding Copilot
                </h1>
                <p className="text-muted-foreground">
                  Your AI-powered programming assistant for real-time coding help
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Code Generation</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Generate code in any language</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wrench className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Debug & Fix</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Find and fix code errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Learn & Explain</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Understand concepts deeply</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-4">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Coding Copilot Chat
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 p-0">
                  <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            }`}
                          >
                            <div 
                              className="text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: formatMessage(message.content) 
                              }}
                            />
                            <div className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>

                          {message.role === 'user' && (
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarImage
                                src={profile?.profile_image_url || ''}
                                alt={profile?.username || 'User'}
                              />
                              <AvatarFallback className="bg-secondary">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                              </div>
                              <span className="text-sm text-muted-foreground">Analyzing...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex-shrink-0 border-t bg-background/50">
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Ask for help with code, debugging, or programming concepts..."
                          className="min-h-[60px] resize-none flex-1"
                          disabled={isLoading || isRecording || isProcessing}
                        />
                        <Button
                          onClick={handleVoiceToggle}
                          disabled={isLoading || isProcessing}
                          variant={isRecording ? "destructive" : "outline"}
                          size="lg"
                          className={`px-4 ${isRecording ? 'animate-pulse' : ''}`}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isRecording ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={sendMessage}
                          disabled={!inputMessage.trim() || isLoading || isRecording || isProcessing}
                          size="lg"
                          className="px-4"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {(isRecording || isProcessing) && (
                        <div className="mt-2 text-sm text-muted-foreground text-center">
                          {isRecording && "🎤 Recording... Click stop when finished"}
                          {isProcessing && "🤖 Converting speech to text..."}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}