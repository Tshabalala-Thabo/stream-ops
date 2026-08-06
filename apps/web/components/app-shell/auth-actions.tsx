"use client"

import { LogIn, LogOut, UserCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AuthSession =
  | {
      authenticated: true
      email: string | null
      username: string | null
    }
  | {
      authenticated: false
    }

export function AuthActions() {
  const pathname = usePathname()
  const [session, setSession] = useState<AuthSession | null>(null)
  const signInHref = useMemo(
    () => `/api/auth/sign-in?returnTo=${encodeURIComponent(pathname || "/dashboard")}`,
    [pathname]
  )

  useEffect(() => {
    let active = true

    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((value: AuthSession) => {
        if (active) {
          setSession(value)
        }
      })
      .catch(() => {
        if (active) {
          setSession({ authenticated: false })
        }
      })

    return () => {
      active = false
    }
  }, [])

  if (!session?.authenticated) {
    return (
      <Link href={signInHref} className={buttonVariants({ variant: "outline", className: "gap-2" })}>
        <LogIn />
        Sign in
      </Link>
    )
  }

  const label = session.email ?? session.username ?? "Signed in"

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden max-w-44 min-w-0 items-center gap-2 truncate text-sm text-muted-foreground md:inline-flex">
        <UserCircle className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <Link
        href="/api/auth/sign-out"
        className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut />
      </Link>
    </div>
  )
}
