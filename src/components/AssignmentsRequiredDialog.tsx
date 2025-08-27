import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, AlertTriangle, Save, ArrowRight, BookOpen } from "lucide-react";

interface Assignment {
  id: string;
  status: string;
  due_date: string;
  career_task_templates: {
    title: string;
    description: string;
    instructions: any;
  };
}

interface AssignmentsRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignments: Assignment[];
  jobTitle: string;
  companyName: string;
  onSave: () => void;
  onCompleteAndMove: () => void;
}

export function AssignmentsRequiredDialog({
  open,
  onOpenChange,
  assignments,
  jobTitle,
  companyName,
  onSave,
  onCompleteAndMove,
}: AssignmentsRequiredDialogProps) {
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const getDueDateColor = (dateString: string) => {
    if (!dateString) return "outline";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "destructive";
    if (diffDays <= 1) return "secondary";
    return "outline";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Interview Preparation Assignments</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium">{jobTitle}</span> at <span className="font-medium">{companyName}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Assignment Summary */}
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {assignments.length} Assignment{assignments.length > 1 ? 's' : ''} Required
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              Complete before moving to Interviewing
            </Badge>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {assignments.map((assignment, index) => (
                <Card key={assignment.id} className="border-l-4 border-l-gradient-to-b from-amber-500 to-orange-500 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-3 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm flex items-center justify-center font-semibold flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="truncate">
                            {assignment.career_task_templates?.title || "Interview Preparation Task"}
                          </span>
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed pl-10">
                          {assignment.career_task_templates?.description || 
                           "Complete this task to prepare for your interview process."}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={getDueDateColor(assignment.due_date)}
                        className="flex-shrink-0 whitespace-nowrap"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDueDate(assignment.due_date)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {assignment.career_task_templates?.instructions && (
                    <CardContent className="pt-0">
                      <div className="bg-gradient-to-r from-muted/30 to-muted/50 p-4 rounded-lg border border-muted">
                        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          Instructions:
                        </p>
                        <div className="text-sm leading-relaxed">
                          {typeof assignment.career_task_templates.instructions === 'object' ? (
                            assignment.career_task_templates.instructions.steps ? (
                              <ul className="space-y-2">
                                {assignment.career_task_templates.instructions.steps.map((step: string, stepIndex: number) => (
                                  <li key={stepIndex} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="space-y-2">
                                {Object.values(assignment.career_task_templates.instructions).map((instruction: any, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2"></span>
                                    <span>{instruction}</span>
                                  </li>
                                ))}
                              </ul>
                            )
                          ) : (
                            <p className="leading-relaxed">{assignment.career_task_templates.instructions}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {/* Bottom Spacing for scrolling */}
              <div className="h-4"></div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <Separator />
        <div className="px-6 py-4 bg-gradient-to-r from-background to-muted/10">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={onSave}
              className="flex-1 sm:flex-none h-11 text-sm font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Assignments
            </Button>
            <Button 
              onClick={onCompleteAndMove}
              className="flex-1 sm:flex-none h-11 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Complete & Move to Interviewing
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You can work on these assignments and return to move the job later, or complete them now to advance to interviewing stage.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}