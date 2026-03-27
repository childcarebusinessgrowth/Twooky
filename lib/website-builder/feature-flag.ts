/**
 * Roll out the provider website builder gradually.
 * When unset or "true", the builder is available to signed-in providers.
 */
export function isProviderWebsiteBuilderEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_PROVIDER_WEBSITE_BUILDER_ENABLED
  if (v === undefined || v === "") return true
  return v === "true" || v === "1"
}
