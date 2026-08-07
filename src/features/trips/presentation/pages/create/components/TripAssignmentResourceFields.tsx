/**
 * Bloque compartido de asignación unidad/conductor (wizard completo + reserva).
 * Incluye «Ver toda la flota», docs vencidas, grupos y limpieza de selección.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { AlertTriangle, ChevronDown, Loader2, Truck, User } from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { DetailAlertCard } from "@shared/ui/data-display";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { Label } from "@shared/ui/label";
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
import { cn } from "@shared/lib/utils/cn";

import { useToast } from "@shared/hooks";
import { useAuth } from "@features/auth";
import { ROLES, type UserRole } from "@shared/constants/roles";

import type { AssignableVehicleItem } from "@features/vehicles/domain";

const ALLOW_EXPIRED_DOCS_ROLES: ReadonlySet<UserRole> = new Set([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DISPATCHER,
]);

import { wizardCopy } from "../../../copy";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import {
  shouldClearDriverSelection,
  shouldClearVehicleSelection,
} from "../tripAssignmentSelectability";
import type { TripWizardFormValues } from "./validation";

const copy = wizardCopy.basicInfo;
const reserveCopy = wizardCopy.shell.reserve;

export type TripAssignmentDensity = "default" | "reserve";

export interface TripAssignmentResourceFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: AssignableVehicleItem[];
  drivers: AssignableDriverItem[];
  isLoadingVehicles: boolean;
  isLoadingDrivers: boolean;
  /** Empleados ya en equipo de apoyo: no listarlos como conductor principal. */
  excludedDriverEmployeeIds?: ReadonlySet<string>;
  /** Prefijo de ids HTML para evitar colisiones si hay varios mounts. */
  idPrefix?: string;
  /**
   * `reserve`: unidad/conductor primero; opciones de flota/docs en bloque
   * colapsado (intake ADR-0071).
   */
  density?: TripAssignmentDensity;
}

