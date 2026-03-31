import type { ProviderTypeId } from "@/lib/provider-types"

type HighlightCard = {
  title: string
  description: string
}

export type ProviderTypePageConfig = {
  providerType: ProviderTypeId
  path: string
  metadataTitle: string
  metadataDescription: string
  heroTitle: string
  heroDescription: string
  heroIntro: string
  heroHighlights: HighlightCard[]
  searchButtonLabel: string
  headerTitle: string
  listTitle: string
  emptyStateTitle: string
  emptyStateDescription: string
}

const PROVIDER_TYPE_PAGE_CONFIG: Record<ProviderTypeId, ProviderTypePageConfig> = {
  nursery: {
    providerType: "nursery",
    path: "/nurseries",
    metadataTitle: "Find Nurseries Near You | Twooky",
    metadataDescription:
      "Discover Ofsted-registered nurseries near you. Compare ratings, programs, fees, and availability to find the best nursery for your child.",
    heroTitle: "Find Trusted Nurseries Near You",
    heroDescription:
      "Search and compare nurseries offering full-day and part-day childcare for babies and toddlers.",
    heroIntro:
      "Use detailed filters to narrow by age groups, fees, curriculum, languages, and availability so you can shortlist with confidence.",
    heroHighlights: [
      {
        title: "Early years focused",
        description: "Spot providers designed for infant and toddler development milestones.",
      },
      {
        title: "Flexible care options",
        description: "Compare full-time, part-time, and wraparound nursery schedules.",
      },
      {
        title: "Quality you can verify",
        description: "Review ratings, parent feedback, and profile completeness in one view.",
      },
    ],
    searchButtonLabel: "Search nurseries",
    headerTitle: "Nurseries Near You",
    listTitle: "Nursery providers",
    emptyStateTitle: "No nurseries found",
    emptyStateDescription: "Try widening your radius or adjusting age group and fee filters.",
  },
  preschool: {
    providerType: "preschool",
    path: "/preschools",
    metadataTitle: "Find Preschools Near You | Twooky",
    metadataDescription:
      "Explore preschools near you and compare programs, ratings, curriculum, and fees to find the right preschool for your child.",
    heroTitle: "Discover Great Preschools",
    heroDescription:
      "Compare local preschools focused on school readiness, confidence, and social development.",
    heroIntro:
      "Find settings that match your priorities, from play-based learning to structured early academics and enrichment.",
    heroHighlights: [
      {
        title: "School readiness",
        description: "See providers supporting literacy, numeracy, and social-emotional growth.",
      },
      {
        title: "Curriculum match",
        description: "Filter by Montessori, play-based, Reggio Emilia, and more.",
      },
      {
        title: "Parent decision support",
        description: "Compare ratings, reviews, and pricing side-by-side before contacting.",
      },
    ],
    searchButtonLabel: "Search preschools",
    headerTitle: "Preschools Near You",
    listTitle: "Preschool providers",
    emptyStateTitle: "No preschools found",
    emptyStateDescription: "Try broadening your location or reducing selected filters.",
  },
  afterschool_program: {
    providerType: "afterschool_program",
    path: "/afterschool-programs",
    metadataTitle: "Afterschool Programs Near You | Twooky",
    metadataDescription:
      "Find afterschool programs that support homework, enrichment, and safe care for school-age children.",
    heroTitle: "Find Quality Afterschool Programs",
    heroDescription:
      "Explore safe, structured afterschool options for homework support, enrichment, and child supervision.",
    heroIntro:
      "Compare schedule fit, activities, and cost to find the right program for your family's weekly routine.",
    heroHighlights: [
      {
        title: "After school coverage",
        description: "Find providers that match dismissal times and evening pickup needs.",
      },
      {
        title: "Enrichment activities",
        description: "Compare clubs, arts, STEM, sports, and supervised study offerings.",
      },
      {
        title: "Reliable care",
        description: "Review availability and parent ratings before you reach out.",
      },
    ],
    searchButtonLabel: "Search afterschool programs",
    headerTitle: "Afterschool Programs Near You",
    listTitle: "Afterschool providers",
    emptyStateTitle: "No afterschool programs found",
    emptyStateDescription: "Try increasing radius or removing one or two advanced filters.",
  },
  sports_academy: {
    providerType: "sports_academy",
    path: "/sports-academies",
    metadataTitle: "Children's Sports Academies | Twooky",
    metadataDescription:
      "Discover sports academies and clubs for children, from football and gymnastics to swimming and more.",
    heroTitle: "Explore Children's Sports Academies",
    heroDescription:
      "Find sports clubs and academies that help children build confidence, teamwork, and physical skills.",
    heroIntro:
      "Use filters to identify age-appropriate coaching, schedules, and locations for your preferred sport.",
    heroHighlights: [
      {
        title: "Skill-building pathways",
        description: "Compare beginner to advanced programs tailored for children.",
      },
      {
        title: "Wide activity choice",
        description: "Discover football, gymnastics, swimming, dance, martial arts, and more.",
      },
      {
        title: "Convenient planning",
        description: "Check availability, costs, and local options in one search flow.",
      },
    ],
    searchButtonLabel: "Search sports academies",
    headerTitle: "Sports Academies Near You",
    listTitle: "Sports providers",
    emptyStateTitle: "No sports academies found",
    emptyStateDescription: "Try changing location or broadening your program and age filters.",
  },
  holiday_camp: {
    providerType: "holiday_camp",
    path: "/holiday-camps",
    metadataTitle: "Holiday Camps for Children | Twooky",
    metadataDescription:
      "Browse children's holiday camps near you, including school holiday clubs, activity camps, and seasonal childcare.",
    heroTitle: "Find Holiday Camps for School Breaks",
    heroDescription:
      "Browse holiday clubs and camps offering engaging, supervised childcare during school holidays.",
    heroIntro:
      "Search by age range, location, and provider quality to secure seasonal programs that fit your plans.",
    heroHighlights: [
      {
        title: "School break support",
        description: "Find options for half-term, summer, winter, and other holiday periods.",
      },
      {
        title: "Engaging experiences",
        description: "Compare activity-focused camps, themed programs, and multi-activity clubs.",
      },
      {
        title: "Faster shortlisting",
        description: "Filter by quality signals, pricing, and practical logistics.",
      },
    ],
    searchButtonLabel: "Search holiday camps",
    headerTitle: "Holiday Camps Near You",
    listTitle: "Holiday camp providers",
    emptyStateTitle: "No holiday camps found",
    emptyStateDescription: "Try a larger radius or fewer constraints to see more seasonal options.",
  },
  tutoring: {
    providerType: "tutoring",
    path: "/tutoring",
    metadataTitle: "Tutoring and Academic Support | Twooky",
    metadataDescription:
      "Find tutors and academic support services for children, covering core subjects, exam prep, and enrichment.",
    heroTitle: "Find Tutoring and Academic Support",
    heroDescription:
      "Compare tutoring services for core subjects, exam preparation, confidence building, and enrichment.",
    heroIntro:
      "Search local and online tutoring providers, then narrow by quality indicators and family needs.",
    heroHighlights: [
      {
        title: "Subject-focused support",
        description: "Discover tutoring options across literacy, numeracy, science, and exam prep.",
      },
      {
        title: "Flexible formats",
        description: "Compare providers offering online, in-person, and blended sessions.",
      },
      {
        title: "Trustworthy choices",
        description: "Use ratings and reviews to build a confident shortlist quickly.",
      },
    ],
    searchButtonLabel: "Search tutoring",
    headerTitle: "Tutoring Services Near You",
    listTitle: "Tutoring providers",
    emptyStateTitle: "No tutoring services found",
    emptyStateDescription: "Try broadening location or adjusting fee and language filters.",
  },
  therapy_service: {
    providerType: "therapy_service",
    path: "/therapy-services",
    metadataTitle: "Children's Therapy Services | Twooky",
    metadataDescription:
      "Search for children's therapy services including speech and language therapy, occupational therapy, counselling, and more.",
    heroTitle: "Find Children's Therapy Services",
    heroDescription:
      "Search specialist services that support communication, development, wellbeing, and emotional health.",
    heroIntro:
      "Explore providers by location and service fit, then refine using practical filters for your family.",
    heroHighlights: [
      {
        title: "Specialist support",
        description: "Find speech and language, occupational therapy, counseling, and related services.",
      },
      {
        title: "Family-centered choices",
        description: "Compare providers to match your child's developmental needs.",
      },
      {
        title: "Clear, informed search",
        description: "Use ratings, reviews, and key details to choose next steps confidently.",
      },
    ],
    searchButtonLabel: "Search therapy services",
    headerTitle: "Therapy Services Near You",
    listTitle: "Therapy providers",
    emptyStateTitle: "No therapy services found",
    emptyStateDescription: "Try broadening your search area or removing strict filters.",
  },
}

export function getProviderTypePageConfig(providerType: ProviderTypeId): ProviderTypePageConfig {
  return PROVIDER_TYPE_PAGE_CONFIG[providerType]
}
