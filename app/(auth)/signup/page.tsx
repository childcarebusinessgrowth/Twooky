"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Users,
  Building2,
  Phone,
  MapPin,
  Baby,
  ArrowLeft,
  Heart,
  CheckCircle2,
  BarChart3,
  MessageCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/components/AuthProvider"
import type { CountryOption, CityOption } from "@/lib/location-directory"

type AccountType = "select" | "parent" | "provider"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<AccountType>("select")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [childAgeGroup, setChildAgeGroup] = useState<string>("")
  const [fullName, setFullName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [countries, setCountries] = useState<CountryOption[]>([])
  const [cities, setCities] = useState<CityOption[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState<string>("")
  const [selectedCityId, setSelectedCityId] = useState<string>("")
  const [manualCountryName, setManualCountryName] = useState("")
  const [manualCityName, setManualCityName] = useState("")
  const [providerCityNotListed, setProviderCityNotListed] = useState(false)
  const [providerCustomCityName, setProviderCustomCityName] = useState("")
  const [cityValidationError, setCityValidationError] = useState<string | null>(null)
  const [locationLoadError, setLocationLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { signUpWithEmail, authError } = useAuth()

  useEffect(() => {
    async function loadCountries() {
      try {
        setLocationLoadError(null)
        const response = await fetch("/api/locations/countries", { cache: "no-store" })
        const data = (await response.json()) as { countries?: CountryOption[]; error?: string }

        if (!response.ok) {
          setCountries([])
          setLocationLoadError(data.error ?? "Unable to load location options. Please enter your location manually.")
          return
        }

        const nextCountries = data.countries ?? []
        setCountries(nextCountries)
        if (nextCountries.length === 0) {
          setLocationLoadError("Location options are currently unavailable. Please enter your location manually.")
        }
      } catch {
        setCountries([])
        setLocationLoadError("Unable to load location options. Please enter your location manually.")
      }
    }

    if (step === "parent" || step === "provider") {
      void loadCountries()
    }
  }, [step])

  useEffect(() => {
    async function loadCities(countryId: string) {
      if (!countryId) {
        setCities([])
        setSelectedCityId("")
        return
      }

      try {
        const response = await fetch(`/api/locations/cities?countryId=${encodeURIComponent(countryId)}`, {
          cache: "no-store",
        })
        const data = (await response.json()) as { cities?: CityOption[]; error?: string }
        if (!response.ok) {
          setCities([])
          setLocationLoadError(data.error ?? "Unable to load city options. Please enter your city manually.")
          return
        }
        setCities(data.cities ?? [])
      } catch {
        setCities([])
        setLocationLoadError("Unable to load city options. Please enter your city manually.")
      }
    }

    if (step === "parent" || step === "provider") {
      void loadCities(selectedCountryId)
    }
  }, [step, selectedCountryId])

  const resolveRoleRedirect = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/role", { cache: "no-store" })
      if (!response.ok) return null

      const data = (await response.json()) as { redirectPath?: string }
      return data.redirectPath ?? null
    } catch {
      return null
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    let validatedCanonicalCityName: string | undefined
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (step === "parent") {
      if (!fullName.trim()) {
        setError("Please enter your full name.")
        return
      }

      if (!childAgeGroup) {
        setError("Please select your child's age group.")
        return
      }

      const canUseManualLocation = !!locationLoadError || countries.length === 0
      if (canUseManualLocation) {
        if (!manualCountryName.trim() || !manualCityName.trim()) {
          setError("Please enter your country and city.")
          return
        }
      } else if (!selectedCountryId || !selectedCityId) {
        setError("Please select your country and city.")
        return
      }
    }

    if (step === "provider") {
      if (!businessName.trim()) {
        setError("Please enter your business name.")
        return
      }
      if (!selectedCountryId) {
        setError("Please select your country.")
        return
      }
      if (!providerCityNotListed && !selectedCityId) {
        setError("Please select your city.")
        return
      }
    if (providerCityNotListed) {
      if (!providerCustomCityName.trim()) {
        setError("Please enter your city name.")
        return
      }
      setCityValidationError(null)
      const validateRes = await fetch("/api/locations/validate-city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryId: selectedCountryId,
          cityName: providerCustomCityName.trim(),
        }),
      })
      const validateData = (await validateRes.json()) as {
        valid?: boolean
        canonicalName?: string
        error?: string
      }
      if (!validateRes.ok || !validateData.valid) {
        setError(validateData.error ?? "We couldn't verify that city. Please check the name and country.")
        return
      }
      validatedCanonicalCityName = validateData.canonicalName
    }
    }

    setIsLoading(true)
    setError(null)
    setCityValidationError(null)

    const role = step === "provider" ? "provider" : "parent"

    const selectedCountry = countries.find((c) => c.id === selectedCountryId)
    const selectedCity = cities.find((c) => c.id === selectedCityId)
    const manualCountry = manualCountryName.trim()
    const manualCity = manualCityName.trim()
    const resolvedCountryName = selectedCountry?.name ?? (manualCountry || undefined)
    const resolvedCityName =
      step === "parent"
        ? (selectedCity?.name ?? (manualCity || undefined))
        : providerCityNotListed
          ? (validatedCanonicalCityName ?? providerCustomCityName.trim())
          : (selectedCity?.name ?? undefined)

    const providerLocation =
      step === "provider"
        ? {
            countryId: selectedCountryId,
            cityId: providerCityNotListed ? undefined : selectedCityId,
            customCityName: providerCityNotListed
              ? ((validatedCanonicalCityName ?? providerCustomCityName.trim()) || undefined)
              : undefined,
          }
        : undefined

    const { error } = await signUpWithEmail(email, password, role, {
      fullName,
      businessName,
      phone: step === "provider" ? phone.trim() : undefined,
      countryName: resolvedCountryName,
      cityName: resolvedCityName,
      childAgeGroup: step === "parent" ? childAgeGroup : undefined,
      ...providerLocation,
    })

    setIsLoading(false)

    if (error) {
      setError(error)
      return
    }

    if (step === "provider") {
      router.push("/dashboard/provider/listing?tour=1")
    } else {
      const roleRedirect = await resolveRoleRedirect()
      router.push(roleRedirect ?? "/dashboard/parent")
    }
  }

  if (step === "select") {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Create Your Account</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Choose the account type that best fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Parent Account Card */}
          <Card
            className="relative overflow-hidden cursor-pointer group border-border/50 bg-card/95 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            onClick={() => setStep("parent")}
            role="button"
            tabIndex={0}
            aria-label="Create a parent account"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setStep("parent")
              }
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <CardHeader className="pt-7">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg md:text-xl">Parent Account</CardTitle>
              <CardDescription className="text-base">
                Search and review childcare providers in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground mb-5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Search verified providers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Read and write reviews
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Save favorite listings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Contact providers directly
                </li>
              </ul>
              <Button className="w-full cursor-pointer group-hover:bg-primary/90" size="lg">
                Create Parent Account
              </Button>
            </CardContent>
          </Card>

          {/* Provider Account Card */}
          <Card
            className="relative overflow-hidden cursor-pointer group border-border/50 bg-card/95 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
            onClick={() => setStep("provider")}
            role="button"
            tabIndex={0}
            aria-label="Create a provider account"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setStep("provider")
              }
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
            <CardHeader className="pt-7">
              <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3">
                <Building2 className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-lg md:text-xl">Provider Account</CardTitle>
              <CardDescription className="text-base">
                Manage your childcare listing and receive inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-muted-foreground mb-5">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-secondary" />
                  Create your listing
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-secondary" />
                  Receive parent inquiries
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-secondary" />
                  Respond to reviews
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-secondary" />
                  Track analytics
                </li>
              </ul>
              <Button className="w-full cursor-pointer group-hover:bg-primary/90" size="lg">
                Create Provider Account
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-lg shadow-lg border-border/50">
      <CardHeader className="pb-2">
        <button
          onClick={() => setStep("select")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <CardTitle className="text-2xl font-bold">
          {step === "parent" ? "Create Parent Account" : "Create Provider Account"}
        </CardTitle>
        <CardDescription>
          {step === "parent" 
            ? "Find the perfect childcare for your family"
            : "List your childcare business and connect with parents"
          }
        </CardDescription>

        {step === "parent" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1 rounded-xl bg-primary/5 px-3 py-2 border border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-bounce">
                <Baby className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">For your child</span>
              <span className="text-[11px] text-muted-foreground">Age-appropriate programs</span>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-xl bg-primary/5 px-3 py-2 border border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-pulse">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Nearby options</span>
              <span className="text-[11px] text-muted-foreground">Search by location</span>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-xl bg-primary/5 px-3 py-2 border border-primary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-primary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-pulse">
                <Heart className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Trusted reviews</span>
              <span className="text-[11px] text-muted-foreground">Learn from other parents</span>
            </div>
          </div>
        )}

        {step === "provider" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/5 px-3 py-2 border border-secondary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-secondary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary motion-safe:animate-bounce">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Show your brand</span>
              <span className="text-[11px] text-muted-foreground">Stand out to local families</span>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/5 px-3 py-2 border border-secondary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-secondary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary motion-safe:animate-pulse">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">More inquiries</span>
              <span className="text-[11px] text-muted-foreground">Connect directly with parents</span>
            </div>

            <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/5 px-3 py-2 border border-secondary/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-secondary/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary motion-safe:animate-pulse">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground">Smart insights</span>
              <span className="text-[11px] text-muted-foreground">See how your listing performs</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSignup}>
          <FieldGroup>
            {step === "parent" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Full Name</FieldLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="John Smith"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locationLoadError ? (
                    <>
                      <Field>
                        <FieldLabel>Country</FieldLabel>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Enter country"
                            className="pl-10"
                            value={manualCountryName}
                            onChange={(e) => setManualCountryName(e.target.value)}
                            required
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>City</FieldLabel>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Enter city"
                            className="pl-10"
                            value={manualCityName}
                            onChange={(e) => setManualCityName(e.target.value)}
                            required
                          />
                        </div>
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field>
                        <FieldLabel>Country</FieldLabel>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Select
                            value={selectedCountryId}
                            onValueChange={(value) => {
                              setSelectedCountryId(value)
                              setSelectedCityId("")
                            }}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>City</FieldLabel>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Select
                            value={selectedCityId}
                            onValueChange={(value) => setSelectedCityId(value)}
                            disabled={!selectedCountryId || cities.length === 0}
                          >
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder={selectedCountryId ? "Select city" : "Select a country first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city.id} value={city.id}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </Field>
                    </>
                  )}
                </div>
                {locationLoadError && (
                  <p className="text-xs text-muted-foreground">{locationLoadError}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Child Age</FieldLabel>
                    <div className="relative">
                      <Baby className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select
                        value={childAgeGroup}
                        onValueChange={(value) => setChildAgeGroup(value)}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="infant">Infant (0-12 months)</SelectItem>
                          <SelectItem value="toddler">Toddler (1-2 years)</SelectItem>
                          <SelectItem value="preschool">Preschool (3-4 years)</SelectItem>
                          <SelectItem value="prek">Pre-K (4-5 years)</SelectItem>
                          <SelectItem value="school">School Age (5+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Business Name</FieldLabel>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Sunshine Daycare"
                        className="pl-10"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                      />
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Business Email</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="business@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel>Phone Number</FieldLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Country</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select
                        value={selectedCountryId}
                        onValueChange={(value) => {
                          setSelectedCountryId(value)
                          setSelectedCityId("")
                          setProviderCityNotListed(false)
                        }}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Field>

                  {!providerCityNotListed ? (
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Select
                          value={selectedCityId}
                          onValueChange={(value) => setSelectedCityId(value)}
                          disabled={!selectedCountryId || cities.length === 0}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue
                              placeholder={
                                selectedCountryId
                                  ? cities.length === 0
                                    ? "No cities listed"
                                    : "Select city"
                                  : "Select a country first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel>City name</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="e.g. Ras Al Khaimah"
                          className="pl-10"
                          value={providerCustomCityName}
                          onChange={(e) => {
                            setProviderCustomCityName(e.target.value)
                            setCityValidationError(null)
                          }}
                        />
                      </div>
                    </Field>
                  )}
                </div>

                {selectedCountryId && (
                  <div className="mt-1">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => {
                        setProviderCityNotListed(!providerCityNotListed)
                        if (!providerCityNotListed) {
                          setSelectedCityId("")
                        } else {
                          setProviderCustomCityName("")
                        }
                        setCityValidationError(null)
                      }}
                    >
                      {providerCityNotListed ? "Choose from list instead" : "My city isn't listed"}
                    </button>
                  </div>
                )}
                {(locationLoadError && step === "provider") && (
                  <p className="text-xs text-muted-foreground">{locationLoadError}</p>
                )}
                {cityValidationError && (
                  <p className="text-xs text-destructive">{cityValidationError}</p>
                )}
              </>
            )}

            <Button type="submit" className="w-full cursor-pointer" size="lg" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </FieldGroup>
        </form>

        {(error || authError) && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-center">
              {error ?? authError}
            </AlertDescription>
          </Alert>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </CardContent>
    </Card>
  )
}
