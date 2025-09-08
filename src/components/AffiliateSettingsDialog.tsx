import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, CreditCard, DollarSign, Mail, Zap } from 'lucide-react';
import { usePayoutSettings } from '@/hooks/usePayoutSettings';
import { useAffiliateNotificationSettings } from '@/hooks/useAffiliateNotificationSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AffiliateSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId: string;
}

const AffiliateSettingsDialog: React.FC<AffiliateSettingsDialogProps> = ({
  open,
  onOpenChange,
  affiliateId
}) => {
  const { payoutSettings, loading: payoutLoading, updatePayoutSettings } = usePayoutSettings(affiliateId);
  const { settings, loading: settingsLoading, updateSettings } = useAffiliateNotificationSettings(affiliateId);

  const [payoutForm, setPayoutForm] = useState({
    payment_method: payoutSettings?.payment_method || '',
    account_details: payoutSettings?.account_details || '',
    account_holder_name: payoutSettings?.account_holder_name || '',
    ifsc_code: payoutSettings?.ifsc_code || '',
    bank_name: payoutSettings?.bank_name || ''
  });

  const [notificationForm, setNotificationForm] = useState({
    payout_notifications: settings?.payout_notifications ?? true,
    referral_notifications: settings?.referral_notifications ?? true,
    commission_notifications: settings?.commission_notifications ?? true,
    email_notifications: settings?.email_notifications ?? true,
    auto_payout_enabled: settings?.auto_payout_enabled ?? false,
    auto_payout_threshold: settings?.auto_payout_threshold ?? 1000
  });

  React.useEffect(() => {
    if (payoutSettings) {
      setPayoutForm({
        payment_method: payoutSettings.payment_method || '',
        account_details: payoutSettings.account_details || '',
        account_holder_name: payoutSettings.account_holder_name || '',
        ifsc_code: payoutSettings.ifsc_code || '',
        bank_name: payoutSettings.bank_name || ''
      });
    }
  }, [payoutSettings]);

  React.useEffect(() => {
    if (settings) {
      setNotificationForm({
        payout_notifications: settings.payout_notifications,
        referral_notifications: settings.referral_notifications,
        commission_notifications: settings.commission_notifications,
        email_notifications: settings.email_notifications,
        auto_payout_enabled: settings.auto_payout_enabled,
        auto_payout_threshold: settings.auto_payout_threshold
      });
    }
  }, [settings]);

  const paymentMethods = [
    { value: 'phonepe', label: 'Phone Pay' },
    { value: 'googlepay', label: 'Google Pay' },
    { value: 'paytm', label: 'Paytm' },
    { value: 'upi', label: 'UPI ID' },
    { value: 'bank', label: 'Bank Account' }
  ];

  const handlePayoutSubmit = async () => {
    try {
      await updatePayoutSettings(payoutForm);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleNotificationSubmit = async () => {
    try {
      await updateSettings(notificationForm);
    } catch (error) {
      // Error handled in hook
    }
  };

  const getPlaceholderText = () => {
    switch (payoutForm.payment_method) {
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
    if (payoutForm.payment_method === 'bank') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input
              id="ifsc"
              value={payoutForm.ifsc_code || ''}
              onChange={(e) => setPayoutForm(prev => ({ ...prev, ifsc_code: e.target.value }))}
              placeholder="Enter IFSC code"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={payoutForm.bank_name || ''}
              onChange={(e) => setPayoutForm(prev => ({ ...prev, bank_name: e.target.value }))}
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Affiliate Settings
          </DialogTitle>
          <DialogDescription>
            Configure your affiliate account preferences and payout settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="payout" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payout" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payout Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={payoutForm.payment_method}
                    onValueChange={(value) => setPayoutForm(prev => ({ ...prev, payment_method: value }))}
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
                    value={payoutForm.account_holder_name}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                    placeholder="Enter account holder name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_details">
                    {payoutForm.payment_method === 'bank' ? 'Account Number' : 'UPI ID'}
                  </Label>
                  <Input
                    id="account_details"
                    value={payoutForm.account_details}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, account_details: e.target.value }))}
                    placeholder={getPlaceholderText()}
                  />
                </div>

                {getAdditionalFields()}

                <Button 
                  onClick={handlePayoutSubmit} 
                  disabled={payoutLoading}
                  className="w-full"
                >
                  {payoutLoading ? 'Saving...' : 'Save Payment Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your affiliate activities
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.email_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationForm(prev => ({ ...prev, email_notifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payout Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about payout status changes
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.payout_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationForm(prev => ({ ...prev, payout_notifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Referral Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone uses your referral link
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.referral_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationForm(prev => ({ ...prev, referral_notifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Commission Earned Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you earn new commissions
                      </p>
                    </div>
                    <Switch
                      checked={notificationForm.commission_notifications}
                      onCheckedChange={(checked) => 
                        setNotificationForm(prev => ({ ...prev, commission_notifications: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Auto Payout
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically request payout when threshold is reached
                        </p>
                      </div>
                      <Switch
                        checked={notificationForm.auto_payout_enabled}
                        onCheckedChange={(checked) => 
                          setNotificationForm(prev => ({ ...prev, auto_payout_enabled: checked }))
                        }
                      />
                    </div>

                    {notificationForm.auto_payout_enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="auto_payout_threshold">Auto Payout Threshold (₹)</Label>
                        <Input
                          id="auto_payout_threshold"
                          type="number"
                          min="100"
                          value={notificationForm.auto_payout_threshold}
                          onChange={(e) => 
                            setNotificationForm(prev => ({ 
                              ...prev, 
                              auto_payout_threshold: parseFloat(e.target.value) || 1000 
                            }))
                          }
                          placeholder="Enter threshold amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum threshold is ₹100
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Auto payout will only work if you have configured your payment method above.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleNotificationSubmit} 
                  disabled={settingsLoading}
                  className="w-full"
                >
                  {settingsLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateSettingsDialog;