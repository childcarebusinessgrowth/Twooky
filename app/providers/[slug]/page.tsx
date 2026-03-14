import Image from "next/image"
import Link from "next/link"
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
import { ReviewCard } from "@/components/review-card"
import { getProviderBySlug, getReviewsByProvider, providers } from "@/lib/mock-data"
import { parseYouTubeUrl } from "@/lib/youtube"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getProviderProfileIdBySlug,
  getReviewsByProviderProfileId,
} from "@/lib/parent-engagement"
import { ProviderFavoriteButton } from "@/components/provider-favorite-button"
import { ProviderFavoriteLoginPrompt } from "@/components/provider-favorite-login-prompt"
import { ProviderReviewsTab } from "@/components/provider-reviews-tab"
import { ProviderWriteReview } from "@/components/provider-write-review"

interface ProviderPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return providers.map((provider) => ({
    slug: provider.slug,
  }))
}

export async function generateMetadata({ params }: ProviderPageProps) {
  const { slug } = await params
  const provider = getProviderBySlug(slug)
  
  if (!provider) {
    return { title: "Provider Not Found" }
  }

  return {
    title: `${provider.name} | Early Learning Directory`,
    description: provider.description.slice(0, 160),
  }
}

export const revalidate = 60

const faqs = [
  {
    question: "What are the enrollment requirements?",
    answer: "We require a completed application, immunization records, and a birth certificate. We also conduct a family interview to ensure our program is the right fit for your child."
  },
  {
    question: "What is your sick child policy?",
    answer: "Children must be fever-free for 24 hours without medication before returning to care. We follow CDC guidelines for contagious illnesses."
  },
  {
    question: "Do you offer tours?",
    answer: "Yes! We offer tours Monday through Friday by appointment. Contact us to schedule a visit and meet our staff."
  },
  {
    question: "What meals and snacks are provided?",
    answer: "We provide a nutritious breakfast, lunch, and afternoon snack daily. Our menus are nut-free and accommodate common allergies. Parents may also send meals from home."
  },
  {
    question: "What is your teacher-to-child ratio?",
    answer: "We maintain ratios that exceed state requirements: 1:3 for infants, 1:4 for toddlers, 1:8 for preschoolers, and 1:10 for school-age children."
  }
]

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { slug } = await params
  const provider = getProviderBySlug(slug)
  
  if (!provider) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const providerProfileId = await getProviderProfileIdBySlug(supabase, slug)
  const dbReviews = providerProfileId
    ? await getReviewsByProviderProfileId(supabase, providerProfileId)
    : []
  const reviews = getReviewsByProvider(provider.id)
  const virtualTourEmbedUrls = await getVirtualTourEmbedUrlsBySlug(slug)
  const reviewCount = providerProfileId ? dbReviews.length : reviews.length
  const displayRating =
    providerProfileId && dbReviews.length > 0
      ? dbReviews.reduce((s, r) => s + r.rating, 0) / dbReviews.length
      : provider.rating

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <section className="relative h-64 md:h-80 lg:h-96 bg-muted overflow-hidden">
        <Image
          src={provider.image}
          alt={provider.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent" />
      </section>

      <div className="mx-auto max-w-7xl px-4 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Provider Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      {provider.name}
                    </h1>
                    <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">
                          {typeof displayRating === "number"
                            ? displayRating.toFixed(1)
                            : provider.rating}
                        </span>
                        <span>({reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{provider.address}</span>
                      </div>
                    </div>
                    {provider.providerTypes.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Tags className="h-4 w-4" />
                        <div className="flex flex-wrap gap-1.5">
                          {provider.providerTypes.map((type) => (
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
                      {provider.programTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {providerProfileId ? (
                      <ProviderFavoriteButton
                        providerProfileId={providerProfileId}
                        providerSlug={slug}
                      />
                    ) : (
                      <ProviderFavoriteLoginPrompt providerSlug={slug} />
                    )}
                    <Button className="bg-primary hover:bg-primary/90" asChild>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
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
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {provider.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {provider.description}
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
                        {provider.ageGroups.map((age) => (
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
                      <p className="text-muted-foreground">{provider.hours}</p>
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
                        {provider.languages.map((lang) => (
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
                      <p className="text-muted-foreground">{provider.curriculumType}</p>
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
                      {provider.mealsIncluded && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Utensils className="h-4 w-4 text-primary" />
                          <span>Meals Included</span>
                        </div>
                      )}
                      {provider.outdoorSpace && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TreePine className="h-4 w-4 text-primary" />
                          <span>Outdoor Play Area</span>
                        </div>
                      )}
                      {provider.specialNeeds && (
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
                  {provider.programTypes.map((program, index) => (
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
                                Ages {provider.ageGroups[index % provider.ageGroups.length]}
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
                    {virtualTourEmbedUrls.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {virtualTourEmbedUrls.map((embedUrl, index) => (
                          <div
                            key={embedUrl}
                            className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/30"
                          >
                            <div className="aspect-video">
                              <iframe
                                title={`${provider.name} virtual tour ${index + 1}`}
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

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-4">
                {providerProfileId ? (
                  <ProviderReviewsTab
                    providerProfileId={providerProfileId}
                    providerSlug={slug}
                    providerName={provider.name}
                    initialReviews={dbReviews}
                  />
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <h3 className="font-semibold text-foreground">
                        Parent Reviews ({reviews.length})
                      </h3>
                      <ProviderWriteReview
                        providerProfileId={null}
                        providerSlug={slug}
                        providerName={provider.name}
                      />
                    </div>
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} showProvider={false} />
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          No reviews yet. Be the first to review this provider!
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {provider.images.map((image, index) => (
                    <div key={index} className="relative aspect-4/3 rounded-xl overflow-hidden">
                      <Image
                        src={image}
                        alt={`${provider.name} photo ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* FAQs Tab */}
              <TabsContent value="faqs" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
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
                    <p className="text-2xl font-bold text-foreground">{provider.priceRange}</p>
                    <p className="text-sm text-muted-foreground">Monthly Tuition</p>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Phone className="h-4 w-4 mr-2" />
                    Call {provider.phone}
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={provider.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href="/contact">
                      Send Inquiry
                    </Link>
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Inquiry submissions require explicit consent to process personal data.
                  </p>
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
  )
}

async function getVirtualTourEmbedUrlsBySlug(slug: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("virtual_tour_url, virtual_tour_urls")
    .eq("provider_slug", slug)
    .maybeSingle()

  if (error || !data) {
    return []
  }

  const urls =
    data.virtual_tour_urls && data.virtual_tour_urls.length > 0
      ? data.virtual_tour_urls
      : data.virtual_tour_url
        ? [data.virtual_tour_url]
        : []

  const embedUrls: string[] = []
  for (const url of urls) {
    const parsed = parseYouTubeUrl(url)
    if (parsed && !embedUrls.includes(parsed.embedUrl)) {
      embedUrls.push(parsed.embedUrl)
    }
  }

  return embedUrls
}
