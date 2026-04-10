import { cache } from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Heart,
  Clock,
  Users,
  Languages,
  Utensils,
  TreePine,
  GraduationCap,
  Check,
  Tags,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getActivePublicProviderBySlug } from "@/lib/get-public-provider"
import { normalizeProviderWebsiteUrl } from "@/lib/normalize-provider-website-url"
import { ProviderFavoriteButton } from "@/components/provider-favorite-button"
import { ProviderProfileViewTracker } from "@/components/provider-profile-view-tracker"
import { SendInquiryButton } from "@/components/send-inquiry-button"
import { ProviderLocationMapLazy } from "@/components/provider-location-map-lazy"
import { ProviderReviewsTab } from "@/components/provider-reviews-tab"
import { EarlyLearningExcellenceBadge } from "@/components/early-learning-excellence-badge"
import { VerifiedProviderBadge } from "@/components/verified-provider-badge"
import { AuthProviderClient } from "@/components/auth-provider-client"
import { ProviderProgramOwnerStrip } from "@/components/provider-program-owner-strip"

interface ProviderPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 120

const getProviderBySlugCached = cache(async (slug: string) => {
  const supabase = getSupabaseAdminClient()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  return getActivePublicProviderBySlug(supabase, slug, baseUrl)
})

export async function generateMetadata({ params }: ProviderPageProps) {
  const { slug } = await params
  const provider = await getProviderBySlugCached(slug)

  if (!provider) {
    return { title: "Provider Not Found" }
  }

  return {
    title: `${provider.name} | Twooky`,
    description: provider.description.slice(0, 160),
  }
}

