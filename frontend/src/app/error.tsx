"use client"

import ErrorComponent from "@/components/Common/ErrorComponent"

// Named AppError rather than Error: Next.js resolves this boundary from the
// default export regardless of its name, and `Error` shadows the global
// (biome lint/suspicious/noShadowRestrictedNames).
export default function AppError() {
  return <ErrorComponent />
}
