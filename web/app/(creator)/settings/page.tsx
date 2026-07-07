import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { AccountSettings } from "@/components/streamops/account-settings"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <CreatorPageHeader
          className="mb-6"
          description="Placeholder controls show where profile, password, and storage preferences will live once backend endpoints exist."
          eyebrow="Account settings"
          title="Profile and storage preferences"
        />
        <AccountSettings />
      </section>
    </main>
  )
}
