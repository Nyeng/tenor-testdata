"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, Settings, Calculator, User, ChevronDown, ChevronRight, Copy, X } from "lucide-react"

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
  confirmUrl: string
  partyOrgNo: string
  status: string
  systemId: string
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

const individualRights: IndividualRight[] = [
  { name: "authentication-e2e-test", displayName: "authentication-e2e-test" },
  { name: "vegardtestressurs", displayName: "vegardtestressurs" },
]

const roleConfig = {
  forretningsfoerer: { name: "Forretningsfører", icon: Building2, color: "bg-blue-500" },
  revisor: { name: "Revisor", icon: Settings, color: "bg-green-500" },
  regnskapsfoerere: { name: "Regnskapsfører", icon: Calculator, color: "bg-purple-500" },
  dagligLeder: { name: "Daglig leder", icon: User, color: "bg-orange-500" },
  manual: { name: "Bruk eget orgnr", icon: User, color: "bg-gray-500" },
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
  const [creationHistory, setCreationHistory] = useState<any[]>([])
  const [showResultModal, setShowResultModal] = useState(false)
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
    if (selectedRole === "manual") return "" // No fødselsnummer needed for manual
    if (editableOrgNr) return "" // No Fødselsnummer for manually entered org numbers
    const roleData = testData[selectedRole]
    const currentOrgNr = getCurrentOrgNr()

    const matchingEntry = roleData?.find((entry) => entry.organisasjonsnummer === currentOrgNr)
    return matchingEntry?.foedselsnummer || ""
  }

  const getCurrentOrgName = () => {
    if (selectedRole === "manual" || editableOrgNr) return ""
    const roleData = testData[selectedRole]
    return roleData?.[0]?.organisasjonsnavn || ""
  }

  const generateJsonPayload = () => {
    const getSystemId = () => {
      return "312605031_Virksomhetsbruker"
    }

    const basePayload = {
      externalRef: crypto.randomUUID(),
      systemId: getSystemId(),
      partyOrgNo: getCurrentOrgNr(),
      accessPackages: selectedAccessPackages.map((pkg) => ({ urn: pkg.urn })),
      status: "New",
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
          endpoint: endpoint, // Use the endpoint variable for clarity
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
      setCreationResult(result)
      setShowResultModal(true)
      setCreationHistory((prev) => [result, ...prev.slice(0, 2)])
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Systembruker demoverktøy</h1>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="environment">Miljø:</Label>
            <select
              id="environment"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="px-3 py-1 border rounded-md"
            >
              <option value="TT02">TT02</option>
              <option value="AT22">AT22</option>
            </select>
          </div>
        </div>

        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Opprett Systembruker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Systembruker Type Selection */}
            <div>
              <Label className="text-base font-medium">Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={systembrukerType === "agent" ? "default" : "outline"}
                  onClick={() => setSystembrukerType("agent")}
                  className="flex-1"
                >
                  Agent
                </Button>
                <Button
                  variant={systembrukerType === "standard" ? "default" : "outline"}
                  onClick={() => {
                    setSystembrukerType("standard")
                    setSelectedAccessPackages([])
                  }}
                  className="flex-1"
                >
                  Egen
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                {systembrukerType === "agent"
                  ? "Lar deg opprette Systembruker med tilgangspakker for klientforhold"
                  : "Standard systembruker med enkeltrettigheter og tilgangspakker"}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <Label className="text-base font-medium">Rolle</Label>
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Henter testorganisasjon fra{" "}
                <a
                  href="https://www.digdir.no/felleslosninger/tenor-testdatasok/1284"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
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
                  className="w-full justify-between h-12"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = roleConfig[selectedRole]
                      const Icon = config.icon
                      return (
                        <>
                          <Icon className="h-4 w-4" />
                          {config.name}
                        </>
                      )
                    })()}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {showRoleDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                    {Object.entries(roleConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          className="w-full px-3 py-3 text-left hover:bg-gray-100 flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setSelectedRole(key as Role)
                            setShowRoleDropdown(false)
                          }}
                        >
                          <Icon className="h-4 w-4" />
                          {config.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Manual Input Fields */}
            {selectedRole === "manual" && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="orgNr">Organisasjonsnummer</Label>
                  {isLoadingOrgData ? (
                    <div className="h-10 border border-input rounded-md px-3 py-2 bg-background flex items-center">
                      <div className="animate-pulse text-muted-foreground/40 select-none">████████████</div>
                    </div>
                  ) : (
                    <Input
                      id="orgNr"
                      value={manualOrgNr}
                      onChange={(e) => setManualOrgNr(e.target.value)}
                      placeholder="9 siffer"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Auto-filled values display with non-editable org number */}
            {selectedRole !== "manual" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editableOrgNr">Organisasjonsnummer</Label>
                  {isLoadingOrgData ? (
                    <div className="h-10 border border-input rounded-md px-3 py-2 bg-background flex items-center">
                      <div className="animate-pulse text-muted-foreground/40 select-none">████████████</div>
                    </div>
                  ) : (
                    <Input
                      id="editableOrgNr"
                      value={editableOrgNr || testData[selectedRole]?.[0]?.organisasjonsnummer || ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="9 siffer"
                    />
                  )}
                </div>
                {!editableOrgNr && (
                  <>
                    {(getCurrentOrgName() || isLoadingOrgData) && (
                      <div>
                        <Label htmlFor="orgName">Organisasjonsnavn</Label>
                        {isLoadingOrgData ? (
                          <div className="h-10 border border-input rounded-md px-3 py-2 bg-background flex items-center">
                            <div className="animate-pulse text-muted-foreground/40 select-none">
                              ████████████████████████
                            </div>
                          </div>
                        ) : (
                          <Input
                            id="orgName"
                            value={getCurrentOrgName()}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                          />
                        )}
                      </div>
                    )}
                    {(getCurrentFnr() || isLoadingOrgData) && (
                      <div>
                        <Label htmlFor="fnr">Fødselsnummer (daglig leder)</Label>
                        {isLoadingOrgData ? (
                          <div className="h-10 border border-input rounded-md px-3 py-2 bg-background flex items-center">
                            <div className="animate-pulse text-muted-foreground/40 select-none">███████████████</div>
                          </div>
                        ) : (
                          <Input id="fnr" value={getCurrentFnr()} readOnly className="bg-muted cursor-not-allowed" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Access Packages */}
            <div>
              <Label className="text-base font-medium">Tilgangspakker</Label>
              <div className="relative mt-2" ref={accessPackageDropdownRef}>
                <Input
                  placeholder="Søk etter tilgangspakker..."
                  value={accessPackageSearch}
                  onChange={(e) => setAccessPackageSearch(e.target.value)}
                  onClick={() => setShowAccessPackageDropdown(true)}
                  onFocus={() => setShowAccessPackageDropdown(true)}
                />
                {showAccessPackageDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredAccessPackages.map((pkg) => (
                      <button
                        key={pkg.urn}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
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
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAccessPackages.map((pkg) => (
                  <Badge key={pkg.urn} variant="secondary" className="flex items-center gap-1">
                    {pkg.displayName}
                    <button
                      className="chip-remove-button ml-1 hover:bg-red-100 rounded-full p-0.5"
                      aria-label={`Fjern ${pkg.displayName} fra valgte tilgangspakker`}
                      onClick={() => {
                        setSelectedAccessPackages((prev) => prev.filter((p) => p.urn !== pkg.urn))
                      }}
                    >
                      <X className="h-3 w-3 hover:text-red-600" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Individual Rights (only for Standard) */}
            {systembrukerType === "standard" && (
              <div>
                <Label className="text-base font-medium">Enkeltrettigheter</Label>
                <div className="relative mt-2" ref={individualRightDropdownRef}>
                  <Input
                    placeholder="Søk etter enkeltrettigheter..."
                    value={individualRightSearch}
                    onChange={(e) => setIndividualRightSearch(e.target.value)}
                    onClick={() => setShowIndividualRightDropdown(true)}
                    onFocus={() => setShowIndividualRightDropdown(true)}
                  />
                  {showIndividualRightDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredIndividualRights.map((right) => (
                        <button
                          key={right.name}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedIndividualRights.map((right) => (
                    <Badge key={right.name} variant="secondary" className="flex items-center gap-1">
                      {right.displayName}
                      <button
                        className="chip-remove-button ml-1 hover:bg-red-100 rounded-full p-0.5"
                        aria-label={`Fjern ${right.displayName} fra valgte individuelle rettigheter`}
                        onClick={() => {
                          setSelectedIndividualRights((prev) => prev.filter((r) => r.name !== right.name))
                        }}
                      >
                        <X className="h-3 w-3 hover:text-red-600" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Create Button */}
            <Button onClick={handleCreateSystembruker} disabled={isCreating} className="w-full h-12 text-lg">
              {isCreating ? "Oppretter..." : "Opprett Systembruker"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              JSON Payload Preview
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(JSON.stringify(generateJsonPayload(), null, 2))}
              >
                <Copy className="h-4 w-4 mr-1" />
                Kopier
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 text-gray-800 p-4 rounded-md text-sm overflow-x-auto font-mono border">
              {JSON.stringify(generateJsonPayload(), null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Testdata Utforskning</h2>

          {["forretningsfoerer", "revisor", "regnskapsfoerere"].map((role) => (
            <Card key={role}>
              <CardHeader
                className="cursor-pointer"
                onClick={() =>
                  setExpandedPanels((prev) => ({
                    ...prev,
                    [role]: !prev[role],
                  }))
                }
              >
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {expandedPanels[role] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {roleConfig[role as keyof typeof roleConfig].name} testdata
                  </span>
                  <Badge variant="outline">{testData[role]?.length || 0} entries</Badge>
                </CardTitle>
              </CardHeader>
              {expandedPanels[role] && (
                <CardContent>
                  <div className="space-y-2">
                    {testData[role]?.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="text-sm">
                          <div className="font-medium">{entry.organisasjonsnavn}</div>
                          <div className="text-gray-600">
                            Org: {entry.organisasjonsnummer} | FNR: {entry.foedselsnummer}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role as Role)
                            setManualOrgNr(entry.organisasjonsnummer)
                            setManualFnr(entry.foedselsnummer)
                            setSelectedOrganization({
                              navn: entry.organisasjonsnavn,
                              organisasjonsnummer: entry.organisasjonsnummer,
                            })
                          }}
                        >
                          Bruk denne
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {creationHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Siste opprettede systembrukere</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {creationHistory.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md text-sm">
                    <div className="font-medium">
                      {testData[selectedRole]?.[0]?.organisasjonsnavn || `Org: ${item.partyOrgNo}`}
                    </div>
                    <div className="text-gray-600">
                      Org: {item.partyOrgNo} | Status: {item.status}
                      {testData[selectedRole]?.[0]?.foedselsnummer && (
                        <> | Daglig leder: {testData[selectedRole][0].foedselsnummer}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Modal */}
        {showErrorModal && error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <X className="h-5 w-5" />
                  {error.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-900 text-green-400 rounded-lg">
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">{error.message}</pre>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowErrorModal(false)
                      setError(null)
                    }}
                    className="flex-1"
                  >
                    Lukk
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(error.message)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Kopier feilmelding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showResultModal && creationResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-green-600">Systembrukerforespørsel opprettet</CardTitle>
                <CardDescription>Systembrukeren er opprettet og venter på godkjenning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Slik logger du inn for å godkjenne:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Klikk på lenken nedenfor</li>
                    <li>
                      Logg inn med fødselsnummer:{" "}
                      <strong className="font-mono">{getCurrentFnr() || "Se testdata"}</strong>
                    </li>
                    <li>
                      {(() => {
                        console.log("[v0] Success dialog - selectedOrganization:", selectedOrganization)
                        console.log("[v0] Success dialog - systembrukerType:", systembrukerType)

                        // Get organization data from the current form state or API response
                        const orgName = selectedOrganization?.navn || getCurrentOrgName() || "organisasjon"
                        const orgNumber =
                          selectedOrganization?.organisasjonsnummer || getCurrentOrgNr() || "organisasjonsnummer"

                        console.log("[v0] Success dialog - using orgName:", orgName, "orgNumber:", orgNumber)

                        if (systembrukerType === "agent") {
                          return `Logg inn og velg aktør ${orgName} med orgnummer ${orgNumber} for å delegere klienter til Systembruker`
                        } else {
                          return (
                            <>
                              Logg inn og velg aktør {orgName} med orgnummer {orgNumber} for å se systembrukeren på{" "}
                              <a
                                href="https://am.ui.tt02.altinn.no/accessmanagement/ui/systemuser/overview"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800"
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

                <div>
                  <Label>Godkjenningslenke:</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={creationResult.confirmUrl} readOnly className="font-mono text-xs" />
                    <Button size="sm" onClick={() => navigator.clipboard.writeText(creationResult.confirmUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => window.open(creationResult.confirmUrl, "_blank")} className="flex-1">
                    Åpne godkjenningslenke
                  </Button>
                  <Button variant="outline" onClick={() => setShowResultModal(false)} className="flex-1">
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
