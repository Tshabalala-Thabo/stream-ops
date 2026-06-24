import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type AuthFormShellProps = {
  title: string
  description: string
  children: React.ReactNode
  footer: {
    label: string
    href: string
    action: string
  }
}

export function AuthFormShell({
  title,
  description,
  children,
  footer,
}: AuthFormShellProps) {
  return (
    <main className="grid min-h-screen bg-background px-5 py-10 text-foreground lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden rounded-xl border border-border bg-gradient-dark-glow p-8 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            StreamOps access
          </p>
          <h1 className="mt-4 max-w-xl font-heading text-5xl font-semibold tracking-normal">
            Upload, process, and operate public video pipelines.
          </h1>
        </div>
        <div className="grid gap-3 text-sm text-muted-foreground">
          <span>Direct-to-storage upload sessions</span>
          <span>Queue-backed processing states</span>
          <span>Public playback once assets are ready</span>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer.label}{" "}
              <Link className="font-medium text-link hover:underline" href={footer.href}>
                {footer.action}
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
