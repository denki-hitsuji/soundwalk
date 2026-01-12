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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      act_invites: {
        Row: {
          act_id: string
          created_at: string
          created_by_profile_id: string
          expires_at: string | null
          grant_admin: boolean
          id: string
          is_revoked: boolean
          max_uses: number
          role: string | null
          token: string
          used_count: number
        }
        Insert: {
          act_id: string
          created_at?: string
          created_by_profile_id: string
          expires_at?: string | null
          grant_admin?: boolean
          id?: string
          is_revoked?: boolean
          max_uses?: number
          role?: string | null
          token: string
          used_count?: number
        }
        Update: {
          act_id?: string
          created_at?: string
          created_by_profile_id?: string
          expires_at?: string | null
          grant_admin?: boolean
          id?: string
          is_revoked?: boolean
          max_uses?: number
          role?: string | null
          token?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "act_invites_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "act_invites_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      act_members: {
        Row: {
          act_id: string
          is_admin: boolean
          profile_id: string
          role: string | null
          status: string | null
        }
        Insert: {
          act_id: string
          is_admin?: boolean
          profile_id: string
          role?: string | null
          status?: string | null
        }
        Update: {
          act_id?: string
          is_admin?: boolean
          profile_id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "act_members_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "act_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      act_public_pages: {
        Row: {
          act_id: string
          body: string | null
          created_at: string
          headline: string | null
          is_public: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          act_id: string
          body?: string | null
          created_at?: string
          headline?: string | null
          is_public?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          act_id?: string
          body?: string | null
          created_at?: string
          headline?: string | null
          is_public?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "act_public_pages_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: true
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
        ]
      }
      act_song_assets: {
        Row: {
          act_song_id: string
          asset_kind: string
          bucket: string
          created_at: string
          id: string
          mime_type: string
          object_path: string
          original_filename: string
          size_bytes: number
          uploader_profile_id: string
        }
        Insert: {
          act_song_id: string
          asset_kind?: string
          bucket?: string
          created_at?: string
          id?: string
          mime_type: string
          object_path: string
          original_filename: string
          size_bytes: number
          uploader_profile_id: string
        }
        Update: {
          act_song_id?: string
          asset_kind?: string
          bucket?: string
          created_at?: string
          id?: string
          mime_type?: string
          object_path?: string
          original_filename?: string
          size_bytes?: number
          uploader_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "act_song_assets_act_song_id_fkey"
            columns: ["act_song_id"]
            isOneToOne: false
            referencedRelation: "act_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "act_song_assets_uploader_profile_id_fkey"
            columns: ["uploader_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      act_songs: {
        Row: {
          act_id: string
          created_at: string
          id: string
          memo: string | null
          title: string
        }
        Insert: {
          act_id: string
          created_at?: string
          id?: string
          memo?: string | null
          title: string
        }
        Update: {
          act_id?: string
          created_at?: string
          id?: string
          memo?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "act_songs_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
        ]
      }
      acts: {
        Row: {
          act_type: string
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_temporary: boolean
          name: string
          owner_profile_id: string
          photo_url: string | null
          profile_link_url: string | null
        }
        Insert: {
          act_type?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_temporary?: boolean
          name: string
          owner_profile_id: string
          photo_url?: string | null
          profile_link_url?: string | null
        }
        Update: {
          act_type?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_temporary?: boolean
          name?: string
          owner_profile_id?: string
          photo_url?: string | null
          profile_link_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acts_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          act_id: string
          canceled_at: string | null
          canceled_reason: string | null
          created_at: string
          event_id: string
          fee: number | null
          id: string
          message: string | null
          status: Database["public"]["Enums"]["booking_status"]
          status_changed_at: string | null
          venue_id: string
        }
        Insert: {
          act_id: string
          canceled_at?: string | null
          canceled_reason?: string | null
          created_at?: string
          event_id: string
          fee?: number | null
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          status_changed_at?: string | null
          venue_id: string
        }
        Update: {
          act_id?: string
          canceled_at?: string | null
          canceled_reason?: string | null
          created_at?: string
          event_id?: string
          fee?: number | null
          id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          status_changed_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      event_acts: {
        Row: {
          act_id: string
          created_at: string
          event_id: string
          sort_order: number | null
          status: string
        }
        Insert: {
          act_id: string
          created_at?: string
          event_id: string
          sort_order?: number | null
          status?: string
        }
        Update: {
          act_id?: string
          created_at?: string
          event_id?: string
          sort_order?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_acts_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_acts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_change_logs: {
        Row: {
          after: Json
          before: Json
          change_type: string
          changed_at: string
          changed_by_user_id: string | null
          event_id: string
          id: number
        }
        Insert: {
          after: Json
          before: Json
          change_type: string
          changed_at?: string
          changed_by_user_id?: string | null
          event_id: string
          id?: number
        }
        Update: {
          after?: Json
          before?: Json
          change_type?: string
          changed_at?: string
          changed_by_user_id?: string | null
          event_id?: string
          id?: number
        }
        Relationships: []
      }
      event_organizers: {
        Row: {
          event_id: string
          is_primary: boolean
          profile_id: string
          role_label: string | null
        }
        Insert: {
          event_id: string
          is_primary?: boolean
          profile_id: string
          role_label?: string | null
        }
        Update: {
          event_id?: string
          is_primary?: boolean
          profile_id?: string
          role_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_organizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organizers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          charge: number | null
          conditions: string | null
          created_at: string
          end_time: string
          event_date: string
          id: string
          max_artists: number
          open_time: string | null
          organizer_profile_id: string
          reconfirm_deadline: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          venue_id: string
        }
        Insert: {
          charge?: number | null
          conditions?: string | null
          created_at?: string
          end_time: string
          event_date: string
          id?: string
          max_artists?: number
          open_time?: string | null
          organizer_profile_id: string
          reconfirm_deadline?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          venue_id: string
        }
        Update: {
          charge?: number | null
          conditions?: string | null
          created_at?: string
          end_time?: string
          event_date?: string
          id?: string
          max_artists?: number
          open_time?: string | null
          organizer_profile_id?: string
          reconfirm_deadline?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      musician_performances: {
        Row: {
          act_id: string | null
          booking_id: string | null
          created_at: string | null
          event_date: string
          event_id: string | null
          id: string
          memo: string | null
          offer_id: string | null
          open_time: string | null
          profile_id: string
          start_time: string | null
          status: string | null
          status_changed_at: string | null
          status_reason: string | null
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          act_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          event_date: string
          event_id?: string | null
          id?: string
          memo?: string | null
          offer_id?: string | null
          open_time?: string | null
          profile_id: string
          start_time?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_reason?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          act_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          event_date?: string
          event_id?: string | null
          id?: string
          memo?: string | null
          offer_id?: string | null
          open_time?: string | null
          profile_id?: string
          start_time?: string | null
          status?: string | null
          status_changed_at?: string | null
          status_reason?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musician_performances_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      musicians: {
        Row: {
          area: string | null
          bio: string | null
          created_at: string
          genre: string | null
          id: string
          min_fee: number | null
          sample_video_url: string | null
          volume: Database["public"]["Enums"]["volume_level"] | null
        }
        Insert: {
          area?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id: string
          min_fee?: number | null
          sample_video_url?: string | null
          volume?: Database["public"]["Enums"]["volume_level"] | null
        }
        Update: {
          area?: string | null
          bio?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          min_fee?: number | null
          sample_video_url?: string | null
          volume?: Database["public"]["Enums"]["volume_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "musicians_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          created_at: string
          event_id: string
          id: number
          payload: Json
          processed_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: number
          payload?: Json
          processed_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: number
          payload?: Json
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          act_id: string
          canceled_at: string | null
          canceled_reason: string | null
          created_at: string
          event_id: string
          from_profile_id: string
          id: string
          message: string | null
          status: string
          status_changed_at: string | null
        }
        Insert: {
          act_id: string
          canceled_at?: string | null
          canceled_reason?: string | null
          created_at?: string
          event_id: string
          from_profile_id: string
          id?: string
          message?: string | null
          status?: string
          status_changed_at?: string | null
        }
        Update: {
          act_id?: string
          canceled_at?: string | null
          canceled_reason?: string | null
          created_at?: string
          event_id?: string
          from_profile_id?: string
          id?: string
          message?: string | null
          status?: string
          status_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_attachments: {
        Row: {
          caption: string | null
          created_at: string
          file_path: string | null
          file_type: string
          file_url: string
          id: string
          performance_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string
          file_url: string
          id?: string
          performance_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_path?: string | null
          file_type?: string
          file_url?: string
          id?: string
          performance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_attachments_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "musician_performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_attachments_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "v_my_performances"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_details: {
        Row: {
          customer_charge_yen: number | null
          load_in_time: string | null
          notes: string | null
          one_drink_required: boolean | null
          performance_id: string
          set_end_time: string | null
          set_minutes: number | null
          set_start_time: string | null
          updated_at: string
        }
        Insert: {
          customer_charge_yen?: number | null
          load_in_time?: string | null
          notes?: string | null
          one_drink_required?: boolean | null
          performance_id: string
          set_end_time?: string | null
          set_minutes?: number | null
          set_start_time?: string | null
          updated_at?: string
        }
        Update: {
          customer_charge_yen?: number | null
          load_in_time?: string | null
          notes?: string | null
          one_drink_required?: boolean | null
          performance_id?: string
          set_end_time?: string | null
          set_minutes?: number | null
          set_start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_details_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: true
            referencedRelation: "musician_performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_details_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: true
            referencedRelation: "v_my_performances"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          performance_id: string
          source: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          performance_id: string
          source?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          performance_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_messages_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "musician_performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_messages_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "v_my_performances"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_prep_tasks: {
        Row: {
          act_id: string | null
          created_at: string
          done_at: string | null
          done_by_profile_id: string | null
          due_date: string
          id: string
          is_done: boolean
          performance_id: string
          task_key: string
        }
        Insert: {
          act_id?: string | null
          created_at?: string
          done_at?: string | null
          done_by_profile_id?: string | null
          due_date: string
          id?: string
          is_done?: boolean
          performance_id: string
          task_key: string
        }
        Update: {
          act_id?: string | null
          created_at?: string
          done_at?: string | null
          done_by_profile_id?: string | null
          due_date?: string
          id?: string
          is_done?: boolean
          performance_id?: string
          task_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_prep_tasks_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_prep_tasks_done_by_profile_id_fkey"
            columns: ["done_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_prep_tasks_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "musician_performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_prep_tasks_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "v_my_performances"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      venue_admins: {
        Row: {
          created_at: string
          profile_id: string
          role: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          role?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          role?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_admins_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_bookings: {
        Row: {
          act_id: string
          created_at: string
          event_id: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          act_id: string
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          act_id?: string
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bookings_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_collaborators: {
        Row: {
          can_create_events: boolean
          can_edit_events: boolean
          profile_id: string
          venue_id: string
        }
        Insert: {
          can_create_events?: boolean
          can_edit_events?: boolean
          profile_id: string
          venue_id: string
        }
        Update: {
          can_create_events?: boolean
          can_edit_events?: boolean
          profile_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_collaborators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_collaborators_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          created_at: string
          has_pa: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          photo_url: string | null
          prefecture: string | null
          short_name: string | null
          url: string | null
          volume_preference: Database["public"]["Enums"]["volume_level"] | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          has_pa?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          photo_url?: string | null
          prefecture?: string | null
          short_name?: string | null
          url?: string | null
          volume_preference?: Database["public"]["Enums"]["volume_level"] | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          has_pa?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          prefecture?: string | null
          short_name?: string | null
          url?: string | null
          volume_preference?: Database["public"]["Enums"]["volume_level"] | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_act_public_page_payload: {
        Row: {
          act_id: string | null
          is_public: boolean | null
          payload: Json | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "act_public_pages_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: true
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
        ]
      }
      v_my_act_select_options: {
        Row: {
          id: string | null
          is_admin: boolean | null
          my_role: string | null
          name: string | null
        }
        Relationships: []
      }
      v_my_acts: {
        Row: {
          act_type: string | null
          id: string | null
          is_admin: boolean | null
          is_owner: boolean | null
          my_role: string | null
          name: string | null
          owner_profile_id: string | null
        }
        Relationships: []
      }
      v_my_performances: {
        Row: {
          act_id: string | null
          act_name: string | null
          booking_id: string | null
          created_at: string | null
          event_date: string | null
          event_id: string | null
          event_title: string | null
          id: string | null
          memo: string | null
          offer_id: string | null
          open_time: string | null
          profile_id: string | null
          start_time: string | null
          status: string | null
          status_changed_at: string | null
          status_reason: string | null
          venue_id: string | null
          venue_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musician_performances_act_id_fkey"
            columns: ["act_id"]
            isOneToOne: false
            referencedRelation: "acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "musician_performances_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_act_invite: {
        Args: { p_token: string }
        Returns: {
          out_act_id: string
          out_act_name: string
        }[]
      }
      accept_booking_and_create_performance: {
        Args: { p_actor_user_id: string; p_booking_id: string }
        Returns: string
      }
      accept_offer_and_create_performance: {
        Args: { p_actor_user_id: string; p_offer_id: string }
        Returns: string
      }
      create_act_invite: {
        Args: {
          p_act_id: string
          p_expires_in_days?: number
          p_grant_admin?: boolean
          p_max_uses?: number
          p_role?: string
        }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      create_offer_and_inbox_performance:
        | { Args: { p_act_id: string; p_event_id: string }; Returns: string }
        | {
            Args: {
              p_act_id: string
              p_event_id: string
              p_target_profile_id: string
            }
            Returns: string
          }
      decline_reconfirm_performance: {
        Args: { p_performance_id: string; p_user_id: string }
        Returns: undefined
      }
      extract_act_song_id_from_object_name: {
        Args: { p_name: string }
        Returns: string
      }
      get_act_invite_public: {
        Args: { p_token: string }
        Returns: {
          act_id: string
          act_name: string
          expires_at: string
          is_revoked: boolean
          max_uses: number
          used_count: number
        }[]
      }
      is_act_admin:
        | { Args: { p_act_id: string }; Returns: boolean }
        | { Args: { p_act_id: string; p_profile_id: string }; Returns: boolean }
      is_act_member: {
        Args: { p_act_id: string; p_uid: string }
        Returns: boolean
      }
      is_active_act_admin: {
        Args: { p_act_id: string; p_profile_id: string }
        Returns: boolean
      }
      is_active_act_member: {
        Args: { p_act_id: string; p_profile_id: string }
        Returns: boolean
      }
      organizer_cancel_performance: {
        Args: {
          p_actor_profile_id: string
          p_performance_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      reconfirm_performance: {
        Args: { p_performance_id: string; p_user_id: string }
        Returns: undefined
      }
      revoke_act_invite: { Args: { p_token: string }; Returns: undefined }
      update_event_core:
        | {
            Args: {
              p_changed_by_user_id: string
              p_event_id: string
              p_new_date: string
              p_new_venue_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_changed_by_user_id: string
              p_event_id: string
              p_new_date: string
              p_new_venue_id: string
            }
            Returns: undefined
          }
      update_personal_performance_core:
        | {
            Args: {
              p_actor_profile_id: string
              p_event_date: string
              p_performance_id: string
              p_venue_id: string
              p_venue_name: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_event_date: string
              p_performance_id: string
              p_venue_id: string
              p_venue_name: string
            }
            Returns: undefined
          }
    }
    Enums: {
      booking_status:
        | "upcoming"
        | "offered"
        | "accepted"
        | "completed"
        | "pending"
        | "cancelled"
      event_status: "open" | "pending" | "draft" | "matched" | "cancelled"
      offer_status: "pending" | "accepted" | "declined"
      user_role: "musician" | "venue"
      volume_level: "quiet" | "medium" | "loud"
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
      booking_status: [
        "upcoming",
        "offered",
        "accepted",
        "completed",
        "pending",
        "cancelled",
      ],
      event_status: ["open", "pending", "draft", "matched", "cancelled"],
      offer_status: ["pending", "accepted", "declined"],
      user_role: ["musician", "venue"],
      volume_level: ["quiet", "medium", "loud"],
    },
  },
} as const
