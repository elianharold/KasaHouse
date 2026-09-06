import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE } from '@/lib/session-constants';

const PROTECTED = ['/dashboard', '/profile'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const hasSession = request.cookies.has(COOKIE.access);
  if (hasSession) return NextResponse.next();

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('next', pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
