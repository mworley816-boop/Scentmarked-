import { NextResponse, type NextRequest } from 'next/server'

// Keep public catalog/static requests out of Supabase auth middleware on Cloudflare.
// Protected account pages can perform their own server-side auth checks.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/collection/:path*', '/admin/:path*'],
}
