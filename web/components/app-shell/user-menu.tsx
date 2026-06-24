"use client"

import { LayoutDashboard, LogOut, Settings, UserCircle, Video } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initialsForName(name?: string) {
  return (name || "SO")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserMenu() {
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
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
        <span className="max-w-28 truncate">{user?.name ?? "Account"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-foreground">{user?.name}</span>
          <span className="block truncate font-normal">{user?.email}</span>
        </DropdownMenuLabel>
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
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserCircle className="size-4" />
          Creator access enabled
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
