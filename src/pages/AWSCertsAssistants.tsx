import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AWSCertsAssistants = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('aws-certs-assistant', {
        body: { 
          message: userMessage.content,
          threadId: threadId 
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      // Store thread ID for conversation continuity
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AWS Certs Assistant:', error);
      toast.error("Failed to get response from assistant");
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setThreadId(null);
    toast.success("Conversation cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AWS Certification Assistant
          </h1>
          <p className="text-muted-foreground">
            Get expert guidance on AWS certifications with persistent conversation context
          </p>
        </div>

        {/* Chat Container */}
        <Card className="p-6 min-h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-3">
                  <Bot className="w-16 h-16 mx-auto text-primary/60" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Start a conversation about AWS certifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about AWS certification paths, exam prep, or career guidance
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
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
                        // Emoji headings
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

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about AWS certifications..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-[60px] w-[60px]"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            {messages.length > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {threadId ? '🔗 Conversation context maintained' : '💬 New conversation'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                >
                  Clear conversation
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AWSCertsAssistants;
