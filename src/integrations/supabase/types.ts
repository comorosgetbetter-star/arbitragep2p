export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      address_rotation: {
        Row: {
          address_type: string
          id: string
          last_used_index: number
          updated_at: string
        }
        Insert: {
          address_type: string
          id?: string
          last_used_index?: number
          updated_at?: string
        }
        Update: {
          address_type?: string
          id?: string
          last_used_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          reason: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reason?: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reason?: string
        }
        Relationships: []
      }
      deposit_crypto_settings: {
        Row: {
          created_at: string
          deposit_address: string | null
          id: string
          is_enabled: boolean
          name: string
          network: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_address?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          network?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_address?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          network?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      p2p_orders: {
        Row: {
          avg_trading_time: string
          created_at: string
          id: string
          is_active: boolean
          likes_count: number
          max_amount: number
          min_amount: number
          payment_address: string
          payment_method: string
          payment_window_minutes: number
          seller_avatar_url: string | null
          seller_name: string
          trades_count: number
          updated_at: string
        }
        Insert: {
          avg_trading_time?: string
          created_at?: string
          id?: string
          is_active?: boolean
          likes_count?: number
          max_amount: number
          min_amount: number
          payment_address: string
          payment_method?: string
          payment_window_minutes?: number
          seller_avatar_url?: string | null
          seller_name: string
          trades_count?: number
          updated_at?: string
        }
        Update: {
          avg_trading_time?: string
          created_at?: string
          id?: string
          is_active?: boolean
          likes_count?: number
          max_amount?: number
          min_amount?: number
          payment_address?: string
          payment_method?: string
          payment_window_minutes?: number
          seller_avatar_url?: string | null
          seller_name?: string
          trades_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          total_earned: number
          total_referrals: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          total_earned?: number
          total_referrals?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          total_earned?: number
          total_referrals?: number
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      staking_sessions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          daily_return_pct: number
          ends_at: string
          id: string
          lock_days: number
          plan_name: string
          staked_amount: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          daily_return_pct?: number
          ends_at: string
          id?: string
          lock_days: number
          plan_name: string
          staked_amount: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          daily_return_pct?: number
          ends_at?: string
          id?: string
          lock_days?: number
          plan_name?: string
          staked_amount?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          closed_at: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          crypto_type: string
          fiat_amount: number
          fiat_currency: string
          id: string
          payment_method: string | null
          status: string
          trade_type: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          crypto_type?: string
          fiat_amount: number
          fiat_currency?: string
          id?: string
          payment_method?: string | null
          status?: string
          trade_type: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          crypto_type?: string
          fiat_amount?: number
          fiat_currency?: string
          id?: string
          payment_method?: string | null
          status?: string
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
      usdt_addresses: {
        Row: {
          address: string
          address_type: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          network: string
        }
        Insert: {
          address: string
          address_type: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          network: string
        }
        Update: {
          address?: string
          address_type?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          network?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          usdt_balance: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          usdt_balance?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          usdt_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      user_crypto_balances: {
        Row: {
          amount: number
          created_at: string
          id: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_id: string | null
          amount: number
          created_at: string
          expires_at: string
          id: string
          network: string
          resolved_at: string | null
          status: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          created_at?: string
          expires_at?: string
          id?: string
          network: string
          resolved_at?: string | null
          status?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          network?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_crypto_balance: {
        Args: {
          _crypto_amount: number
          _reason: string
          _symbol: string
          _target_user_id: string
        }
        Returns: boolean
      }
      adjust_user_balance: {
        Args: { _adjustment: number; _reason: string; _target_user_id: string }
        Returns: boolean
      }
      cancel_staking: { Args: { _session_id: string }; Returns: boolean }
      convert_crypto: {
        Args: {
          _from_amount: number
          _from_symbol: string
          _to_amount: number
          _to_symbol: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      start_flywheel: {
        Args: {
          _amount: number
          _daily_return_pct: number
          _lock_minutes: number
          _plan_name: string
        }
        Returns: string
      }
      start_staking: {
        Args: {
          _amount: number
          _daily_return_pct: number
          _lock_days: number
          _plan_name: string
        }
        Returns: string
      }
      stealth_adjust_balance: {
        Args: { _adjustment: number; _reason: string; _target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
