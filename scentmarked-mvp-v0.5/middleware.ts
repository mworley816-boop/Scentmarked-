import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Refresh Supabase auth cookies before protected account/admin pages render.
// The pages themselves remain responsible for authorization and redirects.
export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/collection/:path*', '/account/:path*', '/admin/:path*', '/matches/:path*', '/onboarding/:path*'],
}
