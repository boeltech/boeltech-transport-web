/**
 * VehicleListPage
 *
 * Página principal del módulo de vehículos. Muestra la tabla
 * con filtros, paginación y acciones.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleListPage.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import { usePermissions } from "@shared/permissions";
import { useVehicles } from "@features/vehicles/application";
import { VehicleFilters } from "../components/VehicleFilters";
import { VehicleStatusBadge } from "../components/VehicleStatusBadge";
import { VehicleActions } from "../components/VehicleActions";
import type { VehicleQueryParams } from "@features/vehicles/domain";
import { VEHICLE_TYPE_LABELS } from "@features/vehicles/domain";

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleListPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("vehicles", "create");

  const [params, setParams] = useState<VehicleQueryParams>({
    page: 1,
    limit: 20,
    sort: { field: "unit_number", direction: "asc" },
  });

  const { data, isLoading } = useVehicles(params);

  const vehicles = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de la flota vehicular</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/vehicles/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        )}
      </div>

      {/* Filters */}
      <VehicleFilters params={params} onParamsChange={setParams} />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Marca / Modelo</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead className="text-right">Kilometraje</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron vehículos.
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow
                  key={vehicle.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <TableCell className="font-medium">
                    {vehicle.unitNumber}
                  </TableCell>
                  <TableCell>
                    {vehicle.brand} {vehicle.model}
                  </TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{VEHICLE_TYPE_LABELS[vehicle.type]}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell className="text-right">
                    {vehicle.currentMileage.toLocaleString("es-MX")} km
                  </TableCell>
                  <TableCell>
                    <VehicleStatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <VehicleActions vehicle={vehicle} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {vehicles.length} de {pagination.total} vehículos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setParams((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) - 1,
                }))
              }
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setParams((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) + 1,
                }))
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
