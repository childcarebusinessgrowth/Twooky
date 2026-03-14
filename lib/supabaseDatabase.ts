export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string
          content_html: string
          status: "draft" | "published"
          featured: boolean
          published_at: string | null
          seo_title: string | null
          meta_description: string | null
          cover_image_url: string | null
          cover_image_alt: string | null
          tags: string[]
          reading_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt?: string
          content_html?: string
          status?: "draft" | "published"
          featured?: boolean
          published_at?: string | null
          seo_title?: string | null
          meta_description?: string | null
          cover_image_url?: string | null
          cover_image_alt?: string | null
          tags?: string[]
          reading_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          excerpt?: string
          content_html?: string
          status?: "draft" | "published"
          featured?: boolean
          published_at?: string | null
          seo_title?: string | null
          meta_description?: string | null
          cover_image_url?: string | null
          cover_image_alt?: string | null
          tags?: string[]
          reading_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          id: string
          code: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          country_id: string
          name: string
          slug: string
          search_country_code: string
          search_city_slug: string
          is_popular: boolean
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          country_id: string
          name: string
          slug: string
          search_country_code: string
          search_city_slug: string
          is_popular?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          country_id?: string
          name?: string
          slug?: string
          search_country_code?: string
          search_city_slug?: string
          is_popular?: boolean
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      age_groups: {
        Row: {
          id: string
          name: string
          age_range: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          age_range?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age_range?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_types: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_philosophies: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_features: {
        Row: {
          id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: "parent" | "provider" | "admin"
          display_name: string | null
          country_name: string | null
          city_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: "parent" | "provider" | "admin"
          display_name?: string | null
          country_name?: string | null
          city_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: "parent" | "provider" | "admin"
          display_name?: string | null
          country_name?: string | null
          city_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          profile_id: string
          provider_slug: string | null
          business_name: string | null
          phone: string | null
          city: string | null
          virtual_tour_url: string | null
          virtual_tour_urls: string[] | null
          created_at: string
        }
        Insert: {
          profile_id: string
          provider_slug?: string | null
          business_name?: string | null
          phone?: string | null
          city?: string | null
          virtual_tour_url?: string | null
          virtual_tour_urls?: string[] | null
          created_at?: string
        }
        Update: {
          profile_id?: string
          provider_slug?: string | null
          business_name?: string | null
          phone?: string | null
          city?: string | null
          virtual_tour_url?: string | null
          virtual_tour_urls?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      parent_favorites: {
        Row: {
          id: string
          parent_profile_id: string
          provider_profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          parent_profile_id: string
          provider_profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          parent_profile_id?: string
          provider_profile_id?: string
          created_at?: string
        }
        Relationships: []
      }
      parent_reviews: {
        Row: {
          id: string
          parent_profile_id: string
          provider_profile_id: string
          rating: number
          review_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_profile_id: string
          provider_profile_id: string
          rating: number
          review_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_profile_id?: string
          provider_profile_id?: string
          rating?: number
          review_text?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: "parent" | "provider" | "admin"
    }
    CompositeTypes: Record<string, never>
  }
}
