import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAffiliate } from '@/hooks/useAffiliate';
import { usePayoutRequests } from '@/hooks/usePayoutRequests';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Users, DollarSign, Share2, AlertCircle, CheckCircle, ArrowLeft, LayoutDashboard, CreditCard, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import PayoutRequestDialog from '@/components/PayoutRequestDialog';
import PayoutSettingsDialog from '@/components/PayoutSettingsDialog';

const Affiliate = () => {
  const navigate = useNavigate();
  const { profile, hasActiveSubscription } = useProfile();
  const { 
    affiliateData, 
    referrals, 
    loading, 
    creating, 
    createAffiliateAccount, 
    getAffiliateLink, 
    copyAffiliateLink,
    recalculateAffiliateData 
  } = useAffiliate();

  const { 
    payoutRequests, 
    requesting, 
    requestPayout, 
    canRequestPayout,
    refreshPayoutRequests 
  } = usePayoutRequests(affiliateData?.id);

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // No need to check for active subscription anymore since users are auto-eligible

  // If user doesn't have affiliate account yet
  if (!affiliateData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Program</h1>
            <p className="text-muted-foreground mt-2">
              Earn commissions by referring new users to our platform
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Join Our Affiliate Program</CardTitle>
              <CardDescription>
                Earn dynamic commissions by referring new users to our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Get your unique affiliate link</li>
                  <li>• Share it with your network</li>
                  <li>• Earn up to 20% commission on successful subscriptions</li>
                  <li>• Higher rates for longer plans</li>
                  <li>• Track your earnings and referrals</li>
                </ul>
              </div>
              <Button 
                onClick={createAffiliateAccount} 
                disabled={creating}
                className="w-full"
              >
                {creating ? 'Creating Account...' : 'Join Affiliate Program'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Your affiliate account will be reviewed and approved by our admin team.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const affiliateLink = getAffiliateLink();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Affiliate Program</h1>
              <Badge variant={affiliateData.is_eligible ? "default" : "secondary"}>
                {affiliateData.is_eligible ? 'Active' : 'Pending Approval'}
              </Badge>
            </div>
          </div>
          
          {/* Payout Buttons */}
          {affiliateData.is_eligible && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPayoutDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={!canRequestPayout(affiliateData)}
              >
                <CreditCard className="h-4 w-4" />
                Request Payout
              </Button>
              <Button
                variant="outline"
                onClick={() => setSettingsDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* 15-day waiting message for payout */}
        {affiliateData.is_eligible && !canRequestPayout(affiliateData) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to wait 15 days after earning your first commission before requesting a payout. 
              This waiting period helps ensure commission stability.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Track your referrals and earnings
            </p>
          </div>
        </div>

        {/* Status Alert */}
        {!affiliateData.is_eligible && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your affiliate account is pending approval from our admin team. 
              You'll be notified once it's approved.
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Fix for Double Calculation - Temporary */}
        {affiliateData.is_eligible && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>If your earnings appear incorrect, click to recalculate:</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={recalculateAffiliateData}
              >
                Recalculate Earnings
              </Button>
            </AlertDescription>
          </Alert>
        )}


        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{affiliateData.total_earnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                From {affiliateData.total_referrals || 0} referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{affiliateData.total_referrals || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successful subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10-20%</div>
              <p className="text-xs text-muted-foreground">
                Based on plan selected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Affiliate Link
            </CardTitle>
            <CardDescription>
              Share this link to start earning commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                {affiliateLink}
              </div>
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyAffiliateLink}
                disabled={!affiliateData.is_eligible}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {!affiliateData.is_eligible && (
              <p className="text-xs text-muted-foreground mt-2">
                Link will be active once your account is approved
              </p>
            )}
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
            <CardDescription>
              Track your successful referrals and earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No referrals yet. Start sharing your affiliate link!
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {referral.referred_user?.full_name || referral.referred_user?.username || 'New User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{referral.referred_user?.username || referral.referred_user?.email?.split('@')[0] || 'unknown'} • {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">₹{referral.commission_amount.toFixed(2)}</p>
                      <Badge variant={
                        referral.status === 'paid' ? 'default' : 
                        referral.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {referral.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>
              Track your payout requests and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payoutRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payout requests yet. Request a payout once you have earned commissions!
              </div>
            ) : (
              <div className="space-y-4">
                {payoutRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">₹{request.requested_amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested on {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                      {request.admin_notes && (
                        <p className="text-sm text-muted-foreground">
                          Note: {request.admin_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
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
                      {request.processed_at && (
                        <p className="text-xs text-muted-foreground">
                          {request.status === 'completed' ? 'Completed' : 'Updated'}: {new Date(request.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Request Dialog */}
        <PayoutRequestDialog
          open={payoutDialogOpen}
          onOpenChange={setPayoutDialogOpen}
          maxAmount={affiliateData?.total_earnings || 0}
          onConfirm={requestPayout}
          loading={requesting}
          canRequest={canRequestPayout(affiliateData)}
        />

        {/* Payout Settings Dialog */}
        <PayoutSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          affiliateId={affiliateData?.id || ''}
        />
      </div>
    </div>
  );
};

export default Affiliate;