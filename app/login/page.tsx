import { LoginForm } from '@/components/admin/login-form';

function getInitialMessage(
  configError: string | null,
  loggedOut: string | null,
  unauthorized: string | null,
) {
  if (configError) {
    return 'Admin authentication is unavailable because ADMIN_SECRET is not configured.';
  }

  if (loggedOut) {
    return 'You have been logged out.';
  }

  if (unauthorized) {
    return 'Please log in to access the admin surface.';
  }

  return '';
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: {
    next?: string;
    error?: string;
    logged_out?: string;
    unauthorized?: string;
  };
}) {
  const nextPath = searchParams?.next ?? '/admin';
  const bannerMessage = getInitialMessage(
    searchParams?.error ?? null,
    searchParams?.logged_out ?? null,
    searchParams?.unauthorized ?? null,
  );

  return (
    <LoginForm bannerMessage={bannerMessage} nextPath={nextPath} />
  );
}