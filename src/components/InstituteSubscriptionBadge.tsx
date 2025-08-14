import { Badge } from '@/components/ui/badge';
import { useInstituteName } from '@/hooks/useInstituteName';
import { useRole } from '@/hooks/useRole';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';

export const InstituteSubscriptionBadge = () => {
  const { isInstituteAdmin } = useRole();
  const { instituteSubscription, loading } = useInstituteName();

  if (!isInstituteAdmin || loading || !instituteSubscription) {
    return null;
  }

  const isActive = instituteSubscription.active;
  const plan = instituteSubscription.plan;
  const endDate = instituteSubscription.endDate;

  const getStatusColor = () => {
    if (!isActive) return 'destructive';
    if (endDate) {
      const daysRemaining = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 7) return 'warning';
      if (daysRemaining <= 30) return 'secondary';
    }
    return 'default';
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactive';
    if (!plan) return 'No Plan';
    return plan;
  };

  const getEndDateText = () => {
    if (!endDate) return null;
    const daysRemaining = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) return 'Expired';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        {isActive ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <Badge variant={getStatusColor() as any}>
          {getStatusText()}
        </Badge>
      </div>
      {endDate && isActive && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          <span className="text-xs">{getEndDateText()}</span>
        </div>
      )}
    </div>
  );
};