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
      applications: {
        Row: {
          applicant_id: string
          application_number: string
          application_type: string
          assigned_officer_id: string | null
          building_id: string
          created_at: string
          documents: Json | null
          id: string
          notes: string | null
          priority: number | null
          purpose: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_number: string
          application_type?: string
          assigned_officer_id?: string | null
          building_id: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          purpose?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_number?: string
          application_type?: string
          assigned_officer_id?: string | null
          building_id?: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          priority?: number | null
          purpose?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string
          area_sqft: number
          category: Database["public"]["Enums"]["building_category"]
          city: string
          created_at: string
          floors: number
          id: string
          last_inspection_date: string | null
          latitude: number | null
          longitude: number | null
          name: string
          noc_valid_until: string | null
          occupancy_capacity: number | null
          owner_id: string
          pincode: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          risk_score: number | null
          state: string
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address: string
          area_sqft: number
          category: Database["public"]["Enums"]["building_category"]
          city: string
          created_at?: string
          floors?: number
          id?: string
          last_inspection_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          noc_valid_until?: string | null
          occupancy_capacity?: number | null
          owner_id: string
          pincode: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          state?: string
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string
          area_sqft?: number
          category?: Database["public"]["Enums"]["building_category"]
          city?: string
          created_at?: string
          floors?: number
          id?: string
          last_inspection_date?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          noc_valid_until?: string | null
          occupancy_capacity?: number | null
          owner_id?: string
          pincode?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          risk_score?: number | null
          state?: string
          updated_at?: string
          year_built?: number | null
        }
        Relationships: []
      }
      deficiencies: {
        Row: {
          application_id: string
          building_id: string
          compliance_deadline: string | null
          created_at: string
          description: string
          id: string
          inspection_id: string
          photos: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["deficiency_status"]
          title: string
          updated_at: string
        }
        Insert: {
          application_id: string
          building_id: string
          compliance_deadline?: string | null
          created_at?: string
          description: string
          id?: string
          inspection_id: string
          photos?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["deficiency_status"]
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          building_id?: string
          compliance_deadline?: string | null
          created_at?: string
          description?: string
          id?: string
          inspection_id?: string
          photos?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["deficiency_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deficiencies_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deficiencies_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          application_id: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          feedback: string | null
          grievance_number: string
          id: string
          priority: number | null
          rating: number | null
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["grievance_status"]
          subject: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          feedback?: string | null
          grievance_number: string
          id?: string
          priority?: number | null
          rating?: number | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["grievance_status"]
          subject: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          feedback?: string | null
          grievance_number?: string
          id?: string
          priority?: number | null
          rating?: number | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["grievance_status"]
          subject?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_checklists: {
        Row: {
          building_category: Database["public"]["Enums"]["building_category"]
          created_at: string
          id: string
          is_mandatory: boolean | null
          item_description: string | null
          item_name: string
          order_index: number | null
          weight: number | null
        }
        Insert: {
          building_category: Database["public"]["Enums"]["building_category"]
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          item_description?: string | null
          item_name: string
          order_index?: number | null
          weight?: number | null
        }
        Update: {
          building_category?: Database["public"]["Enums"]["building_category"]
          created_at?: string
          id?: string
          is_mandatory?: boolean | null
          item_description?: string | null
          item_name?: string
          order_index?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          application_id: string
          arrival_time: string | null
          building_id: string
          checklist_data: Json | null
          created_at: string
          departure_time: string | null
          findings: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          gps_verified: boolean | null
          id: string
          officer_id: string
          officer_signature: string | null
          overall_score: number | null
          photos: Json | null
          recommendations: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          arrival_time?: string | null
          building_id: string
          checklist_data?: Json | null
          created_at?: string
          departure_time?: string | null
          findings?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_verified?: boolean | null
          id?: string
          officer_id: string
          officer_signature?: string | null
          overall_score?: number | null
          photos?: Json | null
          recommendations?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          arrival_time?: string | null
          building_id?: string
          checklist_data?: Json | null
          created_at?: string
          departure_time?: string | null
          findings?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_verified?: boolean | null
          id?: string
          officer_id?: string
          officer_signature?: string | null
          overall_score?: number | null
          photos?: Json | null
          recommendations?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      nocs: {
        Row: {
          application_id: string
          building_id: string
          conditions: Json | null
          created_at: string
          id: string
          issue_date: string
          issued_by: string
          issued_to: string
          noc_number: string
          qr_code_data: string
          revocation_reason: string | null
          revoked_at: string | null
          status: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          application_id: string
          building_id: string
          conditions?: Json | null
          created_at?: string
          id?: string
          issue_date?: string
          issued_by: string
          issued_to: string
          noc_number: string
          qr_code_data: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          application_id?: string
          building_id?: string
          conditions?: Json | null
          created_at?: string
          id?: string
          issue_date?: string
          issued_by?: string
          issued_to?: string
          noc_number?: string
          qr_code_data?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "nocs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nocs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization?: string | null
          phone?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "applicant" | "fire_officer" | "senior_officer" | "admin"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "inspection_scheduled"
        | "inspection_completed"
        | "approved"
        | "rejected"
        | "requires_compliance"
      building_category:
        | "residential"
        | "commercial"
        | "hospital"
        | "school"
        | "factory"
        | "mall"
        | "hotel"
        | "warehouse"
        | "office"
        | "mixed_use"
        | "other"
      deficiency_status: "open" | "in_progress" | "resolved" | "overdue"
      grievance_status: "submitted" | "under_review" | "resolved" | "closed"
      inspection_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rescheduled"
      risk_level: "low" | "medium" | "high" | "critical"
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
      app_role: ["applicant", "fire_officer", "senior_officer", "admin"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "inspection_scheduled",
        "inspection_completed",
        "approved",
        "rejected",
        "requires_compliance",
      ],
      building_category: [
        "residential",
        "commercial",
        "hospital",
        "school",
        "factory",
        "mall",
        "hotel",
        "warehouse",
        "office",
        "mixed_use",
        "other",
      ],
      deficiency_status: ["open", "in_progress", "resolved", "overdue"],
      grievance_status: ["submitted", "under_review", "resolved", "closed"],
      inspection_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      risk_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
