import { useState, useEffect } from 'react';
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
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

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
}

interface User {
  id: string;
  email?: string;
  raw_user_meta_data?: {
    full_name?: string;
  };
}

const SUBSCRIPTION_PLANS = [
  { value: 'basic', label: 'Basic Plan' },
  { value: 'premium', label: 'Premium Plan' },
  { value: 'enterprise', label: 'Enterprise Plan' }
];

export default function InstituteManagement() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const { toast } = useToast();

  const [newInstitute, setNewInstitute] = useState({
    name: '',
    code: '',
    description: '',
    subscription_plan: '',
    subscription_duration: '365'
  });

  const [assignment, setAssignment] = useState({
    user_id: '',
    institute_id: ''
  });

  useEffect(() => {
    fetchInstitutes();
    fetchUsers();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from('institutes')
        .select(`
          *,
          batches!inner(count),
          user_assignments!inner(count)
        `);

      if (error) throw error;

      // Transform data to include counts
      const institutesWithCounts = await Promise.all(
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
            .eq('assignment_type', 'student')
            .eq('is_active', true);

          return {
            ...institute,
            batch_count: batchCount || 0,
            student_count: studentCount || 0
          };
        })
      );

      setInstitutes(institutesWithCounts);
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
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;
      setUsers(data.users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
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
        subscription_duration: '365'
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Institute Management</h1>
          <p className="text-muted-foreground">
            Manage institutes and assign administrators
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Institute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Institute</DialogTitle>
                <DialogDescription>
                  Create a new institute and set up its subscription plan
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
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
                    placeholder="365"
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
                <TableHead>Subscription Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription Period</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.map((institute) => (
                <TableRow key={institute.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{institute.name}</p>
                      <p className="text-sm text-muted-foreground">{institute.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{institute.code}</Badge>
                  </TableCell>
                  <TableCell>
                    {institute.subscription_plan ? (
                      <Badge variant="secondary">
                        {SUBSCRIPTION_PLANS.find(p => p.value === institute.subscription_plan)?.label || institute.subscription_plan}
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
                    <div className="text-sm">
                      <div>Start: {formatDate(institute.subscription_start_date)}</div>
                      <div>End: {formatDate(institute.subscription_end_date)}</div>
                    </div>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}