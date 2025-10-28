import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question, Answer } from '@/types/clp';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  existingAnswer?: Answer;
  onAnswerChange: (questionId: string, response: Record<string, any>) => void;
  readonly?: boolean;
  showCorrectAnswer?: boolean;
  className?: string;
}

const QuestionRendererComponent: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer,
  onAnswerChange,
  readonly = false,
  showCorrectAnswer = false,
  className
}) => {
  const [response, setResponse] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<File[]>([]);

  // Initialize response from existing answer only when question changes
  useEffect(() => {
    if (existingAnswer?.response) {
      setResponse(existingAnswer.response);
    } else {
      setResponse({});
    }
    setFiles([]);
  }, [question.id]); // Only reset when question changes

  // Keep refs for latest values
  const responseRef = useRef(response);
  const onAnswerChangeRef = useRef(onAnswerChange);
  
  // Update refs on every render
  useEffect(() => {
    responseRef.current = response;
    onAnswerChangeRef.current = onAnswerChange;
  });

  // Track previous question ID to detect changes
  const prevQuestionIdRef = useRef(question.id);
  
  // Save answer when question changes
  useEffect(() => {
    const currentQuestionId = question.id;
    const previousQuestionId = prevQuestionIdRef.current;
    
    // Only save if question actually changed
    if (previousQuestionId !== currentQuestionId) {
      const prevResponse = responseRef.current;
      // Save the answer for the PREVIOUS question before switching
      if (Object.keys(prevResponse).length > 0) {
        onAnswerChangeRef.current(previousQuestionId, prevResponse);
      }
      // Update the ref to current question
      prevQuestionIdRef.current = currentQuestionId;
    }
  }, [question.id]); // Only depend on question.id

  // Save on unmount only
  useEffect(() => {
    return () => {
      const finalResponse = responseRef.current;
      const finalQuestionId = prevQuestionIdRef.current;
      if (Object.keys(finalResponse).length > 0) {
        onAnswerChangeRef.current(finalQuestionId, finalResponse);
      }
    };
  }, []); // No dependencies - only on unmount

  const handleResponseChange = (newResponse: Record<string, any>) => {
    // Update local state immediately - no parent notification
    setResponse(newResponse);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Update response with file information
    const fileInfo = selectedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    handleResponseChange({
      ...response,
      files: [...(response.files || []), ...fileInfo]
    });
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    const newFileInfo = newFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    handleResponseChange({
      ...response,
      files: newFileInfo
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMCQQuestion = () => {
    const isMultiSelect = question.correct_answers.length > 1;
    
    if (isMultiSelect) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Select all correct answers:
          </p>
          {question.options.map((option, index) => {
            const optionKey = `option_${index}`;
            const isChecked = response.selectedOptions?.includes(optionKey) || false;
            const isCorrect = showCorrectAnswer && 
              question.correct_answers.includes(JSON.stringify([option]));
            
            return (
              <div 
                key={index} 
                className={cn(
                  'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                  showCorrectAnswer && isCorrect && 'bg-green-50 border-green-200',
                  showCorrectAnswer && !isCorrect && isChecked && 'bg-red-50 border-red-200'
                )}
              >
                <Checkbox
                  id={`q${question.id}_${index}`}
                  checked={isChecked}
                  disabled={readonly}
                  onCheckedChange={(checked) => {
                    if (readonly) return;
                    
                    const currentSelected = response.selectedOptions || [];
                    const newSelected = checked
                      ? [...currentSelected, optionKey]
                      : currentSelected.filter((opt: string) => opt !== optionKey);
                    
                    handleResponseChange({
                      ...response,
                      selectedOptions: newSelected,
                      value: newSelected.map((opt: string) => {
                        const idx = parseInt(opt.split('_')[1]);
                        return question.options[idx];
                      })
                    });
                  }}
                />
                <Label 
                  htmlFor={`q${question.id}_${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
                {showCorrectAnswer && isCorrect && (
                  <Badge className="bg-green-100 text-green-800">Correct</Badge>
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      return (
        <RadioGroup
          value={response.selectedOption || ''}
          onValueChange={(value) => {
            if (readonly) return;
            const selectedIndex = parseInt(value.split('_')[1]);
            handleResponseChange({
              ...response,
              selectedOption: value,
              value: question.options[selectedIndex]
            });
          }}
          disabled={readonly}
          className="space-y-3"
        >
          {question.options.map((option, index) => {
            const optionKey = `option_${index}`;
            const isSelected = response.selectedOption === optionKey;
            const isCorrect = showCorrectAnswer && 
              question.correct_answers.includes(JSON.stringify([option]));
            
            return (
              <div 
                key={index}
                className={cn(
                  'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                  showCorrectAnswer && isCorrect && 'bg-green-50 border-green-200',
                  showCorrectAnswer && !isCorrect && isSelected && 'bg-red-50 border-red-200'
                )}
              >
                <RadioGroupItem value={optionKey} id={`q${question.id}_${index}`} />
                <Label 
                  htmlFor={`q${question.id}_${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
                {showCorrectAnswer && isCorrect && (
                  <Badge className="bg-green-100 text-green-800">Correct</Badge>
                )}
              </div>
            );
          })}
        </RadioGroup>
      );
    }
  };

  const renderTrueFalseQuestion = () => {
    const isCorrect = showCorrectAnswer && 
      response.value && 
      question.correct_answers.includes(JSON.stringify([response.value]));
    const isIncorrect = showCorrectAnswer && 
      response.value && 
      !question.correct_answers.includes(JSON.stringify([response.value]));

    return (
      <RadioGroup
        value={response.selectedOption || ''}
        onValueChange={(value) => {
          if (readonly) return;
          const boolValue = value === 'true';
          handleResponseChange({
            ...response,
            selectedOption: value,
            value: boolValue ? 'True' : 'False'
          });
        }}
        disabled={readonly}
        className="space-y-3"
      >
        {['True', 'False'].map((option, index) => {
          const optionKey = index === 0 ? 'true' : 'false';
          const isSelected = response.selectedOption === optionKey;
          const isCorrectOption = showCorrectAnswer && 
            question.correct_answers.includes(JSON.stringify([option]));
          
          return (
            <div 
              key={option}
              className={cn(
                'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                showCorrectAnswer && isCorrectOption && 'bg-green-50 border-green-200',
                showCorrectAnswer && !isCorrectOption && isSelected && 'bg-red-50 border-red-200'
              )}
            >
              <RadioGroupItem value={optionKey} id={`q${question.id}_${option}`} />
              <Label 
                htmlFor={`q${question.id}_${option}`}
                className="flex-1 cursor-pointer font-medium"
              >
                {option}
              </Label>
              {showCorrectAnswer && isCorrectOption && (
                <Badge className="bg-green-100 text-green-800">Correct</Badge>
              )}
            </div>
          );
        })}
      </RadioGroup>
    );
  };

  const renderDescriptiveQuestion = () => {
    return (
      <div className="space-y-4">
        <Textarea
          placeholder="Enter your answer here..."
          value={response.text || ''}
          onChange={(e) => {
            if (readonly) return;
            handleResponseChange({
              ...response,
              text: e.target.value,
              value: e.target.value
            });
          }}
          disabled={readonly}
          className="min-h-[150px] resize-none"
          maxLength={5000}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Minimum 50 words recommended</span>
          <span>{(response.text || '').length}/5000 characters</span>
        </div>
      </div>
    );
  };

  const renderTaskQuestion = () => {
    // Get task attachments from question metadata
    const taskAttachments = (question.metadata as any)?.attachments || [];

    return (
      <div className="space-y-6">
        {/* Task Instructions */}
        {question.prompt && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-sm font-semibold text-blue-900 mb-2 block">
              Task Instructions
            </Label>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {question.prompt}
            </div>
          </div>
        )}

        {/* Task Reference Images */}
        {taskAttachments.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Reference Images/Materials
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {taskAttachments.map((attachment: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={attachment}
                    alt={`Task reference ${index + 1}`}
                    className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(attachment, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(attachment, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment;
                          link.download = `task-reference-${index + 1}.jpg`;
                          link.click();
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Response */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Description/Notes
          </Label>
          <Textarea
            placeholder="Describe your solution, approach, or any notes about the task..."
            value={response.text || ''}
            onChange={(e) => {
              if (readonly) return;
              handleResponseChange({
                ...response,
                text: e.target.value
              });
            }}
            disabled={readonly}
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* File Upload */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Your Attachments
          </Label>
          
          {!readonly && (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id={`file-upload-${question.id}`}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <label
                htmlFor={`file-upload-${question.id}`}
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, images, or ZIP files (max 10MB each)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mt-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {!readonly && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (question.kind) {
      case 'mcq':
        return renderMCQQuestion();
      case 'tf':
        return renderTrueFalseQuestion();
      case 'descriptive':
        return renderDescriptiveQuestion();
      default:
        return renderTaskQuestion();
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge variant="outline" className="text-xs">
                {questionNumber} of {totalQuestions}
              </Badge>
              {/* Only show prompt in header for non-task questions */}
              {question.kind !== 'task' && (
                <span className="text-base font-medium">
                  {question.prompt}
                </span>
              )}
              {question.kind === 'task' && (
                <span className="text-base font-medium">
                  Complete Project Task
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
            </Badge>
            {showCorrectAnswer && existingAnswer && (
              <Badge 
                variant={existingAnswer.is_correct ? 'default' : 'destructive'}
                className="text-xs"
              >
                {existingAnswer.is_correct ? 'Correct' : 'Incorrect'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderQuestionContent()}
        
        {/* Feedback Section */}
        {showCorrectAnswer && existingAnswer?.feedback && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Feedback:</h4>
            <p className="text-blue-800 text-sm">{existingAnswer.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent re-renders when props haven't meaningfully changed
export const QuestionRenderer = React.memo(QuestionRendererComponent, (prevProps, nextProps) => {
  // Return true to SKIP re-render if props are the same
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.showCorrectAnswer === nextProps.showCorrectAnswer
  );
});