import { getServerEnvironment } from '@/lib/env';

describe('getServerEnvironment', () => {
  it('returns the current server environment shape without throwing', () => {
    expect(getServerEnvironment()).toEqual({
      nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      adminSecret: process.env.ADMIN_SECRET,
      nodeEnv: process.env.NODE_ENV,
    });
  });
});
