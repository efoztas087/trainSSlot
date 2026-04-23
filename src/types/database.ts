export type UserRole = 'trainer' | 'client'
export type ClientStatus = 'active' | 'inactive' | 'needs_attention'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'

type Rel = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      trainers: {
        Row: {
          id: string
          name: string
          bio: string | null
          mollie_api_key: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          bio?: string | null
          mollie_api_key?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          bio?: string | null
          mollie_api_key?: string | null
        }
        Relationships: Rel[]
      }
      clients: {
        Row: {
          id: string
          trainer_id: string
          name: string
          phone: string | null
          status: ClientStatus
          goal: string | null
          joined_at: string
        }
        Insert: {
          id: string
          trainer_id: string
          name: string
          phone?: string | null
          status?: ClientStatus
          goal?: string | null
          joined_at?: string
        }
        Update: {
          name?: string
          phone?: string | null
          status?: ClientStatus
          goal?: string | null
        }
        Relationships: Rel[]
      }
      packages: {
        Row: {
          id: string
          trainer_id: string
          name: string
          description: string | null
          price_cents: number
          currency: string
          duration_weeks: number
          sessions_total: number
          is_active: boolean
        }
        Insert: {
          id?: string
          trainer_id: string
          name: string
          description?: string | null
          price_cents: number
          currency?: string
          duration_weeks: number
          sessions_total: number
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          price_cents?: number
          duration_weeks?: number
          sessions_total?: number
          is_active?: boolean
        }
        Relationships: Rel[]
      }
      payments: {
        Row: {
          id: string
          client_id: string
          package_id: string
          mollie_order_id: string | null
          amount_cents: number
          currency: string
          status: PaymentStatus
          method: string
          checkout_url: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          package_id: string
          mollie_order_id?: string | null
          amount_cents: number
          currency?: string
          status?: PaymentStatus
          method?: string
          checkout_url?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          mollie_order_id?: string | null
          status?: PaymentStatus
          checkout_url?: string | null
          paid_at?: string | null
        }
        Relationships: Rel[]
      }
      progress_entries: {
        Row: {
          id: string
          client_id: string
          trainer_id: string
          date: string
          weight_kg: number | null
          body_fat_pct: number | null
          notes: string | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          trainer_id: string
          date: string
          weight_kg?: number | null
          body_fat_pct?: number | null
          notes?: string | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          weight_kg?: number | null
          body_fat_pct?: number | null
          notes?: string | null
          photo_url?: string | null
        }
        Relationships: Rel[]
      }
      client_packages: {
        Row: {
          id: string
          client_id: string
          package_id: string
          assigned_at: string
          expires_at: string | null
          sessions_used: number
        }
        Insert: {
          id?: string
          client_id: string
          package_id: string
          assigned_at?: string
          expires_at?: string | null
          sessions_used?: number
        }
        Update: {
          expires_at?: string | null
          sessions_used?: number
        }
        Relationships: Rel[]
      }
      checkins: {
        Row: {
          id: string
          client_id: string
          date: string
          mood: number | null
          energy: number | null
          sleep_hrs: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          mood?: number | null
          energy?: number | null
          sleep_hrs?: number | null
          notes?: string | null
        }
        Update: {
          mood?: number | null
          energy?: number | null
          sleep_hrs?: number | null
          notes?: string | null
        }
        Relationships: Rel[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
