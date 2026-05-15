import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppStoreBadge, PlayStoreBadge } from "./StoreBadges"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-leaf-gradient">
      <div className="absolute inset-0 grain opacity-60" aria-hidden />
      <div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[color:var(--brand-leaf-light)]/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[color:var(--brand-clay)]/20 blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:gap-8 md:py-28 lg:py-32">
        <div className="flex flex-col gap-6 text-left">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--brand-leaf-dark)]/15 bg-white/70 px-3 py-1 text-xs font-medium text-[color:var(--brand-leaf-dark)] shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-[color:var(--brand-leaf)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--brand-leaf)]" />
            </span>
            Built in PH · Tagalog-first · v1 now available
          </span>

          <h1 className="text-4xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-5xl lg:text-6xl">
            Hydroponics na{" "}
            <span className="relative inline-block">
              <span className="relative z-10">kayang-kaya</span>
              <span
                className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-sm bg-[color:var(--brand-clay)]/40 md:h-4"
                aria-hidden
              />
            </span>{" "}
            mong i-manage.
          </h1>

          <p className="max-w-xl text-lg text-[color:var(--brand-leaf-deep)]/75 md:text-xl">
            Setup-aware checklists. User-approved milestones. AI assistant na
            grounded sa inyong farm data. Para sa Pinoy growers — DFT, NFT,
            Dutch Bucket, Kratky, SNAP.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AppStoreBadge />
            <PlayStoreBadge />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              asChild
              size="lg"
              className="bg-[color:var(--brand-leaf)] text-white shadow-md hover:bg-[color:var(--brand-leaf-dark)]"
            >
              <Link href="/signup">Try the web app — free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-[color:var(--brand-leaf-deep)] hover:bg-[color:var(--brand-leaf-100)]"
            >
              <Link href="#how">See how it works →</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-xs text-[color:var(--brand-leaf-deep)]/60">
            <span className="inline-flex items-center gap-1.5">
              <CheckDot /> Free tier — no card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckDot /> Works offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckDot /> GCash / Maya billing
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 rounded-[40%] bg-[color:var(--brand-leaf-light)]/25 blur-2xl"
            aria-hidden
          />

          <Image
            src="/assets/character/welcome.gif"
            alt="Bot-choy mascot waving"
            width={180}
            height={180}
            className="absolute -bottom-2 -left-2 z-20 h-32 w-32 animate-float-slow drop-shadow-xl md:-bottom-6 md:-left-8 md:h-44 md:w-44"
            unoptimized
          />

          <PhoneMockup />

          <FloatingChip
            className="absolute -top-2 right-2 md:-top-4 md:right-0"
            color="var(--brand-water)"
            label="pH 6.2 · OK"
            sub="Slot 3 · DFT"
          />
          <FloatingChip
            className="absolute bottom-16 -right-2 md:bottom-20 md:-right-6"
            color="var(--brand-clay)"
            label="Restock soon"
            sub="Rockwool 24%"
          />
        </div>
      </div>
    </section>
  )
}

function CheckDot() {
  return (
    <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[color:var(--brand-leaf)]/20">
      <svg
        viewBox="0 0 12 12"
        className="h-2.5 w-2.5 text-[color:var(--brand-leaf-dark)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2.5 6.5 5 9l4.5-5.5" />
      </svg>
    </span>
  )
}

function FloatingChip({
  className,
  color,
  label,
  sub,
}: {
  className?: string
  color: string
  label: string
  sub: string
}) {
  return (
    <div
      className={`z-30 flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur ${className ?? ""}`}
    >
      <span
        className="h-7 w-7 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
        }}
      />
      <div className="leading-tight">
        <div className="text-xs font-semibold text-[color:var(--brand-leaf-deep)]">
          {label}
        </div>
        <div className="text-[10px] text-[color:var(--brand-leaf-deep)]/60">
          {sub}
        </div>
      </div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative z-10 w-[280px] rounded-[2.5rem] border border-[color:var(--brand-leaf-deep)]/15 bg-[color:var(--brand-leaf-deep)] p-3 shadow-2xl md:w-[320px]">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#0F0F0F]">
        <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-medium text-white/70">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-white/80" />
            <span className="inline-block h-2 w-3 rounded-sm bg-white/80" />
          </span>
        </div>

        <div className="px-5 pt-1 pb-4">
          <div className="text-[11px] font-medium text-white/50">
            Magandang umaga,
          </div>
          <div className="text-base font-bold text-white">Kuya Kai 👋</div>
        </div>

        <div className="mx-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-light)]">
              Today · 4 tasks
            </span>
            <span className="rounded-full bg-[color:var(--brand-leaf)]/30 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand-leaf-light)]">
              DFT
            </span>
          </div>

          <TaskRow done label="Check pH · all slots" sub="Done · pH 6.2" />
          <TaskRow done label="Top-up reservoir" sub="Done · 18L added" />
          <TaskRow label="Inspect Slot 7-12" sub="Pechay · Day 14" />
          <TaskRow label="Approve milestone" sub="Batch B-204 → Veg" />
        </div>

        <div className="mx-4 mt-3 mb-4 rounded-2xl bg-[color:var(--brand-leaf-light)]/15 p-3 ring-1 ring-[color:var(--brand-leaf-light)]/30">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--brand-leaf)] text-xs font-bold text-white">
              AI
            </span>
            <div className="text-[11px] text-white/85">
              <span className="font-semibold text-white">Bot-choy:</span> Slot 3
              nanginig — try lowering EC by 0.2.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskRow({
  label,
  sub,
  done,
}: {
  label: string
  sub: string
  done?: boolean
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2.5">
      <span
        className={`grid h-5 w-5 place-items-center rounded-md border ${
          done
            ? "border-[color:var(--brand-leaf-light)] bg-[color:var(--brand-leaf)]"
            : "border-white/25 bg-white/5"
        }`}
      >
        {done ? (
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M2.5 6.5 5 9l4.5-5.5" />
          </svg>
        ) : null}
      </span>
      <div className="leading-tight">
        <div
          className={`text-[12px] font-medium ${
            done ? "text-white/45 line-through" : "text-white"
          }`}
        >
          {label}
        </div>
        <div className="text-[10px] text-white/45">{sub}</div>
      </div>
    </div>
  )
}
