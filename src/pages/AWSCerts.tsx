import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Award, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AWSCerts = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your AWS Certification advisor. I can help you with:

📚 **Certification Guidance** - Learn about AWS certification paths
🎯 **Exam Preparation** - Study strategies and resources
💡 **AWS Concepts** - Detailed explanations of AWS services
📝 **Practice Questions** - Test your knowledge
🗓️ **Study Planning** - Create personalized study plans

Which AWS certification are you interested in, or what would you like to learn today?`,
      timestamp: new Date()
    }]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the AWS Certification advisor.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('aws-certs-chat', {
        body: { message: inputMessage }
      });

      if (error) throw error;

      const assistantMessage: Message = {
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
        description: "Failed to get response. Please try again.",
        variant: "destructive"
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold">AWS Certification Advisor</h1>
                  <p className="text-sm text-muted-foreground">
                    Your AI-powered guide to AWS certifications
                  </p>
                </div>
              </div>
            </div>
            <UserProfileDropdown />
          </div>
        </div>

        <div className="container mx-auto p-6">
          {/* Certification Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-start gap-3">
                <BookOpen className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900">Foundational</h3>
                  <p className="text-sm text-blue-700">AWS Cloud Practitioner</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900">Associate</h3>
                  <p className="text-sm text-green-700">Solutions Architect, Developer, SysOps</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-start gap-3">
                <Award className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900">Professional</h3>
                  <p className="text-sm text-purple-700">Solutions Architect, DevOps Engineer</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {message.content.split('\n').map((line, idx) => {
                        // Main headings (##)
                        if (line.startsWith('## ')) {
                          return <h2 key={idx} className="text-lg font-bold mt-4 mb-2 text-primary">{line.replace('## ', '')}</h2>;
                        }
                        // Sub headings (###)
                        if (line.startsWith('### ')) {
                          return <h3 key={idx} className="text-base font-semibold mt-3 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
                        }
                        // Bold text (**text**)
                        if (line.includes('**')) {
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={idx} className="my-2">
                              {parts.map((part, i) => 
                                part.startsWith('**') && part.endsWith('**') ? (
                                  <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </p>
                          );
                        }
                        // Bullet points
                        if (line.trim().match(/^[•\-\*]\s/)) {
                          return <li key={idx} className="ml-4 my-1">{line.replace(/^[•\-\*]\s/, '')}</li>;
                        }
                        // Numbered lists
                        if (line.trim().match(/^\d+\.\s/)) {
                          return <li key={idx} className="ml-4 my-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                        }
                        // Emoji headings (📚, 🎯, etc.)
                        if (line.match(/^[📚🎯💡📝🗓️✅❌⚠️🔍📌]/)) {
                          return <p key={idx} className="font-semibold my-2 text-primary">{line}</p>;
                        }
                        // Empty lines
                        if (line.trim() === '') {
                          return <br key={idx} />;
                        }
                        // Regular text
                        return <p key={idx} className="my-1">{line}</p>;
                      })}
                    </div>
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about AWS certifications, exam preparation, or AWS concepts..."
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="h-[60px] w-[60px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AWSCerts;
