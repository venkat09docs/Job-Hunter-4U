import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Mic, 
  MicOff, 
  
  StickyNote,
  X,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { InterviewNotesPanel } from "@/components/InterviewNotesPanel";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EvaluateAssignments = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterQuestions, setShowStarterQuestions] = useState(true);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecorder({
    onTranscriptionComplete: (text: string) => {
      setInputMessage(text);
    }
  });
  
  // Conversation starter questions for assignment evaluation
  const starterQuestions = [
    "hi",
    "I want to generate a new assignment",
    "I want to evaluate my assignment", 
    "Help me with Python coding tasks",
    "Create a JavaScript project assignment",
    "I need help with data structures",
    "Generate a web development task",
    "Evaluate my React component"
  ];

  const getInitialMessage = () => ({
    id: '1',
    type: 'assistant' as const,
    content: `Hello! I'm your AI Assignment Evaluator from AI Career Level Up. I'm here to help you with assignment creation and evaluation.

To get started, please say "hi" to begin our interaction. I can help you:

✅ Generate new assignments on any programming concept
✅ Evaluate your completed assignments with detailed feedback
✅ Provide coding challenges and real-world tasks
✅ Give you reference materials and learning resources

Click on any starter question below or type "hi" to begin!`,
    timestamp: new Date()
  });

  // Initialize messages on component mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getInitialMessage()]);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Auto-collapse starter questions after first interaction
    setShowStarterQuestions(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log('🤖 Sending message to assignment evaluator:', inputMessage);
      
      // Convert messages to OpenAI format for conversation history
      const conversationHistory = updatedMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('assignment-evaluator-chat', {
        body: {
          message: inputMessage.trim(),
          conversationHistory,
          userId: user?.id,
          context: 'assignment_evaluation'
        }
      });

      if (error) {
        console.error('❌ Assignment evaluator error:', error);
        throw error;
      }

      console.log('✅ Assignment evaluator response received');

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t process your request right now. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header with Breadcrumb Navigation */}
      <div className="flex-shrink-0 border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate('/dashboard')}
                    className="cursor-pointer hover:text-foreground"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate('/dashboard/interview-preparation')}
                    className="cursor-pointer hover:text-foreground"
                  >
                    Interview Level Up
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Evaluate Your Assignments
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${showNotesPanel ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {showNotesPanel ? <X className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />}
              {showNotesPanel ? 'Hide Notes' : 'Notes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={showNotesPanel ? 70 : 100} minSize={50}>
            <div className="flex flex-col h-full p-3">
              <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex-shrink-0 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Assignment Evaluator Chat
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
                    <div className="space-y-4 pb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className={`w-8 h-8 flex-shrink-0 ${message.type === 'user' ? 'bg-primary' : 'bg-transparent'}`}>
                            {message.type === 'user' ? (
                              profile?.profile_image_url ? (
                                <AvatarImage src={profile.profile_image_url} alt="User" />
                              ) : (
                                <AvatarFallback className="bg-primary text-white text-xs">
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              )
                            ) : (
                              <AvatarImage 
                                src="/lovable-uploads/2bae437e-b17b-431f-a403-e8a375913444.png" 
                                alt="AI Career Level Up Evaluator"
                                className="object-contain"
                              />
                            )}
                          </Avatar>
                          
                          <div className={`flex flex-col max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                message.type === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted border'
                              }`}
                            >
                              <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex gap-3">
                          <Avatar className="w-8 h-8 bg-transparent">
                            <AvatarImage 
                              src="/lovable-uploads/2bae437e-b17b-431f-a403-e8a375913444.png" 
                              alt="AI Career Level Up Evaluator"
                              className="object-contain"
                            />
                          </Avatar>
                          <div className="flex items-center gap-2 bg-muted border rounded-2xl px-4 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-base text-muted-foreground">AI is analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex-shrink-0 border-t bg-background/50">
                    {/* Collapsible Starter Questions */}
                    {showStarterQuestions && (
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex flex-wrap gap-2">
                          {starterQuestions.slice(0, 6).map((question, index) => (
                            <Button
                              key={index}
                              onClick={() => handleQuestionClick(question)}
                              variant="outline"
                              size="sm"
                              className="text-xs h-8 px-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                              disabled={isLoading || isRecording || isProcessing}
                            >
                              {question.length > 30 ? `${question.substring(0, 30)}...` : question}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Toggle Button for Starter Questions */}
                    {!showStarterQuestions && (
                      <div className="p-2 border-b bg-muted/20">
                        <Button
                          onClick={() => setShowStarterQuestions(true)}
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                          Show starter questions
                        </Button>
                      </div>
                    )}
                      
                    {/* Input Area */}
                    <div className="p-4">
                      <div className="flex gap-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type 'hi' to start or ask about assignments..."
                          className="flex-1 border-primary/20 focus:border-primary/40 text-base min-h-[44px]"
                          disabled={isLoading || isRecording || isProcessing}
                        />
                        <Button
                          onClick={handleVoiceToggle}
                          disabled={isLoading || isProcessing}
                          variant={isRecording ? "destructive" : "outline"}
                          className={`min-h-[44px] min-w-[44px] ${isRecording ? 'animate-pulse' : ''}`}
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
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 min-h-[44px] min-w-[44px]"
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
          </ResizablePanel>

          {/* Resizable Handle - Only show when notes panel is visible */}
          {showNotesPanel && (
            <>
              <ResizableHandle withHandle />
              
              {/* Notes Panel */}
              <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
                <InterviewNotesPanel className="h-full" />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default EvaluateAssignments;