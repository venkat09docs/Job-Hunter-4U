import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TestTube, Loader2 } from 'lucide-react';

export const TestPointsButton: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);

  const handleTestPoints = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-points-awarding', {
        body: {}
      });
      
      if (error) throw error;
      
      console.log('Test points result:', data);
      toast.success(`Points test successful! Total points: ${data.previousTotal} → ${data.newTotal} (+${data.pointsAdded})`);
    } catch (error) {
      console.error('Error testing points:', error);
      toast.error('Failed to test points awarding: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTestPoints}
      disabled={isTesting}
      className="flex items-center gap-2"
    >
      {isTesting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <TestTube className="w-4 h-4" />
      )}
      {isTesting ? 'Testing...' : 'Test Points (+5)'}
    </Button>
  );
};