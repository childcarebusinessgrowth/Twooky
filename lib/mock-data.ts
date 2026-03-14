import type { ProviderTypeId } from "./provider-types"

export interface Provider {
  id: string
  slug: string
  name: string
  rating: number
  reviewCount: number
  location: string
  city: string
  state: string
  address: string
  phone: string
  website: string
  priceRange: string
  /**
   * Approximate geolocation for mapping and radius search.
   */
  latitude: number
  longitude: number
  /**
   * High-level categories describing what kind of organisation this is.
   * A provider can belong to multiple types (e.g. preschool + afterschool program).
   */
  providerTypes: ProviderTypeId[]
  programTypes: string[]
  ageGroups: string[]
  /**
   * Normalised age tags for filtering (e.g. "infant", "toddler").
   */
  ageTags: string[]
  description: string
  shortDescription: string
  hours: string
  languages: string[]
  curriculumType: string
  mealsIncluded: boolean
  outdoorSpace: boolean
  specialNeeds: boolean
  /**
   * Approximate monthly tuition range in USD.
   */
  minTuition: number
  maxTuition: number
  /**
   * High-level availability status for new enrollments.
   */
  availability: "openings" | "waitlist" | "full"
  /**
   * Profile completeness score (0–1).
   */
  profileCompleteness: number
  /**
   * Whether this provider has been verified by the platform.
   */
  isVerified: boolean
  /**
   * ISO date string representing last profile update or recent activity.
   */
  lastUpdated: string
  /**
   * Provider response rate to inquiries (0–1).
   */
  responseRate: number
  /**
   * Subscription tier used for ranking boost.
   */
  subscriptionTier: "free" | "featured" | "premium"
  image: string
  images: string[]
}

export interface Review {
  id: string
  parentName: string
  providerName: string
  providerId: string
  rating: number
  text: string
  date: string
}

export interface Program {
  id: string
  slug: string
  title: string
  icon: string
  shortDescription: string
  fullDescription: string
  benefits: string[]
}

