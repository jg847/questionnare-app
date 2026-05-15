/** @jest-environment node */

jest.mock('@/lib/db/chat-repository', () => ({
  insertAnalyticsEvent: jest.fn(),
}));

import { webcrypto } from 'node:crypto';

import { POST as loginPost } from '@/app/api/admin/login/route';
import { POST as logoutPost } from '@/app/api/admin/logout/route';
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionToken,
} from '@/lib/auth/admin-session';
import { insertAnalyticsEvent } from '@/lib/db/chat-repository';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  configurable: true,
});

function setNodeEnv(value: 'development' | 'production' | 'test') {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: value,
  });
}

const mockedInsertAnalyticsEvent = jest.mocked(insertAnalyticsEvent);

describe('admin authentication', () => {
  const originalAdminSecret = process.env.ADMIN_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(process, 'env', {
      ...process.env,
      ADMIN_SECRET: 'secret-123',
      NODE_ENV: 'test',
    });
  });

  afterAll(() => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      ADMIN_SECRET: originalAdminSecret,
      NODE_ENV: originalNodeEnv ?? 'test',
    });
  });

  it('creates a session cookie on successful login', async () => {
    const response = await loginPost(
      new Request('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'secret-123' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ authenticated: true });
    expect(response.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value).toBeTruthy();
    expect(mockedInsertAnalyticsEvent).toHaveBeenCalledWith(
      'admin_login_succeeded',
      'admin',
      expect.any(Object),
    );
  });

  it('fails closed when ADMIN_SECRET is missing outside test', async () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      ADMIN_SECRET: '',
      NODE_ENV: 'production',
    });

    const response = await loginPost(
      new Request('http://localhost:3000/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'anything' }),
      }),
    );

    expect(response.status).toBe(503);
  });

  it('redirects unauthenticated admin page requests to /login', async () => {
    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('allows authenticated admin requests and refreshes the session cookie', async () => {
    const token = await createAdminSessionToken();
    const request = new NextRequest('http://localhost:3000/admin');
    request.cookies.set(ADMIN_SESSION_COOKIE_NAME, token);

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });

  it('clears the session cookie on logout', async () => {
    const response = await logoutPost(
      new Request('http://localhost:3000/api/admin/logout', {
        method: 'POST',
      }),
    );

    expect(response.status).toBe(307);
    expect(response.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.maxAge).toBe(0);
  });
});