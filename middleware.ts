// middleware.ts  — place this in your project ROOT (same level as app/)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;

    // /v2 is her portal — only 'lady-02' may enter
    if (pathname.startsWith('/v2') && token?.id !== 'lady-02') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // /boyfriend is his portal — only 'architect-01' may enter
    if (pathname.startsWith('/boyfriend') && token?.id !== 'architect-01') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Run middleware only when a JWT exists — unauthenticated users
      // are redirected to /login automatically by NextAuth
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect these route prefixes — login page is intentionally excluded
  matcher: ['/v2/:path*', '/boyfriend/:path*'],
};