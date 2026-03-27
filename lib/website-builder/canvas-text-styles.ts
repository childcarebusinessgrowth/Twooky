import type { CSSProperties } from "react"
import type { CanvasNodeProps } from "./types"

/** Shared line height for text blocks in the editor and on published microsites. */
export const CANVAS_TEXT_LINE_HEIGHT = 1.35

export function canvasTextFontSizePx(p: Pick<CanvasNodeProps, "fontSize">): string {
  return `${p.fontSize ?? 16}px`
}

export function canvasTextBlockStyle(
  p: Pick<CanvasNodeProps, "fontSize" | "color" | "fontWeight" | "fontFamily" | "textAlign">,
): CSSProperties {
  const fontSize = canvasTextFontSizePx(p)
  return {
    fontSize,
    lineHeight: CANVAS_TEXT_LINE_HEIGHT,
    color: p.color ?? "inherit",
    fontWeight: p.fontWeight as number | undefined,
    fontFamily: p.fontFamily,
    textAlign: (p.textAlign ?? "left") as "left" | "center" | "right",
    whiteSpace: "pre-wrap",
  }
}
