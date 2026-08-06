"use client"

/* eslint-disable @next/next/no-img-element */

import { LayoutDashboard, UploadCloud } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AuthActions } from "@/components/app-shell/auth-actions"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/78">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex h-10 min-w-0 items-center" aria-label="StreamOps home">
            <img
              alt="StreamOps"
              className="streamops-logo streamops-logo-light h-8 w-auto"
              height={334}
              src="/logo/horizontal-light-mode-transparent.png"
              width={1596}
            />
            <img
              alt="StreamOps"
              className="streamops-logo streamops-logo-dark h-8 w-auto"
              height={337}
              src="/logo/horizontal-dark-mode-transparent.png"
              width={1589}
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActivePath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <AuthActions />
            <ThemeToggle />
            <Link href="/upload" className={buttonVariants({ className: "hidden gap-2 sm:inline-flex" })}>
              <UploadCloud />
              Upload
            </Link>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-4rem)]">{children}</div>
    </div>
  )
}
