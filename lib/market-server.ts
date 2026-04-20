import "server-only"

import { cookies } from "next/headers"
import { parseMarketId, type MarketId } from "@/lib/market"

export async function getMarketFromCookies(): Promise<MarketId> {
  const jar = await cookies()
  return parseMarketId(jar.get("twooky_market")?.value) ?? "global"
}
