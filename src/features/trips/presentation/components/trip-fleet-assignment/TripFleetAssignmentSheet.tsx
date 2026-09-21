import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileCheck2,
  Loader2,
  Plus,
  Trash2,
  Truck,
  User,
  Users,
} from "lucide-react";

import { useToast } from "@shared/hooks";
import { useAuth } from "@features/auth";
import { ROLES, type UserRole } from "@shared/constants/roles";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";

import { useAssignableVehicles } from "@features/vehicles/application";
import { useDrivers } from "@features/drivers/application";
import { useEmployees } from "@features/employees";
import {
  useActiveAssignmentTripsForBusy,
  useDraftHoldAssignmentTripsForSoft,
  useReassignTripFleet,
  invalidateTripAssignmentResources,
} from "@features/trips/application";
import {
  TripStatus,
  type Trip,
} from "@features/trips/domain";

import {
  applyBusyResourcesToVehicles,
  applyDraftHoldSoftSignalToVehicles,
  buildBusyAssignmentResourceIds,
  buildDraftHoldAssignmentResourceIds,
  conflictBadgeLabel,
  filterTripsOverlappingWindow,
  formatConflictDeparture,
} from "../../pages/create/tripAssignmentBusyResources";
import {
  applyDraftHoldSoftSignalToDrivers,
  buildAssignableDriversForTripWizard,
  type AssignableDriverItem,
} from "../../pages/create/tripAssignmentDrivers";
import {
  buildAssignableSupportStaffForTripWizard,
  applyDraftHoldSoftSignalToSupportStaff,
  type SupportStaffPositionFilter,
} from "../../pages/create/tripAssignmentSupportStaff";
import { resolveSelectedAssignmentLicenseSoftSignal } from "../../pages/create/tripAssignmentLicenseMatch";
import { getDriverLicenseAssignmentSoftSignal } from "@features/drivers";
import {
  isExpiredDocsGroupMember,
  shouldClearVehicleSelection,
  shouldClearDriverSelection,
} from "../../pages/create/tripAssignmentSelectability";
import { TripTrailerAssignmentFields } from "../../pages/create/components/TripTrailerAssignmentFields";
import { tripDetailCopy } from "../../copy";
import {
  tripFleetAssignmentSchema,
  type TripFleetAssignmentFormValues,
} from "./fleetAssignmentValidation";
import { isFleetAssignmentCpRelevantChange } from "./isFleetAssignmentCpRelevantChange";
import {
  FLEET_ASSIGNMENT_SHEET_BODY_CLASS,
  FLEET_ASSIGNMENT_SHEET_CONTENT_CLASS,
  FLEET_ASSIGNMENT_SHEET_FOOTER_CLASS,
  FLEET_ASSIGNMENT_SHEET_HEADER_CLASS,
  FLEET_ASSIGNMENT_SHEET_PRIMARY_BUTTON_CLASS,
} from "./fleetAssignmentSheetLayout";

const ALLOW_EXPIRED_DOCS_ROLES: ReadonlySet<UserRole> = new Set([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.DISPATCHER,
]);

const copy = tripDetailCopy.operation.fleetAssignment;

export interface TripFleetAssignmentSheetProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TripFleetAssignmentSheet({
  trip,
  open,
  onOpenChange,
}: TripFleetAssignmentSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [confirmFiscalDialogOpen, setConfirmFiscalDialogOpen] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<TripFleetAssignmentFormValues | null>(null);
  const [removeStaffDialog, setRemoveStaffDialog] = useState<{
    index: number;
    employeeName: string;
  } | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const [supportStaffPositionFilter, setSupportStaffPositionFilter] =
    useState<SupportStaffPositionFilter>("Conductor");
  const [draftStaffEmployeeId, setDraftStaffEmployeeId] = useState("");
  const [staffAddError, setStaffAddError] = useState<string | null>(null);

  const canAllowExpiredDocs = user
    ? ALLOW_EXPIRED_DOCS_ROLES.has(user.role as UserRole)
    : false;

  const defaultValues: TripFleetAssignmentFormValues = useMemo(() => {
    const vehicleRef = trip.vehicle as
      | { satConfigAutotransporteCode?: string | null }
      | undefined;

    return {
      vehicleId: trip.vehicle?.id ?? trip.vehicleId ?? "",
      driverId: trip.driver?.id ?? trip.driverId ?? "",
      trailers:
        trip.trailers?.map((t) => ({
          trailerId: t.trailerId,
          position: t.position,
        })) ?? [],
      satConfigAutotransporteCode:
        vehicleRef?.satConfigAutotransporteCode ?? "",
      internalStaff:
        trip.internalStaff?.map((m) => ({
          employeeId: m.employeeId,
          internalRole: m.internalRole ?? "helper",
          isPaymentResponsible: m.isPaymentResponsible ?? false,
          paymentNotes: m.paymentNotes ?? "",
        })) ?? [],
      // ADR-0066: default off (parity with canvas /trips/new). Opt-in only.
      allowExpiredDocs: false,
    };
  }, [trip]);

  const form = useForm<TripFleetAssignmentFormValues>({
    resolver: zodResolver(
      tripFleetAssignmentSchema,
    ) as Resolver<TripFleetAssignmentFormValues>,
    defaultValues,
    // Sheet largo: validar al cambiar (patrón form-validation-ux del repo).
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = form;

  const watchedVehicleId = useWatch({ control, name: "vehicleId" });
  const watchedDriverId = useWatch({ control, name: "driverId" });
  const watchedInternalStaff = useWatch({ control, name: "internalStaff" }) ?? [];

  const internalStaffFieldArray = useFieldArray({
    control,
    name: "internalStaff",
  });

  // Reset form only on opening transition (false -> true) to avoid wiping edits on background refetch
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset(defaultValues);
      setShowAllFleet(false);
      setDraftStaffEmployeeId("");
      setStaffAddError(null);
      setShowValidationSummary(false);
    }
    prevOpenRef.current = open;
  }, [open, defaultValues, reset]);

  // Fetch assignable fleet and active trips for busy conflict resolution (only while open)
  const { data: vehiclesRaw = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles({ enabled: open, refetchOnMount: "always" });

  const { data: driversPage, isLoading: isLoadingDrivers } = useDrivers(
    { page: 1, limit: 100 },
    { enabled: open, refetchOnMount: "always" },
  );

  const { data: employeesPage, isLoading: isLoadingEmployees } = useEmployees(
    {
      page: 1,
      limit: 100,
    },
    { enabled: open },
  );

  const { data: activeTripsResult } = useActiveAssignmentTripsForBusy({
    enabled: open,
    refetchOnMount: "always",
  });

  const softHoldFromDraft =
    trip.status === TripStatus.SCHEDULED ||
    trip.status === TripStatus.IN_PROGRESS;

  const { data: draftHoldTripsResult } = useDraftHoldAssignmentTripsForSoft({
    enabled: open && softHoldFromDraft,
    refetchOnMount: "always",
  });

  const [showAllFleet, setShowAllFleet] = useState(false);
  const watchedAllowExpiredDocs = form.watch("allowExpiredDocs");
  const effectiveAllowExpiredDocs =
    canAllowExpiredDocs && Boolean(watchedAllowExpiredDocs);

  const matchesOriginBranch = useCallback(
    (branchId: string | null | undefined) => {
      if (showAllFleet) return true;
      const originId = trip.originBranchId?.trim();
      if (!originId) return true;
      return !branchId || branchId === originId;
    },
    [showAllFleet, trip.originBranchId],
  );

  const busyResources = useMemo(() => {
    return buildBusyAssignmentResourceIds(
      activeTripsResult?.items ?? [],
      trip.id,
    );
  }, [activeTripsResult?.items, trip.id]);

  const draftHoldResources = useMemo(() => {
    if (!softHoldFromDraft) {
      return buildDraftHoldAssignmentResourceIds([], trip.id);
    }
    const overlapping = filterTripsOverlappingWindow(
      draftHoldTripsResult?.items ?? [],
      {
        scheduledDeparture: trip.scheduledDeparture,
        scheduledArrival: trip.scheduledArrival,
      },
    );
    return buildDraftHoldAssignmentResourceIds(overlapping, trip.id);
  }, [
    softHoldFromDraft,
    draftHoldTripsResult?.items,
    trip.id,
    trip.scheduledDeparture,
    trip.scheduledArrival,
  ]);

  // Producto: en draft, soft-busy es seleccionable con aviso (no hard-block Zod).
  // En scheduled/otros, softBusySelectable=false → UI hard-block de recursos busy.
  const softBusySelectable = trip.status === TripStatus.DRAFT;

  const softSelectGroupLabel = softBusySelectable
    ? copy.labels.softBusyGroup
    : copy.labels.softHoldGroup;

  const vehicles = useMemo(() => {
    const withHardOrDraftSoft = applyBusyResourcesToVehicles(
      vehiclesRaw,
      busyResources.vehicleIds,
      {
        keepAssignableVehicleId: trip.vehicle?.id ?? trip.vehicleId,
        softBusySelectable,
        conflicts: busyResources.vehicleConflicts,
      },
    );
    if (!softHoldFromDraft) return withHardOrDraftSoft;
    return applyDraftHoldSoftSignalToVehicles(
      withHardOrDraftSoft,
      draftHoldResources.vehicleIds,
      { conflicts: draftHoldResources.vehicleConflicts },
    );
  }, [
    vehiclesRaw,
    busyResources.vehicleIds,
    busyResources.vehicleConflicts,
    draftHoldResources.vehicleIds,
    draftHoldResources.vehicleConflicts,
    trip.vehicle?.id,
    trip.vehicleId,
    softBusySelectable,
    softHoldFromDraft,
  ]);

  const fleetDrivers = useMemo(
    () => driversPage?.data ?? [],
    [driversPage?.data],
  );

  const assignableDrivers = useMemo((): AssignableDriverItem[] => {
    const withHardOrDraftSoft = buildAssignableDriversForTripWizard(
      fleetDrivers,
      busyResources.driverIds,
      {
        keepAssignableDriverId: trip.driver?.id ?? trip.driverId,
        softBusySelectable,
        conflicts: busyResources.driverConflicts,
      },
    );
    if (!softHoldFromDraft) return withHardOrDraftSoft;
    return applyDraftHoldSoftSignalToDrivers(
      withHardOrDraftSoft,
      draftHoldResources.driverIds,
      { conflicts: draftHoldResources.driverConflicts },
    );
  }, [
    fleetDrivers,
    busyResources.driverIds,
    busyResources.driverConflicts,
    draftHoldResources.driverIds,
    draftHoldResources.driverConflicts,
    trip.driver?.id,
    trip.driverId,
    softBusySelectable,
    softHoldFromDraft,
  ]);

  const scopedVehicles = useMemo(
    () => vehicles.filter((v) => matchesOriginBranch(v.branchId)),
    [vehicles, matchesOriginBranch],
  );

  const scopedDrivers = useMemo(
    () => assignableDrivers.filter((d) => matchesOriginBranch(d.branchId)),
    [assignableDrivers, matchesOriginBranch],
  );

  const hasExpiredDocsInScope = useMemo(
    () =>
      scopedVehicles.some((v) => v.expiredDocsOverridable === true) ||
      scopedDrivers.some((d) => d.expiredDocsOverridable === true),
    [scopedVehicles, scopedDrivers],
  );

  const assignableVehicles = useMemo(
    () => scopedVehicles.filter((v) => v.canBeAssigned && !v.softBusy),
    [scopedVehicles],
  );

  const softBusyVehicles = useMemo(
    () => scopedVehicles.filter((v) => v.softBusy === true),
    [scopedVehicles],
  );

  const expiredDocsVehicles = useMemo(
    () =>
      scopedVehicles.filter((v) =>
        isExpiredDocsGroupMember(v, effectiveAllowExpiredDocs),
      ),
    [scopedVehicles, effectiveAllowExpiredDocs],
  );

  const blockedVehicles = useMemo(
    () =>
      scopedVehicles.filter(
        (v) =>
          !v.canBeAssigned &&
          !v.softBusy &&
          !isExpiredDocsGroupMember(v, effectiveAllowExpiredDocs),
      ),
    [scopedVehicles, effectiveAllowExpiredDocs],
  );

  const activeEmployees = useMemo(
    () =>
      (employeesPage?.data ?? []).filter(
        (employee) => employee.isActive && employee.status === "active",
      ),
    [employeesPage?.data],
  );

  const driversByEmployeeId = useMemo(() => {
    const map = new Map();
    for (const d of fleetDrivers) {
      map.set(d.employeeId, d);
    }
    return map;
  }, [fleetDrivers]);

  const selectedDriver = useMemo(
    () => assignableDrivers.find((d) => d.id === watchedDriverId),
    [assignableDrivers, watchedDriverId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === watchedVehicleId),
    [vehicles, watchedVehicleId],
  );

  // VehicleRef del detalle no incluye ConfigVehicular; sincronizar desde assignables
  // antes de validar remolques S/R (refineTrailersForConfig).
  useEffect(() => {
    if (!open) return;
    if (!watchedVehicleId) {
      setValue("satConfigAutotransporteCode", "", {
        shouldDirty: false,
        shouldValidate: true,
      });
      return;
    }
    if (!selectedVehicle) return;
    const code = selectedVehicle.satConfigAutotransporteCode ?? "";
    setValue("satConfigAutotransporteCode", code, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [open, watchedVehicleId, selectedVehicle, setValue]);

  /** Evita submit con satConfig aún vacío mientras carga el catálogo de unidades. */
  const awaitingVehicleConfigSync =
    Boolean(watchedVehicleId) && isLoadingVehicles;

  // Soft-match SICT license message
  const licenseSignalMessage = useMemo(() => {
    return resolveSelectedAssignmentLicenseSoftSignal(
      selectedDriver,
      selectedVehicle,
    )?.message;
  }, [selectedDriver, selectedVehicle]);

  // Support staff helpers
  const assignedStaffEmployeeIds = useMemo(() => {
    return new Set(
      watchedInternalStaff
        .map((m) => m.employeeId)
        .filter((id): id is string => Boolean(id)),
    );
  }, [watchedInternalStaff]);

  const excludedEmployeeIdsForSupport = useMemo(() => {
    const ids = new Set(assignedStaffEmployeeIds);
    if (selectedDriver?.employeeId) {
      ids.add(selectedDriver.employeeId);
    }
    return ids;
  }, [assignedStaffEmployeeIds, selectedDriver?.employeeId]);

  const {
    assignableDriversForSelect,
    softBusyDriversForSelect,
    expiredDocsDriversForSelect,
    blockedDriversForSelect,
  } = useMemo(() => {
    const keepInDriverSelect = (d: AssignableDriverItem) => {
      if (d.id === watchedDriverId) return true;
      if (assignedStaffEmployeeIds.size === 0) return true;
      return !assignedStaffEmployeeIds.has(d.employeeId);
    };

    const assignable = scopedDrivers.filter(
      (d) => d.canBeAssigned && !d.softBusy && keepInDriverSelect(d),
    );
    const softBusy = scopedDrivers.filter(
      (d) => d.softBusy === true && keepInDriverSelect(d),
    );
    const expiredDocs = scopedDrivers.filter(
      (d) =>
        isExpiredDocsGroupMember(d, effectiveAllowExpiredDocs) &&
        keepInDriverSelect(d),
    );
    const blocked = scopedDrivers.filter(
      (d) =>
        !d.canBeAssigned &&
        !d.softBusy &&
        !isExpiredDocsGroupMember(d, effectiveAllowExpiredDocs) &&
        keepInDriverSelect(d),
    );

    return {
      assignableDriversForSelect: assignable,
      softBusyDriversForSelect: softBusy,
      expiredDocsDriversForSelect: expiredDocs,
      blockedDriversForSelect: blocked,
    };
  }, [
    scopedDrivers,
    assignedStaffEmployeeIds,
    watchedDriverId,
    effectiveAllowExpiredDocs,
  ]);

  // Auto-clear selection when filters change and selected item is no longer selectable.
  // Only while the sheet is open — otherwise the always-mounted sheet would toast on trip detail enter.
  // Keep-current grandfather: do not clear the trip's current vehicle/driver for expired docs
  // when allowExpiredDocs is off (ADR-0066 reopen).
  const keepVehicleId = trip.vehicle?.id ?? trip.vehicleId;
  const keepDriverId = trip.driver?.id ?? trip.driverId;

  useEffect(() => {
    if (!open) return;
    if (!watchedVehicleId) return;
    const vehicle = vehicles.find((item) => item.id === watchedVehicleId);
    if (
      shouldClearVehicleSelection(vehicle, {
        allowExpiredDocs: effectiveAllowExpiredDocs,
        inBranchScope: matchesOriginBranch(vehicle?.branchId),
        keepResourceId: keepVehicleId,
      })
    ) {
      setValue("vehicleId", "", { shouldDirty: true, shouldValidate: true });
      setValue("satConfigAutotransporteCode", "");
      toast({
        title: copy.alerts.assignmentClearedTitle,
        description: copy.alerts.assignmentClearedBody,
        variant: "warning",
      });
    }
  }, [
    open,
    effectiveAllowExpiredDocs,
    showAllFleet,
    trip.originBranchId,
    watchedVehicleId,
    vehicles,
    matchesOriginBranch,
    keepVehicleId,
    setValue,
    toast,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!watchedDriverId) return;
    const driver = assignableDrivers.find((item) => item.id === watchedDriverId);
    if (
      shouldClearDriverSelection(driver, {
        allowExpiredDocs: effectiveAllowExpiredDocs,
        inBranchScope: matchesOriginBranch(driver?.branchId),
        keepResourceId: keepDriverId,
      })
    ) {
      setValue("driverId", "", { shouldDirty: true, shouldValidate: true });
      toast({
        title: copy.alerts.assignmentClearedTitle,
        description: copy.alerts.assignmentClearedBody,
        variant: "warning",
      });
    }
  }, [
    open,
    effectiveAllowExpiredDocs,
    showAllFleet,
    trip.originBranchId,
    watchedDriverId,
    assignableDrivers,
    matchesOriginBranch,
    keepDriverId,
    setValue,
    toast,
  ]);

  const expiredAssignmentAlertItems = useMemo(() => {
    const items: Array<{ label: string; text: string }> = [];
    if (
      selectedVehicle?.expiredDocsOverridable &&
      selectedVehicle.blockReason
    ) {
      items.push({
        label: copy.labels.vehicle,
        text: `${copy.labels.vehicle}: ${selectedVehicle.blockReason}`,
      });
    }
    if (
      selectedDriver?.expiredDocsOverridable &&
      selectedDriver.blockReason
    ) {
      items.push({
        label: copy.labels.driver,
        text: `${copy.labels.driver}: ${selectedDriver.blockReason}`,
      });
    }
    return items;
  }, [selectedVehicle, selectedDriver]);

  const supportStaffOptions = useMemo(() => {
    const base = buildAssignableSupportStaffForTripWizard({
      employees: activeEmployees,
      driversByEmployeeId,
      busyResources,
      positionFilter: supportStaffPositionFilter,
      excludeEmployeeIds: excludedEmployeeIdsForSupport,
      softBusySelectable,
    });
    if (!softHoldFromDraft) return base;
    return applyDraftHoldSoftSignalToSupportStaff(
      base,
      draftHoldResources.employeeIds,
      draftHoldResources.employeeConflicts,
    );
  }, [
    activeEmployees,
    driversByEmployeeId,
    busyResources,
    supportStaffPositionFilter,
    excludedEmployeeIdsForSupport,
    softBusySelectable,
    softHoldFromDraft,
    draftHoldResources.employeeIds,
    draftHoldResources.employeeConflicts,
  ]);

  /**
   * Commits draft filter + employee into RHF `internalStaff`.
   * Shared by «Agregar integrante» and submit flush (H1).
   * @returns false when validation failed (error on employee select).
   */
  const commitDraftSupportStaff = useCallback((): boolean => {
    setStaffAddError(null);
    const empId = draftStaffEmployeeId.trim();
    if (!empId) {
      setStaffAddError(copy.errors.selectEmployeeToAdd);
      return false;
    }

    const targetOption = supportStaffOptions.find(
      (opt) => opt.employeeId === empId,
    );
    if (targetOption && !targetOption.canBeAssigned && !targetOption.softBusy) {
      setStaffAddError(
        targetOption.blockReason ?? copy.errors.employeeUnavailable,
      );
      return false;
    }

    if (excludedEmployeeIdsForSupport.has(empId)) {
      setStaffAddError(copy.errors.employeeAlreadyAssigned);
      return false;
    }

    const defaultRole =
      supportStaffPositionFilter === copy.labels.positionDriver
        ? "secondary_driver"
        : "helper";

    const nextMember = {
      employeeId: empId,
      internalRole: defaultRole,
      isPaymentResponsible: false,
      paymentNotes: "",
    } as const;

    // replace (not append-only) so form values keep employeeId for Zod submit.
    // Network repro: append without registered employeeId → PATCH internal_staff: [].
    const next = [...(getValues("internalStaff") ?? []), nextMember];
    internalStaffFieldArray.replace(next);
    setValue("internalStaff", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger("internalStaff");

    setDraftStaffEmployeeId("");
    return true;
  }, [
    draftStaffEmployeeId,
    supportStaffOptions,
    excludedEmployeeIdsForSupport,
    supportStaffPositionFilter,
    getValues,
    setValue,
    trigger,
    internalStaffFieldArray,
  ]);

  const handleAddSupportStaff = useCallback(() => {
    commitDraftSupportStaff();
  }, [commitDraftSupportStaff]);

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of activeEmployees) {
      map.set(emp.id, emp.fullName);
    }
    return map;
  }, [activeEmployees]);

  // ADR-0093 — flota vía PATCH /fleet (funciona mid-trip; no usa canEditTrip)
  const reassignFleetMutation = useReassignTripFleet(trip.id, {
    onSuccess: async (result) => {
      await invalidateTripAssignmentResources(queryClient);
      toast({
        title: copy.toasts.success,
        variant: "default",
      });
      if (result.warnings?.length) {
        for (const warning of result.warnings) {
          toast({
            title: copy.toasts.overlapWarningTitle,
            description: warning.message,
            variant: "warning",
          });
        }
      }
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: copy.toasts.error,
        description: err.message,
        variant: "error",
      });
    },
  });

  const isStamped =
    trip.invoicing?.invoiceStatus === "stamped" ||
    trip.invoicing?.invoiceStatus === "cancellation_pending";
  const isFormBusy = isSubmitting || reassignFleetMutation.isPending;
  const isSaveDisabled = isFormBusy || awaitingVehicleConfigSync;
  const summaryMessages = collectFieldErrorMessages(errors);
  const requiresStaffRemovalConfirm =
    trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.COMPLETED;

  const applyInternalStaffRemoval = (index: number) => {
    const current = getValues("internalStaff") ?? [];
    const next = current.filter((_, i) => i !== index);
    internalStaffFieldArray.replace(next);
    setValue("internalStaff", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    void trigger("internalStaff");
    return next;
  };

  const handleRemoveSupportStaff = (index: number, employeeName: string) => {
    if (requiresStaffRemovalConfirm) {
      setRemoveStaffDialog({ index, employeeName });
      return;
    }
    applyInternalStaffRemoval(index);
  };

  /**
   * Confirmación en in_progress/completed: el copy promete remoción irreversible
   * (elegibilidad liquidación), así que persistimos con PATCH /fleet de inmediato.
   * Solo actualizar el form local + cerrar el sheet (bug Radix Sheet no-modal)
   * descartaba el cambio al reabrir.
   */
  const confirmRemoveSupportStaff = () => {
    if (!removeStaffDialog || isFormBusy) return;

    const next = applyInternalStaffRemoval(removeStaffDialog.index);
    setRemoveStaffDialog(null);

    const values = getValues();
    const payload: TripFleetAssignmentFormValues = {
      ...values,
      internalStaff: next,
    };

    if (isStamped && isFleetAssignmentCpRelevantChange(trip, payload)) {
      setPendingSubmitValues(payload);
      setConfirmFiscalDialogOpen(true);
      return;
    }

    executeUpdate(payload);
  };

  const executeUpdate = (values: TripFleetAssignmentFormValues) => {
    const internalStaff = getValues("internalStaff") ?? values.internalStaff ?? [];
    reassignFleetMutation.mutate({
      vehicleId: values.vehicleId,
      driverId: values.driverId,
      trailers: values.trailers,
      internalStaff,
      allowExpiredDocs: values.allowExpiredDocs,
    });
  };

  const onFormSubmit = (values: TripFleetAssignmentFormValues) => {
    // Flush pending Personal de apoyo draft so Guardar includes the selection
    // without requiring an extra click on «Agregar integrante».
    if (draftStaffEmployeeId.trim()) {
      const committed = commitDraftSupportStaff();
      if (!committed) {
        setShowValidationSummary(true);
        return;
      }
    }

    const submitted: TripFleetAssignmentFormValues = {
      ...values,
      internalStaff: getValues("internalStaff") ?? values.internalStaff ?? [],
    };

    if (isStamped && isFleetAssignmentCpRelevantChange(trip, submitted)) {
      setPendingSubmitValues(submitted);
      setConfirmFiscalDialogOpen(true);
      return;
    }

    executeUpdate(submitted);
  };

  const handleConfirmFiscalUpdate = () => {
    if (isFormBusy || !pendingSubmitValues) return;
    executeUpdate(pendingSubmitValues);
    setPendingSubmitValues(null);
    setConfirmFiscalDialogOpen(false);
  };

  const handleFiscalDialogOpenChange = (nextOpen: boolean) => {
    setConfirmFiscalDialogOpen(nextOpen);
    if (!nextOpen) {
      setPendingSubmitValues(null);
    }
  };

  const hasNestedConfirmDialog =
    removeStaffDialog !== null || confirmFiscalDialogOpen;

  const handleSheetOpenChange = (nextOpen: boolean) => {
    // Sheet is non-modal: clicks on AlertDialog count as "outside" and would
    // dismiss the sheet, discarding unpersisted staff edits.
    if (!nextOpen && hasNestedConfirmDialog) return;
    onOpenChange(nextOpen);
  };

  const preventSheetDismissWhileDialogOpen = (
    event: CustomEvent<{ originalEvent: Event }>,
  ) => {
    if (hasNestedConfirmDialog) {
      event.preventDefault();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className={FLEET_ASSIGNMENT_SHEET_CONTENT_CLASS}
          onInteractOutside={preventSheetDismissWhileDialogOpen}
          onPointerDownOutside={preventSheetDismissWhileDialogOpen}
        >
          <SheetHeader className={FLEET_ASSIGNMENT_SHEET_HEADER_CLASS}>
            <SheetTitle>{copy.sheetTitle}</SheetTitle>
            <SheetDescription>{copy.sheetDescription}</SheetDescription>
          </SheetHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleSubmit(onFormSubmit, () =>
              setShowValidationSummary(true),
            )}
          >
            <div className={FLEET_ASSIGNMENT_SHEET_BODY_CLASS}>
              {isStamped ? (
                <DetailAlertCard
                  severity="critical"
                  icon={<FileCheck2 className="h-5 w-5" />}
                  title={copy.alerts.fiscalImpactTitle}
                >
                  <p>{copy.alerts.fiscalImpactBody}</p>
                </DetailAlertCard>
              ) : null}

              {expiredAssignmentAlertItems.length > 0 ? (
                <DetailAlertCard
                  severity="warning"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  title={copy.alerts.expiredAssignmentTitle}
                  items={expiredAssignmentAlertItems}
                />
              ) : null}

              {Boolean(trip.originBranchId) ||
              (hasExpiredDocsInScope && canAllowExpiredDocs) ? (
                <FormSectionCard
                  title={copy.sections.exceptions}
                  icon={<AlertTriangle className="h-4 w-4" />}
                >
                  <div className="space-y-4">
                    {trip.originBranchId ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="fleet-show-all-fleet"
                            checked={showAllFleet}
                            onCheckedChange={(checked) =>
                              setShowAllFleet(checked === true)
                            }
                            disabled={isFormBusy}
                          />
                          <Label
                            htmlFor="fleet-show-all-fleet"
                            className="text-sm font-normal cursor-pointer"
                          >
                            {copy.labels.showAllFleet}
                          </Label>
                        </div>
                        {!showAllFleet ? (
                          <p className="pl-6 text-xs text-muted-foreground">
                            {copy.hints.fleetBranchFilter}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {hasExpiredDocsInScope && canAllowExpiredDocs ? (
                      <div className="flex items-start gap-2">
                        <Controller
                          control={control}
                          name="allowExpiredDocs"
                          render={({ field }) => (
                            <Checkbox
                              id="fleet-allow-expired-docs"
                              className="mt-0.5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isFormBusy}
                            />
                          )}
                        />
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="fleet-allow-expired-docs"
                            className="text-sm font-normal cursor-pointer"
                          >
                            {copy.labels.allowExpiredDocs}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {copy.hints.allowExpiredDocs}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </FormSectionCard>
              ) : null}

              <FormSectionCard
                title={copy.sections.vehicle}
                icon={<Truck className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  <FormFieldShell
                    label={copy.labels.vehicle}
                    fieldId="fleet-vehicle-select"
                    required
                    errorMessage={errors.vehicleId?.message}
                  >
                    <Controller
                      control={control}
                      name="vehicleId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={(val) => {
                            field.onChange(val);
                            const veh = vehicles.find((v) => v.id === val);
                            if (veh) {
                              setValue(
                                "satConfigAutotransporteCode",
                                veh.satConfigAutotransporteCode ?? "",
                              );
                            }
                          }}
                          disabled={isLoadingVehicles || isFormBusy}
                        >
                          <SelectTrigger
                            id="fleet-vehicle-select"
                            error={Boolean(errors.vehicleId)}
                            {...getFieldErrorAriaProps(
                              "fleet-vehicle-select",
                              errors.vehicleId?.message,
                            )}
                          >
                            {isLoadingVehicles ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                            )}
                            <SelectValue placeholder={copy.placeholders.vehicle} />
                          </SelectTrigger>
                          <SelectContent>
                            {scopedVehicles.length === 0 && !isLoadingVehicles ? (
                              <SelectItem value="no-vehicles" disabled>
                                {copy.labels.noVehicles}
                              </SelectItem>
                            ) : (
                              <>
                                {assignableVehicles.length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {copy.labels.availableGroup}
                                    </SelectLabel>
                                    {assignableVehicles.map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        {v.unitNumber} — {v.licensePlate} ({v.type})
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : null}

                                {softBusyVehicles.length > 0 ? (
                                  <SelectGroup>
                                    {assignableVehicles.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      {softSelectGroupLabel}
                                    </SelectLabel>
                                    {softBusyVehicles.map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        <span className="flex items-center gap-2">
                                          <span>
                                            {v.unitNumber} — {v.licensePlate} ({v.type})
                                          </span>
                                          {v.blockReason ? (
                                            <Badge
                                              variant="outline"
                                              className="text-xs text-warning border-warning/40"
                                            >
                                              {v.blockReason}
                                            </Badge>
                                          ) : null}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : null}

                                {expiredDocsVehicles.length > 0 ? (
                                  <SelectGroup>
                                    {assignableVehicles.length > 0 ||
                                    softBusyVehicles.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      {copy.labels.withExpiredDocs}
                                    </SelectLabel>
                                    {expiredDocsVehicles.map((v) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        <span className="flex items-center gap-2">
                                          <span>
                                            {v.unitNumber} — {v.licensePlate} ({v.type})
                                          </span>
                                          <Badge variant="destructive" className="text-xs">
                                            {v.blockReason}
                                          </Badge>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : null}

                                {blockedVehicles.length > 0 ? (
                                  <>
                                    {assignableVehicles.length > 0 ||
                                    softBusyVehicles.length > 0 ||
                                    expiredDocsVehicles.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectGroup>
                                      <SelectLabel className="flex items-center gap-1.5 text-warning">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {copy.labels.unavailableGroup}
                                      </SelectLabel>
                                      {blockedVehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id} disabled>
                                          <span className="flex items-center gap-2">
                                            <span>
                                              {v.unitNumber} — {v.licensePlate}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                              {v.blockReason ??
                                                copy.labels.blockedBadgeDefault}
                                            </Badge>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </>
                                ) : null}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormFieldShell>

                  <TripTrailerAssignmentFields
                    form={form}
                    vehicles={vehicles}
                    idPrefix="fleet-sheet-"
                    softBusySelectable={softBusySelectable}
                  />
                </div>
              </FormSectionCard>

              <FormSectionCard
                title={copy.sections.driver}
                icon={<User className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  <FormFieldShell
                    label={copy.labels.driver}
                    fieldId="fleet-driver-select"
                    required
                    errorMessage={errors.driverId?.message}
                  >
                    <Controller
                      control={control}
                      name="driverId"
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          disabled={isLoadingDrivers || isFormBusy}
                        >
                          <SelectTrigger
                            id="fleet-driver-select"
                            error={Boolean(errors.driverId)}
                            {...getFieldErrorAriaProps(
                              "fleet-driver-select",
                              errors.driverId?.message,
                            )}
                          >
                            {isLoadingDrivers ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            )}
                            <SelectValue placeholder={copy.placeholders.driver} />
                          </SelectTrigger>
                          <SelectContent>
                            {scopedDrivers.length === 0 && !isLoadingDrivers ? (
                              <SelectItem value="no-drivers" disabled>
                                {copy.labels.noDrivers}
                              </SelectItem>
                            ) : assignableDriversForSelect.length === 0 &&
                              softBusyDriversForSelect.length === 0 &&
                              expiredDocsDriversForSelect.length === 0 &&
                              blockedDriversForSelect.length === 0 ? (
                              <SelectItem value="no-drivers-available" disabled>
                                {assignedStaffEmployeeIds.size > 0
                                  ? copy.labels.noDriversOutsideSupportStaff
                                  : copy.labels.noDrivers}
                              </SelectItem>
                            ) : (
                              <>
                                {assignableDriversForSelect.length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {copy.labels.availableGroup}
                                    </SelectLabel>
                                    {assignableDriversForSelect.map((d) => {
                                      const softSignal = selectedVehicle?.type
                                        ? getDriverLicenseAssignmentSoftSignal(
                                            d,
                                            selectedVehicle.type,
                                          )
                                        : undefined;
                                      return (
                                        <SelectItem key={d.id} value={d.id}>
                                          <span className="flex items-center gap-2">
                                            <span>{d.displayName}</span>
                                            {softSignal?.kind ===
                                            "category_mismatch" ? (
                                              <Badge
                                                variant="outline"
                                                className="text-xs text-warning border-warning/40"
                                              >
                                                {copy.labels.licenseCategorySoft}
                                              </Badge>
                                            ) : null}
                                            {softSignal?.kind ===
                                            "missing_federal" ? (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs font-normal"
                                              >
                                                {copy.labels.licenseMissingFederal}
                                              </Badge>
                                            ) : null}
                                          </span>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectGroup>
                                ) : null}

                                {softBusyDriversForSelect.length > 0 ? (
                                  <SelectGroup>
                                    {assignableDriversForSelect.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      {softSelectGroupLabel}
                                    </SelectLabel>
                                    {softBusyDriversForSelect.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>
                                        <span className="flex items-center gap-2">
                                          <span>{d.displayName}</span>
                                          {d.blockReason ? (
                                            <Badge
                                              variant="outline"
                                              className="text-xs text-warning border-warning/40"
                                            >
                                              {d.blockReason}
                                            </Badge>
                                          ) : null}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : null}

                                {expiredDocsDriversForSelect.length > 0 ? (
                                  <SelectGroup>
                                    {assignableDriversForSelect.length > 0 ||
                                    softBusyDriversForSelect.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectLabel className="flex items-center gap-1.5 text-warning">
                                      <AlertTriangle className="h-3.5 w-3.5" />
                                      {copy.labels.withExpiredDocs}
                                    </SelectLabel>
                                    {expiredDocsDriversForSelect.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>
                                        <span className="flex items-center gap-2">
                                          <span>{d.displayName}</span>
                                          <Badge variant="destructive" className="text-xs">
                                            {d.blockReason}
                                          </Badge>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : null}

                                {blockedDriversForSelect.length > 0 ? (
                                  <>
                                    {assignableDriversForSelect.length > 0 ||
                                    softBusyDriversForSelect.length > 0 ||
                                    expiredDocsDriversForSelect.length > 0 ? (
                                      <SelectSeparator />
                                    ) : null}
                                    <SelectGroup>
                                      <SelectLabel className="flex items-center gap-1.5 text-warning">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        {copy.labels.unavailableGroup}
                                      </SelectLabel>
                                      {blockedDriversForSelect.map((d) => (
                                        <SelectItem key={d.id} value={d.id} disabled>
                                          <span className="flex items-center gap-2">
                                            <span>{d.displayName}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {d.blockReason ??
                                                copy.labels.blockedBadgeDefault}
                                            </Badge>
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </>
                                ) : null}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormFieldShell>

                  {selectedVehicle?.softBusy || selectedDriver?.softBusy ? (
                    <DetailAlertCard
                      severity="warning"
                      icon={<AlertTriangle className="h-5 w-5" />}
                      title={
                        softHoldFromDraft
                          ? copy.alerts.softHoldTitle
                          : copy.alerts.softBusyTitle
                      }
                      items={[
                        ...(selectedVehicle?.softBusy
                          ? [
                              {
                                text: softHoldFromDraft
                                  ? selectedVehicle.assignmentConflict
                                    ? copy.alerts.softHoldBody({
                                        resourceLabel:
                                          copy.alerts.softBusyVehicleLabel,
                                        tripCode:
                                          selectedVehicle.assignmentConflict
                                            .tripCode,
                                        departureLabel: formatConflictDeparture(
                                          selectedVehicle.assignmentConflict
                                            .scheduledDeparture,
                                        ),
                                      })
                                    : copy.alerts.softHoldBodyGeneric(
                                        copy.alerts.softBusyVehicleLabel,
                                      )
                                  : selectedVehicle.assignmentConflict
                                    ? copy.alerts.softBusyBody({
                                        resourceLabel:
                                          copy.alerts.softBusyVehicleLabel,
                                        tripCode:
                                          selectedVehicle.assignmentConflict
                                            .tripCode,
                                        statusLabel: conflictBadgeLabel(
                                          selectedVehicle.assignmentConflict,
                                        ),
                                        departureLabel: formatConflictDeparture(
                                          selectedVehicle.assignmentConflict
                                            .scheduledDeparture,
                                        ),
                                      })
                                    : copy.alerts.softBusyBodyGeneric(
                                        copy.alerts.softBusyVehicleLabel,
                                      ),
                              },
                            ]
                          : []),
                        ...(selectedDriver?.softBusy
                          ? [
                              {
                                text: softHoldFromDraft
                                  ? selectedDriver.assignmentConflict
                                    ? copy.alerts.softHoldBody({
                                        resourceLabel:
                                          copy.alerts.softBusyDriverLabel,
                                        tripCode:
                                          selectedDriver.assignmentConflict
                                            .tripCode,
                                        departureLabel: formatConflictDeparture(
                                          selectedDriver.assignmentConflict
                                            .scheduledDeparture,
                                        ),
                                      })
                                    : copy.alerts.softHoldBodyGeneric(
                                        copy.alerts.softBusyDriverLabel,
                                      )
                                  : selectedDriver.assignmentConflict
                                    ? copy.alerts.softBusyBody({
                                        resourceLabel:
                                          copy.alerts.softBusyDriverLabel,
                                        tripCode:
                                          selectedDriver.assignmentConflict
                                            .tripCode,
                                        statusLabel: conflictBadgeLabel(
                                          selectedDriver.assignmentConflict,
                                        ),
                                        departureLabel: formatConflictDeparture(
                                          selectedDriver.assignmentConflict
                                            .scheduledDeparture,
                                        ),
                                      })
                                    : copy.alerts.softBusyBodyGeneric(
                                        copy.alerts.softBusyDriverLabel,
                                      ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  ) : null}

                  {licenseSignalMessage ? (
                    <DetailAlertCard
                      severity="warning"
                      icon={<AlertTriangle className="h-5 w-5" />}
                      title={copy.alerts.licenseSoftMatchTitle}
                    >
                      <p>{licenseSignalMessage}</p>
                    </DetailAlertCard>
                  ) : null}
                </div>
              </FormSectionCard>

              <FormSectionCard
                title={copy.sections.supportStaff}
                description={copy.hints.supportStaff}
                icon={<Users className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormFieldShell
                      label={copy.labels.supportStaffFilter}
                      fieldId="fleet-support-staff-filter"
                    >
                      <Select
                        value={supportStaffPositionFilter}
                        onValueChange={(val) =>
                          setSupportStaffPositionFilter(
                            val as SupportStaffPositionFilter,
                          )
                        }
                        disabled={isFormBusy}
                      >
                        <SelectTrigger id="fleet-support-staff-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={copy.labels.positionDriver}>
                            {copy.labels.positionDriver}
                          </SelectItem>
                          <SelectItem value={copy.labels.positionHelper}>
                            {copy.labels.positionHelper}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormFieldShell>

                    <FormFieldShell
                      label={copy.labels.supportStaffEmployee}
                      fieldId="fleet-support-staff-employee"
                      errorMessage={staffAddError ?? undefined}
                    >
                      <Select
                        value={draftStaffEmployeeId || undefined}
                        onValueChange={(value) => {
                          setDraftStaffEmployeeId(value);
                          setStaffAddError(null);
                        }}
                        disabled={isLoadingEmployees || isFormBusy}
                      >
                        <SelectTrigger
                          id="fleet-support-staff-employee"
                          error={Boolean(staffAddError)}
                          {...getFieldErrorAriaProps(
                            "fleet-support-staff-employee",
                            staffAddError ?? undefined,
                          )}
                        >
                          <SelectValue
                            placeholder={copy.placeholders.supportStaffEmployee}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {supportStaffOptions
                            .filter((opt) => opt.canBeAssigned && !opt.softBusy)
                            .map((opt) => (
                              <SelectItem
                                key={opt.employeeId}
                                value={opt.employeeId}
                              >
                                {opt.fullName}
                              </SelectItem>
                            ))}
                          {supportStaffOptions.some((opt) => opt.softBusy) ? (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-warning">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {softSelectGroupLabel}
                              </SelectLabel>
                              {supportStaffOptions
                                .filter((opt) => opt.softBusy)
                                .map((opt) => (
                                  <SelectItem
                                    key={opt.employeeId}
                                    value={opt.employeeId}
                                  >
                                    {opt.fullName}
                                    {opt.blockReason
                                      ? ` (${opt.blockReason})`
                                      : ""}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          ) : null}
                          {supportStaffOptions.filter(
                            (opt) => !opt.canBeAssigned && !opt.softBusy,
                          ).length > 0 ? (
                            <SelectGroup>
                              <SelectLabel>
                                {copy.labels.unavailableGroup}
                              </SelectLabel>
                              {supportStaffOptions
                                .filter(
                                  (opt) => !opt.canBeAssigned && !opt.softBusy,
                                )
                                .map((opt) => (
                                  <SelectItem
                                    key={opt.employeeId}
                                    value={opt.employeeId}
                                    disabled
                                  >
                                    {opt.fullName} ({opt.blockReason})
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </FormFieldShell>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleAddSupportStaff}
                    disabled={isFormBusy}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    {copy.actions.addStaffMember}
                  </Button>

                  {internalStaffFieldArray.fields.length > 0 ? (
                    <div className="space-y-2">
                      {internalStaffFieldArray.fields.map((field, index) => {
                        const employeeName =
                          employeeNameById.get(
                            watchedInternalStaff[index]?.employeeId ?? "",
                          ) ?? "Empleado";
                        return (
                          <div
                            key={field.id}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm shadow-xs"
                          >
                            <input
                              type="hidden"
                              {...register(
                                `internalStaff.${index}.employeeId` as const,
                              )}
                            />
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {employeeName}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {watchedInternalStaff[index]?.internalRole ===
                                  "secondary_driver"
                                    ? copy.labels.roleSecondaryDriver
                                    : copy.labels.roleHelper}
                                </Badge>
                                <Controller
                                  control={control}
                                  name={`internalStaff.${index}.internalRole`}
                                  render={({ field: roleField }) => (
                                    <Select
                                      value={roleField.value}
                                      onValueChange={roleField.onChange}
                                      disabled={isFormBusy}
                                    >
                                      <SelectTrigger className="h-8 w-36">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="secondary_driver">
                                          {copy.labels.roleSecondaryDriverShort}
                                        </SelectItem>
                                        <SelectItem value="helper">
                                          {copy.labels.roleHelperShort}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleRemoveSupportStaff(index, employeeName)
                              }
                              title={copy.actions.deleteStaffMember}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">
                                {copy.actions.deleteStaffMember}
                              </span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </FormSectionCard>

              {showValidationSummary && summaryMessages.length > 0 ? (
                <FormValidationSummary
                  title={copy.validation.summaryTitle}
                  messages={summaryMessages}
                />
              ) : null}
            </div>

            <SheetFooter className={FLEET_ASSIGNMENT_SHEET_FOOTER_CLASS}>
              <Button
                type="button"
                variant="outline"
                className={FLEET_ASSIGNMENT_SHEET_PRIMARY_BUTTON_CLASS}
                onClick={() => handleSheetOpenChange(false)}
                disabled={isFormBusy}
              >
                {copy.cancelButton}
              </Button>
              <Button
                type="submit"
                className={FLEET_ASSIGNMENT_SHEET_PRIMARY_BUTTON_CLASS}
                isLoading={isFormBusy}
                disabled={isSaveDisabled}
              >
                {isFormBusy ? copy.savingButton : copy.saveButton}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* CONFIRMATION MODAL FOR STAMPED INVOICE */}
      <AlertDialog
        open={confirmFiscalDialogOpen}
        onOpenChange={handleFiscalDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {copy.alerts.fiscalConfirmDialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy.alerts.fiscalConfirmDialogBody(trip.tripCode)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFormBusy}>
              {copy.alerts.fiscalConfirmDialogCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFiscalUpdate}
              disabled={isFormBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.alerts.fiscalConfirmDialogConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={removeStaffDialog !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveStaffDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeStaffDialog
                ? copy.removeStaffConfirm.title(removeStaffDialog.employeeName)
                : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {copy.removeStaffConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.removeStaffConfirm.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmRemoveSupportStaff();
              }}
              disabled={isFormBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.removeStaffConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
