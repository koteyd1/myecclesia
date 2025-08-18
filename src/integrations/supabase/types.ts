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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string | null
          content: string
          created_at: string
          created_by: string
          excerpt: string | null
          id: string
          image: string | null
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          excerpt?: string | null
          id?: string
          image?: string | null
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          excerpt?: string | null
          id?: string
          image?: string | null
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          donation_type: string
          email: string
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          donation_type: string
          email: string
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          donation_type?: string
          email?: string
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          registered_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          available_tickets: number | null
          category: string | null
          created_at: string
          created_by: string | null
          date: string
          denominations: string | null
          description: string | null
          duration: string | null
          external_url: string | null
          id: string
          image: string | null
          location: string
          minister_id: string | null
          organization_id: string | null
          organizer: string | null
          price: number | null
          requirements: string | null
          slug: string
          ticket_url: string | null
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          available_tickets?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          denominations?: string | null
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          image?: string | null
          location: string
          minister_id?: string | null
          organization_id?: string | null
          organizer?: string | null
          price?: number | null
          requirements?: string | null
          slug: string
          ticket_url?: string | null
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          available_tickets?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          denominations?: string | null
          description?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          image?: string | null
          location?: string
          minister_id?: string | null
          organization_id?: string | null
          organizer?: string | null
          price?: number | null
          requirements?: string | null
          slug?: string
          ticket_url?: string | null
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          change_frequency: string | null
          created_at: string | null
          file_path: string
          id: number
          is_published: boolean | null
          last_modified: string | null
          organization: string
          priority: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          change_frequency?: string | null
          created_at?: string | null
          file_path: string
          id?: never
          is_published?: boolean | null
          last_modified?: string | null
          organization: string
          priority?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          change_frequency?: string | null
          created_at?: string | null
          file_path?: string
          id?: never
          is_published?: boolean | null
          last_modified?: string | null
          organization?: string
          priority?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      minister_followers: {
        Row: {
          created_at: string
          id: string
          minister_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minister_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minister_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minister_followers_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      ministers: {
        Row: {
          banner_url: string | null
          booking_links: Json | null
          created_at: string
          denomination: string | null
          full_name: string
          id: string
          is_verified: boolean | null
          location: string
          ministry_focus: string
          mission_statement: string | null
          profile_image_url: string | null
          services_offered: string[] | null
          slug: string
          social_media_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banner_url?: string | null
          booking_links?: Json | null
          created_at?: string
          denomination?: string | null
          full_name: string
          id?: string
          is_verified?: boolean | null
          location: string
          ministry_focus: string
          mission_statement?: string | null
          profile_image_url?: string | null
          services_offered?: string[] | null
          slug: string
          social_media_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banner_url?: string | null
          booking_links?: Json | null
          created_at?: string
          denomination?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean | null
          location?: string
          ministry_focus?: string
          mission_statement?: string | null
          profile_image_url?: string | null
          services_offered?: string[] | null
          slug?: string
          social_media_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_followers: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_followers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string
          banner_url: string | null
          country: string
          created_at: string
          denomination: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          mission_statement: string | null
          name: string
          postcode: string
          safeguarding_contact: string | null
          services_offered: string[] | null
          slug: string
          social_media_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          banner_url?: string | null
          country?: string
          created_at?: string
          denomination?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          mission_statement?: string | null
          name: string
          postcode: string
          safeguarding_contact?: string | null
          services_offered?: string[] | null
          slug: string
          social_media_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          banner_url?: string | null
          country?: string
          created_at?: string
          denomination?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string
          postcode?: string
          safeguarding_contact?: string | null
          services_offered?: string[] | null
          slug?: string
          social_media_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          changefreq: string | null
          created_at: string | null
          id: number
          is_published: boolean
          lastmod: string | null
          loc: string
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          changefreq?: string | null
          created_at?: string | null
          id?: never
          is_published?: boolean
          lastmod?: string | null
          loc: string
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          changefreq?: string | null
          created_at?: string | null
          id?: never
          is_published?: boolean
          lastmod?: string | null
          loc?: string
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sitemap: {
        Row: {
          content: Json | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_calendar: {
        Row: {
          added_at: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_unique_slug: {
        Args: { base_slug: string; record_id?: string; table_name: string }
        Returns: string
      }
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
      get_donation_admin_view: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          created_at: string
          currency: string
          donation_type: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string
          status: string
          stripe_customer_id: string
          stripe_session_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_donations: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount: number
          created_at: string
          currency: string
          donation_type: string
          id: string
          masked_email: string
          message: string
          status: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mask_stripe_data: {
        Args: { stripe_id: string }
        Returns: string
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
