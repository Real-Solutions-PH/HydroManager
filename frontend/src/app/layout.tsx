import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "HydroManager — Hydroponics farm app",
  description:
    "Setup-aware hydroponics management for PH growers. Milestone approvals, crop guides, grounded AI assistant.",
  icons: {
    icon: "/assets/images/favicon.png",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
