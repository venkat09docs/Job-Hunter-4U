import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WriteEffectiveResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResumeGenerated: (resume: string) => void;
}

export const WriteEffectiveResumeDialog = ({ 
  open, 
  onOpenChange, 
  onResumeGenerated 
}: WriteEffectiveResumeDialogProps) => {
  const [formData, setFormData] = useState({
    currentjobtitle: "",
    shortsummary: "",
    keyskillsofexpertise: "",
    mostrecentjobtitle: "",
    education: "",
    certifications: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const missingFields = Object.entries(formData).filter(([_, value]) => !value.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-effective-resume', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data?.resume) {
        onResumeGenerated(data.resume);
        onOpenChange(false);
        setFormData({
          currentjobtitle: "",
          shortsummary: "",
          keyskillsofexpertise: "",
          mostrecentjobtitle: "",
          education: "",
          certifications: ""
        });
        toast({
          title: "Resume Generated!",
          description: "Your effective resume has been generated successfully."
        });
      } else {
        throw new Error('No resume content received');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Write an Effective Resume</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentjobtitle">Current Job Title *</Label>
            <Input
              id="currentjobtitle"
              value={formData.currentjobtitle}
              onChange={(e) => handleInputChange('currentjobtitle', e.target.value)}
              placeholder="e.g., Software Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortsummary">Short Summary *</Label>
            <Textarea
              id="shortsummary"
              value={formData.shortsummary}
              onChange={(e) => handleInputChange('shortsummary', e.target.value)}
              placeholder="Brief summary of your professional background and achievements"
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyskillsofexpertise">Key Skills & Areas of Expertise *</Label>
            <Textarea
              id="keyskillsofexpertise"
              value={formData.keyskillsofexpertise}
              onChange={(e) => handleInputChange('keyskillsofexpertise', e.target.value)}
              placeholder="e.g., JavaScript, React, Node.js, Project Management, etc."
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mostrecentjobtitle">Most Recent Job *</Label>
            <Input
              id="mostrecentjobtitle"
              value={formData.mostrecentjobtitle}
              onChange={(e) => handleInputChange('mostrecentjobtitle', e.target.value)}
              placeholder="e.g., Senior Software Developer at ABC Company"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Education *</Label>
            <Input
              id="education"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="e.g., Bachelor's in Computer Science, XYZ University"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications *</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) => handleInputChange('certifications', e.target.value)}
              placeholder="e.g., AWS Certified Solutions Architect, PMP Certification, etc."
              className="min-h-[60px]"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Resume'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};