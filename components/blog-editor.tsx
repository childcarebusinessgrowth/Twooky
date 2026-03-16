"use client"

import { useEffect, useRef, useState, type ChangeEvent, type ComponentType } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link2,
  Unlink,
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react"

function ParagraphIcon({ className }: { className?: string }) {
  return <span className={cn("text-xs font-semibold", className)}>P</span>
}
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

// Extend Image so width is persisted in HTML and used when rendering
const ImageWithSize = Image.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {}
    return {
      ...parent,
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) =>
          attributes.width ? { width: String(attributes.width) } : {},
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) =>
          attributes.height ? { height: String(attributes.height) } : {},
      },
    }
  },
})

// Extend Link so that target is parsed from HTML and link does not extend to newly typed text
const LinkWithTarget = Link.extend({
  inclusive() {
    return false
  },
  addAttributes() {
    const parent = this.parent?.() ?? {}
    return {
      ...parent,
      target: {
        default: null,
        parseHTML: (element) => element.getAttribute("target"),
        renderHTML: (attributes) =>
          attributes.target ? { target: attributes.target } : {},
      },
    }
  },
})

type BlogEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  onUploadImage?: (file: File) => Promise<string>
}

type ToolbarButtonProps = {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  icon: ComponentType<{ className?: string }>
  label: string
  /** Use mousedown + preventDefault so the editor keeps selection when applying format (recommended for H1, H2, Bold, Italic, lists, blockquote). */
  useMouseDown?: boolean
}

function escapeHtml(text: string): string {
  const p = document.createElement("p")
  p.textContent = text
  return p.innerHTML
}

