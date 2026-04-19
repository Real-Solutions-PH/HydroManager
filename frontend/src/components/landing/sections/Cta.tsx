import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section
      id="cta"
      className="border-t bg-gradient-to-br from-emerald-900 to-emerald-950 text-white"
    >
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-emerald-400/20 bg-emerald-900/50 p-10 text-center shadow-xl backdrop-blur">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Download HydroManager
          </h2>
          <p className="max-w-xl text-emerald-100/80">
            Available on Android and iOS. Web access for desktop use. Works
            offline — syncs the moment you're back online.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400"
            >
              <Link href="/signup">Start free — no card</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-emerald-300/40 bg-transparent text-white hover:bg-emerald-900/60 hover:text-white"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="text-xs text-emerald-200/60">
            Dogfooded on a DFT + Dutch bucket farm in San Luis, Batangas. Kai
            tests every feature on his own plants before it ships.
          </p>
        </div>
      </div>
    </section>
  )
}
