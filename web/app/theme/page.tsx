import { Activity, CheckCircle2, Cloud, Database, Gauge, Layers3, Palette, Play, RefreshCw, UploadCloud } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const coreTokens = [
  { name: "Background", className: "bg-background text-foreground", value: "--background" },
  { name: "Foreground", className: "bg-foreground text-background", value: "--foreground" },
  { name: "Card", className: "bg-card text-card-foreground ring-1 ring-border", value: "--card" },
  { name: "Popover", className: "bg-popover text-popover-foreground ring-1 ring-border", value: "--popover" },
  { name: "Primary", className: "bg-primary text-primary-foreground", value: "--primary" },
  { name: "Secondary", className: "bg-secondary text-secondary-foreground", value: "--secondary" },
  { name: "Muted", className: "bg-muted text-muted-foreground", value: "--muted" },
  { name: "Accent", className: "bg-accent text-accent-foreground", value: "--accent" },
  { name: "Destructive", className: "bg-destructive text-destructive-foreground", value: "--destructive" },
  { name: "Border", className: "bg-border text-foreground", value: "--border" },
  { name: "Input", className: "bg-input text-foreground", value: "--input" },
  { name: "Ring", className: "bg-ring text-primary-foreground", value: "--ring" },
]

const surfaceTokens = [
  { name: "Surface", className: "bg-surface text-surface-foreground ring-1 ring-border", value: "--surface" },
  { name: "Surface elevated", className: "bg-surface-elevated text-surface-foreground ring-1 ring-border", value: "--surface-elevated" },
  { name: "Surface overlay", className: "bg-surface-overlay text-surface-foreground", value: "--surface-overlay" },
  { name: "Brand", className: "bg-brand text-brand-foreground", value: "--brand" },
  { name: "Brand accent", className: "bg-brand-accent text-brand-accent-foreground", value: "--brand-accent" },
  { name: "Link", className: "bg-link text-primary-foreground", value: "--link" },
  { name: "Visited", className: "bg-link-visited text-primary-foreground", value: "--link-visited" },
  { name: "Focus", className: "bg-focus text-primary-foreground", value: "--focus" },
]

const statusTokens = [
  { name: "Success", className: "bg-success text-success-foreground", value: "--success" },
  { name: "Success light", className: "bg-success-light text-success-dark ring-1 ring-success-border", value: "--success-light" },
  { name: "Info", className: "bg-info text-info-foreground", value: "--info" },
  { name: "Info light", className: "bg-info-light text-info-dark ring-1 ring-info-border", value: "--info-light" },
  { name: "Warning", className: "bg-warning text-warning-foreground", value: "--warning" },
  { name: "Warning light", className: "bg-warning-light text-warning-dark ring-1 ring-warning-border", value: "--warning-light" },
  { name: "Failure light", className: "bg-destructive-light text-destructive-dark ring-1 ring-destructive-border", value: "--destructive-light" },
  { name: "Failure", className: "bg-destructive text-destructive-foreground", value: "--destructive" },
]

const sidebarTokens = [
  { name: "Sidebar", className: "bg-sidebar text-sidebar-foreground ring-1 ring-sidebar-border", value: "--sidebar" },
  { name: "Sidebar primary", className: "bg-sidebar-primary text-sidebar-primary-foreground", value: "--sidebar-primary" },
  { name: "Sidebar accent", className: "bg-sidebar-accent text-sidebar-accent-foreground", value: "--sidebar-accent" },
  { name: "Sidebar border", className: "bg-sidebar-border text-sidebar-foreground", value: "--sidebar-border" },
  { name: "Sidebar ring", className: "bg-sidebar-ring text-sidebar-primary-foreground", value: "--sidebar-ring" },
]

const chartTokens = [
  { name: "Chart 1", className: "bg-chart-1 text-primary-foreground", value: "--chart-1" },
  { name: "Chart 2", className: "bg-chart-2 text-primary-foreground", value: "--chart-2" },
  { name: "Chart 3", className: "bg-chart-3 text-primary-foreground", value: "--chart-3" },
  { name: "Chart 4", className: "bg-chart-4 text-primary-foreground", value: "--chart-4" },
  { name: "Chart 5", className: "bg-chart-5 text-foreground", value: "--chart-5" },
]

