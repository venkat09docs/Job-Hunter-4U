import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';  
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { canAdminExtendTask } from '@/utils/dueDateValidation';
import { useRole } from '@/hooks/useRole';

interface ReenableRequest {
  id: string;
  user_task_id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  linkedin_user_tasks: {
    id: string;
    due_at: string;
    linkedin_tasks: {
      title: string;
      code: string;
    };
  };
  profiles: {
    full_name: string;
    username: string;
  };
}

export const AdminReenableRequestsDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<ReenableRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const { isAdmin, isRecruiter, isInstituteAdmin } = useRole();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get role-based user filtering (same logic as VerifyAssignments.tsx)
      let filteredUserIds: string[] = [];
      
      if (isInstituteAdmin) {
        // Get users from institutes managed by this admin
        const { data: managedInstitutes } = await supabase
          .from('institute_admin_assignments')
          .select('institute_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('is_active', true);

        if (managedInstitutes && managedInstitutes.length > 0) {
          const { data: instituteUsers } = await supabase
            .from('user_assignments')
            .select('user_id')
            .in('institute_id', managedInstitutes.map(inst => inst.institute_id))
            .eq('is_active', true);
          
          filteredUserIds = instituteUsers?.map(u => u.user_id) || [];
        }
      } else if (isRecruiter) {
        // Get users NOT assigned to any institute
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('user_id');
        
        const { data: instituteUsers } = await supabase
          .from('user_assignments')
          .select('user_id')
          .eq('is_active', true);
        
        const instituteUserIds = new Set(instituteUsers?.map(u => u.user_id) || []);
        filteredUserIds = allUsers?.filter(u => !instituteUserIds.has(u.user_id)).map(u => u.user_id) || [];
      }

      // Build the query with role-based filtering
      let query = supabase
        .from('linkedin_task_renable_requests')
        .select(`
          *,
          linkedin_user_tasks!inner (
            id,
            due_at,
            linkedin_tasks!inner (
              title,
              code
            )
          )
        `)
        .eq('status', 'pending');

      // Apply user filtering for non-admin roles
      if (!isAdmin && filteredUserIds.length > 0) {
        query = query.in('user_id', filteredUserIds);
      } else if (!isAdmin && filteredUserIds.length === 0) {
        // No users to show for this role
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately  
      if (data && data.length > 0) {
        const userIds = data.map(req => req.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username')
          .in('user_id', userIds);

        if (profileError) throw profileError;

        // Combine data with profiles
        const requestsWithProfiles = data.map(req => ({
          ...req,
          status: req.status as 'pending' | 'approved' | 'rejected',
          profiles: profiles?.find(p => p.user_id === req.user_id) || { 
            full_name: 'Unknown', 
            username: 'unknown' 
          }
        })) as ReenableRequest[];

        setRequests(requestsWithProfiles);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch extension requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleApproveRequest = async (requestId: string, userTaskId: string, dueAt: string) => {
    if (!canAdminExtendTask(dueAt)) {
      toast.error('Cannot extend task - week has already ended');
      return;
    }

    setProcessingId(requestId);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get the user ID from the request for point deduction
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update the linkedin_user_task to extend it
      const { error: taskError } = await supabase
        .from('linkedin_user_tasks')
        .update({
          admin_extended: true,
          extended_by: user.user.id,
          extended_at: new Date().toISOString(),
          extension_reason: adminNotes[requestId] || 'Admin approved extension request'
        })
        .eq('id', userTaskId);

      if (taskError) throw taskError;

      // Deduct 5 points from user's activity points for extension
      const { error: pointsError } = await supabase
        .from('user_activity_points')
        .insert({
          user_id: request.user_id,
          activity_type: 'extension_penalty',
          activity_id: `linkedin_extension_${requestId}`,
          activity_date: new Date().toDateString(),
          points_earned: -5,
          activity_description: 'Points deducted for approved LinkedIn task extension'
        });

      if (pointsError) {
        console.error('Error deducting points:', pointsError);
        // Continue anyway as extension is more important than points
      }

      // Update the request status
      const { error: requestError } = await supabase
        .from('linkedin_task_renable_requests')
        .update({
          status: 'approved',
          reviewed_by: user.user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes[requestId] || ''
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      toast.success('LinkedIn task extension approved successfully! (5 points deducted)');
      
      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setAdminNotes(prev => {
        const { [requestId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve extension request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('linkedin_task_renable_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes[requestId] || ''
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Extension request rejected');
      
      // Remove from local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setAdminNotes(prev => {
        const { [requestId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject extension request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Extension Requests
          {requests.length > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {requests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Task Extension Requests
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending extension requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const canExtend = canAdminExtendTask(request.linkedin_user_tasks.due_at);
                
                return (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {request.profiles.full_name} (@{request.profiles.username})
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {request.linkedin_user_tasks.linkedin_tasks.code}
                          </Badge>
                        </div>
                        
                        <p className="text-sm font-medium text-primary mb-1">
                          {request.linkedin_user_tasks.linkedin_tasks.title}
                        </p>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            Due: {format(new Date(request.linkedin_user_tasks.due_at), 'MMM dd, yyyy h:mm a')}
                          </div>
                          <div>
                            Requested: {format(new Date(request.requested_at), 'MMM dd, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      
                      {!canExtend && (
                        <Badge variant="destructive" className="text-xs">
                          Week Expired
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Student's Reason:</Label>
                      <p className="text-sm bg-muted/50 p-2 rounded">
                        {request.reason}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Admin Notes (Optional):</Label>
                      <Textarea
                        placeholder="Add any notes about this decision..."
                        value={adminNotes[request.id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [request.id]: e.target.value
                        }))}
                        rows={2}
                      />
                    </div>
                    
                    {canExtend ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveRequest(
                            request.id, 
                            request.user_task_id, 
                            request.linkedin_user_tasks.due_at
                          )}
                          disabled={processingId === request.id}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {processingId === request.id ? 'Approving...' : 'Approve Extension'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {processingId === request.id ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Cannot extend - week has expired</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingId === request.id}
                          className="ml-auto"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};