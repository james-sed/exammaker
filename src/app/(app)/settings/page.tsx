import { requireUser } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-border bg-card p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-medium text-foreground">Name</dt>
            <dd className="mt-0.5 text-muted-foreground">{user.name || "Not set"}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Email</dt>
            <dd className="mt-0.5 text-muted-foreground">{user.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
