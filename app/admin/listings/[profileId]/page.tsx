import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Building2,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  MapPin,
  Phone,
  Video,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getAdminListingDetail } from "../actions"
import { AdminListingPhotosSection } from "./AdminListingPhotosSection"
import { ListingDetailActions } from "./ListingDetailActions"
import {
  getProviderTypeLabel,
  getAgeGroupLabel,
  getAmenityLabel,
  getCurriculumLabel,
} from "@/lib/listing-labels"
import { formatDailyFeeRange } from "@/lib/currency"
import { VerifiedProviderBadge } from "@/components/verified-provider-badge"
import { normalizeProviderWebsiteUrl } from "@/lib/normalize-provider-website-url"

type PageProps = {
  params: Promise<{ profileId: string }>
}

function Section({
  title,
  icon: Icon,
  gridCols,
  children,
}: {
  title: string
  icon: React.ElementType
  gridCols?: boolean
  children: React.ReactNode
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={
          gridCols
            ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm"
            : "space-y-4 text-sm"
        }
      >
        {children}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ElementType
}) {
  if (value == null || value === "") return null
  return (
    <div className="flex min-w-0 gap-3">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 font-medium text-foreground wrap-break-word">
          {value}
        </div>
      </div>
    </div>
  )
}

function BadgeList({
  ids,
  getLabel,
}: {
  ids: string[]
  getLabel: (id: string) => string
}) {
  if (!ids?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => (
        <Badge key={id} variant="secondary" className="font-normal">
          {getLabel(id)}
        </Badge>
      ))}
    </div>
  )
}

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { profileId } = await params
  const data = await getAdminListingDetail(profileId)
  if (!data) notFound()

  const { profile, photos, faqs, documents } = data
  const name = profile.business_name || profile.provider_slug || profileId
  const websiteHref = normalizeProviderWebsiteUrl(profile.website)

  const hasVirtualTour =
    (profile.virtual_tour_urls?.length ?? 0) > 0 || !!profile.virtual_tour_url
  const virtualTourUrls =
    profile.virtual_tour_urls?.filter(Boolean) ??
    (profile.virtual_tour_url ? [profile.virtual_tour_url] : [])

  return (
    <div className="w-full space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/listings">Listings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                profile.listing_status === "active"
                  ? "default"
                  : profile.listing_status === "pending"
                    ? "secondary"
                    : "outline"
              }
            >
              {profile.listing_status}
            </Badge>
            {profile.featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {profile.early_learning_excellence_badge && (
              <Badge
                variant="outline"
                className="border-amber-300/70 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
              >
                Early Learning Excellence
              </Badge>
            )}
            {profile.verified_provider_badge && (
              <VerifiedProviderBadge
                size="sm"
                color={profile.verified_provider_badge_color}
              />
            )}
          </div>
        </div>
        <ListingDetailActions
          profileId={profile.profile_id}
          listingStatus={profile.listing_status}
          featured={profile.featured}
          earlyLearningExcellenceBadge={profile.early_learning_excellence_badge}
          verifiedProviderBadge={profile.verified_provider_badge}
          verifiedProviderBadgeColor={profile.verified_provider_badge_color}
          name={name}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Section title="Basic info" icon={Building2} gridCols>
          <Field label="Business name" value={profile.business_name} />
          <Field label="Slug" value={profile.provider_slug} />
          <Field
            label="Phone"
            value={
              profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="text-primary hover:underline"
                >
                  {profile.phone}
                </a>
              ) : null
            }
            icon={Phone}
          />
          <Field
            label="Website"
            value={
              profile.website && websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-primary hover:underline"
                >
                  <span className="min-w-0 break-all">{profile.website}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : profile.website ? (
                <span className="min-w-0 break-all">{profile.website}</span>
              ) : null
            }
            icon={Globe}
          />
          <Field
            label="Address"
            value={profile.address}
            icon={MapPin}
          />
          <Field label="City" value={profile.city} />
          <Field label="Country" value={profile.country_name} />
          <Field label="Directory city" value={profile.city_name} />
          <Field label="Google Place ID" value={profile.google_place_id} />
        </Section>

        <Section title="Program" icon={GraduationCap}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Provider types
            </p>
            <div className="mt-1.5">
              <BadgeList
                ids={profile.provider_types ?? []}
                getLabel={getProviderTypeLabel}
              />
              {!profile.provider_types?.length && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Age groups
            </p>
            <div className="mt-1.5">
              <BadgeList
                ids={profile.age_groups_served ?? []}
                getLabel={getAgeGroupLabel}
              />
              {!profile.age_groups_served?.length && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Curriculum
            </p>
            <div className="mt-1.5">
              <BadgeList
                ids={profile.curriculum_type ?? []}
                getLabel={getCurriculumLabel}
              />
              {!profile.curriculum_type?.length && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Languages
            </p>
            <div className="mt-1.5">
              <BadgeList
                ids={
                  (profile.languages_spoken ?? "")
                    .split(/[\s,;]+/)
                    .filter(Boolean)
                }
                getLabel={(x) => x}
              />
              {!(profile.languages_spoken ?? "").trim() && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Amenities
            </p>
            <div className="mt-1.5">
              <BadgeList
                ids={profile.amenities ?? []}
                getLabel={getAmenityLabel}
              />
              {!profile.amenities?.length && (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </Section>

        <Section title="Operating" icon={Clock} gridCols>
          <Field label="Opening time" value={profile.opening_time} />
          <Field label="Closing time" value={profile.closing_time} />
          <Field
            label="Daily fee"
            value={
              profile.daily_fee_from != null ||
              profile.daily_fee_to != null
                ? formatDailyFeeRange(
                    profile.daily_fee_from,
                    profile.daily_fee_to,
                    (profile as { currencies?: { symbol?: string } | null }).currencies?.symbol ?? "$"
                  )
                : null
            }
          />
          <Field
            label="Registration fee"
            value={
              profile.registration_fee != null
                ? `${(profile as { currencies?: { symbol?: string } | null }).currencies?.symbol ?? "$"}${profile.registration_fee}`
                : null
            }
          />
          <Field
            label="Deposit"
            value={
              profile.deposit_fee != null
                ? `${(profile as { currencies?: { symbol?: string } | null }).currencies?.symbol ?? "$"}${profile.deposit_fee}`
                : null
            }
          />
          <Field
            label="Meals fee"
            value={
              profile.meals_fee != null
                ? `${(profile as { currencies?: { symbol?: string } | null }).currencies?.symbol ?? "$"}${profile.meals_fee}`
                : null
            }
          />
          <Field
            label="Additional services"
            value={
              [
                profile.service_transport ? "Transport" : null,
                profile.service_extended_hours ? "Extended Hours" : null,
                profile.service_pickup_dropoff ? "Pickup / Drop-off" : null,
                profile.service_extracurriculars ? "Extracurriculars" : null,
              ]
                .filter(Boolean)
                .join(", ") || null
            }
          />
          <Field label="Total capacity" value={profile.total_capacity} />
        </Section>

        {documents.length > 0 && (
          <Section title="Verification Documents" icon={FileText}>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.signed_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-primary hover:bg-muted hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {doc.document_type}
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-muted-foreground text-xs">
                    ({(doc.file_size / 1024).toFixed(1)} KB)
                  </span>
                </a>
              ))}
            </div>
          </Section>
        )}

        {hasVirtualTour && (
          <Section title="Virtual tour" icon={Video}>
            <div className="space-y-2">
              {virtualTourUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {url}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>

      {profile.description ? (
        <Section title="Description" icon={FileText}>
          <p className="whitespace-pre-wrap text-foreground">
            {profile.description}
          </p>
        </Section>
      ) : null}

      {faqs.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="hover:no-underline">
                    {faq.question || "Untitled FAQ"}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      <AdminListingPhotosSection
        profileId={profile.profile_id}
        photos={photos}
      />

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Created: {new Date(profile.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
