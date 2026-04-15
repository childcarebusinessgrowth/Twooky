import type { CSSProperties } from "react"
import type { ThemeTokens } from "@/lib/website-builder/types"

/**
 * Maps builder theme tokens to CSS variables for public mini-site blog pages.
 * `--microsite-primary` falls back to `var(--primary)` when not set in the builder.
 */
export function themeTokensToCssVars(tokens: ThemeTokens | null | undefined): CSSProperties {
  const t = tokens ?? {}
  const normalizeFontFamily = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ""
    return /var\(--|,|"|'/.test(trimmed) ? trimmed : `"${trimmed}", ui-sans-serif, system-ui, sans-serif`
  }
  const style: Record<string, string> = {
    "--microsite-primary": t.primaryColor?.trim() || "var(--primary)",
  }

  if (t.secondaryColor?.trim()) {
    style["--microsite-secondary"] = t.secondaryColor.trim()
  }
  if (t.backgroundColor?.trim()) {
    style["--microsite-page-bg"] = t.backgroundColor.trim()
  }
  if (t.fontFamily?.trim()) {
    style["--microsite-font"] = normalizeFontFamily(t.fontFamily)
  }
  if (t.headingFontFamily?.trim()) {
    style["--microsite-heading-font"] = normalizeFontFamily(t.headingFontFamily)
  }

  return style as CSSProperties
}
