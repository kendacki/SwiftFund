/**
 * Supabase database types for SwiftFund.
 * Only tables we use are defined here. Add more tables when you create them in Supabase.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          creator_id: string;
          creator_name: string;
          handle: string;
          title: string;
          description: string | null;
          goal_amount: number;
          amount_raised: number;
          image_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          tags: string[] | null;
          earnings_distribution_percent: number | null;
          account_info_pdf_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      creator_activity: {
        Row: {
          id: string;
          creator_id: string;
          type: string;
          amount: number;
          project_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          type: string;
          amount: number;
          project_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['creator_activity']['Insert']>;
      };
      /** Placeholder definition so TypeScript has a type for funding_requests. Create this table in Supabase if you use it. */
      funding_requests: {
        Row: { id: string; [key: string]: Json };
        Insert: { id?: string; [key: string]: Json };
        Update: { [key: string]: Json };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
