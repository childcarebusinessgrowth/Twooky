"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, User, Mail, Phone, Calendar, Baby } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type {
  ProviderInquiryPreviewRow,
  GuestInquiryPreviewRow,
} from "@/lib/parent-engagement"

type ThreadMessage = {
  messageOrder: number
  senderType: string
  senderProfileId: string
  body: string
  createdAt: string
}

type InquiryMeta = {
  id: string
  inquirySubject: string | null
  providerBusinessName: string | null
  providerSlug: string | null
  parentDisplayName: string | null
  parentEmail: string | null
  createdAt: string
  updatedAt: string
  leadStatus: string
}

type GuestDetail = {
  id: string
  childDob: string | null
  idealStartDate: string | null
  message: string
  firstName: string
  lastName: string
  email: string
  telephone: string
  createdAt: string
}

type ListItem =
  | {
      type: "thread"
      id: string
      label: string
      email: string | null
      date: string
      leadStatus: string
    }
  | { type: "guest"; id: string; label: string; email: string | null; date: string }

type Props = {
  inquiries: ProviderInquiryPreviewRow[]
  guestInquiries: GuestInquiryPreviewRow[]
  initialOpenId: string | null
}

function getParentDisplayName(inquiry: ProviderInquiryPreviewRow): string {
  return inquiry.parent_display_name?.trim() || "Parent"
}

