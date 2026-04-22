import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';
  // The refreshToken is HttpOnly — the browser can't read it via JS, but the
  // middleware runs on the server and CAN read it. Its presence means the user
  // has an active session that the client-side AuthProvider can silently rehydrate.
  const hasRefreshToken = !!request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  // Paths that are accessible without authentication
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If the user is fully logged in and trying to access an auth page, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Only redirect to login if BOTH cookies are absent.
  // If refreshToken exists but isAuthenticated is false (e.g., manually cleared,
  // or access token expired), let the request through — AuthProvider will call
  // /auth/refresh-token and silently restore the session.
  if (!isAuthenticated && !hasRefreshToken && !isAuthPage) {
    if (pathname !== '/login' && pathname !== '/register' && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
