import Link from "next/link"
import { notFound } from "next/navigation"
import { guardRoleOrRedirect } from "@/lib/authzServer"
import { Card, CardContent } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getAdminListingDetail } from "../../actions"
import { getAdminProviderCreateOptions } from "../../new/actions"
import { AdminListingPhotosSection } from "../AdminListingPhotosSection"
import { AdminEditProviderForm } from "./AdminEditProviderForm"

type PageProps = {
  params: Promise<{ profileId: string }>
}

export default async function AdminEditListingPage({ params }: PageProps) {
  await guardRoleOrRedirect("admin")
  const { profileId } = await params

  const [data, options] = await Promise.all([
    getAdminListingDetail(profileId),
    getAdminProviderCreateOptions(),
  ])

  if (!data) notFound()

  const name = data.profile.business_name || data.profile.provider_slug || profileId

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/listings">Listings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/listings/${profileId}`}>{name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Listing</h1>
        <p className="text-muted-foreground">
          Update the provider listing details, FAQs, and add new photos.
        </p>
      </div>

      <Card className="border-border/50">
        <CardContent className="px-6 py-6 lg:px-8">
          <AdminEditProviderForm
            profileId={profileId}
            initialData={data}
            countries={options.countries}
            cities={options.cities}
            languages={options.languages}
            curriculum={options.curriculum}
            currencies={options.currencies}
          />
        </CardContent>
      </Card>

      <AdminListingPhotosSection
        profileId={profileId}
        photos={data.photos}
      />
    </div>
  )
}
