import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Institute {
  id: string;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  institute_id: string;
}

interface UserAssignment {
  id: string;
  user_id: string;
  institute_id?: string;
  batch_id?: string;
  assignment_type: 'individual' | 'batch' | 'institute';
  assigned_at: string;
  profiles?: { full_name?: string } | null;
  institutes?: { id: string; name: string; code: string } | null;
  batches?: { id: string; name: string; code: string } | null;
}

interface AssignmentFormData {
  user_email: string;
  assignment_type: 'individual' | 'batch' | 'institute';
  institute_id: string;
  batch_id: string;
}

export const UserAssignmentManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<UserAssignment[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [formData, setFormData] = useState<AssignmentFormData>({
    user_email: '',
    assignment_type: 'individual',
    institute_id: '',
    batch_id: '',
  });

  useEffect(() => {
    if (isAdmin || isInstituteAdmin) {
      fetchData();
    }
  }, [isAdmin, isInstituteAdmin]);

  const fetchData = async () => {
    try {
      // Fetch institutes
      const { data: institutesData, error: institutesError } = await supabase
        .from('institutes')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (institutesError) throw institutesError;
      setInstitutes(institutesData || []);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('id, name, code, institute_id')
        .eq('is_active', true)
        .order('name');

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Fetch assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select(`
          id,
          user_id,
          institute_id,
          batch_id,
          assignment_type,
          assigned_at,
          institutes (
            id,
            name,
            code
          ),
          batches (
            id,
            name,
            code
          )
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      
      // Get user names separately
      const userIds = assignmentsData?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Combine the data
      const assignmentsWithProfiles = assignmentsData?.map(assignment => ({
        ...assignment,
        profiles: profiles?.find(p => p.user_id === assignment.user_id) || null
      })) || [];

      setAssignments(assignmentsWithProfiles as UserAssignment[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    try {
      // Search for users by email using the auth admin API
      // For now, we'll use a simple approach
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .ilike('full_name', `%${searchEmail}%`)
        .limit(10);

      if (error) throw error;

      // In a real implementation, you'd want to get the email from auth.users
      // For now, we'll show the found users
      toast({
        title: 'Search completed',
        description: `Found ${data?.length || 0} users`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // First, get the user ID from email (simplified approach)
      // In a real implementation, you'd use the auth admin API
      const userData = { id: 'temp-user-id' }; // This should be replaced with actual user lookup

      const assignmentData: any = {
        user_id: userData.id,
        assignment_type: formData.assignment_type,
        assigned_by: user.id,
      };

      if (formData.assignment_type === 'institute' || formData.assignment_type === 'batch') {
        assignmentData.institute_id = formData.institute_id;
      }

      if (formData.assignment_type === 'batch') {
        assignmentData.batch_id = formData.batch_id;
      }

      const { error } = await supabase
        .from('user_assignments')
        .insert(assignmentData);

      if (error) throw error;

      // If assigning institute_admin role, also add to institute_admin_assignments
      if (formData.assignment_type === 'institute') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userData.id,
            role: 'institute_admin',
          });

        if (roleError) throw roleError;

        const { error: adminAssignError } = await supabase
          .from('institute_admin_assignments')
          .insert({
            user_id: userData.id,
            institute_id: formData.institute_id,
            assigned_by: user.id,
          });

        if (adminAssignError) throw adminAssignError;
      }

      toast({
        title: 'Success',
        description: 'User assignment created successfully',
      });

      setShowForm(false);
      setFormData({
        user_email: '',
        assignment_type: 'individual',
        institute_id: '',
        batch_id: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (assignment: UserAssignment) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('user_assignments')
        .update({ is_active: false })
        .eq('id', assignment.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment removed successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove assignment',
        variant: 'destructive',
      });
    }
  };

  const filteredBatches = batches.filter(batch => 
    !formData.institute_id || batch.institute_id === formData.institute_id
  );

  if (!isAdmin && !isInstituteAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Loading assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Assignment Management</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                user_email: '',
                assignment_type: 'individual',
                institute_id: '',
                batch_id: '',
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New User Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user_email">User Email *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="user_email"
                    type="email"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                    placeholder="Enter user email"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchEmail(formData.user_email)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="assignment_type">Assignment Type *</Label>
                <Select
                  value={formData.assignment_type}
                  onValueChange={(value: 'individual' | 'batch' | 'institute') => 
                    setFormData({ ...formData, assignment_type: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual User</SelectItem>
                    <SelectItem value="institute">Institute Admin</SelectItem>
                    <SelectItem value="batch">Batch Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.assignment_type === 'institute' || formData.assignment_type === 'batch') && (
                <div>
                  <Label htmlFor="institute_id">Institute *</Label>
                  <Select
                    value={formData.institute_id}
                    onValueChange={(value) => setFormData({ ...formData, institute_id: value, batch_id: '' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an institute" />
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
              )}

              {formData.assignment_type === 'batch' && formData.institute_id && (
                <div>
                  <Label htmlFor="batch_id">Batch *</Label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Assignment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Assignments ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {assignment.profiles?.full_name || 'Unknown User'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.assignment_type === 'institute'
                        ? 'bg-purple-100 text-purple-800'
                        : assignment.assignment_type === 'batch'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.assignment_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {assignment.institutes?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {assignment.batches?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assigned_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(assignment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {assignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No assignments found. Create your first assignment to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};