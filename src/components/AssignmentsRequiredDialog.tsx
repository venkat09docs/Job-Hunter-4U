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
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertTriangle, Save, ArrowRight, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(new Set());

  const handleAssignmentToggle = (assignmentId: string, checked: boolean) => {
    setCompletedAssignments(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(assignmentId);
      } else {
        newSet.delete(assignmentId);
      }
      return newSet;
    });
  };

  const allAssignmentsCompleted = completedAssignments.size === assignments.length;

  // Reset completed assignments when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCompletedAssignments(new Set());
    }
  }, [open]);

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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Checkbox
                          id={`assignment-${assignment.id}`}
                          checked={completedAssignments.has(assignment.id)}
                          onCheckedChange={(checked) => handleAssignmentToggle(assignment.id, checked as boolean)}
                          className="h-5 w-5"
                        />
                        <label htmlFor={`assignment-${assignment.id}`} className="text-sm font-medium cursor-pointer">
                          Mark Complete
                        </label>
                      </div>
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
              disabled={!allAssignmentsCompleted}
              className="flex-1 sm:flex-none h-11 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Complete & Move to Interviewing
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {allAssignmentsCompleted 
              ? "All assignments completed! You can now move to the interviewing stage."
              : `Mark all assignments as complete (${completedAssignments.size}/${assignments.length}) to move to interviewing stage.`
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}