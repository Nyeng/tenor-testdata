"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Building2,
  Users,
  User,
  Settings,
  Search,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  UserCheck,
  Copy,
  X,
  Package,
  Download,
} from "lucide-react"

type Role = "forretningsfoerer" | "revisor" | "regnskapsfoerere" | "dagligLeder"
type Environment = "at22" | "tt02"

interface DagligLederData {
  role: "dagligLeder"
  leaders: Array<{
    foedselsnummer: string
    organisasjonsnummer: string
    organisasjonsnavn?: string
  }>
}

interface TestData {
  role: Exclude<Role, "dagligLeder">
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

interface AccessPackage {
  urn: string
  displayName: string
}

const accessPackages: AccessPackage[] = [
  { urn: "urn:altinn:accesspackage:ansvarlig-revisor", displayName: "Ansvarlig revisor" },
  { urn: "urn:altinn:accesspackage:forretningsforer-eiendom", displayName: "Forretningsfører eiendom" },
  { urn: "urn:altinn:accesspackage:regnskapsforer-lonn", displayName: "Regnskapsfører lønn" },
  { urn: "urn:altinn:accesspackage:konkursbo-lesetilgang", displayName: "Konkursbo lesetilgang" },
  { urn: "urn:altinn:accesspackage:konkursbo-skrivetilgang", displayName: "Konkursbo skrivetilgang" },
  { urn: "urn:altinn:accesspackage:jordbruk", displayName: "Jordbruk" },
  { urn: "urn:altinn:accesspackage:dyrehold", displayName: "Dyrehold" },
  { urn: "urn:altinn:accesspackage:reindrift", displayName: "Reindrift" },
  { urn: "urn:altinn:accesspackage:jakt-og-viltstell", displayName: "Jakt og viltstell" },
  { urn: "urn:altinn:accesspackage:skogbruk", displayName: "Skogbruk" },
  { urn: "urn:altinn:accesspackage:fiske", displayName: "Fiske" },
  { urn: "urn:altinn:accesspackage:akvakultur", displayName: "Akvakultur" },
  { urn: "urn:altinn:accesspackage:byggesoknad", displayName: "Byggesøknad" },
  { urn: "urn:altinn:accesspackage:plansak", displayName: "Plansak" },
  { urn: "urn:altinn:accesspackage:motta-nabo-og-planvarsel", displayName: "Motta nabo- og planvarsel" },
  { urn: "urn:altinn:accesspackage:oppforing-bygg-anlegg", displayName: "Oppføring bygg/anlegg" },
  { urn: "urn:altinn:accesspackage:kjop-og-salg-eiendom", displayName: "Kjøp og salg eiendom" },
  { urn: "urn:altinn:accesspackage:utleie-eiendom", displayName: "Utleie eiendom" },
  { urn: "urn:altinn:accesspackage:eiendomsmegler", displayName: "Eiendomsmegler" },
  { urn: "urn:altinn:accesspackage:tinglysing-eiendom", displayName: "Tinglysing eiendom" },
  { urn: "urn:altinn:accesspackage:transport-i-ror", displayName: "Transport i rør" },
  { urn: "urn:altinn:accesspackage:veitransport", displayName: "Veitransport" },
  { urn: "urn:altinn:accesspackage:sjofart", displayName: "Sjøfart" },
  { urn: "urn:altinn:accesspackage:lufttransport", displayName: "Lufttransport" },
  { urn: "urn:altinn:accesspackage:jernbanetransport", displayName: "Jernbanetransport" },
  {
    urn: "urn:altinn:accesspackage:lagring-og-andre-tjenester-tilknyttet-transport",
    displayName: "Lagring og andre tjenester tilknyttet transport",
  },
  { urn: "urn:altinn:accesspackage:kommuneoverlege", displayName: "Kommuneoverlege" },
  {
    urn: "urn:altinn:accesspackage:helsetjenester-personopplysinger-saerlig-kategori",
    displayName: "Helsetjenester personopplysninger særlig kategori",
  },
  { urn: "urn:altinn:accesspackage:helsetjenester", displayName: "Helsetjenester" },
  {
    urn: "urn:altinn:accesspackage:pleie-omsorgstjenester-i-institusjon",
    displayName: "Pleie- og omsorgstjenester i institusjon",
  },
  {
    urn: "urn:altinn:accesspackage:sosiale-omsorgstjenester-uten-botilbud-og-flyktningemottak",
    displayName: "Sosiale omsorgstjenester uten botilbud og flyktningemottak",
  },
  { urn: "urn:altinn:accesspackage:familievern", displayName: "Familievern" },
  { urn: "urn:altinn:accesspackage:barnevern", displayName: "Barnevern" },
  { urn: "urn:altinn:accesspackage:godkjenning-av-personell", displayName: "Godkjenning av personell" },
  {
    urn: "urn:altinn:accesspackage:godkjenning-av-utdanningsvirksomhet",
    displayName: "Godkjenning av utdanningsvirksomhet",
  },
  {
    urn: "urn:altinn:accesspackage:hoyere-utdanning-og-hoyere-yrkesfaglig-utdanning",
    displayName: "Høyere utdanning og høyere yrkesfaglig utdanning",
  },
  { urn: "urn:altinn:accesspackage:sfo-leder", displayName: "SFO-leder" },
  { urn: "urn:altinn:accesspackage:ppt-leder", displayName: "PPT-leder" },
  { urn: "urn:altinn:accesspackage:opplaeringskontorleder", displayName: "Opplæringskontorleder" },
  { urn: "urn:altinn:accesspackage:skoleleder", displayName: "Skoleleder" },
  { urn: "urn:altinn:accesspackage:skoleeier", displayName: "Skoleeier" },
  {
    urn: "urn:altinn:accesspackage:statsforvalter-skole-og-opplearing",
    displayName: "Statsforvalter skole og opplæring",
  },
  { urn: "urn:altinn:accesspackage:statsforvalter-barnehage", displayName: "Statsforvalter barnehage" },
  { urn: "urn:altinn:accesspackage:barnehagemyndighet", displayName: "Barnehagemyndighet" },
  { urn: "urn:altinn:accesspackage:barnehageleder", displayName: "Barnehageleder" },
  { urn: "urn:altinn:accesspackage:barnehageeier", displayName: "Barnehageeier" },
  {
    urn: "urn:altinn:accesspackage:elektrisitet-produsere-overfore-distrubere",
    displayName: "Elektrisitet produsere/overføre/distribuere",
  },
  { urn: "urn:altinn:accesspackage:damp-varmtvann", displayName: "Damp/varmtvann" },
  { urn: "urn:altinn:accesspackage:vann-kilde-rense-distrubere", displayName: "Vann kilde/rense/distribuere" },
  { urn: "urn:altinn:accesspackage:samle-behandle-avlopsvann", displayName: "Samle/behandle avløpsvann" },
  { urn: "urn:altinn:accesspackage:avfall-behandle-gjenvinne", displayName: "Avfall behandle/gjenvinne" },
  { urn: "urn:altinn:accesspackage:miljorydding-rensing", displayName: "Miljørydding/rensing" },
  { urn: "urn:altinn:accesspackage:utvinning-raaolje-naturgass-kull", displayName: "Utvinning råolje/naturgass/kull" },
  {
    urn: "urn:altinn:accesspackage:naeringsmidler-drikkevarer-og-tobakk",
    displayName: "Næringsmidler/drikkevarer og tobakk",
  },
  { urn: "urn:altinn:accesspackage:tekstiler-klaer-laervarer", displayName: "Tekstiler/klær/lærvarer" },
  { urn: "urn:altinn:accesspackage:trelast-trevarer-papirvarer", displayName: "Trelast/trevarer/papirvarer" },
  { urn: "urn:altinn:accesspackage:trykkerier-reproduksjon-opptak", displayName: "Trykkerier/reproduksjon/opptak" },
  {
    urn: "urn:altinn:accesspackage:oljeraffinering-kjemisk-farmasoytisk-industri",
    displayName: "Oljeraffinering/kjemisk/farmasøytisk industri",
  },
  {
    urn: "urn:altinn:accesspackage:gummi-plast-og-ikkemetallholdige-mineralprodukter",
    displayName: "Gummi/plast og ikke-metallholdige mineralprodukter",
  },
  { urn: "urn:altinn:accesspackage:metaller-og-mineraler", displayName: "Metaller og mineraler" },
  {
    urn: "urn:altinn:accesspackage:metallvarer-elektrisk-utstyr-og-maskiner",
    displayName: "Metallvarer/elektrisk utstyr og maskiner",
  },
  { urn: "urn:altinn:accesspackage:verft-og-andre-transportmidler", displayName: "Verft og andre transportmidler" },
  { urn: "urn:altinn:accesspackage:mobler-og-annen-industri", displayName: "Møbler og annen industri" },
  {
    urn: "urn:altinn:accesspackage:reparasjon-og-installasjon-av-maskiner-og-utstyr",
    displayName: "Reparasjon og installasjon av maskiner og utstyr",
  },
  { urn: "urn:altinn:accesspackage:bergverk", displayName: "Bergverk" },
  { urn: "urn:altinn:accesspackage:kunst-og-underholdning", displayName: "Kunst og underholdning" },
  {
    urn: "urn:altinn:accesspackage:biblioteker-museer-arkiver-og-annen-kultur",
    displayName: "Biblioteker/museer/arkiver og annen kultur",
  },
  { urn: "urn:altinn:accesspackage:lotteri-og-spill", displayName: "Lotteri og spill" },
  { urn: "urn:altinn:accesspackage:sport-og-fritid", displayName: "Sport og fritid" },
  { urn: "urn:altinn:accesspackage:fornoyelser", displayName: "Fornøyelser" },
  { urn: "urn:altinn:accesspackage:politikk", displayName: "Politikk" },
  { urn: "urn:altinn:accesspackage:varehandel", displayName: "Varehandel" },
  { urn: "urn:altinn:accesspackage:overnatting", displayName: "Overnatting" },
  { urn: "urn:altinn:accesspackage:servering", displayName: "Servering" },
  { urn: "urn:altinn:accesspackage:post-og-telekommunikasjon", displayName: "Post og telekommunikasjon" },
  { urn: "urn:altinn:accesspackage:informasjon-og-kommunikasjon", displayName: "Informasjon og kommunikasjon" },
  { urn: "urn:altinn:accesspackage:finansiering-og-forsikring", displayName: "Finansiering og forsikring" },
  { urn: "urn:altinn:accesspackage:annen-tjenesteyting", displayName: "Annen tjenesteyting" },
  { urn: "urn:altinn:accesspackage:skatt-naering", displayName: "Skatt næring" },
  { urn: "urn:altinn:accesspackage:skattegrunnlag", displayName: "Skattegrunnlag" },
  { urn: "urn:altinn:accesspackage:merverdiavgift", displayName: "Merverdiavgift" },
  { urn: "urn:altinn:accesspackage:motorvognavgift", displayName: "Motorvognavgift" },
  { urn: "urn:altinn:accesspackage:regnskap-okonomi-rapport", displayName: "Regnskap/økonomi/rapport" },
  { urn: "urn:altinn:accesspackage:krav-og-utlegg", displayName: "Krav og utlegg" },
  { urn: "urn:altinn:accesspackage:reviorattesterer", displayName: "Revisor/attesterer" },
  { urn: "urn:altinn:accesspackage:saeravgifter", displayName: "Særavgifter" },
  { urn: "urn:altinn:accesspackage:kreditt-og-oppgjoer", displayName: "Kreditt og oppgjør" },
  { urn: "urn:altinn:accesspackage:toll", displayName: "Toll" },
  { urn: "urn:altinn:accesspackage:ansettelsesforhold", displayName: "Ansettelsesforhold" },
  { urn: "urn:altinn:accesspackage:lonn", displayName: "Lønn" },
  { urn: "urn:altinn:accesspackage:a-ordning", displayName: "A-ordning" },
  { urn: "urn:altinn:accesspackage:pensjon", displayName: "Pensjon" },
  { urn: "urn:altinn:accesspackage:sykefravaer", displayName: "Sykefravær" },
  { urn: "urn:altinn:accesspackage:permisjon", displayName: "Permisjon" },
  { urn: "urn:altinn:accesspackage:renovasjon", displayName: "Renovasjon" },
  {
    urn: "urn:altinn:accesspackage:miljorydding-miljorensing-og-lignende",
    displayName: "Miljørydding/miljørensing og lignende",
  },
  { urn: "urn:altinn:accesspackage:baerekraft", displayName: "Bærekraft" },
  { urn: "urn:altinn:accesspackage:sikkerhet-og-internkontroll", displayName: "Sikkerhet og internkontroll" },
  { urn: "urn:altinn:accesspackage:ulykke", displayName: "Ulykke" },
  { urn: "urn:altinn:accesspackage:yrkesskade", displayName: "Yrkesskade" },
  {
    urn: "urn:altinn:accesspackage:post-til-virksomheten-med-taushetsbelagt-innhold",
    displayName: "Post til virksomheten med taushetsbelagt innhold",
  },
  { urn: "urn:altinn:accesspackage:ordinaer-post-til-virksomheten", displayName: "Ordinær post til virksomheten" },
  { urn: "urn:altinn:accesspackage:generelle-helfotjenester", displayName: "Generelle helsetjenester" },
  { urn: "urn:altinn:accesspackage:helfo-saerlig-kategori", displayName: "Helfo særlig kategori" },
  {
    urn: "urn:altinn:accesspackage:starte-drive-endre-avikle-virksomhet",
    displayName: "Starte/drive/endre/avvikle virksomhet",
  },
  { urn: "urn:altinn:accesspackage:aksjer-og-eierforhold", displayName: "Aksjer og eierforhold" },
  { urn: "urn:altinn:accesspackage:attester", displayName: "Attester" },
  { urn: "urn:altinn:accesspackage:dokumentbasert-tilsyn", displayName: "Dokumentbasert tilsyn" },
  { urn: "urn:altinn:accesspackage:infrastruktur", displayName: "Infrastruktur" },
  { urn: "urn:altinn:accesspackage:patent-varemerke-design", displayName: "Patent/varemerke/design" },
  { urn: "urn:altinn:accesspackage:tilskudd-stotte-erstatning", displayName: "Tilskudd/støtte/erstatning" },
  { urn: "urn:altinn:accesspackage:mine-sider-kommune", displayName: "Mine sider kommune" },
  { urn: "urn:altinn:accesspackage:politi-og-domstol", displayName: "Politi og domstol" },
  { urn: "urn:altinn:accesspackage:rapportering-statistikk", displayName: "Rapportering/statistikk" },
  { urn: "urn:altinn:accesspackage:forskning", displayName: "Forskning" },
  { urn: "urn:altinn:accesspackage:folkeregister", displayName: "Folkeregister" },
  { urn: "urn:altinn:accesspackage:maskinporten-scopes", displayName: "Maskinporten scopes" },
  { urn: "urn:altinn:accesspackage:maskinlesbare-hendelser", displayName: "Maskinlesbare hendelser" },
  { urn: "urn:altinn:accesspackage:maskinporten-scopes-nuf", displayName: "Maskinporten scopes NUF" },
]

interface SystemUserResponse {
  id: string
  externalRef: string
  systemId: string
  partyOrgNo: string
  accessPackages: Array<{
    urn: string
  }>
  status: string
  redirectUrl: string
  confirmUrl: string
}

const accessPackageMapping = {
  revisor: {
    urn: "urn:altinn:accesspackage:ansvarlig-revisor",
    displayName: "Ansvarlig revisor",
  },
  forretningsfoerer: {
    urn: "urn:altinn:accesspackage:forretningsforer-eiendom",
    displayName: "Forretningsfører eiendom",
  },
  regnskapsfoerere: {
    urn: "urn:altinn:accesspackage:regnskapsforer-lonn",
    displayName: "Regnskapsfører lønn",
  },
}

const roleConfig = {
  forretningsfoerer: {
    name: "Forretningsfører",
    description: "Administrerer forretningsvirksomhet",
    color: "bg-blue-500",
    icon: Building2,
  },
  revisor: {
    name: "Revisor",
    description: "Utfører revisjonstjenester",
    color: "bg-green-500",
    icon: Settings,
  },
  regnskapsfoerere: {
    name: "Regnskapsfører",
    description: "Håndterer regnskapsføring",
    color: "bg-purple-500",
    icon: Users,
  },
  dagligLeder: {
    name: "Daglig leder",
    description: "Daglig leder av virksomhet",
    color: "bg-orange-500",
    icon: UserCheck,
  },
}

export default function TestDataInterface() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [testData, setTestData] = useState<TestData | null>(null)
  const [dagligLederData, setDagligLederData] = useState<DagligLederData | null>(null)
  const [clientCount, setClientCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envVarsReady, setEnvVarsReady] = useState(false)

  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>("at22")
  const [systemUserModalOpen, setSystemUserModalOpen] = useState(false)
  const [systemUserLoading, setSystemUserLoading] = useState(false)
  const [systemUserResponse, setSystemUserResponse] = useState<SystemUserResponse | null>(null)
  const [systemUserError, setSystemUserError] = useState<string | null>(null)

