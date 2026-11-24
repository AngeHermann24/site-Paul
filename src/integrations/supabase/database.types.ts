// ⚠️ FICHIER GÉNÉRÉ — ne pas modifier à la main. Régénérer : npm run db:types
// Source : supabase/migrations/*.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          kind: string
          title_fr: string
          title_en: string
          description_fr: string | null
          description_en: string | null
          organization: string | null
          achieved_on: string | null
          year: number | null
          fight_id: string | null
          image_url: string | null
          image_alt_fr: string | null
          image_alt_en: string | null
          show_in_timeline: boolean
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          kind?: string
          title_fr: string
          title_en: string
          description_fr?: string | null
          description_en?: string | null
          organization?: string | null
          achieved_on?: string | null
          year?: number | null
          fight_id?: string | null
          image_url?: string | null
          image_alt_fr?: string | null
          image_alt_en?: string | null
          show_in_timeline?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          kind?: string
          title_fr?: string
          title_en?: string
          description_fr?: string | null
          description_en?: string | null
          organization?: string | null
          achieved_on?: string | null
          year?: number | null
          fight_id?: string | null
          image_url?: string | null
          image_alt_fr?: string | null
          image_alt_en?: string | null
          show_in_timeline?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          email: string
          display_name: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          display_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          display_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          slug: string
          category: string
          title_fr: string
          title_en: string
          excerpt_fr: string | null
          excerpt_en: string | null
          body_fr: string | null
          body_en: string | null
          cover_url: string | null
          cover_alt_fr: string | null
          cover_alt_en: string | null
          author_name: string | null
          tags: string[]
          seo_title_fr: string | null
          seo_title_en: string | null
          seo_description_fr: string | null
          seo_description_en: string | null
          is_featured: boolean
          status: string
          published_at: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          search_fr: unknown | null
          search_en: unknown | null
        }
        Insert: {
          id?: string
          slug: string
          category?: string
          title_fr: string
          title_en: string
          excerpt_fr?: string | null
          excerpt_en?: string | null
          body_fr?: string | null
          body_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          author_name?: string | null
          tags?: string[]
          seo_title_fr?: string | null
          seo_title_en?: string | null
          seo_description_fr?: string | null
          seo_description_en?: string | null
          is_featured?: boolean
          status?: string
          published_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          search_fr?: never
          search_en?: never
        }
        Update: {
          id?: string
          slug?: string
          category?: string
          title_fr?: string
          title_en?: string
          excerpt_fr?: string | null
          excerpt_en?: string | null
          body_fr?: string | null
          body_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          author_name?: string | null
          tags?: string[]
          seo_title_fr?: string | null
          seo_title_en?: string | null
          seo_description_fr?: string | null
          seo_description_en?: string | null
          is_featured?: boolean
          status?: string
          published_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          search_fr?: never
          search_en?: never
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          id: string
          organizer_name: string
          organization: string | null
          email: string
          phone: string | null
          event_name: string
          event_date: string | null
          event_city: string | null
          event_country: string | null
          discipline: string | null
          service_id: string | null
          broadcast_type: string | null
          audience_size: string | null
          budget_range: string | null
          message: string
          consent: boolean
          locale: string
          status: string
          internal_notes: string | null
          handled_by: string | null
          handled_at: string | null
          email_notified_at: string | null
          email_notification_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_name: string
          organization?: string | null
          email: string
          phone?: string | null
          event_name: string
          event_date?: string | null
          event_city?: string | null
          event_country?: string | null
          discipline?: string | null
          service_id?: string | null
          broadcast_type?: string | null
          audience_size?: string | null
          budget_range?: string | null
          message: string
          consent: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_name?: string
          organization?: string | null
          email?: string
          phone?: string | null
          event_name?: string
          event_date?: string | null
          event_city?: string | null
          event_country?: string | null
          discipline?: string | null
          service_id?: string | null
          broadcast_type?: string | null
          audience_size?: string | null
          budget_range?: string | null
          message?: string
          consent?: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "commentary_services"
            referencedColumns: ["id"]
          },
        ]
      }
      commentary_events: {
        Row: {
          id: string
          slug: string
          event_name: string
          event_date: string | null
          promotion: string | null
          broadcaster: string | null
          role: string
          discipline: string | null
          city: string | null
          country: string | null
          description_fr: string | null
          description_en: string | null
          cover_url: string | null
          cover_alt_fr: string | null
          cover_alt_en: string | null
          video_url: string | null
          audio_url: string | null
          is_featured: boolean
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          event_name: string
          event_date?: string | null
          promotion?: string | null
          broadcaster?: string | null
          role?: string
          discipline?: string | null
          city?: string | null
          country?: string | null
          description_fr?: string | null
          description_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          audio_url?: string | null
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          event_name?: string
          event_date?: string | null
          promotion?: string | null
          broadcaster?: string | null
          role?: string
          discipline?: string | null
          city?: string | null
          country?: string | null
          description_fr?: string | null
          description_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          audio_url?: string | null
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      commentary_services: {
        Row: {
          id: string
          slug: string
          title_fr: string
          title_en: string
          description_fr: string | null
          description_en: string | null
          deliverables_fr: string[]
          deliverables_en: string[]
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          title_fr: string
          title_en: string
          description_fr?: string | null
          description_en?: string | null
          deliverables_fr?: string[]
          deliverables_en?: string[]
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title_fr?: string
          title_en?: string
          description_fr?: string | null
          description_en?: string | null
          deliverables_fr?: string[]
          deliverables_en?: string[]
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          type: string
          full_name: string
          email: string
          phone: string | null
          organization: string | null
          subject: string
          message: string
          consent: boolean
          locale: string
          status: string
          internal_notes: string | null
          handled_by: string | null
          handled_at: string | null
          email_notified_at: string | null
          email_notification_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          full_name: string
          email: string
          phone?: string | null
          organization?: string | null
          subject: string
          message: string
          consent: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          full_name?: string
          email?: string
          phone?: string | null
          organization?: string | null
          subject?: string
          message?: string
          consent?: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fights: {
        Row: {
          id: string
          slug: string
          opponent_name: string
          opponent_country: string | null
          opponent_record: string | null
          event_name: string | null
          event_date: string
          venue: string | null
          city: string | null
          country: string | null
          weight_class: string | null
          category: string
          fight_status: string
          result: string | null
          method: string | null
          rounds_scheduled: number | null
          round_ended: number | null
          time_ended: string | null
          is_title_fight: boolean
          title_name: string | null
          summary_fr: string | null
          summary_en: string | null
          cover_url: string | null
          cover_alt_fr: string | null
          cover_alt_en: string | null
          video_url: string | null
          ticket_url: string | null
          is_featured: boolean
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          opponent_name: string
          opponent_country?: string | null
          opponent_record?: string | null
          event_name?: string | null
          event_date: string
          venue?: string | null
          city?: string | null
          country?: string | null
          weight_class?: string | null
          category?: string
          fight_status?: string
          result?: string | null
          method?: string | null
          rounds_scheduled?: number | null
          round_ended?: number | null
          time_ended?: string | null
          is_title_fight?: boolean
          title_name?: string | null
          summary_fr?: string | null
          summary_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          ticket_url?: string | null
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          opponent_name?: string
          opponent_country?: string | null
          opponent_record?: string | null
          event_name?: string | null
          event_date?: string
          venue?: string | null
          city?: string | null
          country?: string | null
          weight_class?: string | null
          category?: string
          fight_status?: string
          result?: string | null
          method?: string | null
          rounds_scheduled?: number | null
          round_ended?: number | null
          time_ended?: string | null
          is_title_fight?: boolean
          title_name?: string | null
          summary_fr?: string | null
          summary_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          ticket_url?: string | null
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      gym_coaches: {
        Row: {
          id: string
          slug: string
          full_name: string
          role_fr: string | null
          role_en: string | null
          bio_fr: string | null
          bio_en: string | null
          specialties: string[]
          photo_url: string | null
          photo_alt_fr: string | null
          photo_alt_en: string | null
          instagram_url: string | null
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          full_name: string
          role_fr?: string | null
          role_en?: string | null
          bio_fr?: string | null
          bio_en?: string | null
          specialties?: string[]
          photo_url?: string | null
          photo_alt_fr?: string | null
          photo_alt_en?: string | null
          instagram_url?: string | null
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          full_name?: string
          role_fr?: string | null
          role_en?: string | null
          bio_fr?: string | null
          bio_en?: string | null
          specialties?: string[]
          photo_url?: string | null
          photo_alt_fr?: string | null
          photo_alt_en?: string | null
          instagram_url?: string | null
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      gym_memberships: {
        Row: {
          id: string
          slug: string
          name_fr: string
          name_en: string
          description_fr: string | null
          description_en: string | null
          price_cents: number | null
          currency: string
          billing_period: string
          features_fr: string[]
          features_en: string[]
          is_featured: boolean
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          name_fr: string
          name_en: string
          description_fr?: string | null
          description_en?: string | null
          price_cents?: number | null
          currency?: string
          billing_period?: string
          features_fr?: string[]
          features_en?: string[]
          is_featured?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name_fr?: string
          name_en?: string
          description_fr?: string | null
          description_en?: string | null
          price_cents?: number | null
          currency?: string
          billing_period?: string
          features_fr?: string[]
          features_en?: string[]
          is_featured?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      gym_registration_requests: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          membership_id: string | null
          disciplines: string[]
          experience_level: string | null
          preferred_contact: string
          message: string | null
          consent: boolean
          locale: string
          status: string
          internal_notes: string | null
          handled_by: string | null
          handled_at: string | null
          email_notified_at: string | null
          email_notification_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          membership_id?: string | null
          disciplines?: string[]
          experience_level?: string | null
          preferred_contact?: string
          message?: string | null
          consent: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          membership_id?: string | null
          disciplines?: string[]
          experience_level?: string | null
          preferred_contact?: string
          message?: string | null
          consent?: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_registration_requests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "gym_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_schedules: {
        Row: {
          id: string
          service_id: string | null
          coach_id: string | null
          label_fr: string | null
          label_en: string | null
          day_of_week: number
          starts_at: string
          ends_at: string
          level: string
          room: string | null
          capacity: number | null
          notes_fr: string | null
          notes_en: string | null
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          service_id?: string | null
          coach_id?: string | null
          label_fr?: string | null
          label_en?: string | null
          day_of_week: number
          starts_at: string
          ends_at: string
          level?: string
          room?: string | null
          capacity?: number | null
          notes_fr?: string | null
          notes_en?: string | null
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          service_id?: string | null
          coach_id?: string | null
          label_fr?: string | null
          label_en?: string | null
          day_of_week?: number
          starts_at?: string
          ends_at?: string
          level?: string
          room?: string | null
          capacity?: number | null
          notes_fr?: string | null
          notes_en?: string | null
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_schedules_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "gym_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_schedules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "gym_services"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_services: {
        Row: {
          id: string
          slug: string
          kind: string
          title_fr: string
          title_en: string
          description_fr: string | null
          description_en: string | null
          level: string
          image_url: string | null
          image_alt_fr: string | null
          image_alt_en: string | null
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          kind: string
          title_fr: string
          title_en: string
          description_fr?: string | null
          description_en?: string | null
          level?: string
          image_url?: string | null
          image_alt_fr?: string | null
          image_alt_en?: string | null
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          kind?: string
          title_fr?: string
          title_en?: string
          description_fr?: string | null
          description_en?: string | null
          level?: string
          image_url?: string | null
          image_alt_fr?: string | null
          image_alt_en?: string | null
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          id: string
          kind: string
          category: string
          title_fr: string | null
          title_en: string | null
          alt_fr: string | null
          alt_en: string | null
          caption_fr: string | null
          caption_en: string | null
          storage_path: string | null
          external_url: string | null
          poster_url: string | null
          width: number | null
          height: number | null
          duration_seconds: number | null
          taken_on: string | null
          credit: string | null
          fight_id: string | null
          sort_order: number
          is_featured: boolean
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          kind: string
          category?: string
          title_fr?: string | null
          title_en?: string | null
          alt_fr?: string | null
          alt_en?: string | null
          caption_fr?: string | null
          caption_en?: string | null
          storage_path?: string | null
          external_url?: string | null
          poster_url?: string | null
          width?: number | null
          height?: number | null
          duration_seconds?: number | null
          taken_on?: string | null
          credit?: string | null
          fight_id?: string | null
          sort_order?: number
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          kind?: string
          category?: string
          title_fr?: string | null
          title_en?: string | null
          alt_fr?: string | null
          alt_en?: string | null
          caption_fr?: string | null
          caption_en?: string | null
          storage_path?: string | null
          external_url?: string | null
          poster_url?: string | null
          width?: number | null
          height?: number | null
          duration_seconds?: number | null
          taken_on?: string | null
          credit?: string | null
          fight_id?: string | null
          sort_order?: number
          is_featured?: boolean
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "fights"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_contents: {
        Row: {
          id: string
          slug: string
          category: string
          title_fr: string
          title_en: string
          excerpt_fr: string | null
          excerpt_en: string | null
          body_fr: string | null
          body_en: string | null
          cover_url: string | null
          cover_alt_fr: string | null
          cover_alt_en: string | null
          video_url: string | null
          sort_order: number
          status: string
          published_at: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          category: string
          title_fr: string
          title_en: string
          excerpt_fr?: string | null
          excerpt_en?: string | null
          body_fr?: string | null
          body_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          sort_order?: number
          status?: string
          published_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          category?: string
          title_fr?: string
          title_en?: string
          excerpt_fr?: string | null
          excerpt_en?: string | null
          body_fr?: string | null
          body_en?: string | null
          cover_url?: string | null
          cover_alt_fr?: string | null
          cover_alt_en?: string | null
          video_url?: string | null
          sort_order?: number
          status?: string
          published_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          slug: string
          display_name: string
          full_name: string | null
          nickname: string | null
          headline_fr: string | null
          headline_en: string | null
          bio_short_fr: string | null
          bio_short_en: string | null
          bio_fr: string | null
          bio_en: string | null
          beginnings_fr: string | null
          beginnings_en: string | null
          journey_fr: string | null
          journey_en: string | null
          philosophy_fr: string | null
          philosophy_en: string | null
          discipline_fr: string | null
          discipline_en: string | null
          nationality: string | null
          hometown: string | null
          birth_date: string | null
          weight_class: string | null
          stance: string | null
          height_cm: number | null
          reach_cm: number | null
          portrait_url: string | null
          portrait_alt_fr: string | null
          portrait_alt_en: string | null
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          commentator_bio_fr: string | null
          commentator_bio_en: string | null
        }
        Insert: {
          id?: string
          slug: string
          display_name: string
          full_name?: string | null
          nickname?: string | null
          headline_fr?: string | null
          headline_en?: string | null
          bio_short_fr?: string | null
          bio_short_en?: string | null
          bio_fr?: string | null
          bio_en?: string | null
          beginnings_fr?: string | null
          beginnings_en?: string | null
          journey_fr?: string | null
          journey_en?: string | null
          philosophy_fr?: string | null
          philosophy_en?: string | null
          discipline_fr?: string | null
          discipline_en?: string | null
          nationality?: string | null
          hometown?: string | null
          birth_date?: string | null
          weight_class?: string | null
          stance?: string | null
          height_cm?: number | null
          reach_cm?: number | null
          portrait_url?: string | null
          portrait_alt_fr?: string | null
          portrait_alt_en?: string | null
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          commentator_bio_fr?: string | null
          commentator_bio_en?: string | null
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string
          full_name?: string | null
          nickname?: string | null
          headline_fr?: string | null
          headline_en?: string | null
          bio_short_fr?: string | null
          bio_short_en?: string | null
          bio_fr?: string | null
          bio_en?: string | null
          beginnings_fr?: string | null
          beginnings_en?: string | null
          journey_fr?: string | null
          journey_en?: string | null
          philosophy_fr?: string | null
          philosophy_en?: string | null
          discipline_fr?: string | null
          discipline_en?: string | null
          nationality?: string | null
          hometown?: string | null
          birth_date?: string | null
          weight_class?: string | null
          stance?: string | null
          height_cm?: number | null
          reach_cm?: number | null
          portrait_url?: string | null
          portrait_alt_fr?: string | null
          portrait_alt_en?: string | null
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          commentator_bio_fr?: string | null
          commentator_bio_en?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          singleton: boolean
          site_name: string
          enabled_languages: string[]
          contact_email: string | null
          contact_phone: string | null
          booking_email: string | null
          gym_name: string | null
          gym_address: string | null
          gym_postal_code: string | null
          gym_city: string | null
          gym_country: string | null
          gym_latitude: number | null
          gym_longitude: number | null
          gym_maps_url: string | null
          gym_opening_hours_fr: string | null
          gym_opening_hours_en: string | null
          instagram_url: string | null
          youtube_url: string | null
          tiktok_url: string | null
          x_url: string | null
          facebook_url: string | null
          linkedin_url: string | null
          seo_title_fr: string | null
          seo_title_en: string | null
          seo_description_fr: string | null
          seo_description_en: string | null
          og_image_url: string | null
          logo_url: string | null
          hero_video_mp4_url: string | null
          hero_video_webm_url: string | null
          hero_video_mobile_url: string | null
          hero_poster_url: string | null
          audience_metrics: Json
          legal_notice_fr: string | null
          legal_notice_en: string | null
          privacy_policy_fr: string | null
          privacy_policy_en: string | null
          cookies_policy_fr: string | null
          cookies_policy_en: string | null
          created_at: string
          updated_at: string
          gym_story_fr: string | null
          gym_story_en: string | null
          gym_hero_video_url: string | null
          gym_hero_poster_url: string | null
        }
        Insert: {
          id?: string
          singleton?: boolean
          site_name?: string
          enabled_languages?: string[]
          contact_email?: string | null
          contact_phone?: string | null
          booking_email?: string | null
          gym_name?: string | null
          gym_address?: string | null
          gym_postal_code?: string | null
          gym_city?: string | null
          gym_country?: string | null
          gym_latitude?: number | null
          gym_longitude?: number | null
          gym_maps_url?: string | null
          gym_opening_hours_fr?: string | null
          gym_opening_hours_en?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          tiktok_url?: string | null
          x_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          seo_title_fr?: string | null
          seo_title_en?: string | null
          seo_description_fr?: string | null
          seo_description_en?: string | null
          og_image_url?: string | null
          logo_url?: string | null
          hero_video_mp4_url?: string | null
          hero_video_webm_url?: string | null
          hero_video_mobile_url?: string | null
          hero_poster_url?: string | null
          audience_metrics?: Json
          legal_notice_fr?: string | null
          legal_notice_en?: string | null
          privacy_policy_fr?: string | null
          privacy_policy_en?: string | null
          cookies_policy_fr?: string | null
          cookies_policy_en?: string | null
          created_at?: string
          updated_at?: string
          gym_story_fr?: string | null
          gym_story_en?: string | null
          gym_hero_video_url?: string | null
          gym_hero_poster_url?: string | null
        }
        Update: {
          id?: string
          singleton?: boolean
          site_name?: string
          enabled_languages?: string[]
          contact_email?: string | null
          contact_phone?: string | null
          booking_email?: string | null
          gym_name?: string | null
          gym_address?: string | null
          gym_postal_code?: string | null
          gym_city?: string | null
          gym_country?: string | null
          gym_latitude?: number | null
          gym_longitude?: number | null
          gym_maps_url?: string | null
          gym_opening_hours_fr?: string | null
          gym_opening_hours_en?: string | null
          instagram_url?: string | null
          youtube_url?: string | null
          tiktok_url?: string | null
          x_url?: string | null
          facebook_url?: string | null
          linkedin_url?: string | null
          seo_title_fr?: string | null
          seo_title_en?: string | null
          seo_description_fr?: string | null
          seo_description_en?: string | null
          og_image_url?: string | null
          logo_url?: string | null
          hero_video_mp4_url?: string | null
          hero_video_webm_url?: string | null
          hero_video_mobile_url?: string | null
          hero_poster_url?: string | null
          audience_metrics?: Json
          legal_notice_fr?: string | null
          legal_notice_en?: string | null
          privacy_policy_fr?: string | null
          privacy_policy_en?: string | null
          cookies_policy_fr?: string | null
          cookies_policy_en?: string | null
          created_at?: string
          updated_at?: string
          gym_story_fr?: string | null
          gym_story_en?: string | null
          gym_hero_video_url?: string | null
          gym_hero_poster_url?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          id: string
          slug: string
          name: string
          logo_path: string | null
          logo_url: string | null
          website_url: string | null
          tier: string
          package_id: string | null
          description_fr: string | null
          description_en: string | null
          is_active: boolean
          is_featured: boolean
          sort_order: number
          starts_on: string | null
          ends_on: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          logo_path?: string | null
          logo_url?: string | null
          website_url?: string | null
          tier?: string
          package_id?: string | null
          description_fr?: string | null
          description_en?: string | null
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          starts_on?: string | null
          ends_on?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          logo_path?: string | null
          logo_url?: string | null
          website_url?: string | null
          tier?: string
          package_id?: string | null
          description_fr?: string | null
          description_en?: string | null
          is_active?: boolean
          is_featured?: boolean
          sort_order?: number
          starts_on?: string | null
          ends_on?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_packages: {
        Row: {
          id: string
          slug: string
          tier: string
          name_fr: string
          name_en: string
          description_fr: string | null
          description_en: string | null
          benefits_fr: string[]
          benefits_en: string[]
          price_cents: number | null
          currency: string
          is_featured: boolean
          sort_order: number
          status: string
          is_demo: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          tier: string
          name_fr: string
          name_en: string
          description_fr?: string | null
          description_en?: string | null
          benefits_fr?: string[]
          benefits_en?: string[]
          price_cents?: number | null
          currency?: string
          is_featured?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          tier?: string
          name_fr?: string
          name_en?: string
          description_fr?: string | null
          description_en?: string | null
          benefits_fr?: string[]
          benefits_en?: string[]
          price_cents?: number | null
          currency?: string
          is_featured?: boolean
          sort_order?: number
          status?: string
          is_demo?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      sponsorship_requests: {
        Row: {
          id: string
          company_name: string
          company_website: string | null
          company_sector: string | null
          company_size: string | null
          company_country: string | null
          logo_path: string | null
          contact_name: string
          contact_role: string | null
          email: string
          phone: string | null
          package_tier: string | null
          package_id: string | null
          activities: string[]
          objectives: string[]
          budget_range: string | null
          desired_start: string | null
          duration_months: number | null
          presentation: string
          attachment_path: string | null
          consent: boolean
          locale: string
          status: string
          internal_notes: string | null
          assigned_to: string | null
          handled_by: string | null
          handled_at: string | null
          email_notified_at: string | null
          email_notification_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          company_website?: string | null
          company_sector?: string | null
          company_size?: string | null
          company_country?: string | null
          logo_path?: string | null
          contact_name: string
          contact_role?: string | null
          email: string
          phone?: string | null
          package_tier?: string | null
          package_id?: string | null
          activities?: string[]
          objectives?: string[]
          budget_range?: string | null
          desired_start?: string | null
          duration_months?: number | null
          presentation: string
          attachment_path?: string | null
          consent: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          assigned_to?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          company_website?: string | null
          company_sector?: string | null
          company_size?: string | null
          company_country?: string | null
          logo_path?: string | null
          contact_name?: string
          contact_role?: string | null
          email?: string
          phone?: string | null
          package_tier?: string | null
          package_id?: string | null
          activities?: string[]
          objectives?: string[]
          budget_range?: string | null
          desired_start?: string | null
          duration_months?: number | null
          presentation?: string
          attachment_path?: string | null
          consent?: boolean
          locale?: string
          status?: string
          internal_notes?: string | null
          assigned_to?: string | null
          handled_by?: string | null
          handled_at?: string | null
          email_notified_at?: string | null
          email_notification_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_requests_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "sponsorship_packages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      fight_stats: {
        Row: {
          category: string | null
          is_demo: boolean | null
          total: number | null
          wins: number | null
          losses: number | null
          draws: number | null
          no_contests: number | null
          ko_wins: number | null
          title_fights: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
