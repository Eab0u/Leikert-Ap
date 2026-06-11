export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string };
        Insert: { id: string; username: string; created_at?: string };
        Update: { id?: string; username?: string; created_at?: string };
        Relationships: [];
      };
      friendships: {
        Row: {
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      checkins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          rating: number;
          chips: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          rating: number;
          chips?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          rating?: number;
          chips?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          body: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          body?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          body?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      are_friends: {
        Args: { user_a: string; user_b: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