export const providers: Provider[] = [
  {
    id: "1",
    slug: "sunshine-learning-center",
    name: "Sunshine Learning Center",
    rating: 4.9,
    reviewCount: 127,
    location: "Austin, TX",
    city: "Austin",
    state: "TX",
    address: "1234 Oak Street, Austin, TX 78701",
    phone: "(512) 555-0123",
    website: "https://sunshinelearning.com",
    priceRange: "$1,200 - $1,800/mo",
    latitude: 30.2672,
    longitude: -97.7431,
    providerTypes: ["nursery", "preschool", "afterschool_program"],
    programTypes: ["Preschool", "Toddler Care", "Montessori"],
    ageGroups: ["2-3 years", "3-4 years", "4-5 years"],
    ageTags: ["toddler", "preschool", "prek"],
    description: "Sunshine Learning Center is a premier early childhood education facility dedicated to nurturing young minds through play-based learning and Montessori-inspired curriculum. Our experienced educators create a warm, supportive environment where children develop social skills, creativity, and a love for learning. We believe every child is unique and deserves individualized attention to reach their full potential.",
    shortDescription: "Play-based learning with Montessori-inspired curriculum for ages 2-5.",
    hours: "7:00 AM - 6:00 PM",
    languages: ["English", "Spanish"],
    curriculumType: "Montessori",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: false,
    minTuition: 1200,
    maxTuition: 1800,
    availability: "openings",
    profileCompleteness: 0.95,
    isVerified: true,
    lastUpdated: "2025-12-15",
    responseRate: 0.98,
    subscriptionTier: "premium",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
      "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80"
    ]
  },
  {
    id: "2",
    slug: "little-stars-academy",
    name: "Little Stars Academy",
    rating: 4.8,
    reviewCount: 89,
    location: "Austin, TX",
    city: "Austin",
    state: "TX",
    address: "567 Pine Avenue, Austin, TX 78702",
    phone: "(512) 555-0456",
    website: "https://littlestarsacademy.com",
    priceRange: "$1,400 - $2,000/mo",
    latitude: 30.2711,
    longitude: -97.7437,
    providerTypes: ["nursery", "preschool"],
    programTypes: ["Infant Care", "Toddler Care", "Preschool"],
    ageGroups: ["6 weeks - 12 months", "1-2 years", "2-3 years", "3-4 years"],
    ageTags: ["infant", "toddler", "preschool"],
    description: "Little Stars Academy provides exceptional infant and toddler care in a nurturing, home-like environment. Our low teacher-to-child ratios ensure personalized attention for each child. We focus on developmental milestones while fostering independence and curiosity through age-appropriate activities and sensory exploration.",
    shortDescription: "Exceptional infant and toddler care with low teacher-to-child ratios.",
    hours: "6:30 AM - 6:30 PM",
    languages: ["English"],
    curriculumType: "Play-Based",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: true,
    minTuition: 1400,
    maxTuition: 2000,
    availability: "waitlist",
    profileCompleteness: 0.9,
    isVerified: true,
    lastUpdated: "2025-11-20",
    responseRate: 0.92,
    subscriptionTier: "featured",
    image: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80"
    ]
  },
  {
    id: "3",
    slug: "bright-horizons-daycare",
    name: "Bright Horizons Daycare",
    rating: 4.7,
    reviewCount: 156,
    location: "Phoenix, AZ",
    city: "Phoenix",
    state: "AZ",
    address: "890 Cactus Road, Phoenix, AZ 85001",
    phone: "(602) 555-0789",
    website: "https://brighthorizonsdaycare.com",
    priceRange: "$1,100 - $1,600/mo",
    latitude: 33.4484,
    longitude: -112.074,
    providerTypes: ["nursery", "preschool", "afterschool_program"],
    programTypes: ["Toddler Care", "Preschool", "After School"],
    ageGroups: ["1-2 years", "2-3 years", "3-5 years", "5-12 years"],
    ageTags: ["toddler", "preschool", "schoolage"],
    description: "Bright Horizons Daycare offers comprehensive childcare services from toddlers through school-age children. Our STEM-focused curriculum prepares children for academic success while our after-school program provides homework help and enrichment activities. We pride ourselves on creating a diverse, inclusive community.",
    shortDescription: "STEM-focused curriculum from toddler through school-age programs.",
    hours: "6:00 AM - 7:00 PM",
    languages: ["English", "Spanish", "Mandarin"],
    curriculumType: "STEM-Focused",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: true,
    minTuition: 1100,
    maxTuition: 1600,
    availability: "openings",
    profileCompleteness: 0.9,
    isVerified: true,
    lastUpdated: "2025-10-05",
    responseRate: 0.88,
    subscriptionTier: "featured",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80"
    ]
  },
  {
    id: "4",
    slug: "rainbow-kids-center",
    name: "Rainbow Kids Center",
    rating: 4.6,
    reviewCount: 72,
    location: "Miami, FL",
    city: "Miami",
    state: "FL",
    address: "123 Palm Boulevard, Miami, FL 33101",
    phone: "(305) 555-0321",
    website: "https://rainbowkids.com",
    priceRange: "$1,300 - $1,900/mo",
    latitude: 25.7617,
    longitude: -80.1918,
    providerTypes: ["nursery", "preschool"],
    programTypes: ["Infant Care", "Toddler Care", "Montessori"],
    ageGroups: ["6 weeks - 12 months", "1-2 years", "2-4 years"],
    ageTags: ["infant", "toddler", "preschool"],
    description: "Rainbow Kids Center combines traditional childcare with Montessori principles to create a unique learning experience. Our bilingual program helps children develop language skills in both English and Spanish. Located in the heart of Miami, we celebrate cultural diversity through art, music, and cuisine.",
    shortDescription: "Bilingual Montessori program celebrating cultural diversity.",
    hours: "7:00 AM - 6:00 PM",
    languages: ["English", "Spanish", "Portuguese"],
    curriculumType: "Montessori",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: false,
    minTuition: 1300,
    maxTuition: 1900,
    availability: "waitlist",
    profileCompleteness: 0.85,
    isVerified: false,
    lastUpdated: "2025-09-12",
    responseRate: 0.8,
    subscriptionTier: "free",
    image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
      "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80"
    ]
  },
  {
    id: "5",
    slug: "happy-hearts-preschool",
    name: "Happy Hearts Preschool",
    rating: 4.9,
    reviewCount: 203,
    location: "Dallas, TX",
    city: "Dallas",
    state: "TX",
    address: "456 Elm Street, Dallas, TX 75201",
    phone: "(214) 555-0654",
    website: "https://happyheartspreschool.com",
    priceRange: "$1,500 - $2,200/mo",
    latitude: 32.7767,
    longitude: -96.797,
    providerTypes: ["preschool"],
    programTypes: ["Preschool", "Pre-K", "Montessori"],
    ageGroups: ["3-4 years", "4-5 years", "5-6 years"],
    ageTags: ["preschool", "prek", "schoolage"],
    description: "Happy Hearts Preschool is an award-winning early education center focused on kindergarten readiness. Our comprehensive curriculum includes literacy, mathematics, science exploration, and social-emotional development. We partner closely with families to ensure each child receives the support they need to thrive.",
    shortDescription: "Award-winning preschool focused on kindergarten readiness.",
    hours: "7:30 AM - 5:30 PM",
    languages: ["English"],
    curriculumType: "Academic",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: true,
    minTuition: 1500,
    maxTuition: 2200,
    availability: "openings",
    profileCompleteness: 0.97,
    isVerified: true,
    lastUpdated: "2026-01-10",
    responseRate: 0.95,
    subscriptionTier: "premium",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
      "https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&q=80"
    ]
  },
  {
    id: "6",
    slug: "creative-minds-daycare",
    name: "Creative Minds Daycare",
    rating: 4.5,
    reviewCount: 64,
    location: "San Diego, CA",
    city: "San Diego",
    state: "CA",
    address: "789 Ocean View Drive, San Diego, CA 92101",
    phone: "(619) 555-0987",
    website: "https://creativemindsdaycare.com",
    priceRange: "$1,600 - $2,400/mo",
    latitude: 32.7157,
    longitude: -117.1611,
    providerTypes: ["nursery", "preschool", "afterschool_program"],
    programTypes: ["Infant Care", "Toddler Care", "Preschool", "Home Daycare"],
    ageGroups: ["6 weeks - 12 months", "1-2 years", "2-3 years", "3-5 years"],
    ageTags: ["infant", "toddler", "preschool"],
    description: "Creative Minds Daycare nurtures creativity and imagination through art, music, and dramatic play. Our Reggio Emilia-inspired approach encourages children to explore their interests and express themselves freely. Our beautiful coastal location provides unique opportunities for nature-based learning.",
    shortDescription: "Reggio Emilia-inspired program fostering creativity and imagination.",
    hours: "6:30 AM - 6:00 PM",
    languages: ["English", "Spanish"],
    curriculumType: "Reggio Emilia",
    mealsIncluded: true,
    outdoorSpace: true,
    specialNeeds: false,
    minTuition: 1600,
    maxTuition: 2400,
    availability: "full",
    profileCompleteness: 0.88,
    isVerified: false,
    lastUpdated: "2025-08-01",
    responseRate: 0.75,
    subscriptionTier: "free",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80"
    ]
  }
]

