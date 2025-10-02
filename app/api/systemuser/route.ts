import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, requestBody, environment, endpoint = "agent", selectedIndividualRights = [] } = await request.json()

    console.log("[v0] Server-side system user creation request")
    console.log("[v0] Environment:", environment)
    console.log("[v0] Endpoint:", endpoint)
    console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

    const getBaseUrl = (env: string) => {
      switch (env) {
        case "tt02":
          return "https://platform.tt02.altinn.no"
        case "at22":
          return "https://platform.at22.altinn.cloud"
        case "at23":
          return "https://platform.at23.altinn.cloud"
        case "at24":
          return "https://platform.at24.altinn.cloud"
        default:
          return "https://platform.tt02.altinn.no"
      }
    }

    const baseUrl = getBaseUrl(environment)

    const url =
      endpoint === "vendor"
        ? `${baseUrl}/authentication/api/v1/systemuser/request/vendor`
        : `${baseUrl}/authentication/api/v1/systemuser/request/vendor/agent`

    console.log("[v0] Making request to:", url)
    console.log("[v0] Using token (first 20 chars):", token.substring(0, 20) + "...")

    const mappedRights = selectedIndividualRights.map((right: { name: string; displayName: string }) => ({
      resource: [
        {
          value: right.name, // Extract the name property instead of treating right as a string
          id: "urn:altinn:resource",
        },
      ],
    }))

    const enhancedRequestBody = {
      ...requestBody,
      rights: mappedRights, // Use lowercase 'rights' instead of 'Rights'
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(enhancedRequestBody),
    })

    console.log("[v0] System user API response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    const contentType = response.headers.get("content-type")
    console.log("[v0] Response content-type:", contentType)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Error response body:", errorText)
      return NextResponse.json(
        { error: `System user creation failed: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.log("[v0] Non-JSON response received:", responseText)
      return NextResponse.json(
        {
          error: `System user creation failed: Expected JSON response but received ${contentType}. Response: ${responseText}`,
        },
        { status: 500 },
      )
    }

    const responseData = await response.json()
    console.log("[v0] System user created successfully:", responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[v0] System user creation error:", error)
    return NextResponse.json(
      { error: `System user creation failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
