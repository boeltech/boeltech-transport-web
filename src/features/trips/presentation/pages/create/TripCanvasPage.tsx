/**
 * Canvas de alta de viaje (ADR-0078 F2).
 * Una pantalla Pedido | Flota. Submit = POST /trips create_intent=reserve.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveInternalAppHref } from "@shared/utils/resolveInternalAppHref";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, ChevronDown, ClipboardList, Truck } from "lucide-react";

import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { FormValidationSummary } from "@shared/ui/form";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";

import {
  TripCreationError,
  useClientCorridors,
  useCreateTrip,
  useRouteEstimate,
  useTrips,
} from "@features/trips/application";
import { TripStatus, type ClientCorridor } from "@features/trips/domain";
import { useAssignableVehicles } from "@features/vehicles/application";
import { useDrivers } from "@features/drivers/application";
import { useActiveClients } from "@features/clients/application";

import { canvasCopy } from "../../copy/canvasCopy";
import { CorridorPicker } from "../../components/corridor/CorridorPicker";
import { RouteEstimateCard } from "../../components/corridor/RouteEstimateCard";
import { replaceStopsFromCorridor } from "../../components/trip-route/buildReplaceStopsPayload";
import { ReservePedidoStep } from "./components/ReservePedidoStep";
import { ReserveAsignarStep } from "./components/ReserveAsignarStep";
import { ReserveConfirmLaterFields } from "./components/ReserveConfirmLaterFields";
import {
  defaultWizardFormValues,
  tripReserveWizardSchema,
  type TripWizardFormValues,
} from "./components/validation";
import {
  applyBusyResourcesToVehicles,
  buildBusyAssignmentResourceIds,
} from "./tripAssignmentBusyResources";
import { buildAssignableDriversForTripWizard } from "./tripAssignmentDrivers";
import { buildCreateTripInputFromWizardValues } from "./wizardToCreateTripInput";
import {
  formatTripApiValidationForUser,
  validateCreateTripApiPayload,
} from "./validateTripApiPayload";

const copy = canvasCopy;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function resolveTripCanvasBackHref(from: string | undefined): string {
  const fallback = "/trips";
  const candidate = resolveInternalAppHref(from, fallback);
  const path = candidate.split("?")[0] ?? candidate;
  /** Solo listado `/trips` (+ query); no detalle ni otras rutas. */
  return path === "/trips" ? candidate : fallback;
}

