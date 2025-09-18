import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle } from "lucide-react";

interface ResumePrerequisiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  hasKeySkills: boolean;
  hasExperience: boolean;
}

export const ResumePrerequisiteDialog = ({ 
  open, 
  onOpenChange, 
  onProceed,
  hasKeySkills,
  hasExperience
}: ResumePrerequisiteDialogProps) => {
  const allCompleted = hasKeySkills && hasExperience;

  const handleProceed = () => {
    if (allCompleted) {
      onProceed();
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Prerequisites Required
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-sm text-muted-foreground">
              First complete the following two tasks before generating your resume summary:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {hasKeySkills ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-sm">Complete Key Skills Section</p>
                  <p className="text-xs text-muted-foreground">
                    {hasKeySkills ? "✓ Completed" : "Add your key skills and expertise"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                {hasExperience ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-sm">Complete Experience Section</p>
                  <p className="text-xs text-muted-foreground">
                    {hasExperience ? "✓ Completed" : "Add your work experience details"}
                  </p>
                </div>
              </div>
            </div>

            {!allCompleted && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Please complete the missing sections above before proceeding.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>
            No, I didn't complete it
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleProceed}
            className={allCompleted ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}
            disabled={!allCompleted}
          >
            Yes, I have completed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};