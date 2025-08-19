"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Building2, Users, User, Settings, CheckCircle, AlertCircle } from "lucide-react"

type Role = "forretningsfoerer" | "revisor" | "regnskapsfoerere"

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

interface EnvVarStatus {
  name: string
  isSet: boolean
  description: string
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Testdata Interface</h1>
          <p className="text-lg text-slate-600">Velg rolle og hent testdata for Maskinporten-integrasjon</p>
        </div>

        <Card className={`border-2 ${envVarsReady ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${envVarsReady ? "text-green-800" : "text-amber-800"}`}>
              {envVarsReady ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              Maskinporten Integrasjon
            </CardTitle>
            <CardDescription className={envVarsReady ? "text-green-700" : "text-amber-700"}>
              {envVarsReady
                ? "Maskinporten-integrasjon er konfigurert og klar til bruk"
                : "Maskinporten miljøvariabler må konfigureres"}
            </CardDescription>
          </CardHeader>
          {!envVarsReady && (
            <CardContent>
              <div className="p-4 bg-amber-100 rounded-lg">
                <p className="text-sm text-amber-800 font-medium mb-2">Påkrevde miljøvariabler:</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>
                    <code>MACHINEPORTEN_KID</code> - Key ID for JWT signering
                  </li>
                  <li>
                    <code>ENCODED_JWK</code> - Base64-kodet JWK private key
                  </li>
                  <li>
                    <code>MACHINEPORTEN_CLIENT_ID</code> - Maskinporten klient-ID
                  </li>
                </ul>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Velg rolle
            </CardTitle>
            <CardDescription>Velg hvilken type organisasjon du vil hente testdata for</CardDescription>
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
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <div
                        className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center mx-auto`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900">{config.name}</h3>
                      <p className="text-sm text-slate-600">{config.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        {selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle>Konfigurering</CardTitle>
              <CardDescription>Angi antall klienter som skal hentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="clientCount" className="text-sm font-medium">
                  Antall klienter:
                </Label>
                <Input
                  id="clientCount"
                  type="number"
                  min="1"
                  max="20"
                  value={clientCount}
                  onChange={(e) => setClientCount(Number.parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>

              <Button onClick={handleFetchTestData} disabled={loading || !envVarsReady} className="w-full">
                {loading ? "Henter testdata..." : !envVarsReady ? "Miljøvariabler må settes først" : "Hent testdata"}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Data Display */}
        {testData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {roleConfig[testData.role].name}
                </Badge>
                Testdata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daglig Leder */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Daglig leder
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Fødselsnummer:</span>
                    <span className="font-mono text-sm">{testData.dagligLeder.foedselsnummer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Organisasjonsnummer:</span>
                    <span className="font-mono text-sm">{testData.dagligLeder.organisasjonsnummer}</span>
                  </div>
                  {testData.dagligLeder.organisasjonsnavn && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Organisasjonsnavn:</span>
                      <span className="text-sm">{testData.dagligLeder.organisasjonsnavn}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Clients */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Klienter ({testData.clients.length})
                </h3>
                <div className="grid gap-3">
                  {testData.clients.map((client, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900">{client.navn}</span>
                        <span className="font-mono text-sm text-slate-600">{client.organisasjonsnummer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
