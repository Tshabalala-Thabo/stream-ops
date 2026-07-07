import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { AccountSettings } from "@/components/streamops/account-settings"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
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
