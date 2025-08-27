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
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "destructive";
    if (diffDays <= 1) return "secondary";
    return "outline";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
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

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {assignment.career_task_templates?.title || "Interview Preparation Task"}
                      </CardTitle>
                      <CardDescription className="mt-1">
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
                          <ul className="list-disc pl-4 space-y-1">
                            {Object.values(assignment.career_task_templates.instructions).map((instruction: any, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{assignment.career_task_templates.instructions}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Action Required</p>
          </div>
          <p className="text-sm text-amber-700">
            Complete these {assignments.length} assignment{assignments.length > 1 ? 's' : ''} first, then try moving the job to the interviewing stage again.
          </p>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            Keep in Applied
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onComplete}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Go to Assignments
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}