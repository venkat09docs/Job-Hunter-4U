import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { usePayoutSettings } from '@/hooks/usePayoutSettings';
import { toast } from '@/hooks/use-toast';

interface PayoutSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId: string;
}

const PayoutSettingsDialog: React.FC<PayoutSettingsDialogProps> = ({
  open,
  onOpenChange,
  affiliateId
}) => {
  const { payoutSettings, loading, updatePayoutSettings } = usePayoutSettings(affiliateId);
  
  const [formData, setFormData] = useState({
    payment_method: payoutSettings?.payment_method || '',
    account_details: payoutSettings?.account_details || '',
    account_holder_name: payoutSettings?.account_holder_name || '',
    ifsc_code: payoutSettings?.ifsc_code || '',
    bank_name: payoutSettings?.bank_name || ''
  });

  const paymentMethods = [
    { value: 'phonepe', label: 'Phone Pay' },
    { value: 'googlepay', label: 'Google Pay' },
    { value: 'paytm', label: 'Paytm' },
    { value: 'upi', label: 'UPI ID' },
    { value: 'bank', label: 'Bank Account' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.payment_method || !formData.account_details || !formData.account_holder_name) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await updatePayoutSettings(formData);
      toast({
        title: "Settings Updated",
        description: "Your payout settings have been saved successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payout settings",
        variant: "destructive"
      });
    }
  };

  const getPlaceholderText = () => {
    switch (formData.payment_method) {
      case 'phonepe':
      case 'googlepay':
      case 'paytm':
      case 'upi':
        return 'Enter UPI ID (e.g., yourname@paytm)';
      case 'bank':
        return 'Account Number';
      default:
        return 'Enter account details';
    }
  };

  const getAdditionalFields = () => {
    if (formData.payment_method === 'bank') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input
              id="ifsc"
              value={formData.ifsc_code || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value }))}
              placeholder="Enter IFSC code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={formData.bank_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
              placeholder="Enter bank name"
            />
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Payout Settings
          </DialogTitle>
          <DialogDescription>
            Configure your preferred payment method for receiving payouts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder_name">Account Holder Name</Label>
            <Input
              id="account_holder_name"
              value={formData.account_holder_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
              placeholder="Enter account holder name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_details">
              {formData.payment_method === 'bank' ? 'Account Number' : 'UPI ID'}
            </Label>
            <Input
              id="account_details"
              value={formData.account_details}
              onChange={(e) => setFormData(prev => ({ ...prev, account_details: e.target.value }))}
              placeholder={getPlaceholderText()}
              required
            />
          </div>

          {getAdditionalFields()}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment information is encrypted and securely stored. It will only be used for processing approved payouts.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutSettingsDialog;