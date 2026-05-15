export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
          ToolMatch AI
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The route you requested does not exist in the current scaffold.
        </p>
      </div>
    </main>
  );
}
