import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  Edit, 
  Archive, 
  Trash2, 
  ExternalLink, 
  Calendar,
  MapPin,
  DollarSign,
  User,
  Mail,
  ArchiveRestore
} from 'lucide-react';
import { format } from 'date-fns';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  application_date: string;
  notes?: string;
  job_url?: string;
  salary_range?: string;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  next_follow_up?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface JobTrackerCardProps {
  job: JobEntry;
  onEdit: (job: JobEntry) => void;
  onArchive: (jobId: string, archive: boolean) => void;
  onDelete: (jobId: string) => void;
  statusColor: string;
  showArchived: boolean;
}

export const JobTrackerCard = ({ 
  job, 
  onEdit, 
  onArchive, 
  onDelete, 
  statusColor, 
  showArchived 
}: JobTrackerCardProps) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg leading-tight">{job.job_title}</CardTitle>
            <p className="text-sm font-medium text-muted-foreground">{job.company_name}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(job)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              
              {showArchived ? (
                <DropdownMenuItem onClick={() => onArchive(job.id, false)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onArchive(job.id, true)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the job entry
                      for {job.job_title} at {job.company_name}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(job.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge 
            variant="secondary" 
            className={`${statusColor} text-white border-0`}
          >
            {getStatusLabel(job.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          Applied: {formatDate(job.application_date)}
        </div>
        
        {job.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            {job.location}
          </div>
        )}
        
        {job.salary_range && (
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            {job.salary_range}
          </div>
        )}
        
        {job.contact_person && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            {job.contact_person}
          </div>
        )}
        
        {job.contact_email && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            <a 
              href={`mailto:${job.contact_email}`}
              className="hover:text-primary hover:underline"
            >
              {job.contact_email}
            </a>
          </div>
        )}
        
        {job.next_follow_up && (
          <div className="flex items-center text-sm text-amber-600">
            <Calendar className="mr-2 h-4 w-4" />
            Follow-up: {formatDate(job.next_follow_up)}
          </div>
        )}
        
        {job.notes && (
          <div className="text-sm text-muted-foreground">
            <p className="line-clamp-2">{job.notes}</p>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {job.job_url && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(job.job_url, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Job
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(job)}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};