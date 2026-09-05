import type { AssignableDriverItem } from "@features/trips/presentation/pages/create/tripAssignmentDrivers";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Badge } from "@shared/ui/badge";
import { AlertTriangle, Loader2, Truck, User } from "lucide-react";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";

interface DriverSelectProps {
  fieldId?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  drivers: readonly AssignableDriverItem[];
  isLoading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  emptyLabel?: string;
  availableLabel?: string;
  softBusyLabel?: string;
  notAssignableLabel?: string;
}

export function DriverSelect({
  fieldId = "driverId",
  label,
  placeholder,
  value,
  onChange,
  drivers,
  isLoading = false,
  disabled = false,
  errorMessage,
  emptyLabel = "No hay conductores disponibles",
  availableLabel = "Disponibles",
  softBusyLabel = "En otro viaje",
  notAssignableLabel = "No asignables",
}: DriverSelectProps) {
  const assignableDrivers = drivers.filter(
    (driver) => driver.canBeAssigned && !driver.softBusy,
  );
  const softBusyDrivers = drivers.filter((driver) => driver.softBusy === true);
  const blockedDrivers = drivers.filter(
    (driver) => !driver.canBeAssigned && !driver.softBusy,
  );

  return (
    <FormFieldShell
      fieldId={fieldId}
      label={label}
      errorMessage={errorMessage}
    >
      <Select
        onValueChange={(next) => next && onChange(next)}
        value={value || ""}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id={fieldId}
          error={Boolean(errorMessage)}
          {...getFieldErrorAriaProps(fieldId, errorMessage)}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {drivers.length === 0 && !isLoading ? (
            <SelectItem value="__empty__" disabled>
              {emptyLabel}
            </SelectItem>
          ) : (
            <>
              {assignableDrivers.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>{availableLabel}</SelectLabel>
                  {assignableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.displayName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
              {softBusyDrivers.length > 0 ? (
                <>
                  {assignableDrivers.length > 0 ? <SelectSeparator /> : null}
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {softBusyLabel}
                    </SelectLabel>
                    {softBusyDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <span className="flex items-center gap-2">
                          {driver.displayName}
                          {driver.blockReason ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-warning border-warning/40"
                            >
                              {driver.blockReason}
                            </Badge>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              ) : null}
              {blockedDrivers.length > 0 &&
              (assignableDrivers.length > 0 || softBusyDrivers.length > 0) ? (
                <SelectSeparator />
              ) : null}
              {blockedDrivers.length > 0 ? (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {notAssignableLabel}
                  </SelectLabel>
                  {blockedDrivers.map((driver) => (
                    <SelectItem
                      key={driver.id}
                      value={driver.id}
                      disabled
                      className="opacity-60"
                    >
                      <span className="flex items-center gap-2">
                        {driver.displayName}
                        {driver.blockReason ? (
                          <Badge variant="outline" className="text-[10px]">
                            {driver.blockReason}
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </>
          )}
        </SelectContent>
      </Select>
    </FormFieldShell>
  );
}

interface VehicleSelectProps {
  fieldId?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  vehicles: readonly AssignableVehicleItem[];
  isLoading?: boolean;
  disabled?: boolean;
  errorMessage?: string;
  emptyLabel?: string;
  availableLabel?: string;
  softBusyLabel?: string;
  notAssignableLabel?: string;
  formatOption?: (vehicle: AssignableVehicleItem) => string;
}

export function VehicleSelect({
  fieldId = "vehicleId",
  label,
  placeholder,
  value,
  onChange,
  vehicles,
  isLoading = false,
  disabled = false,
  errorMessage,
  emptyLabel = "No hay unidades disponibles",
  availableLabel = "Disponibles",
  softBusyLabel = "En otro viaje",
  notAssignableLabel = "No asignables",
  formatOption = (vehicle) => `${vehicle.unitNumber} — ${vehicle.licensePlate}`,
}: VehicleSelectProps) {
  const assignableVehicles = vehicles.filter(
    (vehicle) => vehicle.canBeAssigned && !vehicle.softBusy,
  );
  const softBusyVehicles = vehicles.filter(
    (vehicle) => vehicle.softBusy === true,
  );
  const blockedVehicles = vehicles.filter(
    (vehicle) => !vehicle.canBeAssigned && !vehicle.softBusy,
  );

  return (
    <FormFieldShell
      fieldId={fieldId}
      label={label}
      errorMessage={errorMessage}
    >
      <Select
        onValueChange={(next) => next && onChange(next)}
        value={value || ""}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id={fieldId}
          error={Boolean(errorMessage)}
          {...getFieldErrorAriaProps(fieldId, errorMessage)}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
          )}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {vehicles.length === 0 && !isLoading ? (
            <SelectItem value="__empty__" disabled>
              {emptyLabel}
            </SelectItem>
          ) : (
            <>
              {assignableVehicles.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>{availableLabel}</SelectLabel>
                  {assignableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {formatOption(vehicle)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
              {softBusyVehicles.length > 0 ? (
                <>
                  {assignableVehicles.length > 0 ? <SelectSeparator /> : null}
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {softBusyLabel}
                    </SelectLabel>
                    {softBusyVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <span className="flex items-center gap-2">
                          {formatOption(vehicle)}
                          {vehicle.blockReason ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-warning border-warning/40"
                            >
                              {vehicle.blockReason}
                            </Badge>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              ) : null}
              {blockedVehicles.length > 0 &&
              (assignableVehicles.length > 0 || softBusyVehicles.length > 0) ? (
                <SelectSeparator />
              ) : null}
              {blockedVehicles.length > 0 ? (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {notAssignableLabel}
                  </SelectLabel>
                  {blockedVehicles.map((vehicle) => (
                    <SelectItem
                      key={vehicle.id}
                      value={vehicle.id}
                      disabled
                      className="opacity-60"
                    >
                      <span className="flex items-center gap-2">
                        {formatOption(vehicle)}
                        {vehicle.blockReason ? (
                          <Badge variant="outline" className="text-[10px]">
                            {vehicle.blockReason}
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </>
          )}
        </SelectContent>
      </Select>
    </FormFieldShell>
  );
}
