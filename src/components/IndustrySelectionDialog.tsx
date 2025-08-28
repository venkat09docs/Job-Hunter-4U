import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Building2, Code, Users, Briefcase, Globe } from 'lucide-react';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { useToast } from '@/hooks/use-toast';

interface IndustrySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IndustrySelectionDialog = ({ open, onOpenChange }: IndustrySelectionDialogProps) => {
  const [selectedIndustry, setSelectedIndustry] = useState<'IT' | 'Non-IT' | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateIndustry } = useUserIndustry();
  const { toast } = useToast();

  const handleSelection = async () => {
    if (!selectedIndustry) return;

    
    setLoading(true);
    try {
      const success = await updateIndustry(selectedIndustry);
      if (success) {
        toast({
          title: "Industry Updated",
          description: `Your industry has been set to ${selectedIndustry}`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update your industry. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to Job Hunter Pro!</DialogTitle>
          <DialogDescription className="text-center text-base">
            Let's personalize your experience. Which industry best describes your career focus?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
              selectedIndustry === 'IT' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedIndustry('IT')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Information Technology</CardTitle>
              <CardDescription>
                Software development, programming, tech roles
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Code className="h-4 w-4" />
                  <span>GitHub progress tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Tech-specific job searches</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Developer network building</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
              selectedIndustry === 'Non-IT' 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedIndustry('Non-IT')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Non-IT Industries</CardTitle>
              <CardDescription>
                Business, finance, healthcare, education, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Industry-specific job searches</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Professional network building</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>Cross-industry opportunities</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleSelection}
            disabled={!selectedIndustry || loading}
            className="px-8 py-2"
            variant="hero"
          >
            {loading ? "Setting up your profile..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};