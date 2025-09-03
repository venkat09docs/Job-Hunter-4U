import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefreshCw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobHuntingRequestReenableDialogProps {
  assignmentId: string;
  taskTitle: string;
  hasPendingRequest?: boolean;
  onRequestSent?: () => void;
}

export const JobHuntingRequestReenableDialog: React.FC<JobHuntingRequestReenableDialogProps> = ({
  assignmentId,
  taskTitle,
  hasPendingRequest = false,
  onRequestSent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the extension request');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Send notification to admins about the extension request
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.user.id,
          title: 'Job Hunting Extension Request',
          message: `Extension requested for: ${taskTitle}. Reason: ${reason.trim()}`,
          type: 'extension_request',
          metadata: {
            assignment_id: assignmentId,
            task_title: taskTitle,
            reason: reason.trim(),
            request_type: 'job_hunting_extension'
          }
        });

      if (error) throw error;

      toast.success('Extension request sent to admin successfully!');
      setReason('');
      setIsOpen(false);
      onRequestSent?.();
    } catch (error) {
      console.error('Error sending extension request:', error);
      toast.error('Failed to send extension request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's already a pending request, show different UI
  if (hasPendingRequest) {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        <Clock className="w-4 h-4 mr-2" />
        Extension Request Pending
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Request Extension
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Request Task Extension
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Task: <span className="font-medium">{taskTitle}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              The due date for this task has passed. You can request an admin to extend the deadline if you're still within the same week.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extension Request:</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need an extension (e.g., technical difficulties, personal circumstances, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={isSubmitting || !reason.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};