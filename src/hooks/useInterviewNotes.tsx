import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface InterviewNote {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export const useInterviewNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["interview-notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("interview_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InterviewNote[];
    },
    enabled: !!user,
  });

  // Create note
  const createNote = useMutation({
    mutationFn: async (noteData: { title: string; content?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("interview_notes")
        .insert({
          user_id: user.id,
          title: noteData.title,
          content: noteData.content || "",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-notes", user?.id] });
      toast({
        title: "Success",
        description: "Note created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating note:", error);
    },
  });

  // Update note
  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("interview_notes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-notes", user?.id] });
      toast({
        title: "Success",
        description: "Note updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating note:", error);
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("interview_notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-notes", user?.id] });
      toast({
        title: "Success",
        description: "Note deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting note:", error);
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote: createNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    isCreating: createNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
};