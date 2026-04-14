import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getDefaultRouteForRole, getRequiredRoleForPath, resolveRoleForUser } from "@/lib/authz"
import { isTreatedAsSignedOutAuthError } from "@/lib/supabaseAuthErrors"
import type { Database } from "@/lib/supabaseDatabase"

export function shouldBlockWhenSupabaseEnvMissing(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup") return true
  if (pathname.startsWith("/admin")) return true
  if (pathname.startsWith("/dashboard")) return true
  return false
}

function shouldRunAuth(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup") return true
  if (pathname.startsWith("/admin")) return true
  if (pathname.startsWith("/dashboard")) return true
  return false
}

/**
 * Rewrites provider microsites from `subdomain.ROOT_DOMAIN` to internal `/site/subdomain/...`
 * Set NEXT_PUBLIC_SITE_ROOT_DOMAIN to your apex host (e.g. earlylearningdirectory.com) in production.
 */
function rewriteSubdomainIfNeeded(request: NextRequest): NextResponse | null {
  const root = process.env.NEXT_PUBLIC_SITE_ROOT_DOMAIN?.trim().toLowerCase()
  if (!root) {
    return null
  }

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase()
  if (!host || host === root || host === `www.${root}`) {
    return null
  }

  if (!host.endsWith(`.${root}`)) {
    return null
  }

  const sub = host.slice(0, -(root.length + 1))
  if (!sub || sub.includes(".")) {
    return null
  }

  const url = request.nextUrl.clone()
  const rest = url.pathname === "/" ? "" : url.pathname
  url.pathname = `/site/${encodeURIComponent(sub)}${rest}`
  const nextHeaders = new Headers(request.headers)
  nextHeaders.set("x-microsite-request", "1")
  return NextResponse.rewrite(url, {
    request: {
      headers: nextHeaders,
    },
  })
}

function buildLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function withCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
  return target
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/site/")) {
    const nextHeaders = new Headers(request.headers)
    nextHeaders.set("x-microsite-request", "1")
    return NextResponse.next({
      request: {
        headers: nextHeaders,
      },
    })
  }

  const subdomainRewrite = rewriteSubdomainIfNeeded(request)
  if (subdomainRewrite) {
    return subdomainRewrite
  }

  if (!shouldRunAuth(pathname)) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !publishableKey) {
    if (shouldBlockWhenSupabaseEnvMissing(pathname)) {
      return new NextResponse("Service misconfigured: missing Supabase environment variables.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()

  const staleSession = Boolean(getUserError && isTreatedAsSignedOutAuthError(getUserError))
  if (staleSession) {
    await supabase.auth.signOut({ scope: "local" }).catch(() => {
      /* ignore — session cookies may already be invalid */
    })
  }

  const effectiveUser = staleSession ? null : user

  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const requiredRole = getRequiredRoleForPath(pathname)

  if (!effectiveUser) {
    if (requiredRole) {
      return withCookies(response, buildLoginRedirect(request))
    }
    return response
  }

  const roleResolution = await resolveRoleForUser(supabase, effectiveUser)
  const role = roleResolution.role

  if (!role) {
    if (roleResolution.reason === "profile_role_missing_or_invalid") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {
        /* ignore - cookies may already be invalid */
      })

      if (requiredRole) {
        return withCookies(response, buildLoginRedirect(request))
      }

      return response
    }

    // If the user is authenticated but role resolution fails in proxy (e.g. restrictive RLS),
    // do not redirect back to login and create a dead-end loop.
    return response
  }

  if (isAuthPage) {
    return withCookies(response, NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url)))
  }

  if (requiredRole && role !== requiredRole) {
    return withCookies(response, NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url)))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
