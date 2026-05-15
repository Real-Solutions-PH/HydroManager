import type { ReactNode } from "react"

interface Feature {
  title: string
  description: string
  icon: ReactNode
  color: string
  bg: string
}

const features: Feature[] = [
  {
    title: "Setup-aware checklist",
    color: "#8FBE5C",
    bg: "rgba(143, 190, 92, 0.12)",
    icon: <IconChecklist />,
    description:
      "Daily tasks generated from your physical setup — DFT, NFT, Dutch Bucket, Kratky, SNAP. Every task knows your slots.",
  },
  {
    title: "User-approved milestones",
    color: "#5C8A3A",
    bg: "rgba(92, 138, 58, 0.12)",
    icon: <IconMilestone />,
    description:
      "Nothing auto-advances. You confirm each stage — partial counts, photos, notes. Perfect audit log per batch.",
  },
  {
    title: "Inventory + low-stock",
    color: "#D49050",
    bg: "rgba(212, 144, 80, 0.14)",
    icon: <IconBox />,
    description:
      "Track seeds, nutrients, rockwool, pH up/down. Crop-aware reorder hints. Push alerts when running out.",
  },
  {
    title: "Top 20 PH crop guides",
    color: "#4FB8E8",
    bg: "rgba(79, 184, 232, 0.13)",
    icon: <IconBook />,
    description:
      "Pechay, kangkong, lettuce, basil, tomato, ampalaya at iba pa. Bilingual (EN/TL), calibrated on a real Batangas farm.",
  },
  {
    title: "Grounded AI assistant",
    color: "#A66BC4",
    bg: "rgba(166, 107, 196, 0.13)",
    icon: <IconSparkles />,
    description:
      'Tanungin: "Bakit nanginig ang pechay sa slot 3?" Sumagot using YOUR pH readings, batch history, inventory.',
  },
  {
    title: "Sales + COGS (Pro)",
    color: "#E0B23A",
    bg: "rgba(224, 178, 58, 0.14)",
    icon: <IconChart />,
    description:
      "Log sales per batch. Net margin by crop, by setup, by month. CSV export, BIR-ready.",
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="relative border-t border-[color:var(--brand-leaf-100)] bg-[color:var(--brand-leaf-50)]/40"
    >
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[color:var(--brand-leaf)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-dark)]">
            Features
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-4xl lg:text-5xl">
            Built the way Pinoy growers
            <br /> actually work.
          </h2>
          <p className="mt-4 text-base text-[color:var(--brand-leaf-deep)]/70 md:text-lg">
            Setup-aware. Offline-first. Tagalog-first. Hindi lang generic farm
            app — Bot-choy understands slot count, batches, and hardware — hindi
            puro crops lang.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <span
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
                style={{ backgroundColor: f.bg }}
                aria-hidden
              />
              <div
                className="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl"
                style={{ backgroundColor: f.bg, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="relative text-lg font-bold tracking-tight text-[color:var(--brand-leaf-deep)]">
                {f.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-[color:var(--brand-leaf-deep)]/70">
                {f.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const ICON_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
  viewBox: "0 0 24 24",
  "aria-hidden": "true" as const,
  focusable: "false" as const,
}

function IconChecklist() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8 11 2 2 4-4" />
      <path d="M14 17h4" />
      <path d="M8 17h2" />
    </svg>
  )
}

function IconMilestone() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <path d="M12 3v18" />
      <path d="M12 6h6l2 2.5L18 11h-6" />
      <path d="M12 14H6l-2 2.5L6 19h6" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="m3 7.5 9 4.5 9-4.5" />
      <path d="M12 12v9" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" />
      <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg {...ICON_PROPS} aria-hidden="true" focusable="false">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
  )
}
