import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that are accessible without authentication
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If the user is logged in and trying to access an auth page, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is not logged in and trying to access a protected page, redirect to login
  if (!token && !isAuthPage) {
    // Note: In an actual implementation, you might want to exclude public assets/api
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
