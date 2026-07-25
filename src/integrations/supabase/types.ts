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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addons_config: {
        Row: {
          active: boolean
          description: string
          kind: string
          price_usd: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          description?: string
          kind: string
          price_usd: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          description?: string
          kind?: string
          price_usd?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          order_id: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          order_id: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          order_id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          order_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          order_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          order_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_charged: number
          amount_usd: number
          assigned_to: string | null
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          cashfree_payment_session_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          package: Database["public"]["Enums"]["package_slug"]
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_charged: number
          amount_usd: number
          assigned_to?: string | null
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          cashfree_payment_session_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          package: Database["public"]["Enums"]["package_slug"]
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_charged?: number
          amount_usd?: number
          assigned_to?: string | null
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          cashfree_payment_session_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          package?: Database["public"]["Enums"]["package_slug"]
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packages_config: {
        Row: {
          active: boolean
          cta_text: string
          features: string[]
          name: string
          pages: string
          price_usd: number
          slug: string
          sort_order: number
          tagline: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cta_text?: string
          features?: string[]
          name: string
          pages: string
          price_usd: number
          slug: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cta_text?: string
          features?: string[]
          name?: string
          pages?: string
          price_usd?: number
          slug?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          phone: string | null
          skills: string[] | null
          updated_at: string
          weekly_capacity_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          weekly_capacity_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
          weekly_capacity_hours?: number | null
        }
        Relationships: []
      }
      project_requirements: {
        Row: {
          brand_colors: string | null
          business_name: string | null
          content_notes: string | null
          created_at: string
          industry: string | null
          logo_url: string | null
          order_id: string
          reference_images: Json
          reference_sites: string | null
          submitted: boolean
          updated_at: string
        }
        Insert: {
          brand_colors?: string | null
          business_name?: string | null
          content_notes?: string | null
          created_at?: string
          industry?: string | null
          logo_url?: string | null
          order_id: string
          reference_images?: Json
          reference_sites?: string | null
          submitted?: boolean
          updated_at?: string
        }
        Update: {
          brand_colors?: string | null
          business_name?: string | null
          content_notes?: string | null
          created_at?: string
          industry?: string | null
          logo_url?: string | null
          order_id?: string
          reference_images?: Json
          reference_sites?: string | null
          submitted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_requirements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          order_id: string
          stage: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id: string
          stage: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          order_id: string
          review: string | null
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          review?: string | null
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          review?: string | null
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string
          requested_by: string
          status: Database["public"]["Enums"]["revision_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id: string
          requested_by: string
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["revision_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_addons: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          invoice_order_id: string | null
          kind: string
          order_id: string
          price_cents: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_order_id?: string | null
          kind: string
          order_id: string
          price_cents: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          invoice_order_id?: string | null
          kind?: string
          order_id?: string
          price_cents?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_addons_invoice_order_id_fkey"
            columns: ["invoice_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scope_addons_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          developer_id: string
          ended_at: string | null
          id: string
          minutes: number | null
          note: string | null
          order_id: string | null
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          note?: string | null
          order_id?: string | null
          started_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          note?: string | null
          order_id?: string | null
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "developer"
      order_status:
        | "pending_payment"
        | "paid"
        | "requirements_pending"
        | "in_progress"
        | "review"
        | "delivered"
        | "cancelled"
      package_slug: "one_page" | "five_page" | "ten_page"
      revision_status: "pending" | "addressed" | "approved"
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
      app_role: ["admin", "client", "developer"],
      order_status: [
        "pending_payment",
        "paid",
        "requirements_pending",
        "in_progress",
        "review",
        "delivered",
        "cancelled",
      ],
      package_slug: ["one_page", "five_page", "ten_page"],
      revision_status: ["pending", "addressed", "approved"],
    },
  },
} as const