/** Ensure the link has a protocol so it is not treated as a relative path (e.g. google.com → https://google.com). */
function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function ToolbarButton({
  active,
  onClick,
  disabled,
  icon: Icon,
  label,
  useMouseDown = false,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={cn("h-8 w-8", active && "bg-primary/10 text-primary border border-primary/30")}
      onClick={useMouseDown ? undefined : onClick}
      onMouseDown={useMouseDown ? (e) => { e.preventDefault(); onClick() } : undefined}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function BlogEditor({
  value,
  onChange,
  placeholder = "Start writing your blog post...",
  disabled = false,
  onUploadImage,
}: BlogEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkForm, setLinkForm] = useState({ url: "", openInNewTab: false, linkText: "" })
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageForm, setImageForm] = useState<{ url: string; alt: string; width: number | null }>({
    url: "",
    alt: "",
    width: 600,
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkWithTarget.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { target: null },
      }),
      ImageWithSize.configure({
        inline: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none dark:prose-invert [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_img]:h-auto [&_a]:text-blue-600 [&_a]:underline [&_a]:decoration-blue-600/40",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const openLinkDialog = () => {
    if (!editor || disabled) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, " ")
    const attrs = editor.getAttributes("link")
    const href = (attrs.href as string) ?? ""
    const target = attrs.target as string | undefined
    setLinkForm({
      url: href,
      openInNewTab: target === "_blank",
      linkText: selectedText,
    })
    setLinkDialogOpen(true)
  }

  const closeLinkDialog = () => {
    setLinkDialogOpen(false)
    setLinkForm({ url: "", openInNewTab: false, linkText: "" })
  }

  const applyLink = () => {
    if (!editor || disabled) return
    const rawUrl = linkForm.url.trim()
    if (!rawUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      closeLinkDialog()
      return
    }
    const url = normalizeLinkUrl(rawUrl)
    const displayText = linkForm.linkText.trim() || rawUrl
    const openInNewTab = linkForm.openInNewTab
    const { from, to } = editor.state.selection
    const hadSelection = to > from
    const previousText = editor.state.doc.textBetween(from, to, " ")

    const linkAttrs = { href: url, target: openInNewTab ? "_blank" : null }
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").setLink(linkAttrs).run()
    } else if (hadSelection && previousText === displayText) {
      editor.chain().focus().setLink(linkAttrs).run()
    } else {
      const rel = openInNewTab ? ' rel="noopener noreferrer"' : ""
      const targetAttr = openInNewTab ? ' target="_blank"' : ""
      const linkHtml = `<a href="${escapeHtml(url)}"${targetAttr}${rel}>${escapeHtml(displayText)}</a>`
      editor.chain().focus().insertContent(linkHtml).run()
    }
    closeLinkDialog()
  }

  const handleImageButtonClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!editor) return
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      let url = ""

      if (onUploadImage) {
        url = await onUploadImage(file)
      } else {
        const fromPrompt = window.prompt("Paste image URL")
        if (!fromPrompt) return
        url = fromPrompt.trim()
      }

      if (!url) return
      setImageForm({ url, alt: file.name || "Blog image", width: 600 })
      setImageDialogOpen(true)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const applyImage = () => {
    if (!editor || disabled || !imageForm.url) return
    const attrs: { src: string; alt: string; width?: number } = {
      src: imageForm.url,
      alt: imageForm.alt || "Blog image",
    }
    if (imageForm.width != null) {
      attrs.width = imageForm.width
    }
    editor.chain().focus().setImage(attrs).run()
    setImageDialogOpen(false)
    setImageForm({ url: "", alt: "", width: 600 })
  }

  if (!editor) {
    return <div className="min-h-[320px] rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">Loading editor...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/70 bg-muted/40 p-1.5">
        <ToolbarButton
          icon={ParagraphIcon}
          label="Paragraph"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleList("bulletList", "listItem").run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleList("orderedList", "listItem").run()}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Quote}
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => (editor.isActive("blockquote") ? editor.chain().focus().unsetBlockquote().run() : editor.chain().focus().setBlockquote().run())}
          disabled={disabled}
          useMouseDown
        />
        <ToolbarButton
          icon={Link2}
          label="Add link"
          active={editor.isActive("link")}
          onClick={openLinkDialog}
          disabled={disabled}
        />
        {editor.isActive("link") && (
          <ToolbarButton
            icon={Unlink}
            label="Remove link"
            onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
            disabled={disabled}
          />
        )}
        <ToolbarButton
          icon={ImagePlus}
          label={isUploading ? "Uploading image..." : "Insert image"}
          onClick={handleImageButtonClick}
          disabled={disabled || isUploading}
        />
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().chain().focus().redo().run()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            void handleImageInputChange(event)
          }}
        />
      </div>

      <EditorContent editor={editor} />

      <Dialog open={linkDialogOpen} onOpenChange={(open) => !open && closeLinkDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkForm.url}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                URL should start with http:// or https://
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="link-new-tab"
                checked={linkForm.openInNewTab}
                onCheckedChange={(checked) =>
                  setLinkForm((prev) => ({ ...prev, openInNewTab: checked === true }))
                }
              />
              <Label htmlFor="link-new-tab" className="font-normal cursor-pointer">
                Open in new tab
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Link text</Label>
              <Input
                id="link-text"
                value={linkForm.linkText}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, linkText: e.target.value }))}
                placeholder="Leave blank to use URL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeLinkDialog}>
              Cancel
            </Button>
            <Button type="button" onClick={applyLink}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setImageDialogOpen(false)
            setImageForm({ url: "", alt: "", width: 600 })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image size</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="image-size">Display width</Label>
              <select
                id="image-size"
                value={imageForm.width ?? ""}
                onChange={(e) => {
                  const v = e.target.value
                  setImageForm((prev) => ({ ...prev, width: v === "" ? null : Number(v) }))
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Original size</option>
                <option value={400}>Small (400px)</option>
                <option value={600}>Medium (600px)</option>
                <option value={800}>Large (800px)</option>
              </select>
            </div>
            {imageForm.url && (
              <div className="flex justify-center rounded-md border border-border/70 bg-muted/30 p-2">
                <img
                  src={imageForm.url}
                  alt={imageForm.alt}
                  className="max-h-32 max-w-full object-contain"
                  style={imageForm.width != null ? { width: imageForm.width } : undefined}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImageDialogOpen(false)
                setImageForm({ url: "", alt: "", width: 600 })
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={applyImage}>
              Insert image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
