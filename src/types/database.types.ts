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
      users: {
        Row: {
          id: string
          email: string
          plan: string
          credits: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          plan?: string
          credits?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: string
          credits?: number
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          marketplace: string
          product_url: string
          title: string
          rating: number | null
          total_reviews: number | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          marketplace: string
          product_url: string
          title: string
          rating?: number | null
          total_reviews?: number | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          marketplace?: string
          product_url?: string
          title?: string
          rating?: number | null
          total_reviews?: number | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      analyses: {
        Row: {
          id: string
          product_id: string
          positive_points: Json
          negative_points: Json
          frequent_words: Json
          buyer_persona: string
          actionable_tips: Json
          sentiment_score: number
          summary: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          positive_points: Json
          negative_points: Json
          frequent_words: Json
          buyer_persona: string
          actionable_tips: Json
          sentiment_score: number
          summary: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          positive_points?: Json
          negative_points?: Json
          frequent_words?: Json
          buyer_persona?: string
          actionable_tips?: Json
          sentiment_score?: number
          summary?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          package_id: string
          credits: number
          amount: number
          currency: string
          status: string
          provider: string
          provider_payment_id: string | null
          conversation_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          credits: number
          amount: number
          currency?: string
          status?: string
          provider?: string
          provider_payment_id?: string | null
          conversation_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          credits?: number
          amount?: number
          currency?: string
          status?: string
          provider?: string
          provider_payment_id?: string | null
          conversation_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_user_credits: {
        Args: { p_user_id: string; p_amount: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Kullanışlı yardımcı tipler
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type User = Tables<"users">
export type Product = Tables<"products">
export type Analysis = Tables<"analyses">
export type Payment = Tables<"payments">
