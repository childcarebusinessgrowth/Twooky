"use client"

import dynamic from "next/dynamic"
import type { SearchBarProps } from "@/components/search-bar"
import { SearchBarFallback } from "@/components/search-bar"

const SearchBarLazy = dynamic(
  () => import("@/components/search-bar").then((m) => m.SearchBar),
  { loading: () => <SearchBarFallback /> },
)

export function SearchBarDynamic(props: SearchBarProps) {
  return <SearchBarLazy {...props} />
}
