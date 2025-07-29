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
import { Plus, Edit, Trash2 } from 'lucide-react';
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

export const BatchManagement = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin } = useRole();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
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
      fetchData();
    }
  }, [isAdmin, isInstituteAdmin]);

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
        <h2 className="text-2xl font-bold">Batch Management</h2>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batches ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.code}</TableCell>
                  <TableCell>
                    {batch.institutes?.name} ({batch.institutes?.code})
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {batches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No batches found. Create your first batch to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};