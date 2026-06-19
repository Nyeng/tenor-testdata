import { SignJWT, importJWK } from "jose"

/**
 * Maskinporten token client.
 *
 * Structure inspired by Altinn's Playwright integration helper:
 * https://github.com/Altinn/altinn-access-management-frontend/blob/main/playwright/api-requests/MaskinportenToken.ts
 *
 * The private key is supplied as a plain JWK JSON string (the `kid` lives
 * inside the JWK), rather than a base64-encoded blob with a separate KID
 * environment variable.
 */

const MASKINPORTEN_CONFIG = {
  audience: "https://test.maskinporten.no/",
  tokenEndpoint: "https://test.maskinporten.no/token",
  defaultScope: "skatteetaten:testnorge/testdata.read",
}

interface TokenCache {
  token: string
  expiresAt: number
}

/** JWK fields that can confuse `importJWK` — stripped before import. */
function cleanJWK(jwk: Record<string, unknown>) {
  const cleaned = { ...jwk }
  delete cleaned.oth // "other primes info"
  delete cleaned.key_ops
  delete cleaned.use
  return cleaned
}

export class MaskinportenToken {
  private readonly clientId: string
  private readonly jwk: Record<string, unknown>
  private readonly tokenCache = new Map<string, TokenCache>()

  /**
   * @param clientIdEnv Env var holding the Maskinporten client ID. Default: `MASKINPORTEN_CLIENT_ID`.
   * @param jwkEnv      Env var holding the private key as a JWK JSON string. Default: `MASKINPORTEN_JWK`.
   */
  constructor(clientIdEnv = "MASKINPORTEN_CLIENT_ID", jwkEnv = "MASKINPORTEN_JWK") {
    const clientId = process.env[clientIdEnv]
    const jwkString = process.env[jwkEnv]

    if (!clientId) {
      throw new Error(`Missing environment variable: ${clientIdEnv}`)
    }
    if (!jwkString) {
      throw new Error(`Missing environment variable: ${jwkEnv}`)
    }

    this.clientId = clientId.trim()

    try {
      this.jwk = cleanJWK(JSON.parse(jwkString))
    } catch (error) {
      throw new Error(
        `Failed to parse ${jwkEnv} as JSON: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /** Build and sign the JWT grant assertion sent to Maskinporten. */
  private async createGrantAssertion(scope: string, now: number): Promise<string> {
    const alg = (this.jwk.alg as string) ?? "RS256"
    const privateKey = await importJWK(this.jwk, alg)
    const iat = Math.floor(now / 1000)

    return new SignJWT({
      aud: MASKINPORTEN_CONFIG.audience,
      iss: this.clientId,
      scope,
      iat,
      exp: iat + 120,
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({
        alg,
        typ: "JWT",
        kid: this.jwk.kid as string | undefined,
      })
      .sign(privateKey)
  }

  /** Fetch an access token for the given scope, using a short-lived cache. */
  async getToken(scope: string = MASKINPORTEN_CONFIG.defaultScope): Promise<string> {
    const now = Date.now()
    const cacheKey = `${this.clientId}:${scope}`

    const cached = this.tokenCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.token
    }

    const assertion = await this.createGrantAssertion(scope, now)

    const response = await fetch(MASKINPORTEN_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[maskinporten] Token request failed:", response.status, errorText)
      throw new Error(`Maskinporten token request failed: ${response.status} - ${errorText}`)
    }

    const tokenData = await response.json()
    const token: string = tokenData.access_token

    // Cache until the token's own expiry (with a small safety margin).
    const decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
    const expiresAt = decoded.exp * 1000 - 5_000
    this.tokenCache.set(cacheKey, { token, expiresAt })

    return token
  }

  getClientId(): string {
    return this.clientId
  }
}

// --- Module-level convenience API (back-compat with existing callers) ---

let instance: MaskinportenToken | null = null

function getInstance(): MaskinportenToken {
  if (!instance) {
    instance = new MaskinportenToken()
  }
  return instance
}

export async function generateAccessToken(scope?: string): Promise<string> {
  return getInstance().getToken(scope)
}

export const getMaskinportenToken = generateAccessToken
