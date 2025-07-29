import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, UserCheck, Trash2, User } from 'lucide-react';
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
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  user_id: string;
  full_name: string;
  username: string;
  email: string;
  subscription_active: boolean;
  created_at: string;
}

interface UserRole {
  role: 'admin' | 'institute_admin' | 'user';
}

interface UserWithRole extends UserProfile {
  current_role: string;
}

interface Institute {
  id: string;
  name: string;
  code: string;
}

export default function UserManagement() {
  const { isAdmin, isInstituteAdmin, loading } = useRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    username: '',
    email: '',
  });
  const [addUserFormData, setAddUserFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
  });
  const [planFormData, setPlanFormData] = useState({
    subscription_plan: '',
  });
  const [availablePlans, setAvailablePlans] = useState<Array<{id: string, name: string, duration_days: number, description: string}>>([]);

  useEffect(() => {
    if (isAdmin || isInstituteAdmin) {
      fetchUsers();
      fetchInstitutes();
      fetchAvailablePlans();
    }
  }, [isAdmin, isInstituteAdmin]);

  const fetchAvailablePlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('id, name, duration_days, description')
        .eq('is_active', true)
        .order('duration_days', { ascending: true });

      if (error) throw error;
      setAvailablePlans(plans || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      if (isAdmin) {
        // Admin can see all users from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            full_name,
            username,
            email,
            subscription_active,
            subscription_plan,
            subscription_end_date,
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
      } else if (isInstituteAdmin) {
        // Institute admin can only see users assigned to their institutes
        // First get all user assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('user_assignments')
          .select('user_id')
          .eq('is_active', true);

        if (assignmentsError) throw assignmentsError;

        // Get unique user IDs
        const userIds = [...new Set(assignments?.map(a => a.user_id) || [])];

        if (userIds.length === 0) {
          setUsers([]);
          setFilteredUsers([]);
          return;
        }

        // Get profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id,
            full_name,
            username,
            email,
            subscription_active,
            subscription_plan,
            subscription_end_date,
            created_at
          `)
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get user roles for these users
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
      }
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

  const fetchInstitutes = async () => {
    try {
      const { data, error } = await supabase
        .from('institutes')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setInstitutes(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch institutes',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    // Validate that institute is selected for institute_admin role
    if (newRole === 'institute_admin' && !selectedInstitute) {
      toast({
        title: 'Error',
        description: 'Please select an institute for Institute Admin role',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First, delete existing role and institute assignments
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (selectedUser.current_role === 'institute_admin') {
        await supabase
          .from('institute_admin_assignments')
          .delete()
          .eq('user_id', selectedUser.user_id);
      }

      // Then insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole as 'admin' | 'institute_admin' | 'user'
        });

      if (roleError) throw roleError;

      // If assigning institute_admin role, also create institute assignment
      if (newRole === 'institute_admin' && selectedInstitute) {
        const { error: assignmentError } = await supabase
          .from('institute_admin_assignments')
          .insert({
            user_id: selectedUser.user_id,
            institute_id: selectedInstitute,
            assigned_by: user?.id || selectedUser.user_id
          });

        if (assignmentError) throw assignmentError;
      }

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}${newRole === 'institute_admin' ? ' with institute assignment' : ''}`,
      });

      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      setSelectedInstitute('');
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

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
    });
    setShowEditDialog(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFormData.full_name,
          username: editFormData.username,
          email: editFormData.email,
        })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User profile updated successfully',
      });

      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user profile',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name || 'this user'}? This action cannot be undone and will remove all user data.`)) {
      return;
    }

    try {
      // Call the edge function to delete user completely
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.user_id }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully from all systems',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Delete user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user completely',
        variant: 'destructive',
      });
    }
  };

  const openPlanDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setPlanFormData({
      subscription_plan: '',
    });
    setShowPlanDialog(true);
  };

  const handleAddUser = async () => {
    if (!addUserFormData.email || !addUserFormData.password || !addUserFormData.full_name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Call the edge function to create user
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: addUserFormData.email,
          password: addUserFormData.password,
          full_name: addUserFormData.full_name,
          username: addUserFormData.username,
          role: 'user' // Default role
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      setShowAddUserDialog(false);
      setAddUserFormData({
        full_name: '',
        username: '',
        email: '',
        password: '',
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedUser || !planFormData.subscription_plan) return;

    try {
      // Get the selected plan details
      const selectedPlan = availablePlans.find(plan => plan.name === planFormData.subscription_plan);
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      // Get current user profile to check existing subscription
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_end_date, subscription_active')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (profileError) throw profileError;

      let newEndDate: Date;
      const now = new Date();

      if (currentProfile?.subscription_active && currentProfile?.subscription_end_date) {
        // User has active subscription - add days to existing end date
        const existingEndDate = new Date(currentProfile.subscription_end_date);
        
        // If existing subscription hasn't expired yet, add to that date
        if (existingEndDate > now) {
          newEndDate = new Date(existingEndDate);
          newEndDate.setDate(existingEndDate.getDate() + selectedPlan.duration_days);
        } else {
          // Existing subscription has expired, start from today
          newEndDate = new Date(now);
          newEndDate.setDate(now.getDate() + selectedPlan.duration_days);
        }
      } else {
        // User has no active subscription - start from today
        newEndDate = new Date(now);
        newEndDate.setDate(now.getDate() + selectedPlan.duration_days);
      }

      // Update the user's subscription with proper timestamp format
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: planFormData.subscription_plan,
          subscription_start_date: now.toISOString(),
          subscription_end_date: newEndDate.toISOString(),
          subscription_active: true,
        })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Plan assigned successfully. ${selectedPlan.duration_days} days added to subscription.`,
      });

      setShowPlanDialog(false);
      setSelectedUser(null);
      setPlanFormData({
        subscription_plan: '',
      });
      
      // Refresh the users list to show updated subscription status
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign plan',
        variant: 'destructive',
      });
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top Level Menu */}
      <div className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-semibold">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage user roles and permissions across the platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Users ({filteredUsers.length})</span>
                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <Button onClick={() => setShowAddUserDialog(true)}>
                        <User className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    )}
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
                         <TableHead>Email</TableHead>
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
                           <TableCell>{user.email || 'No email'}</TableCell>
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
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(user)}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPlanDialog(user)}
                                >
                                  💎
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                         {isAdmin && <SelectItem value="institute_admin">Institute Admin</SelectItem>}
                         {isAdmin && <SelectItem value="admin">Super Admin</SelectItem>}
                       </SelectContent>
                     </Select>
                </div>
                
                {newRole === 'institute_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="institute">Select Institute</Label>
                    <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
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

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit User Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Full Name</Label>
                  <Input
                    id="edit_full_name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_username">Username</Label>
                  <Input
                    id="edit_username"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add_full_name">Full Name *</Label>
                  <Input
                    id="add_full_name"
                    value={addUserFormData.full_name}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_username">Username</Label>
                  <Input
                    id="add_username"
                    value={addUserFormData.username}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_email">Email *</Label>
                  <Input
                    id="add_email"
                    type="email"
                    value={addUserFormData.email}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add_password">Password *</Label>
                  <Input
                    id="add_password"
                    type="password"
                    value={addUserFormData.password}
                    onChange={(e) => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  <User className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Assign Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>User</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser?.full_name || 'No name'} ({selectedUser?.email || 'No email'})
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={planFormData.subscription_plan} onValueChange={(value) => setPlanFormData({ subscription_plan: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                     <SelectContent>
                       {availablePlans.map((plan) => (
                         <SelectItem key={plan.id} value={plan.name}>
                           {plan.name} - {plan.duration_days} days ({plan.description})
                         </SelectItem>
                       ))}
                     </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignPlan}>
                  💎 Assign Plan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}