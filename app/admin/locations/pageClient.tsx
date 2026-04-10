"use client"

import { useMemo, useState, useTransition } from "react"
import { MapPin, Plus, Edit2, Trash2, Globe2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { createCountry, updateCountry, deleteCountry, createCity, updateCity, deleteCity } from "./actions"

type Country = {
  id: string
  code: string
  name: string
  sort_order: number
  is_active: boolean
}

type City = {
  id: string
  country_id: string
  name: string
  slug: string
  search_country_code: string
  search_city_slug: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
}

type AdminLocationsClientProps = {
  initialCountries: Country[]
  initialCities: City[]
}

type CountryFormState = {
  id?: string
  code: string
  name: string
  sortOrder: string
  isActive: boolean
}

type CityFormState = {
  id?: string
  countryId: string
  name: string
  slug: string
  searchCountryCode: string
  searchCitySlug: string
  sortOrder: string
  isPopular: boolean
  isActive: boolean
}

const emptyCountryForm: CountryFormState = {
  code: "",
  name: "",
  sortOrder: "0",
  isActive: true,
}

const emptyCityForm: CityFormState = {
  countryId: "",
  name: "",
  slug: "",
  searchCountryCode: "",
  searchCitySlug: "",
  sortOrder: "0",
  isPopular: true,
  isActive: true,
}

export function AdminLocationsClient({ initialCountries, initialCities }: AdminLocationsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const countries = initialCountries
  const cities = initialCities

  const [countryDialogOpen, setCountryDialogOpen] = useState(false)
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [editingCountry, setEditingCountry] = useState<Country | null>(null)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [countryForm, setCountryForm] = useState<CountryFormState>(emptyCountryForm)
  const [cityForm, setCityForm] = useState<CityFormState>(emptyCityForm)
  const [selectedCountryId, setSelectedCountryId] = useState<string | "all">("all")
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "country"; country: Country } | { type: "city"; city: City } | null
  >(null)

  const filteredCities = useMemo(() => {
    if (selectedCountryId === "all") return cities
    return cities.filter((city) => city.country_id === selectedCountryId)
  }, [cities, selectedCountryId])

  const handleOpenCreateCountry = () => {
    setEditingCountry(null)
    setCountryForm(emptyCountryForm)
    setError(null)
    setCountryDialogOpen(true)
  }

  const handleOpenEditCountry = (country: Country) => {
    setEditingCountry(country)
    setCountryForm({
      id: country.id,
      code: country.code,
      name: country.name,
      sortOrder: String(country.sort_order ?? 0),
      isActive: country.is_active,
    })
    setError(null)
    setCountryDialogOpen(true)
  }

  const handleSubmitCountry = () => {
    if (!countryForm.name.trim() || !countryForm.code.trim()) {
      setError("Country name and code are required.")
      return
    }

    const sortOrder = Number(countryForm.sortOrder) || 0

    startTransition(async () => {
      try {
        if (editingCountry) {
          await updateCountry(editingCountry.id, {
            code: countryForm.code,
            name: countryForm.name,
            sortOrder,
            isActive: countryForm.isActive,
          })
          toast({ title: "Country updated", variant: "success" })
        } else {
          await createCountry({
            code: countryForm.code,
            name: countryForm.name,
            sortOrder,
            isActive: countryForm.isActive,
          })
          toast({ title: "Country added", variant: "success" })
        }
        setCountryDialogOpen(false)
        setError(null)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save country"
        setError(message)
      }
    })
  }

  const handleDeleteCountryClick = (country: Country) => {
    setDeleteTarget({ type: "country", country })
    setDeleteDialogOpen(true)
  }

  const handleDeleteCityClick = (city: City) => {
    setDeleteTarget({ type: "city", city })
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setError(null)
    try {
      if (deleteTarget.type === "country") {
        await deleteCountry(deleteTarget.country.id)
        toast({ title: "Country removed", variant: "success" })
      } else {
        await deleteCity(deleteTarget.city.id)
        toast({ title: "City removed", variant: "success" })
      }
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : deleteTarget.type === "country" ? "Failed to delete country" : "Failed to delete city"
      setError(message)
    }
  }

  const handleOpenCreateCity = () => {
    setEditingCity(null)
    setCityForm({
      ...emptyCityForm,
      countryId: typeof selectedCountryId === "string" && selectedCountryId !== "all" ? selectedCountryId : "",
    })
    setError(null)
    setCityDialogOpen(true)
  }

  const handleOpenEditCity = (city: City) => {
    setEditingCity(city)
    setCityForm({
      id: city.id,
      countryId: city.country_id,
      name: city.name,
      slug: city.slug,
      searchCountryCode: city.search_country_code,
      searchCitySlug: city.search_city_slug,
      sortOrder: String(city.sort_order ?? 0),
      isPopular: city.is_popular,
      isActive: city.is_active,
    })
    setError(null)
    setCityDialogOpen(true)
  }

  const handleSubmitCity = () => {
    if (!cityForm.countryId || !cityForm.name.trim() || !cityForm.slug.trim()) {
      setError("Country, name, and slug are required for a city.")
      return
    }

    const sortOrder = Number(cityForm.sortOrder) || 0
    const searchCountryCode = cityForm.searchCountryCode || countries.find((c) => c.id === cityForm.countryId)?.code || ""
    const searchCitySlug = cityForm.searchCitySlug || cityForm.slug

    if (!searchCountryCode) {
      setError("Search country code is required (fill it or ensure the country has a code).")
      return
    }

    startTransition(async () => {
      try {
        const payload = {
          countryId: cityForm.countryId,
          name: cityForm.name,
          slug: cityForm.slug,
          searchCountryCode,
          searchCitySlug,
          sortOrder,
          isPopular: cityForm.isPopular,
          isActive: cityForm.isActive,
        }

        if (editingCity) {
          await updateCity(editingCity.id, payload)
          toast({ title: "City updated", variant: "success" })
        } else {
          await createCity(payload)
          toast({ title: "City added", variant: "success" })
        }

        setCityDialogOpen(false)
        setError(null)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save city"
        setError(message)
      }
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          Locations
        </h1>
        <p className="text-muted-foreground">
          Manage countries and cities used across the directory and search experience.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Countries</CardTitle>
                <CardDescription>Top-level groups for locations and search filters.</CardDescription>
              </div>
              <Button size="sm" onClick={handleOpenCreateCountry} disabled={isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add Country
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden md:table-cell">Sort</TableHead>
                    <TableHead className="hidden md:table-cell">Active</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countries.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell>{country.name}</TableCell>
                      <TableCell className="font-mono text-xs">{country.code}</TableCell>
                      <TableCell className="hidden md:table-cell">{country.sort_order}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {country.is_active ? (
                          <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEditCountry(country)}
                          disabled={isPending}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteCountryClick(country)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {countries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                        No countries configured yet. Add your first country to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Cities</CardTitle>
                <CardDescription>
                  Cities are grouped by country and power popular locations and search URLs.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCountryId}
                  onValueChange={(value) => setSelectedCountryId(value as string | "all")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleOpenCreateCity} disabled={isPending || countries.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead className="hidden md:table-cell">Country</TableHead>
                    <TableHead className="hidden lg:table-cell">Search URL</TableHead>
                    <TableHead className="hidden md:table-cell">Popular</TableHead>
                    <TableHead className="hidden md:table-cell">Active</TableHead>
                    <TableHead className="hidden md:table-cell">Sort</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.map((city) => {
                    const country = countries.find((c) => c.id === city.country_id)
                    const href = `/search?country=${city.search_country_code}&city=${city.search_city_slug}`
                    return (
                      <TableRow key={city.id}>
                        <TableCell>{city.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{country?.name ?? ","}</TableCell>
                        <TableCell className="hidden lg:table-cell font-mono text-xs">
                          {href}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {city.is_popular ? (
                            <span className="text-xs rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                              Popular
                            </span>
                          ) : (
                            <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                              Hidden
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {city.is_active ? (
                            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{city.sort_order}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditCity(city)}
                            disabled={isPending}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteCityClick(city)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredCities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-sm">
                        No cities found for the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Globe2 className="h-4 w-4" />
                How search URLs are built
              </CardTitle>
              <CardDescription className="text-xs">
                Each city maps to a search URL like{" "}
                <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">
                  /search?country=usa&city=new-york
                </code>
                . Use these fields to keep URLs stable for SEO.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCountry ? "Edit country" : "Add country"}</DialogTitle>
            <DialogDescription>Configure how this country appears in admin and search.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="country-name">Name</Label>
              <Input
                id="country-name"
                value={countryForm.name}
                onChange={(e) => setCountryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="USA"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country-code">Code</Label>
              <Input
                id="country-code"
                value={countryForm.code}
                onChange={(e) => setCountryForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="usa"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="country-sort">Sort order</Label>
                <Input
                  id="country-sort"
                  type="number"
                  value={countryForm.sortOrder}
                  onChange={(e) => setCountryForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex items-center gap-2 pt-6">
                <Switch
                  id="country-active"
                  checked={countryForm.isActive}
                  onCheckedChange={(checked) =>
                    setCountryForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }
                />
                <Label htmlFor="country-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCountryDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCountry} disabled={isPending}>
              {editingCountry ? "Save changes" : "Create country"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit city" : "Add city"}</DialogTitle>
            <DialogDescription>Configure how this city appears in locations and search URLs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="city-country">Country</Label>
              <Select
                value={cityForm.countryId}
                onValueChange={(value) => setCityForm((prev) => ({ ...prev, countryId: value }))}
              >
                <SelectTrigger id="city-country">
                  <SelectValue placeholder="Select a country" />
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
            <div className="space-y-1">
              <Label htmlFor="city-name">Name</Label>
              <Input
                id="city-name"
                value={cityForm.name}
                onChange={(e) => setCityForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="New York"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city-slug">Slug</Label>
              <Input
                id="city-slug"
                value={cityForm.slug}
                onChange={(e) => setCityForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="new-york"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city-search-country">Search country code</Label>
              <Input
                id="city-search-country"
                value={cityForm.searchCountryCode}
                onChange={(e) => setCityForm((prev) => ({ ...prev, searchCountryCode: e.target.value }))}
                placeholder="usa"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city-search-slug">Search city slug</Label>
              <Input
                id="city-search-slug"
                value={cityForm.searchCitySlug}
                onChange={(e) => setCityForm((prev) => ({ ...prev, searchCitySlug: e.target.value }))}
                placeholder="new-york"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="city-sort">Sort order</Label>
                <Input
                  id="city-sort"
                  type="number"
                  value={cityForm.sortOrder}
                  onChange={(e) => setCityForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
              <div className="space-y-1 flex flex-col gap-2 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="city-popular"
                    checked={cityForm.isPopular}
                    onCheckedChange={(checked) =>
                      setCityForm((prev) => ({
                        ...prev,
                        isPopular: checked,
                      }))
                    }
                  />
                  <Label htmlFor="city-popular">Popular</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="city-active"
                    checked={cityForm.isActive}
                    onCheckedChange={(checked) =>
                      setCityForm((prev) => ({
                        ...prev,
                        isActive: checked,
                      }))
                    }
                  />
                  <Label htmlFor="city-active">Active</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCityDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCity} disabled={isPending || countries.length === 0}>
              {editingCity ? "Save changes" : "Create city"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setDeleteTarget(null)
          }}
          title={deleteTarget.type === "country" ? "Delete country?" : "Delete city?"}
          description={
            deleteTarget.type === "country"
              ? "This will delete the country and all cities in it. This action cannot be undone."
              : "This will delete the city and all providers in this city. This action cannot be undone."
          }
          itemName={deleteTarget.type === "country" ? deleteTarget.country.name : deleteTarget.city.name}
          variant="delete"
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