export function TripCanvasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const listBackHref = resolveTripCanvasBackHref(
    location.state?.from as string | undefined,
  );
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [confirmLaterOpen, setConfirmLaterOpen] = useState(false);
  const [selectedCorridor, setSelectedCorridor] =
    useState<ClientCorridor | null>(null);
  const [allowExpiredDocs, setAllowExpiredDocs] = useState(false);
  const validationSummaryRef = useRef<HTMLDivElement>(null);

  const { data: vehiclesRaw = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles({ refetchOnMount: "always" });
  const { data: driversPage, isLoading: isLoadingDrivers } = useDrivers(
    { page: 1, limit: 100 },
    { refetchOnMount: "always" },
  );
  const { data: activeTripsPage } = useTrips(
    {
      page: 1,
      limit: 100,
      filters: {
        status: [TripStatus.IN_PROGRESS, TripStatus.SCHEDULED],
      },
    },
    { enabled: true, refetchOnMount: "always" },
  );
  const { data: clients = [], isLoading: isLoadingClients } =
    useActiveClients();

  const busyResources = useMemo(
    () => buildBusyAssignmentResourceIds(activeTripsPage?.data ?? []),
    [activeTripsPage?.data],
  );
  const vehicles = useMemo(
    () =>
      applyBusyResourcesToVehicles(vehiclesRaw, busyResources.vehicleIds, {
        softBusySelectable: true,
        conflicts: busyResources.vehicleConflicts,
      }),
    [vehiclesRaw, busyResources.vehicleIds, busyResources.vehicleConflicts],
  );
  const assignableDrivers = useMemo(
    () =>
      buildAssignableDriversForTripWizard(
        driversPage?.data ?? [],
        busyResources.driverIds,
        {
          softBusySelectable: true,
          conflicts: busyResources.driverConflicts,
        },
      ),
    [driversPage?.data, busyResources.driverIds, busyResources.driverConflicts],
  );

  const form = useForm<TripWizardFormValues>({
    resolver: zodResolver(tripReserveWizardSchema) as never,
    defaultValues: defaultWizardFormValues,
    mode: "onChange",
  });

  const clientId = form.watch("clientId");
  const originCity = form.watch("originCity") ?? "";
  const destinationCity = form.watch("destinationCity") ?? "";
  const vehicleId = form.watch("vehicleId");

  useEffect(() => {
    if (!selectedCorridor) return;
    if (
      originCity.trim() !== selectedCorridor.originCity ||
      destinationCity.trim() !== selectedCorridor.destinationCity
    ) {
      setSelectedCorridor(null);
    }
  }, [originCity, destinationCity, selectedCorridor]);

  const { data: corridors = [], isLoading: isLoadingCorridors } =
    useClientCorridors(clientId);

  const debouncedOrigin = useDebouncedValue(originCity.trim(), 400);
  const debouncedDestination = useDebouncedValue(destinationCity.trim(), 400);

  const { data: estimate } = useRouteEstimate(
    clientId
      ? {
          clientId,
          corridorKey: selectedCorridor?.corridorKey,
          originCity: selectedCorridor ? undefined : debouncedOrigin,
          destinationCity: selectedCorridor ? undefined : debouncedDestination,
          vehicleId: vehicleId || undefined,
        }
      : undefined,
  );

  const createMutation = useCreateTrip();

  const handleSelectCorridor = useCallback(
    (corridor: ClientCorridor) => {
      setSelectedCorridor(corridor);
      form.setValue("originCity", corridor.originCity, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("destinationCity", corridor.destinationCity, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    setShowValidationSummary(false);
    const clonedStops =
      selectedCorridor && selectedCorridor.stopsSnapshot.length > 0
        ? replaceStopsFromCorridor(selectedCorridor)
        : undefined;
    const payload = buildCreateTripInputFromWizardValues(data, {
      createIntent: "reserve",
      clonedStops,
      allowExpiredDocs,
    });

    const createApiCheck = validateCreateTripApiPayload(payload);
    if (!createApiCheck.ok) {
      toast({
        title: copy.toast.serverValidationTitle,
        description: formatTripApiValidationForUser(createApiCheck.fieldErrors),
        variant: "error",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast({
        title: copy.toast.tripReserved,
        variant: "success",
      });
      if (result.warnings?.length) {
        for (const warning of result.warnings) {
          toast({
            title: copy.toast.overlapWarningTitle,
            description: warning.message,
            variant: "warning",
          });
        }
      }
      navigate(`/trips/${result.trip.id}`);
    } catch (error) {
      toast({
        title: copy.toast.createError,
        description:
          error instanceof TripCreationError || error instanceof Error
            ? error.message
            : copy.toast.unknownError,
        variant: "error",
      });
    }
  }, () => {
    setShowValidationSummary(true);
  });

  const validationMessages = showValidationSummary
    ? collectFieldErrorMessages(form.formState.errors)
    : [];

  useEffect(() => {
    if (!showValidationSummary || validationMessages.length === 0) return;
    validationSummaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showValidationSummary, validationMessages.length]);

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: listBackHref,
        backLabel: copy.page.backLabel,
        icon: <CalendarPlus className="h-5 w-5" />,
        title: copy.page.title,
        subtitle: copy.page.subtitle,
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSectionCard
            title={copy.columns.pedido}
            description={copy.columns.pedidoHint}
            icon={<ClipboardList className="h-4 w-4" />}
          >
            <div className="space-y-4">
              <ReservePedidoStep
                form={form}
                clients={clients}
                isLoadingClients={isLoadingClients}
                afterClient={
                  clientId ? (
                    <CorridorPicker
                      corridors={corridors}
                      isLoading={isLoadingCorridors}
                      selectedKey={selectedCorridor?.corridorKey}
                      onSelect={handleSelectCorridor}
                    />
                  ) : null
                }
              />
              <RouteEstimateCard estimate={estimate} />
            </div>
          </FormSectionCard>

          <FormSectionCard
            title={copy.columns.flota}
            description={copy.columns.flotaHint}
            icon={<Truck className="h-4 w-4" />}
          >
            <ReserveAsignarStep
              form={form}
              vehicles={vehicles}
              drivers={assignableDrivers}
              isLoadingVehicles={isLoadingVehicles}
              isLoadingDrivers={isLoadingDrivers}
              allowExpiredDocs={allowExpiredDocs}
              onAllowExpiredDocsChange={setAllowExpiredDocs}
            />
          </FormSectionCard>
        </div>

        <Collapsible open={confirmLaterOpen} onOpenChange={setConfirmLaterOpen}>
          <div className="rounded-xl border bg-card">
            <CollapsibleTrigger
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40"
            >
              <span>
                <span className="block text-sm font-semibold">
                  {copy.confirmLater.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {copy.confirmLater.hint}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  confirmLaterOpen && "rotate-180",
                )}
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border px-4 py-4">
                <ReserveConfirmLaterFields form={form} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div ref={validationSummaryRef} className="scroll-mt-28">
          <FormValidationSummary
            messages={validationMessages}
            title={copy.submit.validationTitle}
          />
        </div>

        {/*
          Sticky CTA — excepción canvas / pedido intake lean (TEC TD2).
          Ref. visual: BuilderPageShell sticky bottom. No tocar FormPageShell.
        */}
        <footer className="sticky bottom-0 z-10 -mx-1 mt-2 border-t bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              leftIcon={
                createMutation.isPending ? undefined : (
                  <CalendarPlus className="h-4 w-4" />
                )
              }
            >
              {createMutation.isPending
                ? copy.submit.pending
                : copy.submit.label}
            </Button>
          </div>
        </footer>
      </form>
    </FormPageShell>
  );
}
