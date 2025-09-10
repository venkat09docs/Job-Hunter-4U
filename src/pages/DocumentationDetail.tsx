import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, CheckCircle, Circle, Clock, User, BookOpen, Target, Settings, Users, Trophy, BarChart, Edit, Trash2, Save, X } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";
import { useRole } from "@/hooks/useRole";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { toast } from "sonner";

export default function DocumentationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useRole();
  const { docData } = useKnowledgeBase();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const isEditMode = searchParams.get('edit') === 'true';
  
  // Get documentation content from knowledge base hook
  const findDocContent = () => {
    for (const category of docData) {
      const doc = category.docs?.find(d => d.id === id);
      if (doc) return doc;
    }
    return null;
  };

  const doc = findDocContent();
  
  // If no doc found, show error
  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/dashboard/knowledge-base"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Back to Knowledge Base</span>
              </Link>
              <div className="flex items-center gap-4">
                <SubscriptionStatus />
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto py-16 px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Documentation Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            The requested documentation could not be found.
          </p>
          <Button onClick={() => navigate('/dashboard/knowledge-base')}>
            Return to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  const handleSaveEdit = () => {
    // In a real app, this would make an API call to update the documentation
    console.log('Saving changes:', { title: editTitle, description: editDescription });
    toast.success("Documentation updated successfully");
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
    setIsEditing(true);
  };

  // Split content into steps if it contains markdown headers
  const parseContentSteps = (content: string) => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const steps = [];
    let currentStep = null;
    let stepContent = [];
    
    for (const line of lines) {
      if (line.startsWith('## Step ') || line.startsWith('## Day ')) {
        // Save previous step
        if (currentStep) {
          steps.push({
            ...currentStep,
            content: stepContent.join('\n').trim()
          });
        }
        
        // Start new step
        currentStep = {
          id: steps.length + 1,
          title: line.replace(/^## (Step \d+:|Day \d+:)\s*/, ''),
          content: ''
        };
        stepContent = [];
      } else if (currentStep) {
        stepContent.push(line);
      }
    }
    
    // Save last step
    if (currentStep) {
      steps.push({
        ...currentStep,
        content: stepContent.join('\n').trim()
      });
    }
    
    return steps;
  };

  const contentSteps = doc.content ? parseContentSteps(doc.content) : [];
  const hasSteps = contentSteps.length > 0;

  useEffect(() => {
    if (hasSteps && currentStep > contentSteps.length) {
      setCurrentStep(1);
    }
  }, [hasSteps, contentSteps.length, currentStep]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard/knowledge-base"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Back to Knowledge Base</span>
            </Link>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {doc.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {doc.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {doc.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {doc.readTime}
                  </div>
                )}
                {doc.lastUpdated && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Updated {doc.lastUpdated}
                  </div>
                )}
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Documentation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this documentation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <CardDescription>
                  Track your completion of this guide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show progress only if content has steps */}
                  {hasSteps && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Completed</span>
                          <span>{completedSteps.length}/{contentSteps.length}</span>
                        </div>
                        <Progress 
                          value={contentSteps.length > 0 ? (completedSteps.length / contentSteps.length) * 100 : 0} 
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Steps:</h4>
                        {contentSteps.map((step, index) => {
                          const stepNumber = index + 1;
                          const isCompleted = completedSteps.includes(stepNumber);
                          const isCurrent = currentStep === stepNumber;
                          
                          return (
                            <button
                              key={step.id}
                              onClick={() => setCurrentStep(stepNumber)}
                              className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                                isCurrent 
                                  ? 'bg-primary text-primary-foreground' 
                                  : isCompleted 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                    : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle className="h-3 w-3 flex-shrink-0" />
                                ) : (
                                  <Circle className="h-3 w-3 flex-shrink-0" />
                                )}
                                <span className="truncate">{step.title}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {/* Show simple message for content-only docs */}
                  {!hasSteps && (
                    <div className="text-sm text-muted-foreground">
                      This is a comprehensive guide with detailed instructions and best practices.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {/* Step Navigation - only show for docs with steps */}
                {hasSteps && (
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Step {currentStep} of {contentSteps.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(Math.min(contentSteps.length, currentStep + 1))}
                        disabled={currentStep === contentSteps.length}
                      >
                        Next
                      </Button>
                    </div>
                    
                    <Button
                      variant={completedSteps.includes(currentStep) ? "secondary" : "default"}
                      size="sm"
                      onClick={() => {
                        if (completedSteps.includes(currentStep)) {
                          setCompletedSteps(prev => prev.filter(step => step !== currentStep));
                        } else {
                          setCompletedSteps(prev => [...prev, currentStep]);
                        }
                      }}
                    >
                      {completedSteps.includes(currentStep) ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                  </div>
                )}

                {/* Step Content for docs with parsed steps */}
                {hasSteps && contentSteps.map((step, index) => {
                  const stepNumber = index + 1;
                  if (stepNumber !== currentStep) return null;
                  
                  return (
                    <div key={step.id} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {stepNumber}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {step.title}
                          </h2>
                        </div>
                      </div>
                      
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                          {step.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Content for docs without steps (show full markdown content) */}
                {!hasSteps && doc.content && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {doc.content}
                    </div>
                  </div>
                )}

                {/* Show message if no content */}
                {!doc.content && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Content Coming Soon
                    </h3>
                    <p className="text-muted-foreground">
                      This documentation is being prepared and will be available soon.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Documentation</DialogTitle>
            <DialogDescription>
              Update the title and description for this documentation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Documentation title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description of the documentation"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}