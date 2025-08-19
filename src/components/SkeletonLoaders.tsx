// Skeleton loaders for Job Hunter components

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Assignment card skeleton
export const AssignmentCardSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

// Pipeline column skeleton
export const PipelineColumnSkeleton: React.FC = () => (
  <div className="bg-muted/30 rounded-lg p-4 min-h-64">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-3">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24 mb-2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Weekly quota card skeleton
export const WeeklyQuotaSkeleton: React.FC = () => (
  <div className="p-4 border rounded-lg animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

// History item skeleton
export const HistoryItemSkeleton: React.FC = () => (
  <div className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div>
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-48 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  </div>
);

// Progress overview skeleton
export const ProgressOverviewSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Settings section skeleton
export const SettingsSectionSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Evidence upload skeleton
export const EvidenceUploadSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-4 w-32" />
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Skeleton className="h-12 w-12 rounded mx-auto mb-4" />
      <Skeleton className="h-4 w-48 mx-auto mb-2" />
      <Skeleton className="h-3 w-32 mx-auto" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

// Job pipeline skeleton (full board)
export const JobPipelineSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {['Leads', 'Applied', 'Interviewing', 'Offers', 'Closed'].map((stage) => (
      <PipelineColumnSkeleton key={stage} />
    ))}
  </div>
);

// Loading overlay skeleton
export const LoadingOverlaySkeleton: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    {children && <div className="opacity-50">{children}</div>}
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

// Batch skeleton loader for lists
export const BatchSkeleton: React.FC<{ 
  count: number;
  component: React.ComponentType;
  className?: string;
}> = ({ count, component: Component, className }) => (
  <div className={className}>
    {Array.from({ length: count }, (_, i) => (
      <Component key={i} />
    ))}
  </div>
);