import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login"]

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  const pathname = request.nextUrl.pathname

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isDashboard = pathname.startsWith("/dashboard")

  if (isDashboard && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
