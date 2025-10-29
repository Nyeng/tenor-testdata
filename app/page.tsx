"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, Settings, Calculator, User, ChevronDown, Copy, X, AlertCircle } from "lucide-react"

type SystembrukerType = "agent" | "standard"
type Role = "forretningsfoerer" | "revisor" | "regnskapsfoerere" | "dagligLeder" | "manual"

interface AccessPackage {
  urn: string
  displayName: string
}

interface IndividualRight {
  name: string
  displayName: string
}

interface TestDataEntry {
  organisasjonsnavn: string
  organisasjonsnummer: string
  foedselsnummer: string
}

interface TestDataResponse {
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

interface DagligLederResponse {
  leaders: Array<{
    organisasjonsnummer: string
    organisasjonsnavn: string
    foedselsnummer: string
  }>
}

interface CreationResult {
  id: string
  confirmUrl?: string
  partyOrgNo: string
  status: string
  systemId: string
  externalRef?: string
  accessPackages?: Array<{ urn: string }>
  rights?: Array<{
    resource: Array<{
      value: string
      id: string
    }>
  }>
  integrationTitle?: string
  orgName?: string
  dagligLederFnr?: string
  environment?: string
  userType?: string
  systemUserId?: string
}

const accessPackages: AccessPackage[] = [
  { urn: "urn:altinn:accesspackage:ansvarlig-revisor", displayName: "Ansvarlig revisor" },
  { urn: "urn:altinn:accesspackage:forretningsforer-eiendom", displayName: "Forretningsfører eiendom" },
  { urn: "urn:altinn:accesspackage:regnskapsforer-lonn", displayName: "Regnskapsfører lønn" },
  { urn: "urn:altinn:accesspackage:konkursbo-tilgangsstyrer", displayName: "Konkursbo tilgangsstyrer" },
  { urn: "urn:altinn:accesspackage:hovedadministrator", displayName: "Hovedadministrator" },
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
    urn: "urn:altinn:accesspackage:helsetjenester-personopplysninger-saerlig-kategori",
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

const individualRights: IndividualRight[] = [
  { name: "authentication-e2e-test", displayName: "authentication-e2e-test" },
  { name: "vegardtestressurs", displayName: "vegardtestressurs" },
]

const roleConfig = {
  forretningsfoerer: { name: "Forretningsfører", icon: Building2, color: "bg-blue-500" },
  revisor: { name: "Revisor", icon: Settings, color: "bg-green-500" },
  regnskapsfoerere: { name: "Regnskapsfører", icon: Calculator, color: "bg-purple-500" },
  dagligLeder: { name: "Daglig leder", icon: User, color: "bg-orange-500" },
  manual: { name: "Bruk eget organisasjonsnummer", icon: User, color: "bg-gray-500" },
}

const roleAccessPackageMapping = {
  forretningsfoerer: {
    urn: "urn:altinn:accesspackage:forretningsforer-eiendom",
    displayName: "Forretningsfører eiendom",
  },
  revisor: { urn: "urn:altinn:accesspackage:ansvarlig-revisor", displayName: "Ansvarlig revisor" },
  regnskapsfoerere: { urn: "urn:altinn:accesspackage:regnskapsforer-lonn", displayName: "Regnskapsfører lønn" },
}

export default function SystembrukerForm() {
  const [systembrukerType, setSystembrukerType] = useState<SystembrukerType>("agent")
  const [selectedRole, setSelectedRole] = useState<Role>("forretningsfoerer")
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [manualOrgNr, setManualOrgNr] = useState("")
  const [manualFnr, setManualFnr] = useState("")
  const [editableOrgNr, setEditableOrgNr] = useState("")
  const [integrationTitle, setIntegrationTitle] = useState("")
  const [selectedAccessPackages, setSelectedAccessPackages] = useState<AccessPackage[]>([])
  const [selectedIndividualRights, setSelectedIndividualRights] = useState<IndividualRight[]>([])
  const [accessPackageSearch, setAccessPackageSearch] = useState("")
  const [individualRightSearch, setIndividualRightSearch] = useState("")
  const [showAccessPackageDropdown, setShowAccessPackageDropdown] = useState(false)
  const [showIndividualRightDropdown, setShowIndividualRightDropdown] = useState(false)

  // Testdata state
  const [testData, setTestData] = useState<{ [key: string]: TestDataEntry[] }>({})
  const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)

  // Environment and creation state
  const [selectedEnvironment, setSelectedEnvironment] = useState("TT02")
  const [isCreating, setIsCreating] = useState(false)
  const [creationHistory, setCreationHistory] = useState<CreationResult[]>([])
  const [showResultModal, setShowResultModal] = useState(false)

  const [showChangeRequestSuccess, setShowChangeRequestSuccess] = useState(false)
  const [changeRequestSuccessData, setChangeRequestSuccessData] = useState<{
    confirmUrl: string
    dagligLederFnr: string
  } | null>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem("systembruker-history")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setCreationHistory(parsed)
      } catch (error) {
        console.error("[v0] Failed to parse saved history:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (creationHistory.length > 0) {
      localStorage.setItem("systembruker-history", JSON.stringify(creationHistory))
    }
  }, [creationHistory])

  const [creationResult, setCreationResult] = useState<CreationResult | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<{
    navn: string
    organisasjonsnummer: string
  } | null>(null)

  // Error state management
  const [error, setError] = useState<{
    title: string
    message: string
    details?: string
    code?: string
    environment?: string
  } | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const accessPackageDropdownRef = useRef<HTMLDivElement>(null)
  const individualRightDropdownRef = useRef<HTMLDivElement>(null)
  const roleDropdownRef = useRef<HTMLDivElement>(null)

  const [isLoadingOrgData, setIsLoadingOrgData] = useState(false)
  const [isLoadingManualDagligLeder, setIsLoadingManualDagligLeder] = useState(false)
  const [manualOrgName, setManualOrgName] = useState("")
  const [manualDagligLederFnr, setManualDagligLederFnr] = useState("")
  const [dagligLederError, setDagligLederError] = useState<string | null>(null)

  const [updatingItemIndex, setUpdatingItemIndex] = useState<number | null>(null)

  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false)
  const [changeRequestItem, setChangeRequestItem] = useState<CreationResult | null>(null)
  const [changeRequestItemIndex, setChangeRequestItemIndex] = useState<number | null>(null)
  const [unwantedAccessPackages, setUnwantedAccessPackages] = useState<AccessPackage[]>([])
  const [requiredAccessPackages, setRequiredAccessPackages] = useState<AccessPackage[]>([])
  const [unwantedRights, setUnwantedRights] = useState<IndividualRight[]>([])
  const [requiredRights, setRequiredRights] = useState<IndividualRight[]>([])
  const [changeRequestAccessPackageSearch, setChangeRequestAccessPackageSearch] = useState("")
  const [changeRequestIndividualRightSearch, setChangeRequestIndividualRightSearch] = useState("")
  const [isSubmittingChangeRequest, setIsSubmittingChangeRequest] = useState(false)
  const [showChangeRequestAccessPackageDropdown, setShowChangeRequestAccessPackageDropdown] = useState(false)
  const [showChangeRequestIndividualRightDropdown, setShowChangeRequestIndividualRightDropdown] = useState(false)

  const changeRequestAccessPackageDropdownRef = useRef<HTMLDivElement>(null)
  const changeRequestIndividualRightDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadTestData = async () => {
      setLoading(true)
      setIsLoadingOrgData(true)
      try {
        const testDataResults: { [key: string]: TestDataEntry[] } = {}

        // Load role-based testdata
        for (const role of ["forretningsfoerer", "revisor", "regnskapsfoerere"]) {
          try {
            const response = await fetch("/api/testdata", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role, clientCount: 10 }),
            })

            if (response.ok) {
              const data: TestDataResponse = await response.json()
              testDataResults[role] = data.clients.map((client) => ({
                organisasjonsnavn: client.navn,
                organisasjonsnummer: client.organisasjonsnummer,
                foedselsnummer: "", // Client organizations don't have Daglig leder data from this API
              }))

              // Add the API caller's organization with correct Daglig leder data
              if (data.dagligLeder) {
                testDataResults[role].unshift({
                  organisasjonsnavn: data.dagligLeder.organisasjonsnavn || `${role} hovedorganisasjon`,
                  organisasjonsnummer: data.dagligLeder.organisasjonsnummer,
                  foedselsnummer: data.dagligLeder.foedselsnummer,
                })
              }
            }
          } catch (error) {
            console.error(`Failed to load ${role} testdata:`, error)
          }
        }

        // Load daglig leder data
        try {
          const response = await fetch("/api/daglig-leder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ antall: 10 }),
          })

          if (response.ok) {
            const data: DagligLederResponse = await response.json()
            testDataResults.dagligLeder = data.leaders.map((leader) => ({
              organisasjonsnavn: leader.organisasjonsnavn,
              organisasjonsnummer: leader.organisasjonsnummer,
              foedselsnummer: leader.foedselsnummer,
            }))
          }
        } catch (error) {
          console.error("Failed to load daglig leder testdata:", error)
        }

        setTestData(testDataResults)
        setTimeout(() => {
          setIsLoadingOrgData(false)
        }, 800)
      } catch (error) {
        console.error("Failed to fetch test data:", error)
        setIsLoadingOrgData(false)
      } finally {
        setLoading(false)
      }
    }

    loadTestData()
  }, [])

  useEffect(() => {
    const fetchDagligLederForManualOrg = async () => {
      if (selectedRole === "manual" && manualOrgNr && /^\d{9}$/.test(manualOrgNr)) {
        setIsLoadingManualDagligLeder(true)
        setManualOrgName("")
        setManualDagligLederFnr("")
        setDagligLederError(null)

        try {
          const response = await fetch("/api/daglig-leder-by-org", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organisasjonsnummer: manualOrgNr }),
          })

          if (response.ok) {
            const data = await response.json()
            setManualOrgName(data.organisasjonsnavn)
            setManualDagligLederFnr(data.foedselsnummer)
            console.log("[v0] Found daglig leder for manual org:", data)
          } else {
            console.log("[v0] No daglig leder found for org:", manualOrgNr)
            setDagligLederError("Fant ikke daglig leder for dette organisasjonsnummeret")
          }
        } catch (error) {
          console.error("[v0] Error fetching daglig leder for manual org:", error)
          setDagligLederError("Kunne ikke hente daglig leder. Prøv igjen senere.")
        } finally {
          setTimeout(() => {
            setIsLoadingManualDagligLeder(false)
          }, 400)
        }
      } else {
        setManualOrgName("")
        setManualDagligLederFnr("")
        setDagligLederError(null)
      }
    }

    const debounceTimer = setTimeout(fetchDagligLederForManualOrg, 500)
    return () => clearTimeout(debounceTimer)
  }, [manualOrgNr, selectedRole])

  useEffect(() => {
    setEditableOrgNr("")
  }, [selectedRole])

  useEffect(() => {
    if (systembrukerType === "agent" && selectedRole in roleAccessPackageMapping) {
      const mappedPackage = roleAccessPackageMapping[selectedRole as keyof typeof roleAccessPackageMapping]
      // Reset existing selections and add the new mapped package
      setSelectedAccessPackages([mappedPackage])
    } else if (systembrukerType === "agent") {
      // Reset selections for roles without auto-mapping (like dagligLeder, manual)
      setSelectedAccessPackages([])
    }
  }, [selectedRole, systembrukerType])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't close if clicking on chip X buttons
      if (target.closest(".chip-remove-button")) {
        return
      }

      // Close access package dropdown if clicking outside
      if (accessPackageDropdownRef.current && !accessPackageDropdownRef.current.contains(target)) {
        setShowAccessPackageDropdown(false)
      }

      // Close individual rights dropdown if clicking outside
      if (individualRightDropdownRef.current && !individualRightDropdownRef.current.contains(target)) {
        setShowIndividualRightDropdown(false)
      }

      if (roleDropdownRef.current && !roleDropdownRef.current.contains(target)) {
        setShowRoleDropdown(false)
      }

      // Close change request dropdowns
      if (
        changeRequestAccessPackageDropdownRef.current &&
        !changeRequestAccessPackageDropdownRef.current.contains(target)
      ) {
        setShowChangeRequestAccessPackageDropdown(false)
      }

      if (
        changeRequestIndividualRightDropdownRef.current &&
        !changeRequestIndividualRightDropdownRef.current.contains(target)
      ) {
        setShowChangeRequestIndividualRightDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getCurrentOrgNr = () => {
    if (selectedRole === "manual") return manualOrgNr
    if (editableOrgNr) return editableOrgNr
    const roleData = testData[selectedRole]
    return roleData?.[0]?.organisasjonsnummer || ""
  }

  const getCurrentFnr = () => {
    if (selectedRole === "manual") return manualDagligLederFnr
    if (editableOrgNr) return "" // No Fødselsnummer for manually entered org numbers
    const roleData = testData[selectedRole]
    const currentOrgNr = getCurrentOrgNr()

    const matchingEntry = roleData?.find((entry) => entry.organisasjonsnummer === currentOrgNr)
    return matchingEntry?.foedselsnummer || ""
  }

  const getCurrentOrgName = () => {
    if (selectedRole === "manual") return manualOrgName
    if (editableOrgNr) return ""
    const roleData = testData[selectedRole]
    return roleData?.[0]?.organisasjonsnavn || ""
  }

  const generateJsonPayload = () => {
    const getSystemId = () => {
      return "312605031_Virksomhetsbruker"
    }

    const externalRef = crypto.randomUUID()

    const basePayload: any = {
      externalRef: externalRef,
      systemId: getSystemId(),
      partyOrgNo: getCurrentOrgNr(),
      ...(integrationTitle && { integrationTitle: integrationTitle }),
      accessPackages: selectedAccessPackages.map((pkg) => ({ urn: pkg.urn })),
      redirectUrl: "",
    }

    if (systembrukerType === "standard" && selectedIndividualRights.length > 0) {
      return {
        ...basePayload,
        rights: selectedIndividualRights.map((right) => ({
          resource: [
            {
              value: right.name,
              id: "urn:altinn:resource",
            },
          ],
        })),
      }
    }

    return basePayload
  }

  const getBrukerflatenUrl = () => {
    const env = selectedEnvironment.toLowerCase()
    if (env === "tt02") {
      return "https://am.ui.tt02.altinn.no/accessmanagement/ui/systemuser/overview"
    }
    // AT environments use .cloud domain
    return `https://am.ui.${env}.altinn.cloud/accessmanagement/ui/systemuser/overview`
  }

  const handleCreateSystembruker = async () => {
    if (!getCurrentOrgNr()) {
      setError({
        title: "Validering feilet",
        message: "Organisasjonsnummer må fylles ut",
      })
      setShowErrorModal(true)
      return
    }

    if (selectedRole !== "manual" && !getCurrentFnr()) {
      setError({
        title: "Validering feilet",
        message: "Fødselsnummer må fylles ut",
      })
      setShowErrorModal(true)
      return
    }

    if (selectedAccessPackages.length === 0 && selectedIndividualRights.length === 0) {
      setError({
        title: "Validering feilet",
        message: "Minst én tilgangspakke eller enkeltrettighet må velges",
      })
      setShowErrorModal(true)
      return
    }

    setIsCreating(true)
    setError(null)

    const endpoint = systembrukerType === "agent" ? "agent" : "vendor"
    console.log("[v0] Frontend - Systembruker type:", systembrukerType)
    console.log("[v0] Frontend - Endpoint to be used:", endpoint)
    console.log(
      "[v0] Frontend - Selected access packages:",
      selectedAccessPackages.map((p) => p.displayName),
    )

    try {
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgNo: "312605031",
          env: selectedEnvironment.toLowerCase(),
        }),
      })

      if (!tokenResponse.ok) {
        let errorText = `HTTP ${tokenResponse.status} - ${tokenResponse.statusText}`
        try {
          const errorData = await tokenResponse.text()
          errorText = errorData
        } catch {
          // Keep the HTTP status if we can't parse the response
        }

        setError({
          title: "Token generation failed",
          message: errorText,
        })
        setShowErrorModal(true)
        return
      }

      const { token } = await tokenResponse.json()
      const payload = generateJsonPayload()

      const response = await fetch("/api/systemuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          requestBody: payload,
          environment: selectedEnvironment.toLowerCase(),
          endpoint: endpoint,
          selectedIndividualRights: selectedIndividualRights,
        }),
      })

      if (!response.ok) {
        let errorText = `HTTP ${response.status} - ${response.statusText}`
        try {
          const errorData = await response.text()
          errorText = errorData
        } catch {
          // Keep the HTTP status if we can't parse the response
        }

        let helpText = ""
        if (errorText.includes("One or more Right not found or not delegable")) {
          helpText = `\n\nHINT: Denne tilgangspakken er muligens ikke tilgjengelig via ${endpoint === "agent" ? "Agent" : "Standard"} systembruker i ${selectedEnvironment} miljø. Prøv ${endpoint === "agent" ? "Standard" : "Agent"} systembruker i stedet.`
        }

        setError({
          title: "Systembruker creation failed",
          message: errorText + helpText,
        })
        setShowErrorModal(true)
        return
      }

      const result = await response.json()
      const resultWithRef = {
        ...result,
        externalRef: payload.externalRef,
        accessPackages: payload.accessPackages,
        rights: payload.rights,
        integrationTitle: integrationTitle || undefined,
        orgName: getCurrentOrgName(),
        dagligLederFnr: getCurrentFnr(),
        environment: selectedEnvironment,
      }
      setCreationResult(resultWithRef)
      setShowResultModal(true)
      setCreationHistory((prev) => [resultWithRef, ...prev.slice(0, 2)])
    } catch (error) {
      setError({
        title: "Unexpected error",
        message: error instanceof Error ? error.message : String(error),
      })
      setShowErrorModal(true)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredAccessPackages = accessPackages.filter((pkg) =>
    pkg.displayName.toLowerCase().includes(accessPackageSearch.toLowerCase()),
  )

  const filteredIndividualRights = individualRights.filter((right) =>
    right.displayName.toLowerCase().includes(individualRightSearch.toLowerCase()),
  )

  const handleChangeSystemUser = async (item: CreationResult, index: number) => {
    setUpdatingItemIndex(index)

    try {
      const response = await fetch("/api/systemuser/byquery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemId: "312605031_Virksomhetsbruker",
          orgNo: item.partyOrgNo,
          externalRef: item.externalRef,
          environment: item.environment?.toLowerCase() || "tt02",
        }),
      })

      if (response.status === 404) {
        setError({
          title: "Systembruker ikke funnet",
          message:
            "Systembrukeren er ikke opprettet ennå. Vennligst godkjenn forespørselen først ved å klikke på 'Åpne godkjenningslenke'.",
        })
        setShowErrorModal(true)
        setUpdatingItemIndex(null)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch system user: ${response.status}`)
      }

      const data = await response.json()

      // Update the creation history with userType and systemUserId
      setCreationHistory((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          userType: data.userType,
          systemUserId: data.id,
          accessPackages: data.accessPackages || updated[index].accessPackages,
          rights: data.rights || updated[index].rights,
        }
        return updated
      })

      // Open the change request modal with the fetched data
      setChangeRequestItem({ ...item, systemUserId: data.id, accessPackages: data.accessPackages, rights: data.rights })
      setChangeRequestItemIndex(index)
      setUnwantedAccessPackages([])
      setRequiredAccessPackages([])
      setUnwantedRights([])
      setRequiredRights([])
      setShowChangeRequestModal(true)

      console.log("[v0] System user fetched for change request:", data)
    } catch (error) {
      console.error("[v0] Error fetching system user:", error)
      setError({
        title: "Kunne ikke hente systembruker",
        message: error instanceof Error ? error.message : String(error),
      })
      setShowErrorModal(true)
    } finally {
      setUpdatingItemIndex(null)
    }
  }

  const handleSubmitChangeRequest = async () => {
    if (!changeRequestItem || !changeRequestItem.systemUserId) {
      setError({
        title: "Validering feilet",
        message: "Systembruker ID mangler",
      })
      setShowErrorModal(true)
      return
    }

    setIsSubmittingChangeRequest(true)

    try {
      // Generate token
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgNo: "312605031",
          env: changeRequestItem.environment?.toLowerCase() || "tt02",
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to generate token")
      }

      const { token } = await tokenResponse.json()

      // Prepare request body
      const requestBody: any = {}

      if (unwantedAccessPackages.length > 0) {
        requestBody.unwantedAccessPackages = unwantedAccessPackages.map((pkg) => ({ urn: pkg.urn }))
      }

      if (requiredAccessPackages.length > 0) {
        requestBody.requiredAccessPackages = requiredAccessPackages.map((pkg) => ({ urn: pkg.urn }))
      }

      if (unwantedRights.length > 0) {
        requestBody.unwantedRights = unwantedRights.map((right) => ({
          resource: [{ value: right.name, id: "urn:altinn:resource" }],
        }))
      }

      if (requiredRights.length > 0) {
        requestBody.requiredRights = requiredRights.map((right) => ({
          resource: [{ value: right.name, id: "urn:altinn:resource" }],
        }))
      }

      // Submit change request
      const response = await fetch("/api/systemuser/changerequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          requestBody,
          environment: changeRequestItem.environment?.toLowerCase() || "tt02",
          systemUserId: changeRequestItem.systemUserId,
          correlationId: crypto.randomUUID(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to submit change request: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Change request submitted successfully:", result)

      setShowChangeRequestModal(false)

      // Display success modal with confirmUrl
      if (result.confirmUrl) {
        setChangeRequestSuccessData({
          confirmUrl: result.confirmUrl,
          dagligLederFnr: changeRequestItem.dagligLederFnr || "",
        })
        setShowChangeRequestSuccess(true)
      } else {
        setError({
          title: "Endring sendt",
          message: "Systembruker-endringen er sendt og venter på godkjenning",
        })
        setShowErrorModal(true)
      }
    } catch (error) {
      console.error("[v0] Error submitting change request:", error)
      setError({
        title: "Kunne ikke sende endring",
        message: error instanceof Error ? error.message : String(error),
      })
      setShowErrorModal(true)
    } finally {
      setIsSubmittingChangeRequest(false)
    }
  }

  const getCurrentAccessPackages = (): AccessPackage[] => {
    if (!changeRequestItem?.accessPackages) return []
    return changeRequestItem.accessPackages
      .map((pkg: any) => {
        const matched = accessPackages.find((ap) => ap.urn === pkg.urn)
        return matched ? matched : null
      })
      .filter((pkg): pkg is AccessPackage => pkg !== null)
  }

  const getCurrentRights = (): IndividualRight[] => {
    if (!changeRequestItem?.rights) return []
    return changeRequestItem.rights
      .map((right: any) => {
        const resourceValue = right.resource?.[0]?.value
        const matched = individualRights.find((ir) => ir.name === resourceValue)
        return matched ? matched : null
      })
      .filter((right): right is IndividualRight => right !== null)
  }

  const filteredChangeRequestAccessPackages = accessPackages.filter(
    (pkg) =>
      pkg.displayName.toLowerCase().includes(changeRequestAccessPackageSearch.toLowerCase()) &&
      !getCurrentAccessPackages().find((current) => current.urn === pkg.urn) &&
      !requiredAccessPackages.find((req) => req.urn === pkg.urn),
  )

  const filteredChangeRequestIndividualRights = individualRights.filter(
    (right) =>
      right.displayName.toLowerCase().includes(changeRequestIndividualRightSearch.toLowerCase()) &&
      !getCurrentRights().find((current) => current.name === right.name) &&
      !requiredRights.find((req) => req.name === right.name),
  )

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Tilgangsinfo demoverktøy</h1>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">
              Opprett og administrer systembrukere enkelt
            </p>
          </div>
          <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-xl shadow-sm border border-border">
            <Label htmlFor="environment" className="font-semibold text-foreground">
              Miljø:
            </Label>
            <select
              id="environment"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-card text-foreground hover:border-primary transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="TT02">TT02</option>
              <option value="AT22">AT22</option>
              <option value="AT23">AT23</option>
              <option value="AT24">AT24</option>
            </select>
          </div>
        </div>

        <Card className="shadow-lg rounded-2xl border-border animate-fade-in-up">
          <CardContent className="space-y-8 pt-8">
            {/* Systembruker Type Selection */}
            <div>
              <Label className="text-lg font-semibold mb-4 block text-foreground">Type</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  variant={systembrukerType === "agent" ? "default" : "outline"}
                  onClick={() => setSystembrukerType("agent")}
                  className="flex-1 h-11 text-base font-semibold rounded-xl transition-all hover:scale-[1.02]"
                >
                  Agent
                </Button>
                <Button
                  variant={systembrukerType === "standard" ? "default" : "outline"}
                  onClick={() => {
                    setSystembrukerType("standard")
                    setSelectedAccessPackages([])
                  }}
                  className="flex-1 h-11 text-base font-semibold rounded-xl transition-all hover:scale-[1.02]"
                >
                  Egen
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {systembrukerType === "agent"
                  ? "Lar deg opprette Systembruker med tilgangspakker for klientforhold"
                  : "Standard systembruker med enkeltrettigheter og tilgangspakker"}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <Label className="text-lg font-semibold mb-4 block text-foreground">Rolle</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">
                Henter testorganisasjon fra{" "}
                <a
                  href="https://www.digdir.no/felleslosninger/tenor-testdatasok/1284"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline font-medium transition-colors"
                >
                  Tenor Testdatasøk
                </a>
                {systembrukerType === "agent" &&
                  ". Forretningsfører, regnskapsfører og revisor gir deg mulighet til å hente relevante klienter for systembruker som opprettes gitt at du velger en matchende tilgangspakke"}
                .
              </p>
              <div className="relative" ref={roleDropdownRef}>
                <Button
                  variant="outline"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-full justify-between h-16 text-base rounded-xl border-border hover:border-primary hover:bg-transparent transition-all"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const config = roleConfig[selectedRole]
                      const Icon = config.icon
                      return (
                        <>
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">{config.name}</span>
                        </>
                      )
                    })()}
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </Button>
                {showRoleDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {Object.entries(roleConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          className="w-full px-6 py-4 text-left flex items-center gap-3 transition-colors group border-l-4 border-transparent hover:border-primary hover:bg-transparent"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setSelectedRole(key as Role)
                            setShowRoleDropdown(false)
                          }}
                        >
                          <Icon className="h-5 w-5 text-primary transition-colors" />
                          <span className="font-semibold text-foreground transition-colors">{config.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Input Fields */}
            {selectedRole === "manual" && (
              <div className="grid grid-cols-1 gap-6 p-6 bg-muted/50 rounded-xl border border-border">
                <div>
                  <Label htmlFor="orgNr" className="font-semibold text-foreground mb-2 block">
                    Organisasjonsnummer
                  </Label>
                  {isLoadingOrgData ? (
                    <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                      <div className="animate-pulse text-muted-foreground/40 select-none">████████████</div>
                    </div>
                  ) : (
                    <Input
                      id="orgNr"
                      value={manualOrgNr}
                      onChange={(e) => setManualOrgNr(e.target.value)}
                      placeholder="9 siffer"
                      className="mt-2 h-14 rounded-lg border-border focus:border-primary"
                    />
                  )}
                </div>
                {(manualOrgName || isLoadingManualDagligLeder) && (
                  <div>
                    <Label htmlFor="manualOrgName" className="font-semibold text-foreground mb-2 block">
                      Organisasjonsnavn
                    </Label>
                    {isLoadingManualDagligLeder ? (
                      <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                        <div className="animate-pulse text-muted-foreground/40 select-none">
                          ████████████████████████
                        </div>
                      </div>
                    ) : (
                      <Input
                        id="manualOrgName"
                        value={manualOrgName}
                        readOnly
                        className="bg-muted cursor-not-allowed mt-2 h-14 rounded-lg"
                      />
                    )}
                  </div>
                )}
                {(manualDagligLederFnr || isLoadingManualDagligLeder) && (
                  <div>
                    <Label htmlFor="manualDagligLederFnr" className="font-semibold text-foreground mb-2 block">
                      Fødselsnummer (daglig leder)
                    </Label>
                    {isLoadingManualDagligLeder ? (
                      <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                        <div className="animate-pulse text-muted-foreground/40 select-none">███████████████</div>
                      </div>
                    ) : (
                      <Input
                        id="manualDagligLederFnr"
                        value={manualDagligLederFnr}
                        readOnly
                        className="bg-muted cursor-not-allowed mt-2 h-14 rounded-lg"
                      />
                    )}
                  </div>
                )}
                {dagligLederError && !isLoadingManualDagligLeder && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800 leading-relaxed">{dagligLederError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Auto-filled values display */}
            {selectedRole !== "manual" && (
              <div className="space-y-6 p-6 bg-muted/50 rounded-xl border border-border">
                <div>
                  <Label htmlFor="editableOrgNr" className="font-semibold text-foreground mb-2 block">
                    Organisasjonsnummer
                  </Label>
                  {isLoadingOrgData ? (
                    <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                      <div className="animate-pulse text-muted-foreground/40 select-none">████████████</div>
                    </div>
                  ) : (
                    <Input
                      id="editableOrgNr"
                      value={editableOrgNr || testData[selectedRole]?.[0]?.organisasjonsnummer || ""}
                      readOnly
                      className="bg-muted cursor-not-allowed mt-2 h-14 rounded-lg"
                      placeholder="9 siffer"
                    />
                  )}
                </div>
                {!editableOrgNr && (
                  <>
                    {(getCurrentOrgName() || isLoadingOrgData) && (
                      <div>
                        <Label htmlFor="orgName" className="font-semibold text-foreground mb-2 block">
                          Organisasjonsnavn
                        </Label>
                        {isLoadingOrgData ? (
                          <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                            <div className="animate-pulse text-muted-foreground/40 select-none">
                              ████████████████████████
                            </div>
                          </div>
                        ) : (
                          <Input
                            id="orgName"
                            value={getCurrentOrgName()}
                            readOnly
                            className="bg-muted cursor-not-allowed mt-2 h-14 rounded-lg"
                          />
                        )}
                      </div>
                    )}
                    {(getCurrentFnr() || isLoadingOrgData) && (
                      <div>
                        <Label htmlFor="fnr" className="font-semibold text-foreground mb-2 block">
                          Fødselsnummer (daglig leder)
                        </Label>
                        {isLoadingOrgData ? (
                          <div className="h-14 border border-border rounded-lg px-4 py-3 bg-card flex items-center mt-2">
                            <div className="animate-pulse text-muted-foreground/40 select-none">███████████████</div>
                          </div>
                        ) : (
                          <Input
                            id="fnr"
                            value={getCurrentFnr()}
                            readOnly
                            className="bg-muted cursor-not-allowed mt-2 h-14 rounded-lg"
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="integrationTitle" className="font-semibold text-foreground mb-2 block">
                Navn på Systembruker (valgfritt)
              </Label>
              <Input
                id="integrationTitle"
                value={integrationTitle}
                onChange={(e) => setIntegrationTitle(e.target.value)}
                placeholder="Skriv inn navn på systembruker"
                className="mt-2 h-14 rounded-lg border-border focus:border-primary"
              />
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Dette navnet vil bli brukt til å identifisere systembrukeren
              </p>
            </div>

            {/* Access Packages */}
            <div>
              <Label className="text-lg font-semibold mb-4 block text-foreground">Tilgangspakker</Label>
              <div className="relative mt-2" ref={accessPackageDropdownRef}>
                <Input
                  placeholder="Søk etter tilgangspakker..."
                  value={accessPackageSearch}
                  onChange={(e) => setAccessPackageSearch(e.target.value)}
                  onClick={() => setShowAccessPackageDropdown(true)}
                  onFocus={() => setShowAccessPackageDropdown(true)}
                  className="h-14 rounded-lg border-border focus:border-primary"
                />
                {showAccessPackageDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {filteredAccessPackages.map((pkg) => (
                      <button
                        key={pkg.urn}
                        className="w-full px-6 py-4 text-left hover:bg-muted text-sm transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          if (!selectedAccessPackages.find((p) => p.urn === pkg.urn)) {
                            setSelectedAccessPackages((prev) => [...prev, pkg])
                          }
                          setAccessPackageSearch("")
                          setShowAccessPackageDropdown(false)
                        }}
                      >
                        {pkg.displayName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedAccessPackages.map((pkg) => (
                  <Badge
                    key={pkg.urn}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors rounded-full"
                  >
                    {pkg.displayName}
                    <button
                      className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                      aria-label={`Fjern ${pkg.displayName} fra valgte tilgangspakker`}
                      onClick={() => {
                        setSelectedAccessPackages((prev) => prev.filter((p) => p.urn !== pkg.urn))
                      }}
                    >
                      <X className="h-3 w-3 hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Individual Rights (only for Standard) */}
            {systembrukerType === "standard" && (
              <div>
                <Label className="text-lg font-semibold mb-4 block text-foreground">Enkeltrettigheter</Label>
                <div className="relative mt-2" ref={individualRightDropdownRef}>
                  <Input
                    placeholder="Søk etter enkeltrettigheter..."
                    value={individualRightSearch}
                    onChange={(e) => setIndividualRightSearch(e.target.value)}
                    onClick={() => setShowIndividualRightDropdown(true)}
                    onFocus={() => setShowIndividualRightDropdown(true)}
                    className="h-14 rounded-lg border-border focus:border-primary"
                  />
                  {showIndividualRightDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {filteredIndividualRights.map((right) => (
                        <button
                          key={right.name}
                          className="w-full px-6 py-4 text-left hover:bg-muted text-sm transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            if (!selectedIndividualRights.find((r) => r.name === right.name)) {
                              setSelectedIndividualRights((prev) => [...prev, right])
                            }
                            setIndividualRightSearch("")
                            setShowIndividualRightDropdown(false)
                          }}
                        >
                          {right.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedIndividualRights.map((right) => (
                    <Badge
                      key={right.name}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors rounded-full"
                    >
                      {right.displayName}
                      <button
                        className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                        aria-label={`Fjern ${right.displayName} fra valgte individuelle rettigheter`}
                        onClick={() => {
                          setSelectedIndividualRights((prev) => prev.filter((r) => r.name !== right.name))
                        }}
                      >
                        <X className="h-3 w-3 hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleCreateSystembruker}
              disabled={isCreating}
              className="w-full h-16 text-lg font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] bg-primary hover:brightness-105"
            >
              {isCreating ? "Oppretter..." : "Opprett Systembruker-forespørsel"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-2xl border-border animate-fade-in-up">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Forhåndsvisning</p>
                <CardTitle className="text-xl font-semibold text-foreground">Forhåndsvisning av request</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(generateJsonPayload(), null, 2))}
                className="rounded-lg hover:bg-muted transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                Kopier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="relative bg-code-bg rounded-xl p-6 overflow-hidden">
              <pre className="text-code-foreground text-sm overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(generateJsonPayload(), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {creationHistory.length > 0 && (
          <Card className="shadow-lg rounded-2xl border-border animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Siste opprettede forespørsler</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {creationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 bg-card rounded-xl text-sm border-l-4 border-primary shadow-sm space-y-3 hover:shadow-md transition-shadow"
                  >
                    {item.integrationTitle && (
                      <div className="font-bold text-lg text-primary">{item.integrationTitle}</div>
                    )}
                    <div className="font-semibold text-base text-foreground">
                      {item.orgName || `Org: ${item.partyOrgNo}`}
                    </div>
                    <div className="text-muted-foreground leading-relaxed">
                      Org: {item.partyOrgNo}
                      {item.dagligLederFnr && <> | Daglig leder: {item.dagligLederFnr}</>}
                      {item.environment && <> | Miljø: {item.environment}</>}
                    </div>
                    {item.externalRef && (
                      <div className="text-muted-foreground leading-relaxed font-mono text-xs">
                        ExternalRef: {item.externalRef}
                      </div>
                    )}
                    {item.userType && (
                      <div className="text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Type:</span> {item.userType}
                      </div>
                    )}
                    {item.accessPackages && item.accessPackages.length > 0 && (
                      <div className="mt-3">
                        <span className="font-semibold text-foreground">Tilgangspakker:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.accessPackages.map((pkg: any, pkgIndex: number) => {
                            const matchedPkg = accessPackages.find((ap) => ap.urn === pkg.urn)
                            return (
                              <Badge
                                key={pkgIndex}
                                className="text-xs bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1"
                              >
                                {matchedPkg?.displayName || pkg.urn}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {item.rights && item.rights.length > 0 && (
                      <div className="mt-3">
                        <span className="font-semibold text-foreground">Enkeltrettigheter:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.rights.map((right: any, rightIndex: number) => {
                            const resourceValue = right.resource?.[0]?.value
                            const matchedRight = individualRights.find((ir) => ir.name === resourceValue)
                            return (
                              <Badge
                                key={rightIndex}
                                className="text-xs bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1"
                              >
                                {matchedRight?.displayName || resourceValue}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border">
                      {/* CHANGE: Added confirmation URL link */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeSystemUser(item, index)}
                          disabled={updatingItemIndex === index}
                          className="rounded-lg transition-all hover:scale-105 hover:shadow-md"
                        >
                          {updatingItemIndex === index ? "Henter..." : "Endre Systembruker"}
                        </Button>
                        {item.confirmUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.confirmUrl, "_blank")}
                            className="rounded-lg transition-all hover:scale-105 hover:shadow-md"
                          >
                            Åpne godkjenningslenke
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showErrorModal && error && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fade-in-up">
              <CardHeader className="bg-destructive/10 border-b border-destructive/20">
                <CardTitle className="text-destructive flex items-center gap-3 text-xl font-semibold">
                  <X className="h-6 w-6" />
                  {error.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="p-6 bg-code-bg text-code-foreground rounded-xl shadow-inner">
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {error.message}
                  </pre>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowErrorModal(false)
                      setError(null)
                    }}
                    className="flex-1 h-14 rounded-xl font-semibold"
                  >
                    Lukk
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(error.message)}
                    className="flex-1 h-14 rounded-xl font-semibold"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Kopier feilmelding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showResultModal && creationResult && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fade-in-up">
              <CardHeader className="bg-primary/10 border-b border-primary/20">
                <CardTitle className="text-primary flex items-center gap-3 text-xl font-semibold">
                  Forespørsel opprettet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-bold text-foreground mb-4 text-lg">Slik logger du inn for å godkjenne:</h3>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-foreground leading-relaxed">
                    <li>
                      Logg inn med fødselsnummer:{" "}
                      <strong className="font-mono bg-card px-3 py-1.5 rounded-lg border border-border">
                        {getCurrentFnr() || "Se testdata"}
                      </strong>
                    </li>
                    <li>
                      {(() => {
                        const orgName = selectedOrganization?.navn || getCurrentOrgName() || "organisasjon"
                        const orgNumber =
                          selectedOrganization?.organisasjonsnummer || getCurrentOrgNr() || "organisasjonsnummer"

                        if (systembrukerType === "agent") {
                          return `Logg inn og velg aktør ${orgName} med orgnummer ${orgNumber} for å delegere klienter til Systembruker`
                        } else {
                          return (
                            <>
                              Logg inn og velg aktør {orgName} med orgnummer {orgNumber} for å se systembrukeren på{" "}
                              <a
                                href={getBrukerflatenUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline hover:text-primary/80 font-semibold transition-colors"
                              >
                                brukerflaten
                              </a>
                            </>
                          )
                        }
                      })()}
                    </li>
                  </ol>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => window.open(creationResult.confirmUrl, "_blank")}
                    className="flex-1 h-16 font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] bg-primary hover:brightness-105"
                  >
                    Åpne godkjenningslenke
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowResultModal(false)}
                    className="flex-1 h-16 rounded-xl font-semibold"
                  >
                    Lukk
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showChangeRequestModal && changeRequestItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fade-in-up">
              <CardHeader className="bg-primary/10 border-b border-primary/20">
                <CardTitle className="text-primary flex items-center gap-3 text-xl font-semibold">
                  Endre Systembruker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Current Access Packages */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block text-foreground">Nåværende tilgangspakker</Label>
                  <div className="flex flex-wrap gap-2">
                    {getCurrentAccessPackages().map((pkg) => {
                      const isMarkedForRemoval = unwantedAccessPackages.find((unwanted) => unwanted.urn === pkg.urn)
                      return (
                        <Badge
                          key={pkg.urn}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-full ${
                            isMarkedForRemoval
                              ? "bg-destructive/20 text-destructive border-destructive/40 line-through"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {pkg.displayName}
                          <button
                            className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                            onClick={() => {
                              if (isMarkedForRemoval) {
                                setUnwantedAccessPackages((prev) => prev.filter((p) => p.urn !== pkg.urn))
                              } else {
                                setUnwantedAccessPackages((prev) => [...prev, pkg])
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                    {getCurrentAccessPackages().length === 0 && (
                      <p className="text-sm text-muted-foreground">Ingen tilgangspakker</p>
                    )}
                  </div>
                </div>

                {/* Add New Access Packages */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block text-foreground">
                    Legg til nye tilgangspakker
                  </Label>
                  <div className="relative mt-2" ref={changeRequestAccessPackageDropdownRef}>
                    <Input
                      placeholder="Søk etter tilgangspakker..."
                      value={changeRequestAccessPackageSearch}
                      onChange={(e) => setChangeRequestAccessPackageSearch(e.target.value)}
                      onClick={() => setShowChangeRequestAccessPackageDropdown(true)}
                      onFocus={() => setShowChangeRequestAccessPackageDropdown(true)}
                      className="h-14 rounded-lg border-border focus:border-primary"
                    />
                    {showChangeRequestAccessPackageDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {filteredChangeRequestAccessPackages.map((pkg) => (
                          <button
                            key={pkg.urn}
                            className="w-full px-6 py-4 text-left hover:bg-muted text-sm transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setRequiredAccessPackages((prev) => [...prev, pkg])
                              setChangeRequestAccessPackageSearch("")
                              setShowChangeRequestAccessPackageDropdown(false)
                            }}
                          >
                            {pkg.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {requiredAccessPackages.map((pkg) => (
                      <Badge
                        key={pkg.urn}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500/10 text-green-600 border-green-500/20 rounded-full"
                      >
                        {pkg.displayName}
                        <button
                          className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                          onClick={() => {
                            setRequiredAccessPackages((prev) => prev.filter((r) => r.urn !== pkg.urn))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Current Individual Rights */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block text-foreground">
                    Nåværende enkeltrettigheter
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {getCurrentRights().map((right) => {
                      const isMarkedForRemoval = unwantedRights.find((unwanted) => unwanted.name === right.name)
                      return (
                        <Badge
                          key={right.name}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-full ${
                            isMarkedForRemoval
                              ? "bg-destructive/20 text-destructive border-destructive/40 line-through"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {right.displayName}
                          <button
                            className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                            onClick={() => {
                              if (isMarkedForRemoval) {
                                setUnwantedRights((prev) => prev.filter((r) => r.name !== right.name))
                              } else {
                                setUnwantedRights((prev) => [...prev, right])
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                    {getCurrentRights().length === 0 && (
                      <p className="text-sm text-muted-foreground">Ingen enkeltrettigheter</p>
                    )}
                  </div>
                </div>

                {/* Add New Individual Rights */}
                <div>
                  <Label className="text-lg font-semibold mb-4 block text-foreground">
                    Legg til nye enkeltrettigheter
                  </Label>
                  <div className="relative mt-2" ref={changeRequestIndividualRightDropdownRef}>
                    <Input
                      placeholder="Søk etter enkeltrettigheter..."
                      value={changeRequestIndividualRightSearch}
                      onChange={(e) => setChangeRequestIndividualRightSearch(e.target.value)}
                      onClick={() => setShowChangeRequestIndividualRightDropdown(true)}
                      onFocus={() => setShowChangeRequestIndividualRightDropdown(true)}
                      className="h-14 rounded-lg border-border focus:border-primary"
                    />
                    {showChangeRequestIndividualRightDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {filteredChangeRequestIndividualRights.map((right) => (
                          <button
                            key={right.name}
                            className="w-full px-6 py-4 text-left hover:bg-muted text-sm transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setRequiredRights((prev) => [...prev, right])
                              setChangeRequestIndividualRightSearch("")
                              setShowChangeRequestIndividualRightDropdown(false)
                            }}
                          >
                            {right.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {requiredRights.map((right) => (
                      <Badge
                        key={right.name}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500/10 text-green-600 border-green-500/20 rounded-full"
                      >
                        {right.displayName}
                        <button
                          className="chip-remove-button ml-1 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                          onClick={() => {
                            setRequiredRights((prev) => prev.filter((r) => r.name !== right.name))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitChangeRequest}
                    disabled={isSubmittingChangeRequest}
                    className="flex-1 h-16 font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] bg-primary hover:brightness-105"
                  >
                    {isSubmittingChangeRequest ? "Sender..." : "Send endringsforespørsel"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowChangeRequestModal(false)}
                    disabled={isSubmittingChangeRequest}
                    className="flex-1 h-16 rounded-xl font-semibold"
                  >
                    Avbryt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showChangeRequestSuccess && changeRequestSuccessData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl animate-fade-in-up">
              <CardHeader className="bg-primary/10 border-b border-primary/20">
                <CardTitle className="text-primary flex items-center gap-3 text-xl font-semibold">
                  Endringsforespørsel sendt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-bold text-foreground mb-4 text-lg">Slik logger du inn for å godkjenne:</h3>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-foreground leading-relaxed">
                    <li>
                      Logg inn med fødselsnummer:{" "}
                      <strong className="font-mono bg-card px-3 py-1.5 rounded-lg border border-border">
                        {changeRequestSuccessData.dagligLederFnr || "Se testdata"}
                      </strong>
                    </li>
                    <li>Godkjenn endringsforespørselen</li>
                  </ol>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => window.open(changeRequestSuccessData.confirmUrl, "_blank")}
                    className="flex-1 h-16 font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] bg-primary hover:brightness-105"
                  >
                    Åpne godkjenningslenke
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowChangeRequestSuccess(false)
                      setChangeRequestSuccessData(null)
                    }}
                    className="flex-1 h-16 rounded-xl font-semibold"
                  >
                    Lukk
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
