import { searchTenor, hentFoedselsnummerForDagligLeder, hentOrganisasjonsnavn } from "./tenor"

export interface TestDataResult {
  role: string
  orgnummer: string
  dagligLeder: {
    foedselsnummer: string
    organisasjonsnummer: string
    organisasjonsnavn?: string
  }
}

interface RoleConfig {
  /** BRREG role-group code as found in kildedata.rollegrupper[].type.kode */
  code: string
  /** Organisasjonsform of the companies that *have* this role. */
  searchForm: string
}

// NB: role relationships (regnskapsfører/revisor/forretningsfører) live inside each
// company's kildedata.rollegrupper but are NOT searchable via Tenor KQL. So we cannot
// query "who is a regnskapsfører" directly. Instead we scan a broad set of companies
// of the relevant organisasjonsform, read their role groups, and collect the agent
// firms (the virksomhet holding the role). We then return one such firm and its
// daglig leder.
const roleConfig: Record<string, RoleConfig> = {
  // Forretningsfører is assigned to eierseksjonssameier (ESEK), not AS.
  forretningsfoerer: { code: "FFØR", searchForm: "ESEK" },
  revisor: { code: "REVI", searchForm: "AS" },
  regnskapsfoerere: { code: "REGN", searchForm: "AS" },
}

const SCAN_PAGE_SIZE = 100
// Two parallel pages give a large pool of distinct agent firms (100+ for AS,
// ~35 for ESEK) while keeping latency low — wall time is the slowest single
// page, and the max of fewer parallel requests is faster on average.
const SCAN_PAGES = 2

function extractVirksomhetOrgnr(virksomhet: any): string | null {
  if (!virksomhet) return null
  if (typeof virksomhet.organisasjonsnummer === "string" && /^\d{9}$/.test(virksomhet.organisasjonsnummer)) {
    return virksomhet.organisasjonsnummer
  }
  return JSON.stringify(virksomhet).match(/\b\d{9}\b/)?.[0] ?? null
}

/** Fisher–Yates shuffle (returns a new array). */
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Scan companies of the given organisasjonsform and collect the distinct agent
 * firm orgnrs that hold the given role.
 *
 * Pages run in parallel (each with its own random seed) so a multi-page scan
 * costs roughly one round-trip instead of N sequential ones.
 */
async function scanAgentOrgnrs(searchForm: string, roleCode: string): Promise<string[]> {
  const agents = new Set<string>()

  const pages = await Promise.all(
    Array.from({ length: SCAN_PAGES }, () =>
      searchTenor({
        query: `organisasjonsform.kode:${searchForm}`,
        antall: SCAN_PAGE_SIZE,
        includeTenorMetadata: true,
        seed: Math.floor(Math.random() * 1_000_000),
      }),
    ),
  )

  for (const response of pages) {
    for (const dokument of response?.dokumentListe ?? []) {
      let kildedata: any
      try {
        kildedata = JSON.parse(dokument.tenorMetadata.kildedata)
      } catch {
        continue
      }

      for (const gruppe of kildedata.rollegrupper ?? []) {
        if (gruppe.type?.kode !== roleCode) continue
        for (const rolle of gruppe.roller ?? []) {
          const agentOrgnr = extractVirksomhetOrgnr(rolle.virksomhet)
          if (agentOrgnr) agents.add(agentOrgnr)
        }
      }
    }
  }

  return [...agents]
}

export async function fetchTestDataForRole(
  roleKey: "forretningsfoerer" | "revisor" | "regnskapsfoerere",
  organisasjonsform: string | null = null,
): Promise<TestDataResult> {
  const config = roleConfig[roleKey]
  if (!config) {
    throw new Error(`Unknown role: ${roleKey}`)
  }

  const searchForm = organisasjonsform?.trim() || config.searchForm

  // 1. Scan companies and collect the agent firms holding the role.
  const agentOrgnrs = await scanAgentOrgnrs(searchForm, config.code)
  if (agentOrgnrs.length === 0) {
    throw new Error(`No ${roleKey} relationships found in Tenor test data (searched organisasjonsform ${searchForm})`)
  }

  // 2. Pick a random firm whose organization resolves a daglig leder.
  for (const agentOrgnr of shuffle(agentOrgnrs)) {
    const orgResponse = await searchTenor({ query: `organisasjonsnummer:${agentOrgnr}` })
    const foedselsnummer = hentFoedselsnummerForDagligLeder(orgResponse)
    if (!foedselsnummer) continue

    return {
      role: roleKey,
      orgnummer: agentOrgnr,
      dagligLeder: {
        foedselsnummer,
        organisasjonsnummer: agentOrgnr,
        organisasjonsnavn: hentOrganisasjonsnavn(orgResponse) || undefined,
      },
    }
  }

  throw new Error(`Found ${roleKey} firms but none had a resolvable daglig leder`)
}
