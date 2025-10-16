import { type NextRequest, NextResponse } from "next/server"
import { getMaskinportenToken } from "@/lib/maskinporten"

interface DagligLederResponse {
  foedselsnummer: string
  organisasjonsnummer: string
  organisasjonsnavn: string
}

export async function POST(request: NextRequest) {
  try {
    const { organisasjonsnummer } = await request.json()

    if (!organisasjonsnummer || !/^\d{9}$/.test(organisasjonsnummer)) {
      return NextResponse.json({ error: "Valid 9-digit organisasjonsnummer required" }, { status: 400 })
    }

    console.log("[v0] Fetching Daglig leder for org:", organisasjonsnummer)

    // Get Maskinporten token
    const token = await getMaskinportenToken()
    console.log("[v0] Got Maskinporten token for org-specific Daglig leder search")

    // Fetch data from the Tenor API for specific organization
    const apiUrl = `https://testdata.api.skatteetaten.no/api/testnorge/v2/soek/brreg-er-fr?kql=organisasjonsnummer%3A${organisasjonsnummer}&vis=tenorMetadata&antall=1`
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
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Received data for org:", organisasjonsnummer)

    if (!data.dokumentListe || data.dokumentListe.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const item = data.dokumentListe[0]
    const orgData = JSON.parse(item.tenorMetadata.kildedata)

    // Find the daglig leder from rollegrupper
    const dagligLederGruppe = orgData.rollegrupper?.find((gruppe: any) => gruppe.type?.kode === "DAGL")
    const dagligLederRole = dagligLederGruppe?.roller?.find(
      (rolle: any) => rolle.type?.kode === "DAGL" && rolle.person?.foedselsnummer,
    )

    if (!dagligLederRole?.person?.foedselsnummer) {
      return NextResponse.json({ error: "No daglig leder found for this organization" }, { status: 404 })
    }

    const result: DagligLederResponse = {
      foedselsnummer: dagligLederRole.person.foedselsnummer,
      organisasjonsnummer: orgData.organisasjonsnummer,
      organisasjonsnavn: orgData.navn || "",
    }

    console.log("[v0] Found daglig leder:", result.foedselsnummer)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in daglig-leder-by-org API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch daglig leder data" },
      { status: 500 },
    )
  }
}
