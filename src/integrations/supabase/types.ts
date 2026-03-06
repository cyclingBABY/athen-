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
      book_copies: {
        Row: {
          book_id: string
          condition: string | null
          copy_id: string
          copy_number: number
          created_at: string
          id: string
          notes: string | null
          qr_code_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          book_id: string
          condition?: string | null
          copy_id: string
          copy_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          qr_code_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          condition?: string | null
          copy_id?: string
          copy_number?: number
          created_at?: string
          id?: string
          notes?: string | null
          qr_code_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_copies_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_recommendations: {
        Row: {
          admin_notes: string | null
          author: string
          created_at: string
          id: string
          isbn: string | null
          lecturer_id: string
          reason: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          author: string
          created_at?: string
          id?: string
          isbn?: string | null
          lecturer_id: string
          reason?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          author?: string
          created_at?: string
          id?: string
          isbn?: string | null
          lecturer_id?: string
          reason?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          available_copies: number
          barcode: string | null
          category: string
          cover_color: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          digital_file_type: string | null
          digital_file_url: string | null
          id: string
          isbn: string | null
          publish_year: number | null
          shelf_location: string | null
          status: string
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author: string
          available_copies?: number
          barcode?: string | null
          category?: string
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          digital_file_type?: string | null
          digital_file_url?: string | null
          id?: string
          isbn?: string | null
          publish_year?: number | null
          shelf_location?: string | null
          status?: string
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author?: string
          available_copies?: number
          barcode?: string | null
          category?: string
          cover_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          digital_file_type?: string | null
          digital_file_url?: string | null
          id?: string
          isbn?: string | null
          publish_year?: number | null
          shelf_location?: string | null
          status?: string
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: []
      }
      borrow_records: {
        Row: {
          book_id: string
          borrow_date: string
          copy_id: string
          created_at: string
          due_date: string
          id: string
          renewed_count: number
          return_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          book_id: string
          borrow_date?: string
          copy_id: string
          created_at?: string
          due_date?: string
          id?: string
          renewed_count?: number
          return_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          book_id?: string
          borrow_date?: string
          copy_id?: string
          created_at?: string
          due_date?: string
          id?: string
          renewed_count?: number
          return_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrow_records_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrow_records_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "book_copies"
            referencedColumns: ["id"]
          },
        ]
      }
      circulation_records: {
        Row: {
          book_id: string
          checkout_date: string
          created_at: string
          due_date: string
          id: string
          renewed_count: number
          return_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          book_id: string
          checkout_date?: string
          created_at?: string
          due_date?: string
          id?: string
          renewed_count?: number
          return_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          book_id?: string
          checkout_date?: string
          created_at?: string
          due_date?: string
          id?: string
          renewed_count?: number
          return_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circulation_records_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reading_lists: {
        Row: {
          course_code: string | null
          course_name: string
          created_at: string
          description: string | null
          id: string
          lecturer_id: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          course_code?: string | null
          course_name: string
          created_at?: string
          description?: string | null
          id?: string
          lecturer_id: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          course_code?: string | null
          course_name?: string
          created_at?: string
          description?: string | null
          id?: string
          lecturer_id?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fines: {
        Row: {
          amount: number
          circulation_id: string | null
          created_at: string
          id: string
          paid: boolean
          paid_date: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          circulation_id?: string | null
          created_at?: string
          id?: string
          paid?: boolean
          paid_date?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          circulation_id?: string | null
          created_at?: string
          id?: string
          paid?: boolean
          paid_date?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fines_circulation_id_fkey"
            columns: ["circulation_id"]
            isOneToOne: false
            referencedRelation: "circulation_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_expires_at: string | null
          address: string | null
          approved: boolean
          avatar_url: string | null
          campus: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          photo_url: string | null
          registration_number: string | null
          staff_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_expires_at?: string | null
          address?: string | null
          approved?: boolean
          avatar_url?: string | null
          campus?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          registration_number?: string | null
          staff_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_expires_at?: string | null
          address?: string | null
          approved?: boolean
          avatar_url?: string | null
          campus?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          registration_number?: string | null
          staff_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_list_items: {
        Row: {
          book_id: string
          created_at: string
          id: string
          is_required: boolean
          notes: string | null
          reading_list_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          notes?: string | null
          reading_list_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          notes?: string | null
          reading_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_list_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_reading_list_id_fkey"
            columns: ["reading_list_id"]
            isOneToOne: false
            referencedRelation: "course_reading_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          book_id: string
          created_at: string
          id: string
          reservation_date: string
          status: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          reservation_date?: string
          status?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          reservation_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "patron" | "lecturer"
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
      app_role: ["admin", "patron", "lecturer"],
    },
  },
} as const
