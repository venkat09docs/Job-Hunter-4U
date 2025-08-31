import React from 'react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Users, DollarSign, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const Affiliate = () => {
  const { profile, hasActiveSubscription } = useProfile();
  const { 
    affiliateData, 
    referrals, 
    loading, 
    creating, 
    createAffiliateAccount, 
    getAffiliateLink, 
    copyAffiliateLink 
  } = useAffiliate();

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

  // Check if user has active subscription
  if (!hasActiveSubscription()) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Program</h1>
            <p className="text-muted-foreground mt-2">
              Earn commissions by referring new users to our platform
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need an active subscription to join our affiliate program. 
              Please upgrade your plan to get started.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
                Start earning 10% commission on every successful referral
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Get your unique affiliate link</li>
                  <li>• Share it with your network</li>
                  <li>• Earn 10% commission on successful subscriptions</li>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track your referrals and earnings
            </p>
          </div>
          <Badge variant={affiliateData.is_eligible ? "default" : "secondary"}>
            {affiliateData.is_eligible ? 'Active' : 'Pending Approval'}
          </Badge>
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
              <div className="text-2xl font-bold">10%</div>
              <p className="text-xs text-muted-foreground">
                Per successful referral
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
                        {referral.referred_user?.full_name || referral.referred_user?.email || 'New User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
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
      </div>
    </div>
  );
};

export default Affiliate;