const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE_NAME = 'toolmatch_admin_session';
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

type AdminSessionValidation = {
  authenticated: boolean;
  reason?: 'missing' | 'invalid' | 'expired' | 'misconfigured';
  lastSeenAt?: number;
};

function getAdminSecret() {
  return process.env.ADMIN_SECRET?.trim();
}

export function isAdminSecretMisconfigured() {
  return !getAdminSecret() && process.env.NODE_ENV !== 'test';
}

async function signValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));

  return Array.from(new Uint8Array(signature), (segment) =>
    segment.toString(16).padStart(2, '0'),
  ).join('');
}

export async function createAdminSessionToken(lastSeenAt = Date.now()) {
  const secret = getAdminSecret();

  if (!secret) {
    throw new Error('ADMIN_SECRET is required for admin auth.');
  }

  const value = String(lastSeenAt);
  const signature = await signValue(value, secret);
  return `${value}.${signature}`;
}

export async function validateAdminSessionToken(
  token?: string | null,
  now = Date.now(),
): Promise<AdminSessionValidation> {
  if (!token) {
    return { authenticated: false, reason: 'missing' };
  }

  const secret = getAdminSecret();

  if (!secret) {
    return {
      authenticated: false,
      reason: process.env.NODE_ENV === 'test' ? 'missing' : 'misconfigured',
    };
  }

  const [timestampValue, providedSignature] = token.split('.');
  const lastSeenAt = Number(timestampValue);

  if (!timestampValue || !providedSignature || Number.isNaN(lastSeenAt)) {
    return { authenticated: false, reason: 'invalid' };
  }

  const expectedSignature = await signValue(timestampValue, secret);

  if (expectedSignature !== providedSignature) {
    return { authenticated: false, reason: 'invalid' };
  }

  if (now - lastSeenAt > ADMIN_SESSION_IDLE_TIMEOUT_MS) {
    return { authenticated: false, reason: 'expired' };
  }

  return {
    authenticated: true,
    lastSeenAt,
  };
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ADMIN_SESSION_IDLE_TIMEOUT_MS / 1000,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}