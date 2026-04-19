import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #4CAF50 0%, transparent 40%), radial-gradient(circle at 80% 60%, #2D7D46 0%, transparent 40%)",
        }}
      />
      <div className="container relative mx-auto flex flex-col items-center gap-6 px-4 py-24 text-center md:py-32">
        <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-900/40 px-3 py-1 text-xs text-emerald-200 backdrop-blur">
          HydroManager V1 · Built for PH hydroponics
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Manage your hydroponic farm like a pro.
        </h1>
        <p className="max-w-2xl text-lg text-emerald-100/80">
          Setup-aware task lists. User-approved milestone tracking. AI crop
          assistant grounded on <em>your</em> farm data. Tagalog na, Taglish
          na, kaya ng HydroManager.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-400"
          >
            <Link href="/signup">Start free</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-emerald-300/40 bg-transparent text-white hover:bg-emerald-900/40 hover:text-white"
          >
            <Link href="#features">See features</Link>
          </Button>
        </div>
        <p className="text-xs text-emerald-200/60">
          Free tier: 1 setup, 3 active batches, 10 AI messages/month. No card
          required.
        </p>
      </div>
    </section>
  )
}
