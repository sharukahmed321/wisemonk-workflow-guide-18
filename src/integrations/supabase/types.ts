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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auth_audit_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          aadhaar_number: string | null
          address_line_1: string | null
          address_line_2: string | null
          age: number | null
          avatar_url: string | null
          birthday: string | null
          city: string | null
          created_at: string | null
          currency: string | null
          date_of_birth: string | null
          department: string
          email: string
          employee_id: string
          employment_type: string
          father_name: string | null
          first_name: string
          full_name: string | null
          gender: string | null
          id: string
          job_description: string | null
          job_title: string
          last_name: string
          organization_id: string | null
          phone: string | null
          pincode: string | null
          salary: number | null
          seniority: string | null
          start_date: string
          state: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          work_location: string | null
        }
        Insert: {
          aadhaar_number?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          age?: number | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          department: string
          email: string
          employee_id: string
          employment_type: string
          father_name?: string | null
          first_name: string
          full_name?: string | null
          gender?: string | null
          id?: string
          job_description?: string | null
          job_title: string
          last_name: string
          organization_id?: string | null
          phone?: string | null
          pincode?: string | null
          salary?: number | null
          seniority?: string | null
          start_date: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_location?: string | null
        }
        Update: {
          aadhaar_number?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          age?: number | null
          avatar_url?: string | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          currency?: string | null
          date_of_birth?: string | null
          department?: string
          email?: string
          employee_id?: string
          employment_type?: string
          father_name?: string | null
          first_name?: string
          full_name?: string | null
          gender?: string | null
          id?: string
          job_description?: string | null
          job_title?: string
          last_name?: string
          organization_id?: string | null
          phone?: string | null
          pincode?: string | null
          salary?: number | null
          seniority?: string | null
          start_date?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      msa_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_version: number | null
          file_name: string
          file_path: string
          file_size: number | null
          generation_method: string | null
          id: string
          is_signed: boolean | null
          metadata: Json | null
          mime_type: string | null
          organization_id: string
          signed_at: string | null
          signed_by: string | null
          signing_completed_at: string | null
          signing_sent_at: string | null
          updated_at: string | null
          user_id: string
          zoho_sign_document_id: string | null
          zoho_sign_error: string | null
          zoho_sign_request_id: string | null
          zoho_sign_status: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string
          document_version?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          generation_method?: string | null
          id?: string
          is_signed?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id: string
          signed_at?: string | null
          signed_by?: string | null
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          updated_at?: string | null
          user_id: string
          zoho_sign_document_id?: string | null
          zoho_sign_error?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_version?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          generation_method?: string | null
          id?: string
          is_signed?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id?: string
          signed_at?: string | null
          signed_by?: string | null
          signing_completed_at?: string | null
          signing_sent_at?: string | null
          updated_at?: string | null
          user_id?: string
          zoho_sign_document_id?: string | null
          zoho_sign_error?: string | null
          zoho_sign_request_id?: string | null
          zoho_sign_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msa_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_address: string | null
          business_city: string | null
          business_postal_code: string | null
          business_state: string | null
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          employee_count: Database["public"]["Enums"]["employee_count_range"]
          id: string
          industry: string | null
          is_active: boolean
          legal_name: string
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          business_address?: string | null
          business_city?: string | null
          business_postal_code?: string | null
          business_state?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_count: Database["public"]["Enums"]["employee_count_range"]
          id?: string
          industry?: string | null
          is_active?: boolean
          legal_name: string
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_address?: string | null
          business_city?: string | null
          business_postal_code?: string | null
          business_state?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          employee_count?: Database["public"]["Enums"]["employee_count_range"]
          id?: string
          industry?: string | null
          is_active?: boolean
          legal_name?: string
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_locked_reason: string | null
          account_locked_until: string | null
          address_completed: boolean | null
          address_completed_at: string | null
          address_status:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          avatar_url: string | null
          basic_info_completed: boolean | null
          basic_info_completed_at: string | null
          basic_info_status:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          company_info_completed: boolean | null
          company_info_completed_at: string | null
          company_info_status:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          created_at: string
          department: string | null
          email: string
          email_verified: boolean
          failed_login_attempts: number
          first_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          is_pre_registered: boolean | null
          job_title: string | null
          last_failed_login_at: string | null
          last_login_at: string | null
          last_name: string | null
          login_attempts_count: number | null
          msa_completed: boolean | null
          msa_completed_at: string | null
          msa_signed: boolean | null
          msa_signed_at: string | null
          msa_signed_by: string | null
          msa_status: Database["public"]["Enums"]["setup_step_status"] | null
          organization_id: string | null
          password_changed_at: string | null
          phone: string | null
          setup_completed: boolean | null
          setup_completed_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_locked_reason?: string | null
          account_locked_until?: string | null
          address_completed?: boolean | null
          address_completed_at?: string | null
          address_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          avatar_url?: string | null
          basic_info_completed?: boolean | null
          basic_info_completed_at?: string | null
          basic_info_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          company_info_completed?: boolean | null
          company_info_completed_at?: string | null
          company_info_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          created_at?: string
          department?: string | null
          email: string
          email_verified?: boolean
          failed_login_attempts?: number
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_pre_registered?: boolean | null
          job_title?: string | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          login_attempts_count?: number | null
          msa_completed?: boolean | null
          msa_completed_at?: string | null
          msa_signed?: boolean | null
          msa_signed_at?: string | null
          msa_signed_by?: string | null
          msa_status?: Database["public"]["Enums"]["setup_step_status"] | null
          organization_id?: string | null
          password_changed_at?: string | null
          phone?: string | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_locked_reason?: string | null
          account_locked_until?: string | null
          address_completed?: boolean | null
          address_completed_at?: string | null
          address_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          avatar_url?: string | null
          basic_info_completed?: boolean | null
          basic_info_completed_at?: string | null
          basic_info_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          company_info_completed?: boolean | null
          company_info_completed_at?: string | null
          company_info_status?:
            | Database["public"]["Enums"]["setup_step_status"]
            | null
          created_at?: string
          department?: string | null
          email?: string
          email_verified?: boolean
          failed_login_attempts?: number
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_pre_registered?: boolean | null
          job_title?: string | null
          last_failed_login_at?: string | null
          last_login_at?: string | null
          last_name?: string | null
          login_attempts_count?: number | null
          msa_completed?: boolean | null
          msa_completed_at?: string | null
          msa_signed?: boolean | null
          msa_signed_at?: string | null
          msa_signed_by?: string | null
          msa_status?: Database["public"]["Enums"]["setup_step_status"] | null
          organization_id?: string | null
          password_changed_at?: string | null
          phone?: string | null
          setup_completed?: boolean | null
          setup_completed_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_secrets: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          secret_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_organization_role: {
        Args: {
          p_user_id: string
          p_organization_id: string
          p_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      calculate_age: {
        Args: { birth_date: string }
        Returns: number
      }
      check_user_exists: {
        Args: { user_email: string }
        Returns: Json
      }
      cleanup_expired_otp_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_account_security_status: {
        Args: { user_email: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_onboarding_progress: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_role_priority: {
        Args: { role_name: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_failed_login_attempts: {
        Args:
          | { user_email: string }
          | { user_email: string; ip_address?: string }
        Returns: undefined
      }
      is_email_verified: {
        Args: { user_id: string }
        Returns: boolean
      }
      require_email_verification: {
        Args: { user_id: string }
        Returns: boolean
      }
      reset_failed_login_attempts: {
        Args: { user_email: string; ip_address?: string }
        Returns: undefined
      }
      should_lock_account: {
        Args: { user_email: string }
        Returns: boolean
      }
      upsert_organization: {
        Args: {
          p_organization_id?: string
          p_name?: string
          p_legal_name?: string
          p_country?: string
          p_employee_count?: Database["public"]["Enums"]["employee_count_range"]
          p_business_address?: string
          p_business_city?: string
          p_business_state?: string
          p_business_postal_code?: string
          p_website?: string
          p_phone?: string
          p_industry?: string
          p_description?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "employee"
        | "guest"
        | "superadmin"
        | "client"
        | "contractor"
      employee_count_range:
        | "1-10"
        | "11-50"
        | "51-200"
        | "201-500"
        | "501-1000"
        | "1000+"
      setup_step_status: "pending" | "in_progress" | "completed" | "skipped"
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
        "manager",
        "employee",
        "guest",
        "superadmin",
        "client",
        "contractor",
      ],
      employee_count_range: [
        "1-10",
        "11-50",
        "51-200",
        "201-500",
        "501-1000",
        "1000+",
      ],
      setup_step_status: ["pending", "in_progress", "completed", "skipped"],
    },
  },
} as const
