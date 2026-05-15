import Image from "next/image"

interface Step {
  n: string
  title: string
  body: string
  image: string
  alt: string
  imageBg: string
}

const steps: Step[] = [
  {
    n: "01",
    title: "I-setup mo ang farm mo",
    body: "Snap 2 setup photos. Tell Bot-choy your system — DFT, NFT, Dutch Bucket, Kratky, or SNAP. Slot count + crop mapping nakahanda na.",
    image: "/assets/character/recording.png",
    alt: "Bot-choy mascot setting up",
    imageBg: "linear-gradient(135deg, #DDECC9, #F2F8EC)",
  },
  {
    n: "02",
    title: "Get a daily checklist na alam ang setup mo",
    body: "Setup-aware tasks na nag-aapprove ng milestones — partial counts, photos, notes. Audit log per batch, walang nababasura.",
    image: "/assets/character/reading.png",
    alt: "Bot-choy mascot reading checklist",
    imageBg: "linear-gradient(135deg, #FFE3CD, #FFF1E2)",
  },
  {
    n: "03",
    title: "Tanungin ang AI assistant — sa Tagalog",
    body: "Grounded sa inyong pH readings, batch history, inventory. Inline citations, walang hallucination. Sumasagot kahit Taglish.",
    image: "/assets/character/saying_hi.png",
    alt: "Bot-choy mascot answering",
    imageBg: "linear-gradient(135deg, #D4ECF8, #EAF6FB)",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative overflow-hidden border-t border-[color:var(--brand-leaf-100)] bg-white"
    >
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-[color:var(--brand-clay)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-clay)]">
            How it works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-4xl lg:text-5xl">
            Tatlong hakbang lang.
          </h2>
          <p className="mt-4 text-[color:var(--brand-leaf-deep)]/70 md:text-lg">
            Mula sa unang seed hanggang sa unang sale — Bot-choy is with you.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl space-y-12 md:space-y-20">
          <span
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[color:var(--brand-leaf)]/40 via-[color:var(--brand-clay)]/40 to-[color:var(--brand-water)]/40 md:block"
            aria-hidden
          />

          {steps.map((s, i) => (
            <div
              key={s.n}
              className={`relative grid items-center gap-8 md:grid-cols-2 md:gap-14 ${
                i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="relative">
                <div
                  className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-xl ring-1 ring-black/5"
                  style={{ background: s.imageBg }}
                >
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 768px) 384px, 100vw"
                    className="object-contain p-6"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[color:var(--brand-leaf-deep)] shadow-sm backdrop-blur">
                    Step {s.n}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-leaf-dark)]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--brand-leaf)] text-xs font-bold text-white shadow-md">
                    {i + 1}
                  </span>
                  <span className="uppercase tracking-wider text-xs text-[color:var(--brand-leaf-dark)]/70">
                    Step {s.n}
                  </span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[color:var(--brand-leaf-deep)]/70 md:text-lg">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
