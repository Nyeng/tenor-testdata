import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orgNo, env = "at22" } = await request.json()

    if (!orgNo) {
      return NextResponse.json({ error: "Missing required field: orgNo" }, { status: 400 })
    }

    // Get credentials from environment variables
    const username = process.env.ALTINN_USERNAME
    const password = process.env.ALTINN_PASSWORD

    if (!username || !password) {
      return NextResponse.json(
        { error: "Server configuration error: Missing authentication credentials" },
        { status: 500 },
      )
    }

    console.log("[v0] Token request - orgNo:", orgNo, "env:", env)
    console.log(
      "[v0] Using credentials - username:",
      username ? "SET" : "NOT SET",
      "password:",
      password ? "SET" : "NOT SET",
    )

    const tokenUrl = `https://altinn-testtools-token-generator.azurewebsites.net/api/GetEnterpriseToken?env=${env}&scopes=altinn:authentication/systemuser.request.write&ttl=60000&orgNo=${orgNo}`

    console.log("[v0] Calling token URL:", tokenUrl)

    const response = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Token response status:", response.status, response.statusText)

    if (response.ok) {
      const token = await response.text()
      console.log("[v0] Token generated successfully")
      return NextResponse.json({ token, expiresIn: 60000 })
    } else {
      const errorText = await response.text()
      console.error("[v0] Token generation failed:", response.status, response.statusText)
      console.error("[v0] Error response body:", errorText)
      console.error("[v0] Request details - URL:", tokenUrl)
      console.error("[v0] Request details - Username:", username)
      console.error(
        "[v0] Request details - Auth header:",
        `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      )

      return NextResponse.json(
        { error: `Token generation failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json({ error: "Internal server error during token generation" }, { status: 500 })
  }
}
