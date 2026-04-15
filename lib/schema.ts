import "server-only"
import { toAbsoluteUrl } from "@/lib/sitemap"
import type { PublicReviewRow } from "@/lib/parent-engagement"

type ProviderFaq = {
  question: string
  answer: string
}

type LocalBusinessSchemaInput = {
  slug: string
  name: string
  description?: string
  address?: string
  phone?: string
  website?: string
  hours?: string
  image?: string
  displayRating?: number
  displayReviewCount?: number
  reviews?: PublicReviewRow[]
  faqs?: ProviderFaq[]
}

type JsonLdValue = Record<string, unknown>
type BreadcrumbItemInput = {
  name: string
  url: string
}
type WebSiteSchemaInput = {
  url: string
  name: string
  description?: string
}
type WebPageSchemaInput = {
  url: string
  name: string
  description?: string
  image?: string
  isPartOf?: string
}
type ArticleSchemaInput = {
  url: string
  headline: string
  description?: string
  image?: string
  datePublished?: string | null
  authorName?: string
  publisherName?: string
}

const CONTACT_FOR_HOURS = "contact for hours"

function cleanText(value: string | null | undefined): string | null {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function toIsoDate(value: string): string | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function sanitizeJsonLd(value: string): string {
  return value
    .replace(/</g, "\\u003c")
    .replace(/-->/g, "--\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function stringifyJsonLd(value: JsonLdValue): string {
  return sanitizeJsonLd(JSON.stringify(value))
}

export function buildFaqPageSchema(faqs: ProviderFaq[]): JsonLdValue | null {
  const validFaqs = faqs
    .map((faq) => ({
      question: cleanText(faq.question),
      answer: cleanText(faq.answer),
    }))
    .filter((faq) => faq.question && faq.answer)

  if (validFaqs.length === 0) return null

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: validFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function buildBreadcrumbSchema(items: BreadcrumbItemInput[]): JsonLdValue | null {
  const validItems = items
    .map((item) => ({
      name: cleanText(item.name),
      url: cleanText(item.url),
    }))
    .filter((item) => item.name && item.url)

  if (validItems.length === 0) return null

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: validItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildWebSiteSchema(input: WebSiteSchemaInput): JsonLdValue {
  const description = cleanText(input.description)
  const schema: JsonLdValue = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${input.url}#website`,
    url: input.url,
    name: input.name,
  }

  if (description) schema.description = description
  return schema
}

export function buildWebPageSchema(input: WebPageSchemaInput): JsonLdValue {
  const description = cleanText(input.description)
  const image = cleanText(input.image)
  const isPartOf = cleanText(input.isPartOf)
  const schema: JsonLdValue = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
  }

  if (description) schema.description = description
  if (image) schema.image = [image]
  if (isPartOf) {
    schema.isPartOf = {
      "@id": `${isPartOf}#website`,
    }
  }
  return schema
}

export function buildArticleSchema(input: ArticleSchemaInput): JsonLdValue {
  const description = cleanText(input.description)
  const image = cleanText(input.image)
  const authorName = cleanText(input.authorName) ?? "Editorial team"
  const publisherName = cleanText(input.publisherName) ?? authorName
  const datePublished = input.datePublished ? toIsoDate(input.datePublished) : null

  const schema: JsonLdValue = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${input.url}#article`,
    mainEntityOfPage: input.url,
    headline: input.headline,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
    },
  }

  if (description) schema.description = description
  if (image) schema.image = [image]
  if (datePublished) schema.datePublished = datePublished
  return schema
}

function buildReviewSchema(review: PublicReviewRow): JsonLdValue | null {
  const body = cleanText(review.review_text)
  if (!body) return null

  const authorName = cleanText(review.parent_display_name) ?? "Anonymous"
  const datePublished = toIsoDate(review.created_at)

  const reviewSchema: JsonLdValue = {
    "@type": "Review",
    reviewBody: body,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: authorName,
    },
  }

  if (datePublished) {
    reviewSchema.datePublished = datePublished
  }

  return reviewSchema
}

export function buildLocalBusinessSchema(input: LocalBusinessSchemaInput): JsonLdValue {
  const pageUrl = toAbsoluteUrl(`/providers/${input.slug}`)
  const website = cleanText(input.website)
  const phone = cleanText(input.phone)
  const address = cleanText(input.address)
  const description = cleanText(input.description)
  const image = cleanText(input.image)
  const hours = cleanText(input.hours)
  const reviewSchemas = (input.reviews ?? [])
    .map((review) => buildReviewSchema(review))
    .filter((review): review is JsonLdValue => review != null)

  const schema: JsonLdValue = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${pageUrl}#localbusiness`,
    url: pageUrl,
    name: input.name,
  }

  if (description) schema.description = description
  if (image) schema.image = [image]
  if (website) schema.sameAs = [website]
  if (phone) schema.telephone = phone
  if (address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: address,
    }
    schema.hasMap = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  if (hours && hours.toLowerCase() !== CONTACT_FOR_HOURS) {
    schema.openingHours = hours
  }

  if ((input.displayReviewCount ?? 0) > 0 && (input.displayRating ?? 0) > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(input.displayRating?.toFixed(1)),
      reviewCount: input.displayReviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (reviewSchemas.length > 0) {
    schema.review = reviewSchemas
  }

  return schema
}
