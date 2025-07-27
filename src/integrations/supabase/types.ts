export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_chat_logs: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          timestamp: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          timestamp?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          timestamp?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          created_at: string
          created_by: string
          credit_points: number
          embed_code: string
          id: string
          image_url: string | null
          is_active: boolean
          tool_description: string | null
          tool_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          credit_points?: number
          embed_code: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          tool_description?: string | null
          tool_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          credit_points?: number
          embed_code?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          tool_description?: string | null
          tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_searches: {
        Row: {
          created_at: string
          id: string
          results: Json | null
          results_count: number
          search_query: Json
          searched_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json | null
          results_count?: number
          search_query: Json
          searched_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json | null
          results_count?: number
          search_query?: Json
          searched_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_automations: {
        Row: {
          activated_at: string
          created_at: string
          frequency: string
          id: string
          job_matches_count: number | null
          job_title: string
          keywords: string | null
          last_run_at: string | null
          location: string | null
          next_run_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          frequency: string
          id?: string
          job_matches_count?: number | null
          job_title: string
          keywords?: string | null
          last_run_at?: string | null
          location?: string | null
          next_run_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          frequency?: string
          id?: string
          job_matches_count?: number | null
          job_title?: string
          keywords?: string | null
          last_run_at?: string | null
          location?: string | null
          next_run_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          created_at: string
          education: Json | null
          email: string | null
          experience: Json | null
          full_name: string | null
          id: string
          location: string | null
          parsed_summary: string | null
          phone: string | null
          resume_url: string | null
          skills: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          location?: string | null
          parsed_summary?: string | null
          phone?: string | null
          resume_url?: string | null
          skills?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          id?: string
          location?: string | null
          parsed_summary?: string | null
          phone?: string | null
          resume_url?: string | null
          skills?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          profile_image_url: string | null
          tokens_remaining: number | null
          total_ai_queries: number | null
          total_job_searches: number | null
          total_resume_opens: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          profile_image_url?: string | null
          tokens_remaining?: number | null
          total_ai_queries?: number | null
          total_job_searches?: number | null
          total_resume_opens?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          profile_image_url?: string | null
          tokens_remaining?: number | null
          total_ai_queries?: number | null
          total_job_searches?: number | null
          total_resume_opens?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          bio: string | null
          blog_url: string | null
          created_at: string
          custom_links: Json | null
          full_name: string
          github_url: string | null
          id: string
          is_public: boolean | null
          linkedin_url: string | null
          profile_image_url: string | null
          resume_url: string | null
          slug: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          bio?: string | null
          blog_url?: string | null
          created_at?: string
          custom_links?: Json | null
          full_name: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          resume_url?: string | null
          slug: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          bio?: string | null
          blog_url?: string | null
          created_at?: string
          custom_links?: Json | null
          full_name?: string
          github_url?: string | null
          id?: string
          is_public?: boolean | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          resume_url?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      tool_chats: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title: string
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_chats_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_usage: {
        Row: {
          credits_used: number
          id: string
          tool_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          credits_used: number
          id?: string
          tool_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          credits_used?: number
          id?: string
          tool_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_usage_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          ai_queries: number | null
          created_at: string
          date: string
          id: string
          job_searches: number | null
          resume_opens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_queries?: number | null
          created_at?: string
          date?: string
          id?: string
          job_searches?: number | null
          resume_opens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_queries?: number | null
          created_at?: string
          date?: string
          id?: string
          job_searches?: number | null
          resume_opens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_user_analytics: {
        Args: { action_type: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
