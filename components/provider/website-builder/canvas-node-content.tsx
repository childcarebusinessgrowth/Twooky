"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Menu } from "lucide-react"
import { flexJustifyContent, gridJustifyContent, imageObjectPosition } from "@/lib/website-builder/alignment"
import { canvasTextBlockStyle } from "@/lib/website-builder/canvas-text-styles"
import { resolveMicrositeHref } from "@/lib/website-builder/microsite-links"
import { innerBoxStyle, resolveGapPx } from "@/lib/website-builder/node-chrome-styles"
import { resolveVideoEmbedUrl } from "@/lib/website-builder/video-embed"
import type { CanvasNode, NavItem, ThemeTokens } from "@/lib/website-builder/types"
import { cn } from "@/lib/utils"
import MicrositeContactFormLazy from "@/components/provider/website-builder/microsite-contact-form-lazy"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type CanvasNodeContentVariant = "editor" | "published"

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
}

function formatSubdomainBrand(slug: string | undefined): string {
  if (!slug?.trim()) return ""
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function resolveNavbarBrandLabel(
  p: CanvasNode["props"],
  subdomainSlug: string | undefined,
): string {
  const raw = typeof p.brandLabel === "string" ? decodeHtmlEntities(p.brandLabel).trim() : ""
  if (raw.length > 0) return raw
  const fromSub = formatSubdomainBrand(subdomainSlug)
  if (fromSub) return fromSub
  return "Menu"
}

const TWOOKY_SITE_URL = "http://twooky.com/"
const MICROSITE_PANEL_SHADOW = "0 18px 45px rgba(15, 23, 42, 0.08)"
const MICROSITE_PANEL_BORDER = "1px solid rgba(148, 163, 184, 0.18)"

/** Credit line: every "Twooky" links to Twooky in a new tab (editor + published microsites). */
function footerTextWithTwookyLink(text: string): ReactNode {
  if (!text.includes("Twooky")) return text
  const parts = text.split(/(Twooky)/g)
  return parts.map((part, i) =>
    part === "Twooky" ? (
      <a
        key={i}
        href={TWOOKY_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-inherit underline underline-offset-2 hover:opacity-90"
      >
        Twooky
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function CanvasNodeContent({
  node: n,
  siteBase,
  theme,
  subdomainSlug,
  variant,
  onVideoPointerDown,
  isMobileBreakpoint = false,
  /** Tablet + mobile: sheet nav; desktop: horizontal links. Only affects navbar rendering. */
  navbarCompact = false,
}: {
  node: CanvasNode
  siteBase: string
  theme: ThemeTokens
  subdomainSlug?: string
  variant: CanvasNodeContentVariant
  /** Editor only: stop drag from starting when interacting with the video iframe */
  onVideoPointerDown?: (e: React.PointerEvent) => void
  /** Narrow canvas / phone preview: fluid images, wrapping footer */
  isMobileBreakpoint?: boolean
  navbarCompact?: boolean
}) {
  const p = n.props

  switch (n.type) {
    case "text": {
      const rawFontSize =
        typeof p.fontSize === "number" && Number.isFinite(p.fontSize) ? p.fontSize : 16
      const mobileFontSize =
        isMobileBreakpoint && variant === "published"
          ? rawFontSize >= 36
            ? Math.max(20, Math.round(rawFontSize * 0.82))
            : rawFontSize >= 28
              ? Math.max(18, Math.round(rawFontSize * 0.88))
              : rawFontSize
          : rawFontSize
      return (
        <div
          className="h-full w-full overflow-hidden"
          style={{
            ...canvasTextBlockStyle(p),
            fontSize: `${mobileFontSize}px`,
            lineHeight: isMobileBreakpoint && variant === "published" ? 1.4 : undefined,
          }}
        >
          {p.text ?? ""}
        </div>
      )
    }

    case "button": {
      const href =
        p.href?.startsWith("http") || p.href?.startsWith("mailto:")
          ? p.href
          : resolveMicrositeHref(p.href ?? "", siteBase)
      const btnStyle = {
        backgroundColor: p.backgroundColor ?? "#203e68",
        color: p.color ?? "#fff",
        borderRadius: p.borderRadius ?? 8,
        fontSize: p.fontSize ? `${p.fontSize}px` : 15,
        textAlign: "center" as const,
      }
      const shellStyle = {
        ...innerBoxStyle(p),
        display: "flex",
        alignItems: "center",
        justifyContent: flexJustifyContent(p.textAlign, "center"),
      }
      if (variant === "published") {
        return (
          <div style={shellStyle}>
            <Link
              href={href}
              className="inline-flex min-h-11 items-center justify-center px-5 py-2.5 font-semibold tracking-[0.01em] transition duration-200 hover:-translate-y-0.5 hover:opacity-95"
              style={{
                ...btnStyle,
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
              }}
            >
              {p.label ?? "Button"}
            </Link>
          </div>
        )
      }
      return (
        <div className="h-full w-full" style={shellStyle}>
          <span className="inline-flex items-center justify-center px-4 py-2 font-medium" style={btnStyle}>
            {p.label ?? "Button"}
          </span>
        </div>
      )
    }

    case "image":
      if (!p.src) {
        return (
          <div
            className="bg-muted text-muted-foreground flex h-full w-full items-center text-xs"
            style={{ justifyContent: flexJustifyContent(p.textAlign, "center") }}
          >
            Image
          </div>
        )
      }
      return (
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={p.src}
            alt={p.alt ?? ""}
            fill
            draggable={false}
            className={cn(
              variant === "editor" ? "pointer-events-none object-cover" : "object-cover",
            )}
            loading={variant === "published" ? "lazy" : undefined}
            sizes={
              variant === "published"
                ? isMobileBreakpoint
                  ? "100vw"
                  : "(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 900px"
                : undefined
            }
            style={{ objectPosition: imageObjectPosition(p.textAlign, "center") }}
          />
        </div>
      )

    case "video": {
      const embed = resolveVideoEmbedUrl(p.embedUrl ?? "")
      if (!embed) {
        return (
          <div
            className="bg-muted text-muted-foreground flex h-full w-full items-center text-xs"
            style={{ justifyContent: flexJustifyContent(p.textAlign, "center") }}
          >
            {p.embedUrl?.trim() ? "Invalid or unsupported URL" : "Set embed URL"}
          </div>
        )
      }
      if (variant === "published") {
        return (
          <iframe
            title="Video"
            src={embed}
            className="h-full w-full max-w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      }
      return (
        <div
          className="relative h-full w-full overflow-hidden bg-black"
          onPointerDown={onVideoPointerDown}
        >
          <iframe
            title="Video preview"
            src={embed}
            className="pointer-events-auto absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )
    }

    case "navbar": {
      const items = (p.navItems as NavItem[] | undefined) ?? []
      const primary = theme.primaryColor ?? "#203e68"
      const gapPx = resolveGapPx(p, 12)
      const logoSrc = typeof p.logoSrc === "string" ? p.logoSrc.trim() : ""
      const hasLogo = logoSrc.length > 0
      const logoAlt = typeof p.logoAlt === "string" && p.logoAlt.trim().length > 0 ? p.logoAlt.trim() : "Site logo"
      const rawLogoHeight = typeof p.logoHeight === "number" && Number.isFinite(p.logoHeight) ? p.logoHeight : 40
      const desktopLogoHeight = Math.round(Math.min(96, Math.max(20, rawLogoHeight)))
      const mobileLogoHeight = Math.round(Math.min(56, Math.max(18, rawLogoHeight)))
      const btnStyle = {
        backgroundColor: primary,
        color: "#fff",
        borderRadius: 999,
        padding: "0.6rem 1rem",
        textDecoration: "none" as const,
        display: "inline-flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        fontWeight: 700,
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
      }
      const navShellStyle = {
        ...innerBoxStyle(p, { navbarHorizontalDefaultPx: 16, navbarVerticalDefaultPx: 0 }),
        backgroundColor: p.backgroundColor ?? "#fff",
        color: p.color ?? "#0f172a",
        fontSize: p.fontSize ? `${p.fontSize}px` : 15,
        fontFamily: p.fontFamily,
        border: MICROSITE_PANEL_BORDER,
        boxShadow: MICROSITE_PANEL_SHADOW,
        backdropFilter: "blur(12px)",
      } as const
      const sheetLinkClass =
        "flex min-h-11 w-full items-center rounded-md px-3 py-2 text-base font-medium no-underline"
      const brandText = resolveNavbarBrandLabel(p, subdomainSlug)
      const compactNavBarStyle = {
        ...navShellStyle,
        boxShadow: `${MICROSITE_PANEL_SHADOW}, inset 0 -1px 0 0 rgba(15, 23, 42, 0.06)`,
      } as const
      const safeNavClass =
        "pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]"

      if (navbarCompact && variant === "published") {
        return (
          <Sheet>
            <nav
              className={cn(
                "flex h-full min-h-[44px] w-full items-center justify-between gap-2 text-sm",
                safeNavClass,
              )}
              style={compactNavBarStyle}
            >
              {hasLogo ? (
                <Link href={siteBase} className="inline-flex min-w-0 items-center rounded-sm">
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={168}
                    height={56}
                    className="w-auto max-w-48 object-contain"
                    style={{ height: `${mobileLogoHeight}px` }}
                  />
                </Link>
              ) : (
                <span
                  className="min-w-0 truncate text-sm font-semibold leading-tight"
                  style={{ color: p.color ?? "#0f172a" }}
                >
                  {brandText}
                </span>
              )}
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-current/25 bg-current/[0.07] shadow-sm"
                  style={{ color: p.color ?? "#0f172a" }}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
            </nav>
            <SheetContent
              forceMount
              side="right"
              className="flex w-[min(100%,22rem)] flex-col gap-3 border-l-primary/20 sm:max-w-sm data-[state=closed]:duration-150 data-[state=open]:duration-180"
              style={{ backgroundColor: p.backgroundColor ?? "#ffffff" }}
            >
              <SheetHeader>
                <SheetTitle className="text-lg" style={{ color: p.color ?? "#0f172a" }}>
                  Menu
                </SheetTitle>
                <p className="text-sm font-medium" style={{ color: p.color ?? "#0f172a" }}>
                  {brandText}
                </p>
              </SheetHeader>
              <div className="min-h-0 flex flex-1 flex-col gap-1 overflow-y-auto pr-2">
                {items.map((it, i) => {
                  const pathTrim = it.path.trim()
                  const lower = pathTrim.toLowerCase()
                  const isExt =
                    lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")
                  const href = isExt ? pathTrim : resolveMicrositeHref(it.path, siteBase)
                  const isBtn = (it.variant ?? "link") === "button"
                  const isHttp = lower.startsWith("http://") || lower.startsWith("https://")
                  const newTab = Boolean(isExt && isHttp && it.openInNewTab)
                  const style = isBtn ? btnStyle : ({ textDecoration: "none", color: p.color ?? "#0f172a" } as const)
                  const displayLabel = decodeHtmlEntities(it.label)

                  if (isExt) {
                    return (
                      <SheetClose asChild key={`${i}-${it.id ?? it.label}-${href}`}>
                        <a
                          href={href}
                          className={cn(sheetLinkClass, "whitespace-normal wrap-break-word", !isBtn && "hover:bg-black/6")}
                          style={style}
                          {...(newTab ? { target: "_blank" as const, rel: "noopener noreferrer" } : {})}
                        >
                          {displayLabel}
                        </a>
                      </SheetClose>
                    )
                  }
                  return (
                    <SheetClose asChild key={`${i}-${it.id ?? it.label}-${href}`}>
                      <Link
                        href={href}
                        className={cn(sheetLinkClass, "whitespace-normal wrap-break-word", !isBtn && "hover:bg-black/6")}
                        style={style}
                      >
                        {displayLabel}
                      </Link>
                    </SheetClose>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        )
      }

      if (navbarCompact && variant === "editor") {
        return (
          <Sheet>
            <div
              className={cn(
                "flex h-full min-h-[44px] w-full items-center justify-between gap-2 text-sm",
                safeNavClass,
              )}
              style={compactNavBarStyle}
            >
              {hasLogo ? (
                <span className="inline-flex min-w-0 items-center rounded-sm">
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={168}
                    height={56}
                    className="w-auto max-w-48 object-contain"
                    style={{ height: `${mobileLogoHeight}px` }}
                  />
                </span>
              ) : (
                <span
                  className="min-w-0 truncate text-sm font-semibold leading-tight"
                  style={{ color: p.color ?? "#0f172a" }}
                >
                  {brandText}
                </span>
              )}
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-current/25 bg-current/[0.07] shadow-sm"
                  style={{ color: p.color ?? "#0f172a" }}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
            </div>
            <SheetContent
              forceMount
              side="right"
              className="w-[min(100%,22rem)] border-l-primary/20 sm:max-w-sm data-[state=closed]:duration-150 data-[state=open]:duration-180"
              style={{ backgroundColor: p.backgroundColor ?? "#ffffff" }}
            >
              <SheetHeader>
                <SheetTitle className="text-lg" style={{ color: p.color ?? "#0f172a" }}>
                  Menu
                </SheetTitle>
                <p className="text-sm font-medium" style={{ color: p.color ?? "#0f172a" }}>
                  {brandText}
                </p>
              </SheetHeader>
              <div className="min-h-0 flex max-h-[72vh] flex-col gap-1 overflow-y-auto pr-2">
                {items.map((it, i) => {
                  const isBtn = (it.variant ?? "link") === "button"
                  const displayLabel = decodeHtmlEntities(it.label)
                  return (
                    <span
                      key={it.id ?? `${i}-${it.path}-${it.label}`}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 py-2 text-base font-medium whitespace-normal wrap-break-word",
                        isBtn ? "justify-center" : "",
                      )}
                      style={isBtn ? btnStyle : undefined}
                    >
                      {displayLabel}
                    </span>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        )
      }

      if (variant === "published") {
        return (
          <nav
            className="flex h-full w-full min-w-0 items-center gap-4 overflow-x-auto text-sm"
            style={{
              ...navShellStyle,
            }}
          >
            {hasLogo && (
              <Link href={siteBase} className="inline-flex shrink-0 items-center rounded-sm">
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={200}
                  height={64}
                  className="w-auto max-w-56 object-contain"
                  style={{ height: `${desktopLogoHeight}px` }}
                />
              </Link>
            )}
            <div
              className="flex min-w-0 flex-1 flex-wrap items-center overflow-x-auto"
              style={{
                justifyContent: flexJustifyContent(p.textAlign, "center"),
                gap: gapPx,
              }}
            >
              {items.map((it, i) => {
                const pathTrim = it.path.trim()
                const lower = pathTrim.toLowerCase()
                const isExt =
                  lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")
                const href = isExt ? pathTrim : resolveMicrositeHref(it.path, siteBase)
                const isBtn = (it.variant ?? "link") === "button"
                const isHttp = lower.startsWith("http://") || lower.startsWith("https://")
                const newTab = Boolean(isExt && isHttp && it.openInNewTab)
                const className = !isBtn && !isExt ? "rounded-full px-1 py-1 hover:bg-black/4 hover:no-underline" : undefined
                const style = isBtn ? btnStyle : ({ textDecoration: "none", color: p.color ?? "#0f172a", fontWeight: 600 } as const)
                const displayLabel = decodeHtmlEntities(it.label)

                if (isExt) {
                  return (
                    <a
                      key={`${i}-${it.id ?? it.label}-${href}`}
                      href={href}
                      className={className}
                      style={style}
                      {...(newTab ? { target: "_blank" as const, rel: "noopener noreferrer" } : {})}
                    >
                      {displayLabel}
                    </a>
                  )
                }
                return (
                  <Link key={`${i}-${it.id ?? it.label}-${href}`} href={href} className={className} style={style}>
                    {displayLabel}
                  </Link>
                )
              })}
            </div>
          </nav>
        )
      }

      return (
        <div
          className="flex h-full w-full min-w-0 items-center gap-4 overflow-x-auto text-sm"
          style={{
            ...navShellStyle,
          }}
        >
          {hasLogo && (
            <span className="inline-flex shrink-0 items-center rounded-sm">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={200}
                height={64}
                className="w-auto max-w-56 object-contain"
                style={{ height: `${desktopLogoHeight}px` }}
              />
            </span>
          )}
          <div
            className="flex min-w-0 flex-1 flex-wrap items-center overflow-x-auto"
            style={{
              justifyContent: flexJustifyContent(p.textAlign, "center"),
              gap: gapPx,
            }}
          >
            {items.map((it, i) => {
              const isBtn = (it.variant ?? "link") === "button"
              const displayLabel = decodeHtmlEntities(it.label)
              return (
                <span
                  key={it.id ?? `${i}-${it.path}-${it.label}`}
                  className={isBtn ? "shrink-0 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap" : "shrink-0 whitespace-nowrap"}
                  style={isBtn ? { backgroundColor: primary, color: "#fff" } : undefined}
                >
                  {displayLabel}
                </span>
              )
            })}
          </div>
        </div>
      )
    }

    case "footer":
      return (
        <footer
          className={cn(
            "flex h-full min-h-0 w-full px-1",
            isMobileBreakpoint ? "items-start py-2" : "items-center",
          )}
          style={{
            ...innerBoxStyle(p, { allSidesFallback: 8 }),
            backgroundColor: p.backgroundColor ?? "#0f172a",
            color: p.color ?? "#e2e8f0",
            fontFamily: p.fontFamily,
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize:
              isMobileBreakpoint && variant === "published"
                ? `${Math.max(12, Math.min(15, p.fontSize ?? 14))}px`
                : p.fontSize
                  ? `${p.fontSize}px`
                  : 14,
            justifyContent: flexJustifyContent(p.textAlign, "center"),
            textAlign: (p.textAlign ?? "center") as "left" | "center" | "right",
            overflow: isMobileBreakpoint ? "visible" : "hidden",
            boxShadow: variant === "published" ? "0 24px 48px rgba(15, 23, 42, 0.18)" : undefined,
          }}
        >
          <span className="w-full wrap-break-word text-balance leading-relaxed">
            {footerTextWithTwookyLink(p.text ?? "")}
          </span>
        </footer>
      )

    case "section":
      return (
        <div
          className="h-full w-full"
          style={{
            ...innerBoxStyle(p),
            backgroundColor: p.backgroundColor ?? "transparent",
            overflow: "hidden",
            border:
              variant === "published" && p.backgroundColor && p.backgroundColor !== "transparent"
                ? MICROSITE_PANEL_BORDER
                : undefined,
            boxShadow:
              variant === "published" && p.backgroundColor && p.backgroundColor !== "transparent"
                ? MICROSITE_PANEL_SHADOW
                : undefined,
          }}
        />
      )

    case "gallery": {
      const gapPx = resolveGapPx(p, 8)
      const items = (p.items ?? []).filter((it) => it.src)
      const gridStyle = {
        ...innerBoxStyle(p),
        display: "grid" as const,
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        justifyContent: gridJustifyContent(p.textAlign, "center"),
        gap: gapPx,
        alignContent: "start" as const,
        overflow: "auto" as const,
      }
      return (
        <div className="grid h-full w-full" style={gridStyle}>
          {items.map((it, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-muted"
              style={variant === "published" ? { boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)" } : undefined}
            >
              {it.src ? (
                <Image
                  src={it.src}
                  alt={it.alt ?? ""}
                  fill
                  draggable={false}
                  className={variant === "editor" ? "pointer-events-none object-cover" : "object-cover"}
                  loading={variant === "published" ? "lazy" : undefined}
                  sizes={variant === "published" ? "(max-width: 768px) 50vw, 220px" : undefined}
                />
              ) : null}
            </div>
          ))}
        </div>
      )
    }

    case "contactForm":
      if (variant === "published" && subdomainSlug) {
        return (
          <div
            className="rounded-[1.75rem] bg-card/95 shadow-sm"
            style={{
              ...innerBoxStyle(p, { allSidesFallback: 12 }),
              height: "auto",
              minHeight: 0,
              overflow: "visible",
              border: MICROSITE_PANEL_BORDER,
              boxShadow: MICROSITE_PANEL_SHADOW,
              backgroundColor: p.backgroundColor ?? "#ffffff",
            }}
          >
            <MicrositeContactFormLazy
              websiteSubdomain={subdomainSlug}
              primaryColor={theme.primaryColor ?? "#203e68"}
              fontFamily={theme.fontFamily}
              introHint={p.introHint}
              showProgramInterest={p.showProgramInterest !== false}
            />
          </div>
        )
      }
      return (
        <div
          className="bg-muted/40 text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg p-2 text-center text-[10px]"
          style={innerBoxStyle(p, { allSidesFallback: 12 })}
        >
          <Mail className="h-5 w-5 shrink-0 opacity-70" />
          <span className="font-medium">Contact form</span>
          <span className="leading-tight">Saves leads when published</span>
        </div>
      )

    default:
      return null
  }
}
