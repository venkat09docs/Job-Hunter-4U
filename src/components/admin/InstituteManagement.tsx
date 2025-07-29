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
import { Plus, Edit, Users, Trash2 } from 'lucide-react';
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
}

interface InstituteFormData {
  name: string;
  code: string;
  description: string;
  address: string;
  contact_email: string;
  contact_phone: string;
}

export const InstituteManagement = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<Institute | null>(null);
  const [formData, setFormData] = useState<InstituteFormData>({
    name: '',
    code: '',
    description: '',
    address: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchInstitutes();
    }
  }, [isAdmin]);

  const fetchInstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from('institutes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutes(data || []);
    } catch (error: any) {
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
        const { error } = await supabase
          .from('institutes')
          .update({
            ...formData,
          })
          .eq('id', editingInstitute.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Institute updated successfully',
        });
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

      setShowForm(false);
      setEditingInstitute(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        address: '',
        contact_email: '',
        contact_phone: '',
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

  const handleEdit = (institute: Institute) => {
    setEditingInstitute(institute);
    setFormData({
      name: institute.name,
      code: institute.code,
      description: institute.description || '',
      address: institute.address || '',
      contact_email: institute.contact_email || '',
      contact_phone: institute.contact_phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (institute: Institute) => {
    if (!confirm(`Are you sure you want to delete ${institute.name}?`)) return;

    try {
      const { error } = await supabase
        .from('institutes')
        .update({ is_active: false })
        .eq('id', institute.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Institute deactivated successfully',
      });
      fetchInstitutes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate institute',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
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
          <p className="text-center">Loading institutes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Institute Management</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInstitute(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                address: '',
                contact_email: '',
                contact_phone: '',
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Institute
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingInstitute ? 'Edit Institute' : 'Add New Institute'}
              </DialogTitle>
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingInstitute ? 'Update' : 'Create'} Institute
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institutes ({institutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.map((institute) => (
                <TableRow key={institute.id}>
                  <TableCell className="font-medium">{institute.name}</TableCell>
                  <TableCell>{institute.code}</TableCell>
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
                        onClick={() => handleEdit(institute)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(institute)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {institutes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No institutes found. Create your first institute to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};