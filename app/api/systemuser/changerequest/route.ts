import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, requestBody, environment, systemUserId, correlationId } = body

    const apiBase =
      environment === "tt02" ? "https://platform.tt02.altinn.no" : `https://platform.${environment}.altinn.cloud`

    const url = `${apiBase}/authentication/api/v1/systemuser/changerequest/vendor?correlation-id=${correlationId}&system-user-id=${systemUserId}`

    console.log("[v0] Change request URL:", url)
    console.log("[v0] Change request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Change request failed:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] Change request successful:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Change request error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