export const reviews: Review[] = [
  {
    id: "1",
    parentName: "Sarah M.",
    providerName: "Sunshine Learning Center",
    providerId: "1",
    rating: 5,
    text: "We absolutely love Sunshine Learning Center! The teachers are incredibly caring and attentive. My daughter has learned so much and looks forward to going every day. The Montessori approach really works for our family.",
    date: "2024-01-15"
  },
  {
    id: "2",
    parentName: "Michael T.",
    providerName: "Little Stars Academy",
    providerId: "2",
    rating: 5,
    text: "As first-time parents, we were nervous about leaving our infant, but Little Stars made the transition so smooth. The staff keeps us updated with photos and reports throughout the day. Highly recommend!",
    date: "2024-01-10"
  },
  {
    id: "3",
    parentName: "Jennifer L.",
    providerName: "Bright Horizons Daycare",
    providerId: "3",
    rating: 4,
    text: "Great STEM program! My son loves the science experiments and coding activities. The after-school program has been a lifesaver for our busy schedule. Only wish they had more outdoor time.",
    date: "2024-01-08"
  },
  {
    id: "4",
    parentName: "David R.",
    providerName: "Rainbow Kids Center",
    providerId: "4",
    rating: 5,
    text: "The bilingual program is amazing! My daughter is now fluent in both English and Spanish. The cultural celebrations are a highlight for our whole family. The teachers truly care about each child.",
    date: "2024-01-05"
  },
  {
    id: "5",
    parentName: "Emily K.",
    providerName: "Happy Hearts Preschool",
    providerId: "5",
    rating: 5,
    text: "Happy Hearts prepared my son so well for kindergarten. He entered school reading and doing basic math. The communication with parents is excellent, and the facility is always clean and welcoming.",
    date: "2024-01-03"
  },
  {
    id: "6",
    parentName: "Robert H.",
    providerName: "Creative Minds Daycare",
    providerId: "6",
    rating: 4,
    text: "Beautiful facility with creative teachers. My daughter's art projects are incredible! The beach trips and nature walks are unique to this daycare. Pricing is on the higher side but worth it.",
    date: "2023-12-28"
  },
  {
    id: "7",
    parentName: "Amanda S.",
    providerName: "Sunshine Learning Center",
    providerId: "1",
    rating: 5,
    text: "Three years with Sunshine and we couldn't be happier. Both of my kids have thrived here. The curriculum is thoughtfully designed and the parent involvement opportunities are wonderful.",
    date: "2023-12-20"
  },
  {
    id: "8",
    parentName: "Chris W.",
    providerName: "Little Stars Academy",
    providerId: "2",
    rating: 4,
    text: "Good infant care program with experienced caregivers. The low ratios mean my baby gets plenty of attention. The app for daily updates is convenient. Parking can be tricky during drop-off.",
    date: "2023-12-15"
  }
]

