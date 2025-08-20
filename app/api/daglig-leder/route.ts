import { type NextRequest, NextResponse } from "next/server"
import { getMaskinportenToken } from "@/lib/maskinporten"

interface DagligLederResponse {
  foedselsnummer: string
  organisasjonsnummer: string
  organisasjonsnavn?: string
}

export async function POST(request: NextRequest) {
  try {
    const { antall } = await request.json()

    if (!antall || antall < 1 || antall > 100) {
      return NextResponse.json({ error: "Antall must be between 1 and 100" }, { status: 400 })
    }

    console.log("[v0] Fetching Daglig leder data with antall:", antall)

    // Get Maskinporten token
    const token = await getMaskinportenToken()
    console.log("[v0] Got Maskinporten token for Daglig leder search")

    // Fetch data from the Daglig leder API
    const apiUrl = `https://testdata.api.skatteetaten.no/api/testnorge/v2/soek/brreg-er-fr?kql=dagligLeder%3A*&vis=tenorMetadata&antall=${antall}`
    console.log("[v0] Making request to:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Daglig leder API error:", response.status, response.statusText)
      throw new Error(`Daglig leder API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Received Daglig leder data, count:", data.dokumentListe?.length)
    console.log("[v0] Response type:", typeof data)

    let items = []
    if (data && data.dokumentListe && Array.isArray(data.dokumentListe)) {
      items = data.dokumentListe
    } else {
      console.error("[v0] Unexpected response structure:", data)
      throw new Error("Expected dokumentListe array in API response")
    }

    console.log("[v0] Extracted items count:", items.length)

    const leaders: DagligLederResponse[] = items
      .map((item: any) => {
        try {
          // Parse the nested JSON in kildedata
          const orgData = JSON.parse(item.tenorMetadata.kildedata)

          // Find the daglig leder from rollegrupper
          const dagligLederGruppe = orgData.rollegrupper?.find((gruppe: any) => gruppe.type?.kode === "DAGL")

          const dagligLederRole = dagligLederGruppe?.roller?.find(
            (rolle: any) => rolle.type?.kode === "DAGL" && rolle.person?.foedselsnummer,
          )

          if (!dagligLederRole?.person?.foedselsnummer) {
            return null
          }

          return {
            foedselsnummer: dagligLederRole.person.foedselsnummer,
            organisasjonsnummer: orgData.organisasjonsnummer || "",
            organisasjonsnavn: orgData.navn || undefined,
          }
        } catch (error) {
          console.error("[v0] Error parsing organization data:", error)
          return null
        }
      })
      .filter(
        (leader: DagligLederResponse | null): leader is DagligLederResponse =>
          leader !== null && leader.foedselsnummer && leader.organisasjonsnummer,
      )

    console.log("[v0] Processed leaders:", leaders.length)

    return NextResponse.json({
      role: "dagligLeder",
      leaders: leaders,
    })
  } catch (error) {
    console.error("[v0] Error in daglig-leder API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch daglig leder data" },
      { status: 500 },
    )
  }
}
