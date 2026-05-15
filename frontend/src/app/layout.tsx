import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import type { ReactNode } from "react"
import { Providers } from "@/components/providers"
import "./globals.css"

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Bot-choy - Hydroponics Manager",
  description:
    "Setup-aware hydroponics management for PH growers. Milestone approvals, crop guides, grounded AI assistant.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/images/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={display.variable}>
      <body
        className="antialiased"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
