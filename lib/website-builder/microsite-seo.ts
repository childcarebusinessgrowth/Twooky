import "server-only"

import { headers } from "next/headers"
import type { CanvasNode, PublishedPageSnapshot, PublishedSiteSnapshot } from "@/lib/website-builder/types"
import { toAbsoluteUrl } from "@/lib/sitemap"

function normalizePath(pathname: string): string {
  if (!pathname) return ""
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

function normalizeHost(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/:\d+$/, "")
}

function inferProtocol(host: string, forwardedProto: string | null): string {
  const explicit = forwardedProto?.split(",")[0]?.trim().toLowerCase()
  if (explicit === "http" || explicit === "https") return explicit
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"
}

async function getMicrositeRequestOrigin(subdomain: string): Promise<string | null> {
  try {
    const requestHeaders = await headers()
    const host = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))
    if (!host) return null
    if (!host.startsWith(`${subdomain}.`)) return null
    const protocol = inferProtocol(host, requestHeaders.get("x-forwarded-proto"))
    return `${protocol}://${host}`
  } catch {
    return null
  }
}

export async function buildMicrositeUrl(subdomain: string, pathname = ""): Promise<string> {
  const cleanSubdomain = subdomain.trim().toLowerCase()
  const cleanPath = normalizePath(pathname)
  const requestOrigin = await getMicrositeRequestOrigin(cleanSubdomain)
  if (requestOrigin) {
    return `${requestOrigin}${cleanPath}`
  }
  const rootDomain = process.env.NEXT_PUBLIC_SITE_ROOT_DOMAIN?.trim().toLowerCase()

  if (rootDomain) {
    return `https://${cleanSubdomain}.${rootDomain}${cleanPath}`
  }

  return toAbsoluteUrl(`/site/${encodeURIComponent(cleanSubdomain)}${cleanPath}`)
}

export function pagePathnameFromSlug(pathSlug: string): string {
  return pathSlug ? `/${pathSlug}` : ""
}

export function formatMicrositeNameFromSubdomain(subdomain: string): string {
  return subdomain
    .trim()
    .toLowerCase()
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function deriveMicrositeSiteName(snapshot: PublishedSiteSnapshot, page?: PublishedPageSnapshot): string {
  const navbar = page?.nodes.find((node) => node.type === "navbar") ?? snapshot.pages[0]?.nodes.find((node) => node.type === "navbar")
  const brandLabel =
    typeof navbar?.props.brandLabel === "string" && navbar.props.brandLabel.trim().length > 0
      ? navbar.props.brandLabel.trim()
      : null

  if (brandLabel) return brandLabel
  const homePage = snapshot.pages.find((entry) => entry.is_home || entry.path_slug === "")
  if (homePage?.title?.trim()) return homePage.title.trim()
  return formatMicrositeNameFromSubdomain(snapshot.subdomain_slug)
}

export function findMicrositeImage(nodes: CanvasNode[]): string | null {
  for (const node of nodes) {
    if (node.type === "image" && typeof node.props.src === "string" && node.props.src.trim()) {
      return node.props.src.trim()
    }
    if (node.type === "gallery" && Array.isArray(node.props.items)) {
      const first = node.props.items.find((item) => typeof item?.src === "string" && item.src.trim())
      if (first?.src) return first.src.trim()
    }
  }
  return null
}
