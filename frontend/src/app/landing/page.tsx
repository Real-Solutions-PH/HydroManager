import type { Metadata } from "next"
import { Footer } from "@/components/Common/Footer"
import { Cta } from "@/components/landing/sections/Cta"
import { Features } from "@/components/landing/sections/Features"
import { GapClosed } from "@/components/landing/sections/GapClosed"
import { Hero } from "@/components/landing/sections/Hero"
import { Navbar } from "@/components/landing/sections/Navbar"
import { Pricing } from "@/components/landing/sections/Pricing"

export const metadata: Metadata = {
  title: "HydroManager — Hydroponics farm app for the Philippines",
  description:
    "Setup-aware daily checklist, user-approved milestones, inventory, PH crop guides, and a grounded AI crop assistant. Tagalog-first. PayMongo-ready.",
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <GapClosed />
        <Pricing />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
