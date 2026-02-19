/**
 * VehicleFilters Component
 *
 * Barra de filtros para la lista de vehículos.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleFilters.tsx
 */

import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Button } from "@shared/ui/button";
import { Search, X } from "lucide-react";
import type {
  VehicleQueryParams,
  VehicleStatusType,
  VehicleTypeValue,
} from "@features/vehicles/domain";
import {
  VEHICLE_TYPE_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@features/vehicles/domain";

// ============================================================================
// TYPES
// ============================================================================

interface VehicleFiltersProps {
  params: VehicleQueryParams;
  onParamsChange: (params: VehicleQueryParams) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleFilters({
  params,
  onParamsChange,
}: VehicleFiltersProps) {
  const filters = params.filters;

  const handleSearchChange = (value: string) => {
    onParamsChange({
      ...params,
      page: 1,
      filters: { ...filters, search: value || undefined },
    });
  };

  const handleStatusChange = (value: string) => {
    onParamsChange({
      ...params,
      page: 1,
      filters: {
        ...filters,
        status: value === "all" ? undefined : (value as VehicleStatusType),
      },
    });
  };

  const handleTypeChange = (value: string) => {
    onParamsChange({
      ...params,
      page: 1,
      filters: {
        ...filters,
        type: value === "all" ? undefined : (value as VehicleTypeValue),
      },
    });
  };

  const handleClearFilters = () => {
    onParamsChange({ page: 1, limit: params.limit });
  };

  const hasActiveFilters = filters?.search || filters?.status || filters?.type;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por unidad, placa, marca, modelo o VIN..."
          value={filters?.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status filter */}
      <Select
        value={(filters?.status as string) || "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {(
            Object.entries(VEHICLE_STATUS_LABELS) as [
              VehicleStatusType,
              string,
            ][]
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type filter */}
      <Select value={filters?.type || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          {(
            Object.entries(VEHICLE_TYPE_LABELS) as [VehicleTypeValue, string][]
          ).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={handleClearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
