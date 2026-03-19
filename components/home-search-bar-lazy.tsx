"use client"

import dynamic from "next/dynamic"
import type { SearchBarProps } from "@/components/search-bar"
import { SearchBarFallback } from "@/components/search-bar"

const SearchBar = dynamic(
  () => import("@/components/search-bar").then((m) => m.SearchBar),
  {
    loading: () => <SearchBarFallback className="max-w-5xl" />,
    ssr: false,
  }
)

export function HomeSearchBarLazy(props: SearchBarProps) {
  return <SearchBar {...props} />
}
