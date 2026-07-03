"use client"

import { LayoutDashboard, LogOut, Settings, UserCircle, Video } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initialsForName(name?: string) {
  return (name || "SO")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function splitFullName(name?: string) {
  const parts = (name || "StreamOps User").trim().split(/\s+/).filter(Boolean)
  const [firstName = "StreamOps", ...lastNameParts] = parts

  return {
    firstName,
    lastName: lastNameParts.join(" ") || "User",
    fullName: [firstName, ...lastNameParts].join(" "),
  }
}

export function UserMenu() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const profileName = splitFullName(user?.name)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
      router.replace("/login")
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Open account menu"
            className="gap-2 pl-1.5"
            variant="outline"
          />
        }
      >
        <span className="grid size-6 place-items-center rounded bg-muted font-mono text-[10px] font-semibold text-foreground">
          {initialsForName(user?.name)}
        </span>
        <span className="max-w-28 truncate">{profileName.fullName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="space-y-3 px-2 py-1.5 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-muted font-mono text-xs font-semibold text-foreground">
              {initialsForName(user?.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-foreground">
                {profileName.fullName}
              </span>
              <span className="block truncate font-normal">{user?.email}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-surface-overlay p-2">
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest">
                First name
              </span>
              <span className="block truncate text-xs font-medium text-foreground">
                {profileName.firstName}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest">
                Last name
              </span>
              <span className="block truncate text-xs font-medium text-foreground">
                {profileName.lastName}
              </span>
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/videos" />}>
          <Video />
          My videos
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onClick={handleLogout}
          variant="destructive"
        >
          <LogOut />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-normal text-muted-foreground">
          <UserCircle className="size-4" />
          Creator access enabled
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
