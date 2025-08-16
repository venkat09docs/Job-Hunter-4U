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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      profiles: {
        Row: {
          bio_link_url: string | null
          created_at: string
          digital_profile_url: string | null
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
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
      get_managed_institutes: {
        Args: { user_id_param: string }
        Returns: {
          institute_code: string
          institute_id: string
          institute_name: string
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
    }
    Enums: {
      app_role: "admin" | "user" | "institute_admin" | "recruiter"
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
    },
  },
} as const
