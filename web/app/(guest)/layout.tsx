import { Suspense } from "react"

import { GuestGuard } from "@/components/auth/guest-guard"

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <GuestGuard>{children}</GuestGuard>
    </Suspense>
  )
}
