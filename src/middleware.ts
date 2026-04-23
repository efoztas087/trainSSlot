import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const trainerRoutes = ['/dashboard', '/clients', '/packages', '/payments', '/settings']
  const clientRoutes = ['/client/dashboard', '/client/progress', '/client/packages', '/client/payments', '/client/profile']
  const authRoutes = ['/login', '/register', '/client/login']

  const isTrainerRoute = trainerRoutes.some(r => pathname.startsWith(r))
  const isClientRoute = clientRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  if (!user) {
    if (isTrainerRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (isClientRoute) {
      return NextResponse.redirect(new URL('/client/login', request.url))
    }
    return supabaseResponse
  }

  const role = user.user_metadata?.role as string | undefined

  if (isAuthRoute) {
    if (role === 'trainer') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (role === 'client') {
      return NextResponse.redirect(new URL('/client/dashboard', request.url))
    }
  }

  if (isTrainerRoute && role !== 'trainer') {
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  if (isClientRoute && role !== 'client') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
