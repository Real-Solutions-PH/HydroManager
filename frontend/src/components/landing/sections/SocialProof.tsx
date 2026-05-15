const stats = [
  {
    value: "5",
    label: "Hydro setup types supported",
    sub: "DFT · NFT · DB · Kratky · SNAP",
  },
  {
    value: "20+",
    label: "PH crop guides",
    sub: "Calibrated on a Batangas farm",
  },
  {
    value: "100%",
    label: "User-approved milestones",
    sub: "Nothing auto-advances",
  },
  {
    value: "EN · TL",
    label: "Bilingual AI assistant",
    sub: "Tagalog na, Taglish na",
  },
]

const setups = [
  { label: "DFT", color: "#8FBE5C" },
  { label: "NFT", color: "#4FB8E8" },
  { label: "Dutch Bucket", color: "#D49050" },
  { label: "Kratky", color: "#A66BC4" },
  { label: "SNAP", color: "#E0B23A" },
]

export function SocialProof() {
  return (
    <section className="relative border-y border-[color:var(--brand-leaf-100)] bg-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-wrap items-center justify-center gap-2 pb-8 text-xs font-medium text-[color:var(--brand-leaf-deep)]/60">
          <span className="mr-1 uppercase tracking-wider">Works with</span>
          {setups.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-[color:var(--brand-leaf-50)] px-3 py-1 text-[color:var(--brand-leaf-deep)]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl bg-[color:var(--brand-leaf-100)] sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-1 bg-white p-6 transition-colors hover:bg-[color:var(--brand-leaf-50)]"
            >
              <div className="text-3xl font-bold tracking-tight text-[color:var(--brand-leaf-dark)] md:text-4xl">
                {s.value}
              </div>
              <div className="text-sm font-semibold text-[color:var(--brand-leaf-deep)]">
                {s.label}
              </div>
              <div className="text-xs text-[color:var(--brand-leaf-deep)]/55">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
