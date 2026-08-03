export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          phone: string | null
          city: string | null
          role: 'customer' | 'editor' | 'admin' | 'super_admin'
          status: 'active' | 'inactive'
          total_spent: number | null
          orders_count: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          city?: string | null
          role?: 'customer' | 'editor' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive'
          total_spent?: number | null
          orders_count?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          city?: string | null
          role?: 'customer' | 'editor' | 'admin' | 'super_admin'
          status?: 'active' | 'inactive'
          total_spent?: number | null
          orders_count?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string | null
          status: 'Actif' | 'Inactif'
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string | null
          status?: 'Actif' | 'Inactif'
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string | null
          status?: 'Actif' | 'Inactif'
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          brand: string
          model: string
          sku: string
          price: number
          stock_quantity: number
          status: 'Disponible' | 'Rupture' | 'Précommande'
          created_at: string
          updated_at: string | null
          description: string | null
          images: Json | null
          specifications: Json | null
        }
        Insert: {
          id?: string
          brand: string
          model: string
          sku: string
          price: number
          stock_quantity: number
          status?: 'Disponible' | 'Rupture' | 'Précommande'
          created_at?: string
          updated_at?: string | null
          description?: string | null
          images?: Json | null
          specifications?: Json | null
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          sku?: string
          price?: number
          stock_quantity?: number
          status?: 'Disponible' | 'Rupture' | 'Précommande'
          created_at?: string
          updated_at?: string | null
          description?: string | null
          images?: Json | null
          specifications?: Json | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          client_name: string
          client_phone: string
          client_email: string | null
          client_city: string
          laptop_id: string
          laptop_brand: string
          laptop_model: string
          base_price: number
          final_price: number
          customizations: Json | null
          additional_notes: string | null
          status: 'Demande reçue' | 'Confirmée' | 'En traitement' | 'Expédiée' | 'Livrée' | 'Annulée' | 'Remboursée'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number: string
          client_name: string
          client_phone: string
          client_email?: string | null
          client_city: string
          laptop_id: string
          laptop_brand: string
          laptop_model: string
          base_price: number
          final_price: number
          customizations?: Json | null
          additional_notes?: string | null
          status?: 'Demande reçue' | 'Confirmée' | 'En traitement' | 'Expédiée' | 'Livrée' | 'Annulée' | 'Remboursée'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          client_name?: string
          client_phone?: string
          client_email?: string | null
          client_city?: string
          laptop_id?: string
          laptop_brand?: string
          laptop_model?: string
          base_price?: number
          final_price?: number
          customizations?: Json | null
          additional_notes?: string | null
          status?: 'Demande reçue' | 'Confirmée' | 'En traitement' | 'Expédiée' | 'Livrée' | 'Annulée' | 'Remboursée'
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          user_role: string | null
          action: string
          target_id: string | null
          target_type: string | null
          old_value: Json | null
          new_value: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          action: string
          target_id?: string | null
          target_type?: string | null
          old_value?: Json | null
          new_value?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          action?: string
          target_id?: string | null
          target_type?: string | null
          old_value?: Json | null
          new_value?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          image: string
          title: string | null
          subtitle: string | null
          link: string | null
          status: 'Actif' | 'Inactif'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          image: string
          title?: string | null
          subtitle?: string | null
          link?: string | null
          status?: 'Actif' | 'Inactif'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          image?: string
          title?: string | null
          subtitle?: string | null
          link?: string | null
          status?: 'Actif' | 'Inactif'
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tips: { // Assuming 'tips' table stores buying guides
        Row: {
          id: string
          title: string
          content: string | null
          image: string | null
          status: 'Actif' | 'Inactif'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          image?: string | null
          status?: 'Actif' | 'Inactif'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          image?: string | null
          status?: 'Actif' | 'Inactif'
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          author: string | null
          content: string | null
          image: string | null
          tags: Json | null
          status: 'Brouillon' | 'Publié' | 'Archivé'
          created_at: string
          updated_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          author?: string | null
          content?: string | null
          image?: string | null
          tags?: Json | null
          status?: 'Brouillon' | 'Publié' | 'Archivé'
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          author?: string | null
          content?: string | null
          image?: string | null
          tags?: Json | null
          status?: 'Brouillon' | 'Publié' | 'Archivé'
          created_at?: string
          updated_at?: string | null
          published_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string | null
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message?: string | null
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string | null
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      media_library: { // Assuming a media_library table
        Row: {
          id: string
          name: string
          url: string
          size: number | null
          mime_type: string | null
          bucket_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          size?: number | null
          mime_type?: string | null
          bucket_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          size?: number | null
          mime_type?: string | null
          bucket_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      visitor_counts: {
        Row: {
          id: number
          count: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          count?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          count?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
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
