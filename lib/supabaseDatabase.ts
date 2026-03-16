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
          about_text: string | null
          key_benefits: string[] | null
          short_description: string | null
          age_group_ids: string[] | null
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          is_active?: boolean
          about_text?: string | null
          key_benefits?: string[] | null
          short_description?: string | null
          age_group_ids?: string[] | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          about_text?: string | null
          key_benefits?: string[] | null
          short_description?: string | null
          age_group_ids?: string[] | null
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_type_faqs: {
        Row: {
          id: string
          program_type_id: string
          question: string
          answer: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          program_type_id: string
          question: string
          answer: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          program_type_id?: string
          question?: string
          answer?: string
          sort_order?: number
          created_at?: string
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
          description: string | null
          website: string | null
          address: string | null
          provider_types: string[] | null
          age_groups_served: string[] | null
          curriculum_type: string | null
          languages_spoken: string | null
          amenities: string[] | null
          opening_time: string | null
          closing_time: string | null
          monthly_tuition_from: number | null
          monthly_tuition_to: number | null
          total_capacity: number | null
          listing_status: string
          featured: boolean
          notify_new_inquiries: boolean
          notify_new_reviews: boolean
          notify_weekly_analytics: boolean
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
          description?: string | null
          website?: string | null
          address?: string | null
          provider_types?: string[] | null
          age_groups_served?: string[] | null
          curriculum_type?: string | null
          languages_spoken?: string | null
          amenities?: string[] | null
          opening_time?: string | null
          closing_time?: string | null
          monthly_tuition_from?: number | null
          monthly_tuition_to?: number | null
          total_capacity?: number | null
          listing_status?: string
          featured?: boolean
          notify_new_inquiries?: boolean
          notify_new_reviews?: boolean
          notify_weekly_analytics?: boolean
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
          description?: string | null
          website?: string | null
          address?: string | null
          provider_types?: string[] | null
          age_groups_served?: string[] | null
          curriculum_type?: string | null
          languages_spoken?: string | null
          amenities?: string[] | null
          opening_time?: string | null
          closing_time?: string | null
          monthly_tuition_from?: number | null
          monthly_tuition_to?: number | null
          total_capacity?: number | null
          listing_status?: string
          featured?: boolean
          notify_new_inquiries?: boolean
          notify_new_reviews?: boolean
          notify_weekly_analytics?: boolean
          created_at?: string
        }
        Relationships: []
      }
      provider_photos: {
        Row: {
          id: string
          provider_profile_id: string
          storage_path: string
          caption: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          storage_path: string
          caption?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          storage_path?: string
          caption?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      provider_profile_views: {
        Row: {
          id: string
          provider_profile_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      provider_notifications: {
        Row: {
          id: string
          provider_profile_id: string
          type: string
          title: string
          message: string | null
          href: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          type: string
          title: string
          message?: string | null
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          type?: string
          title?: string
          message?: string | null
          href?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          id: string
          parent_profile_id: string
          provider_profile_id: string
          inquiry_subject: string | null
          inquiry_message_encrypted: string
          inquiry_message_search_hash: string | null
          consent_to_contact: boolean
          consent_version: string
          consented_at: string
          legal_basis: "consent" | "contract" | "legitimate_interest"
          retention_until: string
          deleted_at: string | null
          created_at: string
          updated_at: string
          lead_status: string
        }
        Insert: {
          id?: string
          parent_profile_id: string
          provider_profile_id: string
          inquiry_subject?: string | null
          inquiry_message_encrypted: string
          inquiry_message_search_hash?: string | null
          consent_to_contact: boolean
          consent_version?: string
          consented_at?: string
          legal_basis?: "consent" | "contract" | "legitimate_interest"
          retention_until?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          lead_status?: string
        }
        Update: {
          id?: string
          parent_profile_id?: string
          provider_profile_id?: string
          inquiry_subject?: string | null
          inquiry_message_encrypted?: string
          inquiry_message_search_hash?: string | null
          consent_to_contact?: boolean
          consent_version?: string
          consented_at?: string
          legal_basis?: "consent" | "contract" | "legitimate_interest"
          retention_until?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          lead_status?: string
        }
        Relationships: []
      }
      inquiry_messages: {
        Row: {
          id: string
          inquiry_id: string
          sender_type: string
          sender_profile_id: string
          message_encrypted: string
          created_at: string
        }
        Insert: {
          id?: string
          inquiry_id: string
          sender_type: string
          sender_profile_id: string
          message_encrypted: string
          created_at?: string
        }
        Update: {
          id?: string
          inquiry_id?: string
          sender_type?: string
          sender_profile_id?: string
          message_encrypted?: string
          created_at?: string
        }
        Relationships: []
      }
      guest_inquiries: {
        Row: {
          id: string
          provider_profile_id: string
          child_dob: string | null
          ideal_start_date: string | null
          message_encrypted: string
          first_name: string
          last_name: string
          email: string
          telephone: string
          consent_to_contact: boolean
          consent_version: string
          consented_at: string
          created_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          child_dob?: string | null
          ideal_start_date?: string | null
          message_encrypted: string
          first_name: string
          last_name: string
          email: string
          telephone: string
          consent_to_contact: boolean
          consent_version?: string
          consented_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          child_dob?: string | null
          ideal_start_date?: string | null
          message_encrypted?: string
          first_name?: string
          last_name?: string
          email?: string
          telephone?: string
          consent_to_contact?: boolean
          consent_version?: string
          consented_at?: string
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
          parent_profile_id: string | null
          provider_profile_id: string
          rating: number
          review_text: string
          created_at: string
          updated_at: string
          provider_reply_text: string | null
          provider_replied_at: string | null
        }
        Insert: {
          id?: string
          parent_profile_id?: string | null
          provider_profile_id: string
          rating: number
          review_text: string
          created_at?: string
          updated_at?: string
          provider_reply_text?: string | null
          provider_replied_at?: string | null
        }
        Update: {
          id?: string
          parent_profile_id?: string | null
          provider_profile_id?: string
          rating?: number
          review_text?: string
          created_at?: string
          updated_at?: string
          provider_reply_text?: string | null
          provider_replied_at?: string | null
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          id: string
          review_id: string
          reporter_profile_id: string
          reason: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          reporter_profile_id: string
          reason: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          reporter_profile_id?: string
          reason?: string
          details?: string | null
          created_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          message: string
          consent_to_contact: boolean
          consent_version: string
          consented_at: string
          handled_status: string
          admin_note: string | null
          retention_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          message: string
          consent_to_contact: boolean
          consent_version: string
          consented_at?: string
          handled_status?: string
          admin_note?: string | null
          retention_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string
          consent_to_contact?: boolean
          consent_version?: string
          consented_at?: string
          handled_status?: string
          admin_note?: string | null
          retention_until?: string | null
          created_at?: string
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
