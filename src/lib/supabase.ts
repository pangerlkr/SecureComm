import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          created_at: string;
          last_activity: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          last_activity?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          last_activity?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          room_id: string;
          user_name: string;
          is_online: boolean;
          joined_at: string;
          last_seen: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_name: string;
          is_online?: boolean;
          joined_at?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_name?: string;
          is_online?: boolean;
          joined_at?: string;
          last_seen?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          sender: string;
          content: string;
          type: string;
          file_name: string | null;
          file_size: number | null;
          encrypted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender: string;
          content: string;
          type?: string;
          file_name?: string | null;
          file_size?: number | null;
          encrypted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender?: string;
          content?: string;
          type?: string;
          file_name?: string | null;
          file_size?: number | null;
          encrypted?: boolean;
          created_at?: string;
        };
      };
      typing_indicators: {
        Row: {
          id: string;
          room_id: string;
          user_name: string;
          is_typing: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_name: string;
          is_typing?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_name?: string;
          is_typing?: boolean;
          updated_at?: string;
        };
      };
    };
  };
}
