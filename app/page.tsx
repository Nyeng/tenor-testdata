"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, User, Settings, Search, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react"

type Role = "forretningsfoerer" | "revisor" | "regnskapsfoerere"
type Environment = "at22" | "tt02"

interface TestData {
  role: Role
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
}

export default function TestDataInterface() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [clientCount, setClientCount] = useState(3)
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envVarsReady, setEnvVarsReady] = useState(false)

  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>("at22")
  const [systemUserModalOpen, setSystemUserModalOpen] = useState(false)
  const [systemUserLoading, setSystemUserLoading] = useState(false)
  const [systemUserResponse, setSystemUserResponse] = useState<SystemUserResponse | null>(null)
  const [systemUserError, setSystemUserError] = useState<string | null>(null)

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

    try {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Feil ved henting av testdata"
      setError(errorMessage)
      console.error("[v0] Error fetching test data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSystemUser = async () => {
    if (!testData || !selectedRole) return

    setSystemUserModalOpen(true)
    setSystemUserLoading(true)
    setSystemUserError(null)
    setSystemUserResponse(null)

    try {
      // Generate token
      const tokenResponse = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgNo: "312605031", // systemId organization number
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
    }
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
                <CardDescription className="text-muted-foreground">
                  Velg hvilken type organisasjon du vil hente testdata for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        onClick={() => setSelectedRole(role)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSelectedRole(role)
                          }
                        }}
                        aria-pressed={isSelected}
                      >
                        <CardContent className="p-6 text-center space-y-4">
                          <div className="relative">
                            <div
                              className={`w-12 h-12 rounded-xl ${
                                role === "forretningsfoerer"
                                  ? "bg-secondary"
                                  : role === "revisor"
                                    ? "bg-primary"
                                    : "bg-secondary"
                              } flex items-center justify-center mx-auto`}
                            >
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
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

          {selectedRole && (
            <section aria-labelledby="configuration-title">
              <Card className="border shadow-sm rounded-xl">
                <CardHeader className="pb-6">
                  <CardDescription className="text-muted-foreground">
                    Angi antall klienter som skal hentes for {roleConfig[selectedRole].name.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-background border rounded-xl">
                    <Label htmlFor="clientCount" className="font-medium whitespace-nowrap">
                      Hvor mange klienter ønsker du å liste
                    </Label>
                    <Input
                      id="clientCount"
                      type="number"
                      min="1"
                      max="100"
                      value={clientCount}
                      onChange={(e) => setClientCount(Number.parseInt(e.target.value) || 1)}
                      className="w-32 text-center font-medium border-2 border-border bg-background rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-sm hover:shadow-md transition-all duration-200"
                    />
                    <span className="small text-muted-foreground">(maks 100 klienter)</span>
                  </div>

                  <Button
                    onClick={handleFetchTestData}
                    disabled={loading}
                    size="lg"
                    className="w-full min-h-[44px] text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    {loading ? "Henter testdata..." : "Hent testdata"}
                  </Button>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
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
                  {/* Daglig leder skeleton */}
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

                  {/* Klienter skeleton */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-3">
                      <div className="p-1.5 bg-secondary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-secondary" />
                      </div>
                      Klienter
                      <div className="h-6 w-8 bg-gray-200 animate-pulse rounded-lg ml-2"></div>
                    </h3>
                    <div className="animate-pulse space-y-3">
                      {Array.from({ length: Math.min(clientCount, 5) }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                      ))}
                      {clientCount > 5 && (
                        <div className="text-center py-2">
                          <span className="small text-muted-foreground">... og {clientCount - 5} flere klienter</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {testData && (
            <section aria-labelledby="results-title">
              <Card className="border shadow-sm rounded-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle id="results-title" className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      Testdata
                    </CardTitle>
                    <Badge variant="secondary" className="px-6 py-3 text-lg font-medium rounded-lg">
                      {roleConfig[testData.role].name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-3">
                        <div className="p-1.5 bg-secondary/10 rounded-lg">
                          <User className="h-4 w-4 text-secondary" />
                        </div>
                        Daglig leder
                      </h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="environment" className="text-sm font-medium">
                          Miljø:
                        </Label>
                        <Select
                          value={selectedEnvironment}
                          onValueChange={(value: Environment) => setSelectedEnvironment(value)}
                        >
                          <SelectTrigger id="environment" className="w-24 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="at22">AT22</SelectItem>
                            <SelectItem value="tt02">TT02</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Card className="bg-background border rounded-xl">
                      <CardContent className="p-4 space-y-4">
                        <div className="grid gap-3">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <span className="text-muted-foreground font-medium">Fødselsnummer:</span>
                            <span className="font-mono font-medium bg-background px-3 py-1 rounded-lg border">
                              {testData.dagligLeder.foedselsnummer}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <span className="text-muted-foreground font-medium">Organisasjonsnummer:</span>
                            <span className="font-mono font-medium bg-background px-3 py-1 rounded-lg border">
                              {testData.dagligLeder.organisasjonsnummer}
                            </span>
                          </div>
                          {testData.dagligLeder.organisasjonsnavn && (
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                              <span className="text-muted-foreground font-medium">Organisasjonsnavn:</span>
                              <span className="font-medium bg-primary/5 text-primary px-3 py-1 rounded-lg border border-primary/20">
                                {testData.dagligLeder.organisasjonsnavn}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="pt-2">
                          <Button
                            onClick={handleCreateSystemUser}
                            className="w-full min-h-[44px] bg-primary hover:bg-primary/90 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            Opprett Systembruker med tilgangspakke {accessPackageMapping[selectedRole].displayName}
                          </Button>
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
                      <Badge variant="outline" className="ml-2 px-2 py-1 rounded-lg">
                        {testData.clients.length}
                      </Badge>
                    </h3>
                    <div className="grid gap-3">
                      {testData.clients.map((client, index) => (
                        <Card key={index} className="bg-background border rounded-xl hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <span className="font-medium text-foreground">{client.navn}</span>
                              <span className="font-mono small font-medium bg-muted px-3 py-1 rounded-lg border">
                                {client.organisasjonsnummer}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>

      <Dialog open={systemUserModalOpen} onOpenChange={setSystemUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  Logg inn med fødselsnummer{" "}
                  <span className="bg-green-100 px-2 py-1 rounded font-mono font-bold border border-green-300">
                    {testData.dagligLeder.foedselsnummer}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline">{systemUserResponse.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">System ID:</span>
                  <span className="font-mono text-sm">{systemUserResponse.systemId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Organisasjon:</span>
                  <span className="font-mono text-sm">{systemUserResponse.partyOrgNo}</span>
                </div>
              </div>

              <Button asChild className="w-full text-lg">
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
                      {testData.dagligLeder.organisasjonsnummer}
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
    </div>
  )
}
