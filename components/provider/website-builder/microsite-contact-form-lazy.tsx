"use client"

import dynamic from "next/dynamic"

/** Client-only wrapper so `ssr: false` is valid; keeps the public site page a Server Component. */
const MicrositeContactFormLazy = dynamic(() => import("./microsite-contact-form"), {
  ssr: false,
  loading: () => <div className="text-muted-foreground p-3 text-xs">Loading form…</div>,
})

export default MicrositeContactFormLazy
