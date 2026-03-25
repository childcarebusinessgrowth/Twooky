export type BulkImportColumn = {
  /**
   * Column header as it appears in CSV/XLSX.
   * This is intentionally stable to preserve backwards compatibility.
   */
  header: string
  /**
   * Internal key used by parsing/normalization.
   */
  key: string
  required?: boolean
  description: string
  example?: string
}

export const BULK_PROVIDER_IMPORT_COLUMNS: BulkImportColumn[] = [
  {
    header: "businessName",
    key: "businessName",
    required: true,
    description: "Provider/business name.",
    example: "Little Stars Nursery",
  },
  {
    header: "description",
    key: "description",
    required: true,
    description: "Public description shown on the listing.",
    example: "A warm, play-based early years program for ages 0–5.",
  },
  {
    header: "phone",
    key: "phone",
    description: "Optional phone number (free text).",
    example: "+971 50 123 4567",
  },
  {
    header: "website",
    key: "website",
    description: "Optional website URL.",
    example: "https://littlestars.example",
  },
  {
    header: "address",
    key: "address",
    required: true,
    description: "Street address (used with businessName to resolve Google Place Id server-side).",
    example: "123 Palm Street, Building A",
  },
  {
    header: "city",
    key: "city",
    required: true,
    description: "City display name saved on the profile (free text).",
    example: "Dubai",
  },
  {
    header: "country",
    key: "country",
    description: "Optional country name (will be mapped to countryId). Prefer this over countryId.",
    example: "United Arab Emirates",
  },
  {
    header: "countryId",
    key: "countryId",
    description: "Optional country UUID id (advanced). If set, must exist and be active.",
  },
  {
    header: "cityCatalog",
    key: "cityCatalog",
    description:
      "Optional city name to map to the Cities catalog (will be mapped to cityId). Use when you want the listing linked to a catalog city.",
    example: "Dubai",
  },
  {
    header: "cityId",
    key: "cityId",
    description: "Optional city UUID id (advanced). If set, must exist, be active, and match countryId when provided.",
  },
  {
    header: "listingStatus",
    key: "listingStatus",
    description: "Optional. One of: active, pending, inactive. Defaults to active.",
    example: "active",
  },
  {
    header: "featured",
    key: "featured",
    description: "Optional. true/false (or 1/0).",
    example: "false",
  },
  {
    header: "openingTime",
    key: "openingTime",
    description: "Optional opening time (free text).",
    example: "08:00",
  },
  {
    header: "closingTime",
    key: "closingTime",
    description: "Optional closing time (free text).",
    example: "18:00",
  },
  {
    header: "currencyCode",
    key: "currencyCode",
    description: "Optional currency code (maps to currencyId). Prefer this over currencyId.",
    example: "AED",
  },
  {
    header: "currencyId",
    key: "currencyId",
    description: "Optional currency UUID id (advanced). If set, must exist and be active.",
  },
  {
    header: "dailyFeeFrom",
    key: "dailyFeeFrom",
    description: "Optional. Non-negative integer.",
    example: "120",
  },
  {
    header: "dailyFeeTo",
    key: "dailyFeeTo",
    description: "Optional. Non-negative integer; must be >= dailyFeeFrom when both set.",
    example: "180",
  },
  {
    header: "registrationFee",
    key: "registrationFee",
    description: "Optional. Non-negative integer.",
    example: "500",
  },
  {
    header: "depositFee",
    key: "depositFee",
    description: "Optional. Non-negative integer.",
    example: "0",
  },
  {
    header: "mealsFee",
    key: "mealsFee",
    description: "Optional. Non-negative integer.",
    example: "25",
  },
  {
    header: "totalCapacity",
    key: "totalCapacity",
    description: "Optional. Integer (total capacity).",
    example: "80",
  },
  {
    header: "serviceTransport",
    key: "serviceTransport",
    description: "Optional. true/false (or 1/0).",
    example: "false",
  },
  {
    header: "serviceExtendedHours",
    key: "serviceExtendedHours",
    description: "Optional. true/false (or 1/0).",
    example: "true",
  },
  {
    header: "servicePickupDropoff",
    key: "servicePickupDropoff",
    description: "Optional. true/false (or 1/0).",
    example: "false",
  },
  {
    header: "serviceExtracurriculars",
    key: "serviceExtracurriculars",
    description: "Optional. true/false (or 1/0).",
    example: "true",
  },
  {
    header: "languagesSpoken",
    key: "languagesSpoken",
    description: "Optional languages (free text).",
    example: "English, Arabic",
  },
  {
    header: "providerTypes",
    key: "providerTypes",
    description: "Optional. Comma-separated ids used by the app (advanced).",
    example: "nursery,preschool",
  },
  {
    header: "ageGroupsServed",
    key: "ageGroupsServed",
    description: "Optional. Comma-separated age group ids (e.g. infant,toddler,prek).",
    example: "toddler,preschool,prek",
  },
  {
    header: "amenities",
    key: "amenities",
    description: "Optional. Comma-separated amenity ids (e.g. meals_included,outdoor_play_area).",
    example: "meals_included,outdoor_play_area",
  },
  {
    header: "curriculumTypes",
    key: "curriculumTypes",
    description:
      "Optional. Comma-separated curriculum philosophy names from the catalog (will be mapped to ids).",
    example: "Montessori, Reggio Emilia",
  },
  {
    header: "virtualTourUrls",
    key: "virtualTourUrls",
    description:
      "Optional. One or more YouTube URLs separated by commas. Max 8; invalid URLs will be rejected per-row.",
    example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    header: "faqsJson",
    key: "faqsJson",
    description:
      'Optional. JSON array of FAQ objects. Example: [{"question":"...","answer":"..."}]. Max 30.',
  },
] as const

export const BULK_PROVIDER_IMPORT_HEADERS = BULK_PROVIDER_IMPORT_COLUMNS.map((c) => c.header)

