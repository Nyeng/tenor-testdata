import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { systemId, orgNo, externalRef, environment } = await request.json()

    const username = process.env.ALTINN_USERNAME
    const password = process.env.ALTINN_PASSWORD

    if (!username || !password) {
      return NextResponse.json(
        { error: "Server configuration error: Missing authentication credentials" },
        { status: 500 },
      )
    }

    console.log("[v0] Generating token for byquery - orgNo:", orgNo, "env:", environment)

    const tokenUrl = `https://altinn-testtools-token-generator.azurewebsites.net/api/GetEnterpriseToken?env=${environment}&scopes=altinn:authentication/systemuser.request.write&ttl=60000&orgNo=312605031`

    const tokenResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token generation failed:", tokenResponse.status, errorText)
      return NextResponse.json(
        { error: `Token generation failed: ${tokenResponse.status}` },
        { status: tokenResponse.status },
      )
    }

    const token = await tokenResponse.text()
    console.log("[v0] Token generated successfully for byquery")
    // </CHANGE>

    const apiBase =
      environment === "tt02" ? "https://platform.tt02.altinn.no" : `https://platform.${environment}.altinn.cloud`

    const url = `${apiBase}/authentication/api/v1/systemuser/vendor/byquery?system-id=${systemId}&orgno=${orgNo}&external-ref=${externalRef}`

    console.log("[v0] Fetching system user from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] System user fetch failed:", response.status, errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] System user fetched successfully:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in byquery route:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
