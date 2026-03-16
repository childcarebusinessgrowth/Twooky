"use client"

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { updateContactMessageStatus, type ContactMessageStatus } from "./actions"

const STATUS_LABELS: Record<ContactMessageStatus, string> = {
  new: "New",
  in_progress: "In progress",
  contacted: "Contacted",
  resolved: "Resolved",
}

type ContactMessageStatusCellProps = {
  id: string
  status: string
}

export function ContactMessageStatusCell({ id, status }: ContactMessageStatusCellProps) {
  const router = useRouter()
  const { toast } = useToast()
  const value = ["new", "in_progress", "contacted", "resolved"].includes(status)
    ? status
    : "new"

  async function handleChange(newStatus: string) {
    const result = await updateContactMessageStatus(id, newStatus)
    if (result.ok) {
      toast({
        title: "Status updated",
        description: `Marked as ${STATUS_LABELS[newStatus as ContactMessageStatus]?.toLowerCase() ?? newStatus}.`,
        variant: "success",
      })
      router.refresh()
    } else {
      toast({
        title: "Update failed",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="h-8 w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">{STATUS_LABELS.new}</SelectItem>
        <SelectItem value="in_progress">{STATUS_LABELS.in_progress}</SelectItem>
        <SelectItem value="contacted">{STATUS_LABELS.contacted}</SelectItem>
        <SelectItem value="resolved">{STATUS_LABELS.resolved}</SelectItem>
      </SelectContent>
    </Select>
  )
}
