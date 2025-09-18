import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GenerateResumeSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSummaryGenerated: (summary: string) => void;
}

export const GenerateResumeSummaryDialog = ({ 
  open, 
  onOpenChange, 
  onSummaryGenerated 
}: GenerateResumeSummaryDialogProps) => {
  const [formData, setFormData] = useState({
    skills: '',
    achievements: '',
    total_years_of_exp: '',
    relevant_exp: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.skills.trim() || !formData.achievements.trim() || 
        !formData.total_years_of_exp.trim() || !formData.relevant_exp.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-resume-summary', {
        body: {
          skills: formData.skills,
          achievements: formData.achievements,
          total_years_of_exp: formData.total_years_of_exp,
          relevant_exp: formData.relevant_exp
        }
      });

      if (error) {
        console.error('Error generating resume summary:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate resume summary. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.summary) {
        onSummaryGenerated(data.summary);
        onOpenChange(false);
        
        // Reset form
        setFormData({
          skills: '',
          achievements: '',
          total_years_of_exp: '',
          relevant_exp: ''
        });

        toast({
          title: "Summary Generated!",
          description: "Your professional summary has been generated and added to your resume.",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Resume Summary
          </DialogTitle>
          <DialogDescription>
            Please provide the following information to generate a professional summary for your resume.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skills">Skills *</Label>
            <Textarea
              id="skills"
              placeholder="Enter your key skills (e.g., JavaScript, React, Python, Project Management)"
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achievements">Achievements *</Label>
            <Textarea
              id="achievements"
              placeholder="Enter your key achievements (e.g., Increased sales by 30%, Led team of 10 developers)"
              value={formData.achievements}
              onChange={(e) => handleInputChange('achievements', e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_years_of_exp">Total Years of Experience *</Label>
            <Input
              id="total_years_of_exp"
              placeholder="e.g., 5 years"
              value={formData.total_years_of_exp}
              onChange={(e) => handleInputChange('total_years_of_exp', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relevant_exp">Relevant Experience *</Label>
            <Input
              id="relevant_exp"
              placeholder="e.g., 3 years"
              value={formData.relevant_exp}
              onChange={(e) => handleInputChange('relevant_exp', e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};