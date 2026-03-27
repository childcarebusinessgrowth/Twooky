export const TEMPLATE_KEYS = ["montessori", "premium", "community", "sports"] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]
