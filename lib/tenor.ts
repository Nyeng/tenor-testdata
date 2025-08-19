import { generateAccessToken } from "./maskinporten"

const TENOR_BASE_URL = "https://testdata.api.skatteetaten.no"
const TENOR_PATH = "/api/testnorge/v2/soek/brreg-er-fr"

interface TenorSearchOptions {
  query: string
  antall?: number
  includeTenorMetadata?: boolean
}

interface TenorDocument {
  tenorMetadata: {
    id: string
    kildedata: string
  }
}

interface TenorResponse {
  dokumentListe: TenorDocument[]
}

export async function searchTenor({
  query,
  antall = 1,
  includeTenorMetadata = true,
}: TenorSearchOptions): Promise<TenorResponse | null> {
  try {
    const token = await generateAccessToken()

    let url = `${TENOR_BASE_URL}${TENOR_PATH}?kql=${encodeURIComponent(query)}`
    if (includeTenorMetadata) {
      url += "&vis=tenorMetadata"
    }
    url += `&antall=${antall}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Tenor API error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Tenor search failed:", error)
    return null
  }
}

export function hentOrgnummerForRolle(responseJson: TenorResponse | null, role: string): string | null {
  const dokument = responseJson?.dokumentListe?.[0]
  if (!dokument) {
    console.warn("Ingen dokumenter funnet")
    return null
  }

  try {
    const kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
    const rollegrupper = kildedata.rollegrupper || []

    for (const gruppe of rollegrupper) {
      if (gruppe.type?.kode === role) {
        for (const rolle of gruppe.roller || []) {
          const raw = JSON.stringify(rolle.virksomhet || {})
          const match = raw.match(/\b\d{9}\b/)
          if (match) {
            return match[0]
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing kildedata:", error)
  }

  console.warn(`Ingen organisasjonsnummer funnet for rolle: ${role}`)
  return null
}

export function hentFoedselsnummerForDagligLeder(responseJson: TenorResponse | null): string | null {
  const dokumentListe = responseJson?.dokumentListe || []

  for (const dokument of dokumentListe) {
    try {
      const kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
      const rollegrupper = kildedata.rollegrupper || []

      for (const gruppe of rollegrupper) {
        if (gruppe.type?.kode === "DAGL") {
          for (const rolle of gruppe.roller || []) {
            const fnr = rolle.person?.foedselsnummer
            if (fnr) {
              return fnr
            }
          }
        }
      }
    } catch (error) {
      console.warn("Ugyldig kildedata i dokument, hopper over", error)
    }
  }

  return null
}

export function hentVirksomheterFraKildedata(
  responseJson: TenorResponse | null,
): Array<{ organisasjonsnummer: string; navn: string }> {
  const dokumenter = responseJson?.dokumentListe || []
  const resultater: Array<{ organisasjonsnummer: string; navn: string }> = []

  for (const dokument of dokumenter) {
    try {
      const kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
      const orgnr = kildedata.organisasjonsnummer
      const navn = kildedata.navn

      if (/^\d{9}$/.test(orgnr) && typeof navn === "string") {
        resultater.push({ organisasjonsnummer: orgnr, navn })
      }
    } catch (error) {
      console.warn("Feil ved parsing av kildedata i ett dokument:", error)
    }
  }

  return resultater
}

export function hentOrganisasjonsnavn(responseJson: TenorResponse | null): string | null {
  const dokument = responseJson?.dokumentListe?.[0]
  if (!dokument) {
    return null
  }

  try {
    const kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
    return kildedata.navn || null
  } catch (error) {
    console.error("Error parsing kildedata for organization name:", error)
    return null
  }
}
