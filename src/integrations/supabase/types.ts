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
      blog_analytics: {
        Row: {
          blog_post_id: string
          created_at: string
          id: string
          session_id: string | null
          time_spent_seconds: number | null
          updated_at: string
          user_id: string | null
          view_count: number
          view_date: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          id?: string
          session_id?: string | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
          view_date?: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          id?: string
          session_id?: string | null
          time_spent_seconds?: number | null
          updated_at?: string
          user_id?: string | null
          view_count?: number
          view_date?: string
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
      event_analytics: {
        Row: {
          calendar_add_count: number | null
          created_at: string | null
          event_id: string
          id: string
          registration_count: number | null
          updated_at: string | null
          view_count: number | null
          view_date: string
        }
        Insert: {
          calendar_add_count?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          registration_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          view_date?: string
        }
        Update: {
          calendar_add_count?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          registration_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          is_featured: boolean | null
          location: string
          minister_id: string | null
          organization_id: string | null
          organizer: string | null
          price: number | null
          requirements: string | null
          slug: string
          stripe_account_id: string | null
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
          is_featured?: boolean | null
          location: string
          minister_id?: string | null
          organization_id?: string | null
          organizer?: string | null
          price?: number | null
          requirements?: string | null
          slug: string
          stripe_account_id?: string | null
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
          is_featured?: boolean | null
          location?: string
          minister_id?: string | null
          organization_id?: string | null
          organizer?: string | null
          price?: number | null
          requirements?: string | null
          slug?: string
          stripe_account_id?: string | null
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
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          event_id: string | null
          group_id: string
          id: string
          likes_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          event_id?: string | null
          group_id: string
          id?: string
          likes_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          event_id?: string | null
          group_id?: string
          id?: string
          likes_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string
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
      notification_preferences: {
        Row: {
          categories: string[] | null
          created_at: string
          email: string
          enabled: boolean | null
          id: string
          locations: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string
          email: string
          enabled?: boolean | null
          id?: string
          locations?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string
          email?: string
          enabled?: boolean | null
          id?: string
          locations?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          ticket_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          ticket_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          ticket_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          application_method: Database["public"]["Enums"]["application_method"]
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          external_url: string | null
          hours_per_week: string | null
          id: string
          is_active: boolean | null
          is_remote: boolean | null
          location: string
          minister_id: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          organization_id: string | null
          requirements: string | null
          responsibilities: string | null
          salary_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_method?: Database["public"]["Enums"]["application_method"]
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          external_url?: string | null
          hours_per_week?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location: string
          minister_id?: string | null
          opportunity_type: Database["public"]["Enums"]["opportunity_type"]
          organization_id?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_method?: Database["public"]["Enums"]["application_method"]
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          external_url?: string | null
          hours_per_week?: string | null
          id?: string
          is_active?: boolean | null
          is_remote?: boolean | null
          location?: string
          minister_id?: string | null
          opportunity_type?: Database["public"]["Enums"]["opportunity_type"]
          organization_id?: string | null
          requirements?: string | null
          responsibilities?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          opportunity_id: string
          resume_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          resume_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          resume_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
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
      page_analytics: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          view_count: number
          view_date: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          view_count?: number
          view_date?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          view_count?: number
          view_date?: string
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
      saved_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      stripe_connected_accounts: {
        Row: {
          account_status: string
          charges_enabled: boolean | null
          created_at: string
          details_submitted: boolean | null
          first_event_date: string | null
          id: string
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          charges_enabled?: boolean | null
          created_at?: string
          details_submitted?: boolean | null
          first_event_date?: string | null
          id?: string
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          charges_enabled?: boolean | null
          created_at?: string
          details_submitted?: boolean | null
          first_event_date?: string | null
          id?: string
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          max_per_order: number | null
          name: string
          price: number
          quantity_available: number
          quantity_sold: number
          sale_end_date: string | null
          sale_start_date: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          max_per_order?: number | null
          name: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          max_per_order?: number | null
          name?: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          sale_end_date?: string | null
          sale_start_date?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          check_in_status: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          event_id: string
          id: string
          payment_id: string | null
          payment_metadata: Json | null
          quantity: number
          status: string
          ticket_type_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_status?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          payment_id?: string | null
          payment_metadata?: Json | null
          quantity?: number
          status?: string
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_status?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          payment_id?: string | null
          payment_metadata?: Json | null
          quantity?: number
          status?: string
          ticket_type_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
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
      cleanup_admin_analytics: { Args: never; Returns: undefined }
      ensure_unique_slug: {
        Args: { base_slug: string; record_id?: string; table_name: string }
        Returns: string
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_daily_analytics_chart: {
        Args: { days_back?: number }
        Returns: {
          blog_views: number
          date: string
          event_views: number
          page_views: number
          total_views: number
          unique_visitors: number
        }[]
      }
      get_donation_admin_view: {
        Args: never
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
      get_event_organizer_analytics: {
        Args: { organizer_id: string }
        Returns: {
          event_date: string
          event_id: string
          event_title: string
          recent_views: number
          registration_rate: number
          total_calendar_adds: number
          total_registrations: number
          total_views: number
        }[]
      }
      get_organizer_analytics_summary: {
        Args: { organizer_id: string }
        Returns: {
          avg_registration_rate: number
          total_events: number
          total_registrations: number
          total_views: number
          upcoming_events: number
        }[]
      }
      get_site_analytics_summary: {
        Args: { days_back?: number }
        Returns: {
          daily_views: Json
          most_viewed_blogs: Json
          most_viewed_events: Json
          most_viewed_pages: Json
          total_blog_views: number
          total_event_views: number
          total_page_views: number
          total_registrations: number
          total_sessions: number
          unique_visitors: number
        }[]
      }
      get_user_donations: {
        Args: never
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
      get_visitor_geography: {
        Args: { days_back?: number }
        Returns: {
          city: string
          country: string
          country_code: string
          page_views: number
          visitor_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_view: {
        Args: {
          blog_post_id_param: string
          session_id_param?: string
          user_id_param?: string
        }
        Returns: undefined
      }
      increment_event_view: {
        Args: { event_id_param: string }
        Returns: undefined
      }
      increment_page_view:
        | {
            Args: {
              ip_address_param?: unknown
              page_path_param: string
              page_title_param?: string
              referrer_param?: string
              session_id_param?: string
              user_agent_param?: string
              user_id_param?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              city_param?: string
              country_code_param?: string
              country_param?: string
              ip_address_param?: unknown
              page_path_param: string
              page_title_param?: string
              referrer_param?: string
              session_id_param?: string
              user_agent_param?: string
              user_id_param?: string
            }
            Returns: undefined
          }
      is_admin_user: { Args: never; Returns: boolean }
      is_authenticated_user: { Args: never; Returns: boolean }
      mask_stripe_data: { Args: { stripe_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      application_method: "external" | "in_app" | "both"
      opportunity_type: "job" | "volunteer" | "internship"
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
      application_method: ["external", "in_app", "both"],
      opportunity_type: ["job", "volunteer", "internship"],
    },
  },
} as const
