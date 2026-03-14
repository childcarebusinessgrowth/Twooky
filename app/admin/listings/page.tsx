"use client"

import { useState } from "react"
import { Search, Filter, MoreVertical, Eye, Pencil, Trash2, Star as StarIcon, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

const listings = [
  {
    id: 1,
    name: "Sunshine Daycare Center",
    location: "San Francisco, CA",
    status: "active",
    featured: true,
    reviews: 127,
    rating: 4.9,
    createdAt: "Jan 15, 2024"
  },
  {
    id: 2,
    name: "Little Stars Preschool",
    location: "Oakland, CA",
    status: "active",
    featured: false,
    reviews: 89,
    rating: 4.8,
    createdAt: "Feb 3, 2024"
  },
  {
    id: 3,
    name: "Happy Kids Academy",
    location: "San Jose, CA",
    status: "pending",
    featured: false,
    reviews: 0,
    rating: 0,
    createdAt: "Mar 10, 2026"
  },
  {
    id: 4,
    name: "Rainbow Learning Center",
    location: "Palo Alto, CA",
    status: "active",
    featured: true,
    reviews: 64,
    rating: 4.7,
    createdAt: "Nov 22, 2023"
  },
  {
    id: 5,
    name: "Tiny Tots Nursery",
    location: "Berkeley, CA",
    status: "inactive",
    featured: false,
    reviews: 23,
    rating: 4.5,
    createdAt: "Aug 5, 2023"
  },
  {
    id: 6,
    name: "Bright Futures Childcare",
    location: "Fremont, CA",
    status: "active",
    featured: false,
    reviews: 45,
    rating: 4.6,
    createdAt: "Sep 18, 2023"
  },
  {
    id: 7,
    name: "Discovery Kids Center",
    location: "Mountain View, CA",
    status: "active",
    featured: false,
    reviews: 78,
    rating: 4.8,
    createdAt: "Dec 1, 2023"
  },
  {
    id: 8,
    name: "Kidz Zone Academy",
    location: "Sunnyvale, CA",
    status: "pending",
    featured: false,
    reviews: 0,
    rating: 0,
    createdAt: "Mar 8, 2026"
  },
]

export default function AdminListingsPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => 
      prev.length === listings.length ? [] : listings.map(l => l.id)
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listings Management</h1>
        <p className="text-muted-foreground">View and manage all provider listings</p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search listings..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="sf">San Francisco</SelectItem>
                <SelectItem value="oakland">Oakland</SelectItem>
                <SelectItem value="sanjose">San Jose</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm">Feature Selected</Button>
          <Button variant="outline" size="sm">Deactivate Selected</Button>
          <Button variant="destructive" size="sm">Delete Selected</Button>
        </div>
      )}

      {/* Listings table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === listings.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Reviews</TableHead>
                <TableHead className="hidden lg:table-cell">Rating</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(listing.id)}
                      onCheckedChange={() => toggleSelect(listing.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{listing.name}</span>
                      {listing.featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {listing.location}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {listing.location}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge 
                      variant={
                        listing.status === "active" ? "default" :
                        listing.status === "pending" ? "secondary" : "outline"
                      }
                      className={listing.status === "active" ? "bg-primary" : ""}
                    >
                      {listing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {listing.reviews}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {listing.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>{listing.rating}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <StarIcon className="h-4 w-4 mr-2" />
                          {listing.featured ? "Remove Feature" : "Feature"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-8 of 2,847 listings
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  )
}
