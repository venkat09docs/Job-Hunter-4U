export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_point_settings: {
        Row: {
          activity_id: string
          activity_name: string
          activity_type: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points: number
          updated_at: string
        }
        Insert: {
          activity_id: string
          activity_name: string
          activity_type: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Update: {
          activity_id?: string
          activity_name?: string
          activity_type?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_user_id: string
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          referral_ids: string[]
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_user_id: string
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referral_ids: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          referral_ids?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "affiliate_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_user_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          payment_id: string | null
          referred_user_id: string
          status: string
          subscription_amount: number
          updated_at: string
        }
        Insert: {
          affiliate_user_id: string
          commission_amount: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_user_id: string
          status?: string
          subscription_amount: number
          updated_at?: string
        }
        Update: {
          affiliate_user_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          referred_user_id?: string
          status?: string
          subscription_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_user_id_fkey"
            columns: ["affiliate_user_id"]
            isOneToOne: false
            referencedRelation: "affiliate_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_users: {
        Row: {
          affiliate_code: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_eligible: boolean
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_affiliate_users_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
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
      ai_tool_categories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          category_id: string | null
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
          category_id?: string | null
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
          category_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "ai_tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ai_tool_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_score_history: {
        Row: {
          analysis_result: Json
          ats_score: number
          created_at: string
          id: string
          job_description: string
          resume_name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json
          ats_score: number
          created_at?: string
          id?: string
          job_description: string
          resume_name: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json
          ats_score?: number
          created_at?: string
          id?: string
          job_description?: string
          resume_name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      batches: {
        Row: {
          code: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          institute_id: string
          is_active: boolean
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id: string
          is_active?: boolean
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institute_id?: string
          is_active?: boolean
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
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
      career_task_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          due_date: string
          id: string
          period: string | null
          points_earned: number | null
          score_awarded: number | null
          status: string
          submitted_at: string | null
          template_id: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          week_start_date: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          due_date: string
          id?: string
          period?: string | null
          points_earned?: number | null
          score_awarded?: number | null
          status?: string
          submitted_at?: string | null
          template_id: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          week_start_date: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          due_date?: string
          id?: string
          period?: string | null
          points_earned?: number | null
          score_awarded?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_task_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "career_task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_career_task_assignments_template_id"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "career_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      career_task_evidence: {
        Row: {
          assignment_id: string
          created_at: string
          email_meta: Json | null
          evidence_data: Json
          evidence_type: string
          file_urls: string[] | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"] | null
          parsed_json: Json | null
          submitted_at: string
          updated_at: string
          url: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          email_meta?: Json | null
          evidence_data: Json
          evidence_type: string
          file_urls?: string[] | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"] | null
          parsed_json?: Json | null
          submitted_at?: string
          updated_at?: string
          url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          email_meta?: Json | null
          evidence_data?: Json
          evidence_type?: string
          file_urls?: string[] | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"] | null
          parsed_json?: Json | null
          submitted_at?: string
          updated_at?: string
          url?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_task_evidence_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "career_task_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_career_task_evidence_assignment_id"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "career_task_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      career_task_templates: {
        Row: {
          bonus_rules: Json | null
          cadence: string | null
          category: string
          code: string | null
          created_at: string
          description: string
          difficulty: string
          display_order: number | null
          estimated_duration: number
          evidence_types: string[]
          id: string
          instructions: Json
          is_active: boolean
          module: Database["public"]["Enums"]["module_code"] | null
          points_reward: number
          sub_category_id: string | null
          title: string
          updated_at: string
          verification_criteria: Json
        }
        Insert: {
          bonus_rules?: Json | null
          cadence?: string | null
          category: string
          code?: string | null
          created_at?: string
          description: string
          difficulty: string
          display_order?: number | null
          estimated_duration: number
          evidence_types: string[]
          id?: string
          instructions: Json
          is_active?: boolean
          module?: Database["public"]["Enums"]["module_code"] | null
          points_reward?: number
          sub_category_id?: string | null
          title: string
          updated_at?: string
          verification_criteria: Json
        }
        Update: {
          bonus_rules?: Json | null
          cadence?: string | null
          category?: string
          code?: string | null
          created_at?: string
          description?: string
          difficulty?: string
          display_order?: number | null
          estimated_duration?: number
          evidence_types?: string[]
          id?: string
          instructions?: Json
          is_active?: boolean
          module?: Database["public"]["Enums"]["module_code"] | null
          points_reward?: number
          sub_category_id?: string | null
          title?: string
          updated_at?: string
          verification_criteria?: Json
        }
        Relationships: [
          {
            foreignKeyName: "career_task_templates_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      career_weekly_schedules: {
        Row: {
          created_at: string
          id: string
          points_earned: number
          schedule_generated_at: string
          tasks_completed: number
          total_points_possible: number
          total_tasks_assigned: number
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_earned?: number
          schedule_generated_at?: string
          tasks_completed?: number
          total_points_possible?: number
          total_tasks_assigned?: number
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          points_earned?: number
          schedule_generated_at?: string
          tasks_completed?: number
          total_points_possible?: number
          total_tasks_assigned?: number
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      daily_job_hunting_sessions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          session_date: string
          session_type: string
          tasks_completed: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date: string
          session_type: string
          tasks_completed?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: string
          tasks_completed?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_progress_snapshots: {
        Row: {
          created_at: string
          github_progress: number
          id: string
          job_applications_count: number
          linkedin_progress: number
          network_progress: number
          published_blogs_count: number
          resume_progress: number
          snapshot_date: string
          total_ai_queries: number
          total_job_searches: number
          total_resume_opens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          github_progress?: number
          id?: string
          job_applications_count?: number
          linkedin_progress?: number
          network_progress?: number
          published_blogs_count?: number
          resume_progress?: number
          snapshot_date: string
          total_ai_queries?: number
          total_job_searches?: number
          total_resume_opens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          github_progress?: number
          id?: string
          job_applications_count?: number
          linkedin_progress?: number
          network_progress?: number
          published_blogs_count?: number
          resume_progress?: number
          snapshot_date?: string
          total_ai_queries?: number
          total_job_searches?: number
          total_resume_opens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_click_permissions: {
        Row: {
          created_at: string
          feature_description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_active: boolean
          requires_premium: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_active?: boolean
          requires_premium?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_active?: boolean
          requires_premium?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      github_badges: {
        Row: {
          code: string
          created_at: string | null
          criteria: Json
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string | null
          criteria: Json
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string | null
          criteria?: Json
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      github_daily_flow_sessions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          session_date: string
          tasks: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          session_date?: string
          tasks?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          session_date?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_evidence: {
        Row: {
          created_at: string | null
          file_key: string | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          parsed_json: Json | null
          url: string | null
          user_task_id: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_key?: string | null
          id?: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          parsed_json?: Json | null
          url?: string | null
          user_task_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_key?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          parsed_json?: Json | null
          url?: string | null
          user_task_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_evidence_user_task_id_fkey"
            columns: ["user_task_id"]
            isOneToOne: false
            referencedRelation: "github_user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      github_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          created_at: string | null
          default_branch: string | null
          full_name: string
          html_url: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_branch?: string | null
          full_name: string
          html_url: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_branch?: string | null
          full_name?: string
          html_url?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      github_scores: {
        Row: {
          breakdown: Json | null
          created_at: string | null
          id: string
          period: string
          points_total: number
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string | null
          id?: string
          period: string
          points_total?: number
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          created_at?: string | null
          id?: string
          period?: string
          points_total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      github_signals: {
        Row: {
          actor: string | null
          created_at: string | null
          happened_at: string
          id: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link: string | null
          raw_meta: Json | null
          repo_id: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string | null
          happened_at: string
          id?: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          repo_id?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string | null
          happened_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          repo_id?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_signals_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      github_snapshots: {
        Row: {
          created_at: string | null
          has_pages: boolean | null
          id: string
          last_release_at: string | null
          last_workflow_pass: string | null
          readme_updated_at: string | null
          repo_id: string | null
          stars: number | null
          topics: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_pages?: boolean | null
          id?: string
          last_release_at?: string | null
          last_workflow_pass?: string | null
          readme_updated_at?: string | null
          repo_id?: string | null
          stars?: number | null
          topics?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_pages?: boolean | null
          id?: string
          last_release_at?: string | null
          last_workflow_pass?: string | null
          readme_updated_at?: string | null
          repo_id?: string | null
          stars?: number | null
          topics?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_snapshots_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      github_task_reenable_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          user_task_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_task_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_task_reenable_requests_user_task_id_fkey"
            columns: ["user_task_id"]
            isOneToOne: false
            referencedRelation: "github_user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      github_tasks: {
        Row: {
          active: boolean | null
          bonus_rules: Json | null
          cadence: string | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          evidence_types: Database["public"]["Enums"]["evidence_type"][]
          id: string
          points_base: number
          scope: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bonus_rules?: Json | null
          cadence?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evidence_types: Database["public"]["Enums"]["evidence_type"][]
          id?: string
          points_base?: number
          scope: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bonus_rules?: Json | null
          cadence?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evidence_types?: Database["public"]["Enums"]["evidence_type"][]
          id?: string
          points_base?: number
          scope?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      github_user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "github_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      github_user_tasks: {
        Row: {
          admin_extended: boolean | null
          created_at: string | null
          due_at: string | null
          extended_at: string | null
          extended_by: string | null
          extension_reason: string | null
          id: string
          period: string | null
          repo_id: string | null
          score_awarded: number | null
          status: Database["public"]["Enums"]["verify_status"] | null
          task_id: string | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          admin_extended?: boolean | null
          created_at?: string | null
          due_at?: string | null
          extended_at?: string | null
          extended_by?: string | null
          extension_reason?: string | null
          id?: string
          period?: string | null
          repo_id?: string | null
          score_awarded?: number | null
          status?: Database["public"]["Enums"]["verify_status"] | null
          task_id?: string | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          admin_extended?: boolean | null
          created_at?: string | null
          due_at?: string | null
          extended_at?: string | null
          extended_by?: string | null
          extension_reason?: string | null
          id?: string
          period?: string | null
          repo_id?: string | null
          score_awarded?: number | null
          status?: Database["public"]["Enums"]["verify_status"] | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_user_tasks_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "github_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "github_user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      institute_admin_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          institute_id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          institute_id: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          institute_id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institute_admin_assignments_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      institutes: {
        Row: {
          address: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          current_student_count: number | null
          description: string | null
          id: string
          is_active: boolean
          max_students: number | null
          name: string
          subscription_active: boolean | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          current_student_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number | null
          name: string
          subscription_active?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          current_student_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_students?: number | null
          name?: string
          subscription_active?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_application_activities: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          notes: string | null
          task_id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          notes?: string | null
          task_id: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      job_hunting_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          due_date: string
          id: string
          points_earned: number | null
          score_awarded: number | null
          status: string
          submitted_at: string | null
          template_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
          week_start_date: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          due_date: string
          id?: string
          points_earned?: number | null
          score_awarded?: number | null
          status?: string
          submitted_at?: string | null
          template_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
          week_start_date: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          due_date?: string
          id?: string
          points_earned?: number | null
          score_awarded?: number | null
          status?: string
          submitted_at?: string | null
          template_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_hunting_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "job_hunting_task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hunting_evidence: {
        Row: {
          assignment_id: string
          created_at: string
          evidence_data: Json
          evidence_type: string
          file_urls: string[] | null
          id: string
          submitted_at: string
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          evidence_data: Json
          evidence_type: string
          file_urls?: string[] | null
          id?: string
          submitted_at?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          evidence_data?: Json
          evidence_type?: string
          file_urls?: string[] | null
          id?: string
          submitted_at?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_hunting_evidence_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "job_hunting_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hunting_pipeline: {
        Row: {
          application_date: string | null
          company_name: string
          created_at: string
          id: string
          interview_dates: Json | null
          job_title: string
          job_tracker_id: string | null
          job_url: string | null
          notes: Json | null
          offer_details: Json | null
          pipeline_stage: string
          points_earned: number | null
          priority: string
          rejection_reason: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string | null
          company_name: string
          created_at?: string
          id?: string
          interview_dates?: Json | null
          job_title: string
          job_tracker_id?: string | null
          job_url?: string | null
          notes?: Json | null
          offer_details?: Json | null
          pipeline_stage?: string
          points_earned?: number | null
          priority?: string
          rejection_reason?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string | null
          company_name?: string
          created_at?: string
          id?: string
          interview_dates?: Json | null
          job_title?: string
          job_tracker_id?: string | null
          job_url?: string | null
          notes?: Json | null
          offer_details?: Json | null
          pipeline_stage?: string
          points_earned?: number | null
          priority?: string
          rejection_reason?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_hunting_pipeline_job_tracker_id_fkey"
            columns: ["job_tracker_id"]
            isOneToOne: false
            referencedRelation: "job_tracker"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hunting_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          streak_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_hunting_task_templates: {
        Row: {
          bonus_rules: Json | null
          cadence: string
          category: string
          created_at: string
          description: string
          difficulty: string
          display_order: number | null
          estimated_duration: number
          evidence_types: string[]
          id: string
          instructions: Json
          is_active: boolean
          points_reward: number
          title: string
          updated_at: string
          verification_criteria: Json
        }
        Insert: {
          bonus_rules?: Json | null
          cadence?: string
          category: string
          created_at?: string
          description: string
          difficulty?: string
          display_order?: number | null
          estimated_duration?: number
          evidence_types?: string[]
          id?: string
          instructions?: Json
          is_active?: boolean
          points_reward?: number
          title: string
          updated_at?: string
          verification_criteria?: Json
        }
        Update: {
          bonus_rules?: Json | null
          cadence?: string
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          display_order?: number | null
          estimated_duration?: number
          evidence_types?: string[]
          id?: string
          instructions?: Json
          is_active?: boolean
          points_reward?: number
          title?: string
          updated_at?: string
          verification_criteria?: Json
        }
        Relationships: []
      }
      job_hunting_weekly_schedules: {
        Row: {
          created_at: string
          id: string
          points_earned: number
          schedule_generated_at: string
          tasks_completed: number
          total_points_possible: number
          total_tasks_assigned: number
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_earned?: number
          schedule_generated_at?: string
          tasks_completed?: number
          total_points_possible?: number
          total_tasks_assigned?: number
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          id?: string
          points_earned?: number
          schedule_generated_at?: string
          tasks_completed?: number
          total_points_possible?: number
          total_tasks_assigned?: number
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      job_results: {
        Row: {
          created_at: string
          employer_name: string
          id: string
          job_apply_link: string | null
          job_description: string | null
          job_employment_type: string | null
          job_id: string
          job_location: string | null
          job_max_salary: number | null
          job_min_salary: number | null
          job_posted_at: string | null
          job_salary_period: string | null
          job_title: string
          search_query: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employer_name: string
          id?: string
          job_apply_link?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_id: string
          job_location?: string | null
          job_max_salary?: number | null
          job_min_salary?: number | null
          job_posted_at?: string | null
          job_salary_period?: string | null
          job_title: string
          search_query: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employer_name?: string
          id?: string
          job_apply_link?: string | null
          job_description?: string | null
          job_employment_type?: string | null
          job_id?: string
          job_location?: string | null
          job_max_salary?: number | null
          job_min_salary?: number | null
          job_posted_at?: string | null
          job_salary_period?: string | null
          job_title?: string
          search_query?: Json
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
      job_tracker: {
        Row: {
          application_date: string
          assignment_details: Json | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string
          id: string
          is_archived: boolean
          job_title: string
          job_url: string | null
          location: string | null
          next_follow_up: string | null
          notes: string | null
          salary_range: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string
          assignment_details?: Json | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          job_title: string
          job_url?: string | null
          location?: string | null
          next_follow_up?: string | null
          notes?: string | null
          salary_range?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string
          assignment_details?: Json | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          job_title?: string
          job_url?: string | null
          location?: string | null
          next_follow_up?: string | null
          notes?: string | null
          salary_range?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          application_deadline: string | null
          benefits: string | null
          company: string
          created_at: string
          description: string
          experience_level: string | null
          id: string
          is_active: boolean
          job_type: string | null
          job_url: string | null
          location: string | null
          posted_by: string
          requirements: string
          salary_max: number | null
          salary_min: number | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string | null
          company: string
          created_at?: string
          description: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          posted_by: string
          requirements: string
          salary_max?: number | null
          salary_min?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          benefits?: string | null
          company?: string
          created_at?: string
          description?: string
          experience_level?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          job_url?: string | null
          location?: string | null
          posted_by?: string
          requirements?: string
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base_categories: {
        Row: {
          category_type: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base_items: {
        Row: {
          category_id: string
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          id: string
          instructor: string | null
          is_published: boolean
          last_updated_by: string | null
          read_time: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          instructor?: string | null
          is_published?: boolean
          last_updated_by?: string | null
          read_time?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          id?: string
          instructor?: string | null
          is_published?: boolean
          last_updated_by?: string | null
          read_time?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_rankings: {
        Row: {
          calculated_at: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          rank_position: number
          total_points: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          period_end: string
          period_start: string
          period_type: string
          rank_position: number
          total_points?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          rank_position?: number
          total_points?: number
          user_id?: string
        }
        Relationships: []
      }
      learning_goals: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          notes: string | null
          priority: string
          progress: number
          resources: Json | null
          skill_name: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          resources?: Json | null
          skill_name: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          resources?: Json | null
          skill_name?: string
          start_date?: string
          status?: string
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
      linkedin_badges: {
        Row: {
          code: string
          created_at: string | null
          criteria: Json
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string | null
          criteria: Json
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string | null
          criteria?: Json
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      linkedin_evidence: {
        Row: {
          created_at: string | null
          email_meta: Json | null
          evidence_data: Json | null
          file_key: string | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          parsed_json: Json | null
          url: string | null
          user_task_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_meta?: Json | null
          evidence_data?: Json | null
          file_key?: string | null
          id?: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          parsed_json?: Json | null
          url?: string | null
          user_task_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_meta?: Json | null
          evidence_data?: Json | null
          file_key?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          parsed_json?: Json | null
          url?: string | null
          user_task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_evidence_user_task_id_fkey"
            columns: ["user_task_id"]
            isOneToOne: false
            referencedRelation: "linkedin_user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_network_completions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_network_metrics: {
        Row: {
          activity_id: string
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          activity_id: string
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          activity_id?: string
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      linkedin_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkedin_scores: {
        Row: {
          breakdown: Json | null
          created_at: string | null
          id: string
          period: string
          points_total: number
          user_id: string | null
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string | null
          id?: string
          period: string
          points_total?: number
          user_id?: string | null
        }
        Update: {
          breakdown?: Json | null
          created_at?: string | null
          id?: string
          period?: string
          points_total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "linkedin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_signals: {
        Row: {
          actor: string | null
          created_at: string | null
          happened_at: string
          id: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link: string | null
          raw_meta: Json | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          actor?: string | null
          created_at?: string | null
          happened_at: string
          id?: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          actor?: string | null
          created_at?: string | null
          happened_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "linkedin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_task_renable_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          user_task_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_task_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_task_renable_requests_user_task_id_fkey"
            columns: ["user_task_id"]
            isOneToOne: false
            referencedRelation: "linkedin_user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_tasks: {
        Row: {
          active: boolean | null
          bonus_rules: Json | null
          cadence: string | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          evidence_types: Database["public"]["Enums"]["evidence_type"][]
          id: string
          points_base: number
          title: string
        }
        Insert: {
          active?: boolean | null
          bonus_rules?: Json | null
          cadence?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evidence_types: Database["public"]["Enums"]["evidence_type"][]
          id?: string
          points_base?: number
          title: string
        }
        Update: {
          active?: boolean | null
          bonus_rules?: Json | null
          cadence?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          evidence_types?: Database["public"]["Enums"]["evidence_type"][]
          id?: string
          points_base?: number
          title?: string
        }
        Relationships: []
      }
      linkedin_user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "linkedin_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "linkedin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_user_tasks: {
        Row: {
          admin_extended: boolean | null
          created_at: string | null
          due_at: string | null
          extended_at: string | null
          extended_by: string | null
          extension_reason: string | null
          id: string
          period: string
          score_awarded: number | null
          status: Database["public"]["Enums"]["verify_status"] | null
          task_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
        }
        Insert: {
          admin_extended?: boolean | null
          created_at?: string | null
          due_at?: string | null
          extended_at?: string | null
          extended_by?: string | null
          extension_reason?: string | null
          id?: string
          period: string
          score_awarded?: number | null
          status?: Database["public"]["Enums"]["verify_status"] | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
        }
        Update: {
          admin_extended?: boolean | null
          created_at?: string | null
          due_at?: string | null
          extended_at?: string | null
          extended_by?: string | null
          extension_reason?: string | null
          id?: string
          period?: string
          score_awarded?: number | null
          status?: Database["public"]["Enums"]["verify_status"] | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "linkedin_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linkedin_user_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "linkedin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_users: {
        Row: {
          auth_uid: string
          auto_forward_address: string | null
          created_at: string | null
          email: string | null
          id: string
          linkedin_urn: string | null
          name: string | null
        }
        Insert: {
          auth_uid: string
          auto_forward_address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_urn?: string | null
          name?: string | null
        }
        Update: {
          auth_uid?: string
          auto_forward_address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          linkedin_urn?: string | null
          name?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          app_enabled: boolean | null
          category: string
          created_at: string
          email_enabled: boolean | null
          email_frequency: string | null
          id: string
          is_enabled: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_enabled?: boolean | null
          category: string
          created_at?: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          is_enabled?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_enabled?: boolean | null
          category?: string
          created_at?: string
          email_enabled?: boolean | null
          email_frequency?: string | null
          id?: string
          is_enabled?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          priority: string | null
          related_id: string | null
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string | null
          related_id?: string | null
          scheduled_for?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string | null
          related_id?: string | null
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          payment_id: string
          performed_by_role: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          payment_id: string
          performed_by_role: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          payment_id?: string
          performed_by_role?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          plan_duration: string | null
          plan_name: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          plan_duration?: string | null
          plan_name: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          plan_duration?: string | null
          plan_name?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          plan_duration: string
          plan_name: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          plan_duration: string
          plan_name: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          plan_duration?: string
          plan_name?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          affiliate_user_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          processed_at: string | null
          rejection_reason: string | null
          requested_amount: number
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_user_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          rejection_reason?: string | null
          requested_amount?: number
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_user_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          processed_at?: string | null
          rejection_reason?: string | null
          requested_amount?: number
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payout_settings: {
        Row: {
          account_details: string
          account_holder_name: string
          affiliate_user_id: string
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          is_verified: boolean
          payment_method: string
          updated_at: string
        }
        Insert: {
          account_details: string
          account_holder_name: string
          affiliate_user_id: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_verified?: boolean
          payment_method: string
          updated_at?: string
        }
        Update: {
          account_details?: string
          account_holder_name?: string
          affiliate_user_id?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_verified?: boolean
          payment_method?: string
          updated_at?: string
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
      premium_features: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_premium: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_premium?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_premium?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profile_badges: {
        Row: {
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          is_active: boolean
          points_required: number
          tier: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          criteria?: Json
          description: string
          icon: string
          id?: string
          is_active?: boolean
          points_required?: number
          tier: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          points_required?: number
          tier?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          progress_data: Json | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          progress_data?: Json | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          progress_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "profile_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio_link_url: string | null
          created_at: string
          digital_profile_url: string | null
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          industry: string | null
          leetcode_url: string | null
          linkedin_url: string | null
          profile_image_url: string | null
          subscription_active: boolean | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          total_ai_queries: number | null
          total_job_searches: number | null
          total_resume_opens: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          bio_link_url?: string | null
          created_at?: string
          digital_profile_url?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          subscription_active?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          total_ai_queries?: number | null
          total_job_searches?: number | null
          total_resume_opens?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          bio_link_url?: string | null
          created_at?: string
          digital_profile_url?: string | null
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          industry?: string | null
          leetcode_url?: string | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          subscription_active?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
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
      resume_checks: {
        Row: {
          created_at: string | null
          evidence_id: string | null
          has_email: boolean | null
          has_links: boolean | null
          has_phone: boolean | null
          id: string
          keyword_match_ratio: number | null
          last_checked_at: string | null
          pages: number | null
          user_id: string
          words: number | null
        }
        Insert: {
          created_at?: string | null
          evidence_id?: string | null
          has_email?: boolean | null
          has_links?: boolean | null
          has_phone?: boolean | null
          id?: string
          keyword_match_ratio?: number | null
          last_checked_at?: string | null
          pages?: number | null
          user_id: string
          words?: number | null
        }
        Update: {
          created_at?: string | null
          evidence_id?: string | null
          has_email?: boolean | null
          has_links?: boolean | null
          has_phone?: boolean | null
          id?: string
          keyword_match_ratio?: number | null
          last_checked_at?: string | null
          pages?: number | null
          user_id?: string
          words?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_checks_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "career_task_evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_data: {
        Row: {
          certifications_awards: Json | null
          created_at: string
          education: Json | null
          experience: Json | null
          id: string
          personal_details: Json | null
          professional_summary: string | null
          skills_interests: Json | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certifications_awards?: Json | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          id?: string
          personal_details?: Json | null
          professional_summary?: string | null
          skills_interests?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certifications_awards?: Json | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          id?: string
          personal_details?: Json | null
          professional_summary?: string | null
          skills_interests?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_role: Database["public"]["Enums"]["app_role"]
          old_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_role: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_role?: Database["public"]["Enums"]["app_role"]
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_cover_letters: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_job_searches: {
        Row: {
          created_at: string
          id: string
          name: string
          search_criteria: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          search_criteria: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          search_criteria?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_readme_files: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_resumes: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          pdf_url: string | null
          resume_data: Json
          title: string
          updated_at: string
          user_id: string
          word_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          pdf_url?: string | null
          resume_data: Json
          title: string
          updated_at?: string
          user_id: string
          word_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          pdf_url?: string | null
          resume_data?: Json
          title?: string
          updated_at?: string
          user_id?: string
          word_url?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          actor: string | null
          created_at: string | null
          happened_at: string
          id: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link: string | null
          raw_meta: Json | null
          subject: string | null
          user_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string | null
          happened_at: string
          id?: string
          kind: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          subject?: string | null
          user_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string | null
          happened_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["signal_kind"]
          link?: string | null
          raw_meta?: Json | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sub_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_category: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_category: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          discount_per_member: number | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          is_popular: boolean | null
          member_limit: number | null
          name: string
          original_price_paisa: number | null
          plan_type: string | null
          price_paisa: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_per_member?: number | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          member_limit?: number | null
          name: string
          original_price_paisa?: number | null
          plan_type?: string | null
          price_paisa?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_per_member?: number | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          member_limit?: number | null
          name?: string
          original_price_paisa?: number | null
          plan_type?: string | null
          price_paisa?: number | null
          updated_at?: string
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
      user_activity_points: {
        Row: {
          activity_date: string
          activity_id: string
          activity_type: string
          created_at: string
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_id: string
          activity_type: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_id?: string
          activity_type?: string
          created_at?: string
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: []
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
      user_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assignment_type: string
          batch_id: string | null
          id: string
          institute_id: string | null
          is_active: boolean
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assignment_type: string
          batch_id?: string | null
          id?: string
          institute_id?: string | null
          is_active?: boolean
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assignment_type?: string
          batch_id?: string | null
          id?: string
          institute_id?: string | null
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assignments_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "linkedin_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inputs: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string
          value?: string
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
      webhook_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          status: string | null
          user_data: Json
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string | null
          user_data: Json
          user_id: string
          webhook_url?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string | null
          user_data?: Json
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role: {
        Args: {
          action_type?: string
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      award_profile_badges_for_user: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      create_follow_up_reminder: {
        Args: {
          p_company_name: string
          p_follow_up_date: string
          p_job_id: string
          p_job_title: string
          p_user_id: string
        }
        Returns: string
      }
      create_payment_record: {
        Args: {
          p_amount: number
          p_plan_duration: string
          p_plan_name: string
          p_razorpay_order_id: string
          p_user_id: string
        }
        Returns: string
      }
      generate_affiliate_code: {
        Args: { user_email: string }
        Returns: string
      }
      get_all_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          full_name: string
          industry: string
          profile_image_url: string
          subscription_active: boolean
          subscription_end_date: string
          subscription_plan: string
          subscription_start_date: string
          total_ai_queries: number
          total_job_searches: number
          total_resume_opens: number
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_badge_leaders_github_repository: {
        Args: Record<PropertyKey, never>
        Returns: {
          badge_type: string
          commits_count: number
          full_name: string
          profile_image_url: string
          repos_count: number
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_badge_leaders_job_apply: {
        Args: Record<PropertyKey, never>
        Returns: {
          badge_type: string
          full_name: string
          job_count: number
          profile_image_url: string
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_badge_leaders_linkedin_growth: {
        Args: Record<PropertyKey, never>
        Returns: {
          badge_type: string
          full_name: string
          network_count: number
          profile_image_url: string
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_badge_leaders_profile_build: {
        Args: Record<PropertyKey, never>
        Returns: {
          awarded_at: string
          badge_type: string
          full_name: string
          profile_image_url: string
          total_points: number
          user_id: string
          username: string
        }[]
      }
      get_institute_directory: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_institute_student_count: {
        Args: { institute_id_param: string }
        Returns: number
      }
      get_institutes_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          code: string
          contact_email: string
          contact_phone: string
          created_at: string
          created_by: string
          current_student_count: number
          description: string
          id: string
          is_active: boolean
          max_students: number
          name: string
          subscription_active: boolean
          subscription_end_date: string
          subscription_plan: string
          subscription_start_date: string
          updated_at: string
        }[]
      }
      get_managed_institutes: {
        Args: { user_id_param: string }
        Returns: {
          institute_code: string
          institute_id: string
          institute_name: string
        }[]
      }
      get_safe_admin_profiles: {
        Args: { user_ids?: string[] }
        Returns: {
          created_at: string
          full_name: string
          industry: string
          profile_image_url: string
          subscription_active: boolean
          subscription_end_date: string
          subscription_plan: string
          subscription_start_date: string
          total_ai_queries: number
          total_job_searches: number
          total_resume_opens: number
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      get_safe_institute_data_for_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_safe_institute_info: {
        Args: { institute_id_param: string }
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_safe_institute_info_for_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_safe_institute_profiles: {
        Args: { institute_id_param: string }
        Returns: {
          created_at: string
          full_name: string
          industry: string
          profile_image_url: string
          subscription_active: boolean
          subscription_plan: string
          total_ai_queries: number
          total_job_searches: number
          total_resume_opens: number
          user_id: string
          username: string
        }[]
      }
      get_safe_leaderboard_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          full_name: string
          profile_image_url: string
          user_id: string
          username: string
        }[]
      }
      get_safe_public_profile: {
        Args: { profile_slug: string }
        Returns: {
          bio: string
          blog_url: string
          created_at: string
          custom_links: Json
          full_name: string
          github_url: string
          linkedin_url: string
          profile_image_url: string
          slug: string
        }[]
      }
      get_safe_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          bio: string
          blog_url: string
          created_at: string
          custom_links: Json
          full_name: string
          github_url: string
          linkedin_url: string
          profile_image_url: string
          slug: string
        }[]
      }
      get_subscription_days_remaining: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_accessible_institutes: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_user_accessible_institutes_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          created_at: string
          current_student_count: number
          description: string
          id: string
          is_active: boolean
          max_students: number
          name: string
          subscription_active: boolean
          subscription_end_date: string
          subscription_plan: string
          subscription_start_date: string
          updated_at: string
        }[]
      }
      get_user_assignments: {
        Args: { user_id_param: string }
        Returns: {
          assignment_type: string
          batch_code: string
          batch_id: string
          batch_name: string
          institute_code: string
          institute_id: string
          institute_name: string
        }[]
      }
      get_user_payment_summary: {
        Args: { target_user_id?: string }
        Returns: {
          active_subscriptions: number
          last_payment_date: string
          payment_count: number
          total_amount_spent: number
        }[]
      }
      has_full_institute_access: {
        Args: { institute_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_analytics: {
        Args: { action_type: string }
        Returns: undefined
      }
      initialize_notification_preferences: {
        Args: {
          target_user_id: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      is_institute_admin_for: {
        Args: { institute_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_portfolio_owner: {
        Args: { portfolio_user_id: string }
        Returns: boolean
      }
      is_reasonable_profile_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_record_id?: string
          p_table_name?: string
        }
        Returns: undefined
      }
      log_suspicious_activity: {
        Args: {
          activity_type: string
          description: string
          user_id_param?: string
        }
        Returns: undefined
      }
      process_affiliate_referral: {
        Args: {
          p_payment_amount: number
          p_payment_id?: string
          p_referred_user_id: string
        }
        Returns: Json
      }
      queue_missed_webhooks: {
        Args: Record<PropertyKey, never>
        Returns: {
          message: string
          queued_count: number
        }[]
      }
      refresh_github_weekly_assignments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      refresh_student_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_learning_goal_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_profile_completion_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_weekly_progress_summaries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      should_send_notification: {
        Args: { notif_type: string; target_user_id: string }
        Returns: boolean
      }
      sync_missing_user_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          message: string
          synced_count: number
        }[]
      }
      sync_student_data_now: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upsert_resume_data: {
        Args: {
          p_certifications_awards: Json
          p_education: Json
          p_experience: Json
          p_personal_details: Json
          p_professional_summary: string
          p_skills_interests: Json
          p_status: string
          p_user_id: string
        }
        Returns: string
      }
      validate_user_metadata: {
        Args: { metadata: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "institute_admin" | "recruiter"
      evidence_kind: "URL" | "EMAIL" | "SCREENSHOT" | "DATA_EXPORT"
      evidence_type:
        | "URL_REQUIRED"
        | "EMAIL_PROOF_OK"
        | "SCREENSHOT_OK"
        | "DATA_EXPORT_OK"
      module_code: "RESUME" | "LINKEDIN" | "GITHUB"
      signal_kind:
        | "COMMENTED"
        | "REACTED"
        | "MENTIONED"
        | "INVITE_ACCEPTED"
        | "POST_PUBLISHED"
        | "PROFILE_UPDATED"
      verify_status:
        | "NOT_STARTED"
        | "STARTED"
        | "SUBMITTED"
        | "PARTIALLY_VERIFIED"
        | "VERIFIED"
        | "REJECTED"
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
      app_role: ["admin", "user", "institute_admin", "recruiter"],
      evidence_kind: ["URL", "EMAIL", "SCREENSHOT", "DATA_EXPORT"],
      evidence_type: [
        "URL_REQUIRED",
        "EMAIL_PROOF_OK",
        "SCREENSHOT_OK",
        "DATA_EXPORT_OK",
      ],
      module_code: ["RESUME", "LINKEDIN", "GITHUB"],
      signal_kind: [
        "COMMENTED",
        "REACTED",
        "MENTIONED",
        "INVITE_ACCEPTED",
        "POST_PUBLISHED",
        "PROFILE_UPDATED",
      ],
      verify_status: [
        "NOT_STARTED",
        "STARTED",
        "SUBMITTED",
        "PARTIALLY_VERIFIED",
        "VERIFIED",
        "REJECTED",
      ],
    },
  },
} as const
