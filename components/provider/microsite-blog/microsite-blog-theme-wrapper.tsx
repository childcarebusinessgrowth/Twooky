import type { ReactNode } from "react"
import type { ThemeTokens } from "@/lib/website-builder/types"
import { themeTokensToCssVars } from "@/lib/website-builder/microsite-theme-style"
import { cn } from "@/lib/utils"

type Props = {
  tokens: ThemeTokens
  children: ReactNode
  className?: string
}

export function MicrositeBlogThemeWrapper({ tokens, children, className }: Props) {
  const style = themeTokensToCssVars(tokens)
  const hasPageBg = Boolean(tokens.backgroundColor?.trim())
  const hasBodyFont = Boolean(tokens.fontFamily?.trim())

  return (
    <div
      className={cn(
        "min-h-screen",
        hasPageBg ? "bg-[var(--microsite-page-bg)]" : "bg-background",
        hasBodyFont && "font-[family-name:var(--microsite-font)]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}
