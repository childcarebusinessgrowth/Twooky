import type { CanvasNodeProps } from "./types"

export type HorizontalAlign = NonNullable<CanvasNodeProps["textAlign"]>

/** Flex `justify-content` for positioning content horizontally in a box */
export function flexJustifyContent(align: HorizontalAlign | undefined, whenUnset: HorizontalAlign): "flex-start" | "center" | "flex-end" {
  const a = align ?? whenUnset
  if (a === "left") return "flex-start"
  if (a === "right") return "flex-end"
  return "center"
}

/** `object-position` for images (cover) */
export function imageObjectPosition(align: HorizontalAlign | undefined, whenUnset: HorizontalAlign): string {
  const a = align ?? whenUnset
  if (a === "left") return "left center"
  if (a === "right") return "right center"
  return "center center"
}

/** CSS `justify-content` for grids when tracks don’t fill the row */
export function gridJustifyContent(align: HorizontalAlign | undefined, whenUnset: HorizontalAlign): "start" | "center" | "end" {
  const a = align ?? whenUnset
  if (a === "left") return "start"
  if (a === "right") return "end"
  return "center"
}
