export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admin_notification_reads: {
        Row: {
          id: string
          notification_id: string
          admin_user_id: string
          read_at: string
          created_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          admin_user_id: string
          read_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          admin_user_id?: string
          read_at?: string
          created_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string | null
          href: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message?: string | null
          href?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string | null
          href?: string | null
          created_at?: string
        }
        Relationships: []
      }
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
      currencies: {
        Row: {
          id: string
          code: string
          name: string
          symbol: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          symbol: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          symbol?: string
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
          tag: string
          age_range: string
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tag: string
          age_range: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tag?: string
          age_range?: string
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
      provider_faqs: {
        Row: {
          id: string
          provider_profile_id: string
          question: string
          answer: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          question: string
          answer: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          question?: string
          answer?: string
          sort_order?: number
          created_at?: string
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
          country_id: string | null
          city_id: string | null
          currency_id: string | null
          google_place_id: string | null
          google_photo_reference_cached: string | null
          google_fallback_storage_path: string | null
          google_fallback_cached_at: string | null
          google_rating_cached: number | null
          google_review_count_cached: number | null
          google_reviews_url_cached: string | null
          google_reviews_cached_at: string | null
          virtual_tour_url: string | null
          virtual_tour_urls: string[] | null
          description: string | null
          website: string | null
          address: string | null
          provider_types: string[] | null
          age_groups_served: string[] | null
          curriculum_type: string[] | null
          languages_spoken: string | null
          amenities: string[] | null
          opening_time: string | null
          closing_time: string | null
          monthly_tuition_from: number | null
          monthly_tuition_to: number | null
          daily_fee_from: number | null
          daily_fee_to: number | null
          registration_fee: number | null
          deposit_fee: number | null
          meals_fee: number | null
          service_transport: boolean
          service_extended_hours: boolean
          service_pickup_dropoff: boolean
          service_extracurriculars: boolean
          total_capacity: number | null
          listing_status: string
          featured: boolean
          early_learning_excellence_badge: boolean
          verified_provider_badge: boolean
          verified_provider_badge_color: string
          availability_status: "openings" | "waitlist" | "full"
          available_spots_count: number | null
          is_admin_managed: boolean
          owner_profile_id: string | null
          notify_new_inquiries: boolean
          notify_new_reviews: boolean
          notify_weekly_analytics: boolean
          onboarding_tour_shown_at: string | null
          created_at: string
        }
        Insert: {
          profile_id: string
          provider_slug?: string | null
          business_name?: string | null
          phone?: string | null
          city?: string | null
          country_id?: string | null
          city_id?: string | null
          currency_id?: string | null
          google_place_id?: string | null
          google_photo_reference_cached?: string | null
          google_fallback_storage_path?: string | null
          google_fallback_cached_at?: string | null
          google_rating_cached?: number | null
          google_review_count_cached?: number | null
          google_reviews_url_cached?: string | null
          google_reviews_cached_at?: string | null
          virtual_tour_url?: string | null
          virtual_tour_urls?: string[] | null
          description?: string | null
          website?: string | null
          address?: string | null
          provider_types?: string[] | null
          age_groups_served?: string[] | null
          curriculum_type?: string[] | null
          languages_spoken?: string | null
          amenities?: string[] | null
          opening_time?: string | null
          closing_time?: string | null
          monthly_tuition_from?: number | null
          monthly_tuition_to?: number | null
          daily_fee_from?: number | null
          daily_fee_to?: number | null
          registration_fee?: number | null
          deposit_fee?: number | null
          meals_fee?: number | null
          service_transport?: boolean
          service_extended_hours?: boolean
          service_pickup_dropoff?: boolean
          service_extracurriculars?: boolean
          total_capacity?: number | null
          listing_status?: string
          featured?: boolean
          early_learning_excellence_badge?: boolean
          verified_provider_badge?: boolean
          verified_provider_badge_color?: string
          availability_status?: "openings" | "waitlist" | "full"
          available_spots_count?: number | null
          is_admin_managed?: boolean
          owner_profile_id?: string | null
          notify_new_inquiries?: boolean
          notify_new_reviews?: boolean
          notify_weekly_analytics?: boolean
          onboarding_tour_shown_at?: string | null
          created_at?: string
        }
        Update: {
          profile_id?: string
          provider_slug?: string | null
          business_name?: string | null
          phone?: string | null
          city?: string | null
          country_id?: string | null
          city_id?: string | null
          currency_id?: string | null
          google_place_id?: string | null
          google_photo_reference_cached?: string | null
          google_fallback_storage_path?: string | null
          google_fallback_cached_at?: string | null
          google_rating_cached?: number | null
          google_review_count_cached?: number | null
          google_reviews_url_cached?: string | null
          google_reviews_cached_at?: string | null
          virtual_tour_url?: string | null
          virtual_tour_urls?: string[] | null
          description?: string | null
          website?: string | null
          address?: string | null
          provider_types?: string[] | null
          age_groups_served?: string[] | null
          curriculum_type?: string[] | null
          languages_spoken?: string | null
          amenities?: string[] | null
          opening_time?: string | null
          closing_time?: string | null
          monthly_tuition_from?: number | null
          monthly_tuition_to?: number | null
          daily_fee_from?: number | null
          daily_fee_to?: number | null
          registration_fee?: number | null
          deposit_fee?: number | null
          meals_fee?: number | null
          service_transport?: boolean
          service_extended_hours?: boolean
          service_pickup_dropoff?: boolean
          service_extracurriculars?: boolean
          total_capacity?: number | null
          listing_status?: string
          featured?: boolean
          early_learning_excellence_badge?: boolean
          verified_provider_badge?: boolean
          verified_provider_badge_color?: string
          availability_status?: "openings" | "waitlist" | "full"
          available_spots_count?: number | null
          is_admin_managed?: boolean
          owner_profile_id?: string | null
          notify_new_inquiries?: boolean
          notify_new_reviews?: boolean
          notify_weekly_analytics?: boolean
          onboarding_tour_shown_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      provider_listing_claims: {
        Row: {
          id: string
          claimant_name: string
          email: string
          phone: string
          business_name: string
          business_address: string
          status: "pending" | "approved" | "rejected"
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          match_status: "auto_matched" | "possible_match" | "unmatched" | null
          match_score: number | null
          matched_provider_profile_id: string | null
          match_metadata: unknown
          consent_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          claimant_name: string
          email: string
          phone: string
          business_name: string
          business_address: string
          status?: "pending" | "approved" | "rejected"
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          match_status?: "auto_matched" | "possible_match" | "unmatched" | null
          match_score?: number | null
          matched_provider_profile_id?: string | null
          match_metadata?: unknown
          consent_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          claimant_name?: string
          email?: string
          phone?: string
          business_name?: string
          business_address?: string
          status?: "pending" | "approved" | "rejected"
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          match_status?: "auto_matched" | "possible_match" | "unmatched" | null
          match_score?: number | null
          matched_provider_profile_id?: string | null
          match_metadata?: unknown
          consent_version?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_listing_claim_documents: {
        Row: {
          id: string
          claim_id: string
          document_type: string
          storage_path: string
          mime_type: string
          file_size: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          claim_id: string
          document_type: string
          storage_path: string
          mime_type: string
          file_size: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          claim_id?: string
          document_type?: string
          storage_path?: string
          mime_type?: string
          file_size?: number
          uploaded_at?: string
        }
        Relationships: []
      }
      provider_listing_documents: {
        Row: {
          id: string
          provider_profile_id: string
          document_type: string
          storage_path: string
          mime_type: string
          file_size: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          provider_profile_id: string
          document_type: string
          storage_path: string
          mime_type: string
          file_size: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          provider_profile_id?: string
          document_type?: string
          storage_path?: string
          mime_type?: string
          file_size?: number
          uploaded_at?: string
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
      provider_website_assets: {
        Row: {
          id: string
          website_id: string
          storage_path: string
          content_type: string | null
          byte_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          storage_path: string
          content_type?: string | null
          byte_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          storage_path?: string
          content_type?: string | null
          byte_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      provider_website_visits: {
        Row: {
          id: string
          provider_website_id: string
          page_slug: string
          visitor_token: string
          referrer: string | null
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          id?: string
          provider_website_id: string
          page_slug?: string
          visitor_token: string
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          id?: string
          provider_website_id?: string
          page_slug?: string
          visitor_token?: string
          referrer?: string | null
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      provider_website_pages: {
        Row: {
          id: string
          website_id: string
          path_slug: string
          title: string
          seo_title: string | null
          meta_description: string | null
          sort_order: number
          is_home: boolean
          canvas_nodes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          website_id: string
          path_slug: string
          title?: string
          seo_title?: string | null
          meta_description?: string | null
          sort_order?: number
          is_home?: boolean
          canvas_nodes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          path_slug?: string
          title?: string
          seo_title?: string | null
          meta_description?: string | null
          sort_order?: number
          is_home?: boolean
          canvas_nodes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_website_published_versions: {
        Row: {
          id: string
          website_id: string
          snapshot: Json
          created_at: string
        }
        Insert: {
          id?: string
          website_id: string
          snapshot: Json
          created_at?: string
        }
        Update: {
          id?: string
          website_id?: string
          snapshot?: Json
          created_at?: string
        }
        Relationships: []
      }
      provider_websites: {
        Row: {
          id: string
          profile_id: string
          subdomain_slug: string
          template_key: string | null
          theme_tokens: Json
          nav_items: Json
          published_version_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          subdomain_slug: string
          template_key?: string | null
          theme_tokens?: Json
          nav_items?: Json
          published_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          subdomain_slug?: string
          template_key?: string | null
          theme_tokens?: Json
          nav_items?: Json
          published_version_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_blog_posts: {
        Row: {
          id: string
          provider_website_id: string
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
          provider_website_id: string
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
          provider_website_id?: string
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
          source: string | null
          first_provider_response_at: string | null
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
          source: string | null
          program_interest: string | null
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
          source?: string | null
          program_interest?: string | null
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
          source?: string | null
          program_interest?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          lead_type: string
          provider_profile_id: string
          note_text: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          lead_id: string
          lead_type: string
          provider_profile_id: string
          note_text: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          lead_id?: string
          lead_type?: string
          provider_profile_id?: string
          note_text?: string
          created_at?: string
          created_by?: string
        }
        Relationships: []
      }
      lead_follow_up_sent: {
        Row: {
          lead_id: string
          lead_type: string
          provider_profile_id: string
          sent_at: string
        }
        Insert: {
          lead_id: string
          lead_type: string
          provider_profile_id: string
          sent_at?: string
        }
        Update: {
          lead_id?: string
          lead_type?: string
          provider_profile_id?: string
          sent_at?: string
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
      parent_profiles: {
        Row: {
          profile_id: string
          child_age_group: string | null
          phone: string | null
          preferred_start_date: string | null
          created_at: string
        }
        Insert: {
          profile_id: string
          child_age_group?: string | null
          phone?: string | null
          preferred_start_date?: string | null
          created_at?: string
        }
        Update: {
          profile_id?: string
          child_age_group?: string | null
          phone?: string | null
          preferred_start_date?: string | null
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
      local_service_deals: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          location: string
          age_target: string
          provider_id: string
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          location: string
          age_target: string
          provider_id: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          location?: string
          age_target?: string
          provider_id?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_service_deals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      sponsor_discounts: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          discount_code: string | null
          external_link: string | null
          category: string
          offer_badge: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          discount_code?: string | null
          external_link?: string | null
          category: string
          offer_badge?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          discount_code?: string | null
          external_link?: string | null
          category?: string
          offer_badge?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
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
    Functions: {
      get_published_provider_website: {
        Args: { p_subdomain: string }
        Returns: Json | null
      }
      get_guest_inquiry_message_decrypted: {
        Args: { p_guest_inquiry_id: string }
        Returns: string | null
      }
      create_guest_inquiry: {
        Args: {
          p_provider_slug: string
          p_child_dob: string
          p_ideal_start_date: string
          p_message_plain: string
          p_first_name: string
          p_last_name: string
          p_email: string
          p_telephone: string
          p_consent_to_contact?: boolean
        }
        Returns: string
      }
      create_inquiry: {
        Args: {
          p_provider_profile_id: string
          p_inquiry_subject: string | null
          p_message_plain: string
          p_consent_to_contact?: boolean
        }
        Returns: string
      }
      add_inquiry_reply: {
        Args: { p_inquiry_id: string; p_message_plain: string }
        Returns: string
      }
      get_inquiry_thread: {
        Args: { p_inquiry_id: string }
        Returns: {
          message_order: number
          sender_type: string
          sender_profile_id: string
          body_decrypted: string | null
          created_at: string
        }[]
      }
      get_inquiry_meta_secure: {
        Args: { p_inquiry_id: string }
        Returns: {
          id: string
          inquiry_subject: string | null
          provider_business_name: string | null
          provider_slug: string | null
          parent_display_name: string | null
          parent_email: string | null
          created_at: string
          updated_at: string
          lead_status: string | null
        }[]
      }
      get_provider_inquiry_previews: {
        Args: Record<string, never>
        Returns: {
          id: string
          parent_profile_id: string
          inquiry_subject: string | null
          created_at: string
          updated_at: string
          parent_display_name: string | null
          parent_email: string | null
          lead_status: string | null
          child_age_group: string | null
        }[]
      }
    }
    Enums: {
      app_role: "parent" | "provider" | "admin"
    }
    CompositeTypes: Record<string, never>
  }
}
