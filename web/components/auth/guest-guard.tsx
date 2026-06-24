"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoadingUser } = useAuth()

  React.useEffect(() => {
    if (!isLoadingUser && isAuthenticated) {
      router.replace(searchParams.get("redirectTo") || "/")
    }
  }, [isAuthenticated, isLoadingUser, router, searchParams])

  if (isLoadingUser || isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="text-center">
          <p className="font-heading text-lg font-medium">Preparing auth</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Resolving your StreamOps session.
          </p>
        </div>
      </main>
    )
  }

  return children
}
