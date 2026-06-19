import { searchTenor, hentFoedselsnummerForDagligLeder, hentOrganisasjonsnavn } from "./tenor"

export interface TestDataResult {
  role: string
  orgnummer: string
  dagligLeder: {
    foedselsnummer: string
    organisasjonsnummer: string
    organisasjonsnavn?: string
  }
  clients: Array<{
    navn: string
    organisasjonsnummer: string
  }>
}

interface RoleConfig {
  /** BRREG role-group code as found in kildedata.rollegrupper[].type.kode */
  code: string
  /** Organisasjonsform of the companies that *have* this role (the clients). */
  searchForm: string
}

// NB: role relationships (regnskapsfører/revisor/forretningsfører) live inside each
// company's kildedata.rollegrupper but are NOT searchable via Tenor KQL. So we cannot
// query "companies served by firm X" directly. Instead we scan a broad set of companies
// of the relevant organisasjonsform, read each one's role groups, and group them by the
// agent firm (the virksomhet holding the role). This yields real relationships: every
// returned client genuinely has the returned firm as its regnskapsfører/revisor/etc.
const roleConfig: Record<string, RoleConfig> = {
  // Forretningsfører is assigned to eierseksjonssameier (ESEK), not AS.
  forretningsfoerer: { code: "FFØR", searchForm: "ESEK" },
  revisor: { code: "REVI", searchForm: "AS" },
  regnskapsfoerere: { code: "REGN", searchForm: "AS" },
}

const SCAN_PAGE_SIZE = 100
const SCAN_PAGES = 3

interface Client {
  organisasjonsnummer: string
  navn: string
}

function extractVirksomhetOrgnr(virksomhet: any): string | null {
  if (!virksomhet) return null
  if (typeof virksomhet.organisasjonsnummer === "string" && /^\d{9}$/.test(virksomhet.organisasjonsnummer)) {
    return virksomhet.organisasjonsnummer
  }
  return JSON.stringify(virksomhet).match(/\b\d{9}\b/)?.[0] ?? null
}

/**
 * Scan companies of the given organisasjonsform and build a map of
 * agent firm orgnr -> the clients that have it in the given role.
 */
async function scanAgentRelationships(searchForm: string, roleCode: string): Promise<Map<string, Map<string, Client>>> {
  const agents = new Map<string, Map<string, Client>>()

  for (let page = 0; page < SCAN_PAGES; page++) {
    const seed = Math.floor(Math.random() * 1_000_000)
    const response = await searchTenor({
      query: `organisasjonsform.kode:${searchForm}`,
      antall: SCAN_PAGE_SIZE,
      includeTenorMetadata: true,
      seed,
    })

    for (const dokument of response?.dokumentListe ?? []) {
      let kildedata: any
      try {
        kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
      } catch {
        continue
      }

      const clientOrgnr = kildedata.organisasjonsnummer
      const clientNavn = kildedata.navn
      if (!/^\d{9}$/.test(clientOrgnr) || typeof clientNavn !== "string") continue

      for (const gruppe of kildedata.rollegrupper ?? []) {
        if (gruppe.type?.kode !== roleCode) continue
        for (const rolle of gruppe.roller ?? []) {
          const agentOrgnr = extractVirksomhetOrgnr(rolle.virksomhet)
          if (!agentOrgnr) continue
          if (!agents.has(agentOrgnr)) agents.set(agentOrgnr, new Map())
          agents.get(agentOrgnr)!.set(clientOrgnr, { organisasjonsnummer: clientOrgnr, navn: clientNavn })
        }
      }
    }
  }

  return agents
}

export async function fetchTestDataForRole(
  roleKey: "forretningsfoerer" | "revisor" | "regnskapsfoerere",
  clientCount = 3,
  organisasjonsform: string | null = null,
): Promise<TestDataResult> {
  const config = roleConfig[roleKey]
  if (!config) {
    throw new Error(`Unknown role: ${roleKey}`)
  }

  const maxClientCount = 100 // Tenor API limit to prevent 400 errors
  const limitedClientCount = Math.min(clientCount, maxClientCount)
  const searchForm = organisasjonsform?.trim() || config.searchForm

  // 1. Scan companies and group by the agent firm holding the role.
  const agents = await scanAgentRelationships(searchForm, config.code)

  // 2. Prefer firms with the most clients found.
  const sortedAgents = [...agents.entries()].sort((a, b) => b[1].size - a[1].size)
  if (sortedAgents.length === 0) {
    throw new Error(`No ${roleKey} relationships found in Tenor test data (searched organisasjonsform ${searchForm})`)
  }

  // 3. Pick the first agent whose own organization resolves a daglig leder.
  for (const [agentOrgnr, clientMap] of sortedAgents) {
    const orgResponse = await searchTenor({ query: `organisasjonsnummer:${agentOrgnr}` })
    const foedselsnummer = hentFoedselsnummerForDagligLeder(orgResponse)
    if (!foedselsnummer) continue

    const organisasjonsnavn = hentOrganisasjonsnavn(orgResponse) || undefined
    const clients = [...clientMap.values()].slice(0, limitedClientCount)

    return {
      role: roleKey,
      orgnummer: agentOrgnr,
      dagligLeder: {
        foedselsnummer,
        organisasjonsnummer: agentOrgnr,
        organisasjonsnavn,
      },
      clients,
    }
  }

  throw new Error(`Found ${roleKey} firms but none had a resolvable daglig leder`)
}
