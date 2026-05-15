import type { Metadata } from "next"
import { Cta } from "@/components/landing/sections/Cta"
import { Features } from "@/components/landing/sections/Features"
import { GapClosed } from "@/components/landing/sections/GapClosed"
import { Hero } from "@/components/landing/sections/Hero"
import { HowItWorks } from "@/components/landing/sections/HowItWorks"
import { LandingFooter } from "@/components/landing/sections/LandingFooter"
import { Navbar } from "@/components/landing/sections/Navbar"
import { Pricing } from "@/components/landing/sections/Pricing"
import { SocialProof } from "@/components/landing/sections/SocialProof"

export const metadata: Metadata = {
  title: "Bot-choy — Hydroponics Manager for Pinoy growers",
  description:
    "Setup-aware daily checklist, user-approved milestones, inventory, PH crop guides, and a grounded AI crop assistant. Tagalog-first. Available on App Store and Google Play.",
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <GapClosed />
        <Pricing />
        <Cta />
      </main>
      <LandingFooter />
    </div>
  )
}
