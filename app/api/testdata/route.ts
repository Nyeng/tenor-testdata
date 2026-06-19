import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { role, clientCount } = await request.json()

    console.log("[v0] API called with role:", role, "clientCount:", clientCount)

    // Check if required environment variables are set
    const requiredEnvVars = ["MASKINPORTEN_CLIENT_ID", "MASKINPORTEN_JWK"]
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingVars.length > 0) {
      console.log("[v0] Missing environment variables:", missingVars)
      return NextResponse.json(
        {
          error: `Missing environment variables: ${missingVars.join(", ")}`,
        },
        { status: 400 },
      )
    }

    try {
      console.log("[v0] Attempting to load authentication modules dynamically")
      const { fetchTestDataForRole } = await import("@/lib/testdata")

      console.log("[v0] Modules loaded successfully, attempting real Maskinporten authentication")
      const realData = await fetchTestDataForRole(role, clientCount)
      console.log("[v0] Successfully retrieved real test data:", realData)
      return NextResponse.json(realData)
    } catch (apiError) {
      console.error("[v0] Real API failed (module loading or authentication):", apiError)

      // No mock fallback: surface the real failure so it is never mistaken for real data.
      return NextResponse.json(
        {
          error: apiError instanceof Error ? apiError.message : "Failed to fetch test data",
          details: apiError instanceof Error ? apiError.stack : "Unknown error",
        },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error("[v0] Critical error in API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch test data",
        details: error instanceof Error ? error.stack : "Unknown error",
      },
      { status: 500 },
    )
  }
}