export const programs: Program[] = [
  {
    id: "1",
    slug: "infant-care",
    title: "Infant Care",
    icon: "Baby",
    shortDescription: "Nurturing care for babies 6 weeks to 12 months",
    fullDescription: "Our infant care programs provide a safe, nurturing environment where your baby can thrive. Experienced caregivers focus on developmental milestones, sensory exploration, and building secure attachments. With low caregiver-to-infant ratios, your little one receives individualized attention and care throughout the day.",
    benefits: [
      "Low caregiver-to-infant ratios (typically 1:3 or 1:4)",
      "Age-appropriate sensory activities and tummy time",
      "Daily communication with parents via app or log",
      "Flexible feeding and nap schedules",
      "Safe sleep practices following AAP guidelines"
    ]
  },
  {
    id: "2",
    slug: "toddler-care",
    title: "Toddler Care",
    icon: "Footprints",
    shortDescription: "Active learning for children ages 1-2 years",
    fullDescription: "Toddler programs support your child's growing independence and curiosity. Through play-based learning, toddlers develop language skills, motor coordination, and social abilities. Our safe, stimulating environments encourage exploration while building confidence and self-expression.",
    benefits: [
      "Play-based curriculum focused on exploration",
      "Language development through songs and stories",
      "Gross and fine motor skill activities",
      "Introduction to potty training support",
      "Social skill development through group play"
    ]
  },
  {
    id: "3",
    slug: "preschool",
    title: "Preschool",
    icon: "GraduationCap",
    shortDescription: "Kindergarten readiness for ages 3-5",
    fullDescription: "Preschool programs prepare children for academic success while nurturing their natural love of learning. Our comprehensive curriculum includes early literacy, math concepts, science exploration, and creative arts. Children develop the social-emotional skills needed to thrive in kindergarten and beyond.",
    benefits: [
      "Structured curriculum with academic foundations",
      "Early literacy and phonics instruction",
      "Introduction to math concepts and problem-solving",
      "Science experiments and nature exploration",
      "Art, music, and dramatic play opportunities"
    ]
  },
  {
    id: "4",
    slug: "montessori",
    title: "Montessori",
    icon: "Blocks",
    shortDescription: "Child-led learning in prepared environments",
    fullDescription: "Montessori programs follow the proven educational philosophy developed by Dr. Maria Montessori. Children learn at their own pace in carefully prepared environments with specially designed materials. This approach develops independence, concentration, and a genuine love for learning.",
    benefits: [
      "Mixed-age classrooms (typically 3-6 years)",
      "Self-directed learning with teacher guidance",
      "Hands-on Montessori materials and activities",
      "Focus on practical life skills",
      "Respect for each child's individual development"
    ]
  },
  {
    id: "5",
    slug: "home-daycare",
    title: "Home Daycare",
    icon: "Home",
    shortDescription: "Small-group care in a home setting",
    fullDescription: "Home daycare programs offer intimate, family-style care in a provider's home. With smaller group sizes, children receive individualized attention in a cozy, comfortable environment. Many parents appreciate the home-like atmosphere and the strong bonds formed with consistent caregivers.",
    benefits: [
      "Small group sizes (typically 6-12 children)",
      "Home-like, comfortable environment",
      "Consistent caregiver relationships",
      "Often more flexible hours and schedules",
      "Typically more affordable than centers"
    ]
  },
  {
    id: "6",
    slug: "after-school",
    title: "After School Programs",
    icon: "Backpack",
    shortDescription: "Care and enrichment for school-age children",
    fullDescription: "After school programs provide safe, supervised care for children during after-school hours. Our programs balance homework help with enrichment activities, physical play, and social time. Children have the opportunity to explore new interests while building friendships.",
    benefits: [
      "Homework help and tutoring support",
      "Enrichment activities (art, STEM, sports)",
      "Healthy snacks provided",
      "Transportation from local schools",
      "Flexible pickup times until 6-7 PM"
    ]
  },
  {
    id: "7",
    slug: "special-needs",
    title: "Special Needs Programs",
    icon: "Heart",
    shortDescription: "Inclusive care for children with diverse needs",
    fullDescription: "Special needs programs provide inclusive, supportive care for children with developmental differences, disabilities, or special requirements. Our trained staff work closely with families and therapists to create individualized care plans that help every child reach their potential.",
    benefits: [
      "Trained staff in special needs care",
      "Individualized education plans (IEPs) supported",
      "Therapy integration (speech, OT, PT)",
      "Inclusive classrooms when appropriate",
      "Strong family communication and partnership"
    ]
  }
]

