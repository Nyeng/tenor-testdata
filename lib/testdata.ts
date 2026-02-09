import {
  searchTenor,
  hentOrgnummerForRolle,
  hentFoedselsnummerForDagligLeder,
  hentVirksomheterFraKildedata,
  hentOrganisasjonsnavn, // Added import for organization name extraction
} from "./tenor"

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

const roleMapper = {
  forretningsfoerer: {
    name: "forretningsfoerer",
    code: "FFØR",
    customertype: "forretningsfoerer",
  },
  revisor: { name: "revisorer", code: "REVI", customertype: "revisorer" },
  regnskapsfoerere: { name: "regnskapsfoerere", code: "REGN", customertype: "regnskapsfoerere" },
}

/**
 * Fetches test data for an organization that is both a Regnskapsfører AND a Revisor.
 * Uses a Tenor query that requires both roles to be present on the same org.
 */
export async function fetchTestDataForCombinedRole(
  clientCount = 3,
  organisasjonsform: string | null = null,
): Promise<TestDataResult> {
  const maxClientCount = 100
  const limitedClientCount = Math.min(clientCount, maxClientCount)

  if (clientCount > maxClientCount) {
    console.warn(`[v0] Client count ${clientCount} exceeds API limit, using ${maxClientCount} instead`)
  }

  // Search for an org that has both regnskapsfoerere AND revisorer roles
  const combinedQuery = buildQuery("regnskapsfoerere:* AND revisorer:*", organisasjonsform || undefined)
  const roleResponse = await searchTenor({ query: combinedQuery })

  // Extract org number from the regnskapsfører role
  const orgnummer = hentOrgnummerForRolle(roleResponse, "REGN")
  if (!orgnummer) {
    throw new Error("No organization found with both Regnskapsfører and Revisor roles")
  }

  // Look up the org to get its daglig leder
  const orgResponse = await searchTenor({
    query: `organisasjonsnummer:${orgnummer}`,
  })

  const foedselsnummer = hentFoedselsnummerForDagligLeder(orgResponse)
  if (!foedselsnummer) {
    throw new Error(`No managing director found for organization: ${orgnummer}`)
  }

  const organisasjonsnavn =
    hentOrganisasjonsnavn(orgResponse) || "Regnskapsfører og Revisor AS"

  // Search for customers using regnskapsfoerere relation
  const customerQuery = buildQuery(`regnskapsfoerere:${orgnummer}`)
  const customerResponse = await searchTenor({
    query: customerQuery,
    antall: limitedClientCount,
    includeTenorMetadata: true,
  })

  const clients = hentVirksomheterFraKildedata(customerResponse)

  return {
    role: "regnskapsfoererOgRevisor",
    orgnummer,
    dagligLeder: {
      foedselsnummer,
      organisasjonsnummer: orgnummer,
      organisasjonsnavn,
    },
    clients,
  }
}

function buildQuery(base: string, orgTypeCode?: string): string {
  if (orgTypeCode?.trim()) {
    return `${base} AND organisasjonsform.kode:${orgTypeCode.trim()}`
  }
  return base
}

export async function fetchTestDataForRole(
  roleKey: "forretningsfoerer" | "revisor" | "regnskapsfoerere",
  clientCount = 3,
  organisasjonsform: string | null = null,
): Promise<TestDataResult> {
  const type = roleMapper[roleKey]
  if (!type) {
    throw new Error(`Unknown role: ${roleKey}`)
  }

  const maxClientCount = 100 // Tenor API limit to prevent 400 errors
  const limitedClientCount = Math.min(clientCount, maxClientCount)

  if (clientCount > maxClientCount) {
    console.warn(`[v0] Client count ${clientCount} exceeds API limit, using ${maxClientCount} instead`)
  }

  // 1. Search for role
  const roleQuery = buildQuery(`${type.name}:*`, organisasjonsform || undefined)
  const roleResponse = await searchTenor({ query: roleQuery })
  const orgnummer = hentOrgnummerForRolle(roleResponse, type.code)

  if (!orgnummer) {
    throw new Error(`No organization found for role: ${roleKey}`)
  }

  // 2. Look up organization to get managing director
  const orgResponse = await searchTenor({
    query: `organisasjonsnummer:${orgnummer}`,
  })

  const foedselsnummer = hentFoedselsnummerForDagligLeder(orgResponse)
  if (!foedselsnummer) {
    throw new Error(`No managing director found for organization: ${orgnummer}`)
  }

  const organisasjonsnavn =
    hentOrganisasjonsnavn(orgResponse) || `${type.name.charAt(0).toUpperCase() + type.name.slice(1)} AS`

  // 3. Search for customers
  const customerQuery = buildQuery(`${type.customertype}:${orgnummer}`)
  const customerResponse = await searchTenor({
    query: customerQuery,
    antall: limitedClientCount, // Use limited count instead of raw clientCount
    includeTenorMetadata: true,
  })

  const clients = hentVirksomheterFraKildedata(customerResponse)

  return {
    role: roleKey,
    orgnummer,
    dagligLeder: {
      foedselsnummer,
      organisasjonsnummer: orgnummer,
      organisasjonsnavn,
    },
    clients,
  }
}
