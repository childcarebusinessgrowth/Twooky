import type { CSSProperties } from "react"
import type { ThemeTokens } from "@/lib/website-builder/types"

/**
 * Maps builder theme tokens to CSS variables for public mini-site blog pages.
 * `--microsite-primary` falls back to `var(--primary)` when not set in the builder.
 */
export function themeTokensToCssVars(tokens: ThemeTokens | null | undefined): CSSProperties {
  const t = tokens ?? {}
  const style: Record<string, string> = {
    "--microsite-primary": t.primaryColor?.trim() || "var(--primary)",
  }

  if (t.secondaryColor?.trim()) {
    style["--microsite-secondary"] = t.secondaryColor.trim()
  }
  if (t.backgroundColor?.trim()) {
    style["--microsite-page-bg"] = t.backgroundColor.trim()
  }
  const safe = (s: string) => s.replace(/"/g, "")
  if (t.fontFamily?.trim()) {
    style["--microsite-font"] = `"${safe(t.fontFamily)}", ui-sans-serif, system-ui, sans-serif`
  }
  if (t.headingFontFamily?.trim()) {
    style["--microsite-heading-font"] = `"${safe(t.headingFontFamily)}", ui-sans-serif, system-ui, sans-serif`
  }

  return style as CSSProperties
}
