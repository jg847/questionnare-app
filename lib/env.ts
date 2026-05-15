type EnvironmentShape = {
  nextPublicSupabaseUrl?: string;
  nextPublicSupabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  adminSecret?: string;
  nodeEnv?: string;
};

export function getServerEnvironment(): EnvironmentShape {
  return {
    nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminSecret: process.env.ADMIN_SECRET,
    nodeEnv: process.env.NODE_ENV,
  };
}

export function getRequiredEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for this operation.`);
  }

  return value;
}
