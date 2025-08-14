import { Badge } from '@/components/ui/badge';
import { useInstituteName } from '@/hooks/useInstituteName';
import { useRole } from '@/hooks/useRole';
import { Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const InstituteSubscriptionBadge = () => {
  const { isInstituteAdmin } = useRole();
  const { instituteSubscription, loading } = useInstituteName();

  if (!isInstituteAdmin || loading || !instituteSubscription) {
    return null;
  }

  const isActive = instituteSubscription.active;
  const plan = instituteSubscription.plan;
  const maxStudents = instituteSubscription.maxStudents;
  const currentStudentCount = instituteSubscription.currentStudentCount;

  const getStatusColor = () => {
    if (!isActive) return 'destructive';
    if (!maxStudents) return 'secondary';
    
    const usagePercentage = (currentStudentCount / maxStudents) * 100;
    if (usagePercentage >= 100) return 'destructive';
    if (usagePercentage >= 90) return 'warning';
    if (usagePercentage >= 80) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactive';
    if (!plan) return 'No Plan';
    return plan;
  };

  const getStudentCountText = () => {
    if (!maxStudents) return null;
    const remaining = maxStudents - currentStudentCount;
    
    if (remaining <= 0) {
      return 'Limit Reached - Contact Rise n Shine';
    }
    if (remaining <= 5) {
      return `Only ${remaining} slots left`;
    }
    return `${currentStudentCount}/${maxStudents} students`;
  };

  const isLimitReached = maxStudents && currentStudentCount >= maxStudents;

  return (
    <div className="flex items-center gap-2 text-sm bg-secondary/10 px-3 py-2 rounded-lg border border-border">
      <div className="flex items-center gap-1">
        {isActive ? (
          isLimitReached ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <Badge variant={getStatusColor() as any} className="font-medium">
          {getStatusText()}
        </Badge>
      </div>
      {maxStudents && isActive && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className={`text-xs font-medium ${isLimitReached ? 'text-destructive' : currentStudentCount >= maxStudents * 0.8 ? 'text-orange-600' : 'text-foreground'}`}>
            {getStudentCountText()}
          </span>
        </div>
      )}
      {isLimitReached && (
        <div className="text-xs text-destructive font-medium">
          Contact Rise n Shine to upgrade
        </div>
      )}
    </div>
  );
};