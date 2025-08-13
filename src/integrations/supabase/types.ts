export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      annual_budgets: {
        Row: {
          allocated_budget: number
          created_at: string
          created_by: string
          id: string
          remaining_budget: number | null
          status: string
          total_budget: number
          updated_at: string
          used_budget: number
          year: number
        }
        Insert: {
          allocated_budget?: number
          created_at?: string
          created_by: string
          id?: string
          remaining_budget?: number | null
          status?: string
          total_budget?: number
          updated_at?: string
          used_budget?: number
          year: number
        }
        Update: {
          allocated_budget?: number
          created_at?: string
          created_by?: string
          id?: string
          remaining_budget?: number | null
          status?: string
          total_budget?: number
          updated_at?: string
          used_budget?: number
          year?: number
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          branch_name: string
          created_at: string | null
          email: string | null
          id: string
          manager_name: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          branch_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          branch_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          manager_name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          allocated_amount: number
          budget_id: string
          category_name: string
          created_at: string
          id: string
          remaining_amount: number | null
          updated_at: string
          used_amount: number
        }
        Insert: {
          allocated_amount?: number
          budget_id: string
          category_name: string
          created_at?: string
          id?: string
          remaining_amount?: number | null
          updated_at?: string
          used_amount?: number
        }
        Update: {
          allocated_amount?: number
          budget_id?: string
          category_name?: string
          created_at?: string
          id?: string
          remaining_amount?: number | null
          updated_at?: string
          used_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "annual_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_expenses: {
        Row: {
          amount: number
          budget_id: string
          category_id: string | null
          created_at: string
          created_by: string
          description: string
          expense_date: string
          expense_type: string
          id: string
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          budget_id: string
          category_id?: string | null
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          expense_type?: string
          id?: string
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          expense_type?: string
          id?: string
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "annual_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
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
      inventory: {
        Row: {
          branch_id: string | null
          created_at: string | null
          current_stock: number
          id: string
          item_id: string
          last_updated: string | null
          max_stock_level: number
          min_stock_level: number
          unit_cost: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          current_stock?: number
          id?: string
          item_id: string
          last_updated?: string | null
          max_stock_level?: number
          min_stock_level?: number
          unit_cost?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          current_stock?: number
          id?: string
          item_id?: string
          last_updated?: string | null
          max_stock_level?: number
          min_stock_level?: number
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          specifications: Json | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          specifications?: Json | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          specifications?: Json | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          order_id: string
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          order_id: string
          quantity: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          order_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery: string | null
          created_at: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_number: string
          request_id: string
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number: string
          request_id: string
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          request_id?: string
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_name: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          supplier_company: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          supplier_company?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          supplier_company?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      request_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          request_id: string
          specifications: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          request_id: string
          specifications?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          request_id?: string
          specifications?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "supply_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          carrier: string | null
          created_at: string | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_id: string
          shipment_number: string
          shipped_date: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery?: string | null
          carrier?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id: string
          shipment_number: string
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery?: string | null
          carrier?: string | null
          created_at?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          shipment_number?: string
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          company_name: string
          contact_person: string
          created_at: string | null
          email: string
          id: string
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          company_name: string
          contact_person: string
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          company_name?: string
          contact_person?: string
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supply_requests: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          branch_id: string
          created_at: string | null
          description: string | null
          id: string
          notes: string | null
          priority: string | null
          request_number: string
          requested_by: string
          requested_date: string | null
          required_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          branch_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          request_number: string
          requested_by: string
          requested_date?: string | null
          required_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          branch_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          request_number?: string
          requested_by?: string
          requested_date?: string | null
          required_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "branch" | "supplier"
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
      app_role: ["admin", "branch", "supplier"],
    },
  },
} as const
