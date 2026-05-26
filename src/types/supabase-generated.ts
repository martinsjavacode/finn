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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          monthly_limit: number
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          monthly_limit: number
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          monthly_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_fkey"
            columns: ["category"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          card: string
          created_at: string | null
          id: string
          month: string
          paid_amount: number
        }
        Insert: {
          card: string
          created_at?: string | null
          id?: string
          month: string
          paid_amount?: number
        }
        Update: {
          card?: string
          created_at?: string | null
          id?: string
          month?: string
          paid_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_card"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["name"]
          },
        ]
      }
      cards: {
        Row: {
          active: boolean
          closing_day: number
          closing_rule: Database["public"]["Enums"]["closing_rule_type"]
          color: string | null
          created_at: string | null
          credit_limit: number
          days_before_due: number
          due_day: number
          id: string
          label: string
          name: string
        }
        Insert: {
          active?: boolean
          closing_day?: number
          closing_rule?: Database["public"]["Enums"]["closing_rule_type"]
          color?: string | null
          created_at?: string | null
          credit_limit?: number
          days_before_due?: number
          due_day?: number
          id?: string
          label: string
          name: string
        }
        Update: {
          active?: boolean
          closing_day?: number
          closing_rule?: Database["public"]["Enums"]["closing_rule_type"]
          color?: string | null
          created_at?: string | null
          credit_limit?: number
          days_before_due?: number
          due_day?: number
          id?: string
          label?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          label: string
          name: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          label: string
          name: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          label?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          amount: number
          card: string | null
          category: string | null
          created_at: string | null
          current_installment: number | null
          description: string
          id: string
          installment_purchase_id: string | null
          month: string
          owner: string
          paid: boolean
          payment_method: Database["public"]["Enums"]["payment_method"]
          total_installments: number | null
          type: Database["public"]["Enums"]["entry_type"]
        }
        Insert: {
          amount: number
          card?: string | null
          category?: string | null
          created_at?: string | null
          current_installment?: number | null
          description: string
          id?: string
          installment_purchase_id?: string | null
          month: string
          owner?: string
          paid?: boolean
          payment_method: Database["public"]["Enums"]["payment_method"]
          total_installments?: number | null
          type?: Database["public"]["Enums"]["entry_type"]
        }
        Update: {
          amount?: number
          card?: string | null
          category?: string | null
          created_at?: string | null
          current_installment?: number | null
          description?: string
          id?: string
          installment_purchase_id?: string | null
          month?: string
          owner?: string
          paid?: boolean
          payment_method?: Database["public"]["Enums"]["payment_method"]
          total_installments?: number | null
          type?: Database["public"]["Enums"]["entry_type"]
        }
        Relationships: [
          {
            foreignKeyName: "entries_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "entries_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_installment_purchase_id_fkey"
            columns: ["installment_purchase_id"]
            isOneToOne: false
            referencedRelation: "installment_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_purchases: {
        Row: {
          card: string | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          installments: number
          owner: string
          start_month: string
          target: Database["public"]["Enums"]["payment_method"]
          total_amount: number
        }
        Insert: {
          card?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          installments: number
          owner?: string
          start_month: string
          target: Database["public"]["Enums"]["payment_method"]
          total_amount: number
        }
        Update: {
          card?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          installments?: number
          owner?: string
          start_month?: string
          target?: Database["public"]["Enums"]["payment_method"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_installment_card"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "installment_purchases_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          id: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          resource?: string
        }
        Relationships: []
      }
      recurring_templates: {
        Row: {
          active: boolean
          amount: number
          card: string | null
          category: string | null
          created_at: string | null
          day: number
          description: string
          id: string
          owner: string
          target: Database["public"]["Enums"]["payment_method"]
          type: string
        }
        Insert: {
          active?: boolean
          amount: number
          card?: string | null
          category?: string | null
          created_at?: string | null
          day?: number
          description: string
          id?: string
          owner?: string
          target: Database["public"]["Enums"]["payment_method"]
          type: string
        }
        Update: {
          active?: boolean
          amount?: number
          card?: string | null
          category?: string | null
          created_at?: string | null
          day?: number
          description?: string
          id?: string
          owner?: string
          target?: Database["public"]["Enums"]["payment_method"]
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recurring_card"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "recurring_templates_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          activated: boolean
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          role_id: string
        }
        Insert: {
          activated?: boolean
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          role_id: string
        }
        Update: {
          activated?: boolean
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_recurring: { Args: { target_month: string }; Returns: undefined }
      get_projection: {
        Args: { months_ahead?: number }
        Returns: {
          installments: number
          month: string
          recurring: number
        }[]
      }
    }
    Enums: {
      closing_rule_type: "fixed" | "relative"
      entry_type: "expense" | "income"
      payment_method: "pix" | "credit_card"
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
      closing_rule_type: ["fixed", "relative"],
      entry_type: ["expense", "income"],
      payment_method: ["pix", "credit_card"],
    },
  },
} as const
