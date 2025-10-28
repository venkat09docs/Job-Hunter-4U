import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnswerAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: string | null;
  loading: boolean;
  error: string | null;
  questionText: string;
  answerText: string;
}

export const AnswerAnalysisDialog: React.FC<AnswerAnalysisDialogProps> = ({
  open,
  onOpenChange,
  analysis,
  loading,
  error,
  questionText,
  answerText,
}) => {
  const formatAnalysis = (text: string) => {
    // Split by lines and format with proper styling
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('**') && line.includes(':**')) {
        // Bold headers
        const [header, ...rest] = line.split(':**');
        return (
          <div key={index} className="mb-3">
            <h4 className="font-semibold text-foreground mb-1">
              {header.replace(/\*\*/g, '')}:
            </h4>
            <p className="text-muted-foreground pl-4">{rest.join(':**')}</p>
          </div>
        );
      } else if (line.trim().startsWith('-')) {
        // List items
        return (
          <li key={index} className="text-muted-foreground ml-4 mb-1">
            {line.trim().substring(1).trim()}
          </li>
        );
      } else if (line.trim()) {
        // Regular text
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Answer Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered feedback on your answer
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <div className="space-y-4">
            {/* Question */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Question</h3>
              <p className="text-foreground">{questionText}</p>
            </div>

            {/* Answer */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Your Answer</h3>
              <p className="text-foreground whitespace-pre-wrap">{answerText}</p>
            </div>

            {/* Analysis */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Feedback & Suggestions</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Analyzing your answer...</span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {analysis && !loading && (
                <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                  {formatAnalysis(analysis)}
                </div>
              )}

              {!loading && !error && !analysis && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click "Analyze Answer" to get AI-powered feedback on your response.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
