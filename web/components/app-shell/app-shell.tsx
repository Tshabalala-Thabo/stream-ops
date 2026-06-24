"use client"

import {
  Activity,
  Clapperboard,
  LayoutDashboard,
  Library,
  LogIn,
  Menu,
  Search,
  Settings,
  UploadCloud,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { UserMenu } from "./user-menu"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const publicNavItems: NavItem[] = [
  { href: "/", label: "Videos", icon: Clapperboard },
  { href: "/videos", label: "Browse", icon: Search },
]

const creatorNavItems: NavItem[] = [
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem
  pathname: string
  onClick?: () => void
}) {
  const Icon = item.icon
  const isActive = isActivePath(pathname, item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        isActive && "bg-muted text-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  )
}

function MobileNavDrawer({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false)
  const { isAuthenticated, isLoadingUser, user } = useAuth()
  const allNavItems = isAuthenticated
    ? [...publicNavItems, ...creatorNavItems]
    : publicNavItems

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            aria-label="Open navigation"
            className="md:hidden"
            size="icon-sm"
            variant="outline"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent className="w-[320px] max-w-[calc(100vw-2rem)]" side="right">
        <SheetHeader className="border-b">
          <SheetTitle>StreamOps</SheetTitle>
          <SheetDescription>
            Public video library and creator operations.
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4">
          {allNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>

        <div className="mx-4 rounded-md border bg-gradient-dark-glow p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="size-4 text-brand-accent" />
            Pipeline surface
          </div>
          <p className="mt-2 text-muted-foreground">
            Uploads, processing, and playback readiness stay visible from the
            shell as the product grows.
          </p>
        </div>

        <div className="mt-auto space-y-3 border-t p-4">
          {isAuthenticated ? (
            <>
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium">{user?.email}</p>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  className: "w-full justify-start gap-2",
                  variant: "outline",
                })}
              >
                <Settings />
                Settings
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={buttonVariants({
                className: "w-full justify-start gap-2",
              })}
            >
              <LogIn />
              Sign in
            </Link>
          )}
          <div className="flex items-center justify-between gap-3">
            <ThemeToggle />
            {isLoadingUser && (
              <span className="text-xs text-muted-foreground">Checking...</span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAuthenticated, isLoadingUser } = useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/78">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-gradient-brand text-brand-accent-foreground shadow-sm">
              <Library className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-sm font-semibold leading-4">
                StreamOps
              </span>
              <span className="block truncate font-mono text-[10px] uppercase text-muted-foreground">
                Media control plane
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {publicNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            {isAuthenticated &&
              creatorNavItems
                .filter((item) => item.href !== "/upload")
                .map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <div className="mr-2 hidden items-center gap-2 rounded-md border bg-surface-overlay px-2.5 py-1.5 text-xs text-muted-foreground lg:flex">
              <span className="size-1.5 rounded-full bg-brand-accent" />
              Public playback online
            </div>

            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <Link
                  href="/upload"
                  className={buttonVariants({
                    className: "gap-2 bg-gradient-primary text-white shadow-sm hover:opacity-90",
                  })}
                >
                  <UploadCloud />
                  Upload
                </Link>
                <UserMenu />
              </>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({
                  className: "gap-2",
                  variant: "outline",
                })}
              >
                <LogIn />
                Sign in
              </Link>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            {isLoadingUser && (
              <span className="size-2 rounded-full bg-info" aria-label="Loading session" />
            )}
            <MobileNavDrawer pathname={pathname} />
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-4rem)]">{children}</div>
    </div>
  )
}
