"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
import { deleteContactMessage } from "./actions"

type ContactMessageDeleteButtonProps = {
  id: string
  /** Optional: sender name for the confirmation dialog */
  senderName?: string
}

export function ContactMessageDeleteButton({ id, senderName }: ContactMessageDeleteButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    const result = await deleteContactMessage(id)
    if (result.ok) {
      toast({ title: "Message deleted", variant: "success" })
      setOpen(false)
      router.refresh()
    } else {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" })
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        aria-label="Delete message"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete contact message?"
        description={
          senderName
            ? `This will permanently delete the message from ${senderName}. This action cannot be undone.`
            : "This will permanently delete this contact message. This action cannot be undone."
        }
        itemName={senderName}
        variant="delete"
        onConfirm={handleConfirm}
      />
    </>
  )
}
