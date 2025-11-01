export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      travel_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          start_date: string | null;  // 可选：支持相对日期模式
          end_date: string | null;    // 可选：支持相对日期模式
          days: number | null;        // 行程天数
          budget: number | null;
          preferences: Json;
          itinerary: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination: string;
          start_date?: string | null;  // 可选
          end_date?: string | null;    // 可选
          days?: number | null;        // 可选
          budget?: number | null;
          preferences?: Json;
          itinerary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          days?: number | null;
          budget?: number | null;
          preferences?: Json;
          itinerary?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          plan_id: string;
          category: string;
          amount: number;
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          category: string;
          amount: number;
          description?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          category?: string;
          amount?: number;
          description?: string | null;
          date?: string;
          created_at?: string;
        };
      };
    };
  };
}

