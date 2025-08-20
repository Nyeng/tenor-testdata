import { SignJWT, importJWK } from "jose"

const MASKINPORTEN_CONFIG = {
  audience: "https://test.maskinporten.no/",
  tokenEndpoint: "https://test.maskinporten.no/token",
  scope: "skatteetaten:testnorge/testdata.read",
}

interface TokenCache {
  token: string
  expiresAt: number
}

const tokenCache = new Map<string, TokenCache>()

function cleanJWK(jwk: any) {
  const cleanedJwk = { ...jwk }
  delete cleanedJwk.oth // Remove "other primes info" parameter
  delete cleanedJwk.key_ops // Remove key operations to avoid conflicts
  delete cleanedJwk.use // Remove use parameter that might conflict
  return cleanedJwk
}

export async function generateAccessToken(): Promise<string> {
  const now = Date.now()
  const clientId = process.env.MACHINEPORTEN_CLIENT_ID!
  const cacheKey = `${clientId}:${MASKINPORTEN_CONFIG.scope}`

  // Check cache
  const cached = tokenCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.token
  }

  try {
    const jwkData = JSON.parse(Buffer.from(process.env.ENCODED_JWK!, "base64").toString())
    const cleanedJwk = cleanJWK(jwkData)

    const privateKey = await importJWK(cleanedJwk, "RS256")

    const payload = {
      aud: MASKINPORTEN_CONFIG.audience,
      scope: MASKINPORTEN_CONFIG.scope,
      iss: clientId,
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 120,
      jti: crypto.randomUUID(),
    }

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({
        alg: "RS256",
        typ: "JWT",
        kid: process.env.MACHINEPORTEN_KID!,
      })
      .sign(privateKey)

    // Request token
    const response = await fetch(MASKINPORTEN_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Maskinporten token request failed:", response.status, errorText)
      throw new Error(`Maskinporten token request failed: ${response.status} - ${errorText}`)
    }

    const tokenData = await response.json()
    const token = tokenData.access_token

    // Decode token to get expiration
    const payload_decoded = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
    const expiresAt = payload_decoded.exp * 1000

    tokenCache.set(cacheKey, { token, expiresAt })

    return token
  } catch (error) {
    console.error("[v0] JWT creation failed:", error)
    throw new Error(`JWT creation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