const gradientTokens = [
  {
    name: "Primary action",
    className: "bg-gradient-primary text-white",
    value: "--gradient-primary",
    preview: "var(--gradient-primary)",
    tab: "primary",
    usage: "High-intent CTAs such as upload, start processing, and create actions.",
  },
  {
    name: "Brand section",
    className: "bg-gradient-brand text-white",
    value: "--gradient-brand",
    preview: "var(--gradient-brand)",
    tab: "brand",
    usage: "Special StreamOps sections, onboarding panels, feature headers, and polished empty states.",
  },
  {
    name: "Processing",
    className: "bg-gradient-processing text-white",
    value: "--gradient-processing",
    preview: "var(--gradient-processing)",
    tab: "processing",
    usage: "Active worker states, transcoding progress, queue movement, and pipeline timelines.",
  },
  {
    name: "Ready state",
    className: "bg-gradient-ready text-[rgb(var(--streamops-ink))]",
    value: "--gradient-ready",
    preview: "var(--gradient-ready)",
    tab: "ready",
    usage: "Successful completion moments, ready videos, and healthy pipeline summaries.",
  },
  {
    name: "Dark glow",
    className: "bg-gradient-dark-glow text-foreground ring-1 ring-border",
    value: "--gradient-dark-glow",
    preview: "var(--gradient-dark-glow)",
    tab: "glow",
    usage: "Restrained atmospheric background for dark hero panels or special sections.",
  },
]

const pipeline = [
  { label: "Upload", icon: UploadCloud, color: "bg-info text-info-foreground" },
  { label: "Queue", icon: Database, color: "bg-muted text-muted-foreground" },
  { label: "Process", icon: Activity, color: "bg-primary text-primary-foreground" },
  { label: "Renditions", icon: Layers3, color: "bg-brand-accent text-brand-accent-foreground" },
  { label: "Playback", icon: Play, color: "bg-success text-success-foreground" },
]

