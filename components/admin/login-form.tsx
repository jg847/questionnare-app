'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

type LoginFormProps = {
  bannerMessage: string;
  nextPath: string;
};

export function LoginForm({ bannerMessage, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as {
        authenticated: boolean;
        error?: string;
      };

      if (!response.ok || !payload.authenticated) {
        throw new Error(payload.error || 'Invalid credentials.');
      }

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Authentication failed.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f1e6_0%,#eee4cf_100%)] px-6 py-10">
      <div className="mx-auto max-w-md rounded-[2rem] border border-border/80 bg-white p-8 shadow-[0_24px_80px_rgba(67,47,31,0.12)]">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
          ToolMatch AI
        </p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-foreground">
          Admin Login
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the shared admin password to access the protected admin surface.
        </p>

        {bannerMessage ? (
          <div className="mt-6 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
            {bannerMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-[#e9b7ab] bg-[#fff4f1] px-4 py-3 text-sm text-[#7d3d2f]">
            {errorMessage}
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="admin-password">
              Admin password
            </label>
            <input
              className="h-12 w-full rounded-[1rem] border border-input px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}