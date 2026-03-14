import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getDefaultRouteForRole, getProfileRoleForUser, getRequiredRoleForPath } from "@/lib/authz"
import type { Database } from "@/lib/supabaseDatabase"

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !publishableKey) {
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
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const requiredRole = getRequiredRoleForPath(pathname)

  if (!user) {
    if (requiredRole) {
      return withCookies(response, buildLoginRedirect(request))
    }
    return response
  }

  const role = await getProfileRoleForUser(supabase, user)
  if (!role) {
    // If the user is authenticated but role resolution fails in middleware (e.g. restrictive RLS),
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
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/signup"],
}
