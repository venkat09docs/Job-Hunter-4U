import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";

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
  onComplete: () => void;
  onCancel: () => void;
}

export function AssignmentsRequiredDialog({
  open,
  onOpenChange,
  assignments,
  jobTitle,
  companyName,
  onComplete,
  onCancel,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-0">
        <AlertDialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Complete Required Assignments</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Before moving <span className="font-semibold">{jobTitle}</span> at{" "}
            <span className="font-semibold">{companyName}</span> to the{" "}
            <span className="font-semibold text-orange-600">Interviewing</span> stage, you need to complete the following assignments:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-4 pb-4">
              {assignments.map((assignment, index) => (
                <Card key={assignment.id} className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          {assignment.career_task_templates?.title || "Interview Preparation Task"}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {assignment.career_task_templates?.description || 
                           "Complete this task to prepare for your interview process."}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={getDueDateColor(assignment.due_date)}
                        className="ml-2 flex-shrink-0"
                      >
                        {formatDueDate(assignment.due_date)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {assignment.career_task_templates?.instructions && (
                    <CardContent>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Instructions:</p>
                        <div className="text-sm space-y-1">
                          {typeof assignment.career_task_templates.instructions === 'object' ? (
                            assignment.career_task_templates.instructions.steps ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {assignment.career_task_templates.instructions.steps.map((step: string, stepIndex: number) => (
                                  <li key={stepIndex}>{step}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="list-disc pl-4 space-y-1">
                                {Object.values(assignment.career_task_templates.instructions).map((instruction: any, index) => (
                                  <li key={index}>{instruction}</li>
                                ))}
                              </ul>
                            )
                          ) : (
                            <p>{assignment.career_task_templates.instructions}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Action Required</p>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Complete these {assignments.length} assignment{assignments.length > 1 ? 's' : ''} first, then try moving the job to the interviewing stage again.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <AlertDialogFooter className="px-6 py-4 border-t bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <AlertDialogCancel onClick={onCancel} className="flex-1 sm:flex-none">
              Keep in Applied
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onComplete}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
            >
              Go to Assignments
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}