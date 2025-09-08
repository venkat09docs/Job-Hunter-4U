import React, { useState } from 'react';
import { useAffiliateAdmin } from '@/hooks/useAffiliateAdmin';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Settings,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AffiliatePlanCommissions from './AffiliatePlanCommissions';
import AffiliateUserDetailsDialog from './AffiliateUserDetailsDialog';

const AffiliateManagement = () => {
  const { 
    affiliateUsers, 
    payoutRequests, 
    loading, 
    updating, 
    updateAffiliateEligibility, 
    updatePayoutRequest,
    currentPage,
    totalPages,
    totalUsers,
    searchQuery,
    statusFilter,
    setCurrentPage,
    setSearchQuery,
    setStatusFilter,
    itemsPerPage
  } = useAffiliateAdmin();
  const { role } = useRole();
  const isAdmin = role === 'admin';
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
  const pendingPayouts = payoutRequests?.filter(req => req.status === 'pending').length || 0;
  const totalPayoutAmount = payoutRequests?.reduce((sum, req) => sum + (req.requested_amount || 0), 0) || 0;

  const handlePayoutAction = (payout: any, action: 'approved' | 'rejected' | 'processing' | 'completed') => {
    setSelectedPayout({ ...payout, action });
    setPayoutDialogOpen(true);
    setAdminNotes('');
    setRejectionReason('');
  };

  const submitPayoutUpdate = async () => {
    if (!selectedPayout) return;
    
    await updatePayoutRequest(
      selectedPayout.id,
      selectedPayout.action,
      adminNotes,
      selectedPayout.action === 'rejected' ? rejectionReason : undefined
    );
    
    setPayoutDialogOpen(false);
    setSelectedPayout(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Affiliate Management</h2>
        <p className="text-muted-foreground">
          Manage affiliate users, their eligibility, and process payout requests
        </p>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview & Users</TabsTrigger>
          <TabsTrigger value="commissions">Plan Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

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
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayouts}</div>
              <p className="text-xs text-muted-foreground">
                ₹{totalPayoutAmount.toFixed(2)} total requested
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
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {affiliateUsers.length} of {totalUsers} affiliate users
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Users List */}
          {affiliateUsers.length === 0 && !loading ? (
            <Alert>
              <AlertDescription>
                {searchQuery || statusFilter !== 'all' 
                  ? 'No affiliate users found matching your filters.'
                  : 'No affiliate users found. Users with active subscriptions can apply to join the affiliate program.'
                }
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
                          disabled={updating}
                        />
                        <span className="text-sm">
                          {affiliateUser.is_eligible ? 'Eligible' : 'Disabled'}
                        </span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(affiliateUser);
                          setUserDetailsDialogOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {itemsPerPage} users per page
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Requests Management - Only for Super Admin */}
      {isAdmin && payoutRequests && payoutRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>
              Review and process affiliate payout requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payoutRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {request.affiliate_users?.profiles?.full_name || 'Unknown User'}
                      </p>
                      <Badge variant={
                        request.status === 'completed' ? 'default' : 
                        request.status === 'approved' || request.status === 'processing' ? 'secondary' : 
                        request.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.affiliate_users?.profiles?.email} • Code: {request.affiliate_users?.affiliate_code}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">₹{request.requested_amount.toFixed(2)}</span> requested on{' '}
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                      {request.admin_notes && (
                        <p className="text-xs text-muted-foreground">
                          Admin notes: {request.admin_notes}
                        </p>
                      )}
                      {request.confirmed_by_user && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          User confirmed receipt on {new Date(request.confirmed_by_user_at).toLocaleDateString()}
                        </p>
                      )}
                      {request.user_confirmation_notes && (
                        <p className="text-xs text-muted-foreground">
                          User note: {request.user_confirmation_notes}
                        </p>
                      )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handlePayoutAction(request, 'approved')}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePayoutAction(request, 'rejected')}
                          disabled={updating}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayoutAction(request, 'processing')}
                        disabled={updating}
                      >
                        Mark Processing
                      </Button>
                    )}
                    {request.status === 'processing' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayoutAction(request, 'completed')}
                        disabled={updating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Action Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPayout?.action === 'approved' ? 'Approve Payout Request' :
               selectedPayout?.action === 'rejected' ? 'Reject Payout Request' :
               selectedPayout?.action === 'processing' ? 'Mark as Processing' :
               'Mark as Completed'}
            </DialogTitle>
            <DialogDescription>
              {selectedPayout?.action === 'approved' ? 'Approve this payout request for processing.' :
               selectedPayout?.action === 'rejected' ? 'Reject this payout request with a reason.' :
               selectedPayout?.action === 'processing' ? 'Mark this payout as being processed.' :
               'Mark this payout as completed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">Amount: ₹{selectedPayout?.requested_amount?.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                User: {selectedPayout?.affiliate_users?.profiles?.full_name}
              </p>
            </div>

            {selectedPayout?.action === 'rejected' && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPayoutUpdate}
              disabled={updating || (selectedPayout?.action === 'rejected' && !rejectionReason.trim())}
            >
              {updating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="commissions">
          <AffiliatePlanCommissions />
        </TabsContent>

        {/* User Details Dialog */}
        <AffiliateUserDetailsDialog
          open={userDetailsDialogOpen}
          onOpenChange={setUserDetailsDialogOpen}
          affiliateUser={selectedUser}
        />
      </Tabs>
    </div>
  );
};

export default AffiliateManagement;