import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GenerateAchievementsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAchievementsGenerated: (achievements: string) => void;
}

export const GenerateAchievementsDialog = ({ 
  isOpen, 
  onClose, 
  onAchievementsGenerated 
}: GenerateAchievementsDialogProps) => {
  const [skills, setSkills] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!skills.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your job skills.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-achievements', {
        body: { skills: skills.trim() }
      });

      if (error) throw error;

      if (data?.achievements) {
        onAchievementsGenerated(data.achievements);
        handleClose();
        toast({
          title: 'Achievements Generated!',
          description: 'AI-generated achievements have been added to your experience description.',
        });
      } else {
        throw new Error('No achievements received from the API');
      }
    } catch (error) {
      console.error('Error generating achievements:', error);
      toast({
        title: 'Error generating achievements',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSkills('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate Achievements</DialogTitle>
            <DialogDescription>
              Enter your job skills and we'll generate quantifiable achievements that hiring managers would expect from top performers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="skills" className="text-sm font-medium">
                Job Skills *
              </Label>
              <Textarea
                id="skills"
                placeholder="Enter your job skills (e.g., JavaScript, Project Management, Data Analysis, Team Leadership, etc.)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-1"
                rows={4}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                List the skills relevant to this role. The AI will generate achievements that showcase these skills.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Achievements'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};