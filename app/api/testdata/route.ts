import { type NextRequest, NextResponse } from "next/server"

interface TestDataResult {
  role: string
  orgnummer: string
  dagligLeder: {
    foedselsnummer: string
    organisasjonsnummer: string
    organisasjonsnavn?: string
  }
  clients: Array<{
    navn: string
    organisasjonsnummer: string
  }>
}

async function getMockTestData(role: string, clientCount: number): Promise<TestDataResult> {
  const roleMapping: Record<string, string> = {
    forretningsfoerer: "Forretningsfører",
    revisor: "Revisor",
    regnskapsfoerere: "Regnskapsfører",
  }

  const orgNumber = `${Math.floor(Math.random() * 900000000) + 100000000}`

  return {
    role,
    orgnummer: orgNumber,
    dagligLeder: {
      foedselsnummer: `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
      organisasjonsnummer: orgNumber,
      organisasjonsnavn: `${roleMapping[role] || "Ukjent"} AS`,
    },
    clients: Array.from({ length: clientCount }, (_, i) => ({
      navn: `Klient ${i + 1} AS`,
      organisasjonsnummer: `${Math.floor(Math.random() * 900000000) + 100000000}`,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { role, clientCount } = await request.json()

    console.log("[v0] API called with role:", role, "clientCount:", clientCount)

    // Check if required environment variables are set
    const requiredEnvVars = ["MACHINEPORTEN_KID", "ENCODED_JWK", "MACHINEPORTEN_CLIENT_ID"]
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

      const testData = await getMockTestData(role, clientCount)
      console.log("[v0] Generated fallback mock test data:", testData)

      return NextResponse.json({
        ...testData,
        warning: `Real API failed: ${apiError instanceof Error ? apiError.message : "Unknown error"}. Using mock data.`,
        error_details: apiError instanceof Error ? apiError.stack : "Unknown error",
      })
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
