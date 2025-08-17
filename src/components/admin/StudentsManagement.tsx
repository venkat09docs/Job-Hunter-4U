import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useInstituteName } from '@/hooks/useInstituteName';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, UserPlus, Download, Users, Filter, Upload, FileDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Papa from 'papaparse';
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: string;
  user_id: string;
  full_name?: string;
  username?: string;
  email?: string;
  batch_name?: string;
  batch_code?: string;
  batch_id?: string;
  assigned_at: string;
  subscription_active?: boolean;
  subscription_plan?: string;
  subscription_end_date?: string;
}

type FilterType = 'all' | 'subscription_active' | 'subscription_inactive' | 'batch';

interface Batch {
  id: string;
  name: string;
  code: string;
  institute_id: string;
}

interface StudentFormData {
  email: string;
  full_name: string;
  username: string;
  batch_id: string;
  password: string;
  industry: string;
}

export const StudentsManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const { instituteSubscription } = useInstituteName();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    full_name: '',
    username: '',
    batch_id: '',
    password: '',
    industry: 'IT',
  });
  const [instituteId, setInstituteId] = useState<string>('');
  
  // Filter and pagination states
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Bulk operation states
  const [showBulkBatchDialog, setShowBulkBatchDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkBatchId, setBulkBatchId] = useState<string>('');
  
  // CSV Import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  

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
        setFilteredStudents([]);
        return;
      }

      // Get user profiles with email, full_name, username and subscription info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, username, subscription_active, subscription_plan, subscription_end_date')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const studentsWithProfiles = assignmentsData?.map(assignment => {
        const profile = profiles?.find(p => p.user_id === assignment.user_id);
        
        return {
          id: assignment.id,
          user_id: assignment.user_id,
          full_name: profile?.full_name || 'Unknown Student',
          username: profile?.username || 'No Username',
          email: profile?.email || '',
          batch_name: assignment.batches?.name,
          batch_code: assignment.batches?.code,
          batch_id: assignment.batch_id,
          assigned_at: assignment.assigned_at,
          subscription_active: profile?.subscription_active || false,
          subscription_plan: profile?.subscription_plan || 'None',
          subscription_end_date: profile?.subscription_end_date || null,
        };
      }) || [];

      setStudents(studentsWithProfiles as Student[]);
      applyFilters(studentsWithProfiles as Student[]);
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
        const { error: assignmentError } = await supabase
          .from('user_assignments')
          .update({
            batch_id: formData.batch_id,
            institute_id: instituteId,
          })
          .eq('id', editingStudent.id);

        if (assignmentError) throw assignmentError;

        // Update student profile if name or email changed
        if (formData.full_name || formData.email) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.full_name,
              email: formData.email,
            })
            .eq('user_id', editingStudent.user_id);

          if (profileError) throw profileError;
        }

        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
      } else {
        // Create new user account using edge function to avoid auto-login
        const { data, error } = await supabase.functions.invoke('create-student', {
          body: {
            email: formData.email,
            password: formData.password,
            full_name: formData.full_name,
            username: formData.username,
            batch_id: formData.batch_id,
            institute_id: instituteId,
            industry: formData.industry,
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
        username: '',
        batch_id: '',
        password: '',
        industry: 'IT',
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

  // Filter and pagination functions
  const applyFilters = (studentsData: Student[] = students) => {
    let filtered = [...studentsData];

    // Apply subscription status filter
    if (filterType === 'subscription_active') {
      filtered = filtered.filter(student => student.subscription_active);
    } else if (filterType === 'subscription_inactive') {
      filtered = filtered.filter(student => !student.subscription_active);
    }

    // Apply batch filter
    if (filterType === 'batch' && selectedBatch) {
      filtered = filtered.filter(student => student.batch_id === selectedBatch);
    }

    // Apply name search filter
    if (searchName.trim()) {
      filtered = filtered.filter(student => 
        (student.full_name || '').toLowerCase().includes(searchName.toLowerCase()) ||
        (student.username || '').toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    setSelectedStudents(new Set()); // Clear selection when filters change
  };

  const exportToCSV = () => {
    const dataToExport = selectedStudents.size > 0 
      ? filteredStudents.filter(student => selectedStudents.has(student.id))
      : filteredStudents;

    const csvData = dataToExport.map(student => ({
      'Student Name': student.full_name || student.username || 'No Name',
      'Email': student.email || '',
      'Username': student.username || '',
      'Batch Name': student.batch_name || '',
      'Batch Code': student.batch_code || '',
      'Subscription Status': student.subscription_active ? 'Active' : 'Inactive',
      'Subscription Plan': student.subscription_plan || 'None',
      'Subscription End': student.subscription_end_date ? new Date(student.subscription_end_date).toLocaleDateString() : 'N/A',
      'Assigned Date': new Date(student.assigned_at).toLocaleDateString(),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Exported ${dataToExport.length} student records to CSV`,
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        'Full Name': 'John Doe',
        'Email': 'john.doe@example.com',
        'Username': 'johndoe',
        'Password': 'password123',
        'Batch Code': 'BATCH001',
        'Industry': 'IT'
      },
      {
        'Full Name': 'Jane Smith',
        'Email': 'jane.smith@example.com',
        'Username': 'janesmith',
        'Password': 'password456',
        'Batch Code': 'BATCH001',  
        'Industry': 'Non-IT'
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_students_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'Sample CSV file downloaded successfully',
    });
  };

  const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data.filter((row: any) => 
          row['Full Name'] && row['Email'] && row['Username'] && row['Password'] && row['Batch Code'] && row['Industry']
        );
        setImportPreview(data);
      },
      error: (error) => {
        toast({
          title: 'Error',
          description: 'Failed to parse CSV file',
          variant: 'destructive',
        });
      }
    });
  };

  const validateSubscriptionLimit = () => {
    if (!instituteSubscription) return true;
    
    const currentStudents = students.length;
    const newStudents = importPreview.length;
    const totalAfterImport = currentStudents + newStudents;
    const maxStudents = instituteSubscription.maxStudents;

    if (maxStudents && totalAfterImport > maxStudents) {
      toast({
        title: 'Subscription Limit Exceeded',
        description: `Cannot import ${newStudents} students. Current: ${currentStudents}, Max allowed: ${maxStudents}. You would exceed the limit by ${totalAfterImport - maxStudents} students.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleCSVImport = async () => {
    if (!importPreview.length || !instituteId) return;

    if (!validateSubscriptionLimit()) return;

    setIsImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of importPreview) {
        try {
          // Find batch by code
          const batch = batches.find(b => b.code === row['Batch Code']);
          if (!batch) {
            errors.push(`Batch not found for code: ${row['Batch Code']}`);
            errorCount++;
            continue;
          }

          const { data, error } = await supabase.functions.invoke('create-student', {
            body: {
              email: row['Email'],
              password: row['Password'],
              full_name: row['Full Name'],
              username: row['Username'],
              batch_id: batch.id,
              institute_id: instituteId,
              industry: row['Industry'] || 'IT',
            },
          });

          if (error || !data?.success) {
            errors.push(`Failed to create ${row['Full Name']}: ${data?.error || error?.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Error creating ${row['Full Name']}: ${error.message}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Import Completed',
          description: `Successfully imported ${successCount} students${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        
        setShowImportDialog(false);
        setCsvFile(null);
        setImportPreview([]);
        fetchData(instituteId);
      }

      if (errors.length > 0 && errors.length <= 5) {
        toast({
          title: 'Import Errors',
          description: errors.join(', '),
          variant: 'destructive',
        });
      } else if (errors.length > 5) {
        toast({
          title: 'Import Errors',
          description: `${errors.length} errors occurred during import`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to import students',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedStudents.map(student => student.id));
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleBulkBatchAssign = async () => {
    if (!bulkBatchId || selectedStudents.size === 0) return;

    try {
      const selectedStudentsList = Array.from(selectedStudents);
      
      const { error } = await supabase
        .from('user_assignments')
        .update({ batch_id: bulkBatchId })
        .in('id', selectedStudentsList);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Assigned ${selectedStudents.size} students to batch`,
      });

      setShowBulkBatchDialog(false);
      setBulkBatchId('');
      setSelectedStudents(new Set());
      fetchData(instituteId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to assign students to batch',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;

    try {
      const selectedStudentsList = Array.from(selectedStudents);
      const studentsToDelete = students.filter(s => selectedStudentsList.includes(s.id));

      // Process each student deletion
      for (const student of studentsToDelete) {
        // Deactivate user assignments
        await supabase
          .from('user_assignments')
          .update({ is_active: false })
          .eq('user_id', student.user_id);

        // Delete user roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', student.user_id);

        // Delete profile
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', student.user_id);

        // Delete from auth.users using admin API
        const { error: authError } = await supabase.auth.admin.deleteUser(student.user_id);
        if (authError) {
          console.error('Auth deletion error:', authError);
        }
      }

      toast({
        title: 'Success',
        description: `Deleted ${selectedStudents.size} students`,
      });

      setShowBulkDeleteDialog(false);
      setSelectedStudents(new Set());
      fetchData(instituteId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete students',
        variant: 'destructive',
      });
    }
  };

  // Apply filters when filter type or selected batch changes
  useEffect(() => {
    applyFilters();
  }, [filterType, selectedBatch, searchName, students]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email || '',
      full_name: student.full_name || '',
      username: '', // Don't populate username for editing for now
      batch_id: student.batch_id || '',
      password: '', // Don't populate password for editing
      industry: 'IT', // Default industry for existing students
    });
    setShowForm(true);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to remove ${student.full_name || 'this student'} from the batch? This will also deactivate their user account.`)) return;

    try {
      // Deactivate user assignment
      const { error: assignmentError } = await supabase
        .from('user_assignments')
        .update({ is_active: false })
        .eq('id', student.id);

      if (assignmentError) throw assignmentError;

      // Also deactivate all other assignments for this user if needed
      await supabase
        .from('user_assignments')
        .update({ is_active: false })
        .eq('user_id', student.user_id);

      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', student.user_id);

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', student.user_id);

      // Delete from auth.users using admin API
      const { error: authError } = await supabase.auth.admin.deleteUser(student.user_id);
      if (authError) {
        console.error('Auth deletion error:', authError);
      }

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadSampleCSV}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Sample CSV
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Students from CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a CSV file with columns: Full Name, Email, Username, Password, Batch Code, Industry
                  </p>
                </div>

                {instituteSubscription && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Subscription Limit:</strong> {students.length}/{instituteSubscription.maxStudents || 'Unlimited'} students
                    </p>
                    {importPreview.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        After import: {students.length + importPreview.length}/{instituteSubscription.maxStudents || 'Unlimited'} students
                      </p>
                    )}
                  </div>
                )}

                {importPreview.length > 0 && (
                  <div>
                    <Label>Preview ({importPreview.length} students to import)</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 mt-1">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Batch Code</TableHead>
                            <TableHead>Industry</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row['Full Name']}</TableCell>
                              <TableCell>{row['Email']}</TableCell>
                              <TableCell>{row['Username']}</TableCell>
                              <TableCell>{row['Batch Code']}</TableCell>
                              <TableCell>{row['Industry'] || 'IT'}</TableCell>
                            </TableRow>
                          ))}
                          {importPreview.length > 5 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                ... and {importPreview.length - 5} more students
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowImportDialog(false);
                      setCsvFile(null);
                      setImportPreview([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCSVImport}
                    disabled={importPreview.length === 0 || isImporting}
                  >
                    {isImporting ? 'Importing...' : `Import ${importPreview.length} Students`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredStudents.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Export CSV {selectedStudents.size > 0 && `(${selectedStudents.size})`}
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingStudent(null);
                setFormData({
                  email: '',
                  full_name: '',
                  username: '',
                  batch_id: '',
                  password: '',
                  industry: 'IT',
                });
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? 'Edit Student' : 'Add New Student'}
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
                  disabled={false}
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
                  disabled={false}
                />
              </div>

              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter student username"
                  required
                  disabled={false}
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
                  <SelectContent className="bg-card border border-border z-50">
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value: 'IT' | 'Non-IT') => setFormData({ ...formData, industry: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    <SelectItem value="IT">IT (Information Technology)</SelectItem>
                    <SelectItem value="Non-IT">Non-IT (Other Industries)</SelectItem>
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
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search-name">Search by Name</Label>
              <Input
                id="search-name"
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search by student name or username..."
                className="w-full"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filter-type">Filter by Subscription Status</Label>
              <Select
                value={filterType}
                onValueChange={(value: FilterType) => setFilterType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="subscription_active">Active Users (Subscription Based)</SelectItem>
                  <SelectItem value="subscription_inactive">Non Active Users (Subscription Based)</SelectItem>
                  <SelectItem value="batch">Filter by Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === 'batch' && (
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="batch-filter">Select Batch</Label>
                <Select
                  value={selectedBatch}
                  onValueChange={setSelectedBatch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
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
            )}

            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="records-per-page">Records per page</Label>
              <Select
                value={recordsPerPage.toString()}
                onValueChange={(value) => {
                  setRecordsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStudents.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkBatchDialog(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Batch ({selectedStudents.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowBulkDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedStudents.size})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Students ({filteredStudents.length} of {students.length})
            {filterType !== 'all' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Filtered by {filterType === 'batch' ? `batch: ${batches.find(b => b.id === selectedBatch)?.name}` : 
                filterType === 'subscription_active' ? 'Active Subscription' :
                filterType === 'subscription_inactive' ? 'Inactive Subscription' : filterType}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedStudents.length > 0 && paginatedStudents.every(student => selectedStudents.has(student.id))}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all students"
                  />
                </TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Subscription Status</TableHead>
                <TableHead>Subscription Plan</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                      aria-label={`Select student ${student.full_name || student.username}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {student.full_name || student.username || 'No Name'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      student.subscription_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {student.subscription_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {student.subscription_plan || 'None'}
                      {student.subscription_end_date && (
                        <div className="text-xs text-muted-foreground">
                          Expires: {new Date(student.subscription_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </span>
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
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {filterType === 'all' 
                ? 'No students found. Add your first student to get started.'
                : `No students found matching the selected filter: ${
                    filterType === 'subscription_active' ? 'Active Subscription' :
                    filterType === 'subscription_inactive' ? 'Inactive Subscription' :
                    filterType === 'batch' ? 'Selected Batch' : filterType
                  }`
              }
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={pageNum === currentPage}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Batch Assignment Dialog */}
      <AlertDialog open={showBulkBatchDialog} onOpenChange={setShowBulkBatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Students to Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Assign {selectedStudents.size} selected students to a batch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="bulk-batch">Select Batch</Label>
            <Select value={bulkBatchId} onValueChange={setBulkBatchId}>
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
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkBatchAssign} disabled={!bulkBatchId}>
              Assign to Batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudents.size} selected students? 
              This action cannot be undone and will remove their accounts permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Students
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};