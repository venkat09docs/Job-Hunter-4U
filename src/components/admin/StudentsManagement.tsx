import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, UserPlus } from 'lucide-react';
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

interface Student {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  batch_name?: string;
  batch_code?: string;
  batch_id?: string;
  assigned_at: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  institute_id: string;
}

interface StudentFormData {
  email: string;
  full_name: string;
  batch_id: string;
  password: string;
}

export const StudentsManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    full_name: '',
    batch_id: '',
    password: '',
  });
  const [instituteId, setInstituteId] = useState<string>('');

  useEffect(() => {
    if (isInstituteAdmin || isAdmin) {
      fetchInstituteInfo();
    }
  }, [isInstituteAdmin, isAdmin, user]);

  const fetchInstituteInfo = async () => {
    try {
      if (isInstituteAdmin && user) {
        // Get institute admin's institute
        const { data, error } = await supabase
          .from('institute_admin_assignments')
          .select(`
            institute_id,
            institutes (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (data) {
          setInstituteId(data.institute_id);
          await fetchData(data.institute_id);
        }
      } else if (isAdmin) {
        // For super admins, we'd need to handle multiple institutes
        // For now, let's fetch all data
        await fetchData();
      }
    } catch (error) {
      console.error('Error fetching institute info:', error);
    }
  };

  const fetchData = async (targetInstituteId?: string) => {
    try {
      setLoading(true);
      
      // Fetch batches for the institute
      let batchesQuery = supabase
        .from('batches')
        .select('id, name, code, institute_id')
        .eq('is_active', true);

      if (targetInstituteId) {
        batchesQuery = batchesQuery.eq('institute_id', targetInstituteId);
      }

      const { data: batchesData, error: batchesError } = await batchesQuery.order('name');

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Fetch students (user assignments) for this institute
      let assignmentsQuery = supabase
        .from('user_assignments')
        .select(`
          id,
          user_id,
          batch_id,
          assigned_at,
          batches (
            id,
            name,
            code,
            institute_id
          )
        `)
        .eq('is_active', true)
        .eq('assignment_type', 'batch');

      if (targetInstituteId) {
        assignmentsQuery = assignmentsQuery.eq('institute_id', targetInstituteId);
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get user profiles for the assigned users
      const userIds = assignmentsData?.map(a => a.user_id) || [];
      
      if (userIds.length === 0) {
        setStudents([]);
        return;
      }

      // Get user profiles with email and full_name
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const studentsWithProfiles = assignmentsData?.map(assignment => {
        const profile = profiles?.find(p => p.user_id === assignment.user_id);
        
        return {
          id: assignment.id,
          user_id: assignment.user_id,
          full_name: profile?.full_name || 'Unknown Student',
          email: profile?.email || '',
          batch_name: assignment.batches?.name,
          batch_code: assignment.batches?.code,
          batch_id: assignment.batch_id,
          assigned_at: assignment.assigned_at,
        };
      }) || [];

      setStudents(studentsWithProfiles as Student[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students data',
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
      if (editingStudent) {
        // Update existing assignment
        const { error } = await supabase
          .from('user_assignments')
          .update({
            batch_id: formData.batch_id,
            institute_id: instituteId,
          })
          .eq('id', editingStudent.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Student assignment updated successfully',
        });
      } else {
        // Create new user account using edge function to avoid auto-login
        const { data, error } = await supabase.functions.invoke('create-student', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            batch_id: formData.batch_id,
            institute_id: instituteId,
          },
        });

        if (error) throw error;
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to create student account');
        }

        toast({
          title: 'Success',
          description: 'Student account created and assigned successfully',
        });
      }

      setShowForm(false);
      setEditingStudent(null);
      setFormData({
        email: '',
        full_name: '',
        batch_id: '',
        password: '',
      });
      fetchData(instituteId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save student',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email || '',
      full_name: student.full_name || '',
      batch_id: student.batch_id || '',
      password: '', // Don't populate password for editing
    });
    setShowForm(true);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm('Are you sure you want to remove this student from the batch?')) return;

    try {
      const { error } = await supabase
        .from('user_assignments')
        .update({ is_active: false })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Student removed successfully',
      });
      fetchData(instituteId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove student',
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
          <p className="text-center">Loading students...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Students Management</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStudent(null);
              setFormData({
                email: '',
                full_name: '',
                batch_id: '',
                password: '',
              });
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? 'Edit Student Assignment' : 'Add New Student'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Student Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter student email"
                  required
                  disabled={!!editingStudent}
                />
              </div>

              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter student full name"
                  required
                  disabled={!!editingStudent}
                />
              </div>

              {!editingStudent && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter student password"
                    required
                    minLength={6}
                  />
                </div>
              )}

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
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingStudent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStudent ? 'Update Assignment' : 'Add Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.full_name || 'Unknown Student'}
                  </TableCell>
                  <TableCell>
                    {student.batch_name} ({student.batch_code})
                  </TableCell>
                  <TableCell>
                    {new Date(student.assigned_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(student)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found. Add your first student to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};