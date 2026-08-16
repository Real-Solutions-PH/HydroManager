import path from "node:path"
import dotenv from "dotenv"

// Resolved from the cwd rather than import.meta.url: this package is not
// "type": "module", so import.meta forced the file to be treated as ESM and
// the CommonJS dotenv default import then failed with "exports is not
// defined". Playwright runs from frontend/, so the root .env is one level up.
dotenv.config({ path: path.resolve(process.cwd(), "../.env") })

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is undefined`)
  }
  return value
}

export const firstSuperuser = getEnvVar("FIRST_SUPERUSER")
export const firstSuperuserPassword = getEnvVar("FIRST_SUPERUSER_PASSWORD")
