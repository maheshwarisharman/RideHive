/**
 * Database schema type definition placeholder.
 * Will be replaced with generated types from `supabase gen types`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          ride_count: number;
          rating_avg: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          ride_count?: number;
          rating_avg?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          ride_count?: number;
          rating_avg?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_private: {
        Row: {
          user_id: string;
          phone: string | null;
          upi_id: string | null;
          late_cancellations: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          phone?: string | null;
          upi_id?: string | null;
          late_cancellations?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          phone?: string | null;
          upi_id?: string | null;
          late_cancellations?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          type: 'campus' | 'airport' | 'metro' | 'railway' | 'mall' | 'other';
          place_id: string | null;
          is_campus: boolean;
          latitude: number;
          longitude: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'campus' | 'airport' | 'metro' | 'railway' | 'mall' | 'other';
          place_id?: string | null;
          is_campus?: boolean;
          latitude: number;
          longitude: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'campus' | 'airport' | 'metro' | 'railway' | 'mall' | 'other';
          place_id?: string | null;
          is_campus?: boolean;
          latitude?: number;
          longitude?: number;
          created_at?: string;
        };
      };
      pools: {
        Row: {
          id: string;
          host_id: string;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          destination_place_id: string | null;
          route_polyline: string | null;
          route_distance_m: number | null;
          route_duration_s: number | null;
          departs_at: string;
          flexibility_minutes: number;
          total_seats: number;
          seats_taken: number;
          join_mode: 'instant' | 'approval';
          status: 'open' | 'closed' | 'booked' | 'completed' | 'cancelled' | 'expired';
          note: string | null;
          estimated_fare_min: number;
          estimated_fare_max: number;
          final_fare: number | null;
          cab_provider: 'uber' | 'ola' | 'rapido' | 'other' | null;
          cab_vehicle_number: string | null;
          cab_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          destination_place_id?: string | null;
          route_polyline?: string | null;
          route_distance_m?: number | null;
          route_duration_s?: number | null;
          departs_at: string;
          flexibility_minutes?: number;
          total_seats?: number;
          seats_taken?: number;
          join_mode?: 'instant' | 'approval';
          status?: 'open' | 'closed' | 'booked' | 'completed' | 'cancelled' | 'expired';
          note?: string | null;
          estimated_fare_min: number;
          estimated_fare_max: number;
          final_fare?: number | null;
          cab_provider?: 'uber' | 'ola' | 'rapido' | 'other' | null;
          cab_vehicle_number?: string | null;
          cab_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          origin_name?: string;
          origin_latitude?: number;
          origin_longitude?: number;
          destination_name?: string;
          destination_latitude?: number;
          destination_longitude?: number;
          destination_place_id?: string | null;
          route_polyline?: string | null;
          route_distance_m?: number | null;
          route_duration_s?: number | null;
          departs_at?: string;
          flexibility_minutes?: number;
          total_seats?: number;
          seats_taken?: number;
          join_mode?: 'instant' | 'approval';
          status?: 'open' | 'closed' | 'booked' | 'completed' | 'cancelled' | 'expired';
          note?: string | null;
          estimated_fare_min?: number;
          estimated_fare_max?: number;
          final_fare?: number | null;
          cab_provider?: 'uber' | 'ola' | 'rapido' | 'other' | null;
          cab_vehicle_number?: string | null;
          cab_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pool_members: {
        Row: {
          id: string;
          pool_id: string;
          user_id: string;
          role: 'host' | 'member';
          status: 'pending' | 'confirmed' | 'left' | 'removed';
          joined_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          user_id: string;
          role?: 'host' | 'member';
          status?: 'pending' | 'confirmed' | 'left' | 'removed';
          joined_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          user_id?: string;
          role?: 'host' | 'member';
          status?: 'pending' | 'confirmed' | 'left' | 'removed';
          joined_at?: string;
        };
      };
      pool_messages: {
        Row: {
          id: string;
          pool_id: string;
          sender_id: string | null;
          body: string;
          kind: 'user' | 'system';
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          sender_id?: string | null;
          body: string;
          kind?: 'user' | 'system';
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          sender_id?: string | null;
          body?: string;
          kind?: 'user' | 'system';
          created_at?: string;
        };
      };
      settlements: {
        Row: {
          id: string;
          pool_id: string;
          payer_id: string;
          amount_paise: number;
          status: 'pending' | 'marked_paid' | 'confirmed';
          marked_paid_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          payer_id: string;
          amount_paise: number;
          status?: 'pending' | 'marked_paid' | 'confirmed';
          marked_paid_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          payer_id?: string;
          amount_paise?: number;
          status?: 'pending' | 'marked_paid' | 'confirmed';
          marked_paid_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ride_alerts: {
        Row: {
          id: string;
          user_id: string;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          window_start: string;
          window_end: string;
          seats: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          origin_name: string;
          origin_latitude: number;
          origin_longitude: number;
          destination_name: string;
          destination_latitude: number;
          destination_longitude: number;
          window_start: string;
          window_end: string;
          seats?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          origin_name?: string;
          origin_latitude?: number;
          origin_longitude?: number;
          destination_name?: string;
          destination_latitude?: number;
          destination_longitude?: number;
          window_start?: string;
          window_end?: string;
          seats?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
      };
      device_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device_type: 'ios' | 'android' | 'web';
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device_type: 'ios' | 'android' | 'web';
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          device_type?: 'ios' | 'android' | 'web';
          updated_at?: string;
        };
      };
      notification_prefs: {
        Row: {
          user_id: string;
          pool_updates: boolean;
          chat_messages: boolean;
          departure_reminders: boolean;
          ride_alerts: boolean;
          payment_updates: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pool_updates?: boolean;
          chat_messages?: boolean;
          departure_reminders?: boolean;
          ride_alerts?: boolean;
          payment_updates?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          pool_updates?: boolean;
          chat_messages?: boolean;
          departure_reminders?: boolean;
          ride_alerts?: boolean;
          payment_updates?: boolean;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string | null;
          reported_pool_id: string | null;
          reason: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_pool_id?: string | null;
          reason: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string | null;
          reported_pool_id?: string | null;
          reason?: string;
          details?: string | null;
          created_at?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          pool_id: string;
          rater_id: string;
          ratee_id: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pool_id: string;
          rater_id: string;
          ratee_id: string;
          score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pool_id?: string;
          rater_id?: string;
          ratee_id?: string;
          score?: number;
          created_at?: string;
        };
      };
      demand_events: {
        Row: {
          id: string;
          origin_name: string;
          destination_name: string;
          window_start: string;
          window_end: string;
          seats: number;
          results_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          origin_name: string;
          destination_name: string;
          window_start: string;
          window_end: string;
          seats: number;
          results_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          origin_name?: string;
          destination_name?: string;
          window_start?: string;
          window_end?: string;
          seats?: number;
          results_count?: number;
          created_at?: string;
        };
      };
      app_config: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
        };
      };
    };
    Functions: {
      search_pools: {
        Args: {
          p_origin_lat: number;
          p_origin_lng: number;
          p_dest_lat: number;
          p_dest_lng: number;
          p_window_start: string;
          p_window_end: string;
          p_seats_needed?: number;
          p_user_id?: string | null;
        };
        Returns: {
          id: string;
          host_id: string;
          host_name: string;
          host_avatar_url: string | null;
          host_rating_avg: number;
          origin_name: string;
          destination_name: string;
          departs_at: string;
          flexibility_minutes: number;
          total_seats: number;
          seats_taken: number;
          seats_left: number;
          status: string;
          join_mode: string;
          estimated_fare_per_person: number;
          time_diff_minutes: number;
          dest_distance_m: number;
        }[];
      };
      create_pool: {
        Args: {
          p_origin_name: string;
          p_origin_lat: number;
          p_origin_lng: number;
          p_destination_name: string;
          p_dest_lat: number;
          p_dest_lng: number;
          p_destination_place_id?: string | null;
          p_departs_at: string;
          p_flexibility_minutes: number;
          p_total_seats: number;
          p_join_mode: string;
          p_note?: string | null;
          p_estimated_fare_min: number;
          p_estimated_fare_max: number;
          p_route_polyline?: string | null;
          p_route_distance_m?: number | null;
          p_route_duration_s?: number | null;
        };
        Returns: string;
      };
      join_pool: {
        Args: {
          p_pool_id: string;
        };
        Returns: {
          success: boolean;
          status: 'confirmed' | 'pending';
          message: string;
        };
      };
      approve_member: {
        Args: {
          p_pool_id: string;
          p_target_user_id: string;
        };
        Returns: boolean;
      };
      leave_pool: {
        Args: {
          p_pool_id: string;
        };
        Returns: boolean;
      };
      close_pool: {
        Args: {
          p_pool_id: string;
        };
        Returns: boolean;
      };
      mark_booked: {
        Args: {
          p_pool_id: string;
          p_provider: string;
          p_vehicle_number?: string | null;
          p_note?: string | null;
        };
        Returns: boolean;
      };
      cancel_pool: {
        Args: {
          p_pool_id: string;
        };
        Returns: boolean;
      };
      complete_pool: {
        Args: {
          p_pool_id: string;
          p_final_fare_paise: number;
        };
        Returns: boolean;
      };
      mark_settlement_paid: {
        Args: {
          p_pool_id: string;
        };
        Returns: boolean;
      };
      confirm_settlement: {
        Args: {
          p_pool_id: string;
          p_payer_id: string;
        };
        Returns: boolean;
      };
      get_pool_member_contacts: {
        Args: {
          p_pool_id: string;
        };
        Returns: {
          user_id: string;
          full_name: string;
          role: string;
          phone: string | null;
          upi_id: string | null;
        }[];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
