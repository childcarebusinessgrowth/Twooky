"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, Pencil, Trash2, MoreVertical, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const photos = [
  { id: 1, url: "/images/hero-children.jpg", caption: "Classroom activities", isPrimary: true },
  { id: 2, url: "/images/hero-children.jpg", caption: "Outdoor playground", isPrimary: false },
  { id: 3, url: "/images/hero-children.jpg", caption: "Art corner", isPrimary: false },
  { id: 4, url: "/images/hero-children.jpg", caption: "Reading nook", isPrimary: false },
  { id: 5, url: "/images/hero-children.jpg", caption: "Lunch time", isPrimary: false },
  { id: 6, url: "/images/hero-children.jpg", caption: "Nap area", isPrimary: false },
]

function PhotoCard({ photo }: { photo: typeof photos[0] }) {
  return (
    <Card className="group overflow-hidden border-border/50">
      <div className="relative aspect-[4/3]">
        <Image
          src={photo.url}
          alt={photo.caption}
          fill
          className="object-cover"
        />
        {photo.isPrimary && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
            Primary
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!photo.isPrimary && (
              <DropdownMenuItem>
                <ImageIcon className="h-4 w-4 mr-2" />
                Set as Primary
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Caption
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="p-3">
        <p className="text-sm text-muted-foreground">{photo.caption}</p>
      </CardContent>
    </Card>
  )
}

export default function PhotosPage() {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Photos</h1>
          <p className="text-muted-foreground">Manage your facility photos and gallery</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos</DialogTitle>
              <DialogDescription>
                Add photos of your facility to attract more parents
              </DialogDescription>
            </DialogHeader>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Drag and drop photos here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline">Choose Files</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Supported formats: JPG, PNG, WebP. Max file size: 10MB
            </p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Photo Gallery Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{photos.length}</p>
              <p className="text-sm text-muted-foreground">Total Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Max Allowed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{12 - photos.length}</p>
              <p className="text-sm text-muted-foreground">Slots Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}

        {/* Upload placeholder */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-dashed border-2 border-border hover:border-primary/50 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center aspect-[4/3] text-muted-foreground">
                <Upload className="h-8 w-8 mb-2" />
                <p className="text-sm font-medium">Add Photo</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos</DialogTitle>
              <DialogDescription>
                Add photos of your facility to attract more parents
              </DialogDescription>
            </DialogHeader>
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center border-border"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-1">Drag and drop photos here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline">Choose Files</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tips */}
      <Card className="border-border/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Photo Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Use high-quality, well-lit photos that showcase your facility</li>
            <li>• Include photos of different areas: classrooms, playground, dining area</li>
            <li>• Show children engaged in activities (with proper permissions)</li>
            <li>• Keep photos current and representative of your actual space</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
