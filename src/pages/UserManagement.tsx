import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, UserCheck, Users, GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface UserWithRole extends UserProfile {
  current_role: string;
}

interface BatchAssignment {
  user_id: string;
  batch_id: string;
  batch_name: string;
  batch_code: string;
  institute_id: string;
  institute_name: string;
  assignment_type: string;
}

interface UserWithAssignments extends UserWithRole {
  assignments: BatchAssignment[];
}

export default function UserManagement() {
  const { isAdmin, isInstituteAdmin, loading } = useRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [instituteUsers, setInstituteUsers] = useState<UserWithAssignments[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');

  useEffect(() => {
    if (isAdmin || isInstituteAdmin) {
      if (isAdmin) {
        fetchAllUsers();
      } else if (isInstituteAdmin) {
        fetchInstituteUsers();
      }
    }
  }, [isAdmin, isInstituteAdmin]);

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

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Get all user profiles
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

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      // Get user roles for all users
      const userIds = profiles.map(p => p.user_id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          current_role: userRole?.role || 'user'
        };
      });

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchInstituteUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Get institute admin's managed institutes
      const { data: managedInstitutes, error: institutesError } = await supabase
        .rpc('get_managed_institutes', { user_id_param: user?.id });

      if (institutesError) throw institutesError;

      if (!managedInstitutes || managedInstitutes.length === 0) {
        setInstituteUsers([]);
        return;
      }

      const instituteIds = managedInstitutes.map((inst: any) => inst.institute_id);

      // Get all user assignments for these institutes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select(`
          user_id,
          batch_id,
          institute_id,
          assignment_type,
          batches (
            name,
            code
          ),
          institutes (
            name
          )
        `)
        .in('institute_id', instituteIds)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      // Get user profiles for assigned users
      const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];
      
      if (userIds.length === 0) {
        setInstituteUsers([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          username,
          subscription_active,
          created_at
        `)
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithAssignments = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const userAssignments = assignments?.filter(a => a.user_id === profile.user_id).map(a => ({
          user_id: a.user_id,
          batch_id: a.batch_id,
          batch_name: a.batches?.name || 'Unknown Batch',
          batch_code: a.batches?.code || 'N/A',
          institute_id: a.institute_id,
          institute_name: a.institutes?.name || 'Unknown Institute',
          assignment_type: a.assignment_type
        })) || [];

        return {
          ...profile,
          current_role: userRole?.role || 'user',
          assignments: userAssignments
        };
      }) || [];

      setInstituteUsers(usersWithAssignments);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch institute users',
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
      if (isAdmin) {
        fetchAllUsers();
      } else {
        fetchInstituteUsers();
      }
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

  if (!isAdmin && !isInstituteAdmin) {
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

  const renderAllUsersView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>All Users ({filteredUsers.length})</span>
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
  );

  const renderInstituteUsersView = () => {
    // Group users by batch
    const usersByBatch = instituteUsers.reduce((acc, user) => {
      user.assignments.forEach(assignment => {
        const batchKey = `${assignment.batch_id}-${assignment.batch_name}`;
        if (!acc[batchKey]) {
          acc[batchKey] = {
            batch_name: assignment.batch_name,
            batch_code: assignment.batch_code,
            institute_name: assignment.institute_name,
            users: []
          };
        }
        if (!acc[batchKey].users.find(u => u.user_id === user.user_id)) {
          acc[batchKey].users.push(user);
        }
      });
      return acc;
    }, {} as Record<string, { batch_name: string; batch_code: string; institute_name: string; users: UserWithAssignments[] }>);

    return (
      <div className="space-y-6">
        {Object.entries(usersByBatch).map(([batchKey, batchData]) => (
          <Card key={batchKey}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>{batchData.batch_name} ({batchData.batch_code})</span>
                <span className="text-sm text-muted-foreground">- {batchData.institute_name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assignment Type</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchData.users.map((user) => (
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
                        {user.assignments.find(a => a.batch_name === batchData.batch_name)?.assignment_type || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {Object.keys(usersByBatch).length === 0 && !loadingUsers && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users assigned to your institute batches yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Manage user roles and permissions across the platform' 
                : 'View and manage users in your institute batches'
              }
            </p>
          </div>

          <div className="space-y-6">
            {loadingUsers ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading users...</p>
                  </div>
                </CardContent>
              </Card>
            ) : isAdmin ? (
              renderAllUsersView()
            ) : (
              renderInstituteUsersView()
            )}
          </div>

          {isAdmin && (
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
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}