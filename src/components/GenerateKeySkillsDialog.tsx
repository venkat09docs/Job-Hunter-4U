import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GenerateKeySkillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkillsGenerated: (skills: string[]) => void;
}

export const GenerateKeySkillsDialog = ({ 
  open, 
  onOpenChange, 
  onSkillsGenerated 
}: GenerateKeySkillsDialogProps) => {
  const [formData, setFormData] = useState({
    therole: '',
    jd1: '',
    jd2: '',
    jd3: '',
    jd4: '',
    jd5: '',
    talent1: '',
    talent2: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields (role and at least one job description)
    if (!formData.therole.trim() || !formData.jd1.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the role and first job description.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-key-skills', {
        body: formData
      });

      if (error) {
        console.error('Error generating key skills:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate key skills. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.skills) {
        // Parse the skills response and convert to array
        const skillsArray = data.skills
          .split('\n')
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill && skill.length > 0)
          .map((skill: string) => skill.replace(/^[•\-\d\.]\s*/, '')) // Remove bullet points or numbers
          .slice(0, 6); // Limit to 6 skills as mentioned in prompt

        onSkillsGenerated(skillsArray);
        onOpenChange(false);
        
        // Reset form
        setFormData({
          therole: '',
          jd1: '',
          jd2: '',
          jd3: '',
          jd4: '',
          jd5: '',
          talent1: '',
          talent2: ''
        });

        toast({
          title: "Skills Generated!",
          description: `${skillsArray.length} key skills have been generated and added to your resume.`,
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Key Skills
          </DialogTitle>
          <DialogDescription>
            Please provide the following information to generate key skills for your resume.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="therole">The Role You are Looking For *</Label>
            <Input
              id="therole"
              placeholder="e.g., Software Engineer, Marketing Manager, Data Analyst"
              value={formData.therole}
              onChange={(e) => handleInputChange('therole', e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Job Descriptions</Label>
            
            <div className="space-y-2">
              <Label htmlFor="jd1">Job Description from Company - 1 *</Label>
              <Textarea
                id="jd1"
                placeholder="Paste the job description from the first company..."
                value={formData.jd1}
                onChange={(e) => handleInputChange('jd1', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd2">Job Description from Company - 2</Label>
              <Textarea
                id="jd2"
                placeholder="Paste the job description from the second company..."
                value={formData.jd2}
                onChange={(e) => handleInputChange('jd2', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd3">Job Description from Company - 3</Label>
              <Textarea
                id="jd3"
                placeholder="Paste the job description from the third company..."
                value={formData.jd3}
                onChange={(e) => handleInputChange('jd3', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd4">Job Description from Company - 4</Label>
              <Textarea
                id="jd4"
                placeholder="Paste the job description from the fourth company..."
                value={formData.jd4}
                onChange={(e) => handleInputChange('jd4', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd5">Job Description from Company - 5</Label>
              <Textarea
                id="jd5"
                placeholder="Paste the job description from the fifth company..."
                value={formData.jd5}
                onChange={(e) => handleInputChange('jd5', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Your Unique Talents</Label>
            
            <div className="space-y-2">
              <Label htmlFor="talent1">Talent - 1</Label>
              <Input
                id="talent1"
                placeholder="Enter your first unique talent or strength"
                value={formData.talent1}
                onChange={(e) => handleInputChange('talent1', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="talent2">Talent - 2</Label>
              <Input
                id="talent2"
                placeholder="Enter your second unique talent or strength"
                value={formData.talent2}
                onChange={(e) => handleInputChange('talent2', e.target.value)}
              />
            </div>
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
                  Generate Key Skills
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};