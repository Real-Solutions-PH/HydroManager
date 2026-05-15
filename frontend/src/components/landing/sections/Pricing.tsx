import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Tier {
  name: string
  price: string
  unit?: string
  tagline: string
  features: string[]
  cta: { label: string; href: string }
  highlight?: boolean
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "₱0",
    tagline: "Para sa hobbyists at home growers.",
    features: [
      "1 setup",
      "Up to 3 active batches",
      "Read-only crop guide",
      "10 AI messages / month",
      "Setup photo onboarding (2 total)",
    ],
    cta: { label: "Start free", href: "/signup" },
  },
  {
    name: "Grower",
    price: "₱199",
    unit: "/ month",
    tagline: "Para sa micro-commercial (50–300 slots).",
    features: [
      "Up to 5 setups",
      "Unlimited active batches",
      "Full crop guide + calibration",
      "Inventory + low-stock alerts",
      "Setup-aware daily checklist",
      "150 AI messages / month",
    ],
    cta: { label: "Start 14-day trial", href: "/signup?tier=grower" },
    highlight: true,
  },
  {
    name: "Pro",
    price: "₱299",
    unit: "/ month",
    tagline: "Para sa small commercial farms (500+ slots).",
    features: [
      "Lahat sa Grower",
      "Sales + COGS dashboard",
      "CSV export (BIR-ready)",
      "Multi-setup views",
      "1,500 AI messages / month",
    ],
    cta: { label: "Upgrade to Pro", href: "/signup?tier=pro" },
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative border-t border-[color:var(--brand-leaf-100)] bg-white"
    >
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[color:var(--brand-leaf)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-dark)]">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-4xl lg:text-5xl">
            Simple tiers. PayMongo billing.
          </h2>
          <p className="mt-4 text-base text-[color:var(--brand-leaf-deep)]/70 md:text-lg">
            GCash, Maya, or card. ~15% off on yearly. Cancel anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3 md:gap-5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl border bg-white p-7 transition-shadow ${
                t.highlight
                  ? "border-[color:var(--brand-leaf)]/40 shadow-xl ring-1 ring-[color:var(--brand-leaf)]/30"
                  : "border-[color:var(--brand-leaf-100)] shadow-sm hover:shadow-md"
              }`}
            >
              {t.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--brand-leaf)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  Most popular
                </span>
              ) : null}

              <div className="mb-1 text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-dark)]">
                {t.name}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[color:var(--brand-leaf-deep)]">
                  {t.price}
                </span>
                {t.unit ? (
                  <span className="text-sm text-[color:var(--brand-leaf-deep)]/55">
                    {t.unit}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[color:var(--brand-leaf-deep)]/65">
                {t.tagline}
              </p>

              <ul className="mt-6 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[color:var(--brand-leaf-deep)]/85"
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[color:var(--brand-leaf)]/15">
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
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className={`mt-7 w-full ${
                  t.highlight
                    ? "bg-[color:var(--brand-leaf)] text-white hover:bg-[color:var(--brand-leaf-dark)]"
                    : "bg-[color:var(--brand-leaf-deep)] text-white hover:bg-[color:var(--brand-leaf-dark)]"
                }`}
              >
                <Link href={t.cta.href}>{t.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[color:var(--brand-leaf-deep)]/55">
          All tiers include offline-first sync, push notifications, and access
          to the bilingual crop guide.
        </p>
      </div>
    </section>
  )
}
