// Optimistic updates utility for Job Hunter system

import { useState, useCallback } from 'react';
import React from 'react';
import { toast } from '@/hooks/use-toast';

export interface OptimisticState<T> {
  data: T;
  isLoading: boolean;
  pendingUpdates: Map<string, any>;
  error: Error | null;
}

export interface OptimisticUpdate<T> {
  id: string;
  optimisticUpdate: (current: T) => T;
  serverUpdate: () => Promise<T>;
  rollback: (current: T) => T;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing optimistic updates
 */
export function useOptimisticUpdates<T>(initialData: T) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isLoading: false,
    pendingUpdates: new Map(),
    error: null
  });

  const applyUpdate = useCallback(async (update: OptimisticUpdate<T>) => {
    // Apply optimistic update immediately
    setState(prev => ({
      ...prev,
      data: update.optimisticUpdate(prev.data),
      pendingUpdates: new Map(prev.pendingUpdates).set(update.id, update),
      error: null
    }));

    try {
      // Perform server update
      const result = await update.serverUpdate();
      
      // Remove from pending and apply final result
      setState(prev => {
        const newPending = new Map(prev.pendingUpdates);
        newPending.delete(update.id);
        
        return {
          ...prev,
          data: result,
          pendingUpdates: newPending,
          isLoading: prev.pendingUpdates.size === 1 ? false : prev.isLoading
        };
      });

      update.onSuccess?.(result);
      
    } catch (error) {
      // Rollback optimistic update
      setState(prev => {
        const newPending = new Map(prev.pendingUpdates);
        newPending.delete(update.id);
        
        return {
          ...prev,
          data: update.rollback(prev.data),
          pendingUpdates: newPending,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: prev.pendingUpdates.size === 1 ? false : prev.isLoading
        };
      });

      update.onError?.(error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Update Failed",
        description: "Changes have been reverted. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    hasPendingUpdates: state.pendingUpdates.size > 0,
    error: state.error,
    applyUpdate,
    setData,
    setLoading
  };
}

/**
 * Optimistic update generators for common operations
 */
export const optimisticUpdates = {
  // Update assignment status
  updateAssignmentStatus: (
    assignmentId: string, 
    newStatus: string,
    serverUpdate: () => Promise<any>
  ): OptimisticUpdate<any[]> => ({
    id: `assignment-${assignmentId}-${Date.now()}`,
    optimisticUpdate: (assignments) =>
      assignments.map(a => a.id === assignmentId ? { ...a, status: newStatus } : a),
    serverUpdate,
    rollback: (assignments) =>
      assignments.map(a => a.id === assignmentId ? { ...a, status: a.originalStatus || a.status } : a),
    onSuccess: () => toast({ title: "Status updated successfully" }),
    onError: () => toast({ title: "Failed to update status", variant: "destructive" })
  }),

  // Update pipeline stage
  updatePipelineStage: (
    jobId: string,
    newStage: string,
    serverUpdate: () => Promise<any>
  ): OptimisticUpdate<any[]> => ({
    id: `pipeline-${jobId}-${Date.now()}`,
    optimisticUpdate: (jobs) =>
      jobs.map(j => j.id === jobId ? { ...j, pipeline_stage: newStage } : j),
    serverUpdate,
    rollback: (jobs) =>
      jobs.map(j => j.id === jobId ? { ...j, pipeline_stage: j.originalStage || j.pipeline_stage } : j),
    onSuccess: () => toast({ title: "Pipeline updated successfully" }),
    onError: () => toast({ title: "Failed to update pipeline", variant: "destructive" })
  }),

  // Add new item
  addItem: <T extends { id: string }>(
    item: T,
    serverUpdate: () => Promise<T[]>
  ): OptimisticUpdate<T[]> => ({
    id: `add-${item.id}-${Date.now()}`,
    optimisticUpdate: (items) => [item, ...items],
    serverUpdate,
    rollback: (items) => items.filter(i => i.id !== item.id),
    onSuccess: () => toast({ title: "Item added successfully" }),
    onError: () => toast({ title: "Failed to add item", variant: "destructive" })
  }),

  // Delete item
  deleteItem: <T extends { id: string }>(
    itemId: string,
    serverUpdate: () => Promise<void>
  ): OptimisticUpdate<T[]> => ({
    id: `delete-${itemId}-${Date.now()}`,
    optimisticUpdate: (items) => items.filter(i => i.id !== itemId),
    serverUpdate: async () => {
      await serverUpdate();
      return [] as T[]; // Return empty array, actual data will come from re-fetch
    },
    rollback: (items) => {
      // This requires storing the deleted item somewhere for proper rollback
      // In practice, you'd need to store the item before deletion
      return items;
    },
    onSuccess: () => toast({ title: "Item deleted successfully" }),
    onError: () => toast({ title: "Failed to delete item", variant: "destructive" })
  }),

  // Submit evidence
  submitEvidence: (
    assignmentId: string,
    evidenceData: any,
    serverUpdate: () => Promise<any>
  ): OptimisticUpdate<any[]> => ({
    id: `evidence-${assignmentId}-${Date.now()}`,
    optimisticUpdate: (assignments) =>
      assignments.map(a => a.id === assignmentId ? { 
        ...a, 
        status: 'submitted',
        hasEvidence: true 
      } : a),
    serverUpdate,
    rollback: (assignments) =>
      assignments.map(a => a.id === assignmentId ? { 
        ...a, 
        status: a.originalStatus || 'assigned',
        hasEvidence: false 
      } : a),
    onSuccess: () => toast({ title: "Evidence submitted successfully" }),
    onError: () => toast({ title: "Failed to submit evidence", variant: "destructive" })
  })
};

/**
 * Higher-order component for optimistic updates
 */
export function withOptimisticUpdates<T>(
  component: React.ComponentType<T & { optimistic: ReturnType<typeof useOptimisticUpdates> }>
) {
  return function OptimisticWrapper(props: T & { initialData?: any }) {
    const optimistic = useOptimisticUpdates(props.initialData || []);
    
    return React.createElement(component, {
      ...props,
      optimistic
    });
  };
}