function TokenGrid({
  title,
  description,
  tokens,
}: {
  title: string
  description: string
  tokens: Array<{ name: string; className: string; value: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tokens.map((token) => (
            <div
              className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
              key={token.value}
            >
              <div className={`flex min-h-24 items-end p-3 ${token.className}`}>
                <span className="text-sm font-medium">{token.name}</span>
              </div>
              <div className="space-y-1 p-3">
                <div className="font-mono text-xs text-muted-foreground">{token.value}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {token.className.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GradientGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>StreamOps gradient variants</CardTitle>
        <CardDescription>
          Use gradients as moments of motion and emphasis, not as the default styling for every component.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="primary" className="mb-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="font-heading text-sm font-medium">Gradient section preview</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch variants to see each gradient in a real StreamOps section context.
              </p>
            </div>
            <TabsList className="w-full flex-wrap justify-start lg:w-fit">
              {gradientTokens.map((token) => (
                <TabsTrigger key={token.tab} value={token.tab}>
                  {token.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="primary">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div
                className="grid gap-6 p-6 text-white lg:grid-cols-[1fr_0.8fr] lg:p-8"
                style={{ background: "var(--gradient-primary)" }}
              >
                <div>
                  <Badge className="mb-5 bg-white/18 text-white hover:bg-white/18">
                    Primary CTA gradient
                  </Badge>
                  <h3 className="font-heading text-3xl font-semibold tracking-normal">
                    Create a direct-to-storage upload session.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
                    Use this gradient when the action should feel decisive: upload video, start processing, create release, or continue a critical workflow.
                  </p>
                  <button className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-[rgb(var(--streamops-ink))] shadow-sm">
                    <UploadCloud className="size-4" />
                    Create upload
                  </button>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/14 p-4 backdrop-blur">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span>Upload readiness</span>
                    <span className="font-mono">84%</span>
                  </div>
                  <Progress value={84}>
                    <ProgressTrack className="bg-white/25">
                      <ProgressIndicator className="bg-white" />
                    </ProgressTrack>
                  </Progress>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/80">
                    <span>source.mp4</span>
                    <span>12 parts</span>
                    <span>R2 bucket</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="brand">
            <div
              className="overflow-hidden rounded-xl border border-border p-6 text-white shadow-xs lg:p-8"
              style={{ background: "var(--gradient-brand)" }}
            >
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <Badge className="mb-5 bg-white/18 text-white hover:bg-white/18">
                    Brand section gradient
                  </Badge>
                  <h3 className="font-heading text-3xl font-semibold tracking-normal">
                    Stream. Process. Operate.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
                    Use this for polished feature sections, onboarding moments, and empty states that should clearly feel like StreamOps.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {["Source upload", "Queue dispatch", "Playback ready"].map((item) => (
                    <div className="rounded-lg border border-white/20 bg-white/14 p-4 backdrop-blur" key={item}>
                      <div className="mb-8 size-2 rounded-full bg-white" />
                      <div className="font-heading text-sm font-medium">{item}</div>
                      <div className="mt-1 text-xs text-white/75">Operational milestone</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="processing">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div
                className="border-b border-white/20 p-6 text-white lg:p-8"
                style={{ background: "var(--gradient-processing)" }}
              >
                <Badge className="mb-5 bg-white/18 text-white hover:bg-white/18">
                  Processing gradient
                </Badge>
                <h3 className="font-heading text-3xl font-semibold tracking-normal">
                  Worker is generating renditions.
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  Use this gradient for active work: queue movement, FFmpeg runs, transcoding progress, and pipeline rails.
                </p>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-4">
                {[
                  ["Queued", Database, "done"],
                  ["Metadata", Activity, "done"],
                  ["720p rendition", RefreshCw, "running"],
                  ["HLS manifest", Layers3, "waiting"],
                ].map(([label, Icon, state]) => (
                  <div className="rounded-lg border border-border bg-surface p-4" key={label as string}>
                    <Icon className="mb-5 size-5 text-primary" />
                    <div className="font-heading text-sm font-medium">{label as string}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{state as string}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ready">
            <div
              className="overflow-hidden rounded-xl border border-border p-6 text-[rgb(var(--streamops-ink))] shadow-xs lg:p-8"
              style={{ background: "var(--gradient-ready)" }}
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                <div>
                  <Badge className="mb-5 bg-white/35 text-[rgb(var(--streamops-ink))] hover:bg-white/35">
                    Ready state gradient
                  </Badge>
                  <h3 className="font-heading text-3xl font-semibold tracking-normal">
                    Playback assets are ready.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[rgb(var(--streamops-ink))]/75">
                    Use this only for completion moments: successful uploads, ready videos, healthy pipeline summaries, and positive confirmations.
                  </p>
                </div>
                <div className="rounded-lg border border-white/35 bg-white/35 p-5 backdrop-blur">
                  <CheckCircle2 className="mb-5 size-8" />
                  <div className="font-heading text-lg font-semibold">master.m3u8 available</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
                    <span>480p</span>
                    <span>720p</span>
                    <span>1080p</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="glow">
            <div
              className="overflow-hidden rounded-xl border border-border bg-background p-6 shadow-xs lg:p-8"
              style={{ background: "var(--gradient-dark-glow), rgb(var(--background))" }}
            >
              <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                  <Badge className="mb-5 bg-primary/15 text-foreground hover:bg-primary/15">
                    Dark glow gradient
                  </Badge>
                  <h3 className="font-heading text-3xl font-semibold tracking-normal">
                    A restrained atmosphere for special dark panels.
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Use this as a background layer for dark hero panels, playback previews, and focused operational moments. It should stay subtle.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card/80 p-5 shadow-xs backdrop-blur">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="font-heading text-sm font-medium">Worker health</div>
                      <div className="text-xs text-muted-foreground">Live queue monitor</div>
                    </div>
                    <Gauge className="size-5 text-primary" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["12 jobs", "3 active", "0 failed"].map((metric) => (
                      <div className="rounded-md bg-surface-overlay p-3 font-mono text-xs" key={metric}>
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-2">
          {gradientTokens.map((token) => (
            <div
              className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
              key={token.value}
            >
              <div
                className={`flex min-h-36 flex-col justify-between bg-background p-5 ${token.className}`}
                data-gradient-preview={token.value}
                style={{ background: token.preview }}
              >
                <div>
                  <div className="font-heading text-xl font-semibold">{token.name}</div>
                  <div className="mt-2 max-w-md text-sm opacity-85">{token.usage}</div>
                </div>
                <div className="mt-8 inline-flex w-fit rounded-md bg-black/15 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm dark:bg-white/15">
                  {token.value}
                </div>
              </div>
              <div className="space-y-1 p-4">
                <div className="font-mono text-xs text-muted-foreground">
                  Utility: {token.className.split(" ")[0]}
                </div>
                <div className="text-sm text-muted-foreground">{token.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ThemePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 gap-2 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent">
              <Palette className="size-3.5" />
              StreamOps theme system
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Global CSS color tokens in light and dark mode.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              A living shadcn/ui token board for the StreamOps frontend. Toggle the theme to verify the same utility classes across core UI, status states, sidebars, charts, and product-specific accents.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Card className="border-border bg-surface-overlay">
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {pipeline.map((step) => {
                const Icon = step.icon

                return (
                  <div className="rounded-lg border border-border bg-card p-4" key={step.label}>
                    <div className={`mb-5 flex size-10 items-center justify-center rounded-md ${step.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="font-heading text-sm font-medium">{step.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Pipeline state</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <TokenGrid
          title="Core shadcn/ui tokens"
          description="Default component tokens used by buttons, cards, popovers, inputs, borders, and focus rings."
          tokens={coreTokens}
        />
        <TokenGrid
          title="StreamOps product tokens"
          description="Application surfaces, brand actions, links, and focus treatments."
          tokens={surfaceTokens}
        />
        <GradientGrid />
        <TokenGrid
          title="Semantic status tokens"
          description="Operational states for upload, processing, success, warnings, and failures."
          tokens={statusTokens}
        />
        <div className="grid gap-8 xl:grid-cols-[1fr_0.75fr]">
          <TokenGrid
            title="Sidebar tokens"
            description="Navigation and app shell colors."
            tokens={sidebarTokens}
          />
          <TokenGrid
            title="Chart tokens"
            description="Small operational charts and pipeline metrics."
            tokens={chartTokens}
          />
        </div>
      </section>
    </main>
  )
}
