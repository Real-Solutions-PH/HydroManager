import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Tier {
  name: string
  price: string
  tagline: string
  features: string[]
  cta: { label: string; href: string }
  highlight?: boolean
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "PHP 0",
    tagline: "For hobbyists and home growers.",
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
    price: "PHP 199/mo",
    tagline: "For micro-commercial operators (50–300 slots).",
    features: [
      "Up to 5 setups",
      "Unlimited active batches",
      "Full crop guide + calibration notes",
      "Inventory management + low-stock alerts",
      "Setup-aware daily checklist",
      "150 AI messages / month",
    ],
    cta: { label: "Start 14-day trial", href: "/signup?tier=grower" },
    highlight: true,
  },
  {
    name: "Pro",
    price: "PHP 299/mo",
    tagline: "For small commercial farms (500+ slots).",
    features: [
      "Everything in Grower",
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
    <section id="pricing" className="border-t">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple tiers. PayMongo billing.
          </h2>
          <p className="mt-3 text-muted-foreground">
            GCash, Maya, or card. ~15% off on yearly. Cancel anytime.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((t) => (
            <Card
              key={t.name}
              className={
                t.highlight
                  ? "relative border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/40"
                  : ""
              }
            >
              {t.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              ) : null}
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{t.name}</span>
                  <span className="text-xl font-bold">{t.price}</span>
                </CardTitle>
                <CardDescription>{t.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link href={t.cta.href}>{t.cta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
