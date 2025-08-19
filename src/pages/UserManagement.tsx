import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, UserCheck, Trash2, User, Download, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trophy } from 'lucide-react';
import * as Papa from 'papaparse';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  role: 'admin' | 'institute_admin' | 'user' | 'recruiter';
}

interface UserWithRole extends UserProfile {
  current_role: string;
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

interface UserWithAssignments extends UserWithRole {
  assignments?: {
    institute_id: string;
    institute_name: string;
    batch_id?: string;
    batch_name?: string;
    assignment_type: string;
  }[];
}

interface UserActivityPoint {
  id: string;
  activity_id: string;
  activity_type: string;
  points_earned: number;
  activity_date: string;
  created_at: string;
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
  
  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterInstitute, setFilterInstitute] = useState<string>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [usersWithAssignments, setUsersWithAssignments] = useState<UserWithAssignments[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<UserWithRole[]>([]);
  
  // Bulk operations states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [showBulkPlanDialog, setShowBulkPlanDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>('');
  const [bulkInstitute, setBulkInstitute] = useState<string>('');
  const [bulkPlan, setBulkPlan] = useState<string>('');
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  
  // Points history states
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [selectedUserPoints, setSelectedUserPoints] = useState<UserActivityPoint[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [userPointsData, setUserPointsData] = useState<{user: UserWithRole; totalPoints: number} | null>(null);

  useEffect(() => {
    if (isAdmin || isInstituteAdmin) {
      fetchUsers();
      fetchInstitutes();
      fetchAvailablePlans();
      fetchBatches();
    }
  }, [isAdmin, isInstituteAdmin]);

  const fetchAvailablePlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('id, name, duration_days, description')
        .eq('is_active', true)
        .eq('plan_type', 'user')
        .order('duration_days', { ascending: true });

      if (error) throw error;
      setAvailablePlans(plans || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  };

  // Enhanced filter logic with user assignments
  useEffect(() => {
    const fetchUsersWithAssignments = async () => {
      if (users.length === 0) return;

      try {
        const { data: assignments, error } = await supabase
          .from('user_assignments')
          .select(`
            user_id,
            institute_id,
            batch_id,
            assignment_type,
            institutes!inner(name),
            batches(name)
          `)
          .eq('is_active', true);

        if (error) throw error;

        const usersWithAssignmentsData = users.map(user => ({
          ...user,
          assignments: assignments?.filter(a => a.user_id === user.user_id).map(a => ({
            institute_id: a.institute_id || '',
            institute_name: a.institutes?.name || '',
            batch_id: a.batch_id || '',
            batch_name: a.batches?.name || '',
            assignment_type: a.assignment_type
          })) || []
        }));

        setUsersWithAssignments(usersWithAssignmentsData);
      } catch (error) {
        console.error('Error fetching user assignments:', error);
        setUsersWithAssignments(users.map(user => ({ ...user, assignments: [] })));
      }
    };

    fetchUsersWithAssignments();
  }, [users]);

  // Apply all filters and pagination
  useEffect(() => {
    let filtered = usersWithAssignments;

    // Search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // User type filter
    if (filterType !== 'all') {
      if (filterType === 'active') {
        filtered = filtered.filter(user => user.subscription_active);
      } else if (filterType === 'inactive') {
        filtered = filtered.filter(user => !user.subscription_active);
      }
    }

    // Institute filter
    if (filterInstitute !== 'all') {
      filtered = filtered.filter(user => 
        user.assignments?.some(assignment => assignment.institute_id === filterInstitute)
      );
    }

    // Batch filter
    if (filterBatch !== 'all') {
      filtered = filtered.filter(user => 
        user.assignments?.some(assignment => assignment.batch_id === filterBatch)
      );
    }

    setFilteredUsers(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [searchQuery, usersWithAssignments, filterType, filterInstitute, filterBatch]);

  // Handle pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredUsers.length);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUsers.has(user.user_id));
  const isIndeterminate = selectedUsers.size > 0 && !isAllSelected;

  // Bulk operations functions
  const handleBulkRoleChange = async () => {
    if (selectedUsers.size === 0 || !bulkRole) return;

    setBulkOperationLoading(true);
    try {
      const selectedUsersList = Array.from(selectedUsers);
      
      for (const userId of selectedUsersList) {
        // Delete existing role and institute assignments
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        const currentUser = filteredUsers.find(u => u.user_id === userId);
        if (currentUser?.current_role === 'institute_admin') {
          await supabase
            .from('institute_admin_assignments')
            .delete()
            .eq('user_id', userId);
        }

        // Insert new role
        await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: bulkRole as 'admin' | 'institute_admin' | 'user' | 'recruiter'
          });

        // If assigning institute_admin role, also create institute assignment
        if (bulkRole === 'institute_admin' && bulkInstitute) {
          await supabase
            .from('institute_admin_assignments')
            .insert({
              user_id: userId,
              institute_id: bulkInstitute,
              assigned_by: user?.id || userId
            });
        }
      }

      toast({
        title: 'Success',
        description: `Role updated for ${selectedUsers.size} users`,
      });

      setShowBulkRoleDialog(false);
      setBulkRole('');
      setBulkInstitute('');
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update roles',
        variant: 'destructive',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkPlanAssign = async () => {
    if (selectedUsers.size === 0 || !bulkPlan) return;

    setBulkOperationLoading(true);
    try {
      const selectedPlan = availablePlans.find(plan => plan.name === bulkPlan);
      if (!selectedPlan) throw new Error('Selected plan not found');

      const selectedUsersList = Array.from(selectedUsers);
      const now = new Date();

      for (const userId of selectedUsersList) {
        // Get current user profile to check existing subscription
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('subscription_end_date, subscription_active')
          .eq('user_id', userId)
          .single();

        let newEndDate: Date;

        if (currentProfile?.subscription_active && currentProfile?.subscription_end_date) {
          const existingEndDate = new Date(currentProfile.subscription_end_date);
          if (existingEndDate > now) {
            newEndDate = new Date(existingEndDate);
            newEndDate.setDate(existingEndDate.getDate() + selectedPlan.duration_days);
          } else {
            newEndDate = new Date(now);
            newEndDate.setDate(now.getDate() + selectedPlan.duration_days);
          }
        } else {
          newEndDate = new Date(now);
          newEndDate.setDate(now.getDate() + selectedPlan.duration_days);
        }

        // Update the user's subscription
        await supabase
          .from('profiles')
          .update({
            subscription_plan: bulkPlan,
            subscription_start_date: now.toISOString(),
            subscription_end_date: newEndDate.toISOString(),
            subscription_active: true,
          })
          .eq('user_id', userId);
      }

      toast({
        title: 'Success',
        description: `Plan assigned to ${selectedUsers.size} users`,
      });

      setShowBulkPlanDialog(false);
      setBulkPlan('');
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign plans',
        variant: 'destructive',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    setBulkOperationLoading(true);
    try {
      const selectedUsersList = Array.from(selectedUsers);
      
      for (const userId of selectedUsersList) {
        await supabase.functions.invoke('delete-user', {
          body: { user_id: userId }
        });
      }

      toast({
        title: 'Success',
        description: `${selectedUsers.size} users deleted successfully`,
      });

      setShowBulkDeleteDialog(false);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete users',
        variant: 'destructive',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const fetchUserActivityPoints = async (user: UserWithRole) => {
    try {
      setPointsLoading(true);
      setUserPointsData({ user, totalPoints: 0 });
      
      const { data: activityPoints, error } = await supabase
        .from('user_activity_points')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalPoints = activityPoints?.reduce((sum, point) => sum + point.points_earned, 0) || 0;
      
      setSelectedUserPoints(activityPoints || []);
      setUserPointsData({ user, totalPoints });
      setShowPointsDialog(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch user points',
        variant: 'destructive',
      });
    } finally {
      setPointsLoading(false);
    }
  };

  const syncMissingProfiles = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase.functions.invoke('sync-user-profiles');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${data.message}. Refreshing user list...`
      });
      
      // Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      console.error('Sync failed:', error);
      toast({
        title: "Error", 
        description: `Failed to sync user profiles: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      
      if (isAdmin) {
        console.log('🔍 Fetching users as admin...');
        
        // Admin can see ALL users directly from profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, email, profile_image_url, subscription_plan, subscription_active, subscription_start_date, subscription_end_date, total_resume_opens, total_job_searches, total_ai_queries, industry, created_at, updated_at')
          .limit(1000)
          .order('created_at', { ascending: false });

        console.log('📊 Profiles query result:', { profiles: profiles?.length || 0, error: profilesError });
        
        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
          throw profilesError;
        }

        if (!profiles) {
          console.log('⚠️ No profiles returned from query');
          setUsers([]);
          setFilteredUsers([]);
          return;
        }

        console.log('✅ Found profiles:', profiles.length);

        // Get user roles for all users
        const userIds = profiles.map(p => p.user_id);
        console.log('🔍 Fetching roles for users:', userIds.length);
        
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        console.log('📊 Roles query result:', { roles: roles?.length || 0, error: rolesError });

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

        // Get safe profiles for these users (using secure function)
        const { data: profiles, error: profilesError } = await supabase
          .rpc('get_safe_admin_profiles', { user_ids: userIds });

        if (profilesError) throw profilesError;

        // Get user roles for these users
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) throw rolesError;

        // Combine institute profiles with roles and add masked email for security
        const usersWithRoles = profiles?.map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          return {
            ...profile,
            email: `${profile.username || 'user'}@protected.com`, // Masked for security
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

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, code, institute_id')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
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
          role: newRole as 'admin' | 'institute_admin' | 'user' | 'recruiter'
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

  // Reset batch filter when institute changes
  useEffect(() => {
    if (filterInstitute === 'all') {
      setFilterBatch('all');
    }
  }, [filterInstitute]);

  // Get filtered batches based on selected institute
  const getFilteredBatches = () => {
    if (filterInstitute === 'all') return [];
    return batches.filter(batch => batch.institute_id === filterInstitute);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const dataToExport = filteredUsers.map(user => {
      const userAssignments = usersWithAssignments.find(u => u.user_id === user.user_id);
      const institutes = userAssignments?.assignments?.map(a => a.institute_name).join(', ') || 'None';
      const batches = userAssignments?.assignments?.map(a => a.batch_name).filter(Boolean).join(', ') || 'None';

      return {
        'Name': user.full_name || 'No name',
        'Username': user.username || 'No username',
        'Email': user.email || 'No email',
        'Role': user.current_role === 'institute_admin' ? 'Institute Admin' : 
               user.current_role.charAt(0).toUpperCase() + user.current_role.slice(1),
        'Subscription Status': user.subscription_active ? 'Active' : 'Free',
        'Institutes': institutes,
        'Batches': batches,
        'Joined Date': new Date(user.created_at).toLocaleDateString(),
        'User ID': user.user_id
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date and filter info
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    let filename = `users_export_${dateStr}`;
    
    if (filterType !== 'all') filename += `_${filterType}`;
    if (filterInstitute !== 'all') {
      const inst = institutes.find(i => i.id === filterInstitute);
      filename += `_${inst?.code || 'institute'}`;
    }
    if (filterBatch !== 'all') {
      const batch = batches.find(b => b.id === filterBatch);
      filename += `_${batch?.code || 'batch'}`;
    }
    
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Exported ${filteredUsers.length} users to CSV`,
    });
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
                     <Button
                       onClick={syncMissingProfiles}
                       variant="outline"
                       size="sm"
                     >
                       Sync Missing Users
                     </Button>
                     <Button
                       onClick={exportToCSV}
                       variant="outline"
                       disabled={filteredUsers.length === 0}
                     >
                       <Download className="h-4 w-4 mr-2" />
                       Export CSV
                     </Button>
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
                
                {/* Filters Section */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-medium">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* User Type Filter */}
                    <div className="space-y-2">
                      <Label>User Type</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Users" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="active">Active Subscribers</SelectItem>
                          <SelectItem value="inactive">Free Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Institute Filter */}
                    <div className="space-y-2">
                      <Label>Institute</Label>
                      <Select value={filterInstitute} onValueChange={setFilterInstitute}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Institutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Institutes</SelectItem>
                          {institutes.map((institute) => (
                            <SelectItem key={institute.id} value={institute.id}>
                              {institute.name} ({institute.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Batch Filter */}
                    <div className="space-y-2">
                      <Label>Batch</Label>
                      <Select 
                        value={filterBatch} 
                        onValueChange={setFilterBatch}
                        disabled={filterInstitute === 'all'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={filterInstitute === 'all' ? 'Select Institute First' : 'All Batches'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Batches</SelectItem>
                          {getFilteredBatches().map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} ({batch.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clear Filters */}
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterType('all');
                          setFilterInstitute('all');
                          setFilterBatch('all');
                        }}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Actions */}
                {selectedUsers.size > 0 && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowBulkRoleDialog(true)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign Role
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowBulkPlanDialog(true)}
                          >
                            💎 Assign Plan
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowBulkDeleteDialog(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Users
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pagination Controls Top */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label>Show:</Label>
                      <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                        setItemsPerPage(parseInt(value));
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                    
                    {filteredUsers.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Showing {startIndex} to {endIndex} of {filteredUsers.length} users
                      </span>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all users"
                          />
                        </TableHead>
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
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.user_id)}
                              onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                            />
                          </TableCell>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchUserActivityPoints(user)}
                                title="View Points History"
                              >
                                <Trophy className="h-4 w-4" />
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
                
                {/* Bottom Pagination */}
                {totalPages > 1 && !loadingUsers && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-4">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                          {isAdmin && <SelectItem value="recruiter">Recruiter</SelectItem>}
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

          {/* Bulk Role Assignment Dialog */}
          <Dialog open={showBulkRoleDialog} onOpenChange={setShowBulkRoleDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Bulk Role Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Selected Users</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-role">New Role</Label>
                  <Select value={bulkRole} onValueChange={setBulkRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="user">User</SelectItem>
                       {isAdmin && <SelectItem value="institute_admin">Institute Admin</SelectItem>}
                       {isAdmin && <SelectItem value="recruiter">Recruiter</SelectItem>}
                       {isAdmin && <SelectItem value="admin">Super Admin</SelectItem>}
                     </SelectContent>
                  </Select>
                </div>
                
                {bulkRole === 'institute_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="bulk-institute">Select Institute</Label>
                    <Select value={bulkInstitute} onValueChange={setBulkInstitute}>
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
                <Button variant="outline" onClick={() => setShowBulkRoleDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkRoleChange} disabled={bulkOperationLoading}>
                  {bulkOperationLoading ? 'Updating...' : 'Update Roles'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Plan Assignment Dialog */}
          <Dialog open={showBulkPlanDialog} onOpenChange={setShowBulkPlanDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Bulk Plan Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Selected Users</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-plan">Subscription Plan</Label>
                  <Select value={bulkPlan} onValueChange={setBulkPlan}>
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
                <Button variant="outline" onClick={() => setShowBulkPlanDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkPlanAssign} disabled={bulkOperationLoading}>
                  {bulkOperationLoading ? 'Assigning...' : 'Assign Plans'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Points History Dialog */}
          <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Points History - {userPointsData?.user.full_name || 'User'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Total Points Earned</h3>
                      <p className="text-muted-foreground">
                        {userPointsData?.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {userPointsData?.totalPoints || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Points
                      </p>
                    </div>
                  </div>
                </div>

                {pointsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : selectedUserPoints.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Activity History</h4>
                    {selectedUserPoints.map((point) => (
                      <div key={point.id} className="border rounded-lg p-3 bg-card">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {point.activity_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Type: {point.activity_type} • Date: {new Date(point.activity_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Awarded: {new Date(point.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-primary">
                              +{point.points_earned}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              points
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No activity points found for this user.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowPointsDialog(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Delete Confirmation Dialog */}
          <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirm Bulk Delete</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Warning</Label>
                  <p className="text-sm text-muted-foreground">
                    You are about to permanently delete {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}. 
                    This action cannot be undone and will remove all user data.
                  </p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-destructive mt-2 space-y-1">
                    <li>• User accounts and authentication</li>
                    <li>• All user data and profiles</li>
                    <li>• User roles and assignments</li>
                    <li>• Associated subscriptions</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete} 
                  disabled={bulkOperationLoading}
                >
                  {bulkOperationLoading ? 'Deleting...' : `Delete ${selectedUsers.size} Users`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}