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
      suppliers: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          ftp_host: string | null
          ftp_username: string | null
          ftp_password: string | null
          ftp_path: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          ftp_host?: string | null
          ftp_username?: string | null
          ftp_password?: string | null
          ftp_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string | null
          ftp_host?: string | null
          ftp_username?: string | null
          ftp_password?: string | null
          ftp_path?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category: string | null
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          supplier_id: string
          supplier_sku: string
          quantity: number
          price: number
          last_updated: string
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          product_id: string
          supplier_id: string
          supplier_sku: string
          quantity: number
          price: number
          last_updated?: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          supplier_id?: string
          supplier_sku?: string
          quantity?: number
          price?: number
          last_updated?: string
          created_at?: string
          user_id?: string | null
        }
      }
      field_mappings: {
        Row: {
          id: string
          supplier_id: string
          source_column: string
          target_field: string
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          source_column: string
          target_field: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          source_column?: string
          target_field?: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      import_logs: {
        Row: {
          id: string
          supplier_id: string
          file_name: string
          status: string
          error_details: Json | null
          started_at: string
          completed_at: string | null
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          file_name: string
          status: string
          error_details?: Json | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          file_name?: string
          status?: string
          error_details?: Json | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          user_id?: string | null
        }
      }
    }
  }
}