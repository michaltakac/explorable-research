import { createServerClient } from '@supabase/ssr'
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  // Handle short URL redirects for /s/:id
  if (req.nextUrl.pathname.startsWith('/s/')) {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const id = req.nextUrl.pathname.split('/').pop()
      const url = await kv.get(`fragment:${id}`)

      if (url) {
        return NextResponse.redirect(url as string)
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Protected routes that require authentication
  const protectedPaths = ['/p/', '/projects']
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  )

  if (isProtectedPath) {
    // Check if user is authenticated
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    ) {
      // Create Supabase SSR client for middleware
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                req.cookies.set(name, value)
              })
              res = NextResponse.next({
                request: req,
              })
              cookiesToSet.forEach(({ name, value, options }) => {
                res.cookies.set(name, value, options)
              })
            },
          },
        },
      )

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        const redirectUrl = new URL('/', req.url)
        redirectUrl.searchParams.set('auth', 'required')
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/s/:path*', '/p/:path*', '/projects/:path*'],
}
