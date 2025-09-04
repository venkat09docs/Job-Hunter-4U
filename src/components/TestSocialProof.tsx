import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TestSocialProof = () => {
  const createTestEvent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('track-social-proof-event', {
        body: {
          event_type: 'job_application',
          user_first_name: 'Test User',
          event_data: { job_title: 'Software Engineer', company: 'Google' }
        }
      });

      if (error) {
        console.error('Error creating test social proof event:', error);
        toast.error('Failed to create test event');
      } else {
        console.log('Test social proof event created:', data);
        toast.success('Test social proof event created!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create test event');
    }
  };

  return (
    <Button onClick={createTestEvent} variant="outline" size="sm">
      Test Social Proof
    </Button>
  );
};