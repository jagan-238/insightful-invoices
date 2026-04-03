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
      invoice_formats: {
        Row: {
          avg_confidence: number | null
          created_at: string
          field_mapping: Json | null
          format_hash: string
          id: string
          sample_prompt: string | null
          times_seen: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          avg_confidence?: number | null
          created_at?: string
          field_mapping?: Json | null
          format_hash: string
          id?: string
          sample_prompt?: string | null
          times_seen?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          avg_confidence?: number | null
          created_at?: string
          field_mapping?: Json | null
          format_hash?: string
          id?: string
          sample_prompt?: string | null
          times_seen?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          quantity: number | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          confidence_score: number | null
          created_at: string
          currency: string | null
          due_date: string | null
          duplicate_of: string | null
          error_message: string | null
          file_name: string
          file_path: string
          file_type: string
          file_url: string | null
          format_hash: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_duplicate: boolean | null
          raw_extracted_json: Json | null
          raw_extracted_text: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
          vendor_name: string | null
          vendor_normalized: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          duplicate_of?: string | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_type?: string
          file_url?: string | null
          format_hash?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_duplicate?: boolean | null
          raw_extracted_json?: Json | null
          raw_extracted_text?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          vendor_name?: string | null
          vendor_normalized?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          duplicate_of?: string | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          file_url?: string | null
          format_hash?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_duplicate?: boolean | null
          raw_extracted_json?: Json | null
          raw_extracted_text?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
          vendor_normalized?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
