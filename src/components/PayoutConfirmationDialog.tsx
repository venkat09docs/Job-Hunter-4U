import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface PayoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payoutRequest: any;
  onConfirm: (notes?: string) => void;
  loading: boolean;
}

const PayoutConfirmationDialog: React.FC<PayoutConfirmationDialogProps> = ({
  open,
  onOpenChange,
  payoutRequest,
  onConfirm,
  loading
}) => {
  const [confirmationNotes, setConfirmationNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(confirmationNotes);
    onOpenChange(false);
    setConfirmationNotes('');
  };

  if (!payoutRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Confirm Payout Receipt
          </DialogTitle>
          <DialogDescription>
            Confirm that you have received this payout to help us track successful payments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <p className="font-medium">Payout Amount: ₹{payoutRequest.requested_amount?.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  Processed on: {new Date(payoutRequest.processed_at).toLocaleDateString()}
                </p>
                {payoutRequest.admin_notes && (
                  <p className="text-sm text-muted-foreground">
                    Admin notes: {payoutRequest.admin_notes}
                  </p>
                )}
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                By confirming, you acknowledge that you have received the payout amount in your registered payment method.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmation_notes">Additional Notes (Optional)</Label>
              <Textarea
                id="confirmation_notes"
                value={confirmationNotes}
                onChange={(e) => setConfirmationNotes(e.target.value)}
                placeholder="Any additional comments about the payout..."
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This confirmation helps us improve our payout process. If you haven't received the payout, please contact support instead.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutConfirmationDialog;