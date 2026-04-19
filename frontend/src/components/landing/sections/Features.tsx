import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Feature {
  title: string
  description: string
  icon: string
}

const features: Feature[] = [
  {
    title: "Setup-aware task list",
    icon: "🧭",
    description:
      "Daily checklist generated from your physical setup: DFT, NFT, Dutch Bucket, Kratky, SNAP. Every task knows your slots.",
  },
  {
    title: "User-approved milestones",
    icon: "🌱",
    description:
      "Nothing auto-advances. You confirm each stage — partial counts, photos, notes. Perfect audit log per batch.",
  },
  {
    title: "Inventory + low-stock alerts",
    icon: "📦",
    description:
      "Track seeds, nutrients, rockwool, pH up/down. Crop-aware reorder hints. Push notifications when you're running out.",
  },
  {
    title: "Top 20 PH crop guides",
    icon: "📚",
    description:
      "Pechay, kangkong, lettuce, basil, tomato, ampalaya and more. Bilingual (EN/TL), calibrated on a real Batangas farm.",
  },
  {
    title: "AI crop assistant (grounded)",
    icon: "🤖",
    description:
      "Tanungin mo: 'Bakit nanginig ang pechay sa slot 3?' It answers using YOUR pH readings, batch history and inventory.",
  },
  {
    title: "Sales + COGS (Pro)",
    icon: "💰",
    description:
      "Log sales per batch. See net margin by crop, by setup, by month. CSV export for BIR/accounting.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built for the way Filipino growers actually work
          </h2>
          <p className="mt-3 text-muted-foreground">
            Setup-aware, offline-first, Tagalog-first. Unlike generic farm
            apps, HydroManager understands your slot count, your batches, and
            your hardware — not just your crops.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 text-3xl">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
