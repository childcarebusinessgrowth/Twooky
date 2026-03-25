"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CalendarDays, Clock3, Newspaper, Save, Send, Trash2, Eye, Upload, Sparkles, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { BlogEditor } from "@/components/blog-editor"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { createBlog, deleteBlog, publishBlog, unpublishBlog, updateBlog, uploadBlogImage, type BlogInput } from "./actions"

type BlogRecord = {
  id: string
  slug: string
  title: string
  excerpt: string
  content_html: string
  status: "draft" | "published"
  featured: boolean
  published_at: string | null
  seo_title: string | null
  meta_description: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  tags: string[]
  reading_time: string
  created_at: string
  updated_at: string
}

type BlogFormState = {
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  status: "draft" | "published"
  featured: boolean
  seoTitle: string
  metaDescription: string
  coverImageUrl: string
  coverImageAlt: string
  tagsText: string
  readingTime: string
}

const EMPTY_FORM: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  contentHtml: "",
  status: "draft",
  featured: false,
  seoTitle: "",
  metaDescription: "",
  coverImageUrl: "",
  coverImageAlt: "",
  tagsText: "",
  readingTime: "3 min read",
}

function toForm(blog: BlogRecord): BlogFormState {
  return {
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    contentHtml: blog.content_html,
    status: blog.status,
    featured: blog.featured,
    seoTitle: blog.seo_title ?? "",
    metaDescription: blog.meta_description ?? "",
    coverImageUrl: blog.cover_image_url ?? "",
    coverImageAlt: blog.cover_image_alt ?? "",
    tagsText: blog.tags.join(", "),
    readingTime: blog.reading_time,
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function formatDate(iso: string | null): string {
  if (!iso) return "Not published"
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function toInput(form: BlogFormState): BlogInput {
  return {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    contentHtml: form.contentHtml,
    status: form.status,
    featured: form.featured,
    seoTitle: form.seoTitle,
    metaDescription: form.metaDescription,
    coverImageUrl: form.coverImageUrl,
    coverImageAlt: form.coverImageAlt,
    tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
    readingTime: form.readingTime,
  }
}

type Props = {
  initialBlogs: BlogRecord[]
}

export function AdminBlogsPageClient({ initialBlogs }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"manage" | "editor">("manage")
  const [search, setSearch] = useState("")
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(initialBlogs[0]?.id ?? null)
  const [manageForm, setManageForm] = useState<BlogFormState>(initialBlogs[0] ? toForm(initialBlogs[0]) : EMPTY_FORM)
  const [editorForm, setEditorForm] = useState<BlogFormState>(EMPTY_FORM)
  const [editorSlugTouched, setEditorSlugTouched] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const blogs = useMemo(() => initialBlogs, [initialBlogs])
  const selectedBlog = useMemo(
    () => blogs.find((blog) => blog.id === selectedBlogId) ?? null,
    [blogs, selectedBlogId],
  )

  const filteredBlogs = useMemo(() => {
    if (!search.trim()) return blogs
    const q = search.trim().toLowerCase()
    return blogs.filter((blog) => {
      return (
        blog.title.toLowerCase().includes(q) ||
        blog.slug.toLowerCase().includes(q) ||
        blog.excerpt.toLowerCase().includes(q) ||
        blog.tags.join(" ").toLowerCase().includes(q)
      )
    })
  }, [blogs, search])

  const handleRefresh = () => {
    router.refresh()
  }

  const handleSelectBlog = (blogId: string) => {
    const nextBlog = blogs.find((blog) => blog.id === blogId) ?? null
    setSelectedBlogId(blogId)
    setManageForm(nextBlog ? toForm(nextBlog) : EMPTY_FORM)
  }

  const runAction = (action: () => Promise<void>, successMessage: string) => {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      try {
        await action()
        setNotice(successMessage)
        toast({ title: successMessage, variant: "success" })
        handleRefresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.")
      }
    })
  }

  const uploadCover = async (file: File, target: "manage" | "editor") => {
    setError(null)
    setNotice(null)

    startTransition(async () => {
      try {
        const uploaded = await uploadBlogImage(file)
        if (target === "manage") {
          setManageForm((prev) => ({
            ...prev,
            coverImageUrl: uploaded.publicUrl,
            coverImageAlt: prev.coverImageAlt || prev.title || "Blog cover image",
          }))
        } else {
          setEditorForm((prev) => ({
            ...prev,
            coverImageUrl: uploaded.publicUrl,
            coverImageAlt: prev.coverImageAlt || prev.title || "Blog cover image",
          }))
        }
        setNotice("Image uploaded.")
        toast({ title: "Image uploaded.", variant: "success" })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image.")
      }
    })
  }

  const uploadInlineImage = async (file: File): Promise<string> => {
    const uploaded = await uploadBlogImage(file)
    return uploaded.publicUrl
  }

  const handleSaveManage = () => {
    if (!selectedBlog) return
    runAction(
      async () => {
        await updateBlog(selectedBlog.id, toInput(manageForm))
      },
      "Blog updated.",
    )
  }

  const handleDeleteSelectedClick = () => {
    if (!selectedBlog) return
    setDeleteDialogOpen(true)
  }

  const handleDeleteBlogConfirm = async () => {
    if (!selectedBlog) return
    setError(null)
    try {
      await deleteBlog(selectedBlog.id)
      setNotice("Blog deleted.")
      toast({ title: "Blog deleted.", variant: "success" })
      setDeleteDialogOpen(false)
      handleRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete blog.")
    }
  }

  const handleTogglePublish = () => {
    if (!selectedBlog) return
    const shouldPublish = selectedBlog.status !== "published"
    runAction(
      async () => {
        if (shouldPublish) {
          await publishBlog(selectedBlog.id)
        } else {
          await unpublishBlog(selectedBlog.id)
        }
      },
      shouldPublish ? "Blog published." : "Blog moved to draft.",
    )
  }

  const handleCreate = (status: "draft" | "published") => {
    const payload = {
      ...editorForm,
      status,
    }

    runAction(
      async () => {
        await createBlog(toInput(payload))
        setEditorForm(EMPTY_FORM)
        setEditorSlugTouched(false)
      },
      status === "published" ? "Blog published." : "Draft created.",
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" />
            Blog CMS
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage and publish blog content with SEO and media controls.
          </p>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          WordPress-style editing, powered by your live data.
        </div>
      </div>

      {(notice || error) && (
        <Card className={error ? "border-destructive/40 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}>
          <CardContent className={error ? "py-3 pr-10 text-sm text-destructive relative" : "py-3 pr-10 text-sm text-emerald-700 dark:text-emerald-300 relative"}>
            {error ?? notice}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
              onClick={() => { setNotice(null); setError(null) }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "manage" | "editor")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Manage Blogs</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>All blogs</span>
                  <Badge variant="outline">{blogs.length} total</Badge>
                </CardTitle>
                <CardDescription>Select a blog to preview and edit.</CardDescription>
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, slug, tag..."
                  className="mt-1"
                />
              </CardHeader>
              <CardContent className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
                {filteredBlogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No blogs found.</p>
                ) : (
                  filteredBlogs.map((blog) => (
                    <button
                      key={blog.id}
                      type="button"
                      onClick={() => handleSelectBlog(blog.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        selectedBlogId === blog.id
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-primary/60 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-1">{blog.title}</p>
                        <Badge variant={blog.status === "published" ? "default" : "secondary"} className="text-[10px]">
                          {blog.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{blog.excerpt}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(blog.published_at ?? blog.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {blog.reading_time}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                    <span>{selectedBlog ? "Edit selected blog" : "Select a blog"}</span>
                    {selectedBlog && (
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedBlog.status === "published" ? "default" : "secondary"}>{selectedBlog.status}</Badge>
                        {selectedBlog.featured && <Badge variant="outline">Featured</Badge>}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Click on a post from the left to update content, SEO, media, and publish status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedBlog ? (
                    <p className="text-sm text-muted-foreground">Choose a blog from the list to begin editing.</p>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={manageForm.title}
                            onChange={(event) =>
                              setManageForm((prev) => ({
                                ...prev,
                                title: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input
                            value={manageForm.slug}
                            onChange={(event) =>
                              setManageForm((prev) => ({
                                ...prev,
                                slug: slugify(event.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Excerpt</Label>
                        <Textarea
                          rows={3}
                          value={manageForm.excerpt}
                          onChange={(event) =>
                            setManageForm((prev) => ({
                              ...prev,
                              excerpt: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Body content</Label>
                        <BlogEditor
                          value={manageForm.contentHtml}
                          onChange={(html) =>
                            setManageForm((prev) => ({
                              ...prev,
                              contentHtml: html,
                            }))
                          }
                          onUploadImage={uploadInlineImage}
                          disabled={isPending}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>SEO title</Label>
                          <Input
                            value={manageForm.seoTitle}
                            onChange={(event) => setManageForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reading time</Label>
                          <Input
                            value={manageForm.readingTime}
                            onChange={(event) => setManageForm((prev) => ({ ...prev, readingTime: event.target.value }))}
                            placeholder="e.g. 6 min read"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Meta description</Label>
                        <Textarea
                          rows={2}
                          value={manageForm.metaDescription}
                          onChange={(event) => setManageForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Cover image URL</Label>
                          <Input
                            value={manageForm.coverImageUrl}
                            onChange={(event) => setManageForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cover image alt text</Label>
                          <Input
                            value={manageForm.coverImageAlt}
                            onChange={(event) => setManageForm((prev) => ({ ...prev, coverImageAlt: event.target.value }))}
                            placeholder="Describe image for accessibility"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Tags (comma separated)</Label>
                        <Input
                          value={manageForm.tagsText}
                          onChange={(event) => setManageForm((prev) => ({ ...prev, tagsText: event.target.value }))}
                          placeholder="For Parents, Checklist, Tours"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={manageForm.featured}
                            onCheckedChange={(checked) => setManageForm((prev) => ({ ...prev, featured: checked }))}
                          />
                          <Label>Featured post</Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {manageForm.coverImageUrl ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="relative h-24 w-40 overflow-hidden rounded-md border border-border bg-muted group">
                              <Image
                                src={manageForm.coverImageUrl}
                                alt={manageForm.coverImageAlt || "Cover preview"}
                                fill
                                className="object-cover"
                                sizes="160px"
                                unoptimized
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-90 hover:opacity-100 shadow-sm"
                                aria-label="Remove cover image"
                                onClick={() => setManageForm((prev) => ({ ...prev, coverImageUrl: "", coverImageAlt: "" }))}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">Cover image uploaded</p>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
                          <Label htmlFor="manage-cover-upload" className="sr-only">
                            {manageForm.coverImageUrl ? "Change cover image" : "Upload cover image"}
                          </Label>
                          <input
                            id="manage-cover-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                void uploadCover(file, "manage")
                              }
                              event.target.value = ""
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById("manage-cover-upload") as HTMLInputElement | null
                              input?.click()
                            }}
                            disabled={isPending}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {manageForm.coverImageUrl ? "Change cover image" : "Upload cover image"}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Button onClick={handleSaveManage} disabled={isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save changes
                          </Button>
                          <Button variant="secondary" onClick={handleTogglePublish} disabled={isPending}>
                            <Send className="h-4 w-4 mr-2" />
                            {selectedBlog.status === "published" ? "Unpublish" : "Publish"}
                          </Button>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteSelectedClick} disabled={isPending}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete blog
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {selectedBlog && (
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </CardTitle>
                    <CardDescription>Quick preview of selected post content and metadata.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedBlog.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h2 className="text-xl font-semibold">{manageForm.title || selectedBlog.title}</h2>
                    <p className="text-sm text-muted-foreground">{manageForm.excerpt || selectedBlog.excerpt}</p>
                    <Separator />
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: manageForm.contentHtml || selectedBlog.content_html }}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Create new blog post</CardTitle>
              <CardDescription>
                Write with full editor controls, add SEO and media metadata, then save as draft or publish.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editorForm.title}
                    onChange={(event) => {
                      const title = event.target.value
                      setEditorForm((prev) => ({
                        ...prev,
                        title,
                        slug: editorSlugTouched ? prev.slug : slugify(title),
                      }))
                    }}
                    placeholder="e.g. Choosing the right childcare program"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editorForm.slug}
                    onChange={(event) => {
                      setEditorSlugTouched(true)
                      setEditorForm((prev) => ({
                        ...prev,
                        slug: slugify(event.target.value),
                      }))
                    }}
                    placeholder="choosing-the-right-childcare-program"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  rows={3}
                  value={editorForm.excerpt}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                  placeholder="Brief summary used on cards and metadata fallback."
                />
              </div>

              <div className="space-y-2">
                <Label>Body content</Label>
                <BlogEditor
                  value={editorForm.contentHtml}
                  onChange={(html) => setEditorForm((prev) => ({ ...prev, contentHtml: html }))}
                  onUploadImage={uploadInlineImage}
                  disabled={isPending}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>SEO title</Label>
                  <Input
                    value={editorForm.seoTitle}
                    onChange={(event) => setEditorForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
                    placeholder="Up to 70 chars"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reading time</Label>
                  <Input
                    value={editorForm.readingTime}
                    onChange={(event) => setEditorForm((prev) => ({ ...prev, readingTime: event.target.value }))}
                    placeholder="e.g. 5 min read"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Meta description</Label>
                <Textarea
                  rows={2}
                  value={editorForm.metaDescription}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, metaDescription: event.target.value }))}
                  placeholder="Up to 180 chars"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cover image URL</Label>
                  <Input
                    value={editorForm.coverImageUrl}
                    onChange={(event) => setEditorForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cover image alt text</Label>
                  <Input
                    value={editorForm.coverImageAlt}
                    onChange={(event) => setEditorForm((prev) => ({ ...prev, coverImageAlt: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {editorForm.coverImageUrl ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative h-24 w-40 overflow-hidden rounded-md border border-border bg-muted group">
                      <Image
                        src={editorForm.coverImageUrl}
                        alt={editorForm.coverImageAlt || "Cover preview"}
                        fill
                        className="object-cover"
                        sizes="160px"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-90 hover:opacity-100 shadow-sm"
                        aria-label="Remove cover image"
                        onClick={() => setEditorForm((prev) => ({ ...prev, coverImageUrl: "", coverImageAlt: "" }))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Cover image uploaded</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Label htmlFor="editor-cover-upload" className="sr-only">
                    {editorForm.coverImageUrl ? "Change cover image" : "Upload cover image"}
                  </Label>
                  <input
                    id="editor-cover-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void uploadCover(file, "editor")
                      }
                      event.target.value = ""
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById("editor-cover-upload") as HTMLInputElement | null
                      input?.click()
                    }}
                    disabled={isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {editorForm.coverImageUrl ? "Change cover image" : "Upload cover image"}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editorForm.featured}
                      onCheckedChange={(checked) => setEditorForm((prev) => ({ ...prev, featured: checked }))}
                    />
                    <Label>Featured post</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={editorForm.tagsText}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, tagsText: event.target.value }))}
                  placeholder="Parent Guide, Transitions, Checklist"
                />
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button variant="outline" onClick={() => handleCreate("draft")} disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save draft
                </Button>
                <Button onClick={() => handleCreate("published")} disabled={isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedBlog && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete blog?"
          description="This post will be permanently removed."
          itemName={selectedBlog.title}
          variant="delete"
          onConfirm={handleDeleteBlogConfirm}
        />
      )}
    </div>
  )
}
