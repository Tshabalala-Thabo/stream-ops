"use client"

import { Database, Lock, UserCircle } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AccountSettings() {
  const { user } = useAuth()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="rounded-lg border bg-surface p-5">
          <div className="flex items-center gap-3">
            <UserCircle className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Profile</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Name
              <Input readOnly value={user?.name ?? ""} />
            </label>
            <label className="grid gap-2 text-sm">
              Email
              <Input readOnly value={user?.email ?? ""} />
            </label>
          </div>
          <Button className="mt-5" disabled type="button">
            Profile updates not wired
          </Button>
        </div>

        <div className="rounded-lg border bg-surface p-5">
          <div className="flex items-center gap-3">
            <Lock className="size-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Password</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input disabled placeholder="Current password" type="password" />
            <Input disabled placeholder="New password" type="password" />
          </div>
          <Button className="mt-5" disabled type="button" variant="outline">
            Password updates not wired
          </Button>
        </div>
      </section>

      <aside className="rounded-lg border bg-surface p-5">
        <div className="flex items-center gap-3">
          <Database className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Storage preferences</h2>
        </div>
        <dl className="mt-5 grid gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Default provider</dt>
            <dd className="font-mono text-xs">s3</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source prefix</dt>
            <dd className="break-all font-mono text-xs">videos/&#123;video_id&#125;/source/</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Playback prefix</dt>
            <dd className="break-all font-mono text-xs">videos/&#123;video_id&#125;/hls/</dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" disabled type="button" variant="outline">
          Storage controls not wired
        </Button>
      </aside>
    </div>
  )
}
