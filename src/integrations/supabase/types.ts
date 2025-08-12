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
            referencedRelation: "institute_directory"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "institute_directory"
            referencedColumns: ["id"]
          },
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
          description: string | null
          id: string
          is_active: boolean
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
          description?: string | null
          id?: string
          is_active?: boolean
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
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          subscription_active?: boolean | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          updated_at?: string
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
            referencedRelation: "institute_directory"
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
      institute_directory: {
        Row: {
          code: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          code?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          code?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      safe_public_profiles: {
        Row: {
          bio: string | null
          blog_url: string | null
          created_at: string | null
          custom_links: Json | null
          full_name: string | null
          github_url: string | null
          linkedin_url: string | null
          profile_image_url: string | null
          slug: string | null
        }
        Insert: {
          bio?: string | null
          blog_url?: string | null
          created_at?: string | null
          custom_links?: Json | null
          full_name?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          slug?: string | null
        }
        Update: {
          bio?: string | null
          blog_url?: string | null
          created_at?: string | null
          custom_links?: Json | null
          full_name?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          profile_image_url?: string | null
          slug?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_managed_institutes: {
        Args: { user_id_param: string }
        Returns: {
          institute_id: string
          institute_name: string
          institute_code: string
        }[]
      }
      get_safe_public_profile: {
        Args: { profile_slug: string }
        Returns: {
          slug: string
          full_name: string
          bio: string
          profile_image_url: string
          github_url: string
          linkedin_url: string
          blog_url: string
          custom_links: Json
          created_at: string
        }[]
      }
      get_subscription_days_remaining: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_assignments: {
        Args: { user_id_param: string }
        Returns: {
          institute_id: string
          institute_name: string
          institute_code: string
          batch_id: string
          batch_name: string
          batch_code: string
          assignment_type: string
        }[]
      }
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
      is_institute_admin_for: {
        Args: { user_id_param: string; institute_id_param: string }
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
          p_user_id: string
          p_personal_details: Json
          p_experience: Json
          p_education: Json
          p_skills_interests: Json
          p_certifications_awards: Json
          p_professional_summary: string
          p_status: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "institute_admin"
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
      app_role: ["admin", "user", "institute_admin"],
    },
  },
} as const
