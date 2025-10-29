import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { requestBody, environment } = await request.json()

    const vendorOrgNo = requestBody.vendor.ID.split(":")[1]
    console.log("[v0] Extracted vendor org number:", vendorOrgNo)

    const tokenUrl = `https://altinn-testtools-token-generator.azurewebsites.net/api/GetEnterpriseToken?env=${environment}&scopes=altinn:authentication/systemregister.write&ttl=60000&orgNo=${vendorOrgNo}`

    const tokenResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.ALTINN_USERNAME}:${process.env.ALTINN_PASSWORD}`).toString("base64")}`,
      },
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token generation failed:", errorText)
      return NextResponse.json({ error: "Failed to generate token" }, { status: tokenResponse.status })
    }

    const token = await tokenResponse.text()
    console.log("[v0] Token generated successfully with systemregister.write scope for vendor org:", vendorOrgNo)

    const apiBase =
      environment === "tt02" ? "https://platform.tt02.altinn.no" : `https://platform.${environment}.altinn.cloud`

    const url = `${apiBase}/authentication/api/v1/systemregister/vendor`

    console.log("[v0] Creating system at:", url)
    console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] System creation response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] System creation failed:", errorText)
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] System created successfully:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in systemregister route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
