/**
 * EmployeeSelector
 * Clean Architecture - Presentation Layer (Components)
 *
 * Combobox para seleccionar un empleado disponible como conductor.
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
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";

import {
  useAvailableEmployeesForDriver,
  useEmployeeBasic,
  type EmployeeForSelection,
} from "@features/employees";
import { driversCopy } from "../copy";

const es = driversCopy.form.employeeSelector;

interface EmployeeSelectorProps {
  value: string;
  onChange: (employeeId: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  /**
   * Si se indica, solo se listan empleados cuyo `position` en BD coincide exactamente
   * (p. ej. `"Conductor"` del catálogo de puestos).
   */
  positionEquals?: string;
}

function formatEmployeeLabel(employee: EmployeeForSelection): string {
  return `${employee.employeeNumber} — ${employee.fullName}`;
}

export function EmployeeSelector({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = es.placeholder,
  positionEquals,
}: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: employees = [],
    isLoading,
    isError,
  } = useAvailableEmployeesForDriver(
    searchQuery,
    true,
    positionEquals?.trim() || undefined,
  );

  const { data: basicEmployee } = useEmployeeBasic(value, Boolean(value));

  const selectedFromList = useMemo(() => {
    if (!value) return null;
    return employees.find((emp) => emp.id === value) || null;
  }, [value, employees]);

  const selectedEmployee = selectedFromList ?? basicEmployee ?? null;

  const handleSelect = (employeeId: string) => {
    onChange(employeeId === value ? "" : employeeId);
    setOpen(false);
  };

  const helperDescription = positionEquals
    ? es.helperWithPosition(positionEquals)
    : es.helper;

  return (
    <FormFieldShell
      fieldId="employeeId"
      label={es.label}
      required
      errorMessage={error}
      description={error ? undefined : helperDescription}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="employeeId"
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={es.ariaLabel}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive",
            )}
            {...getFieldErrorAriaProps("employeeId", error)}
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
              placeholder={es.searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />

            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {es.loading}
                  </span>
                </div>
              ) : isError ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {es.loadError}
                </div>
              ) : employees.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {positionEquals
                        ? es.emptyWithPosition(positionEquals)
                        : es.empty}
                    </p>
                    <Link
                      to="/employees/new"
                      className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <UserPlus className="h-4 w-4" />
                      {es.createLink}
                    </Link>
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup heading={es.groupHeading}>
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.id}
                      onSelect={handleSelect}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatEmployeeLabel(employee)}
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

          <div className="border-t p-2">
            <Link
              to="/employees/new"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <UserPlus className="h-4 w-4" />
              {es.createFooter}
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </FormFieldShell>
  );
}

export default EmployeeSelector;
