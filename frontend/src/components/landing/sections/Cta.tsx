import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppStoreBadge, PlayStoreBadge } from "./StoreBadges"

export function Cta() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden border-t border-[color:var(--brand-leaf-dark)]/30 bg-leaf-gradient-dark text-white"
    >
      <div
        className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-[color:var(--brand-leaf-light)]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[color:var(--brand-clay)]/15 blur-3xl"
        aria-hidden
      />

      <div className="container relative mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md md:grid-cols-[1fr_280px] md:items-center md:gap-12 md:p-12">
          <div>
            <span className="inline-block rounded-full bg-[color:var(--brand-leaf-light)]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-light)]">
              Available now
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              I-download na ang
              <br />
              <span className="text-[color:var(--brand-leaf-light)]">
                Bot-choy
              </span>
              .
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/75 md:text-lg">
              Android, iOS, at web — works offline, sync once you're back
              online. Walang card required para sa free tier.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <AppStoreBadge variant="light" />
              <PlayStoreBadge variant="light" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[color:var(--brand-leaf)] text-white shadow-lg hover:bg-[color:var(--brand-leaf-dark)]"
              >
                <Link href="/signup">Start free — no card</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-white/55">
              Dogfooded on a DFT + Dutch Bucket farm in San Luis, Batangas.
              Every feature ships only after Kai tests it on his own plants.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-[40%] bg-[color:var(--brand-leaf-light)]/15 blur-2xl"
              aria-hidden
            />
            <Image
              src="/assets/character/celebrate.png"
              alt="Bot-choy celebrating"
              width={280}
              height={280}
              className="relative h-56 w-56 object-contain drop-shadow-2xl md:h-72 md:w-72"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