export const cities = [
  { name: "Austin", state: "TX", slug: "austin", providerCount: 245 },
  { name: "Phoenix", state: "AZ", slug: "phoenix", providerCount: 312 },
  { name: "Miami", state: "FL", slug: "miami", providerCount: 187 },
  { name: "Dallas", state: "TX", slug: "dallas", providerCount: 298 },
  { name: "San Diego", state: "CA", slug: "san-diego", providerCount: 223 },
]

export const cityStats = {
  austin: {
    averageCost: "$1,450",
    totalProviders: 245,
    topRated: 42,
    waitlistAvg: "3 months"
  },
  phoenix: {
    averageCost: "$1,280",
    totalProviders: 312,
    topRated: 56,
    waitlistAvg: "2 months"
  },
  miami: {
    averageCost: "$1,520",
    totalProviders: 187,
    topRated: 31,
    waitlistAvg: "4 months"
  },
  dallas: {
    averageCost: "$1,380",
    totalProviders: 298,
    topRated: 48,
    waitlistAvg: "2.5 months"
  },
  "san-diego": {
    averageCost: "$1,680",
    totalProviders: 223,
    topRated: 38,
    waitlistAvg: "3.5 months"
  }
}

export function getProvidersByCity(city: string): Provider[] {
  return providers.filter(p => p.city.toLowerCase() === city.toLowerCase())
}

export function getProviderBySlug(slug: string): Provider | undefined {
  return providers.find(p => p.slug === slug)
}

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find(p => p.slug === slug)
}

export function getReviewsByProvider(providerId: string): Review[] {
  return reviews.filter(r => r.providerId === providerId)
}
