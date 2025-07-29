import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, UserCheck } from 'lucide-react';
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
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface UserProfile {
  user_id: string;
  full_name: string;
  username: string;
  subscription_active: boolean;
  created_at: string;
}

interface UserRole {
  role: 'admin' | 'institute_admin' | 'user';
}

interface UserWithRole extends UserProfile {
  current_role: string;
}

export default function UserManagement() {
  const { isAdmin, loading } = useRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Get all user profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          username,
          subscription_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          current_role: userRole?.role || 'user'
        };
      }) || [];

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      // First, delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole as 'admin' | 'institute_admin' | 'user'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });

      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.current_role);
    setShowRoleDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
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
                You don't have permission to access user management.
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
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions across the platform
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Users ({filteredUsers.length})</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">
                            {user.full_name || 'No name set'}
                          </TableCell>
                          <TableCell>{user.username || 'No username'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.current_role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : user.current_role === 'institute_admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.current_role === 'institute_admin' ? 'Institute Admin' : 
                               user.current_role.charAt(0).toUpperCase() + user.current_role.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.subscription_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.subscription_active ? 'Active' : 'Free'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Change Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {filteredUsers.length === 0 && !loadingUsers && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Change User Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser?.full_name || 'No name'} ({selectedUser?.username || 'No username'})
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">New Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="institute_admin">Institute Admin</SelectItem>
                      <SelectItem value="admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRoleChange}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Update Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}