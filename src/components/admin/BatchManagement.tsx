import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Settings, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Institute {
  id: string;
  name: string;
  code: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  description?: string;
  institute_id: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  institutes?: Institute;
}

interface BatchFormData {
  name: string;
  code: string;
  description: string;
  institute_id: string;
  start_date: string;
  end_date: string;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subscription_plan?: string;
  subscription_active?: boolean;
  subscription_end_date?: string;
  assigned_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  duration_days: number;
}

export const BatchManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Student Management Dialog State
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    subscription_plan: '',
    duration_days: 90,
  });
  const [formData, setFormData] = useState<BatchFormData>({
    name: '',
    code: '',
    description: '',
    institute_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (isAdmin || isInstituteAdmin) {
      const instituteId = searchParams.get('institute');
      if (instituteId && isAdmin) {
        setIsReadOnly(true);
        fetchInstituteData(instituteId);
        fetchSubscriptionPlans(); // Add this line for super admin read-only mode
      } else {
        setIsReadOnly(false);
        fetchData();
        fetchSubscriptionPlans();
      }
    }
  }, [isAdmin, isInstituteAdmin, searchParams]);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_type', 'user')
        .eq('is_active', true)
        .order('duration_days');

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch subscription plans',
        variant: 'destructive',
      });
    }
  };

  const fetchData = async () => {
    try {
      // Fetch institutes first
      const { data: institutesData, error: institutesError } = await supabase
        .from('institutes')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (institutesError) throw institutesError;
      setInstitutes(institutesData || []);

      // Fetch batches with institute information
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          *,
          institutes (
            id,
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);
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

  const fetchInstituteData = async (instituteId: string) => {
    try {
      // Fetch the selected institute
      const { data: instituteData, error: instituteError } = await supabase
        .from('institutes')
        .select('*')
        .eq('id', instituteId)
        .single();

      if (instituteError) throw instituteError;
      setSelectedInstitute(instituteData);

      // Fetch batches for this institute with student counts
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          *,
          institutes (
            id,
            name,
            code
          )
        `)
        .eq('institute_id', instituteId)
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      // Get student count for each batch
      const batchesWithStudentCount = await Promise.all(
        (batchesData || []).map(async (batch) => {
          const { count: studentCount } = await supabase
            .from('user_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('assignment_type', 'batch')
            .eq('is_active', true);

          return {
            ...batch,
            student_count: studentCount || 0
          };
        })
      );

      setBatches(batchesWithStudentCount);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch institute data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update({
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          })
          .eq('id', editingBatch.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Batch updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('batches')
          .insert({
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Batch created successfully',
        });
      }

      setShowForm(false);
      setEditingBatch(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        institute_id: '',
        start_date: '',
        end_date: '',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save batch',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      code: batch.code,
      description: batch.description || '',
      institute_id: batch.institute_id,
      start_date: batch.start_date || '',
      end_date: batch.end_date || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (batch: Batch) => {
    if (!confirm(`Are you sure you want to delete ${batch.name}?`)) return;

    try {
      const { error } = await supabase
        .from('batches')
        .update({ is_active: false })
        .eq('id', batch.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Batch deactivated successfully',
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate batch',
        variant: 'destructive',
      });
    }
  };

  const handleBatchStudents = async (batch: Batch) => {
    try {
      // Fetch students in this batch with their profile information
      const { data: assignments, error: assignmentError } = await supabase
        .from('user_assignments')
        .select('id, user_id, assigned_at')
        .eq('batch_id', batch.id)
        .eq('assignment_type', 'batch')
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) {
        setStudents([]);
        setSelectedBatch(batch);
        setShowStudentDialog(true);
        return;
      }

      // Get user IDs
      const userIds = assignments.map(a => a.user_id);

      // Fetch profile information for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, subscription_plan, subscription_active, subscription_end_date')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Combine assignment and profile data
      const studentsData = assignments.map(assignment => {
        const profile = profiles?.find(p => p.user_id === assignment.user_id);
        return {
          id: assignment.id,
          user_id: assignment.user_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'Unknown',
          subscription_plan: profile?.subscription_plan,
          subscription_active: profile?.subscription_active,
          subscription_end_date: profile?.subscription_end_date,
          assigned_at: assignment.assigned_at
        };
      });

      setStudents(studentsData);
      setSelectedBatch(batch);
      setShowStudentDialog(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch batch students',
        variant: 'destructive',
      });
    }
  };

  const handleManageSubscription = (student: Student) => {
    setSelectedStudent(student);
    setSubscriptionFormData({
      subscription_plan: student.subscription_plan || '',
      duration_days: 90,
    });
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionSubmit = async () => {
    if (!selectedStudent) return;

    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + subscriptionFormData.duration_days);

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: subscriptionFormData.subscription_plan,
          subscription_active: true,
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });

      setShowSubscriptionDialog(false);
      setSelectedStudent(null);
      
      // Refresh student list
      if (selectedBatch) {
        handleBatchStudents(selectedBatch);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    }
  };

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
          <p className="text-center">Loading batches...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {selectedInstitute ? `Batch Management - ${selectedInstitute.name}` : 'Batch Management'}
          </h2>
          {selectedInstitute && (
            <p className="text-muted-foreground">
              Viewing batches for {selectedInstitute.name} ({selectedInstitute.code}) - Read Only
            </p>
          )}
        </div>
        {!isReadOnly && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBatch(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                institute_id: '',
                start_date: '',
                end_date: '',
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingBatch ? 'Edit Batch' : 'Add New Batch'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="institute_id">Institute *</Label>
                <Select
                  value={formData.institute_id}
                  onValueChange={(value) => setFormData({ ...formData, institute_id: value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Batch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Batch Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBatch ? 'Update' : 'Create'} Batch
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedInstitute 
              ? `Batches for ${selectedInstitute.name} (${batches.length})`
              : `Batches (${batches.length})`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                {!selectedInstitute && <TableHead>Institute</TableHead>}
                {selectedInstitute && <TableHead>Students</TableHead>}
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                {!isReadOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    <button 
                      onClick={() => handleBatchStudents(batch)}
                      className="text-primary hover:underline cursor-pointer text-left"
                    >
                      {batch.name}
                    </button>
                  </TableCell>
                  <TableCell>{batch.code}</TableCell>
                  {!selectedInstitute && (
                    <TableCell>
                      {batch.institutes?.name} ({batch.institutes?.code})
                    </TableCell>
                  )}
                  {selectedInstitute && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {(batch as any).student_count || 0}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    {batch.start_date && batch.end_date ? (
                      <div className="text-sm">
                        <div>{new Date(batch.start_date).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(batch.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      batch.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {batch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(batch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(batch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {batches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {selectedInstitute 
                ? `No batches found for ${selectedInstitute.name}.`
                : 'No batches found. Create your first batch to get started.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Management Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Student Management - {selectedBatch?.name}
            </DialogTitle>
            <DialogDescription>
              Manage students and their subscriptions for this batch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscription Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        {student.subscription_plan ? (
                          <Badge variant="secondary">{student.subscription_plan}</Badge>
                        ) : (
                          <span className="text-muted-foreground">No Plan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.subscription_active ? (
                          <Badge className="bg-green-500 text-white">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.subscription_end_date 
                          ? new Date(student.subscription_end_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageSubscription(student)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No Students Found</h3>
                <p className="text-muted-foreground">This batch doesn't have any students assigned yet.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowStudentDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Management Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subscription</DialogTitle>
            <DialogDescription>
              Update subscription plan for {selectedStudent?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="subscription_plan">Subscription Plan</Label>
              <Select
                value={subscriptionFormData.subscription_plan}
                onValueChange={(value) => setSubscriptionFormData(prev => ({ ...prev, subscription_plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription plan" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.name}>
                      <div className="flex flex-col">
                        <span>{plan.name}</span>
                        {plan.description && (
                          <span className="text-xs text-muted-foreground">
                            {plan.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                type="number"
                value={subscriptionFormData.duration_days}
                onChange={(e) => setSubscriptionFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 90 }))}
                min="1"
                max="365"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubscriptionSubmit}>
              Update Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};