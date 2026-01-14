import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || ''
  const pathname = req.nextUrl.pathname

  // Handle MCP subdomain: mcp.explorableresearch.com/http → /api/mcp/http
  if (host.startsWith('mcp.')) {
    const url = req.nextUrl.clone()
    url.pathname = `/api/mcp${pathname}`
    return NextResponse.rewrite(url)
  }

  // Handle short links: /s/:id
  if (pathname.startsWith('/s/')) {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const id = pathname.split('/').pop()
      const url = await kv.get(`fragment:${id}`)

      if (url) {
        return NextResponse.redirect(url as string)
      } else {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/s/:path*',
    // Match MCP endpoints on subdomain (these paths exist on mcp.* subdomain)
    '/http',
    '/sse',
    '/message',
  ],
}
