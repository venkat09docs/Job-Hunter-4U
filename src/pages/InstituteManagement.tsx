import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Users, 
  Building, 
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Home,
  Edit,
  Trash2,
  Eye,
  Settings,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

interface Institute {
  id: string;
  name: string;
  code: string;
  description: string;
  subscription_plan: string;
  subscription_active: boolean;
  subscription_start_date: string;
  subscription_end_date: string;
  batch_count: number;
  student_count: number;
  created_at: string;
  is_active: boolean;
  admin_name?: string;
}

interface User {
  id: string;
  email?: string;
  raw_user_meta_data?: {
    full_name?: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  member_limit?: number;
}

export default function InstituteManagement() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [batchDetails, setBatchDetails] = useState<any[]>([]);
  const { toast } = useToast();

  const [newInstitute, setNewInstitute] = useState({
    name: '',
    code: '',
    description: '',
    subscription_plan: '',
    subscription_duration: '90'
  });

  const [assignment, setAssignment] = useState({
    user_id: '',
    institute_id: ''
  });

  useEffect(() => {
    fetchInstitutes();
    fetchUsers();
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      console.log('Fetching institute subscription plans...');
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, description, member_limit')
        .eq('is_active', true)
        .eq('plan_type', 'institute')
        .order('member_limit');

      if (error) throw error;
      console.log('Institute subscription plans fetched:', data);
      setSubscriptionPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching institute subscription plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch institute subscription plans',
        variant: 'destructive'
      });
    }
  };

  const fetchInstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from('institutes')
        .select('*');

      if (error) throw error;

      // Transform data to include counts and admin name
      const institutesWithDetails = await Promise.all(
        (data || []).map(async (institute) => {
          // Get batch count
          const { count: batchCount } = await supabase
            .from('batches')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', institute.id)
            .eq('is_active', true);

          // Get student count
          const { count: studentCount } = await supabase
            .from('user_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', institute.id)
            .eq('assignment_type', 'batch')
            .eq('is_active', true);

          // Get institute admin name using maybeSingle to avoid errors
          const { data: adminAssignment } = await supabase
            .from('institute_admin_assignments')
            .select('user_id')
            .eq('institute_id', institute.id)
            .eq('is_active', true)
            .maybeSingle();

          let adminName = 'Not Assigned';
          if (adminAssignment) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', adminAssignment.user_id)
              .maybeSingle();
            
            adminName = profile?.full_name || profile?.email || 'Not Assigned';
          }

          return {
            ...institute,
            batch_count: batchCount || 0,
            student_count: studentCount || 0,
            admin_name: adminName
          };
        })
      );

      setInstitutes(institutesWithDetails);
    } catch (error: any) {
      console.error('Error fetching institutes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch institutes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users with institute_admin role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'institute_admin');

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        return;
      }

      // Get user IDs
      const userIds = userRoles.map(role => role.user_id);

      // Fetch profile information for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, username')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Transform the data to match the expected User interface
      const instituteAdmins = profiles?.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        raw_user_meta_data: {
          full_name: profile.full_name
        }
      })) || [];

      setUsers(instituteAdmins);
    } catch (error: any) {
      console.error('Error fetching institute admin users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch institute admin users',
        variant: 'destructive'
      });
    }
  };

  const createInstitute = async () => {
    try {
      if (!newInstitute.name || !newInstitute.code || !newInstitute.subscription_plan) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + parseInt(newInstitute.subscription_duration));

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('institutes')
        .insert({
          name: newInstitute.name,
          code: newInstitute.code,
          description: newInstitute.description,
          subscription_plan: newInstitute.subscription_plan,
          subscription_start_date: startDate.toISOString(),
          subscription_end_date: endDate.toISOString(),
          subscription_active: true,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Institute created successfully'
      });

      setCreateDialogOpen(false);
      setNewInstitute({
        name: '',
        code: '',
        description: '',
        subscription_plan: '',
        subscription_duration: '90'
      });
      fetchInstitutes();
    } catch (error: any) {
      console.error('Error creating institute:', error);
      toast({
        title: 'Error',
        description: 'Failed to create institute',
        variant: 'destructive'
      });
    }
  };

  const assignInstituteAdmin = async () => {
    try {
      if (!assignment.user_id || !assignment.institute_id) {
        toast({
          title: 'Validation Error',
          description: 'Please select both user and institute',
          variant: 'destructive'
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      // First assign institute_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: assignment.user_id,
          role: 'institute_admin'
        });

      if (roleError && roleError.code !== '23505') throw roleError; // Ignore unique constraint error

      // Then create institute admin assignment
      const { error: assignmentError } = await supabase
        .from('institute_admin_assignments')
        .insert({
          user_id: assignment.user_id,
          institute_id: assignment.institute_id,
          assigned_by: user?.id
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: 'Institute admin assigned successfully'
      });

      setAssignDialogOpen(false);
      setAssignment({ user_id: '', institute_id: '' });
    } catch (error: any) {
      console.error('Error assigning admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign institute admin',
        variant: 'destructive'
      });
    }
  };

  const updateInstitute = async () => {
    try {
      if (!selectedInstitute || !selectedInstitute.name || !selectedInstitute.code) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Get current institute data to check existing subscription
      const { data: currentInstitute } = await supabase
        .from('institutes')
        .select('subscription_active, subscription_end_date')
        .eq('id', selectedInstitute.id)
        .single();

      let updateData: any = {
        name: selectedInstitute.name,
        code: selectedInstitute.code,
        description: selectedInstitute.description,
        subscription_plan: selectedInstitute.subscription_plan
      };

      // If a subscription plan is being assigned
      if (selectedInstitute.subscription_plan) {
        const now = new Date();
        
        // Calculate subscription dates
        if (currentInstitute?.subscription_active && currentInstitute?.subscription_end_date) {
          // Extend existing subscription by 90 days
          const currentEndDate = new Date(currentInstitute.subscription_end_date);
          const newEndDate = new Date(currentEndDate);
          newEndDate.setDate(newEndDate.getDate() + 90);
          
          updateData = {
            ...updateData,
            is_active: true,
            subscription_active: true,
            subscription_end_date: newEndDate.toISOString()
          };
        } else {
          // New subscription or reactivate
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 90);
          
          updateData = {
            ...updateData,
            is_active: true,
            subscription_active: true,
            subscription_start_date: now.toISOString(),
            subscription_end_date: endDate.toISOString()
          };
        }
      }

      const { error } = await supabase
        .from('institutes')
        .update(updateData)
        .eq('id', selectedInstitute.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: selectedInstitute.subscription_plan 
          ? 'Institute updated and subscription activated successfully'
          : 'Institute updated successfully'
      });

      setEditDialogOpen(false);
      setSelectedInstitute(null);
      fetchInstitutes();
    } catch (error: any) {
      console.error('Error updating institute:', error);
      toast({
        title: 'Error',
        description: 'Failed to update institute',
        variant: 'destructive'
      });
    }
  };

  const deleteInstitute = async (institute: Institute) => {
    try {
      // Check if there are any batches assigned to this institute
      const { count: batchCount } = await supabase
        .from('batches')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', institute.id)
        .eq('is_active', true);

      if (batchCount && batchCount > 0) {
        toast({
          title: 'Cannot Delete Institute',
          description: `This institute has ${batchCount} active batch(es). Please delete all batches first before deleting the institute.`,
          variant: 'destructive'
        });
        return;
      }

      // If no batches, proceed with deletion
      const { error } = await supabase
        .from('institutes')
        .delete()
        .eq('id', institute.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Institute deleted successfully'
      });

      fetchInstitutes();
    } catch (error: any) {
      console.error('Error deleting institute:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete institute',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = (institute: Institute) => {
    if (window.confirm(`Are you sure you want to ${institute.is_active ? 'deactivate' : 'activate'} the institute "${institute.name}"?`)) {
      toggleActiveStatus(institute);
    }
  };

  const toggleActiveStatus = async (institute: Institute) => {
    try {
      const newActiveStatus = !institute.is_active;
      
      const { error } = await supabase
        .from('institutes')
        .update({ is_active: newActiveStatus })
        .eq('id', institute.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Institute ${newActiveStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchInstitutes();
    } catch (error: any) {
      console.error('Error toggling institute status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update institute status',
        variant: 'destructive'
      });
    }
  };

  const viewBatchDetails = async (institute: Institute) => {
    try {
      const { data: batches, error } = await supabase
        .from('batches')
        .select(`
          id,
          name,
          code,
          description,
          start_date,
          end_date,
          created_at
        `)
        .eq('institute_id', institute.id)
        .eq('is_active', true);

      if (error) throw error;

      // Get student count for each batch
      const batchesWithStudents = await Promise.all(
        (batches || []).map(async (batch) => {
          const { count: studentCount } = await supabase
            .from('user_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('assignment_type', 'batch')
            .eq('is_active', true);

          return {
            id: batch.id,
            name: batch.name,
            code: batch.code,
            student_count: studentCount || 0,
            start_date: batch.start_date,
            end_date: batch.end_date
          };
        })
      );

      setBatchDetails(batchesWithStudents);
      setSelectedInstitute(institute);
      setViewDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching batch details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batch details',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access institute management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top Navigation */}
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Institute Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage institutes and assign administrators
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <UserProfileDropdown />
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Institute
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Institute</DialogTitle>
                <DialogDescription>
                  Create a new institute and set up its subscription plan
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                <div>
                  <Label htmlFor="name">Institute Name *</Label>
                  <Input
                    id="name"
                    value={newInstitute.name}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter institute name"
                  />
                </div>
                <div>
                  <Label htmlFor="code">Institute Code *</Label>
                  <Input
                    id="code"
                    value={newInstitute.code}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Enter unique institute code"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newInstitute.description}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter institute description"
                  />
                </div>
                <div>
                  <Label htmlFor="subscription_plan">Subscription Plan *</Label>
                  <Select
                    value={newInstitute.subscription_plan}
                    onValueChange={(value) => setNewInstitute(prev => ({ ...prev, subscription_plan: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.name}>
                          <div className="flex flex-col">
                            <span>{plan.name}</span>
                            {plan.member_limit && (
                              <span className="text-xs text-muted-foreground">
                                Up to {plan.member_limit} members
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Subscription Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newInstitute.subscription_duration}
                    onChange={(e) => setNewInstitute(prev => ({ ...prev, subscription_duration: e.target.value }))}
                    placeholder="90"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createInstitute}>Create Institute</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Institute Administrator</DialogTitle>
                <DialogDescription>
                  Assign a user as an administrator for an institute
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user">Select User</Label>
                  <Select
                    value={assignment.user_id}
                    onValueChange={(value) => setAssignment(prev => ({ ...prev, user_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.raw_user_meta_data?.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="institute">Select Institute</Label>
                  <Select
                    value={assignment.institute_id}
                    onValueChange={(value) => setAssignment(prev => ({ ...prev, institute_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select institute" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutes.map((institute) => (
                        <SelectItem key={institute.id} value={institute.id}>
                          {institute.name} ({institute.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={assignInstituteAdmin}>Assign Admin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutes</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutes.filter(i => i.subscription_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutes.reduce((sum, i) => sum + i.batch_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {institutes.reduce((sum, i) => sum + i.student_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Institutes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Institutes</CardTitle>
          <CardDescription>
            Manage and monitor all institutes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institute Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Admin Name</TableHead>
                <TableHead>Subscription Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.map((institute) => (
                 <TableRow key={institute.id}>
                   <TableCell>
                     <div>
                       <button 
                         onClick={() => navigate(`/admin/batch-management?institute=${institute.id}`)}
                         className="text-primary hover:underline cursor-pointer text-left"
                       >
                         <p className="font-medium">{institute.name}</p>
                       </button>
                       <p className="text-sm text-muted-foreground">{institute.description}</p>
                     </div>
                   </TableCell>
                  <TableCell>
                    <Badge variant="outline">{institute.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={institute.admin_name === 'Not Assigned' ? 'text-muted-foreground' : 'font-medium'}>
                      {institute.admin_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {institute.subscription_plan ? (
                      <Badge variant="secondary">
                        {institute.subscription_plan}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No Plan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {institute.subscription_active ? (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                   </TableCell>
                   <TableCell>
                     <div className="text-center">
                       <p className="font-medium">{institute.batch_count}</p>
                       <p className="text-xs text-muted-foreground">batches</p>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-medium">{institute.student_count}</p>
                      <p className="text-xs text-muted-foreground">students</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(institute.created_at)}
                  </TableCell>
                   <TableCell>
                     <div className="flex items-center justify-center gap-1">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => viewBatchDetails(institute)}
                         className="h-8 w-8 p-0"
                         title="View Batch Details"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setSelectedInstitute(institute);
                           setEditDialogOpen(true);
                         }}
                         className="h-8 w-8 p-0"
                         title="Edit Institute"
                       >
                         <Edit className="h-4 w-4" />
                       </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(institute)}
                          className={`h-8 w-8 p-0 ${institute.is_active ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                          title={institute.is_active ? "Deactivate Institute" : "Activate Institute"}
                        >
                          {institute.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => deleteInstitute(institute)}
                         className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                         title="Delete Institute"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Institute Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Institute</DialogTitle>
            <DialogDescription>
              Update institute details and subscription plan
            </DialogDescription>
          </DialogHeader>
          {selectedInstitute && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <Label htmlFor="edit-name">Institute Name *</Label>
                <Input
                  id="edit-name"
                  value={selectedInstitute.name}
                  onChange={(e) => setSelectedInstitute(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter institute name"
                />
              </div>
              <div>
                <Label htmlFor="edit-code">Institute Code *</Label>
                <Input
                  id="edit-code"
                  value={selectedInstitute.code}
                  onChange={(e) => setSelectedInstitute(prev => prev ? { ...prev, code: e.target.value } : null)}
                  placeholder="Enter unique institute code"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedInstitute.description || ''}
                  onChange={(e) => setSelectedInstitute(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter institute description"
                />
              </div>
              <div>
                <Label htmlFor="edit-subscription_plan">Subscription Plan</Label>
                <Select
                  value={selectedInstitute.subscription_plan || ''}
                  onValueChange={(value) => setSelectedInstitute(prev => prev ? { ...prev, subscription_plan: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        <div className="flex flex-col">
                          <span>{plan.name}</span>
                          {plan.member_limit && (
                            <span className="text-xs text-muted-foreground">
                              Up to {plan.member_limit} members
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setSelectedInstitute(null);
            }}>
              Cancel
            </Button>
            <Button onClick={updateInstitute}>Update Institute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Batch Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedInstitute?.name} - Batch & Student Details
            </DialogTitle>
            <DialogDescription>
              View all batches and student counts for this institute (Read-only for Super Admin)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {batchDetails.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{batchDetails.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {batchDetails.reduce((sum, batch) => sum + batch.student_count, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Students/Batch</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(batchDetails.reduce((sum, batch) => sum + batch.student_count, 0) / batchDetails.length)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Batch Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchDetails.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{batch.name}</p>
                              <p className="text-sm text-muted-foreground">{batch.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{batch.code}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{batch.student_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Start: {formatDate(batch.start_date)}</div>
                              <div>End: {formatDate(batch.end_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(batch.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                   </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No Batches Found</h3>
                <p className="text-muted-foreground">This institute doesn't have any active batches yet.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setViewDialogOpen(false);
              setSelectedInstitute(null);
              setBatchDetails([]);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}