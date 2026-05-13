// Edge-compatible proxy (middleware).
// Must NOT import lib/auth.ts, lib/db.ts, bcryptjs, or pg —
// those are Node.js-only and crash Vercel's Edge Runtime.
// Uses getToken from next-auth/jwt which only reads the JWT cookie.
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage  = req.nextUrl.pathname === '/admin/login'

  if (!isAdminRoute || isLoginPage) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = { matcher: ['/admin/:path*'] }
