import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useInstituteAdminManagement } from '@/hooks/useInstituteAdminManagement';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CheckCircle, XCircle, Clock, User, Calendar, Award, ArrowLeft, Building2, FileText, ExternalLink, Download, Mail, Github, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  user_id: string;
  template_id: string;
  status: string;
  submitted_at: string;
  verified_at?: string;
  points_earned?: number;
  score_awarded?: number;
  career_task_templates?: {
    title: string;
    module?: string;
    points_reward: number;
    category?: string;
    sub_categories?: { name: string };
  };
  profiles?: {
    full_name: string;
    username: string;
    profile_image_url?: string;
  };
  evidence?: any[];
  _isLinkedInAssignment?: boolean;
  _originalLinkedInTask?: any;
}

// Helper component to render evidence in a user-friendly format
const EvidenceCard: React.FC<{ evidence: any; index: number }> = ({ evidence, index }) => {
  // Recursive function to render nested objects properly
  const renderNestedData = (data: any, depth: number = 0): React.ReactNode => {
    if (!data) return null;
    
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
      return <span className="text-sm">{String(data)}</span>;
    }
    
    if (Array.isArray(data)) {
      return (
        <div className={`space-y-1 ${depth > 0 ? 'ml-2' : ''}`}>
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground mt-1">•</span>
              <div className="flex-1">{renderNestedData(item, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }

    if (typeof data === 'object') {
      return (
        <div className={`space-y-2 ${depth > 0 ? 'ml-2 pl-2 border-l-2 border-muted' : ''}`}>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="font-medium text-sm capitalize">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}:
              </div>
              <div className="ml-2">
                {renderNestedData(value, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-sm">{String(data)}</span>;
  };

  const renderEvidenceData = (data: any) => {
    if (!data) return null;
    
    if (typeof data === 'string') {
      return <span className="text-sm">{data}</span>;
    }

    if (typeof data === 'object') {
      // Handle specific data structures based on evidence type
      if (evidence.evidence_type === 'url' || evidence.kind === 'url') {
        return (
          <div className="space-y-3">
            {data.url && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a 
                  href={data.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {data.url}
                </a>
              </div>
            )}
            {data.title && <div><strong>Title:</strong> {data.title}</div>}
            {data.description && <div><strong>Description:</strong> {data.description}</div>}
            {data.notes && <div><strong>Notes:</strong> {data.notes}</div>}
            
            {/* Render any additional properties */}
            {Object.entries(data).filter(([key]) => !['url', 'title', 'description', 'notes'].includes(key)).map(([key, value]) => (
              <div key={key}>
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {renderNestedData(value)}
              </div>
            ))}
          </div>
        );
      }

      if (evidence.evidence_type === 'email' || evidence.kind === 'email') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Email Evidence</span>
            </div>
            {data.subject && <div><strong>Subject:</strong> {data.subject}</div>}
            {data.from && <div><strong>From:</strong> {data.from}</div>}
            {data.to && <div><strong>To:</strong> {data.to}</div>}
            {data.date && <div><strong>Date:</strong> {new Date(data.date).toLocaleString()}</div>}
            {data.body && (
              <div>
                <strong>Content:</strong>
                <div className="mt-1 p-2 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                  {data.body}
                </div>
              </div>
            )}
            
            {/* Render any additional email properties */}
            {Object.entries(data).filter(([key]) => !['subject', 'from', 'to', 'date', 'body'].includes(key)).map(([key, value]) => (
              <div key={key}>
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {renderNestedData(value)}
              </div>
            ))}
          </div>
        );
      }

      if (evidence.evidence_type === 'github' || evidence.kind === 'github') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              <span className="font-medium">GitHub Evidence</span>
            </div>
            {data.repository && <div><strong>Repository:</strong> {data.repository}</div>}
            {data.commit_sha && <div><strong>Commit:</strong> <code className="text-xs bg-muted px-1 rounded">{data.commit_sha.substring(0, 8)}</code></div>}
            {data.branch && <div><strong>Branch:</strong> {data.branch}</div>}
            {data.commit_message && <div><strong>Message:</strong> {data.commit_message}</div>}
            {data.files_changed && <div><strong>Files Changed:</strong> {Array.isArray(data.files_changed) ? data.files_changed.join(', ') : data.files_changed}</div>}
            {data.description && <div><strong>Description:</strong> {data.description}</div>}
            
            {/* Render any additional GitHub properties */}
            {Object.entries(data).filter(([key]) => !['repository', 'commit_sha', 'branch', 'commit_message', 'files_changed', 'description'].includes(key)).map(([key, value]) => (
              <div key={key}>
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {renderNestedData(value)}
              </div>
            ))}
          </div>
        );
      }

      if (evidence.evidence_type === 'linkedin' || evidence.kind === 'linkedin') {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <span className="font-medium">LinkedIn Evidence</span>
            </div>
            {data.post_url && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a 
                  href={data.post_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View LinkedIn Post
                </a>
              </div>
            )}
            {data.content && (
              <div>
                <strong>Post Content:</strong>
                <div className="mt-1 p-2 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                  {data.content}
                </div>
              </div>
            )}
            {data.connections_count && <div><strong>Connections Count:</strong> {data.connections_count}</div>}
            {data.profile_views && <div><strong>Profile Views:</strong> {data.profile_views}</div>}
            {data.post_count && <div><strong>Post Count:</strong> {data.post_count}</div>}
            {data.connections_accepted && <div><strong>Connections Accepted:</strong> {data.connections_accepted}</div>}
            {data.description && <div><strong>Description:</strong> {data.description}</div>}
            
            {/* Handle tracking metrics specifically */}
            {data.tracking_metrics && (
              <div>
                <strong>Tracking Metrics:</strong>
                <div className="mt-2 ml-4">
                  {renderNestedData(data.tracking_metrics)}
                </div>
              </div>
            )}
            
            {/* Render any additional LinkedIn properties */}
            {Object.entries(data).filter(([key]) => !['post_url', 'content', 'connections_count', 'profile_views', 'post_count', 'connections_accepted', 'description', 'tracking_metrics'].includes(key)).map(([key, value]) => (
              <div key={key}>
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {renderNestedData(value)}
              </div>
            ))}
          </div>
        );
      }

      if (evidence.evidence_type === 'job_application' || evidence.kind === 'job_application') {
        return (
          <div className="space-y-3">
            <div className="font-medium">Job Application Details</div>
            {data.company_name && <div><strong>Company:</strong> {data.company_name}</div>}
            {data.position && <div><strong>Position:</strong> {data.position}</div>}
            {data.application_url && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a 
                  href={data.application_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Application
                </a>
              </div>
            )}
            {data.application_date && <div><strong>Applied on:</strong> {new Date(data.application_date).toLocaleDateString()}</div>}
            {data.status && <div><strong>Status:</strong> <Badge variant="outline">{data.status}</Badge></div>}
            {data.notes && (
              <div>
                <strong>Notes:</strong>
                <div className="mt-1 p-2 bg-muted/50 rounded text-sm">
                  {data.notes}
                </div>
              </div>
            )}
            {data.description && <div><strong>Description:</strong> {data.description}</div>}
            
            {/* Render any additional job hunting properties */}
            {Object.entries(data).filter(([key]) => !['company_name', 'position', 'application_url', 'application_date', 'status', 'notes', 'description'].includes(key)).map(([key, value]) => (
              <div key={key}>
                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {renderNestedData(value)}
              </div>
            ))}
          </div>
        );
      }

      // Generic object display for other types - using recursive rendering
      return renderNestedData(data);
    }

    return <span className="text-sm">{String(data)}</span>;
  };

  return (
    <Card className={`p-4 ${index === 0 ? 'border-primary/20' : 'border-muted opacity-75'}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">
              {index === 0 ? 'Latest Evidence' : `Previous Evidence ${index + 1}`}
            </h4>
            {index === 0 && <Badge variant="default" className="text-xs">Latest</Badge>}
            {index > 0 && <Badge variant="secondary" className="text-xs">Previous</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {evidence.evidence_type || evidence.kind || 'Evidence'}
            </Badge>
            {evidence.verification_status && (
              <Badge 
                variant={evidence.verification_status === 'pending' ? 'secondary' : 
                       evidence.verification_status === 'approved' || evidence.verification_status === 'verified' ? 'default' : 'destructive'}
              >
                {evidence.verification_status}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Basic Info - removing redundant URL display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {evidence.file_urls && evidence.file_urls.length > 0 && (
              <div>
                <strong>Files:</strong>
                <div className="mt-1 space-y-1">
                  {evidence.file_urls.map((fileUrl: string, fileIndex: number) => (
                    <div key={fileIndex} className="flex items-center gap-2">
                      <Download className="w-3 h-3" />
                      <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        File {fileIndex + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(evidence.submitted_at || evidence.created_at) && (
              <div>
                <strong>Submitted:</strong> {new Date(evidence.submitted_at || evidence.created_at).toLocaleString()}
              </div>
            )}
            
            {evidence.verified_at && (
              <div>
                <strong>Verified:</strong> {new Date(evidence.verified_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Evidence Data */}
          {evidence.evidence_data && (
            <div>
              <strong>Evidence Details:</strong>
              <div className="mt-2 p-3 bg-muted/30 rounded">
                {renderEvidenceData(evidence.evidence_data)}
              </div>
            </div>
          )}
          
          {/* Parsed Data */}
          {evidence.parsed_json && (
            <div>
              <strong>Additional Information:</strong>
              <div className="mt-2 p-3 bg-muted/30 rounded">
                {renderNestedData(evidence.parsed_json)}
              </div>
            </div>
          )}

          {/* Email Metadata */}
          {evidence.email_meta && (
            <div>
              <strong>Email Details:</strong>
              <div className="mt-2 p-3 bg-muted/30 rounded">
                {renderNestedData(evidence.email_meta)}
              </div>
            </div>
          )}
          
          {/* Verification Notes - Enhanced styling for rejected items */}
          {evidence.verification_notes && (
            <div>
              <strong className={`${evidence.verification_status === 'rejected' ? 'text-destructive' : 'text-orange-700 dark:text-orange-300'}`}>
                {evidence.verification_status === 'rejected' ? 'Rejection Reason:' : 'Verification Notes:'}
              </strong>
              <div className={`mt-1 p-3 rounded text-sm ${
                evidence.verification_status === 'rejected' 
                  ? 'bg-destructive/10 border border-destructive/20 text-destructive-foreground' 
                  : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-muted-foreground'
              }`}>
                {evidence.verification_notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const VerifyAssignments = () => {
  const { user } = useAuth();
  const { isAdmin, isInstituteAdmin, isRecruiter, loading: roleLoading } = useRole();
  const { 
    managedInstitutes, 
    primaryInstitute, 
    isValidInstituteAdmin, 
    loading: instituteLoading
  } = useInstituteAdminManagement();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedAssignmentEvidence, setSelectedAssignmentEvidence] = useState<any[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [scoreAwarded, setScoreAwarded] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('');
  const [verifiedCurrentPage, setVerifiedCurrentPage] = useState(1);
  
  const VERIFIED_PAGE_SIZE = 10;

  // Optimized data fetching function for pending assignments
  const fetchPendingAssignments = async () => {
    if (!user) throw new Error('User not authenticated');
    
    // Fetch all assignment types in parallel with optimized queries
    const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = await Promise.all([
      supabase
        .from('career_task_assignments')
        .select(`
          id, user_id, template_id, status, submitted_at, verified_at, points_earned, score_awarded,
          career_task_templates!career_task_assignments_template_id_fkey (
            id, title, module, points_reward, category
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false }),

      supabase
        .from('linkedin_user_tasks')
        .select(`*, linkedin_tasks (id, code, title, description, points_base)`)
        .eq('status', 'SUBMITTED')
        .order('updated_at', { ascending: false }),

      supabase
        .from('job_hunting_assignments')
        .select(`*, template:job_hunting_task_templates (id, title, description, points_reward, category)`)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false }),

      supabase
        .from('github_user_tasks')
        .select(`*, github_tasks (id, code, title, description, points_base)`)
        .eq('status', 'SUBMITTED')
        .order('updated_at', { ascending: false })
    ]);

    // Collect all unique user IDs and fetch profiles in one query
    const allUserIds = new Set([
      ...(careerResult.data || []).map(a => a.user_id),
      ...(linkedInResult.data || []).map(a => a.user_id),
      ...(jobHuntingResult.data || []).map(a => a.user_id),
      ...(gitHubResult.data || []).map(a => a.user_id)
    ]);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', Array.from(allUserIds));

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Batch fetch evidence for better performance
    const evidencePromises = [
      careerResult.data?.length ? supabase
        .from('career_task_evidence')
        .select('assignment_id, *')
        .in('assignment_id', careerResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      linkedInResult.data?.length ? supabase
        .from('linkedin_evidence')
        .select('user_task_id, *')
        .in('user_task_id', linkedInResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      jobHuntingResult.data?.length ? supabase
        .from('job_hunting_evidence')
        .select('assignment_id, *')
        .in('assignment_id', jobHuntingResult.data.map(a => a.id)) : Promise.resolve({ data: [] }),
      gitHubResult.data?.length ? supabase
        .from('github_evidence')
        .select('user_task_id, *')
        .in('user_task_id', gitHubResult.data.map(a => a.id)) : Promise.resolve({ data: [] })
    ];

    const [careerEvidence, linkedInEvidence, jobHuntingEvidence, gitHubEvidence] = await Promise.all(evidencePromises);

    // Create evidence maps for efficient lookup
    const evidenceMaps = {
      career: new Map(),
      linkedin: new Map(),
      jobHunting: new Map(),
      github: new Map()
    };

    (careerEvidence.data || []).forEach(e => {
      if (!evidenceMaps.career.has(e.assignment_id)) evidenceMaps.career.set(e.assignment_id, []);
      evidenceMaps.career.get(e.assignment_id).push(e);
    });

    (linkedInEvidence.data || []).forEach(e => {
      if (!evidenceMaps.linkedin.has(e.user_task_id)) evidenceMaps.linkedin.set(e.user_task_id, []);
      evidenceMaps.linkedin.get(e.user_task_id).push(e);
    });

    (jobHuntingEvidence.data || []).forEach(e => {
      if (!evidenceMaps.jobHunting.has(e.assignment_id)) evidenceMaps.jobHunting.set(e.assignment_id, []);
      evidenceMaps.jobHunting.get(e.assignment_id).push(e);
    });

    (gitHubEvidence.data || []).forEach(e => {
      if (!evidenceMaps.github.has(e.user_task_id)) evidenceMaps.github.set(e.user_task_id, []);
      evidenceMaps.github.get(e.user_task_id).push(e);
    });

    // Process all assignments efficiently
    const allAssignments: Assignment[] = [];

    // Process each type with evidence mapping
    (careerResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.career.get(assignment.id) || []
      });
    });

    (linkedInResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        career_task_templates: {
          title: assignment.linkedin_tasks?.title || 'LinkedIn Task',
          module: 'LINKEDIN',
          points_reward: assignment.linkedin_tasks?.points_base || 0,
          category: 'LinkedIn Growth Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.linkedin.get(assignment.id) || [],
        _isLinkedInAssignment: true
      });
    });

    (jobHuntingResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.jobHunting.get(assignment.id) || [],
        career_task_templates: {
          title: assignment.template?.title || 'Job Hunting Task',
          module: 'JOB_HUNTING',
          points_reward: assignment.template?.points_reward || 0,
          category: 'Job Hunting Activities'
        }
      });
    });

    (gitHubResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        career_task_templates: {
          title: assignment.github_tasks?.title || 'GitHub Task',
          module: 'GITHUB',
          points_reward: assignment.github_tasks?.points_base || 0,
          category: 'GitHub Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: evidenceMaps.github.get(assignment.id) || []
      });
    });

    return allAssignments;
  };

  // Optimized data fetching function for verified assignments
  const fetchVerifiedAssignments = async (page: number) => {
    if (!user) throw new Error('User not authenticated');
    
    const offset = (page - 1) * VERIFIED_PAGE_SIZE;

    // Get total count and paginated data in parallel
    const [countResults, dataResults] = await Promise.all([
      // Count queries
      Promise.all([
        supabase.from('career_task_assignments').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('linkedin_user_tasks').select('id', { count: 'exact', head: true }).eq('status', 'VERIFIED'),
        supabase.from('job_hunting_assignments').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('github_user_tasks').select('id', { count: 'exact', head: true }).eq('status', 'VERIFIED')
      ]),
      
      // Data queries with proper ordering and range
      Promise.all([
        supabase
          .from('career_task_assignments')
          .select(`
            id, user_id, template_id, status, submitted_at, verified_at, points_earned, score_awarded,
            career_task_templates!career_task_assignments_template_id_fkey (
              id, title, module, points_reward, category
            )
          `)
          .eq('status', 'verified')
          .order('verified_at', { ascending: false })
          .range(0, Math.max(100, VERIFIED_PAGE_SIZE * 3)),

        supabase
          .from('linkedin_user_tasks')
          .select(`*, linkedin_tasks (id, code, title, description, points_base)`)
          .eq('status', 'VERIFIED')
          .order('updated_at', { ascending: false })
          .range(0, Math.max(100, VERIFIED_PAGE_SIZE * 3)),

        supabase
          .from('job_hunting_assignments')
          .select(`*, template:job_hunting_task_templates (id, title, description, points_reward, category)`)
          .eq('status', 'verified')
          .order('verified_at', { ascending: false })
          .range(0, Math.max(100, VERIFIED_PAGE_SIZE * 3)),

        supabase
          .from('github_user_tasks')
          .select(`*, github_tasks (id, code, title, description, points_base)`)
          .eq('status', 'VERIFIED')
          .order('updated_at', { ascending: false })
          .range(0, Math.max(100, VERIFIED_PAGE_SIZE * 3))
      ])
    ]);

    const [careerCount, linkedInCount, jobHuntingCount, gitHubCount] = countResults;
    const [careerResult, linkedInResult, jobHuntingResult, gitHubResult] = dataResults;

    const totalCount = (careerCount.count || 0) + (linkedInCount.count || 0) + 
                      (jobHuntingCount.count || 0) + (gitHubCount.count || 0);

    // Use the same optimized processing
    const allUserIds = new Set([
      ...(careerResult.data || []).map(a => a.user_id),
      ...(linkedInResult.data || []).map(a => a.user_id),
      ...(jobHuntingResult.data || []).map(a => a.user_id),
      ...(gitHubResult.data || []).map(a => a.user_id)
    ]);

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, profile_image_url')
      .in('user_id', Array.from(allUserIds));

    const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

    // Process all assignments efficiently (simpler since we don't need evidence for list view)
    const allAssignments: Assignment[] = [];

    (careerResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: []
      });
    });

    (linkedInResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        verified_at: assignment.updated_at,
        points_earned: assignment.score_awarded,
        score_awarded: assignment.score_awarded,
        career_task_templates: {
          title: assignment.linkedin_tasks?.title || 'LinkedIn Task',
          module: 'LINKEDIN',
          points_reward: assignment.linkedin_tasks?.points_base || 0,
          category: 'LinkedIn Growth Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: [],
        _isLinkedInAssignment: true
      });
    });

    (jobHuntingResult.data || []).forEach(assignment => {
      allAssignments.push({
        ...assignment,
        profiles: profilesMap.get(assignment.user_id),
        evidence: [],
        career_task_templates: {
          title: assignment.template?.title || 'Job Hunting Task',
          module: 'JOB_HUNTING',
          points_reward: assignment.template?.points_reward || 0,
          category: 'Job Hunting Activities'
        }
      });
    });

    (gitHubResult.data || []).forEach(assignment => {
      allAssignments.push({
        id: assignment.id,
        user_id: assignment.user_id,
        template_id: assignment.task_id,
        status: assignment.status.toLowerCase(),
        submitted_at: assignment.updated_at,
        verified_at: assignment.updated_at,
        points_earned: assignment.score_awarded,
        score_awarded: assignment.score_awarded,
        career_task_templates: {
          title: assignment.github_tasks?.title || 'GitHub Task',
          module: 'GITHUB',
          points_reward: assignment.github_tasks?.points_base || 0,
          category: 'GitHub Activities'
        },
        profiles: profilesMap.get(assignment.user_id),
        evidence: []
      });
    });

    // Sort by verified date and paginate
    const sortedAssignments = allAssignments.sort((a, b) => {
      const dateA = new Date(a.verified_at || a.submitted_at || '').getTime();
      const dateB = new Date(b.verified_at || b.submitted_at || '').getTime();
      return dateB - dateA;
    });

    const paginatedResults = sortedAssignments.slice(offset, offset + VERIFIED_PAGE_SIZE);

    return { assignments: paginatedResults, totalCount };
  };

  // Check if user can access this page
  const canAccess = user && !roleLoading && (isAdmin || isInstituteAdmin || isRecruiter) && 
                   (!isInstituteAdmin || !instituteLoading);

  // Query for pending assignments with React Query for better performance
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['assignments', 'pending', user?.id],
    queryFn: fetchPendingAssignments,
    enabled: canAccess,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // Query for verified assignments with pagination
  const { data: verifiedData, isLoading: verifiedLoading } = useQuery({
    queryKey: ['assignments', 'verified', verifiedCurrentPage, user?.id],
    queryFn: () => fetchVerifiedAssignments(verifiedCurrentPage),
    enabled: canAccess,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Apply filters with memoization
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    if (moduleFilter !== 'all') {
      filtered = filtered.filter(assignment => 
        assignment.career_task_templates?.module?.toLowerCase() === moduleFilter.toLowerCase()
      );
    }

    if (userFilter.trim()) {
      filtered = filtered.filter(assignment => 
        assignment.profiles?.full_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
        assignment.profiles?.username?.toLowerCase().includes(userFilter.toLowerCase())
      );
    }

    return filtered;
  }, [assignments, moduleFilter, userFilter]);

  const pendingAssignments = useMemo(() => 
    filteredAssignments.filter(assignment => assignment.status === 'submitted'),
    [filteredAssignments]
  );

  const verifiedAssignments = verifiedData?.assignments || [];
  const verifiedTotalCount = verifiedData?.totalCount || 0;
  const totalVerifiedPages = Math.ceil(verifiedTotalCount / VERIFIED_PAGE_SIZE);

  // Handle page changes for verified assignments
  const handleVerifiedPageChange = (page: number) => {
    setVerifiedCurrentPage(page);
  };

  // Mutation for verifying assignments
  const verifyAssignmentMutation = useMutation({
    mutationFn: async ({ action, assignment }: { action: 'approve' | 'reject', assignment: Assignment }) => {
      const response = await supabase.functions.invoke('verify-institute-assignments', {
        body: {
          assignmentId: assignment.id,
          assignmentType: assignment._isLinkedInAssignment ? 'linkedin' : 
                         assignment.career_task_templates?.module === 'GITHUB' ? 'github' :
                         assignment.career_task_templates?.module === 'JOB_HUNTING' ? 'job_hunting' : 'career',
          action,
          scoreAwarded: parseInt(scoreAwarded) || 0,
          verificationNotes
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Assignment processed successfully');
      setIsReviewDialogOpen(false);
      setSelectedAssignment(null);
      setVerificationNotes('');
      setScoreAwarded('');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (error) => {
      console.error('Error verifying assignment:', error);
      toast.error('Failed to process assignment');
    }
  });

  const fetchAssignmentEvidence = async (assignment: Assignment) => {
    setEvidenceLoading(true);
    try {
      let evidenceData: any[] = [];

      if (assignment._isLinkedInAssignment) {
        // Fetch LinkedIn evidence
        const { data } = await supabase
          .from('linkedin_evidence')
          .select('*')
          .eq('user_task_id', assignment.id);
        evidenceData = data || [];
      } else if (assignment.career_task_templates?.module === 'GITHUB') {
        // Fetch GitHub evidence
        const { data } = await supabase
          .from('github_evidence')
          .select('*')
          .eq('user_task_id', assignment.id);
        evidenceData = data || [];
      } else if (assignment.career_task_templates?.module === 'JOB_HUNTING') {
        // Fetch Job Hunting evidence
        const { data } = await supabase
          .from('job_hunting_evidence')
          .select('*')
          .eq('assignment_id', assignment.id);
        evidenceData = data || [];
      } else {
        // Fetch Career task evidence
        const { data } = await supabase
          .from('career_task_evidence')
          .select('*')
          .eq('assignment_id', assignment.id);
        evidenceData = data || [];
      }

      // Sort evidence by created_at in descending order (latest first)
      evidenceData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSelectedAssignmentEvidence(evidenceData);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      toast.error('Failed to load evidence');
      setSelectedAssignmentEvidence([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleReview = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsReviewDialogOpen(true);
    setVerificationNotes('');
    setScoreAwarded(assignment.career_task_templates?.points_reward?.toString() || '');
    
    // Fetch detailed evidence
    await fetchAssignmentEvidence(assignment);
  };

  const handleVerifyAssignment = async (action: 'approve' | 'reject') => {
    if (!selectedAssignment) return;
    verifyAssignmentMutation.mutate({ action, assignment: selectedAssignment });
  };

  // Render functions
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'verified':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModuleBadge = (module?: string) => {
    if (!module) return null;
    
    const colors = {
      'RESUME': 'bg-blue-100 text-blue-800',
      'LINKEDIN': 'bg-green-100 text-green-800',
      'GITHUB': 'bg-purple-100 text-purple-800',
      'JOB_HUNTING': 'bg-orange-100 text-orange-800',
      'DIGITAL_PROFILE': 'bg-pink-100 text-pink-800'
    };
    
    return (
      <Badge variant="secondary" className={colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {module.replace('_', ' ')}
      </Badge>
    );
  };

  const renderAssignmentCard = (assignment: Assignment) => (
    <Card key={assignment.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{assignment.career_task_templates?.title}</CardTitle>
          <div className="flex items-center gap-2">
            {getModuleBadge(assignment.career_task_templates?.module)}
            {getStatusBadge(assignment.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{assignment.profiles?.full_name || 'Unknown User'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(assignment.submitted_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{assignment.career_task_templates?.points_reward || 0} points</span>
            </div>
          </div>
          
          {assignment.evidence && assignment.evidence.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Evidence: </span>
              <span className="text-muted-foreground">{assignment.evidence.length} item(s) submitted</span>
            </div>
          )}
          
          {assignment.status === 'submitted' && (
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => handleReview(assignment)}
                size="sm"
                variant="outline"
              >
                Review Assignment
              </Button>
            </div>
          )}
          
          {(assignment.status === 'verified' || assignment.status === 'rejected') && (
            <div className="text-sm text-muted-foreground">
              <div>Verified: {assignment.verified_at ? new Date(assignment.verified_at).toLocaleDateString() : 'N/A'}</div>
              {assignment.score_awarded && <div>Score: {assignment.score_awarded} points</div>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Loading and error states
  if (roleLoading || instituteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isInstituteAdmin && !isRecruiter)) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">
            You need admin, institute admin, or recruiter permissions to access assignment verification.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isInstituteAdmin && !isValidInstituteAdmin) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Institute Access Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be assigned to an institute to access assignment verification.
          </p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Assignments</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading assignments. Please try again.
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['assignments'] })} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Verify Assignments</h1>
          {isInstituteAdmin && primaryInstitute && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Managing: <strong>{primaryInstitute.name}</strong></span>
            </div>
          )}
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="moduleFilter">Filter by Module</Label>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="resume">Resume</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="job_hunting">Job Hunting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="userFilter">Filter by User</Label>
          <Input
            id="userFilter"
            placeholder="Enter username or full name..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Assignments ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified Assignments ({verifiedTotalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pending Assignments</h3>
              <p className="text-muted-foreground">
                All assignments have been processed or there are no assignments to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map(renderAssignmentCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {verifiedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : verifiedAssignments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Verified Assignments</h3>
              <p className="text-muted-foreground">
                No assignments have been verified yet.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {verifiedAssignments.map(renderAssignmentCard)}
              </div>
              
              {totalVerifiedPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handleVerifiedPageChange(verifiedCurrentPage - 1)}
                        className={verifiedCurrentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {[...Array(Math.min(5, totalVerifiedPages))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handleVerifiedPageChange(page)}
                            isActive={page === verifiedCurrentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handleVerifiedPageChange(verifiedCurrentPage + 1)}
                        className={verifiedCurrentPage >= totalVerifiedPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Assignment</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div><strong>Title:</strong> {selectedAssignment.career_task_templates?.title}</div>
                <div><strong>Student:</strong> {selectedAssignment.profiles?.full_name}</div>
                <div><strong>Module:</strong> {selectedAssignment.career_task_templates?.module}</div>
                <div><strong>Points:</strong> {selectedAssignment.career_task_templates?.points_reward}</div>
                <div><strong>Submitted:</strong> {selectedAssignment.submitted_at ? new Date(selectedAssignment.submitted_at).toLocaleString() : 'N/A'}</div>
                <div><strong>Status:</strong> {selectedAssignment.status}</div>
              </div>

              {/* Evidence Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Submitted Evidence</h3>
                  {evidenceLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </div>
                
                {evidenceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : selectedAssignmentEvidence.length > 0 ? (
                  <div className="space-y-4">
                    {selectedAssignmentEvidence.map((evidence, index) => (
                      <EvidenceCard key={evidence.id || index} evidence={evidence} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No evidence submitted for this assignment</p>
                  </div>
                )}
              </div>

              {/* Review Actions */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="score">Score to Award</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max={selectedAssignment.career_task_templates?.points_reward}
                    value={scoreAwarded}
                    onChange={(e) => setScoreAwarded(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any feedback..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleVerifyAssignment('approve')}
                    disabled={verifyAssignmentMutation.isPending}
                    className="flex-1"
                  >
                    {verifyAssignmentMutation.isPending ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleVerifyAssignment('reject')}
                    disabled={verifyAssignmentMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {verifyAssignmentMutation.isPending ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifyAssignments;