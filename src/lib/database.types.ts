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
      voice_talents: {
        Row: {
          id: string
          name: string
          language_id: string
          category_id: string
          accent: string
          description: string
          sample_url: string
          hourly_rate: number
          lat: number
          lng: number
          created_at: string
          updated_at: string
          pattern: string
          emotion: string
          region: string
          time_slot: string
        }
        Insert: {
          id?: string
          name: string
          language_id: string
          category_id: string
          accent: string
          description: string
          sample_url: string
          hourly_rate: number
          lat: number
          lng: number
          created_at?: string
          updated_at?: string
          pattern: string
          emotion: string
          region: string
          time_slot: string
        }
        Update: {
          id?: string
          name?: string
          language_id?: string
          category_id?: string
          accent?: string
          description?: string
          sample_url?: string
          hourly_rate?: number
          lat?: number
          lng?: number
          created_at?: string
          updated_at?: string
          pattern?: string
          emotion?: string
          region?: string
          time_slot?: string
        }
      }
      languages: {
        Row: {
          id: string
          name: string
          code: string
        }
        Insert: {
          id?: string
          name: string
          code: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
        }
      }
      voice_categories: {
        Row: {
          id: string
          name: string
          description: string
        }
        Insert: {
          id?: string
          name: string
          description: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
        }
      }
      reviews: {
        Row: {
          id: string
          voice_talent_id: string
          client_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          voice_talent_id: string
          client_id: string
          rating: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          voice_talent_id?: string
          client_id?: string
          rating?: number
          comment?: string
          created_at?: string
        }
      }
    }
  }
}
