import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Refresh Supabase auth cookies for member/admin flows and personalized public routes.
// Individual pages remain responsible for authorization and redirects where required.
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/collection/:path*', '/account/:path*', '/admin/:path*', '/matches/:path*', '/onboarding/:path*', '/compare/:path*', '/perfume/:path*'],
}
