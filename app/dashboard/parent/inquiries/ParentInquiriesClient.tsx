"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send } from "lucide-react"
import type { ParentInquiryPreviewRow } from "@/lib/parent-engagement"
import { getSupabaseClient } from "@/lib/supabaseClient"

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
  createdAt: string
  updatedAt: string
}

type ComposeFor = {
  providerSlug: string
  providerName: string
}

type Props = {
  inquiries: ParentInquiryPreviewRow[]
  initialOpenId: string | null
  composeFor: ComposeFor | null
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

export function ParentInquiriesClient({
  inquiries,
  initialOpenId,
  composeFor: initialComposeFor,
}: Props) {
  const router = useRouter()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedIdRef = useRef<string | null>(initialOpenId)
  const [selectedId, setSelectedId] = useState<string | null>(initialOpenId)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [inquiryMeta, setInquiryMeta] = useState<InquiryMeta | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [composeFor, setComposeFor] = useState<ComposeFor | null>(initialComposeFor)
  const [composeSubject, setComposeSubject] = useState("")
  const [composeMessage, setComposeMessage] = useState("")
  const [composeConsent, setComposeConsent] = useState(false)
  const [composeSubmitting, setComposeSubmitting] = useState(false)
  const [composeError, setComposeError] = useState<string | null>(null)

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
          createdAt: metaData.createdAt,
          updatedAt: metaData.updatedAt,
        })
      else setInquiryMeta(null)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  const queueRealtimeSync = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      const currentId = selectedIdRef.current
      router.refresh()
      if (currentId) void fetchThread(currentId)
    }, 150)
  }, [fetchThread, router])

  useEffect(() => {
    if (initialOpenId && !selectedId) setSelectedId(initialOpenId)
  }, [initialOpenId, selectedId])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    if (selectedId) void fetchThread(selectedId)
    else {
      setMessages([])
      setInquiryMeta(null)
    }
  }, [selectedId, fetchThread])

  useEffect(() => {
    let cancelled = false
    const channelName = `parent-inquiries-${Math.random().toString(36).slice(2)}`
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
            const inquiryId = (payload.new as { inquiry_id?: string } | null)?.inquiry_id
            if (currentId && inquiryId === currentId) void fetchThread(currentId)
            queueRealtimeSync()
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
  }, [fetchThread, queueRealtimeSync])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId || !replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/inquiries/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (!res.ok) {
        setReplyText((prev) => prev)
        return
      }
      setReplyText("")
      await fetchThread(selectedId)
    } finally {
      setSendingReply(false)
    }
  }

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeFor || !composeMessage.trim() || !composeConsent || composeSubmitting) return
    setComposeSubmitting(true)
    setComposeError(null)
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSlug: composeFor.providerSlug,
          subject: composeSubject.trim() || undefined,
          message: composeMessage.trim(),
          consentToContact: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setComposeError((data.error as string) ?? "Failed to send. Please try again.")
        return
      }
      const newId = data.id as string
      setComposeFor(null)
      setComposeSubject("")
      setComposeMessage("")
      setComposeConsent(false)
      setSelectedId(newId)
      router.replace(`/dashboard/parent/inquiries?open=${newId}`, { scroll: false })
      await fetchThread(newId)
    } finally {
      setComposeSubmitting(false)
    }
  }

  const selectedInquiry = inquiries.find((i) => i.id === selectedId)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1.5fr)] lg:gap-6">
      {/* Left: list */}
      <Card className="border border-border/60 rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inquiries.length === 0 && !composeFor ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No inquiries yet. Use &quot;Send Inquiry&quot; on a provider page to start a conversation.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {inquiries.map((inv) => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(inv.id)
                      setComposeFor(null)
                      router.replace(`/dashboard/parent/inquiries?open=${inv.id}`, { scroll: false })
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex flex-col gap-0.5 ${selectedId === inv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <span className="font-medium text-foreground truncate">
                      {inv.provider_business_name ?? "Provider"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {inv.inquiry_subject?.trim() || "Message sent"} · {formatDate(inv.updated_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Right: thread or compose or empty */}
      <Card className="border border-border/60 rounded-2xl overflow-hidden flex flex-col min-h-[320px]">
        {composeFor ? (
          <>
            <CardHeader>
              <CardTitle className="text-base">New message to {composeFor.providerName}</CardTitle>
              <CardDescription>Your first message will start the conversation.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <form onSubmit={handleComposeSubmit} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="text-xs font-medium text-muted-foreground block mb-1">Subject (optional)</label>
                  <input
                    id="subject"
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g. Tour request"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="text-xs font-medium text-muted-foreground block mb-1">Message</label>
                  <textarea
                    id="message"
                    required
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                    placeholder="Write your message..."
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    required
                    checked={composeConsent}
                    onChange={(e) => setComposeConsent(e.target.checked)}
                    className="mt-0.5 rounded border-input"
                  />
                  <span>
                    I consent to Early Learning Directory processing my data and sharing it with this provider for contact and follow-up, in line with the{" "}
                    <a href="/privacy" className="underline">Privacy Policy</a>.
                  </span>
                </label>
                {composeError && <p className="text-sm text-destructive">{composeError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={composeSubmitting || !composeMessage.trim() || !composeConsent}>
                    {composeSubmitting ? "Sending…" : "Send inquiry"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setComposeFor(null)
                      setComposeSubject("")
                      setComposeMessage("")
                      setComposeConsent(false)
                      router.replace("/dashboard/parent/inquiries", { scroll: false })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        ) : selectedId ? (
          <>
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                {loadingThread ? "Loading…" : inquiryMeta?.providerBusinessName ?? selectedInquiry?.provider_business_name ?? "Conversation"}
              </CardTitle>
              {inquiryMeta?.inquirySubject && (
                <CardDescription>{inquiryMeta.inquirySubject}</CardDescription>
              )}
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
                      className={`flex ${msg.senderType === "parent" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          msg.senderType === "parent"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderType === "parent" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
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
        ) : (
          <CardContent className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
            <div>
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Select a conversation or start a new one from a provider&apos;s page.</p>
              <p className="mt-1 text-xs">Click &quot;Send Inquiry&quot; on any provider to begin.</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
