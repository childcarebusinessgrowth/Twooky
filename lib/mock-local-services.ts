export type LocalService = {
  id: string
  name: string
  category: string
  description: string
  imageUrl?: string
  location: string
  ctaUrl?: string
  ctaLabel?: string
}

export type ParentDiscount = {
  id: string
  companyName: string
  offer: string
  description?: string
  expiry?: string
  code?: string
  category?: string
}

export const MOCK_LOCAL_SERVICES: LocalService[] = [
  {
    id: "1",
    name: "Little Splash Swim School",
    category: "Swimming",
    description: "Gentle, confidence-building swim lessons for babies and toddlers. Heated pool, small class sizes, and certified instructors.",
    location: "Downtown",
    ctaUrl: "#",
    ctaLabel: "Learn more",
  },
  {
    id: "2",
    name: "Cuddle & Stretch Baby Yoga",
    category: "Baby Classes",
    description: "Bond with your little one through gentle yoga and movement. Perfect for newborns to 24 months.",
    location: "Westside",
    ctaUrl: "#",
    ctaLabel: "Book a class",
  },
  {
    id: "3",
    name: "Tiny Tunes Music",
    category: "Music",
    description: "Interactive music classes that develop rhythm, coordination, and social skills. Ages 6 months to 5 years.",
    location: "Central",
    ctaUrl: "#",
    ctaLabel: "Free trial",
  },
  {
    id: "4",
    name: "Little Gym",
    category: "Baby Classes",
    description: "Movement, gymnastics, and play for ages 4 months to 12 years. Build strength, balance, and confidence.",
    location: "North Park",
    ctaUrl: "#",
    ctaLabel: "Visit website",
  },
  {
    id: "5",
    name: "Aqua Tots",
    category: "Swimming",
    description: "Survival swim skills and water safety for infants and toddlers. Parent-child and independent options.",
    location: "Eastside",
    ctaUrl: "#",
    ctaLabel: "Enroll now",
  },
]

export const MOCK_PARENT_DISCOUNTS: ParentDiscount[] = [
  {
    id: "1",
    companyName: "Little Splash Swim School",
    offer: "20% off first month",
    description: "New families get 20% off their first month of swim lessons.",
    expiry: "Valid until Dec 31",
    code: "EARLYLEARN20",
    category: "Swimming",
  },
  {
    id: "2",
    companyName: "Tiny Tunes Music",
    offer: "Free trial class",
    description: "Try your first music class free — no commitment required.",
    expiry: "Ongoing",
    category: "Music",
  },
  {
    id: "3",
    companyName: "Little Gym",
    offer: "15% off enrollment",
    description: "Exclusive Early Learning discount on new enrollments.",
    expiry: "Valid until Dec 31",
    code: "PARENT15",
    category: "Baby Classes",
  },
  {
    id: "4",
    companyName: "Cuddle & Stretch Baby Yoga",
    offer: "Buy 5, get 1 free",
    description: "Purchase a 5-class pack and receive one class free.",
    expiry: "Limited time",
    category: "Baby Classes",
  },
  {
    id: "5",
    companyName: "Aqua Tots",
    offer: "Free water safety assessment",
    description: "Complimentary 15-minute water safety assessment for new families.",
    expiry: "Ongoing",
    category: "Swimming",
  },
]
