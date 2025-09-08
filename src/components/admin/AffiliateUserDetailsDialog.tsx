import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Bell,
  Settings,
  AlertCircle,
  Mail,
  Zap
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AffiliateUserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateUser: any;
}

interface PayoutSettings {
  payment_method: string;
  account_holder_name: string;
  account_details: string;
  ifsc_code?: string;
  bank_name?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  payout_notifications: boolean;
  referral_notifications: boolean;
  commission_notifications: boolean;
  email_notifications: boolean;
  auto_payout_enabled: boolean;
  auto_payout_threshold: number;
  created_at: string;
  updated_at: string;
}

interface PayoutRequest {
  id: string;
  requested_amount: number;
  status: string;
  requested_at: string;
  processed_at?: string;
  admin_notes?: string;
  confirmed_by_user: boolean;
  confirmed_by_user_at?: string;
  user_confirmation_notes?: string;
}

const AffiliateUserDetailsDialog: React.FC<AffiliateUserDetailsDialogProps> = ({
  open,
  onOpenChange,
  affiliateUser
}) => {
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && affiliateUser?.id) {
      fetchUserDetails();
    }
  }, [open, affiliateUser?.id]);

  const fetchUserDetails = async () => {
    if (!affiliateUser?.id) return;
    
    setLoading(true);
    try {
      // Fetch payout settings
      const { data: payoutData } = await supabase
        .from('payout_settings')
        .select('*')
        .eq('affiliate_user_id', affiliateUser.id)
        .maybeSingle();

      setPayoutSettings(payoutData as PayoutSettings);

      // Fetch notification settings
      const { data: notificationData } = await supabase
        .from('affiliate_notification_settings')
        .select('*')
        .eq('affiliate_user_id', affiliateUser.id)
        .maybeSingle();

      setNotificationSettings(notificationData as NotificationSettings);

      // Fetch payout requests
      const { data: payoutRequestsData } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('affiliate_user_id', affiliateUser.id)
        .order('created_at', { ascending: false });

      setPayoutRequests(payoutRequestsData as PayoutRequest[] || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      phonepe: 'PhonePe',
      googlepay: 'Google Pay',
      paytm: 'Paytm',
      upi: 'UPI ID',
      bank: 'Bank Account'
    };
    return methods[method] || method;
  };

  if (!affiliateUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Affiliate User Details
          </DialogTitle>
          <DialogDescription>
            View payment settings and payout history for {affiliateUser.profiles?.full_name || affiliateUser.profiles?.username}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
            <TabsTrigger value="notifications">Preferences</TabsTrigger>
            <TabsTrigger value="payouts">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{affiliateUser.total_earnings?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{affiliateUser.total_referrals || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Badge variant={affiliateUser.is_eligible ? "default" : "secondary"}>
                    {affiliateUser.is_eligible ? 'Active' : 'Pending'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{affiliateUser.profiles?.full_name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <span>{affiliateUser.profiles?.username || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{affiliateUser.profiles?.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Affiliate Code:</span>
                    <span className="font-mono">{affiliateUser.affiliate_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{new Date(affiliateUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {loading ? (
              <Skeleton className="h-64" />
            ) : payoutSettings ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(payoutSettings.payment_method)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Holder:</span>
                      <span className="font-medium">{payoutSettings.account_holder_name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {payoutSettings.payment_method === 'bank' ? 'Account Number' : 'UPI ID'}:
                      </span>
                      <span className="font-mono text-sm">
                        {payoutSettings.account_details}
                      </span>
                    </div>

                    {payoutSettings.payment_method === 'bank' && (
                      <>
                        {payoutSettings.ifsc_code && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IFSC Code:</span>
                            <span className="font-mono">{payoutSettings.ifsc_code}</span>
                          </div>
                        )}
                        {payoutSettings.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank Name:</span>
                            <span>{payoutSettings.bank_name}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Verification Status:</span>
                      <Badge variant={payoutSettings.is_verified ? "default" : "destructive"}>
                        {payoutSettings.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-sm">
                        {new Date(payoutSettings.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  User has not configured their payment settings yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {loading ? (
              <Skeleton className="h-64" />
            ) : notificationSettings ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications:
                      </span>
                      <Badge variant={notificationSettings.email_notifications ? "default" : "secondary"}>
                        {notificationSettings.email_notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payout Notifications:</span>
                      <Badge variant={notificationSettings.payout_notifications ? "default" : "secondary"}>
                        {notificationSettings.payout_notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Referral Notifications:</span>
                      <Badge variant={notificationSettings.referral_notifications ? "default" : "secondary"}>
                        {notificationSettings.referral_notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Commission Notifications:</span>
                      <Badge variant={notificationSettings.commission_notifications ? "default" : "secondary"}>
                        {notificationSettings.commission_notifications ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Auto Payout:
                      </span>
                      <Badge variant={notificationSettings.auto_payout_enabled ? "default" : "secondary"}>
                        {notificationSettings.auto_payout_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {notificationSettings.auto_payout_enabled && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto Payout Threshold:</span>
                        <span className="font-medium">₹{notificationSettings.auto_payout_threshold}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  User has not configured their notification preferences yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {loading ? (
              <Skeleton className="h-64" />
            ) : payoutRequests.length > 0 ? (
              <div className="space-y-4">
                {payoutRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">₹{request.requested_amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            Requested on {new Date(request.requested_at).toLocaleDateString()}
                          </p>
                          {request.admin_notes && (
                            <p className="text-xs text-muted-foreground">
                              Admin notes: {request.admin_notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              request.status === 'completed' ? 'default' : 
                              request.status === 'approved' || request.status === 'processing' ? 'secondary' : 
                              request.status === 'rejected' ? 'destructive' : 'outline'
                            }>
                              {request.status === 'processing' ? 'Processing' :
                               request.status === 'approved' ? 'Approved' :
                               request.status === 'completed' ? 'Completed' :
                               request.status === 'rejected' ? 'Rejected' : 'Pending'}
                            </Badge>
                            
                            {request.confirmed_by_user && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                User Confirmed
                              </Badge>
                            )}
                          </div>

                          {request.confirmed_by_user && request.confirmed_by_user_at && (
                            <p className="text-xs text-green-600">
                              Confirmed: {new Date(request.confirmed_by_user_at).toLocaleDateString()}
                            </p>
                          )}

                          {request.user_confirmation_notes && (
                            <p className="text-xs text-muted-foreground max-w-xs text-right">
                              User note: {request.user_confirmation_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  User has not made any payout requests yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateUserDetailsDialog;