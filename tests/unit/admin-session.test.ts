/** @jest-environment node */

import { webcrypto } from 'node:crypto';

import {
  ADMIN_SESSION_IDLE_TIMEOUT_MS,
  createAdminSessionToken,
  isAdminSecretMisconfigured,
  validateAdminSessionToken,
} from '@/lib/auth/admin-session';

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

describe('admin session helpers', () => {
  const originalAdminSecret = process.env.ADMIN_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
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

  it('creates and validates a signed admin session token', async () => {
    const token = await createAdminSessionToken(1000);
    const result = await validateAdminSessionToken(token, 1000 + 1000);

    expect(result).toEqual({
      authenticated: true,
      lastSeenAt: 1000,
    });
  });

  it('expires sessions after 24 hours of inactivity', async () => {
    const token = await createAdminSessionToken(1000);
    const result = await validateAdminSessionToken(
      token,
      1000 + ADMIN_SESSION_IDLE_TIMEOUT_MS + 1,
    );

    expect(result).toEqual({
      authenticated: false,
      reason: 'expired',
    });
  });

  it('fails closed when ADMIN_SECRET is missing outside test', () => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      ADMIN_SECRET: '',
      NODE_ENV: 'production',
    });

    expect(isAdminSecretMisconfigured()).toBe(true);
  });
});