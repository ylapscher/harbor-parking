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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          apartment_number: string
          phone_number: string | null
          is_approved: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          apartment_number: string
          phone_number?: string | null
          is_approved?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          apartment_number?: string
          phone_number?: string | null
          is_approved?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      parking_spots: {
        Row: {
          id: string
          spot_number: string
          owner_id: string
          building_section: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          spot_number: string
          owner_id: string
          building_section?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          spot_number?: string
          owner_id?: string
          building_section?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      availabilities: {
        Row: {
          id: string
          spot_id: string
          start_time: string
          end_time: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          spot_id: string
          start_time: string
          end_time: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          spot_id?: string
          start_time?: string
          end_time?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          availability_id: string
          claimer_id: string
          status: 'pending' | 'confirmed' | 'expired' | 'cancelled'
          claimed_at: string
          expires_at: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          availability_id: string
          claimer_id: string
          status?: 'pending' | 'confirmed' | 'expired' | 'cancelled'
          claimed_at?: string
          expires_at: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          availability_id?: string
          claimer_id?: string
          status?: 'pending' | 'confirmed' | 'expired' | 'cancelled'
          claimed_at?: string
          expires_at?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}