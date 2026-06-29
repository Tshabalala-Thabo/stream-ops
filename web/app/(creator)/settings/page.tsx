import { AccountSettings } from "@/components/streamops/account-settings"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            Account settings
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Profile and storage preferences
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Placeholder controls show where profile, password, and storage
            preferences will live once backend endpoints exist.
          </p>
        </div>
        <AccountSettings />
      </section>
    </main>
  )
}
