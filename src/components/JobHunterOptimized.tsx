// Enhanced Job Hunter components with optimistic UI and skeleton loaders

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOptimisticUpdates, optimisticUpdates } from '@/utils/optimisticUpdates';
import { retryWithBackoff, RETRY_CONFIGS } from '@/utils/retryWithBackoff';
import { validateEvidenceFiles } from '@/utils/fileValidation';
import { AssignmentCardSkeleton, ProgressOverviewSkeleton, LoadingOverlaySkeleton } from './SkeletonLoaders';
import { useTranslation } from '@/i18n';
import { CheckCircle, Clock, AlertTriangle, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OptimizedAssignmentCardProps {
  assignment: any;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onEvidenceSubmit: (id: string, evidence: any) => Promise<void>;
}

export const OptimizedAssignmentCard: React.FC<OptimizedAssignmentCardProps> = ({
  assignment,
  onStatusUpdate,
  onEvidenceSubmit
}) => {
  const { t } = useTranslation();
  const optimistic = useOptimisticUpdates([assignment]);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  const handleStatusUpdate = async (newStatus: string) => {
    await optimistic.applyUpdate(
      optimisticUpdates.updateAssignmentStatus(
        assignment.id,
        newStatus,
        () => retryWithBackoff(() => onStatusUpdate(assignment.id, newStatus), RETRY_CONFIGS.ui)
      )
    );
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const { valid, invalid } = validateEvidenceFiles(files, 'document');
    
    if (invalid.length > 0) {
      invalid.forEach(({ file, error }) => {
        toast({
          title: t('fileValidation.typeNotAllowed'),
          description: `${file.name}: ${error}`,
          variant: "destructive"
        });
      });
    }
    
    setSelectedFiles(valid);
  };

  const handleEvidenceSubmit = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsSubmittingEvidence(true);
    
    try {
      await optimistic.applyUpdate(
        optimisticUpdates.submitEvidence(
          assignment.id,
          { files: selectedFiles },
          () => retryWithBackoff(
            () => onEvidenceSubmit(assignment.id, { files: selectedFiles }),
            RETRY_CONFIGS.upload
          )
        )
      );
      setSelectedFiles([]);
    } catch (error) {
      console.error('Evidence submission failed:', error);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'submitted': return 'secondary';
      default: return 'outline';
    }
  };

  const currentAssignment = optimistic.data[0] || assignment;

  return (
    <LoadingOverlaySkeleton>
      <Card className={`transition-all duration-200 ${optimistic.hasPendingUpdates ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{currentAssignment.job_hunting_task_templates?.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentAssignment.job_hunting_task_templates?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(currentAssignment.status)}
              <Badge variant={getStatusBadgeVariant(currentAssignment.status)}>
                {t(`status.${currentAssignment.status}`)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('evidence.file')}</span>
              <span className="font-medium">
                {currentAssignment.job_hunting_task_templates?.points_reward} {t('progress.totalPoints')}
              </span>
            </div>
            
            {currentAssignment.status === 'assigned' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-muted rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`file-${currentAssignment.id}`}
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                  />
                  <label 
                    htmlFor={`file-${currentAssignment.id}`}
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {t('actions.submitEvidence')}
                    </p>
                  </label>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Files:</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                        <span>{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      onClick={handleEvidenceSubmit}
                      disabled={isSubmittingEvidence}
                      className="w-full"
                    >
                      {isSubmittingEvidence ? 'Submitting...' : t('actions.submitEvidence')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={optimistic.hasPendingUpdates || currentAssignment.status !== 'assigned'}
            >
              Start Task
            </Button>
            
            <span className="text-xs text-muted-foreground">
              Due: {new Date(currentAssignment.due_date).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </LoadingOverlaySkeleton>
  );
};

interface OptimizedProgressOverviewProps {
  loading: boolean;
  weekProgress: any;
  totalPoints: number;
  currentStreak: number;
}

export const OptimizedProgressOverview: React.FC<OptimizedProgressOverviewProps> = ({
  loading,
  weekProgress,
  totalPoints,
  currentStreak
}) => {
  const { t, formatNumber } = useTranslation();

  if (loading) {
    return <ProgressOverviewSkeleton />;
  }

  const progressCards = [
    {
      title: t('progress.weekProgress'),
      value: `${weekProgress.completed}/${weekProgress.total}`,
      subtitle: `${Math.round((weekProgress.completed / weekProgress.total) * 100)}% complete`,
      icon: '🎯',
      color: 'blue'
    },
    {
      title: t('progress.totalPoints'),
      value: formatNumber(totalPoints),
      subtitle: `+${formatNumber(weekProgress.totalPoints)} this week`,
      icon: '🏆',
      color: 'yellow'
    },
    {
      title: t('progress.applicationStreak'),
      value: `${currentStreak} days`,
      subtitle: 'Keep it going!',
      icon: '📈',
      color: 'green'
    },
    {
      title: t('progress.currentWeek'),
      value: new Date().toLocaleDateString(),
      subtitle: 'Week of progress',
      icon: '📅',
      color: 'purple'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {progressCards.map((card, index) => (
        <Card key={index} className="hover-scale transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${card.color}-100 rounded-lg text-2xl`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </div>
            </div>
            {card.title === t('progress.weekProgress') && (
              <Progress 
                value={(weekProgress.completed / weekProgress.total) * 100} 
                className="mt-3 h-2"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};