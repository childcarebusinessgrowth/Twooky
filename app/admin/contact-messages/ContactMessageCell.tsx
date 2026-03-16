"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Expand } from "lucide-react"

const PREVIEW_LEN = 80

type ContactMessageCellProps = {
  message: string
}

export function ContactMessageCell({ message }: ContactMessageCellProps) {
  const [open, setOpen] = useState(false)
  const isLong = message.length > PREVIEW_LEN
  const preview = isLong ? message.slice(0, PREVIEW_LEN) + "…" : message

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
          {preview}
        </span>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-1.5 text-primary hover:text-primary/90"
            aria-label="View full message"
          >
            <Expand className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Full message</DialogTitle>
        </DialogHeader>
        <p
          className="whitespace-pre-wrap wrap-break-word rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          {message || "—"}
        </p>
      </DialogContent>
    </Dialog>
  )
}
