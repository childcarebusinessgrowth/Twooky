"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  applyProviderWebsiteTemplate,
  createProviderWebsite,
  deleteProviderWebsitePage,
  loadProviderWebsiteState,
  publishProviderWebsite,
  saveProviderWebsiteDraft,
  addProviderWebsitePage,
  uploadProviderWebsiteAsset,
  type WebsitePageRow,
  type WebsiteState,
} from "@/app/dashboard/provider/website/actions"
import type { HorizontalAlign } from "@/lib/website-builder/alignment"
import {
  ARTBOARD,
  layoutTriple,
  pickLayoutForBreakpoint,
  pickLayoutWithMobileResolver,
  resolveMobileArtboardHeight,
  resolveMobileLayoutMap,
} from "@/lib/website-builder/layout-helpers"
import { summarizeMobileValidationIssues, validateMobileWebsite } from "@/lib/website-builder/mobile-validator"
import {
  innerBoxStyle,
  outerMarginStyle,
} from "@/lib/website-builder/node-chrome-styles"
import { STANDARD_NAV, TEMPLATE_KEYS, TEMPLATE_LANDING } from "@/lib/website-builder/templates/presets"
import type { CanvasNode, CanvasNodeProps, CanvasNodeType, NavItem, WebsiteBuilderBreakpoint } from "@/lib/website-builder/types"
import { CanvasNodeContent } from "@/components/provider/website-builder/canvas-node-content"
import { TemplatePreviewCard } from "@/components/provider/website-builder/template-preview-card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { LucideIcon } from "lucide-react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Globe,
  Images,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Loader2,
  Mail,
  Minus,
  Monitor,
  MousePointerClick,
  PanelBottom,
  PanelRightClose,
  PanelRightOpen,
  PanelTop,
  Plus,
  Redo2,
  RectangleHorizontal,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Type,
  Undo2,
  Upload,
  Video,
} from "lucide-react"

function deepClonePages(pages: WebsitePageRow[]): WebsitePageRow[] {
  return JSON.parse(JSON.stringify(pages)) as WebsitePageRow[]
}

function newNodeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}-${Math.random()}`
}

const PALETTE_DRAG_THRESHOLD_PX = 6
const PUBLISH_NOTICE_STORAGE_KEY = "provider-website-builder-publish-notice-until"

function clientToLocalArtboard(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const x = (clientX - rect.left) * (el.clientWidth / rect.width)
  const y = (clientY - rect.top) * (el.clientHeight / rect.height)
  return { x, y }
}

function defaultNodeDimensions(type: CanvasNodeType): { w: number; h: number } {
  const desk = ARTBOARD.desktop
  const w =
    type === "navbar" || type === "footer"
      ? desk.w - 32
      : type === "contactForm"
        ? Math.min(1100, desk.w - 48)
        : 280
  const h =
    type === "text"
      ? 80
      : type === "button"
        ? 48
        : type === "navbar"
          ? 56
          : type === "footer"
            ? 72
            : type === "gallery"
              ? 200
              : type === "contactForm"
                ? 560
                : 120
  return { w, h }
}

type AddNodePlacement =
  | { placement?: "default" }
  | { placement: "drop"; desktopCenter: { x: number; y: number } }

function isExternalNavPath(path: string): boolean {
  const t = path.trim().toLowerCase()
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("mailto:")
}

function isExternalHttpNavPath(path: string): boolean {
  const t = path.trim().toLowerCase()
  return t.startsWith("http://") || t.startsWith("https://")
}

function pageInternalNavPath(page: WebsitePageRow): string {
  if (page.is_home) return ""
  return (page.path_slug || "").replace(/^\/+/, "").trim()
}

function internalNavKey(path: string): string {
  return path.trim().toLowerCase().replace(/^\/+/, "")
}

function withNavItemIds(list: NavItem[]): NavItem[] {
  return list.map((it) => (it.id ? it : { ...it, id: newNodeId() }))
}

const NODE_TYPES: { type: CanvasNodeType; label: string; hint: string; icon: LucideIcon }[] = [
  { type: "text", label: "Text", hint: "Headings and body copy", icon: Type },
  { type: "image", label: "Image", hint: "Photos and banners", icon: ImageIcon },
  { type: "button", label: "Button", hint: "Links and CTAs", icon: MousePointerClick },
  { type: "video", label: "Video embed", hint: "YouTube or Vimeo", icon: Video },
  { type: "navbar", label: "Navbar", hint: "Top navigation", icon: PanelTop },
  { type: "footer", label: "Footer", hint: "Footer bar", icon: PanelBottom },
  { type: "section", label: "Section", hint: "Background area", icon: LayoutGrid },
  { type: "gallery", label: "Gallery", hint: "Image grid", icon: Images },
  { type: "contactForm", label: "Contact form", hint: "Lead form (published site)", icon: Mail },
]

export default function WebsiteBuilderClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<WebsiteState | null>(null)
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bp, setBp] = useState<WebsiteBuilderBreakpoint>("desktop")
  const [mobilePanel, setMobilePanel] = useState<"canvas" | "pages" | "library" | "inspector">("canvas")
  const [publishedNotice, setPublishedNotice] = useState(false)
  /** Desktop (lg+): hide inspector panel to widen canvas; mobile uses tab bar only. */
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [pageToDelete, setPageToDelete] = useState<{ id: string; label: string } | null>(null)
  const [blankStartConfirmOpen, setBlankStartConfirmOpen] = useState(false)
  const [paletteDragging, setPaletteDragging] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const publishNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const artboardRef = useRef<HTMLDivElement | null>(null)
  const suppressNextLibraryClickRef = useRef(false)

  const history = useRef<{ pages: WebsitePageRow[]; theme: WebsiteState["website"]["theme_tokens"]; nav: WebsiteState["website"]["nav_items"] }[]>([])
  const histIndex = useRef(-1)

  const pushHistory = useCallback(() => {
    if (!state) return
    const snap = {
      pages: deepClonePages(state.pages),
      theme: { ...state.website.theme_tokens },
      nav: [...state.website.nav_items],
    }
    const h = history.current
    if (histIndex.current < h.length - 1) {
      h.splice(histIndex.current + 1)
    }
    h.push(snap)
    if (h.length > 40) {
      h.shift()
    }
    histIndex.current = h.length - 1
  }, [state])

  const undo = useCallback(() => {
    if (histIndex.current <= 0) return
    histIndex.current -= 1
    const s = history.current[histIndex.current]
    if (!s || !state) return
    setState({
      website: {
        ...state.website,
        theme_tokens: { ...s.theme },
        nav_items: [...s.nav],
      },
      pages: deepClonePages(s.pages),
    })
  }, [state])

  const redo = useCallback(() => {
    if (histIndex.current >= history.current.length - 1) return
    histIndex.current += 1
    const s = history.current[histIndex.current]
    if (!s || !state) return
    setState({
      website: {
        ...state.website,
        theme_tokens: { ...s.theme },
        nav_items: [...s.nav],
      },
      pages: deepClonePages(s.pages),
    })
  }, [state])

  const replaceWebsiteStateFromServer = useCallback((next: WebsiteState) => {
    setState(next)
    setActivePageId(next.pages[0]?.id ?? null)
    setSelectedId(null)
    history.current = [
      {
        pages: deepClonePages(next.pages),
        theme: { ...next.website.theme_tokens },
        nav: [...next.website.nav_items],
      },
    ]
    histIndex.current = 0
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await loadProviderWebsiteState()
      if (cancelled) return
      if ("error" in res) {
        toast.error(res.error)
        setLoading(false)
        return
      }
      setState(res.state)
      if (res.state?.pages.length) {
        setActivePageId(res.state.pages[0].id)
      }
      if (res.state) {
        history.current = [
          {
            pages: deepClonePages(res.state.pages),
            theme: { ...res.state.website.theme_tokens },
            nav: [...res.state.website.nav_items],
          },
        ]
        histIndex.current = 0
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activePage = useMemo(
    () => state?.pages.find((p) => p.id === activePageId) ?? null,
    [state, activePageId],
  )

  const selectedNode = useMemo(
    () => activePage?.canvas_nodes.find((n) => n.id === selectedId) ?? null,
    [activePage, selectedId],
  )

  const mobileLayoutMap = useMemo(() => {
    if (bp !== "mobile" || !activePage) return null
    return resolveMobileLayoutMap(activePage.canvas_nodes)
  }, [bp, activePage])

  const art = useMemo(() => {
    const base = ARTBOARD[bp]
    if (bp !== "mobile" || !activePage) return base
    return { ...base, h: resolveMobileArtboardHeight(activePage.canvas_nodes) }
  }, [bp, activePage])

  const scheduleSave = useCallback((nextState: WebsiteState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const r = await saveProviderWebsiteDraft({
        websiteId: nextState.website.id,
        theme_tokens: nextState.website.theme_tokens,
        nav_items: nextState.website.nav_items,
        pages: nextState.pages.map((page) => ({
          id: page.id,
          canvas_nodes: page.canvas_nodes,
          title: page.title,
          seo_title: page.seo_title,
          meta_description: page.meta_description,
          path_slug: page.path_slug,
        })),
      })
      setSaving(false)
      if ("error" in r) toast.error(r.error)
    }, 900)
  }, [])

  const clearPublishNoticeTimer = useCallback(() => {
    if (publishNoticeTimer.current) {
      clearTimeout(publishNoticeTimer.current)
      publishNoticeTimer.current = null
    }
  }, [])

  const showPublishedNotice = useCallback(
    (durationMs = 9000) => {
      setPublishedNotice(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PUBLISH_NOTICE_STORAGE_KEY, String(Date.now() + durationMs))
      }
      clearPublishNoticeTimer()
      publishNoticeTimer.current = setTimeout(() => {
        setPublishedNotice(false)
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(PUBLISH_NOTICE_STORAGE_KEY)
        }
      }, durationMs)
    },
    [clearPublishNoticeTimer],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem(PUBLISH_NOTICE_STORAGE_KEY)
    if (!raw) return
    const until = Number(raw)
    if (!Number.isFinite(until) || until <= Date.now()) {
      sessionStorage.removeItem(PUBLISH_NOTICE_STORAGE_KEY)
      return
    }
    const remaining = until - Date.now()
    const id = window.setTimeout(() => {
      showPublishedNotice(remaining)
    }, 0)
    return () => window.clearTimeout(id)
  }, [showPublishedNotice])

  useEffect(() => {
    return () => {
      clearPublishNoticeTimer()
    }
  }, [clearPublishNoticeTimer])

  const updatePages = useCallback(
    (updater: (pages: WebsitePageRow[]) => WebsitePageRow[]) => {
      setState((prev) => {
        if (!prev) return prev
        const pages = updater(deepClonePages(prev.pages))
        const next = { ...prev, pages }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const updateWebsiteMeta = useCallback(
    (patch: Partial<WebsiteState["website"]>) => {
      setState((prev) => {
        if (!prev) return prev
        const next = { ...prev, website: { ...prev.website, ...patch } }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const patchNode = useCallback(
    (id: string, patch: Partial<CanvasNode>) => {
      pushHistory()
      updatePages((pages) =>
        pages.map((p) =>
          p.id !== activePageId
            ? p
            : {
                ...p,
                canvas_nodes: p.canvas_nodes.map((n) => {
                  if (n.id !== id) return n
                  const nextProps =
                    patch.props !== undefined ? { ...n.props, ...patch.props } : n.props
                  const nextLayout =
                    patch.layout !== undefined ? { ...n.layout, ...patch.layout } : n.layout
                  return {
                    ...n,
                    ...patch,
                    props: nextProps,
                    layout: nextLayout,
                  }
                }),
              },
        ),
      )
    },
    [activePageId, updatePages, pushHistory],
  )

  const fixPatchNode = useCallback(
    (id: string, fn: (n: CanvasNode) => CanvasNode) => {
      updatePages((pages) =>
        pages.map((p) =>
          p.id !== activePageId
            ? p
            : {
                ...p,
                canvas_nodes: p.canvas_nodes.map((n) => (n.id === id ? fn(n) : n)),
              },
        ),
      )
    },
    [activePageId, updatePages],
  )

  const addNode = useCallback(
    (type: CanvasNodeType, placementOpts: AddNodePlacement = {}) => {
      if (!activePage) return
      pushHistory()
      const id = newNodeId()
      const desk = ARTBOARD.desktop
      const { w, h } = defaultNodeDimensions(type)

      let x: number
      let y: number
      if (placementOpts.placement === "drop" && placementOpts.desktopCenter) {
        const cx = placementOpts.desktopCenter.x
        const cy = placementOpts.desktopCenter.y
        x = Math.round(Math.min(Math.max(cx - w / 2, 0), desk.w - w))
        y = Math.round(Math.min(Math.max(cy - h / 2, 0), desk.h - h))
      } else {
        x = (desk.w - w) / 2
        y = 120 + activePage.canvas_nodes.length * 12
      }

      const layout = layoutTriple(x, y, w, h)
      const base: CanvasNode = {
        id,
        type,
        parentId: null,
        zIndex: 50 + activePage.canvas_nodes.length,
        layout,
        props: {},
      }
      if (type === "text") base.props = { text: "New text", fontSize: 24, color: "#0f172a" }
      if (type === "button") base.props = { label: "Button", href: "/contact", backgroundColor: "#203e68", color: "#fff", borderRadius: 8 }
      if (type === "image") base.props = { src: "", alt: "" }
      if (type === "video") base.props = { embedUrl: "" }
      if (type === "navbar")
        base.props = {
          navItems: state?.website.nav_items?.length ? state.website.nav_items : STANDARD_NAV,
          backgroundColor: "#ffffff",
          color: "#0f172a",
        }
      if (type === "footer") base.props = { text: "© Your nursery", backgroundColor: "#0f172a", color: "#e2e8f0" }
      if (type === "section") base.props = { backgroundColor: "#f1f5f9" }
      if (type === "gallery") base.props = { items: [] }
      if (type === "contactForm") base.props = { showProgramInterest: true, introHint: "" }

      updatePages((pages) =>
        pages.map((p) => (p.id === activePage.id ? { ...p, canvas_nodes: [...p.canvas_nodes, base] } : p)),
      )
      setSelectedId(id)
    },
    [activePage, pushHistory, state, updatePages],
  )

  const handleLibraryPointerDown = useCallback(
    (e: React.PointerEvent, type: CanvasNodeType) => {
      if (e.button !== 0) return
      if (e.pointerType !== "mouse" && e.pointerType !== "touch" && e.pointerType !== "pen") return
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const pointerId = e.pointerId
      let moved = false

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (Math.hypot(dx, dy) > PALETTE_DRAG_THRESHOLD_PX) {
          if (!moved) {
            moved = true
            setPaletteDragging(true)
          }
        }
      }

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
        setPaletteDragging(false)
      }

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        cleanup()
        suppressNextLibraryClickRef.current = true

        if (moved) {
          const el = artboardRef.current
          if (el) {
            const local = clientToLocalArtboard(el, ev.clientX, ev.clientY)
            const art = ARTBOARD[bp]
            if (local.x >= 0 && local.x <= art.w && local.y >= 0 && local.y <= art.h) {
              const desk = ARTBOARD.desktop
              const deskX = (local.x / art.w) * desk.w
              const deskY = (local.y / art.h) * desk.h
              addNode(type, { placement: "drop", desktopCenter: { x: deskX, y: deskY } })
            }
          }
        } else {
          addNode(type)
        }
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    },
    [bp, addNode],
  )

  const handleLibraryClick = useCallback(
    (type: CanvasNodeType) => {
      if (suppressNextLibraryClickRef.current) {
        suppressNextLibraryClickRef.current = false
        return
      }
      addNode(type)
    },
    [addNode],
  )

  const removeNode = useCallback(
    (id: string) => {
      pushHistory()
      updatePages((pages) =>
        pages.map((p) => (p.id === activePageId ? { ...p, canvas_nodes: p.canvas_nodes.filter((n) => n.id !== id) } : p)),
      )
      setSelectedId(null)
    },
    [activePageId, pushHistory, updatePages],
  )

  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    ox: number
    oy: number
    pointerId: number
    captureEl: Element | null
  } | null>(null)
  const resizeRef = useRef<{
    id: string
    startX: number
    startY: number
    ow: number
    oh: number
    ox: number
    oy: number
    pointerId: number
    captureEl: Element | null
  } | null>(null)
  /** Layout coords are pre-transform; canvas uses CSS scale — convert screen delta to artboard px */
  const canvasScaleRef = useRef(1)

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = canvasScaleRef.current || 1
      if (dragRef.current) {
        const d = dragRef.current
        const dx = (e.clientX - d.startX) / s
        const dy = (e.clientY - d.startY) / s
        fixPatchNode(d.id, (n) => {
          const cur = pickLayoutForBreakpoint(n, bp)
          const next = { ...cur, x: Math.round(d.ox + dx), y: Math.round(d.oy + dy) }
          return { ...n, layout: { ...n.layout, [bp]: next } }
        })
      }
      if (resizeRef.current) {
        const r = resizeRef.current
        const dx = (e.clientX - r.startX) / s
        const dy = (e.clientY - r.startY) / s
        fixPatchNode(r.id, (n) => {
          const cur = pickLayoutForBreakpoint(n, bp)
          const next = {
            ...cur,
            w: Math.max(40, Math.round(r.ow + dx)),
            h: Math.max(24, Math.round(r.oh + dy)),
          }
          return { ...n, layout: { ...n.layout, [bp]: next } }
        })
      }
    },
    [bp, fixPatchNode],
  )

  const endInteract = useCallback(() => {
    const d = dragRef.current
    const r = resizeRef.current
    for (const ref of [d, r]) {
      if (ref?.captureEl && ref.pointerId != null) {
        try {
          ref.captureEl.releasePointerCapture(ref.pointerId)
        } catch {
          // already released
        }
      }
    }
    dragRef.current = null
    resizeRef.current = null
  }, [])

  const startDrag = useCallback(
    (e: React.PointerEvent, n: CanvasNode) => {
      if (bp === "mobile") return
      e.stopPropagation()
      e.preventDefault()
      setSelectedId(n.id)
      const cur = pickLayoutForBreakpoint(n, bp)
      pushHistory()
      const el = e.currentTarget
      dragRef.current = {
        id: n.id,
        startX: e.clientX,
        startY: e.clientY,
        ox: cur.x,
        oy: cur.y,
        pointerId: e.pointerId,
        captureEl: el,
      }
      el.setPointerCapture(e.pointerId)
    },
    [bp, pushHistory],
  )

  const startResize = useCallback(
    (e: React.PointerEvent, n: CanvasNode) => {
      if (bp === "mobile") return
      e.stopPropagation()
      e.preventDefault()
      const cur = pickLayoutForBreakpoint(n, bp)
      pushHistory()
      const el = e.currentTarget
      resizeRef.current = {
        id: n.id,
        startX: e.clientX,
        startY: e.clientY,
        ow: cur.w,
        oh: cur.h,
        ox: cur.x,
        oy: cur.y,
        pointerId: e.pointerId,
        captureEl: el,
      }
      el.setPointerCapture(e.pointerId)
    },
    [bp, pushHistory],
  )

  const [canvasScale, setCanvasScale] = useState(1)
  useEffect(() => {
    canvasScaleRef.current = canvasScale
  }, [canvasScale])

  useEffect(() => {
    const artW = ARTBOARD[bp].w
    function update() {
      if (typeof window === "undefined") {
        setCanvasScale(1)
        return
      }
      const isLg = window.matchMedia("(min-width: 1024px)").matches
      let avail: number
      if (!isLg) {
        avail = window.innerWidth - 48
      } else {
        const leftSidebar = 288 + 32
        const rightInspector = inspectorOpen ? 320 + 32 : 24
        const horizontalPad = 64
        avail = window.innerWidth - leftSidebar - rightInspector - horizontalPad
      }
      setCanvasScale(Math.min(1, Math.max(0.15, avail / (artW + 48))))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [bp, inspectorOpen])

  useEffect(() => {
    function onWinPointerUp(e: PointerEvent) {
      if (!dragRef.current && !resizeRef.current) return
      const d = dragRef.current
      const r = resizeRef.current
      if (d && e.pointerId === d.pointerId) endInteract()
      if (r && e.pointerId === r.pointerId) endInteract()
    }
    window.addEventListener("pointerup", onWinPointerUp)
    window.addEventListener("pointercancel", onWinPointerUp)
    return () => {
      window.removeEventListener("pointerup", onWinPointerUp)
      window.removeEventListener("pointercancel", onWinPointerUp)
    }
  }, [endInteract])

  const sitePreviewBase = `/site/${state?.website.subdomain_slug ?? ""}`
  const mobileValidation = useMemo(() => {
    if (!state) return { ok: true, issues: [] }
    return validateMobileWebsite({
      pages: state.pages.map((p) => ({
        id: p.id,
        path_slug: p.path_slug,
        title: p.title,
        canvas_nodes: p.canvas_nodes,
      })),
    })
  }, [state])
  const hasMobileBlockingIssues = mobileValidation.issues.length > 0
  const mobileIssueSummary = summarizeMobileValidationIssues(mobileValidation.issues, 2)

  if (loading) {
    return (
      <div className="flex min-h-[min(520px,calc(100vh-14rem))] flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground lg:hidden">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading builder…
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <div className="hidden w-72 shrink-0 flex-col gap-3 lg:flex">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="flex min-h-[280px] flex-1 flex-col gap-3">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="min-h-[240px] flex-1 rounded-xl" />
          </div>
          <div className="hidden w-80 shrink-0 lg:block">
            <Skeleton className="h-full min-h-[320px] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!state) {
    return (
      <Card className="mx-auto max-w-lg border-dashed">
        <CardHeader className="text-center sm:text-left">
          <div className="text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 sm:mx-0">
            <LayoutTemplate className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">No website yet</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Choose a childcare template or start from a blank canvas on the start page — then you will land here to
            edit and publish.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/dashboard/provider/website">Browse templates &amp; build</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={async () => {
              const r = await createProviderWebsite("blank")
              if ("error" in r) toast.error(r.error)
              else {
                replaceWebsiteStateFromServer(r.state)
                toast.success("Blank site created")
              }
            }}
          >
            Quick start: blank only
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const fullLiveUrl = origin ? `${origin}${sitePreviewBase}` : sitePreviewBase

  function copyLiveUrl() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${sitePreviewBase}` : fullLiveUrl
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Could not copy"))
  }

  const leftPagesBlock = (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 font-semibold">
          <LayoutTemplate className="text-primary h-5 w-5" />
          Pages
        </div>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Switch pages and manage your site structure.</p>
      </div>
      <ScrollArea className="h-44 lg:h-52">
        <div className="flex flex-col gap-1 pr-3">
          {state.pages.map((p) => {
            const label = p.title || p.path_slug || "Home"
            return (
              <div key={p.id} className="group flex items-center gap-1">
                <Button
                  variant={p.id === activePageId ? "secondary" : "ghost"}
                  size="sm"
                  title={label}
                  className={cn(
                    "min-w-0 flex-1 justify-start border border-transparent",
                    p.id === activePageId && "border-primary/20 bg-accent",
                  )}
                  onClick={() => {
                    setActivePageId(p.id)
                    setSelectedId(null)
                  }}
                >
                  <span className="truncate">{label}</span>
                </Button>
                {!p.is_home && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    type="button"
                    aria-label={`Delete ${label}`}
                    onClick={() =>
                      setPageToDelete({
                        id: p.id,
                        label,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Plus className="h-4 w-4" />
            Add page
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New page</DialogTitle>
          </DialogHeader>
          <AddPageForm
            websiteId={state.website.id}
            onCreated={(pageId) => {
              void loadProviderWebsiteState().then((res) => {
                if ("ok" in res && res.state) {
                  setState(res.state)
                  setActivePageId(pageId)
                }
              })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )

  const leftLibraryBlock = (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 font-semibold">
          <Layers className="text-primary h-5 w-5" />
          Block library
        </div>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Drag a block onto the canvas, or click to add in the default spot.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {NODE_TYPES.map((nt) => {
          const Icon = nt.icon
          return (
            <button
              key={nt.type}
              type="button"
              onPointerDown={(e) => handleLibraryPointerDown(e, nt.type)}
              onClick={() => handleLibraryClick(nt.type)}
              className="hover:bg-accent hover:border-primary/20 flex w-full cursor-grab touch-none select-none items-start gap-3 rounded-lg border border-border bg-card/50 p-2.5 text-left transition-colors active:cursor-grabbing"
            >
              <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-sm font-medium">{nt.label}</span>
                <span className="text-muted-foreground block text-xs">{nt.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const leftUrlCard = (
    <Card className="border-dashed shadow-none">
      <CardHeader className="space-y-1 p-3 pb-2">
        <CardTitle className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          Live site URL
        </CardTitle>
        <CardDescription className="text-xs">After you publish, families can open this address.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <p className="bg-muted/60 font-mono text-foreground break-all rounded-md px-2 py-1.5 text-[11px] leading-snug">
          {fullLiveUrl}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={copyLiveUrl}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={sitePreviewBase} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <AlertDialog
        open={pageToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPageToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              {pageToDelete
                ? `“${pageToDelete.label}” will be removed from your site. This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const target = pageToDelete
                if (!target) return
                const r = await deleteProviderWebsitePage(target.id)
                if ("error" in r) toast.error(r.error)
                else {
                  setState((prev) => {
                    if (!prev) return prev
                    const remaining = prev.pages.filter((x) => x.id !== target.id)
                    if (activePageId === target.id) {
                      setActivePageId(remaining[0]?.id ?? null)
                    }
                    return { ...prev, pages: remaining }
                  })
                }
                setPageToDelete(null)
              }}
            >
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-20 flex shrink-0 gap-1 overflow-x-auto border-b p-2 backdrop-blur-sm lg:hidden">
          {(
            [
              { id: "canvas" as const, label: "Canvas" },
              { id: "pages" as const, label: "Pages" },
              { id: "library" as const, label: "Blocks" },
              { id: "inspector" as const, label: "Inspector" },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={mobilePanel === tab.id ? "secondary" : "ghost"}
              className="shrink-0 rounded-full"
              onClick={() => setMobilePanel(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex min-h-[min(520px,calc(100dvh-16rem))] flex-1 flex-col gap-3 lg:min-h-0 lg:flex-row lg:gap-4">
          <aside className="bg-card hidden w-full shrink-0 flex-col gap-4 rounded-xl border p-4 shadow-sm lg:flex lg:w-72">
            {leftPagesBlock}
            <Separator />
            {leftLibraryBlock}
            <Separator />
            {leftUrlCard}
          </aside>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-auto lg:hidden",
              mobilePanel !== "pages" && "hidden",
            )}
          >
            <div className="bg-card m-2 space-y-4 rounded-xl border p-4 shadow-sm">
              {leftPagesBlock}
              {leftUrlCard}
            </div>
          </div>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-auto lg:hidden",
              mobilePanel !== "library" && "hidden",
            )}
          >
            <div className="bg-card m-2 rounded-xl border p-4 shadow-sm">{leftLibraryBlock}</div>
          </div>

          <main
            className={cn(
              "relative flex min-h-[45vh] flex-1 flex-col overflow-hidden lg:min-h-0",
              mobilePanel !== "canvas" && "hidden lg:flex",
            )}
          >
            <div className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b px-2 py-2 backdrop-blur-sm sm:px-3">
              <ToggleGroup
                type="single"
                value={bp}
                onValueChange={(v) => {
                  if (v === "desktop" || v === "tablet" || v === "mobile") setBp(v)
                }}
                variant="outline"
                size="sm"
                className="bg-muted/50 gap-0.5 rounded-lg p-0.5"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="desktop" aria-label="Desktop preview" className="h-8 w-9 px-0">
                      <Monitor className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Desktop</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="tablet" aria-label="Tablet preview" className="h-8 w-9 px-0">
                      <RectangleHorizontal className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Tablet</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="mobile" aria-label="Mobile preview" className="h-8 w-9 px-0">
                      <Smartphone className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Mobile</TooltipContent>
                </Tooltip>
              </ToggleGroup>

              <div className="hidden h-6 w-px bg-border sm:block" />

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={undo} aria-label="Undo">
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Undo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={redo} aria-label="Redo">
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Redo</TooltipContent>
                </Tooltip>
              </div>

              <Badge variant="secondary" className="hidden sm:inline-flex">
                {saving ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 shrink-0 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-3 w-3 shrink-0" />
                    Saved
                  </>
                )}
              </Badge>

              <div className="flex-1" />

              {hasMobileBlockingIssues && (
                <Badge variant="destructive" className="hidden gap-1 sm:inline-flex">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {mobileValidation.issues.length} mobile issue{mobileValidation.issues.length === 1 ? "" : "s"}
                </Badge>
              )}

              <AlertDialog open={blankStartConfirmOpen} onOpenChange={setBlankStartConfirmOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start from a blank canvas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will replace all of your current pages, layout, and styles with a minimal blank starter. Your
                      draft content will be lost. Your live site stays unchanged until you publish again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={async () => {
                        const r = await applyProviderWebsiteTemplate("blank")
                        if ("error" in r) {
                          toast.error(r.error)
                          return
                        }
                        replaceWebsiteStateFromServer(r.state)
                        setBlankStartConfirmOpen(false)
                        toast.success("Blank canvas applied")
                      }}
                    >
                      Start from blank
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setBlankStartConfirmOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start from blank
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Apply a template</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground text-sm">
                    Replaces all pages and styles with the chosen preset. Your current layout will be overwritten.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
                    {TEMPLATE_KEYS.map((k) => {
                      const meta = TEMPLATE_LANDING[k]
                      return (
                        <TemplatePreviewCard
                          key={k}
                          meta={meta}
                          className="h-full"
                          footer={
                            <Button
                              size="sm"
                              className="w-full min-w-0"
                              onClick={async () => {
                                const r = await applyProviderWebsiteTemplate(k)
                                if ("error" in r) toast.error(r.error)
                                else {
                                  replaceWebsiteStateFromServer(r.state)
                                  toast.success("Template applied")
                                }
                              }}
                            >
                              Apply
                            </Button>
                          }
                        />
                      )
                    })}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                size="sm"
                className="shrink-0 cursor-pointer gap-1.5 font-semibold disabled:cursor-not-allowed"
                disabled={hasMobileBlockingIssues}
                onClick={async () => {
                  if (hasMobileBlockingIssues) {
                    toast.error(mobileIssueSummary)
                    return
                  }
                  const r = await publishProviderWebsite(state.website.id)
                  if ("error" in r) toast.error(r.error)
                  else {
                    toast.success("Site is live now", {
                      description: "Your website has been published successfully and is now visible to families.",
                      duration: 5000,
                    })
                    showPublishedNotice(9000)
                    setState((prev) =>
                      prev
                        ? {
                            ...prev,
                            website: {
                              ...prev.website,
                              published_version_id: r.publishedVersionId,
                            },
                          }
                        : prev,
                    )
                  }
                }}
              >
                Publish
              </Button>
            </div>

            {hasMobileBlockingIssues && (
              <div className="border-destructive/30 bg-destructive/5 text-destructive px-3 py-2 text-xs">
                {mobileIssueSummary}
              </div>
            )}

            {publishedNotice && (
              <div className="border-emerald-200 bg-emerald-50 text-emerald-900 flex flex-wrap items-center gap-2 border px-3 py-2 text-sm">
                <span className="font-semibold">Site is live now.</span>
                <span>Your latest changes are published.</span>
                <Link href={sitePreviewBase} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  Open live site
                </Link>
              </div>
            )}

            <div
              className="min-h-0 flex-1 overflow-auto rounded-b-xl p-3 sm:p-4"
              style={{
                backgroundColor: "var(--muted)",
                backgroundImage:
                  "radial-gradient(color-mix(in oklch, var(--border) 80%, transparent) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            >
              <div
                ref={artboardRef}
                data-palette-dragging={paletteDragging ? "true" : undefined}
                className={cn(
                  "relative mx-auto overflow-hidden rounded-lg border border-border/80 bg-transparent shadow-lg ring-1 ring-black/5",
                  paletteDragging && "ring-primary/40 ring-2",
                )}
                style={{
                  width: art.w,
                  height: art.h,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: "top center",
                }}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={endInteract}
                onPointerCancel={endInteract}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("[data-canvas-node]")) return
                  setSelectedId(null)
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: state.website.theme_tokens.backgroundColor ?? "#f8fafc",
                  }}
                />
                {activePage?.canvas_nodes
                  .slice()
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((n) => {
                    const L = pickLayoutWithMobileResolver(n, bp, mobileLayoutMap)
                    const selected = n.id === selectedId
                    return (
                      <div
                        key={n.id}
                        data-canvas-node
                        className={cn(
                          "absolute rounded-sm border-2 transition-shadow",
                          selected ? "border-primary shadow-[0_0_0_1px_var(--ring)]" : "border-transparent",
                        )}
                        style={{
                          left: L.x,
                          top: L.y,
                          width: L.w,
                          height: L.h,
                          zIndex: n.zIndex,
                          ...outerMarginStyle(n.props),
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(n.id)
                        }}
                      >
                        <div
                          className="h-full min-h-0 w-full"
                          style={
                            shouldApplyOuterInnerBox(n)
                              ? innerBoxStyle(n.props, innerPaddingOptsForNode(n))
                              : undefined
                          }
                        >
                          <div
                            className={cn(
                              "h-full min-h-0 w-full overflow-hidden select-none",
                              n.type !== "navbar" && "touch-none",
                              bp === "mobile" || n.type === "navbar"
                                ? "cursor-default"
                                : "cursor-grab active:cursor-grabbing",
                            )}
                            onPointerDown={
                              bp === "mobile" || n.type === "navbar"
                                ? undefined
                                : (e) => startDrag(e, n)
                            }
                          >
                            <CanvasNodeContent
                              node={n}
                              siteBase={sitePreviewBase}
                              theme={state.website.theme_tokens}
                              variant="editor"
                              onVideoPointerDown={(e) => e.stopPropagation()}
                              isMobileBreakpoint={bp === "mobile"}
                              navbarCompact={bp !== "desktop"}
                              subdomainSlug={state.website.subdomain_slug ?? undefined}
                            />
                          </div>
                        </div>
                        {selected && bp !== "mobile" && (
                          <button
                            type="button"
                            className="border-background bg-primary ring-primary absolute -right-1.5 -bottom-1.5 z-10 h-4 w-4 cursor-nwse-resize rounded-sm border-2 shadow-md ring-1"
                            aria-label="Resize"
                            onPointerDown={(e) => startResize(e, n)}
                          />
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            {!inspectorOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-28 right-0 z-30 hidden h-20 w-9 shrink-0 rounded-l-lg rounded-r-none border border-r-0 shadow-md lg:inline-flex"
                    aria-label="Open inspector panel"
                    onClick={() => setInspectorOpen(true)}
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Open inspector</TooltipContent>
              </Tooltip>
            )}
          </main>

          <aside
            className={cn(
              "bg-card w-full shrink-0 flex-col rounded-xl border p-4 shadow-sm lg:w-80",
              mobilePanel === "inspector" ? "flex" : "max-lg:hidden",
              inspectorOpen ? "lg:flex" : "lg:hidden",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight">Inspector</h3>
                {selectedNode && (
                  <Badge variant="outline" className="font-normal capitalize">
                    {selectedNode.type}
                  </Badge>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground -mr-1 hidden h-8 w-8 shrink-0 lg:inline-flex"
                    aria-label="Close inspector panel"
                    onClick={() => setInspectorOpen(false)}
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Close inspector</TooltipContent>
              </Tooltip>
            </div>
            {state && (
              <div className="mb-3">
                <SiteThemePanel
                  theme={state.website.theme_tokens}
                  onTheme={(patch) => {
                    pushHistory()
                    updateWebsiteMeta({
                      theme_tokens: {
                        ...state.website.theme_tokens,
                        ...patch,
                      },
                    })
                  }}
                />
              </div>
            )}
            {!selectedNode && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Select a block on the canvas to edit its content and style.
              </p>
            )}
            {selectedNode && state && (
              <InspectorPanel
                node={selectedNode}
                pages={state.pages}
                onPatch={(patch) => patchNode(selectedNode.id, patch)}
                onProps={(props) => {
                  pushHistory()
                  fixPatchNode(selectedNode.id, (n) => ({ ...n, props: { ...n.props, ...props } }))
                }}
                onDelete={() => removeNode(selectedNode.id)}
                onUploadAsset={async (file, targetProp) => {
                  const fd = new FormData()
                  fd.set("file", file)
                  const r = await uploadProviderWebsiteAsset(state.website.id, fd)
                  if ("error" in r) toast.error(r.error)
                  else {
                    pushHistory()
                    fixPatchNode(selectedNode.id, (n) => ({
                      ...n,
                      props: { ...n.props, [targetProp]: r.publicUrl },
                    }))
                  }
                }}
              />
            )}
          </aside>
        </div>
      </div>
    </>
  )
}

function NavbarInspectorSection({
  pages,
  navItems,
  logoSrc,
  logoAlt,
  logoHeight,
  onUploadLogo,
  onRemoveLogo,
  onProps,
}: {
  pages: WebsitePageRow[]
  navItems: NavItem[]
  logoSrc?: string
  logoAlt?: string
  logoHeight?: number
  onUploadLogo: (f: File) => void
  onRemoveLogo: () => void
  onProps: (p: CanvasNode["props"]) => void
}) {
  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.sort_order - b.sort_order), [pages])
  const items = navItems ?? []
  const [draftLabel, setDraftLabel] = useState("")
  const [draftPath, setDraftPath] = useState("")
  const [draftVariant, setDraftVariant] = useState<"link" | "button">("link")
  const [draftOpenInNewTab, setDraftOpenInNewTab] = useState(false)
  const effectiveLogoHeight = typeof logoHeight === "number" && Number.isFinite(logoHeight) ? Math.round(Math.min(96, Math.max(20, logoHeight))) : 40

  const commit = (next: NavItem[]) => {
    onProps({ navItems: withNavItemIds(next) })
  }

  const pageInNav = (page: WebsitePageRow) => {
    const key = internalNavKey(pageInternalNavPath(page))
    return items.some((it) => !isExternalNavPath(it.path) && internalNavKey(it.path) === key)
  }

  const togglePage = (page: WebsitePageRow, checked: boolean) => {
    const key = internalNavKey(pageInternalNavPath(page))
    if (checked) {
      if (pageInNav(page)) return
      commit([
        ...items,
        {
          id: newNodeId(),
          label: page.title || pageInternalNavPath(page) || "Home",
          path: pageInternalNavPath(page),
          variant: "link" as const,
        },
      ])
      return
    }
    commit(items.filter((it) => isExternalNavPath(it.path) || internalNavKey(it.path) !== key))
  }

  const updateAt = (index: number, patch: Partial<NavItem>) => {
    commit(
      items.map((it, i) => {
        if (i !== index) return it
        const merged: NavItem = { ...it, ...patch }
        if (!isExternalHttpNavPath(merged.path)) merged.openInNewTab = false
        return merged
      }),
    )
  }

  const removeAt = (index: number) => {
    commit(items.filter((_, i) => i !== index))
  }

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[index]!
    next[index] = next[j]!
    next[j] = tmp
    commit(next)
  }

  const addCustom = () => {
    const label = draftLabel.trim() || "Link"
    const path = draftPath.trim()
    commit([
      ...items,
      {
        id: newNodeId(),
        label,
        path,
        variant: draftVariant,
        ...(isExternalHttpNavPath(path) && draftOpenInNewTab ? { openInNewTab: true } : {}),
      },
    ])
    setDraftLabel("")
    setDraftPath("")
    setDraftVariant("link")
    setDraftOpenInNewTab(false)
  }

  return (
    <>
      <div>
        <Label className="text-xs">Logo</Label>
        <p className="text-muted-foreground mb-2 text-xs">Shows at the left side of this navbar.</p>
        <div className="space-y-2 rounded-md border p-2">
          {logoSrc ? (
            <div className="bg-muted/40 flex h-14 items-center rounded border px-2">
              <Image
                src={logoSrc}
                alt={logoAlt || "Navbar logo"}
                width={200}
                height={64}
                className="max-h-10 w-auto object-contain"
                unoptimized
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No logo uploaded yet.</p>
          )}
          <label className="border-input bg-background hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs transition-colors">
            <Upload className="h-4 w-4 shrink-0" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUploadLogo(f)
              }}
            />
            <span className="text-primary font-medium">{logoSrc ? "Replace logo" : "Upload logo"}</span>
          </label>
          {logoSrc && (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onRemoveLogo}>
              Remove logo
            </Button>
          )}
          <Input
            className="h-8 text-xs"
            placeholder="Logo alt text (optional)"
            value={logoAlt ?? ""}
            onChange={(e) => onProps({ logoAlt: e.target.value })}
          />
          <NumericStepperRow
            label="Logo size"
            value={effectiveLogoHeight}
            min={20}
            step={2}
            ariaLabelPrefix="Navbar logo"
            onChange={(n) => onProps({ logoHeight: Math.min(96, Math.max(20, n)) })}
          />
        </div>
      </div>

      <Separator />
      <div>
        <Label className="text-xs">Pages on this site</Label>
        <p className="text-muted-foreground mb-2 text-xs">Show or hide pages in this navbar.</p>
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
          {sortedPages.map((page) => {
            const checked = pageInNav(page)
            return (
              <label key={page.id} className="flex cursor-pointer items-center gap-2 text-xs">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => togglePage(page, v === true)}
                />
                <span className="truncate">{page.title || pageInternalNavPath(page) || "Home"}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs">Menu items</Label>
        <p className="text-muted-foreground mb-2 text-xs">Label, target (slug or URL), and style.</p>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={it.id ?? `nav-${i}`} className="space-y-2 rounded-md border p-2">
              <Input
                className="h-8 text-xs"
                placeholder="Label"
                value={it.label}
                onChange={(e) => updateAt(i, { label: e.target.value })}
              />
              <Input
                className="h-8 text-xs"
                placeholder="e.g. fees or https://…"
                value={it.path}
                onChange={(e) => updateAt(i, { path: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={it.variant === "button" ? "button" : "link"}
                  onValueChange={(v) => {
                    if (v === "link" || v === "button") updateAt(i, { variant: v })
                  }}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <ToggleGroupItem value="link" className="text-xs">
                    Link
                  </ToggleGroupItem>
                  <ToggleGroupItem value="button" className="text-xs">
                    Button
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAt(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isExternalHttpNavPath(it.path) && (
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={it.openInNewTab === true}
                    onCheckedChange={(v) => updateAt(i, { openInNewTab: v === true })}
                  />
                  Open in new tab
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs">Add custom link</Label>
        <div className="mt-1 space-y-2 rounded-md border p-2">
          <Input className="h-8 text-xs" placeholder="Label" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
          <Input className="h-8 text-xs" placeholder="e.g. fees or https://…" value={draftPath} onChange={(e) => setDraftPath(e.target.value)} />
          <ToggleGroup
            type="single"
            value={draftVariant}
            onValueChange={(v) => {
              if (v === "link" || v === "button") setDraftVariant(v)
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="link" className="text-xs">
              Link
            </ToggleGroupItem>
            <ToggleGroupItem value="button" className="text-xs">
              Button
            </ToggleGroupItem>
          </ToggleGroup>
          {isExternalHttpNavPath(draftPath) && (
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={draftOpenInNewTab} onCheckedChange={(v) => setDraftOpenInNewTab(v === true)} />
              Open in new tab
            </label>
          )}
          <Button type="button" size="sm" className="w-full" onClick={addCustom}>
            Add
          </Button>
        </div>
      </div>
    </>
  )
}

function innerPaddingOptsForNode(node: CanvasNode): Parameters<typeof innerBoxStyle>[1] {
  switch (node.type) {
    case "footer":
      return { allSidesFallback: 8 }
    case "contactForm":
      return { allSidesFallback: 12 }
    case "navbar":
      return { navbarHorizontalDefaultPx: 16, navbarVerticalDefaultPx: 0 }
    default:
      return undefined
  }
}

function shouldApplyOuterInnerBox(node: CanvasNode): boolean {
  switch (node.type) {
    case "button":
    case "navbar":
    case "footer":
    case "section":
    case "gallery":
    case "contactForm":
      return false
    default:
      return true
  }
}

function defaultHorizontalAlignForNodeType(type: CanvasNode["type"]): HorizontalAlign | null {
  switch (type) {
    case "text":
      return "left"
    case "button":
    case "image":
    case "video":
    case "footer":
    case "navbar":
    case "gallery":
    case "contactForm":
      return "center"
    default:
      return null
  }
}

function AlignmentInspectorRow({
  value,
  whenUnset,
  onProps,
}: {
  value: HorizontalAlign | undefined
  whenUnset: HorizontalAlign
  onProps: (p: CanvasNode["props"]) => void
}) {
  const current = value ?? whenUnset
  return (
    <div className="space-y-2">
      <Label className="text-xs">Alignment</Label>
      <ToggleGroup
        type="single"
        value={current}
        onValueChange={(v) => {
          const next: HorizontalAlign =
            v === "left" || v === "center" || v === "right" ? v : current
          onProps({ textAlign: next })
        }}
        variant="outline"
        size="sm"
        className="grid w-full grid-cols-3"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft className="mx-auto h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter className="mx-auto h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight className="mx-auto h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

const SPACING_STEP = 4

function NumericStepperRow({
  label,
  value,
  onChange,
  min = 0,
  step,
  ariaLabelPrefix,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  step: number
  ariaLabelPrefix: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-17 shrink-0 text-xs leading-tight">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={`${ariaLabelPrefix} ${label} decrease`}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </Button>
        <Input
          type="number"
          min={min}
          inputMode="numeric"
          className="h-8 min-w-16 flex-1 text-center text-sm tabular-nums shadow-sm"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isNaN(n)) return
            onChange(Math.max(min, n))
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={`${ariaLabelPrefix} ${label} increase`}
          onClick={() => onChange(value + step)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

function SpacingSideGroup({
  title,
  description,
  keys,
  values,
  onPatch,
}: {
  title: string
  description: string
  keys: readonly [keyof CanvasNodeProps, keyof CanvasNodeProps, keyof CanvasNodeProps, keyof CanvasNodeProps]
  values: { top: number; right: number; bottom: number; left: number }
  onPatch: (patch: Partial<CanvasNodeProps>) => void
}) {
  const sides: { label: string; k: keyof CanvasNodeProps; v: number }[] = [
    { label: "Top", k: keys[0], v: values.top },
    { label: "Right", k: keys[1], v: values.right },
    { label: "Bottom", k: keys[2], v: values.bottom },
    { label: "Left", k: keys[3], v: values.left },
  ]
  return (
    <div className="space-y-2.5 rounded-lg border border-border/70 bg-background/60 p-3 shadow-sm">
      <div>
        <p className="text-xs font-medium leading-none">{title}</p>
        <p className="text-muted-foreground mt-1 text-[11px] leading-snug">{description}</p>
      </div>
      <div className="space-y-2">
        {sides.map(({ label, k, v }) => (
          <NumericStepperRow
            key={String(k)}
            label={label}
            value={v}
            step={SPACING_STEP}
            ariaLabelPrefix={title}
            onChange={(n) => onPatch({ [k]: n })}
          />
        ))}
      </div>
    </div>
  )
}

function SpacingBorderInspector({
  node,
  onProps,
}: {
  node: CanvasNode
  onProps: (p: CanvasNode["props"]) => void
}) {
  const p = node.props
  const showGap = node.type === "gallery" || node.type === "navbar"
  const defaultGap = node.type === "navbar" ? 12 : 8
  const gapDisplay = p.gap ?? defaultGap
  const bw = typeof p.borderWidth === "number" ? p.borderWidth : 0
  const borderStyleVal = p.borderStyle ?? "solid"

  return (
    <Collapsible className="rounded-lg border bg-muted/20 px-3 py-2" defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
        <span>Spacing & border</span>
        <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Values are in pixels (px). Use − / + for quick steps, or type a number.
        </p>

        <SpacingSideGroup
          title="Margin"
          description="Space outside this block (between it and neighbouring elements)."
          keys={["marginTop", "marginRight", "marginBottom", "marginLeft"]}
          values={{
            top: p.marginTop ?? 0,
            right: p.marginRight ?? 0,
            bottom: p.marginBottom ?? 0,
            left: p.marginLeft ?? 0,
          }}
          onPatch={onProps}
        />
        <SpacingSideGroup
          title="Padding"
          description="Space inside the block, between the border and the content."
          keys={["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]}
          values={{
            top: p.paddingTop ?? 0,
            right: p.paddingRight ?? 0,
            bottom: p.paddingBottom ?? 0,
            left: p.paddingLeft ?? 0,
          }}
          onPatch={onProps}
        />

        {showGap && (
          <div className="space-y-2 rounded-lg border border-border/70 bg-background/60 p-3 shadow-sm">
            <div>
              <p className="text-xs font-medium leading-none">Gap between items</p>
              <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
                Space between nav links or gallery images. Shown for navbar and gallery blocks.
              </p>
            </div>
            <NumericStepperRow
              label="Gap"
              value={gapDisplay}
              step={SPACING_STEP}
              ariaLabelPrefix="Gap between items"
              onChange={(n) => onProps({ gap: n })}
            />
          </div>
        )}

        <div className="space-y-2.5 rounded-lg border border-border/70 bg-background/60 p-3 shadow-sm">
          <div>
            <p className="text-xs font-medium leading-none">Border</p>
            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
              Set width to 0 for no border, or pick a style and colour.
            </p>
          </div>
          <NumericStepperRow
            label="Width"
            value={bw}
            step={1}
            ariaLabelPrefix="Border"
            onChange={(n) => onProps({ borderWidth: n })}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1 sm:min-w-0 sm:flex-1">
              <Label className="text-muted-foreground text-[11px]">Colour</Label>
              <Input
                type="color"
                value={(p.borderColor ?? "#cbd5e1").slice(0, 7)}
                onChange={(e) => onProps({ borderColor: e.target.value })}
                className="h-10 w-full max-w-full cursor-pointer p-1 sm:max-w-32"
                title="Border colour"
              />
            </div>
            <div className="space-y-1 sm:w-[140px] sm:shrink-0">
              <Label className="text-muted-foreground text-[11px]">Style</Label>
              <Select
                value={borderStyleVal}
                onValueChange={(v) => {
                  if (v === "none" || v === "solid" || v === "dashed" || v === "dotted") onProps({ borderStyle: v })
                }}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SiteThemePanel({
  theme,
  onTheme,
  defaultOpen = true,
}: {
  theme: WebsiteState["website"]["theme_tokens"]
  onTheme: (patch: Partial<WebsiteState["website"]["theme_tokens"]>) => void
  defaultOpen?: boolean
}) {
  return (
    <Collapsible className="rounded-lg border bg-muted/20 px-3 py-2" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left text-sm font-medium">
        Site theme
        <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">
        <Field>
          <FieldLabel className="text-xs">Site background</FieldLabel>
          <FieldDescription>Applies to all pages across your site.</FieldDescription>
          <FieldContent>
            <Input
              type="color"
              value={theme.backgroundColor ?? "#f8fafc"}
              onChange={(e) => onTheme({ backgroundColor: e.target.value })}
              className="h-9 w-full max-w-32 cursor-pointer"
            />
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel className="text-xs">Primary accent</FieldLabel>
          <FieldDescription>Used for links and highlights on the live site.</FieldDescription>
          <FieldContent>
            <Input
              type="color"
              value={theme.primaryColor ?? "#203e68"}
              onChange={(e) => onTheme({ primaryColor: e.target.value })}
              className="h-9 w-full max-w-32 cursor-pointer"
            />
          </FieldContent>
        </Field>
      </CollapsibleContent>
    </Collapsible>
  )
}

function InspectorPanel({
  node,
  pages,
  onPatch,
  onProps,
  onDelete,
  onUploadAsset,
}: {
  node: CanvasNode
  pages: WebsitePageRow[]
  onPatch: (p: Partial<CanvasNode>) => void
  onProps: (p: CanvasNode["props"]) => void
  onDelete: () => void
  onUploadAsset: (f: File, targetProp: "src" | "logoSrc") => void
}) {
  const p = node.props
  const alignDefault = defaultHorizontalAlignForNodeType(node.type)
  return (
    <ScrollArea className="h-[min(520px,calc(100dvh-18rem))] pr-2 lg:h-[calc(100dvh-16rem)]">
      <div className="space-y-4 text-sm">
        <Field>
          <FieldLabel className="text-xs">Stacking order</FieldLabel>
          <FieldDescription>Higher numbers draw on top of other blocks.</FieldDescription>
          <FieldContent>
            <Input
              type="number"
              value={node.zIndex}
              onChange={(e) => onPatch({ zIndex: Number(e.target.value) || 0 })}
            />
          </FieldContent>
        </Field>

        {alignDefault !== null && (
          <AlignmentInspectorRow value={p.textAlign} whenUnset={alignDefault} onProps={onProps} />
        )}

        <SpacingBorderInspector node={node} onProps={onProps} />

        <Separator />

        {(node.type === "text" || node.type === "footer") && (
          <Field>
            <FieldLabel className="text-xs">Text</FieldLabel>
            <FieldContent>
              <Textarea
                className="min-h-[88px] resize-y"
                value={p.text ?? ""}
                onChange={(e) => onProps({ text: e.target.value })}
              />
            </FieldContent>
          </Field>
        )}

        {node.type === "text" && (
          <>
            <Field>
              <FieldLabel className="text-xs">Font size</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  value={p.fontSize ?? 16}
                  onChange={(e) => onProps({ fontSize: Number(e.target.value) })}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Text colour</FieldLabel>
              <FieldContent>
                <Input
                  type="color"
                  value={p.color ?? "#000000"}
                  onChange={(e) => onProps({ color: e.target.value })}
                  className="h-9 w-full max-w-32 cursor-pointer"
                />
              </FieldContent>
            </Field>
          </>
        )}

        {node.type === "button" && (
          <>
            <Field>
              <FieldLabel className="text-xs">Label</FieldLabel>
              <FieldContent>
                <Input value={p.label ?? ""} onChange={(e) => onProps({ label: e.target.value })} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Link</FieldLabel>
              <FieldDescription>Internal path (e.g. contact) or full URL.</FieldDescription>
              <FieldContent>
                <Input value={p.href ?? ""} onChange={(e) => onProps({ href: e.target.value })} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Button colour</FieldLabel>
              <FieldContent>
                <Input
                  type="color"
                  value={p.backgroundColor ?? "#203e68"}
                  onChange={(e) => onProps({ backgroundColor: e.target.value })}
                  className="h-9 w-full max-w-32 cursor-pointer"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Button text colour</FieldLabel>
              <FieldContent>
                <Input
                  type="color"
                  value={p.color ?? "#ffffff"}
                  onChange={(e) => onProps({ color: e.target.value })}
                  className="h-9 w-full max-w-32 cursor-pointer"
                />
              </FieldContent>
            </Field>
          </>
        )}

        {node.type === "image" && (
          <>
            <Field>
              <FieldLabel className="text-xs">Image URL</FieldLabel>
              <FieldContent>
                <Input value={p.src ?? ""} onChange={(e) => onProps({ src: e.target.value })} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Upload</FieldLabel>
              <FieldContent>
                <label className="border-input bg-background hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs transition-colors">
                  <Upload className="h-4 w-4 shrink-0" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onUploadAsset(f, "src")
                    }}
                  />
                  <span className="text-primary font-medium">Choose file</span>
                </label>
              </FieldContent>
            </Field>
          </>
        )}

        {node.type === "video" && (
          <Field>
            <FieldLabel className="text-xs">YouTube or Vimeo URL</FieldLabel>
            <FieldContent>
              <Input value={p.embedUrl ?? ""} onChange={(e) => onProps({ embedUrl: e.target.value })} />
            </FieldContent>
          </Field>
        )}

        {(node.type === "section" || node.type === "navbar" || node.type === "footer") && (
          <Field>
            <FieldLabel className="text-xs">Background</FieldLabel>
            <FieldContent>
              <Input
                type="color"
                value={(p.backgroundColor ?? "#ffffff").slice(0, 7)}
                onChange={(e) => onProps({ backgroundColor: e.target.value })}
                className="h-9 w-full max-w-32 cursor-pointer"
              />
            </FieldContent>
          </Field>
        )}

        {(node.type === "navbar" || node.type === "footer") && (
          <Field>
            <FieldLabel className="text-xs">Text colour</FieldLabel>
            <FieldContent>
              <Input
                type="color"
                value={(p.color ?? (node.type === "navbar" ? "#0f172a" : "#e2e8f0")).slice(0, 7)}
                onChange={(e) => onProps({ color: e.target.value })}
                className="h-9 w-full max-w-32 cursor-pointer"
              />
            </FieldContent>
          </Field>
        )}

        {node.type === "navbar" && (
          <NavbarInspectorSection
            pages={pages}
            navItems={p.navItems ?? []}
            logoSrc={p.logoSrc}
            logoAlt={p.logoAlt}
            logoHeight={p.logoHeight}
            onUploadLogo={(file) => onUploadAsset(file, "logoSrc")}
            onRemoveLogo={() => onProps({ logoSrc: "", logoAlt: "", logoHeight: 40 })}
            onProps={onProps}
          />
        )}

        {node.type === "contactForm" && (
          <>
            <Field>
              <FieldLabel className="text-xs">Intro line (optional)</FieldLabel>
              <FieldDescription>Shown above the form on the live site.</FieldDescription>
              <FieldContent>
                <Textarea
                  className="min-h-[60px] resize-y text-xs"
                  value={p.introHint ?? ""}
                  onChange={(e) => onProps({ introHint: e.target.value })}
                  placeholder="e.g. We reply within two business days."
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel className="text-xs">Program interest field</FieldLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={p.showProgramInterest !== false}
                    onCheckedChange={(v) => onProps({ showProgramInterest: v === true })}
                  />
                  Show optional program interest input
                </label>
              </FieldContent>
            </Field>
          </>
        )}

        <Button variant="destructive" size="sm" className="mt-2 w-full" onClick={onDelete}>
          Delete element
        </Button>
      </div>
    </ScrollArea>
  )
}

function AddPageForm({
  websiteId,
  onCreated,
}: {
  websiteId: string
  onCreated: (pageId: string) => void
}) {
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [pending, setPending] = useState(false)
  return (
    <>
      <div className="space-y-2 py-2">
        <Label>URL slug</Label>
        <Input placeholder="e.g. summer-camp" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <DialogFooter>
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true)
            const r = await addProviderWebsitePage({ websiteId, path_slug: slug, title: title || slug })
            setPending(false)
            if ("error" in r) toast.error(r.error)
            else {
              onCreated(r.pageId)
              toast.success("Page added")
            }
          }}
        >
          Create
        </Button>
      </DialogFooter>
    </>
  )
}
