import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Users, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Institute {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  subscription_plan?: string;
  admin_name?: string;
}

interface InstituteFormData {
  name: string;
  code: string;
  description: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  subscription_plan: string;
}

interface BatchDetail {
  id: string;
  name: string;
  code: string;
  student_count: number;
  start_date?: string;
  end_date?: string;
}

export const InstituteManagement = () => {
  const { user } = useAuth();
  const { isAdmin, role, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewBatchDialogOpen, setIsViewBatchDialogOpen] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<Institute | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [batchDetails, setBatchDetails] = useState<BatchDetail[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instituteToDelete, setInstituteToDelete] = useState<Institute | null>(null);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [instituteToToggle, setInstituteToToggle] = useState<Institute | null>(null);
  const [formData, setFormData] = useState<InstituteFormData>({
    name: "",
    code: "",
    description: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    subscription_plan: ""
  });

  useEffect(() => {
    console.log('InstituteManagement - User:', user?.id);
    console.log('InstituteManagement - Role:', role);
    console.log('InstituteManagement - isAdmin:', isAdmin);
    console.log('InstituteManagement - roleLoading:', roleLoading);
    
    if (isAdmin) {
      console.log('User is admin, fetching data...');
      fetchInstitutes();
      fetchSubscriptionPlans();
    } else {
      console.log('User is not admin, role:', role);
    }
  }, [isAdmin, role, user]);

  // Add this to check if user has admin role in the database
  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        console.log('Direct role check from DB:', data, error);
      }
    };
    
    checkUserRole();
  }, [user]);

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_type', 'institute')
        .eq('is_active', true)
        .order('member_limit');

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchInstitutes = async () => {
    console.log('Fetching institutes...');
    try {
      // First get all institutes
      const { data: allInstitutes, error: institutesError } = await supabase
        .from('institutes')
        .select('*')
        .order('created_at', { ascending: false });

      if (institutesError) throw institutesError;
      
      console.log('Raw institute data:', allInstitutes);
      
      // Then get admin assignments with user IDs
      const { data: adminAssignments, error: adminError } = await supabase
        .from('institute_admin_assignments')
        .select('institute_id, user_id')
        .eq('is_active', true);

      if (adminError) {
        console.error('Error fetching admin assignments:', adminError);
      }

      // Get profile names for admin users
      const adminUserIds = adminAssignments?.map(a => a.user_id) || [];
      let adminProfiles: any[] = [];
      
      if (adminUserIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', adminUserIds);
        
        if (!profileError) {
          adminProfiles = profiles || [];
        }
      }

      // Process institutes with admin names
      const institutesWithAdmins = allInstitutes?.map(institute => {
        const adminAssignment = adminAssignments?.find(assignment => assignment.institute_id === institute.id);
        const adminProfile = adminProfiles.find(profile => profile.user_id === adminAssignment?.user_id);
        return {
          ...institute,
          admin_name: adminProfile?.full_name || 'No Admin Assigned'
        };
      }) || [];
      
      console.log('Processed institutes:', institutesWithAdmins);
      setInstitutes(institutesWithAdmins);
    } catch (error: any) {
      console.error('Error fetching institutes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch institutes',
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
      if (editingInstitute) {
        await updateInstitute();
      } else {
        const { error } = await supabase
          .from('institutes')
          .insert({
            ...formData,
            created_by: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Institute created successfully',
        });
      }

      setIsDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingInstitute(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        subscription_plan: ""
      });
      fetchInstitutes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save institute',
        variant: 'destructive',
      });
    }
  };

  const updateInstitute = async () => {
    if (!editingInstitute) return;

    const updateData: any = {
      name: editingInstitute.name,
      code: editingInstitute.code,
      description: editingInstitute.description,
      address: editingInstitute.address,
      contact_email: editingInstitute.contact_email,
      contact_phone: editingInstitute.contact_phone,
      subscription_plan: editingInstitute.subscription_plan,
    };

    const { error } = await supabase
      .from('institutes')
      .update(updateData)
      .eq('id', editingInstitute.id);

    if (error) throw error;

    toast({
      title: 'Success',
      description: 'Institute updated successfully',
    });
  };

  const handleEdit = (institute: Institute) => {
    setEditingInstitute(institute);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (institute: Institute) => {
    // First check if there are batches assigned to this institute
    try {
      const { data: batches, error } = await supabase
        .from('batches')
        .select('id')
        .eq('institute_id', institute.id)
        .eq('is_active', true);

      if (error) throw error;

      if (batches && batches.length > 0) {
        toast({
          title: 'Cannot Delete Institute',
          description: `This institute has ${batches.length} active batch(es) assigned. Please delete the batches first before deleting the institute.`,
          variant: 'destructive',
        });
        return;
      }

      // If no batches, proceed with deletion
      setInstituteToDelete(institute);
      setDeleteDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to check institute dependencies',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!instituteToDelete) return;

    try {
      const { error } = await supabase
        .from('institutes')
        .delete()
        .eq('id', instituteToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Institute deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setInstituteToDelete(null);
      fetchInstitutes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete institute',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = (institute: Institute) => {
    console.log('Toggle clicked for institute:', institute.name, 'Current status:', institute.is_active);
    setInstituteToToggle(institute);
    setToggleDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!instituteToToggle) return;
    
    console.log('Confirming toggle for:', instituteToToggle.name, 'New status will be:', !instituteToToggle.is_active);

    try {
      const { error } = await supabase
        .from('institutes')
        .update({ is_active: !instituteToToggle.is_active })
        .eq('id', instituteToToggle.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Institute ${!instituteToToggle.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      
      setToggleDialogOpen(false);
      setInstituteToToggle(null);
      fetchInstitutes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update institute status',
        variant: 'destructive',
      });
    }
  };

  const viewBatchDetails = async (institute: Institute) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          id,
          name,
          code,
          start_date,
          end_date,
          user_assignments!inner(*)
        `)
        .eq('institute_id', institute.id)
        .eq('is_active', true);

      if (error) throw error;

      const batchesWithStudentCount = data?.map(batch => ({
        id: batch.id,
        name: batch.name,
        code: batch.code,
        start_date: batch.start_date,
        end_date: batch.end_date,
        student_count: batch.user_assignments?.length || 0
      })) || [];

      setBatchDetails(batchesWithStudentCount);
      setSelectedInstitute(institute);
      setIsViewBatchDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch batch details',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin && !roleLoading) {
    console.log('Access denied - User role:', role, 'isAdmin:', isAdmin);
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            You don't have permission to access this page. This page is only accessible to Super Admins.
            <br />
            Current role: {role || 'No role assigned'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading || roleLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center">Loading institutes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Institute Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInstitute(null);
              setFormData({
                name: "",
                code: "",
                description: "",
                address: "",
                contact_email: "",
                contact_phone: "",
                subscription_plan: ""
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Institute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Institute</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Institute Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Institute Code *</Label>
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

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select value={formData.subscription_plan} onValueChange={(value) => setFormData({...formData, subscription_plan: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        {plan.name} - {plan.member_limit} members
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Institute</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Institutes ({institutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Admin Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                console.log('Rendering institutes in table:', institutes);
                return institutes.map((institute) => {
                  console.log('Institute admin name for', institute.name, ':', institute.admin_name);
                  return (
                  <TableRow key={institute.id}>
                    <TableCell className="font-medium">{institute.name}</TableCell>
                    <TableCell>{institute.code}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {institute.admin_name || 'No Admin Assigned'}
                      </span>
                    </TableCell>
                  <TableCell>
                    {institute.contact_email && (
                      <div>{institute.contact_email}</div>
                    )}
                    {institute.contact_phone && (
                      <div className="text-sm text-muted-foreground">
                        {institute.contact_phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      institute.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {institute.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewBatchDetails(institute)}
                        title="View Batch Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(institute)}
                        title="Edit Institute"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(institute)}
                        title={institute.is_active ? "Deactivate" : "Activate"}
                      >
                        {institute.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(institute)}
                        title="Delete Institute"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                 </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
          {institutes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No institutes found. Create your first institute to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Institute Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Institute</DialogTitle>
          </DialogHeader>
          {editingInstitute && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Institute Name *</Label>
                  <Input
                    id="edit_name"
                    value={editingInstitute.name}
                    onChange={(e) => setEditingInstitute(prev => prev ? {...prev, name: e.target.value} : null)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_code">Institute Code *</Label>
                  <Input
                    id="edit_code"
                    value={editingInstitute.code}
                    onChange={(e) => setEditingInstitute(prev => prev ? {...prev, code: e.target.value} : null)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={editingInstitute.description || ""}
                  onChange={(e) => setEditingInstitute(prev => prev ? {...prev, description: e.target.value} : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  value={editingInstitute.address || ""}
                  onChange={(e) => setEditingInstitute(prev => prev ? {...prev, address: e.target.value} : null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_contact_email">Contact Email</Label>
                  <Input
                    id="edit_contact_email"
                    type="email"
                    value={editingInstitute.contact_email || ""}
                    onChange={(e) => setEditingInstitute(prev => prev ? {...prev, contact_email: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_contact_phone">Contact Phone</Label>
                  <Input
                    id="edit_contact_phone"
                    value={editingInstitute.contact_phone || ""}
                    onChange={(e) => setEditingInstitute(prev => prev ? {...prev, contact_phone: e.target.value} : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_subscription_plan">Subscription Plan</Label>
                <Select value={editingInstitute?.subscription_plan || ""} onValueChange={(value) => setEditingInstitute(prev => prev ? {...prev, subscription_plan: value} : null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        {plan.name} - {plan.member_limit} members
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Institute</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Batch Details Dialog */}
      <Dialog open={isViewBatchDialogOpen} onOpenChange={setIsViewBatchDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              Batch Details - {selectedInstitute?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Batches: {batchDetails.length}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchDetails.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {batch.student_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      {batch.start_date && batch.end_date ? (
                        <div className="text-sm">
                          <div>{new Date(batch.start_date).toLocaleDateString()} -</div>
                          <div>{new Date(batch.end_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {batchDetails.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No batches found for this institute.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {instituteToToggle?.is_active ? 'deactivate' : 'activate'} the institute "{instituteToToggle?.name}"?
              {instituteToToggle?.is_active && " This will make the institute inactive and may affect related batches and students."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {instituteToToggle?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the institute "{instituteToDelete?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};