  const [selectedLeader, setSelectedLeader] = useState<DagligLederData["leaders"][0] | null>(null)
  const [selectedAccessPackages, setSelectedAccessPackages] = useState<AccessPackage[]>([])
  const [accessPackageSearch, setAccessPackageSearch] = useState("")
  const [virksomhetsbrukerModalOpen, setVirksomhetsbrukerModalOpen] = useState(false)
  const [virksomhetsbrukerLoading, setVirksomhetsbrukerLoading] = useState(false)
  const [virksomhetsbrukerResponse, setVirksomhetsbrukerResponse] = useState<SystemUserResponse | null>(null)
  const [virksomhetsbrukerError, setVirksomhetsbrukerError] = useState<string | null>(null)

  const [accessPackageDropdownOpen, setAccessPackageDropdownOpen] = useState(false)
  const [isCreatingSystemUser, setIsCreatingSystemUser] = useState(false)

  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewRequestBody, setPreviewRequestBody] = useState<any>(null)
  const [showAccessPackages, setShowAccessPackages] = useState(false)

  const filteredAccessPackages = accessPackages.filter(
    (pkg) => pkg && pkg.displayName && pkg.displayName.toLowerCase().includes(accessPackageSearch.toLowerCase()),
  )

  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/testdata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "forretningsfoerer", clientCount: 1 }),
        })

        if (response.status !== 400) {
          setEnvVarsReady(true)
        }
      } catch (error) {
        console.log("[v0] Environment variables not ready yet")
        setEnvVarsReady(false)
      }
    }

    checkEnvVars()
  }, [])

  const handleFetchTestData = async () => {
    if (!selectedRole) return

    setLoading(true)
    setError(null)
    setTestData(null)
    setDagligLederData(null)

    try {
      if (selectedRole === "dagligLeder") {
        console.log("[v0] Fetching Daglig leder data with count:", clientCount)

        const response = await fetch("/api/daglig-leder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            antall: 100,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch daglig leder data")
        }

        const data = await response.json()
        console.log("[v0] Received daglig leder data:", data)
        setDagligLederData(data)
      } else {
        const clientCount = 100
        console.log("[v0] Calling API with role:", selectedRole, "clientCount:", clientCount)

        const response = await fetch("/api/testdata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: selectedRole,
            clientCount: clientCount,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch test data")
        }

        const data = await response.json()
        console.log("[v0] Received test data:", data)
        setTestData(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Feil ved henting av testdata"
      setError(errorMessage)
      console.error("[v0] Error fetching test data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewSystemUser = () => {
    if (!testData || !selectedRole || selectedRole === "dagligLeder") return

    const requestBody = {
      externalRef: crypto.randomUUID(),
      systemId: "312605031_SystemtilgangKlientDelegering",
      partyOrgNo: testData.dagligLeder.organisasjonsnummer,
      accessPackages: [{ urn: accessPackageMapping[selectedRole].urn }],
      redirectUrl: "",
    }

    setPreviewRequestBody(requestBody)
    setShowPreviewModal(true)
  }

  const handleCreateSystemUser = async () => {
    if (!testData || !selectedRole || selectedRole === "dagligLeder") return

    setSystemUserModalOpen(true)
    setSystemUserLoading(true)
    setSystemUserError(null)
    setSystemUserResponse(null)
    setIsCreatingSystemUser(true)

    try {
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgNo: "312605031",
          env: selectedEnvironment,
        }),
      })

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.json()
        throw new Error(`Token generation failed: ${tokenError.error}`)
      }

      const { token } = await tokenResponse.json()
      console.log("[v0] Token generated successfully, length:", token?.length || 0)

      const systemUserRequest = {
        externalRef: crypto.randomUUID(),
        systemId: "312605031_SystemtilgangKlientDelegering",
        partyOrgNo: testData.dagligLeder.organisasjonsnummer,
        accessPackages: [{ urn: accessPackageMapping[selectedRole].urn }],
        redirectUrl: "",
      }

      console.log("[v0] Making system user request via server-side API")
      console.log("[v0] System user request body:", JSON.stringify(systemUserRequest, null, 2))

      const systemUserResponse = await fetch("/api/systemuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          requestBody: systemUserRequest,
          environment: selectedEnvironment,
        }),
      })

      if (!systemUserResponse.ok) {
        const errorData = await systemUserResponse.json()
        throw new Error(errorData.error || "System user creation failed")
      }

      const result = await systemUserResponse.json()
      console.log("[v0] System user created successfully:", result)
      setSystemUserResponse(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Feil ved opprettelse av systembruker"
      setSystemUserError(errorMessage)
      console.error("[v0] System user creation error:", err)
    } finally {
      setSystemUserLoading(false)
      setIsCreatingSystemUser(false)
    }
  }

  const handlePreviewVirksomhetsbruker = (leader: DagligLederData["leaders"][0]) => {
    if (selectedAccessPackages.length === 0) {
      setVirksomhetsbrukerError("Tilgangspakke må velges før du kan se eksempel-forespørsel")
      return
    }

    const requestBody = {
      systemId: "312605031_Virksomhetsbruker",
      partyOrgNo: leader.organisasjonsnummer,
      externalRef: crypto.randomUUID(),
      redirectUrl: "",
      accessPackages: selectedAccessPackages.map((pkg) => ({ urn: pkg.urn })),
    }

    setPreviewRequestBody(requestBody)
    setShowPreviewModal(true)
  }

  const handleCreateVirksomhetsbruker = async (leader: DagligLederData["leaders"][0]) => {
    if (selectedAccessPackages.length === 0) {
      setSelectedLeader(leader)
      setVirksomhetsbrukerModalOpen(true)
      setVirksomhetsbrukerLoading(false)
      setVirksomhetsbrukerError("Tilgangspakke må velges før du kan opprette virksomhetsbruker")
      setVirksomhetsbrukerResponse(null)
      return
    }

    setSelectedLeader(leader)
    setVirksomhetsbrukerModalOpen(true)
    setVirksomhetsbrukerLoading(true)
    setVirksomhetsbrukerError(null)
    setVirksomhetsbrukerResponse(null)

    try {
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgNo: "312605031",
          env: selectedEnvironment,
        }),
      })

      if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.json()
        throw new Error(`Token generation failed: ${tokenError.error}`)
      }

      const { token } = await tokenResponse.json()
      console.log("[v0] Token generated successfully for Virksomhetsbruker, length:", token?.length || 0)

      const virksomhetsbrukerRequest = {
        systemId: "312605031_Virksomhetsbruker",
        partyOrgNo: leader.organisasjonsnummer,
        externalRef: crypto.randomUUID(),
        redirectUrl: "",
        accessPackages: selectedAccessPackages.map((pkg) => ({ urn: pkg.urn })),
      }

      console.log("[v0] Making Virksomhetsbruker request via server-side API")
      console.log("[v0] Virksomhetsbruker request body:", JSON.stringify(virksomhetsbrukerRequest, null, 2))

      const virksomhetsbrukerResponse = await fetch("/api/systemuser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          requestBody: virksomhetsbrukerRequest,
          environment: selectedEnvironment,
        }),
      })

      if (!virksomhetsbrukerResponse.ok) {
        const errorData = await virksomhetsbrukerResponse.json()
        throw new Error(errorData.error || "Virksomhetsbruker creation failed")
      }

      const result = await virksomhetsbrukerResponse.json()
      console.log("[v0] Virksomhetsbruker created successfully:", result)
      setVirksomhetsbrukerResponse(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Feil ved opprettelse av virksomhetsbruker"
      setVirksomhetsbrukerError(errorMessage)
      console.error("[v0] Virksomhetsbruker creation error:", err)
    } finally {
      setVirksomhetsbrukerLoading(false)
    }
  }

  const removeAccessPackage = (packageToRemove: AccessPackage) => {
    setSelectedAccessPackages((prev) => prev.filter((pkg) => pkg.urn !== packageToRemove.urn))
  }

  const addAccessPackage = (packageToAdd: AccessPackage) => {
    if (!selectedAccessPackages.find((pkg) => pkg.urn === packageToAdd.urn)) {
      setSelectedAccessPackages((prev) => [...prev, packageToAdd])
    }
    setAccessPackageSearch("")
  }

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role)
    setAccessPackageSearch("")
    setAccessPackageDropdownOpen(false)
    setSelectedAccessPackages([])
    // Clear all test data when switching categories
    setTestData(null)
    setDagligLederData(null)
    setLoading(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-background shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-semibold text-foreground">Testdatasøk for Team Autorisasjon</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hent testdata for forhåndsdefinert ER-Rolle
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <section aria-labelledby="role-selection-title">
            <Card className="border shadow-sm rounded-xl">
              <CardHeader className="pb-6">
                <CardTitle id="role-selection-title" className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Velg rolle
                </CardTitle>
                {/* Updated description to mention system user creation capability */}
                <CardDescription className="text-muted-foreground">
                  Velg hvilken type organisasjon du vil hente testdata for. Du kan også opprette systembruker for
                  brukeren du henter her for testdataene.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(roleConfig) as Role[]).map((role) => {
                    const config = roleConfig[role]
                    const Icon = config.icon
                    const isSelected = selectedRole === role

                    return (
                      <Card
                        key={role}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md rounded-xl ${
                          isSelected
                            ? "ring-2 ring-primary bg-primary/5 shadow-md"
                            : "hover:bg-muted/50 border hover:border-primary/30"
                        }`}
                        onClick={() => handleRoleChange(role)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleRoleChange(role)
                          }
                        }}
                        aria-pressed={isSelected}
                      >
                        <CardContent className="p-4 text-center space-y-3">
                          <div className="relative">
                            <div
                              className={`w-10 h-10 rounded-lg ${
                                role === "forretningsfoerer"
                                  ? "bg-secondary"
                                  : role === "revisor"
                                    ? "bg-primary"
                                    : role === "dagligLeder"
                                      ? "bg-orange-500"
                                      : "bg-secondary"
                              } flex items-center justify-center mx-auto`}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-medium text-foreground">{config.name}</h3>
                            <p className="small text-muted-foreground">{config.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          {selectedRole === "dagligLeder" && dagligLederData && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Opprett systembruker for virksomhet</h3>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Navn:</span>
                    <span className="font-medium">{dagligLederData.leaders[0].organisasjonsnavn}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(dagligLederData.leaders[0].organisasjonsnavn)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Organisasjonsnummer:</span>
                    <span className="font-mono font-medium bg-muted px-2 py-1 rounded border">
                      {dagligLederData.leaders[0].organisasjonsnummer}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(dagligLederData.leaders[0].organisasjonsnummer)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Fødselsnummer:</span>
                    <span className="font-mono font-medium bg-muted px-2 py-1 rounded border">
                      {dagligLederData.leaders[0].foedselsnummer}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(dagligLederData.leaders[0].foedselsnummer)}
                      className="h-6 w-6 p-0 hover:bg-muted"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Velg tilgangspakker (påkrevd)</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Du må velge minst én tilgangspakke før du kan opprette systembruker.
                  </p>

                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Søk etter tilgangspakker..."
                      value={accessPackageSearch}
                      onChange={(e) => setAccessPackageSearch(e.target.value)}
                      onFocus={() => setAccessPackageDropdownOpen(true)}
                      className="w-full"
                    />
                    {accessPackageDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                        {filteredAccessPackages.length > 0 ? (
                          filteredAccessPackages.map((pkg) => (
                            <button
                              key={pkg.urn}
                              onClick={() => {
                                addAccessPackage(pkg)
                                setAccessPackageDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-sm">{pkg.displayName}</div>
                              <div className="text-xs text-gray-500">{pkg.description}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">Ingen tilgangspakker funnet</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedAccessPackages.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-green-900">Valgte tilgangspakker:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAccessPackages.map((pkg) => (
                          <div
                            key={pkg.urn}
                            className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs"
                          >
                            <span>{pkg.displayName}</span>
                            <button
                              onClick={() =>
                                setSelectedAccessPackages(
                                  selectedAccessPackages.filter((selected) => selected.urn !== pkg.urn),
                                )
                              }
                              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handlePreviewVirksomhetsbruker(dagligLederData.leaders[0])}
                      variant="outline"
                      size="sm"
                    >
                      Vis eksempel-forespørsel
                    </Button>
                    <Button
                      onClick={() => handleCreateVirksomhetsbruker(dagligLederData.leaders[0])}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="default"
                    >
                      <span className="text-base font-semibold">Opprett systembruker for virksomheten</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Andre daglige ledere
                </h3>
                <div className="space-y-2">
                  {dagligLederData.leaders.slice(1).map((leader, index) => (
                    <Card key={index + 1} className="bg-background border rounded-xl hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground font-medium">Navn:</span>
                            <span className="font-medium text-foreground">{leader.organisasjonsnavn}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground font-medium">Organisasjonsnummer:</span>
                            <span className="font-mono font-medium bg-muted px-3 py-1 rounded-lg border">
                              {leader.organisasjonsnummer}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                            <span className="text-muted-foreground font-medium">Fødselsnummer:</span>
                            <span className="font-mono font-medium bg-muted px-3 py-1 rounded-lg border">
                              {leader.foedselsnummer}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Eksporter organisasjonsnumre</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const orgNumbers = dagligLederData.leaders.map((leader) => `'${leader.organisasjonsnummer}'`)
                        const arrayString = `[${orgNumbers.join(", ")}];`
                        navigator.clipboard.writeText(arrayString)
                        // Simple feedback - could be enhanced with toast
                        console.log("[v0] Copied organization numbers to clipboard:", arrayString)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Kopier alle ({dagligLederData.leaders.length})
                    </Button>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">Kopierer alle organisasjonsnumre som en JavaScript array</p>
                </div>
              </div>
            </div>
          )}

          {selectedRole && selectedRole !== "dagligLeder" && (
            <section aria-labelledby="fetch-data-section">
              <Card className="border shadow-sm rounded-xl">
                <CardContent className="p-6">
                  <Button
                    onClick={handleFetchTestData}
                    disabled={loading}
                    size="lg"
                    className="w-full min-h-[44px] text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {loading ? "Henter testdata" : "Hent testdata"}
                  </Button>

                  {error && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <p className="text-destructive font-medium">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {selectedRole === "dagligLeder" && (
            <section aria-labelledby="fetch-data-section">
              <Card className="border shadow-sm rounded-xl">
                <CardContent className="p-6">
                  <Button
                    onClick={handleFetchTestData}
                    disabled={loading}
                    size="lg"
                    className="w-full min-h-[44px] text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {loading ? "Henter testdata" : "Hent testdata"}
                  </Button>

                  {error && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <p className="text-destructive font-medium">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {loading && (
            <section aria-labelledby="loading-title">
              <Card className="border shadow-sm rounded-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle id="loading-title" className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      Henter testdata...
                    </CardTitle>
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedRole === "dagligLeder" ? (
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-3">
                        <div className="p-1.5 bg-secondary/10 rounded-lg">
                          <UserCheck className="h-4 w-4 text-secondary" />
                        </div>
                        Daglige ledere
                      </h3>
                      <div className="animate-pulse space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-3">
                          <div className="p-1.5 bg-secondary/10 rounded-lg">
                            <User className="h-4 w-4 text-secondary" />
                          </div>
                          Daglig leder
                        </h3>
                        <Card className="bg-background border rounded-xl">
                          <CardContent className="p-4">
                            <div className="animate-pulse space-y-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                <span className="text-muted-foreground font-medium">Fødselsnummer:</span>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                <span className="text-muted-foreground font-medium">Organisasjonsnummer:</span>
                                <div className="h-4 bg-gray-200 rounded w-28"></div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                                <span className="text-muted-foreground font-medium">Organisasjonsnavn:</span>
                                <div className="h-6 bg-gray-200 rounded-full w-48"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        <h3 className="flex items-center gap-3">
                          <div className="p-1.5 bg-secondary/10 rounded-lg">
                            <Building2 className="h-4 w-4 text-secondary" />
                          </div>
                          Klienter
                          <div className="h-6 w-8 bg-gray-200 animate-pulse rounded-lg ml-2"></div>
                        </h3>
                        <div className="animate-pulse space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {selectedRole && selectedRole !== "dagligLeder" && testData && (
            <section aria-labelledby="test-data-results">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-secondary/10 rounded-lg">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold">Daglig leder</h3>
                </div>

                <div className="space-y-0">
                  <div className="py-3 px-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium truncate">{testData.dagligLeder.organisasjonsnavn}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(testData.dagligLeder.organisasjonsnavn)}
                            className="opacity-60 hover:opacity-100 p-1"
                            title="Kopier organisasjonsnavn"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-mono">{testData.dagligLeder.organisasjonsnummer}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(testData.dagligLeder.organisasjonsnummer)}
                            className="opacity-60 hover:opacity-100 p-1"
                            title="Kopier organisasjonsnummer"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <span className="font-mono">{testData.dagligLeder.foedselsnummer}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(testData.dagligLeder.foedselsnummer)}
                            className="opacity-60 hover:opacity-100 p-1"
                            title="Kopier fødselsnummer"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handlePreviewSystemUser}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                        >
                          Vis eksempel-forespørsel
                        </Button>
                        <Button onClick={handleCreateSystemUser} size="sm" className="text-xs">
                          Opprett systembruker
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-border/30"></div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Klienter</h3>
                </div>

                <div className="space-y-0">
                  {testData.clients.map((client, index) => (
                    <div key={index}>
                      <div className="py-3 px-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium truncate">{client.navn}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(client.navn)}
                                className="opacity-60 hover:opacity-100 p-1"
                                title="Kopier navn"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="font-mono">{client.organisasjonsnummer}</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(client.organisasjonsnummer)}
                                className="opacity-60 hover:opacity-100 p-1"
                                title="Kopier organisasjonsnummer"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < testData.clients.length - 1 && <div className="border-b border-border/30"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Dialog open={systemUserModalOpen} onOpenChange={setSystemUserModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Opprett Systembruker</DialogTitle>
            <DialogDescription>
              Oppretter systembruker for{" "}
              {testData?.dagligLeder.organisasjonsnavn || testData?.dagligLeder.organisasjonsnummer}
            </DialogDescription>
          </DialogHeader>

          {systemUserLoading && (
            <div className="animate-pulse space-y-4 py-4">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
          )}

          {systemUserError && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Feil ved opprettelse</span>
              </div>
              <p className="text-sm text-muted-foreground">{systemUserError}</p>
              <Button onClick={handleCreateSystemUser} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {systemUserResponse && testData && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-sm">
                  Logg inn med fødselsnummer{" "}
                  <span className="bg-green-100 px-2 py-1 rounded font-mono font-bold border border-green-300">
                    {testData.dagligLeder.foedselsnummer}
                  </span>
                </p>
              </div>

              <Button asChild className="w-full text-base sm:text-lg">
                <a href={systemUserResponse.confirmUrl} target="_blank" rel="noopener noreferrer">
                  Logg inn i Altinn for å godkjenne Systembruker
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <div className="pt-4 border-t space-y-3">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 text-sm">
                    Etter systembruker er godkjent kan du sjekke Systembrukeren. Husk å velge aktør (organisasjon{" "}
                    <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold border border-gray-300">
                      {testData.dagligLeder.organisasjonsnummer} - {testData.dagligLeder.organisasjonsnavn}
                    </span>
                    ) etter å ha logget inn med daglig leder (
                    <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold border border-gray-300">
                      {testData.dagligLeder.foedselsnummer}
                    </span>
                    ).
                  </p>
                </div>

                <Button asChild variant="outline" className="w-full bg-transparent text-lg">
                  <a
                    href={
                      selectedEnvironment === "at22"
                        ? "https://am.ui.at22.altinn.cloud/accessmanagement/ui/systemuser/overview"
                        : "https://am.ui.tt02.altinn.no/accessmanagement/ui/systemuser/overview"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gå til Systemtilgang-siden
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={virksomhetsbrukerModalOpen} onOpenChange={setVirksomhetsbrukerModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Opprett Systembruker for Virksomheten</DialogTitle>
            <DialogDescription>
              Oppretter systembruker for virksomheten{" "}
              {selectedLeader?.organisasjonsnavn || selectedLeader?.organisasjonsnummer}
            </DialogDescription>
          </DialogHeader>

          {virksomhetsbrukerLoading && (
            <div className="animate-pulse space-y-4 py-4">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
          )}

          {virksomhetsbrukerError && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Feil ved opprettelse</span>
              </div>
              <p className="text-sm text-muted-foreground">{virksomhetsbrukerError}</p>
              <Button onClick={() => selectedLeader && handleCreateVirksomhetsbruker(selectedLeader)} variant="outline">
                Prøv igjen
              </Button>
            </div>
          )}

          {virksomhetsbrukerResponse && selectedLeader && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-sm">
                  Logg inn med fødselsnummer{" "}
                  <span className="bg-green-100 px-2 py-1 rounded font-mono font-bold border border-green-300">
                    {selectedLeader.foedselsnummer}
                  </span>
                </p>
              </div>

              <Button asChild className="w-full text-base sm:text-lg">
                <a href={virksomhetsbrukerResponse.confirmUrl} target="_blank" rel="noopener noreferrer">
                  Logg inn i Altinn for å godkjenne Systembruker
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>

              <div className="pt-4 border-t space-y-3">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 text-sm">
                    Etter systembruker er godkjent kan du sjekke Systembrukeren. Husk å velge aktør (organisasjon{" "}
                    <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold border border-gray-300">
                      {selectedLeader.organisasjonsnummer} - {selectedLeader.organisasjonsnavn}
                    </span>
                    ) etter å ha logget inn med daglig leder (
                    <span className="bg-gray-100 px-2 py-1 rounded font-mono font-bold border border-gray-300">
                      {selectedLeader.foedselsnummer}
                    </span>
                    ).
                  </p>
                </div>

                <Button asChild variant="outline" className="w-full bg-transparent text-lg">
                  <a
                    href={
                      selectedEnvironment === "at22"
                        ? "https://am.ui.at22.altinn.cloud/accessmanagement/ui/systemuser/overview"
                        : "https://am.ui.tt02.altinn.no/accessmanagement/ui/systemuser/overview"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gå til Systemtilgang-siden
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eksempel på forespørsel</DialogTitle>
            <DialogDescription>Dette er et eksempel på hvordan forespørselen vil se ut.</DialogDescription>
          </DialogHeader>
          <pre className="rounded-md bg-muted p-4 font-mono text-sm">
            {previewRequestBody ? JSON.stringify(previewRequestBody, null, 2) : "Ingen data tilgjengelig."}
          </pre>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-sm border-t z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div></div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="environment" className="text-sm font-medium text-muted-foreground">
                Environment:
              </label>
              <select
                id="environment"
                className="bg-background border border-input rounded-md px-2 py-1 text-sm"
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value as Environment)}
              >
                <option value="at22">AT22</option>
                <option value="tt02">TT02</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
