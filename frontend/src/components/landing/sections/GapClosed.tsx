interface Gap {
  gap: string
  how: string
}

const gaps: Gap[] = [
  {
    gap: "No competitor models your physical setup",
    how: "HydroManager encodes DFT slot count, Dutch bucket layout, SNAP config as first-class objects.",
  },
  {
    gap: "No competitor tracks partial batch state",
    how: "User-approved milestones let you log '18 germinated, 2 failed' — not a single current-stage hack.",
  },
  {
    gap: "No agri app localizes for PH",
    how: "Full Tagalog UI. AI chat and log entries accept Tagalog/Taglish natively.",
  },
  {
    gap: "AI chatbots aren't grounded on your real data",
    how: "Retrieval over your pH readings, batch history, inventory. Inline citations — no hallucinations.",
  },
  {
    gap: "No PH hydroponics app has sales-aware features",
    how: "Pro tier links sales directly to batches, computes per-crop COGS, exports BIR-ready CSVs.",
  },
]

export function GapClosed() {
  return (
    <section className="border-t bg-emerald-950/5">
      <div className="container mx-auto px-4 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Gaps no other app closes
          </h2>
          <p className="mt-3 text-muted-foreground">
            We mapped every existing farm-management app and hydroponic app
            serving PH growers. These are the five gaps HydroManager
            specifically fills.
          </p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {gaps.map((g) => (
            <div
              key={g.gap}
              className="rounded-lg border border-emerald-500/20 bg-card p-5"
            >
              <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                ❌ {g.gap}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                ✅ {g.how}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
