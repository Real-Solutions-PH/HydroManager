interface Gap {
  gap: string
  how: string
}

const gaps: Gap[] = [
  {
    gap: "No competitor models your physical setup",
    how: "Bot-choy encodes DFT slot count, Dutch Bucket layout, SNAP config as first-class objects.",
  },
  {
    gap: "No competitor tracks partial batch state",
    how: 'User-approved milestones let you log "18 germinated, 2 failed" — not a single current-stage hack.',
  },
  {
    gap: "No agri app localizes for PH",
    how: "Full Tagalog UI. AI chat and log entries accept Tagalog/Taglish natively.",
  },
  {
    gap: "AI chatbots aren't grounded on your real data",
    how: "Retrieval over your pH readings, batch history, inventory. Inline citations — walang hallucination.",
  },
  {
    gap: "No PH hydroponics app has sales features",
    how: "Pro tier links sales directly to batches, computes per-crop COGS, exports BIR-ready CSVs.",
  },
]

export function GapClosed() {
  return (
    <section
      id="why"
      className="relative border-t border-[color:var(--brand-leaf-100)] bg-leaf-gradient"
    >
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-leaf-dark)] backdrop-blur">
            Why Bot-choy
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[color:var(--brand-leaf-deep)] md:text-4xl lg:text-5xl">
            Gaps na walang ibang app na nag-aayos.
          </h2>
          <p className="mt-4 text-base text-[color:var(--brand-leaf-deep)]/75 md:text-lg">
            Inalam namin ang bawat farm-management at hydroponic app na
            ginagamit ng mga Pinoy growers. Ito ang limang puwang na sinasagot
            ng Bot-choy.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:gap-5">
          {gaps.map((g, i) => (
            <article
              key={g.gap}
              className="grid gap-0 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-lg md:grid-cols-2"
            >
              <div className="relative flex flex-col gap-2 border-b border-[color:var(--brand-leaf-100)] bg-[#FFF7F1] p-5 md:border-b-0 md:border-r">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-clay)]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--brand-clay)]/15">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </span>
                  Gap #{i + 1} · Before
                </div>
                <p className="text-sm font-semibold text-[color:var(--brand-leaf-deep)] md:text-base">
                  {g.gap}
                </p>
              </div>

              <div className="relative flex flex-col gap-2 bg-[color:var(--brand-leaf-50)] p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-leaf-dark)]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[color:var(--brand-leaf)]/20 text-[color:var(--brand-leaf-dark)]">
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
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
                  With Bot-choy
                </div>
                <p className="text-sm text-[color:var(--brand-leaf-deep)]/80 md:text-base">
                  {g.how}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
