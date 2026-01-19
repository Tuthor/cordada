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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      client_companies: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      client_requirements: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultant_profiles: {
        Row: {
          created_at: string
          expertise: string[] | null
          headline: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          linkedin_url: string | null
          maturity_level: string | null
          maturity_score: number | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          expertise?: string[] | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          linkedin_url?: string | null
          maturity_level?: string | null
          maturity_score?: number | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          expertise?: string[] | null
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          linkedin_url?: string | null
          maturity_level?: string | null
          maturity_score?: number | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      consultant_requirement_evidence: {
        Row: {
          consultant_id: string
          created_at: string
          evidence_file_name: string | null
          evidence_file_url: string | null
          id: string
          requirement_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          evidence_file_name?: string | null
          evidence_file_url?: string | null
          id?: string
          requirement_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          evidence_file_name?: string | null
          evidence_file_url?: string | null
          id?: string
          requirement_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_requirement_evidence_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "client_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_firms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          lesson_id: string | null
          progress_percent: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          lesson_id?: string | null
          progress_percent?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          lesson_id?: string | null
          progress_percent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          company: string | null
          created_at: string
          email: string
          expertise: string | null
          full_name: string
          id: string
          linkedin: string | null
          maturity_level: string | null
          motivation: string | null
          overall_score: number | null
          phone: string | null
          status: string | null
          years_experience: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          expertise?: string | null
          full_name: string
          id?: string
          linkedin?: string | null
          maturity_level?: string | null
          motivation?: string | null
          overall_score?: number | null
          phone?: string | null
          status?: string | null
          years_experience?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          expertise?: string | null
          full_name?: string
          id?: string
          linkedin?: string | null
          maturity_level?: string | null
          motivation?: string | null
          overall_score?: number | null
          phone?: string | null
          status?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      firm_members: {
        Row: {
          firm_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          firm_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          firm_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "consulting_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          payment_amount: number | null
          payment_status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "partner_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_courses: {
        Row: {
          course_type: Database["public"]["Enums"]["course_type"]
          created_at: string
          currency: string
          description: string | null
          duration_hours: number | null
          id: string
          is_published: boolean
          max_participants: number | null
          partner_id: string
          price: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          max_participants?: number | null
          partner_id: string
          price?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_type?: Database["public"]["Enums"]["course_type"]
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          max_participants?: number | null
          partner_id?: string
          price?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          project_id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          project_id: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          project_id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          client_id: string
          created_at: string
          description: string
          duration_weeks: number | null
          expertise_needed: string[] | null
          id: string
          requirements: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          client_id: string
          created_at?: string
          description: string
          duration_weeks?: number | null
          expertise_needed?: string[] | null
          id?: string
          requirements?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string
          created_at?: string
          description?: string
          duration_weeks?: number | null
          expertise_needed?: string[] | null
          id?: string
          requirements?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          attachment_url: string | null
          consultant_id: string
          cover_letter: string
          created_at: string
          deliverables: string | null
          id: string
          project_id: string
          proposed_budget: number | null
          proposed_duration_weeks: number | null
          scope: string | null
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          consultant_id: string
          cover_letter: string
          created_at?: string
          deliverables?: string | null
          id?: string
          project_id: string
          proposed_budget?: number | null
          proposed_duration_weeks?: number | null
          scope?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          consultant_id?: string
          cover_letter?: string
          created_at?: string
          deliverables?: string | null
          id?: string
          project_id?: string
          proposed_budget?: number | null
          proposed_duration_weeks?: number | null
          scope?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_safe_profile_data: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "client"
        | "consultant"
        | "consulting_firm"
        | "partner"
      course_type: "course" | "workshop"
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
      app_role: [
        "admin",
        "user",
        "client",
        "consultant",
        "consulting_firm",
        "partner",
      ],
      course_type: ["course", "workshop"],
    },
  },
} as const