export function TripAssignmentResourceFields({
  form,
  vehicles,
  drivers,
  isLoadingVehicles,
  isLoadingDrivers,
  excludedDriverEmployeeIds,
  idPrefix = "",
  density = "default",
}: TripAssignmentResourceFieldsProps) {
  const { control } = form;
  const selectedVehicleId = form.watch("vehicleId");
  const selectedDriverId = form.watch("driverId");
  const originBranchId = form.watch("originBranchId");
  const isReserveDensity = density === "reserve";

  const { toast } = useToast();
  const { user } = useAuth();
  const canAllowExpiredDocs =
    user?.role != null && ALLOW_EXPIRED_DOCS_ROLES.has(user.role);

  const [showAllFleet, setShowAllFleet] = useState(false);
  const [allowExpiredDocs, setAllowExpiredDocs] = useState(false);
  const [fleetOptionsOpen, setFleetOptionsOpen] = useState(!isReserveDensity);

  const effectiveAllowExpiredDocs = canAllowExpiredDocs && allowExpiredDocs;

  const showAllFleetId = `${idPrefix}showAllFleet`;
  const allowExpiredDocsId = `${idPrefix}allowExpiredDocs`;

  const matchesOriginBranch = useCallback(
    (branchId: string | null | undefined) => {
      if (showAllFleet) return true;
      const originId = originBranchId?.trim();
      if (!originId) return true;
      return !branchId || branchId === originId;
    },
    [showAllFleet, originBranchId],
  );

  const scopedVehicles = useMemo(
    () => vehicles.filter((vehicle) => matchesOriginBranch(vehicle.branchId)),
    [vehicles, matchesOriginBranch],
  );

  const scopedDrivers = useMemo(
    () => drivers.filter((driver) => matchesOriginBranch(driver.branchId)),
    [drivers, matchesOriginBranch],
  );

  const assignableVehicles = scopedVehicles.filter((v) => v.canBeAssigned);
  const expiredDocsVehicles = scopedVehicles.filter(
    (v) =>
      !v.canBeAssigned &&
      effectiveAllowExpiredDocs &&
      v.expiredDocsOverridable === true,
  );
  const blockedVehicles = scopedVehicles.filter(
    (v) =>
      !v.canBeAssigned &&
      !(effectiveAllowExpiredDocs && v.expiredDocsOverridable === true),
  );

  const hasExpiredDocsInScope = useMemo(
    () =>
      scopedVehicles.some((v) => v.expiredDocsOverridable === true) ||
      scopedDrivers.some((d) => d.expiredDocsOverridable === true),
    [scopedVehicles, scopedDrivers],
  );

  const selectedVehicleAssignment = useMemo(
    () => scopedVehicles.find((vehicle) => vehicle.id === selectedVehicleId),
    [scopedVehicles, selectedVehicleId],
  );

  const selectedDriverAssignment = useMemo(
    () => scopedDrivers.find((driver) => driver.id === selectedDriverId),
    [scopedDrivers, selectedDriverId],
  );

  const expiredAssignmentAlertItems = useMemo(() => {
    const items: Array<{ label: string; text: string }> = [];
    if (
      selectedVehicleAssignment?.expiredDocsOverridable &&
      selectedVehicleAssignment.blockReason
    ) {
      items.push({
        label: copy.label.vehicle,
        text: copy.alert.expiredVehicleItem(
          selectedVehicleAssignment.blockReason,
        ),
      });
    }
    if (
      selectedDriverAssignment?.expiredDocsOverridable &&
      selectedDriverAssignment.blockReason
    ) {
      items.push({
        label: copy.label.driver,
        text: copy.alert.expiredDriverItem(
          selectedDriverAssignment.blockReason,
        ),
      });
    }
    return items;
  }, [selectedVehicleAssignment, selectedDriverAssignment]);

  const {
    assignableDriversForConductorSelect,
    expiredDocsDriversForConductorSelect,
    blockedDriversForConductorSelect,
  } = useMemo(() => {
    const keepInDriverSelect = (d: AssignableDriverItem) => {
      if (d.id === selectedDriverId) return true;
      if (!excludedDriverEmployeeIds || excludedDriverEmployeeIds.size === 0) {
        return true;
      }
      return !excludedDriverEmployeeIds.has(d.employeeId);
    };
    const assignable = scopedDrivers.filter(
      (d) => d.canBeAssigned && keepInDriverSelect(d),
    );
    const expiredDocsSelectable = scopedDrivers.filter(
      (d) =>
        !d.canBeAssigned &&
        d.expiredDocsOverridable === true &&
        effectiveAllowExpiredDocs &&
        keepInDriverSelect(d),
    );
    const blocked = scopedDrivers.filter(
      (d) =>
        !d.canBeAssigned &&
        !(effectiveAllowExpiredDocs && d.expiredDocsOverridable === true) &&
        keepInDriverSelect(d),
    );
    return {
      assignableDriversForConductorSelect: assignable,
      expiredDocsDriversForConductorSelect: expiredDocsSelectable,
      blockedDriversForConductorSelect: blocked,
    };
  }, [
    scopedDrivers,
    excludedDriverEmployeeIds,
    selectedDriverId,
    effectiveAllowExpiredDocs,
  ]);

  useEffect(() => {
    if (!selectedVehicleId) return;
    const vehicle = vehicles.find((item) => item.id === selectedVehicleId);
    if (
      shouldClearVehicleSelection(vehicle, {
        allowExpiredDocs: effectiveAllowExpiredDocs,
        inBranchScope: matchesOriginBranch(vehicle?.branchId),
      })
    ) {
      form.setValue("vehicleId", "", { shouldDirty: true, shouldValidate: true });
      form.setValue("startMileage", undefined, { shouldDirty: true });
      form.setValue("vehicleCurrentMileage", undefined, { shouldDirty: true });
      toast({
        title: copy.alert.assignmentClearedTitle,
        description: copy.alert.assignmentClearedBody,
        variant: "warning",
      });
    }
  }, [
    effectiveAllowExpiredDocs,
    showAllFleet,
    originBranchId,
    selectedVehicleId,
    vehicles,
    matchesOriginBranch,
    form,
    toast,
  ]);

  useEffect(() => {
    if (!selectedDriverId) return;
    const driver = drivers.find((item) => item.id === selectedDriverId);
    if (
      shouldClearDriverSelection(driver, {
        allowExpiredDocs: effectiveAllowExpiredDocs,
        inBranchScope: matchesOriginBranch(driver?.branchId),
      })
    ) {
      form.setValue("driverId", "", { shouldDirty: true, shouldValidate: true });
      toast({
        title: copy.alert.assignmentClearedTitle,
        description: copy.alert.assignmentClearedBody,
        variant: "warning",
      });
    }
  }, [
    effectiveAllowExpiredDocs,
    showAllFleet,
    originBranchId,
    selectedDriverId,
    drivers,
    matchesOriginBranch,
    form,
    toast,
  ]);

  const fleetOptionsBody = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={showAllFleetId}
          checked={showAllFleet}
          onCheckedChange={(checked) => setShowAllFleet(checked === true)}
        />
        <Label htmlFor={showAllFleetId} className="text-sm font-normal">
          {copy.label.showAllFleet}
        </Label>
      </div>
      {!showAllFleet && originBranchId?.trim() ? (
        <p className="pl-6 text-xs text-muted-foreground">
          {copy.hint.fleetBranchFilter}
        </p>
      ) : null}
      {hasExpiredDocsInScope && canAllowExpiredDocs ? (
        <div className="flex items-start gap-2">
          <Checkbox
            id={allowExpiredDocsId}
            className="mt-0.5"
            checked={effectiveAllowExpiredDocs}
            onCheckedChange={(checked) =>
              setAllowExpiredDocs(canAllowExpiredDocs && checked === true)
            }
          />
          <Label htmlFor={allowExpiredDocsId} className="cursor-pointer">
            <SectionHeadingWithHint
              noTitleWrap
              title={copy.label.allowExpiredDocs}
              hintLabel={copy.hintLabel.allowExpiredDocs}
              hint={<>{copy.hint.allowExpiredDocs}</>}
              titleClassName="text-sm font-normal"
            />
          </Label>
        </div>
      ) : null}
    </div>
  );

  const fleetOptionsPanel = isReserveDensity ? (
    <Collapsible open={fleetOptionsOpen} onOpenChange={setFleetOptionsOpen}>
      <div className="rounded-lg border bg-muted/30">
        <CollapsibleTrigger
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50"
        >
          {reserveCopy.label.fleetOptions}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              fleetOptionsOpen && "rotate-180",
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border/60 px-3 py-3">
          {fleetOptionsBody}
        </CollapsibleContent>
      </div>
    </Collapsible>
  ) : (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">{copy.section.listingOptions}</p>
      {fleetOptionsBody}
    </div>
  );

  const assignmentFields = (
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="vehicleId"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="vehicleId"
              label={copy.label.vehicle}
              required
              errorMessage={fieldState.error?.message}
            >
              <Select
                onValueChange={(value) => value && field.onChange(value)}
                value={field.value ?? ""}
                disabled={isLoadingVehicles}
              >
                <SelectTrigger
                  id="vehicleId"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "vehicleId",
                    fieldState.error?.message,
                  )}
                >
                  {isLoadingVehicles ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <SelectValue placeholder={copy.placeholder.selectVehicle} />
                </SelectTrigger>
                <SelectContent>
                  {scopedVehicles.length === 0 && !isLoadingVehicles ? (
                    <SelectItem value="no-vehicles" disabled>
                      {copy.state.noVehicles}
                    </SelectItem>
                  ) : (
                    <>
                      {assignableVehicles.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>{copy.state.available}</SelectLabel>
                          {assignableVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {copy.format.vehicleOption(
                                v.unitNumber,
                                v.licensePlate,
                              )}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {expiredDocsVehicles.length > 0 && (
                        <SelectGroup>
                          {assignableVehicles.length > 0 ? (
                            <SelectSeparator />
                          ) : null}
                          <SelectLabel className="flex items-center gap-1.5 text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {copy.state.withExpiredDocs}
                          </SelectLabel>
                          {expiredDocsVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <span className="flex items-center gap-2">
                                {copy.format.vehicleOption(
                                  v.unitNumber,
                                  v.licensePlate,
                                )}
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {v.blockReason}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {blockedVehicles.length > 0 &&
                        (assignableVehicles.length > 0 ||
                          expiredDocsVehicles.length > 0) && (
                          <SelectSeparator />
                        )}
                      {blockedVehicles.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-1.5 text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {copy.state.notAssignable}
                          </SelectLabel>
                          {blockedVehicles.map((v) => (
                            <SelectItem
                              key={v.id}
                              value={v.id}
                              disabled
                              className="opacity-60"
                            >
                              <span className="flex items-center gap-2">
                                {v.unitNumber} — {v.licensePlate}
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {v.blockReason}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </FormFieldShell>
          )}
        />

        <Controller
          control={control}
          name="driverId"
          render={({ field, fieldState }) => (
            <FormFieldShell
              fieldId="driverId"
              label={copy.label.driver}
              required
              errorMessage={fieldState.error?.message}
            >
              <Select
                onValueChange={(value) => value && field.onChange(value)}
                value={field.value ?? ""}
                disabled={isLoadingDrivers}
              >
                <SelectTrigger
                  id="driverId"
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "driverId",
                    fieldState.error?.message,
                  )}
                >
                  {isLoadingDrivers ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <SelectValue placeholder={copy.placeholder.selectDriver} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 && !isLoadingDrivers ? (
                    <SelectItem value="no-drivers" disabled>
                      {copy.state.noDrivers}
                    </SelectItem>
                  ) : assignableDriversForConductorSelect.length === 0 &&
                    expiredDocsDriversForConductorSelect.length === 0 &&
                    blockedDriversForConductorSelect.length === 0 ? (
                    <SelectItem value="no-drivers-available" disabled>
                      {excludedDriverEmployeeIds &&
                      excludedDriverEmployeeIds.size > 0
                        ? copy.state.noDriversOutsideSupportStaff
                        : copy.state.noDrivers}
                    </SelectItem>
                  ) : (
                    <>
                      {assignableDriversForConductorSelect.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>{copy.state.available}</SelectLabel>
                          {assignableDriversForConductorSelect.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.displayName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {expiredDocsDriversForConductorSelect.length > 0 && (
                        <SelectGroup>
                          {assignableDriversForConductorSelect.length > 0 ? (
                            <SelectSeparator />
                          ) : null}
                          <SelectLabel className="flex items-center gap-1.5 text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {copy.state.withExpiredDocs}
                          </SelectLabel>
                          {expiredDocsDriversForConductorSelect.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              <span className="flex items-center gap-2">
                                {d.displayName}
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {d.blockReason}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {blockedDriversForConductorSelect.length > 0 &&
                        (assignableDriversForConductorSelect.length > 0 ||
                          expiredDocsDriversForConductorSelect.length > 0) && (
                          <SelectSeparator />
                        )}
                      {blockedDriversForConductorSelect.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="flex items-center gap-1.5 text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {copy.state.notAssignable}
                          </SelectLabel>
                          {blockedDriversForConductorSelect.map((d) => (
                            <SelectItem
                              key={d.id}
                              value={d.id}
                              disabled
                              className="opacity-60"
                            >
                              <span className="flex items-center gap-2">
                                {d.displayName}
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {d.blockReason}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </FormFieldShell>
          )}
        />
      </div>
  );

  return (
    <div className="space-y-5">
      {isReserveDensity ? (
        <>
          {assignmentFields}
          {fleetOptionsPanel}
        </>
      ) : (
        <>
          {fleetOptionsPanel}
          {assignmentFields}
        </>
      )}

      {expiredAssignmentAlertItems.length > 0 ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
          title={copy.alert.expiredAssignmentTitle}
          items={expiredAssignmentAlertItems}
        />
      ) : null}
    </div>
  );
}
