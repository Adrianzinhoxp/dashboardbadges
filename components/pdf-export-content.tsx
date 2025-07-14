import * as React from "react"

// Re-importar os tipos necessários para evitar dependências circulares
type VehicleStatus = "disponivel" | "em_uso" | "manutencao" | "inativa"
type Guarnicao = "MILITAR" | "PRF" | "CIVIL" | "COE" | "CMD_G" | "S_CMD_G" | "CGP" | "AUX" | "SEM_COR"

interface Vehicle {
  id: number
  badge: string
  status: VehicleStatus
  guarnicao: Guarnicao
  officer?: string
  officerCargo?: string
  officerId?: string
  lastUpdate: Date
}

interface GuarnicaoConfig {
  label: string
  color: string
  badgeColor: string
}

interface StatusConfig {
  label: string
  icon: React.ElementType
}

interface PdfExportContentProps {
  vehicles: Vehicle[]
  guarnicaoConfig: Record<Guarnicao, GuarnicaoConfig>
  statusConfig: Record<VehicleStatus, StatusConfig>
}

export const PdfExportContent = React.forwardRef<HTMLDivElement, PdfExportContentProps>(
  ({ vehicles, guarnicaoConfig, statusConfig }, ref) => {
    return (
      <div
        ref={ref}
        className="p-6 bg-white text-gray-900"
        style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box" }}
      >
        <h1 className="text-3xl font-bold text-center mb-6" style={{ color: "#1a202c" }}>
          Relatório de Badges - Polícia Oasis
        </h1>
        <p className="text-center text-gray-600 mb-8">Gerado em: {new Date().toLocaleString("pt-BR")}</p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Badge</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Guarnição</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Oficial</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">ID Oficial</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Cargo</th>
              <th className="p-2 text-left text-sm font-semibold text-gray-700">Última Atualização</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2 text-sm font-medium text-gray-800">#{vehicle.badge}</td>
                <td className="p-2 text-sm">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: guarnicaoConfig[vehicle.guarnicao]?.badgeColor.split(" ")[0].replace("bg-", "#"),
                      color: guarnicaoConfig[vehicle.guarnicao]?.badgeColor.split(" ")[1].replace("text-", "#"),
                      border: `1px solid ${guarnicaoConfig[vehicle.guarnicao]?.badgeColor.split(" ")[2].replace("border-", "#")}`,
                    }}
                  >
                    {guarnicaoConfig[vehicle.guarnicao]?.label}
                  </span>
                </td>
                <td className="p-2 text-sm">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        vehicle.status === "disponivel"
                          ? "#d1fae5"
                          : vehicle.status === "em_uso"
                            ? "#bfdbfe"
                            : "#fef3c7",
                      color:
                        vehicle.status === "disponivel"
                          ? "#047857"
                          : vehicle.status === "em_uso"
                            ? "#1d4ed8"
                            : "#b45309",
                    }}
                  >
                    {statusConfig[vehicle.status]?.label}
                  </span>
                </td>
                <td className="p-2 text-sm text-gray-700">{vehicle.officer || "N/A"}</td>
                <td className="p-2 text-sm text-gray-700">{vehicle.officerId || "N/A"}</td>
                <td className="p-2 text-sm text-gray-700">{vehicle.officerCargo || "N/A"}</td>
                <td className="p-2 text-sm text-gray-500">{vehicle.lastUpdate.toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
)
PdfExportContent.displayName = "PdfExportContent"
