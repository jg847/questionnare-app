import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isAdminSecretMisconfigured,
} from '@/lib/auth/admin-session';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';

type AdminLoginRequest = {
  password?: string;
};

export async function POST(request: Request) {
  let payload: AdminLoginRequest;

  try {
    payload = (await request.json()) as AdminLoginRequest;
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (!payload.password?.trim()) {
    return NextResponse.json(
      { authenticated: false, error: 'Password is required.' },
      { status: 400 },
    );
  }

  if (isAdminSecretMisconfigured()) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'ADMIN_SECRET is not configured.',
      },
      { status: 503 },
    );
  }

  if (payload.password !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { authenticated: false, error: 'Invalid credentials.' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: await createAdminSessionToken(),
    ...getAdminSessionCookieOptions(),
  });

  void Promise.resolve(
    insertAnalyticsEvent('admin_login_succeeded', 'admin', {
      login_route: '/login',
    }),
  ).catch(() => undefined);

  return response;
}