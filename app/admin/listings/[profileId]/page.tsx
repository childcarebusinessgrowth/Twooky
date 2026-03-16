import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminListingDetail } from "../actions"
import { ListingDetailActions } from "./ListingDetailActions"

type PageProps = {
  params: Promise<{ profileId: string }>
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        {children}
      </CardContent>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null
  return (
    <div>
      <span className="font-medium text-foreground">{label}:</span> {value}
    </div>
  )
}

export default async function AdminListingDetailPage({ params }: PageProps) {
  const { profileId } = await params
  const data = await getAdminListingDetail(profileId)
  if (!data) notFound()

  const { profile, photos } = data
  const name = profile.business_name || profile.provider_slug || profileId

  return (
    <div className="space-y-6">
      <nav className="text-sm">
        <Link href="/admin/listings" className="text-primary hover:underline">
          Listings
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <div className="flex items-center gap-2 mt-1">
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
        <Section title="Basic info">
          <Field label="Business name" value={profile.business_name} />
          <Field label="Slug" value={profile.provider_slug} />
          <Field label="Phone" value={profile.phone} />
          <Field label="City" value={profile.city} />
          <Field label="Address" value={profile.address} />
          <Field
            label="Website"
            value={
              profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website}
                </a>
              ) : null
            }
          />
          <Field label="Google Place ID" value={profile.google_place_id} />
          <Field label="Country ID" value={profile.country_id} />
          <Field label="City ID" value={profile.city_id} />
        </Section>

        <Section title="Program">
          <Field
            label="Provider types"
            value={
              profile.provider_types?.length
                ? profile.provider_types.join(", ")
                : null
            }
          />
          <Field
            label="Age groups"
            value={
              profile.age_groups_served?.length
                ? profile.age_groups_served.join(", ")
                : null
            }
          />
          <Field label="Curriculum" value={profile.curriculum_type} />
          <Field label="Languages" value={profile.languages_spoken} />
          <Field
            label="Amenities"
            value={
              profile.amenities?.length ? profile.amenities.join(", ") : null
            }
          />
        </Section>

        <Section title="Operating">
          <Field label="Opening time" value={profile.opening_time} />
          <Field label="Closing time" value={profile.closing_time} />
          <Field
            label="Tuition"
            value={
              profile.monthly_tuition_from != null || profile.monthly_tuition_to != null
                ? `${profile.monthly_tuition_from ?? "—"} – ${profile.monthly_tuition_to ?? "—"}`
                : null
            }
          />
          <Field label="Total capacity" value={profile.total_capacity} />
        </Section>

        <Section title="Virtual tour">
          <Field label="URL" value={profile.virtual_tour_url} />
          <Field
            label="URLs"
            value={
              profile.virtual_tour_urls?.length
                ? profile.virtual_tour_urls.join(", ")
                : null
            }
          />
        </Section>
      </div>

      {profile.description ? (
        <Section title="Description">
          <p className="whitespace-pre-wrap text-foreground">
            {profile.description}
          </p>
        </Section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos ({photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos uploaded.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? "Provider photo"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    {photo.is_primary && (
                      <Badge className="mr-1 text-xs">Primary</Badge>
                    )}
                    {photo.caption ?? "—"}
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
