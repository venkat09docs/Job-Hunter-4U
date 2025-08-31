import React from 'react';
import { useAffiliateAdmin } from '@/hooks/useAffiliateAdmin';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AffiliateManagement = () => {
  const { affiliateUsers, loading, updating, updateAffiliateEligibility } = useAffiliateAdmin();
  const { role } = useRole();
  const isAdmin = role === 'admin';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalAffiliates = affiliateUsers.length;
  const activeAffiliates = affiliateUsers.filter(user => user.is_eligible).length;
  const pendingAffiliates = affiliateUsers.filter(user => !user.is_eligible).length;
  const totalEarnings = affiliateUsers.reduce((sum, user) => sum + (user.total_earnings || 0), 0);
  const totalReferrals = affiliateUsers.reduce((sum, user) => sum + (user.total_referrals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Affiliate Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage affiliate users and their eligibility
        </p>
      </div>

      {/* Stats Cards - Only for Super Admin */}
      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAffiliates}</div>
              <p className="text-xs text-muted-foreground">
                {activeAffiliates} active, {pendingAffiliates} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAffiliates}</div>
              <p className="text-xs text-muted-foreground">
                Currently eligible
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                All time commissions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                Successful referrals
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Affiliate Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Affiliate Users</CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Manage affiliate user eligibility and track performance' 
              : 'Review and approve affiliate applications'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliateUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                No affiliate users found. Users with active subscriptions can apply to join the affiliate program.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {affiliateUsers.map((affiliateUser) => (
                <div key={affiliateUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {affiliateUser.profiles?.full_name || affiliateUser.profiles?.username || 'Unknown User'}
                      </p>
                      <Badge variant={affiliateUser.is_eligible ? "default" : "secondary"}>
                        {affiliateUser.is_eligible ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {affiliateUser.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code: {affiliateUser.affiliate_code}
                      {isAdmin && (
                        <> • Referrals: {affiliateUser.total_referrals} • Earnings: ₹{affiliateUser.total_earnings?.toFixed(2) || '0.00'}</>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {isAdmin && (
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{affiliateUser.total_earnings?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-muted-foreground">{affiliateUser.total_referrals} referrals</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={affiliateUser.is_eligible}
                        onCheckedChange={(checked) => updateAffiliateEligibility(affiliateUser.id, checked)}
                        disabled={updating === affiliateUser.id}
                      />
                      <span className="text-sm">
                        {affiliateUser.is_eligible ? 'Eligible' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateManagement;