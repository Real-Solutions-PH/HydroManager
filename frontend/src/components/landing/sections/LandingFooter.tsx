import Image from "next/image"
import Link from "next/link"

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Pricing", href: "#pricing" },
      { label: "Crop guides", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#why" },
      { label: "Built in Batangas", href: "#cta" },
      { label: "Contact", href: "mailto:hello@bot-choy.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data handling", href: "/privacy#data" },
    ],
  },
]

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[color:var(--brand-leaf-100)] bg-[color:var(--brand-leaf-50)]/60">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[color:var(--brand-leaf)] shadow-sm">
                <Image
                  src="/assets/character/saying_hi_halfbody.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                />
              </span>
              <div className="leading-tight">
                <div className="text-base font-bold text-[color:var(--brand-leaf-deep)]">
                  Bot-choy
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--brand-leaf-dark)]/70">
                  Hydroponics Manager
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-[color:var(--brand-leaf-deep)]/65">
              Setup-aware hydroponics management. Tagalog-first. Built and
              dogfooded on a real Pinoy farm.
            </p>
          </div>

          {groups.map((g) => (
            <div key={g.title}>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-leaf-dark)]">
                {g.title}
              </div>
              <ul className="space-y-2 text-sm">
                {g.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[color:var(--brand-leaf-deep)]/70 transition-colors hover:text-[color:var(--brand-leaf-dark)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[color:var(--brand-leaf-100)] pt-6 text-xs text-[color:var(--brand-leaf-deep)]/55 sm:flex-row">
          <p>© {year} Bot-choy · Made in San Luis, Batangas 🇵🇭</p>
          <p>Setup-aware · Offline-first · Tagalog-first</p>
        </div>
      </div>
    </footer>
  )
}
