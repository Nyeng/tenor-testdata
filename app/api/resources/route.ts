import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const environment = searchParams.get("env") || "TT02"

    // Determine base URL based on environment
    let baseUrl: string
    if (environment === "TT02") {
      baseUrl = "https://platform.tt02.altinn.no"
    } else if (environment === "AT22") {
      baseUrl = "https://platform.at22.altinn.cloud"
    } else if (environment === "AT23") {
      baseUrl = "https://platform.at23.altinn.cloud"
    } else if (environment === "AT24") {
      baseUrl = "https://platform.at24.altinn.cloud"
    } else {
      baseUrl = "https://platform.tt02.altinn.no"
    }

    // Fetch both GenericAccessResource and AltinnApp resources
    const [genericResponse, appResponse] = await Promise.all([
      fetch(`${baseUrl}/resourceregistry/api/v1/resource/search?resourceType=GenericAccessResource`),
      fetch(`${baseUrl}/resourceregistry/api/v1/resource/search?resourceType=AltinnApp`),
    ])

    if (!genericResponse.ok || !appResponse.ok) {
      throw new Error("Failed to fetch resources from Resource Registry")
    }

    const genericResources = await genericResponse.json()
    const appResources = await appResponse.json()

    // Combine both resource types
    const allResources = [...genericResources, ...appResources]

    // Transform to simplified format
    const resources = allResources.map((resource: any) => ({
      identifier: resource.identifier,
      title: resource.title?.nb || resource.title?.en || resource.identifier,
      description: resource.description?.nb || resource.description?.en || "",
      resourceType: resource.resourceType,
    }))

    return NextResponse.json(resources)
  } catch (error) {
    console.error("[v0] Error fetching resources:", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}
