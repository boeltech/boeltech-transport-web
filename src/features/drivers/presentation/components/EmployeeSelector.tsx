/**
 * EmployeeSelector
 * Clean Architecture - Presentation Layer (Components)
 *
 * Componente para seleccionar un empleado disponible para ser
 * registrado como conductor.
 *
 * Características:
 * - Combobox con búsqueda
 * - Solo muestra empleados activos que NO son conductores
 * - Muestra número de empleado + nombre completo
 * - Link para crear empleado si no existe
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronsUpDown, Loader2, UserPlus, Search } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Label } from "@shared/ui/label";

import {
  useAvailableEmployeesForDriver,
  type EmployeeForSelection,
} from "@features/employees";

// ============================================================================
// Types
// ============================================================================

interface EmployeeSelectorProps {
  /** ID del empleado seleccionado */
  value: string;
  /** Callback cuando se selecciona un empleado */
  onChange: (employeeId: string) => void;
  /** Mensaje de error de validación */
  error?: string;
  /** Deshabilitar el selector */
  disabled?: boolean;
  /** Placeholder del selector */
  placeholder?: string;
  /**
   * Si se indica, solo se listan empleados cuyo `position` en BD coincide exactamente
   * (p. ej. `"Conductor"` del catálogo de puestos).
   */
  positionEquals?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EmployeeSelector({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Buscar empleado...",
  positionEquals,
}: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch empleados disponibles
  const {
    data: employees = [],
    isLoading,
    isError,
  } = useAvailableEmployeesForDriver(
    searchQuery,
    true,
    positionEquals?.trim() || undefined,
  );

  // Encontrar el empleado seleccionado
  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    return employees.find((emp) => emp.id === value) || null;
  }, [value, employees]);

  // Formatear label del empleado
  const formatEmployeeLabel = (employee: EmployeeForSelection): string => {
    return `${employee.employeeNumber} - ${employee.fullName}`;
  };

  // Handle selection
  const handleSelect = (employeeId: string) => {
    onChange(employeeId === value ? "" : employeeId);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="employee-selector">
        Empleado <span className="text-destructive">*</span>
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="employee-selector"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Seleccionar empleado"
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive",
            )}
          >
            {selectedEmployee ? (
              <span className="truncate">
                {formatEmployeeLabel(selectedEmployee)}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre o número..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />

            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Buscando empleados...
                  </span>
                </div>
              ) : isError ? (
                <div className="py-6 text-center text-sm text-destructive">
                  Error al cargar empleados
                </div>
              ) : employees.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {positionEquals
                        ? `No hay empleados disponibles con puesto «${positionEquals}»`
                        : "No se encontraron empleados disponibles"}
                    </p>
                    <Link
                      to="/employees/new"
                      className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <UserPlus className="h-4 w-4" />
                      Crear nuevo empleado
                    </Link>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Empleados disponibles">
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
                      onSelect={handleSelect}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.employeeNumber} - {employee.fullName}
                        </span>
                        {(employee.department || employee.position) && (
                          <span className="text-xs text-muted-foreground">
                            {[employee.position, employee.department]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === employee.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          {/* Footer con link para crear empleado */}
          <div className="border-t p-2">
            <Link
              to="/employees/new"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <UserPlus className="h-4 w-4" />
              ¿No encuentras al empleado? Créalo primero
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Helper text */}
      {!error && (
        <p className="text-xs text-muted-foreground">
          {positionEquals
            ? `Solo empleados activos con puesto «${positionEquals}», sin registro como conductor`
            : "Solo se muestran empleados activos que no están registrados como conductores"}
        </p>
      )}
    </div>
  );
}

export default EmployeeSelector;
