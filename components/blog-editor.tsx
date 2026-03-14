"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType } from "react"
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
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type InternalLinkOption = {
  label: string
  href: string
}

type BlogEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  onUploadImage?: (file: File) => Promise<string>
  internalLinkOptions?: InternalLinkOption[]
}

type ToolbarButtonProps = {
  active?: boolean
  onClick: () => void
  disabled?: boolean
  icon: ComponentType<{ className?: string }>
  label: string
}

function ToolbarButton({ active, onClick, disabled, icon: Icon, label }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={cn("h-8 w-8", active && "bg-primary/10 text-primary border border-primary/30")}
      onClick={onClick}
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
  internalLinkOptions = [],
}: BlogEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
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
          "min-h-[280px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none dark:prose-invert",
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

  const hasInternalLinks = useMemo(() => internalLinkOptions.length > 0, [internalLinkOptions])

  const handleSetLink = () => {
    if (!editor || disabled) return

    const previousUrl = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Enter link URL", previousUrl ?? "")

    if (url === null) return
    const trimmed = url.trim()

    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
  }

  const handleAddInternalLink = (href: string) => {
    if (!editor || disabled || !href) return
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
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
      editor.chain().focus().setImage({ src: url, alt: file.name || "Blog image" }).run()
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  if (!editor) {
    return <div className="min-h-[320px] rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">Loading editor...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border/70 bg-muted/40 p-1.5">
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={List}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Quote}
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Link2}
          label="Add link"
          active={editor.isActive("link")}
          onClick={handleSetLink}
          disabled={disabled}
        />
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

        {hasInternalLinks && (
          <div className="ml-auto min-w-[220px]">
            <Select onValueChange={handleAddInternalLink} disabled={disabled}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Insert internal link" />
              </SelectTrigger>
              <SelectContent>
                {internalLinkOptions.map((option) => (
                  <SelectItem key={option.href} value={option.href} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
    </div>
  )
}
