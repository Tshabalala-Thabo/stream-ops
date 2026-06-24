"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoadingUser } = useAuth()

  React.useEffect(() => {
    if (!isLoadingUser && !isAuthenticated) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isLoadingUser, pathname, router])

  if (isLoadingUser || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="text-center">
          <p className="font-heading text-lg font-medium">Checking session</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload and dashboard tools require an account.
          </p>
        </div>
      </main>
    )
  }

  return children
}
