import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const environment = searchParams.get("environment") || "TT02"

    // Determine base URL based on environment
    let baseUrl: string
    if (environment === "TT02") {
      baseUrl = "https://platform.tt02.altinn.no"
    } else {
      // AT22, AT23, AT24 all use at23 base URL
      baseUrl = "https://platform.at23.altinn.cloud"
    }

    const url = `${baseUrl}/accessmanagement/api/v1/meta/info/accesspackages/export`

    console.log("[v0] Fetching access packages from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch access packages:", response.status, response.statusText)
      return NextResponse.json({ error: "Failed to fetch access packages" }, { status: response.status })
    }

    const data = await response.json()

    // The response is an array of categories, each with areas, each with packages
    const allPackages: Array<{ urn: string; name: string }> = []

    if (Array.isArray(data)) {
      for (const category of data) {
        if (category.areas && Array.isArray(category.areas)) {
          for (const area of category.areas) {
            if (area.packages && Array.isArray(area.packages)) {
              for (const pkg of area.packages) {
                if (pkg.urn) {
                  allPackages.push({
                    urn: pkg.urn,
                    name: pkg.name,
                  })
                }
              }
            }
          }
        }
      }
    }

    console.log("[v0] Access packages fetched successfully:", allPackages.length, "packages")

    return NextResponse.json({ accessPackages: allPackages })
  } catch (error) {
    console.error("[v0] Error fetching access packages:", error)
    return NextResponse.json({ error: "Failed to fetch access packages" }, { status: 500 })
  }
}
