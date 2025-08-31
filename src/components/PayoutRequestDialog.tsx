import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmount: number;
  onConfirm: (amount: number) => void;
  loading: boolean;
  canRequest: boolean;
}

const PayoutRequestDialog: React.FC<PayoutRequestDialogProps> = ({
  open,
  onOpenChange,
  maxAmount,
  onConfirm,
  loading,
  canRequest
}) => {
  const [amount, setAmount] = useState(maxAmount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requestAmount = parseFloat(amount);
    if (requestAmount > 0 && requestAmount <= maxAmount) {
      onConfirm(requestAmount);
      onOpenChange(false);
      setAmount(maxAmount.toString());
    }
  };

  const amountValue = parseFloat(amount) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Request a payout for your affiliate earnings. The minimum payout amount is ₹100.
          </DialogDescription>
        </DialogHeader>

        {!canRequest ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to wait 15 days after earning your first commission and have earnings to request a payout.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payout Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="100"
                    max={maxAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    placeholder="Enter amount"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Available amount: ₹{maxAmount.toFixed(2)}
                </p>
              </div>

              {amountValue > maxAmount && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Amount cannot exceed your available earnings of ₹{maxAmount.toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}

              {amountValue < 100 && amountValue > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Minimum payout amount is ₹100
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Payout requests are processed by our admin team within 3-5 business days.
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
                disabled={loading || amountValue < 100 || amountValue > maxAmount || amountValue <= 0}
              >
                {loading ? 'Requesting...' : 'Request Payout'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRequestDialog;