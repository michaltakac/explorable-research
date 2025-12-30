export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          email: string
          tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          tier?: string
          created_at?: string
          updated_at?: string
        }
      }
      users_teams: {
        Row: {
          id: string
          user_id: string
          team_id: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          is_default?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          team_id: string | null
          title: string
          description: string | null
          template: string
          code: string
          file_path: string | null
          port: number | null
          additional_dependencies: Json
          model_provider: string | null
          model_name: string | null
          sandbox_id: string | null
          sandbox_url: string | null
          execution_status: string
          is_published: boolean
          published_url: string | null
          short_url_id: string | null
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string | null
          title: string
          description?: string | null
          template: string
          code: string
          file_path?: string | null
          port?: number | null
          additional_dependencies?: Json
          model_provider?: string | null
          model_name?: string | null
          sandbox_id?: string | null
          sandbox_url?: string | null
          execution_status?: string
          is_published?: boolean
          published_url?: string | null
          short_url_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string | null
          title?: string
          description?: string | null
          template?: string
          code?: string
          file_path?: string | null
          port?: number | null
          additional_dependencies?: Json
          model_provider?: string | null
          model_name?: string | null
          sandbox_id?: string | null
          sandbox_url?: string | null
          execution_status?: string
          is_published?: boolean
          published_url?: string | null
          short_url_id?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
