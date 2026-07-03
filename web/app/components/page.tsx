import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  CloudUpload,
  Component,
  Copy,
  Download,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const buttonVariants = [
  {
    name: "Default",
    variant: "default" as const,
    intent: "Primary operation",
    icon: CloudUpload,
    label: "Create upload",
  },
  {
    name: "Secondary",
    variant: "secondary" as const,
    intent: "Lower emphasis",
    icon: RefreshCw,
    label: "Retry job",
  },
  {
    name: "Outline",
    variant: "outline" as const,
    intent: "Neutral utility",
    icon: Copy,
    label: "Copy URL",
  },
  {
    name: "Ghost",
    variant: "ghost" as const,
    intent: "Inline action",
    icon: Play,
    label: "Preview",
  },
  {
    name: "Destructive",
    variant: "destructive" as const,
    intent: "Risky action",
    icon: Trash2,
    label: "Abort upload",
  },
  {
    name: "Link",
    variant: "link" as const,
    intent: "Text command",
    icon: ArrowRight,
    label: "View renditions",
  },
]

const buttonSizes = [
  { name: "Extra small", size: "xs" as const, label: "xs" },
  { name: "Small", size: "sm" as const, label: "sm" },
  { name: "Default", size: "default" as const, label: "default" },
  { name: "Large", size: "lg" as const, label: "lg" },
]

const iconButtonSizes = [
  { name: "Icon xs", size: "icon-xs" as const },
  { name: "Icon sm", size: "icon-sm" as const },
  { name: "Icon", size: "icon" as const },
  { name: "Icon lg", size: "icon-lg" as const },
]

const badgeVariants = [
  {
    name: "Default",
    variant: "default" as const,
    icon: CloudUpload,
    label: "Uploading",
  },
  {
    name: "Secondary",
    variant: "secondary" as const,
    icon: CircleDot,
    label: "Queued",
  },
  {
    name: "Outline",
    variant: "outline" as const,
    icon: Download,
    label: "Source",
  },
  {
    name: "Ghost",
    variant: "ghost" as const,
    icon: RefreshCw,
    label: "Syncing",
  },
  {
    name: "Destructive",
    variant: "destructive" as const,
    icon: AlertTriangle,
    label: "Failed",
  },
  {
    name: "Link",
    variant: "link" as const,
    icon: ArrowRight,
    label: "Manifest",
  },
]

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-heading text-xl font-semibold tracking-normal text-foreground">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function ComponentPanel({
  title,
  meta,
  children,
}: {
  title: string
  meta: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="font-heading text-sm font-medium">{title}</div>
        <div className="font-mono text-xs text-muted-foreground">{meta}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ButtonsView() {
  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Button variants"
        description="Action treatments for upload, playback, retry, copy, and destructive workflows."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {buttonVariants.map((item) => {
          const Icon = item.icon

          return (
            <ComponentPanel
              key={item.variant}
              meta={`variant="${item.variant}"`}
              title={item.name}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {item.intent}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    Button variant
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant={item.variant}>
                    <Icon data-icon="inline-start" />
                    {item.label}
                  </Button>
                  <Button variant={item.variant} disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </ComponentPanel>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.82fr]">
        <ComponentPanel meta="size" title="Button sizes">
          <div className="flex flex-wrap items-center gap-2">
            {buttonSizes.map((item) => (
              <Button key={item.size} size={item.size}>
                <CloudUpload data-icon="inline-start" />
                {item.label}
              </Button>
            ))}
          </div>
        </ComponentPanel>

        <ComponentPanel meta="icon sizes" title="Icon-only buttons">
          <div className="flex flex-wrap items-center gap-2">
            {iconButtonSizes.map((item) => (
              <Button
                aria-label={item.name}
                key={item.size}
                size={item.size}
                variant="outline"
              >
                <RefreshCw />
              </Button>
            ))}
          </div>
        </ComponentPanel>
      </div>

      <ComponentPanel meta="workflow composition" title="Operational action bar">
        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface-overlay p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-heading text-sm font-semibold">
              source-video-2026.mp4
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              12 multipart chunks prepared for R2 direct upload.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Copy data-icon="inline-start" />
              Copy key
            </Button>
            <Button variant="secondary">
              <RefreshCw data-icon="inline-start" />
              Recheck
            </Button>
            <Button>
              <CloudUpload data-icon="inline-start" />
              Upload
            </Button>
          </div>
        </div>
      </ComponentPanel>
    </div>
  )
}

function BadgesView() {
  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Badge variants"
        description="Compact status labels for queue state, source metadata, generated manifests, and failure states."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {badgeVariants.map((item) => {
          const Icon = item.icon

          return (
            <ComponentPanel
              key={item.variant}
              meta={`variant="${item.variant}"`}
              title={item.name}
            >
              <div className="flex min-h-20 items-center justify-between gap-4">
                <Badge variant={item.variant}>
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Badge>
                <Badge variant={item.variant}>{item.label}</Badge>
              </div>
            </ComponentPanel>
          )
        })}
      </div>

      <ComponentPanel meta="status stack" title="Video processing row">
        <div className="overflow-hidden rounded-md border border-border">
          <div className="grid gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground md:grid-cols-[1.1fr_0.8fr_1fr_0.7fr]">
            <span>Asset</span>
            <span>Status</span>
            <span>Outputs</span>
            <span>Health</span>
          </div>
          <div className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.1fr_0.8fr_1fr_0.7fr] md:items-center">
            <div>
              <div className="font-medium">Launch keynote</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                videos/launch-keynote/source.mp4
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>
                <CloudUpload data-icon="inline-start" />
                Uploaded
              </Badge>
              <Badge variant="secondary">Queued</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">480p</Badge>
              <Badge variant="outline">720p</Badge>
              <Badge variant="link">master.m3u8</Badge>
            </div>
            <div>
              <Badge className="bg-success-light text-success-dark ring-1 ring-success-border hover:bg-success-light">
                <CheckCircle2 data-icon="inline-start" />
                Ready
              </Badge>
            </div>
          </div>
        </div>
      </ComponentPanel>
    </div>
  )
}

export default function ComponentsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-2 bg-info-light text-info-dark ring-1 ring-info-border hover:bg-info-light">
              <Component className="size-3.5" />
              Component showcase
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              StreamOps UI components.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              A focused workspace for switching between shared components and
              checking their variants in operational product contexts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-overlay p-3 text-sm">
            <div className="rounded-md bg-card p-3">
              <div className="font-mono text-lg font-semibold">6</div>
              <div className="text-xs text-muted-foreground">Button variants</div>
            </div>
            <div className="rounded-md bg-card p-3">
              <div className="font-mono text-lg font-semibold">6</div>
              <div className="text-xs text-muted-foreground">Badge variants</div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="buttons" className="gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-heading text-sm font-medium text-foreground">
              Component library
            </div>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buttons">
            <ButtonsView />
          </TabsContent>
          <TabsContent value="badges">
            <BadgesView />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
