"use client"

import Link from "next/link"

type Variant = "light" | "dark"

interface BadgeProps {
  variant?: Variant
  href?: string
  className?: string
}

const baseClasses =
  "group inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

function variantClasses(variant: Variant) {
  return variant === "dark"
    ? "bg-black/90 text-white ring-1 ring-white/10 hover:bg-black focus-visible:ring-white/40"
    : "bg-white text-[color:var(--brand-leaf-deep)] ring-1 ring-black/5 hover:bg-white/95 focus-visible:ring-[color:var(--brand-leaf)]/50"
}

export function AppStoreBadge({
  variant = "dark",
  href = "#cta",
  className,
}: BadgeProps) {
  return (
    <Link
      href={href}
      aria-label="Download Bot-choy on the App Store"
      className={`${baseClasses} ${variantClasses(variant)} ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M17.05 12.04c-.03-3.07 2.51-4.55 2.62-4.62-1.43-2.09-3.65-2.38-4.44-2.41-1.89-.19-3.69 1.11-4.65 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.98 1.2-5.04 3.06-2.15 3.73-.55 9.25 1.55 12.27 1.03 1.49 2.25 3.15 3.85 3.09 1.55-.06 2.13-1 4-1 1.86 0 2.39 1 4.02.97 1.66-.03 2.71-1.51 3.72-3.01 1.17-1.72 1.65-3.39 1.67-3.48-.04-.02-3.2-1.23-3.23-4.87M14.07 3.36c.85-1.03 1.42-2.46 1.26-3.88-1.22.05-2.7.81-3.58 1.84-.78.91-1.47 2.37-1.29 3.77 1.36.1 2.75-.69 3.61-1.73" />
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-70">
          Download on the
        </span>
        <span className="text-base font-semibold">App Store</span>
      </div>
    </Link>
  )
}

export function PlayStoreBadge({
  variant = "dark",
  href = "#cta",
  className,
}: BadgeProps) {
  return (
    <Link
      href={href}
      aria-label="Get Bot-choy on Google Play"
      className={`${baseClasses} ${variantClasses(variant)} ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3.6 1.7a1.6 1.6 0 0 0-.6 1.27v18.06A1.6 1.6 0 0 0 3.6 22.3l10.45-10.3z"
          fill="#5C8A3A"
        />
        <path
          d="M17.6 8.45 14.05 12l3.55 3.55 3.92-2.27c1.1-.64 1.1-2.23 0-2.87z"
          fill="#E0B23A"
        />
        <path
          d="m14.05 12-10.45 10.3a1.6 1.6 0 0 0 1.7.16l12.3-7.11z"
          fill="#D49050"
        />
        <path
          d="M5.3 1.54a1.6 1.6 0 0 0-1.7.16l10.45 10.3 3.55-3.55z"
          fill="#4FB8E8"
        />
      </svg>
      <div className="flex flex-col leading-tight text-left">
        <span className="text-[10px] uppercase tracking-wider opacity-70">
          Get it on
        </span>
        <span className="text-base font-semibold">Google Play</span>
      </div>
    </Link>
  )
}