function formatDate(s: string): string {
  const d = new Date(s)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inquiryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - inquiryDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `Today · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined })
}

function formatDateOnly(s: string | null): string {
  if (!s) return "—"
  return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function getLeadStatusLabel(status: string): string {
  switch (status) {
    case "new":
      return "New"
    case "contacted":
      return "Contacted"
    case "tour_booked":
      return "Tour Booked"
    case "waitlist":
      return "Waitlist"
    case "enrolled":
      return "Enrolled"
    case "lost":
      return "Lost"
    default:
      return "New"
  }
}

function getLeadStatusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "contacted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200"
    case "tour_booked":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "waitlist":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "enrolled":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "lost":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function ProviderInquiriesClient({
  inquiries,
  guestInquiries,
  initialOpenId,
}: Props) {
  const router = useRouter()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIdRef = useRef<string | null>(initialOpenId)
  const selectedTypeRef = useRef<"thread" | "guest" | null>(null)
  const [selectedType, setSelectedType] = useState<"thread" | "guest" | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [inquiryMeta, setInquiryMeta] = useState<InquiryMeta | null>(null)
  const [guestDetail, setGuestDetail] = useState<GuestDetail | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadingGuest, setLoadingGuest] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [updatingOutcome, setUpdatingOutcome] = useState(false)
  const [leadStatusOverrides, setLeadStatusOverrides] = useState<Record<string, string>>({})

  const listItems: ListItem[] = [
    ...inquiries.map((i) => ({
      type: "thread" as const,
      id: i.id,
      label: getParentDisplayName(i),
      email: i.parent_email ?? null,
      date: i.updated_at,
      leadStatus: leadStatusOverrides[i.id] ?? i.lead_status ?? "new",
    })),
    ...guestInquiries.map((g) => ({
      type: "guest" as const,
      id: g.id,
      label: `${g.first_name} ${g.last_name}`.trim() || "Guest",
      email: null,
      date: g.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const fetchThread = useCallback(async (inquiryId: string) => {
    setLoadingThread(true)
    try {
      const [messagesRes, metaRes] = await Promise.all([
        fetch(`/api/inquiries/${inquiryId}/messages`),
        fetch(`/api/inquiries/${inquiryId}`),
      ])
      const messagesData = await messagesRes.json()
      const metaData = await metaRes.json()
      if (messagesRes.ok) setMessages(messagesData.messages ?? [])
      else setMessages([])
      if (metaRes.ok)
        setInquiryMeta({
          id: metaData.id,
          inquirySubject: metaData.inquirySubject ?? null,
          providerBusinessName: metaData.providerBusinessName ?? null,
          providerSlug: metaData.providerSlug ?? null,
          parentDisplayName: metaData.parentDisplayName ?? null,
          parentEmail: metaData.parentEmail ?? null,
          createdAt: metaData.createdAt,
          updatedAt: metaData.updatedAt,
          leadStatus: metaData.leadStatus ?? "new",
        })
      else setInquiryMeta(null)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  const fetchGuestDetail = useCallback(async (guestId: string) => {
    setLoadingGuest(true)
    try {
      const res = await fetch(`/api/guest-inquiries/${guestId}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setGuestDetail(data)
      else setGuestDetail(null)
    } finally {
      setLoadingGuest(false)
    }
  }, [])

  const queueRealtimeSync = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      const currentId = selectedIdRef.current
      const currentType = selectedTypeRef.current
      router.refresh()
      if (currentType === "thread" && currentId) void fetchThread(currentId)
      if (currentType === "guest" && currentId) void fetchGuestDetail(currentId)
    }, 150)
  }, [fetchGuestDetail, fetchThread, router])

  useEffect(() => {
    if (!initialOpenId) return
    const inThread = inquiries.some((i) => i.id === initialOpenId)
    const inGuest = guestInquiries.some((g) => g.id === initialOpenId)
    if (inThread) {
      setSelectedType("thread")
      setSelectedId(initialOpenId)
    } else if (inGuest) {
      setSelectedType("guest")
      setSelectedId(initialOpenId)
    }
  }, [initialOpenId, inquiries, guestInquiries])

  useEffect(() => {
    selectedIdRef.current = selectedId
    selectedTypeRef.current = selectedType
  }, [selectedId, selectedType])

  useEffect(() => {
    if (selectedType === "thread" && selectedId) {
      setGuestDetail(null)
      void fetchThread(selectedId)
    } else if (selectedType === "guest" && selectedId) {
      setMessages([])
      setInquiryMeta(null)
      void fetchGuestDetail(selectedId)
    } else {
      setMessages([])
      setInquiryMeta(null)
      setGuestDetail(null)
    }
  }, [selectedType, selectedId, fetchThread, fetchGuestDetail])

  useEffect(() => {
    let cancelled = false
    let channelName = `provider-inquiries-${Math.random().toString(36).slice(2)}`
    try {
      const supabase = getSupabaseClient()
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "inquiries" },
          () => {
            if (!cancelled) queueRealtimeSync()
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "inquiry_messages" },
          (payload) => {
            if (cancelled) return
            const currentId = selectedIdRef.current
            const currentType = selectedTypeRef.current
            const inquiryId = (payload.new as { inquiry_id?: string } | null)?.inquiry_id
            if (currentType === "thread" && currentId && inquiryId === currentId) {
              void fetchThread(currentId)
            }
            queueRealtimeSync()
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "guest_inquiries" },
          () => {
            if (!cancelled) queueRealtimeSync()
          }
        )
        .subscribe()

      return () => {
        cancelled = true
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
        void supabase.removeChannel(channel)
      }
    } catch {
      return () => {
        cancelled = true
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      }
    }
  }, [fetchGuestDetail, fetchThread, queueRealtimeSync])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedType !== "thread" || !selectedId || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/inquiries/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (!res.ok) return
      setReplyText("")
      await fetchThread(selectedId)
    } finally {
      setSendingReply(false)
    }
  }

  const handleSelect = (type: "thread" | "guest", id: string) => {
    setSelectedType(type)
    setSelectedId(id)
    router.replace(`/dashboard/provider/inquiries?open=${id}`, { scroll: false })
  }

  const handleLeadStatusChange = async (value: string) => {
    if (selectedType !== "thread" || !selectedId || !inquiryMeta || updatingOutcome) return
    setUpdatingOutcome(true)
    try {
      const res = await fetch(`/api/inquiries/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_status: value }),
      })
      if (res.ok) {
        setInquiryMeta((prev) => (prev ? { ...prev, leadStatus: value } : null))
        setLeadStatusOverrides((prev) => ({ ...prev, [selectedId]: value }))
      }
    } finally {
      setUpdatingOutcome(false)
    }
  }

  const selectedThread = inquiries.find((i) => i.id === selectedId)
  const selectedGuest = guestInquiries.find((g) => g.id === selectedId)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1.5fr)] lg:gap-6">
      {/* Left: list */}
      <Card className="border border-border/60 rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {listItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. Parents will appear here when they send you a message.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {listItems.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.type, item.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex flex-col gap-0.5 ${selectedId === item.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{item.label}</span>
                      {item.type === "guest" && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          Contact request
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {item.type === "thread" && item.email ? `${item.email} · ` : ""}
                      {formatDate(item.date)}
                    </span>
                    {item.type === "thread" ? (
                      <div className="pt-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${getLeadStatusBadgeClass(item.leadStatus)}`}
                        >
                          {getLeadStatusLabel(item.leadStatus)}
                        </Badge>
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Right: thread, guest detail, or empty */}
      <Card className="border border-border/60 rounded-2xl overflow-hidden flex flex-col min-h-[320px]">
        {selectedType === "thread" && selectedId ? (
          <>
            <CardHeader className="border-b border-border/60 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {loadingThread
                    ? "Loading…"
                    : inquiryMeta?.parentDisplayName?.trim() ||
                      (selectedThread ? getParentDisplayName(selectedThread) : "Parent")}
                </CardTitle>
                {inquiryMeta && (
                  <Select
                    value={inquiryMeta.leadStatus}
                    onValueChange={handleLeadStatusChange}
                    disabled={updatingOutcome}
                  >
                    <SelectTrigger className="w-[170px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="tour_booked">Tour Booked</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <CardDescription className="space-y-1">
                {inquiryMeta?.parentEmail ? (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <a href={`mailto:${inquiryMeta.parentEmail}`} className="hover:underline">
                      {inquiryMeta.parentEmail}
                    </a>
                  </div>
                ) : selectedThread?.parent_email ? (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <a href={`mailto:${selectedThread.parent_email}`} className="hover:underline">
                      {selectedThread.parent_email}
                    </a>
                  </div>
                ) : null}
                {inquiryMeta?.inquirySubject && <div>{inquiryMeta.inquirySubject}</div>}
                {inquiryMeta?.leadStatus && (
                  <div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${getLeadStatusBadgeClass(inquiryMeta.leadStatus)}`}
                    >
                      {getLeadStatusLabel(inquiryMeta.leadStatus)}
                    </Badge>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {loadingThread ? (
                  <p className="text-sm text-muted-foreground">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.messageOrder}
                      className={`flex ${msg.senderType === "provider" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          msg.senderType === "provider"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderType === "provider" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={handleSendReply}
                className="border-t border-border/60 p-4 flex gap-2"
              >
                <input
                  type="text"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Type a message…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sendingReply}
                />
                <Button type="submit" size="icon" disabled={sendingReply || !replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </>
        ) : selectedType === "guest" && selectedId ? (
          <>
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {loadingGuest ? "Loading…" : guestDetail ? `${guestDetail.firstName} ${guestDetail.lastName}` : selectedGuest ? `${selectedGuest.first_name} ${selectedGuest.last_name}`.trim() || "Guest" : "Contact request"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary">Contact request — reply by phone or email</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-6 space-y-4">
              {loadingGuest ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : guestDetail ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Baby className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Child DOB:</span>
                      <span className="font-medium">{formatDateOnly(guestDetail.childDob)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ideal start:</span>
                      <span className="font-medium">{formatDateOnly(guestDetail.idealStartDate)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Message</h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap rounded-lg bg-muted/50 p-3">
                      {guestDetail.message}
                    </p>
                  </div>
                  <div className="border-t border-border/60 pt-4 space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Contact details</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${guestDetail.email}`} className="text-primary hover:underline">
                        {guestDetail.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${guestDetail.telephone}`} className="text-primary hover:underline">
                        {guestDetail.telephone}
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Received {formatDate(guestDetail.createdAt)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load details.</p>
              )}
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
            <div>
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to view and reply.</p>
              <p className="text-xs mt-1">Contact requests from guests are view-only.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
