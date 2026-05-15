import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
} from '@/lib/auth/admin-session';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login?logged_out=1', request.url));
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });

  return response;
}