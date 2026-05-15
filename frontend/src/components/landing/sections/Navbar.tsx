"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why Bot-choy" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        scrolled
          ? "border-b border-[color:var(--brand-leaf-100)]/80 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/landing"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[color:var(--brand-leaf)] shadow-sm ring-1 ring-[color:var(--brand-leaf-dark)]/20">
            <Image
              src="/assets/character/saying_hi_halfbody.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-cover"
              priority
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base text-[color:var(--brand-leaf-deep)]">
              Bot-choy
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--brand-leaf-dark)]/70">
              Hydroponics Manager
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-foreground/70 transition-colors hover:text-[color:var(--brand-leaf-dark)]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-[color:var(--brand-leaf)] text-white shadow-sm hover:bg-[color:var(--brand-leaf-dark)]"
          >
            <Link href="#cta">Get the app</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