const availabilityBadgeClassByStatus: Record<"openings" | "waitlist" | "full", string> = {
  openings: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/40",
  waitlist: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/40",
  full: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/60",
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params
  const provider = await getProviderBySlugCached(slug)

  if (!provider) {
    notFound()
  }

  const p = provider
  const websiteHref = normalizeProviderWebsiteUrl(p.website)

  return (
    <AuthProviderClient>
      <div className="min-h-screen bg-background">
        <ProviderProfileViewTracker slug={p.slug} />
      {/* Hero Image */}
      <section className="relative h-64 md:h-80 lg:h-96 bg-muted overflow-hidden">
        <Image
          src={p.image}
          alt={p.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 lg:px-8 -mt-20 relative z-10">
        <ProviderProgramOwnerStrip />
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Provider Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {p.name}
                      </h1>
                      <Badge
                        variant="outline"
                        className={availabilityBadgeClassByStatus[p.availabilityStatus]}
                      >
                        {p.availabilityLabel}
                      </Badge>
                      {p.verifiedProviderBadge && (
                        <VerifiedProviderBadge size="md" color={p.verifiedProviderBadgeColor} />
                      )}
                      {p.earlyLearningExcellenceBadge && (
                        <EarlyLearningExcellenceBadge size="md" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">
                          {p.displayRating > 0 ? p.displayRating.toFixed(1) : ","}
                        </span>
                        {p.googleReviewsUrl ? (
                          <a
                            href={p.googleReviewsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground hover:underline transition-colors"
                          >
                            ({p.displayReviewCount} Google reviews)
                          </a>
                        ) : (
                          <span>({p.displayReviewCount} reviews)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{p.address || ","}</span>
                      </div>
                    </div>
                    {p.providerTypes.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Tags className="h-4 w-4" />
                        <div className="flex flex-wrap gap-1.5">
                          {p.providerTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs font-medium">
                              {type
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {p.programTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ProviderFavoriteButton
                      providerProfileId={p.profileId}
                      providerSlug={slug}
                    />
                    {websiteHref ? (
                      <Button className="bg-primary hover:bg-primary/90" asChild>
                        <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="programs">Programs</TabsTrigger>
                <TabsTrigger value="virtual-tour">Virtual Tour</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="reviews">Twooky Reviews</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                {p.faqs.length > 0 && (
                  <TabsTrigger value="faqs">FAQs</TabsTrigger>
                )}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Age Groups</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.ageGroups.map((age) => (
                          <Badge key={age} variant="outline">{age}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Hours</h3>
                      </div>
                      <p className="text-muted-foreground">{p.hours}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Languages className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Languages</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.languages.map((lang) => (
                          <Badge key={lang} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">Curriculum</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.curriculumTypes.length > 0 ? (
                          p.curriculumTypes.map((c) => (
                            <Badge key={c} variant="outline">{c}</Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">,</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Amenities & Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {p.mealsIncluded && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Utensils className="h-4 w-4 text-primary" />
                          <span>Meals Included</span>
                        </div>
                      )}
                      {p.outdoorSpace && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TreePine className="h-4 w-4 text-primary" />
                          <span>Outdoor Play Area</span>
                        </div>
                      )}
                      {p.specialNeeds && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Heart className="h-4 w-4 text-primary" />
                          <span>Special Needs Support</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Programs Tab */}
              <TabsContent value="programs" className="mt-6">
                <div className="grid gap-4">
                  {p.programTypes.map((program, index) => (
                    <Card key={program}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground mb-2">{program}</h3>
                            <p className="text-muted-foreground text-sm mb-3">
                              A comprehensive {program.toLowerCase()} program designed for early childhood development 
                              with age-appropriate activities and experienced educators.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Ages {p.ageGroups[index % p.ageGroups.length] || ","}
                              </span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Learn More</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Virtual Tour Tab */}
              <TabsContent value="virtual-tour" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Virtual Tour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {p.virtualTourEmbedUrls.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {p.virtualTourEmbedUrls.map((embedUrl, index) => (
                          <div
                            key={embedUrl}
                            className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/30"
                          >
                            <div className="aspect-video">
                              <iframe
                                title={`${p.name} virtual tour ${index + 1}`}
                                src={embedUrl}
                                className="h-full w-full"
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-8 text-center">
                        <p className="font-medium text-foreground">Virtual tour coming soon</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          This provider has not added a video tour yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProviderLocationMapLazy address={p.address} providerName={p.name} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-4">
                <ProviderReviewsTab
                  providerProfileId={p.profileId}
                  providerSlug={slug}
                  providerName={p.name}
                  initialReviews={p.reviews}
                />
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {p.photos.length > 0
                    ? p.photos.map((photo) => (
                        <div key={photo.id} className="relative aspect-4/3 rounded-xl overflow-hidden">
                          <Image
                            src={photo.url}
                            alt={photo.caption ?? `${p.name} photo`}
                            fill
                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          {photo.caption && (
                            <p className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white bg-black/60 truncate">
                              {photo.caption}
                            </p>
                          )}
                        </div>
                      ))
                    : p.images.map((image, index) => (
                        <div key={index} className="relative aspect-4/3 rounded-xl overflow-hidden">
                          <Image
                            src={image}
                            alt={`${p.name} photo ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      ))}
                </div>
              </TabsContent>

              {/* FAQs Tab */}
              {p.faqs.length > 0 && (
                <TabsContent value="faqs" className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <Accordion type="single" collapsible className="w-full">
                        {p.faqs.map((faq, index) => (
                          <AccordionItem key={index} value={`faq-${index}`}>
                            <AccordionTrigger className="text-left">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{p.priceRange}</p>
                    <p className="text-sm text-muted-foreground">
                      Daily Fee{p.currencyCode ? ` (${p.currencyCode})` : ""}
                    </p>
                    {(p.registrationFee != null || p.depositFee != null || p.mealsFee != null) && (
                      <div className="mt-3 space-y-1 text-left text-xs text-muted-foreground">
                        {p.registrationFee != null && <p>Registration: {p.currencySymbol}{p.registrationFee}</p>}
                        {p.depositFee != null && <p>Deposit: {p.currencySymbol}{p.depositFee}</p>}
                        {p.mealsFee != null && <p>Meals: {p.currencySymbol}{p.mealsFee}</p>}
                      </div>
                    )}
                    {p.additionalServices.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Services: {p.additionalServices.join(", ")}
                      </p>
                    )}
                  </div>
                  {p.phone ? (
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <a href={`tel:${p.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call {p.phone}
                      </a>
                    </Button>
                  ) : null}
                  {websiteHref ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  ) : null}
                  {p.inquiriesEnabled ? (
                    <>
                      <SendInquiryButton providerSlug={p.slug} providerName={p.name} className="w-full" />
                      <p className="text-[11px] text-muted-foreground">
                        Inquiry submissions require explicit consent to process personal data.
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Quick Facts</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Licensed & Insured
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Background Checked Staff
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      CPR/First Aid Certified
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      Open Year-Round
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthProviderClient>
  )
}
