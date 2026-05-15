import { NextResponse, type NextRequest } from 'next/server';

import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isAdminSecretMisconfigured,
  validateAdminSessionToken,
} from '@/lib/auth/admin-session';

const PUBLIC_ADMIN_API_PATHS = new Set(['/api/admin/login', '/api/admin/logout']);

function isProtectedAdminPage(pathname: string) {
  return pathname.startsWith('/admin');
}

function isProtectedAdminApi(pathname: string) {
  return pathname.startsWith('/api/admin') && !PUBLIC_ADMIN_API_PATHS.has(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedAdminPage(pathname) && !isProtectedAdminApi(pathname)) {
    return NextResponse.next();
  }

  if (isAdminSecretMisconfigured()) {
    if (isProtectedAdminApi(pathname)) {
      return NextResponse.json(
        { error: 'ADMIN_SECRET is not configured.' },
        { status: 503 },
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'config');
    return NextResponse.redirect(loginUrl);
  }

  const session = await validateAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  );

  if (!session.authenticated) {
    if (isProtectedAdminApi(pathname)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('unauthorized', '1');
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: await createAdminSessionToken(),
    ...getAdminSessionCookieOptions(),
  });

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};