"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, User, Mail, Phone, Calendar, Baby, Download, Search, StickyNote } from "lucide-react"
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
  source: string | null
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
  source: string | null
  programInterest: string | null
}

type LeadNote = {
  id: string
  noteText: string
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
      source: string | null
      childAge: string | null
    }
  | {
      type: "guest"
      id: string
      label: string
      email: string | null
      date: string
      source: string | null
      programInterest: string | null
    }

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
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
    case "contacted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
    case "tour_booked":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
    case "waitlist":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
    case "enrolled":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
    case "lost":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function getSourceBadgeClass(source: string | null): string {
  if (source === "compare") return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800"
  return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700"
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)
  const [exporting, setExporting] = useState(false)

  const allListItems: ListItem[] = useMemo(
    () =>
      [
        ...inquiries.map((i) => ({
          type: "thread" as const,
          id: i.id,
          label: getParentDisplayName(i),
          email: i.parent_email ?? null,
          date: i.updated_at,
          leadStatus: leadStatusOverrides[i.id] ?? i.lead_status ?? "new",
          source: i.source ?? null,
          childAge: i.child_age_group ?? null,
        })),
        ...guestInquiries.map((g) => ({
          type: "guest" as const,
          id: g.id,
          label: `${g.first_name} ${g.last_name}`.trim() || "Guest",
          email: null,
          date: g.created_at,
          source: g.source ?? null,
          programInterest: g.program_interest ?? null,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [inquiries, guestInquiries, leadStatusOverrides]
  )

  const listItems = useMemo(() => {
    let items = allListItems
    if (statusFilter !== "all") {
      items = items.filter(
        (item) => item.type !== "thread" || item.leadStatus === statusFilter
      )
    }
    if (sourceFilter !== "all") {
      items = items.filter((item) => (item.source ?? "directory") === sourceFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.email?.toLowerCase().includes(q) ?? false)
      )
    }
    return items
  }, [allListItems, statusFilter, sourceFilter, searchQuery])

  const stats = useMemo(() => {
    const threads = allListItems.filter((i) => i.type === "thread") as Extract<ListItem, { type: "thread" }>[]
    const newCount = threads.filter((i) => (leadStatusOverrides[i.id] ?? i.leadStatus) === "new").length
    const enrolledCount = threads.filter((i) => (leadStatusOverrides[i.id] ?? i.leadStatus) === "enrolled").length
    const total = threads.length
    const conversionRate = total > 0 ? Math.round((enrolledCount / total) * 100) : 0
    return { newCount, conversionRate, total }
  }, [allListItems, leadStatusOverrides])

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
          source: metaData.source ?? null,
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

  const fetchNotes = useCallback(async () => {
    if (!selectedId || !selectedType) return
    setNotesLoading(true)
    try {
      const leadType = selectedType === "thread" ? "inquiry" : "guest-inquiry"
      const res = await fetch(`/api/leads/${leadType}/${selectedId}/notes`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data.notes)) {
        setNotes(
          data.notes.map((n: { id: string; noteText: string; createdAt: string }) => ({
            id: n.id,
            noteText: n.noteText,
            createdAt: n.createdAt,
          }))
        )
      } else {
        setNotes([])
      }
    } finally {
      setNotesLoading(false)
    }
  }, [selectedId, selectedType])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !selectedType || !newNoteText.trim() || addingNote) return
    setAddingNote(true)
    try {
      const leadType = selectedType === "thread" ? "inquiry" : "guest-inquiry"
      const res = await fetch(`/api/leads/${leadType}/${selectedId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: newNoteText.trim() }),
      })
      if (res.ok) {
        setNewNoteText("")
        await fetchNotes()
      }
    } finally {
      setAddingNote(false)
    }
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const res = await fetch("/api/provider/leads/export")
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (selectedType === "thread" && selectedId) {
      setGuestDetail(null)
      void fetchThread(selectedId)
      void fetchNotes()
    } else if (selectedType === "guest" && selectedId) {
      setMessages([])
      setInquiryMeta(null)
      void fetchGuestDetail(selectedId)
      void fetchNotes()
    } else {
      setMessages([])
      setInquiryMeta(null)
      setGuestDetail(null)
      setNotes([])
    }
  }, [selectedType, selectedId, fetchThread, fetchGuestDetail, fetchNotes])

  useEffect(() => {
    let cancelled = false
    const channelName = `provider-inquiries-${Math.random().toString(36).slice(2)}`
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
    <div className="space-y-6">
      {/* Stats and actions header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">New leads</p>
            <p className="text-xl font-semibold text-foreground">{stats.newCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Conversion rate</p>
            <p className="text-xl font-semibold text-foreground">{stats.conversionRate}%</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting || allListItems.length === 0}
          className="shrink-0"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1.5fr)] lg:gap-6">
        {/* Left: list */}
        <Card className="border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="space-y-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="tour_booked">Tour Booked</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="directory">Directory</SelectItem>
                  <SelectItem value="compare">Compare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads ({listItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {allListItems.length === 0
                  ? "No leads yet. Parents will appear here when they send you a message."
                  : "No leads match your filters."}
              </div>
            ) : (
              <ul className="divide-y divide-border/60 max-h-[calc(100vh-420px)] overflow-y-auto">
                {listItems.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.type, item.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex flex-col gap-1 ${selectedId === item.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">{item.label}</span>
                        {item.type === "guest" && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Contact request
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {item.type === "thread" && item.email ? `${item.email} · ` : ""}
                        {item.type === "thread" && item.childAge ? `${item.childAge} · ` : ""}
                        {formatDate(item.date)}
                      </span>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.type === "thread" && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${getLeadStatusBadgeClass(item.leadStatus)}`}
                          >
                            {getLeadStatusLabel(item.leadStatus)}
                          </Badge>
                        )}
                        {(item.source === "directory" || item.source === "compare") && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getSourceBadgeClass(item.source)}`}
                          >
                            {item.source === "compare" ? "Compare" : "Directory"}
                          </Badge>
                        )}
                      </div>
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
                {selectedThread?.child_age_group && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Baby className="h-3.5 w-3.5" />
                    <span>Child age: {selectedThread.child_age_group}</span>
                  </div>
                )}
                {inquiryMeta?.inquirySubject && <div>{inquiryMeta.inquirySubject}</div>}
                <div className="flex flex-wrap gap-1">
                  {inquiryMeta?.leadStatus && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${getLeadStatusBadgeClass(inquiryMeta.leadStatus)}`}
                    >
                      {getLeadStatusLabel(inquiryMeta.leadStatus)}
                    </Badge>
                  )}
                  {(inquiryMeta?.source === "directory" || inquiryMeta?.source === "compare") && (
                    <Badge variant="outline" className={`text-[10px] ${getSourceBadgeClass(inquiryMeta.source)}`}>
                      {inquiryMeta.source === "compare" ? "Compare" : "Directory"}
                    </Badge>
                  )}
                </div>
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
              {/* Lead notes */}
              <div className="border-t border-border/60 p-4 space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </h4>
                {notesLoading ? (
                  <p className="text-xs text-muted-foreground">Loading notes…</p>
                ) : (
                  <>
                    {notes.length > 0 && (
                      <ul className="space-y-2 pb-2">
                        {notes.map((n) => (
                          <li
                            key={n.id}
                            className="text-xs rounded-lg bg-muted/50 p-2.5 border border-border/60"
                          >
                            <p className="whitespace-pre-wrap text-foreground">{n.noteText}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDate(n.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a note…"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        disabled={addingNote}
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                      <Button type="submit" size="sm" disabled={addingNote || !newNoteText.trim()}>
                        Add
                      </Button>
                    </form>
                  </>
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
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {loadingGuest ? "Loading…" : guestDetail ? `${guestDetail.firstName} ${guestDetail.lastName}` : selectedGuest ? `${selectedGuest.first_name} ${selectedGuest.last_name}`.trim() || "Guest" : "Contact request"}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">Contact request</Badge>
                {selectedGuest?.source && (
                  <Badge variant="outline" className={`text-[10px] ${getSourceBadgeClass(selectedGuest.source)}`}>
                    {selectedGuest.source === "compare" ? "Compare" : "Directory"}
                  </Badge>
                )}
              </div>
              <CardDescription>Reply by phone or email</CardDescription>
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
                  {guestDetail.programInterest && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Program interest:</span>
                      <span className="font-medium">{guestDetail.programInterest}</span>
                    </div>
                  )}
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
                  {/* Lead notes for guest */}
                  <div className="border-t border-border/60 pt-4 space-y-3">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5" />
                      Notes
                    </h4>
                    {notesLoading ? (
                      <p className="text-xs text-muted-foreground">Loading notes…</p>
                    ) : (
                      <>
                        {notes.length > 0 && (
                          <ul className="space-y-2 pb-2">
                            {notes.map((n) => (
                              <li
                                key={n.id}
                                className="text-xs rounded-lg bg-muted/50 p-2.5 border border-border/60"
                              >
                                <p className="whitespace-pre-wrap text-foreground">{n.noteText}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {formatDate(n.createdAt)}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                        <form onSubmit={handleAddNote} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a note…"
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            disabled={addingNote}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                          <Button type="submit" size="sm" disabled={addingNote || !newNoteText.trim()}>
                            Add
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
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
    </div>
  )
}
