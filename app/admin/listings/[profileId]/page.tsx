import Image from "next/image"
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
  ImageIcon,
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
import { ListingDetailActions } from "./ListingDetailActions"
import { ListingPhotoUploader } from "./ListingPhotoUploader"
import {
  getProviderTypeLabel,
  getAgeGroupLabel,
  getAmenityLabel,
  getCurriculumLabel,
} from "@/lib/listing-labels"
import { formatTuitionRange } from "@/lib/currency"

type PageProps = {
  params: Promise<{ profileId: string }>
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
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
    <div className="flex gap-3">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-foreground">{value}</div>
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

  const { profile, photos, faqs } = data
  const name = profile.business_name || profile.provider_slug || profileId

  const hasVirtualTour =
    (profile.virtual_tour_urls?.length ?? 0) > 0 || !!profile.virtual_tour_url
  const virtualTourUrls =
    profile.virtual_tour_urls?.filter(Boolean) ??
    (profile.virtual_tour_url ? [profile.virtual_tour_url] : [])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <div className="flex flex-wrap items-start justify-between gap-4">
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
          </div>
        </div>
        <ListingDetailActions
          profileId={profile.profile_id}
          listingStatus={profile.listing_status}
          featured={profile.featured}
          name={name}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Basic info" icon={Building2}>
          <Field label="Business name" value={profile.business_name} />
          <Field label="Slug" value={profile.provider_slug} />
          <Field
            label="Phone"
            value={
              profile.phone ? (
                <a
                  href={`tel:${profile.phone}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </a>
              ) : null
            }
            icon={Phone}
          />
          <Field
            label="Website"
            value={
              profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
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
          <Field label="Languages" value={profile.languages_spoken} />
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

        <Section title="Operating" icon={Clock}>
          <Field label="Opening time" value={profile.opening_time} />
          <Field label="Closing time" value={profile.closing_time} />
          <Field
            label="Tuition"
            value={
              profile.monthly_tuition_from != null ||
              profile.monthly_tuition_to != null
                ? formatTuitionRange(
                    profile.monthly_tuition_from,
                    profile.monthly_tuition_to,
                    (profile as { currencies?: { symbol?: string } | null }).currencies?.symbol ?? "$"
                  )
                : null
            }
          />
          <Field label="Total capacity" value={profile.total_capacity} />
        </Section>

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
        <Card className="border-border/60">
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

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Photos ({photos.length})
            </CardTitle>
            <ListingPhotoUploader profileId={profile.profile_id} />
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No photos yet. Add photos to showcase your listing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? "Provider photo"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-white">
                      {photo.is_primary && (
                        <Badge className="mr-1 border-0 bg-white/20 text-xs text-white hover:bg-white/20">
                          Primary
                        </Badge>
                      )}
                      <span className="line-clamp-2">
                        {photo.caption ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Created: {new Date(profile.created_at).toLocaleString()}
      </p>
    </div>
  )
}
