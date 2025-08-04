import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubscriptionUpgrade } from '@/components/SubscriptionUpgrade';

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

interface DraggableKanbanCardProps {
  job: JobEntry;
  statusOptions: string[];
  statusLabels: Record<string, string>;
  hasActiveSubscription: boolean;
  showWarning?: boolean;
  onStatusChange: (jobId: string, newStatus: string) => void;
  onCardClick: (job: JobEntry) => void;
}

export const DraggableKanbanCard: React.FC<DraggableKanbanCardProps> = ({
  job,
  statusOptions,
  statusLabels,
  hasActiveSubscription,
  showWarning = false,
  onStatusChange,
  onCardClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: job.id,
    data: {
      job,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('Card clicked:', job.company_name, 'isDragging:', isDragging);
    console.log('Target element:', e.target);
    console.log('Closest combobox:', (e.target as HTMLElement).closest('[role="combobox"]'));
    
    // Only trigger card click if not clicking on the select dropdown and not dragging
    if (!(e.target as HTMLElement).closest('[role="combobox"]') && !isDragging) {
      console.log('Opening job details for:', job.company_name);
      onCardClick(job);
    } else {
      console.log('Click blocked - either on dropdown or dragging');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      <Card 
        className={`relative p-1 sm:p-2 md:p-3 hover:shadow-md transition-all duration-200 cursor-pointer bg-background ${
          showWarning ? 'ring-2 ring-orange-300' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="space-y-1">
          {/* Drag handle - only this area triggers drag */}
          <div 
            {...listeners} 
            {...attributes} 
            className="absolute top-1 right-1 w-4 h-4 cursor-grab active:cursor-grabbing opacity-20 hover:opacity-60 transition-opacity"
            style={{ zIndex: 10 }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <circle cx="2" cy="2" r="1"/>
                <circle cx="6" cy="2" r="1"/>
                <circle cx="2" cy="6" r="1"/>
                <circle cx="6" cy="6" r="1"/>
              </svg>
            </div>
          </div>
          
          {/* Content area - clickable but not draggable */}
          <div className="space-y-1">
            <div className="font-medium text-[10px] sm:text-xs md:text-sm line-clamp-2">{job.company_name}</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground line-clamp-2">{job.job_title}</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">
              {new Date(job.application_date).toLocaleDateString()}
            </div>
            {job.location && (
              <div className="text-[9px] sm:text-xs text-muted-foreground truncate">📍 {job.location}</div>
            )}
            {job.salary_range && (
              <div className="text-[9px] sm:text-xs text-muted-foreground truncate">💰 {job.salary_range}</div>
            )}
          </div>
          
          {/* Status selector - not draggable */}
          <div className="flex flex-col gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
            {hasActiveSubscription ? (
              <Select
                value={job.status} 
                onValueChange={(newStatus) => onStatusChange(job.id, newStatus)}
              >
                <SelectTrigger className="h-5 sm:h-6 md:h-7 text-[9px] sm:text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(statusOption => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {statusLabels[statusOption as keyof typeof statusLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <SubscriptionUpgrade featureName="job tracker">
                <Select value={job.status}>
                  <SelectTrigger className="h-5 sm:h-6 md:h-7 text-[9px] sm:text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                </Select>
              </SubscriptionUpgrade>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};