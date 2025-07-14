"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

// Definir os tipos de guarnição que podem ser selecionados no formulário
type GuarnicaoForm = "MILITAR" | "PRF" | "CIVIL" | "COE" | "CMD_G" | "S_CMD_G" | "CGP" | "AUX" | "SEM_COR"

interface RegistrationFormProps {
  onRegister: (
    officerName: string,
    unit: GuarnicaoForm,
    selectedBadge: string,
    officerCargo?: string,
    officerId?: string,
  ) => void // Adicionado officerCargo
  guarnicaoOptions: { value: GuarnicaoForm; label: string }[]
  availableBadgesForSelectedUnit: { value: string; label: string }[] // Nova prop para badges disponíveis
  onUnitChange: (unit: GuarnicaoForm) => void // Nova prop para notificar mudança de unidade
  isAdmin: boolean // Nova prop para indicar se o usuário é admin
}

export function RegistrationForm({
  onRegister,
  guarnicaoOptions,
  availableBadgesForSelectedUnit,
  onUnitChange,
  isAdmin,
}: RegistrationFormProps) {
  const [officerName, setOfficerName] = React.useState("")
  const [officerId, setOfficerId] = React.useState("")
  const [officerCargo, setOfficerCargo] = React.useState("") // Novo estado para o cargo
  const [selectedUnit, setSelectedUnit] = React.useState<GuarnicaoForm>("MILITAR")
  const [selectedBadge, setSelectedBadge] = React.useState<string | undefined>(undefined) // Novo estado para a badge selecionada

  // Atualiza a badge selecionada quando a lista de badges disponíveis muda (ex: ao mudar a unidade)
  React.useEffect(() => {
    // Se a badge selecionada atualmente não estiver na nova lista de badges disponíveis,
    // ou se nenhuma badge estiver selecionada mas houver badges disponíveis,
    // então atualize selectedBadge.
    if (selectedBadge && !availableBadgesForSelectedUnit.some((badge) => badge.value === selectedBadge)) {
      setSelectedBadge(availableBadgesForSelectedUnit.length > 0 ? availableBadgesForSelectedUnit[0].value : undefined)
    } else if (!selectedBadge && availableBadgesForSelectedUnit.length > 0) {
      setSelectedBadge(availableBadgesForSelectedUnit[0].value)
    } else if (availableBadgesForSelectedUnit.length === 0) {
      setSelectedBadge(undefined) // Se não houver badges disponíveis, limpa a seleção
    }
  }, [availableBadgesForSelectedUnit, selectedBadge]) // Depende de availableBadgesForSelectedUnit e selectedBadge

  const handleUnitChange = (unit: GuarnicaoForm) => {
    setSelectedUnit(unit)
    onUnitChange(unit) // Notifica o componente pai
    // A atualização de selectedBadge é tratada pelo useEffect acima
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!officerName.trim()) {
      alert("Por favor, insira o nome do oficial.")
      return
    }
    if (!officerId.trim()) {
      // ID do Oficial agora é obrigatório
      alert("Por favor, insira o ID do oficial.")
      return
    }
    if (!selectedBadge) {
      alert("Por favor, selecione uma badge disponível.")
      return
    }
    onRegister(
      officerName,
      selectedUnit,
      selectedBadge,
      officerCargo.trim() || undefined,
      officerId.trim(), // ID do Oficial é sempre passado
    )
    setOfficerName("")
    setOfficerId("")
    setOfficerCargo("") // Limpa o campo de cargo
    setSelectedBadge(undefined)
  }

  return (
    <Card className="glass border-0 hover-lift overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-teal-500/5 to-cyan-500/5"></div>
      <CardHeader className="pb-4 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500 via-teal-600 to-cyan-600 rounded-xl shadow-lg">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Cadastro de Oficial e Viatura
            </CardTitle>
            <CardDescription className="text-base">
              Cadastre um novo oficial e atribua-o a uma viatura disponível.
              {isAdmin && (
                <span className="ml-2 text-purple-600 font-semibold">
                  (Modo Admin: Pode cadastrar badges restritas)
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Nome do Oficial"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            required
            className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-green-300 focus:ring-green-200 rounded-xl"
          />
          <Input
            placeholder="ID do Oficial" // Removido "(Opcional)"
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
            required // ID do Oficial agora é obrigatório
            className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-green-300 focus:ring-green-200 rounded-xl"
          />
          <Input
            placeholder="Cargo do Oficial (Opcional)"
            value={officerCargo}
            onChange={(e) => setOfficerCargo(e.target.value)}
            className="h-12 bg-white/50 border-gray-200 focus:bg-white focus:border-green-300 focus:ring-green-200 rounded-xl"
          />
          <Select value={selectedUnit} onValueChange={handleUnitChange}>
            <SelectTrigger className="h-12 bg-white/50 border-gray-200 focus:border-green-300 focus:ring-green-200 rounded-xl">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {guarnicaoOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedBadge}
            onValueChange={setSelectedBadge}
            disabled={availableBadgesForSelectedUnit.length === 0} // Desabilita se não houver badges
          >
            <SelectTrigger className="h-12 bg-white/50 border-gray-200 focus:border-green-300 focus:ring-green-200 rounded-xl md:col-span-2">
              <SelectValue placeholder="Selecione a Badge" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {availableBadgesForSelectedUnit.length === 0 ? (
                <SelectItem value="no-badges" disabled>
                  Nenhuma badge disponível
                </SelectItem>
              ) : (
                availableBadgesForSelectedUnit.map((badge) => (
                  <SelectItem key={badge.value} value={badge.value}>
                    {badge.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="h-12 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:via-teal-700 hover:to-cyan-700 shadow-lg hover-lift rounded-xl md:col-span-1"
          >
            Cadastrar Oficial
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
