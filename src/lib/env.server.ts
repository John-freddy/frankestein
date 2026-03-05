const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "ENCRYPTION_KEY",
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

type RuntimeEnv = Record<RequiredEnvVar, string>

function getRequiredEnv(name: RequiredEnvVar): string {
  const value = process.env[name]

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function validateRuntimeEnv(): RuntimeEnv {
  const env = REQUIRED_ENV_VARS.reduce((acc, key) => {
    acc[key] = getRequiredEnv(key)
    return acc
  }, {} as RuntimeEnv)

  try {
    new URL(env.AUTH_URL)
  } catch {
    throw new Error("Invalid AUTH_URL: must be a valid absolute URL")
  }

  if (!env.DATABASE_URL.startsWith("postgresql://") && !env.DATABASE_URL.startsWith("postgres://")) {
    throw new Error("Invalid DATABASE_URL: expected a PostgreSQL connection string")
  }

  if (env.ENCRYPTION_KEY.length < 32) {
    throw new Error("Invalid ENCRYPTION_KEY: expected at least 32 characters")
  }

  return env
}

export const env = validateRuntimeEnv()
