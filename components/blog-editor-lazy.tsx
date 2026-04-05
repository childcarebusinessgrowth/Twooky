"use client"

import dynamic from "next/dynamic"

const BlogEditorDynamic = dynamic(
  () => import("@/components/blog-editor").then((m) => m.BlogEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
)

export type BlogEditorLazyProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  onUploadImage?: (file: File) => Promise<string>
}

export function BlogEditorLazy(props: BlogEditorLazyProps) {
  return <BlogEditorDynamic {...props} />
}
