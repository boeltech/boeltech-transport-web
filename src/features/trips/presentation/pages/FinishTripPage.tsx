/**
 * FinishTripPage
 * FSD: Pages Layer - Composition
 *
 * Página dedicada para finalizar un viaje en curso.
 * Muestra resumen del viaje (ruta, paradas, cargas, gastos) y formulario
 * para capturar datos de finalización. Los costos operativos se gestionan
 * exclusivamente a través de TripExpenses (no en campos directos del viaje).
 *
 * Ubicación: src/pages/trips/finish/FinishTripPage.tsx
 *
 * Ruta: /trips/:id/finish
 * Requiere: viaje en status "in_progress"
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTrip,
  useFinishTrip,
  useTripExpenses,
  useUpdateExpense,
} from "@features/trips/application";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import type {
  TripStop,
  TripCargo,
  TripExpense,
  FinishTripInput,
} from "@features/trips/domain";
import {
  STOP_TYPE_LABELS,
  CARGO_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  CargoStatus,
  type StopTypeValue,
} from "@features/trips/domain";

// shadcn/ui
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { Separator } from "@shared/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
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
import { AlertWithIcon } from "@shared/ui/alert";

// Icons
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Truck,
  User,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  Navigation,
  FileText,
  Building2,
} from "lucide-react";
import { TripStatusBadge } from "../config/tripStatusConfig";
import {
  formatDateTime,
  localInputToUtcIso,
  utcIsoToLocalInput,
} from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

interface FinishFormState {
  endMileage: string;
  actualArrival: string;
  notes: string;
}

interface FormErrors {
  endMileage?: string;
  actualArrival?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-MX");
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function getStopTypeLabels(stopType: StopTypeValue | StopTypeValue[]): string {
  if (Array.isArray(stopType)) {
    return stopType.map((t) => STOP_TYPE_LABELS[t] || t).join(" / ");
  }
  return STOP_TYPE_LABELS[stopType] || String(stopType);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Resumen de ruta con paradas */
function RouteSummary({ stops }: { stops?: TripStop[] }) {
  if (!stops || stops.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-4 w-4" />
          Ruta del Viaje ({stops.length} paradas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {stops
            .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
            .map((stop, index) => (
              <div key={stop.id} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : index === stops.length - 1
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < stops.length - 1 && (
                    <div className="w-px flex-1 bg-border min-h-[24px]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getStopTypeLabels(stop.stopType)}
                    </Badge>
                    <Badge
                      variant={
                        stop.status === "completed"
                          ? "default"
                          : stop.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {stop.status === "completed"
                        ? "Completada"
                        : stop.status === "in_progress"
                          ? "En progreso"
                          : "Pendiente"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mt-1 truncate">
                    {stop.locationName || stop.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stop.city}
                    {stop.state ? `, ${stop.state}` : ""}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Resumen de cargas */
function CargoSummary({ cargos }: { cargos?: TripCargo[] }) {
  if (!cargos || cargos.length === 0) return null;

  const totalWeight = cargos.reduce((acc, c) => acc + (c.weight || 0), 0);
  const totalUnits = cargos.reduce((acc, c) => acc + (c.units || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Cargas ({cargos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {cargos.map((cargo, index) => (
          <div
            key={cargo.id || index}
            className="flex items-start justify-between gap-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{cargo.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {cargo.client && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {cargo.client.legalName}
                  </span>
                )}
                {cargo.weight && <span>{formatNumber(cargo.weight)} kg</span>}
                {cargo.units && <span>{cargo.units} unidades</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge
                variant={cargo.status === "delivered" ? "default" : "secondary"}
                className="text-xs"
              >
                {CARGO_STATUS_LABELS[cargo.status] || cargo.status}
              </Badge>
            </div>
          </div>
        ))}
        <Separator />
        <div className="text-sm">
          <span className="text-muted-foreground">
            {totalWeight > 0 && `${formatNumber(totalWeight)} kg total`}
            {totalWeight > 0 && totalUnits > 0 && " · "}
            {totalUnits > 0 && `${totalUnits} unidades total`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Sección de gastos estimados con inputs para confirmar monto real.
 * Recibe los gastos con isEstimated:true y el estado de edición.
 */
function EstimatedExpensesSection({
  expenses,
  isLoading,
  amounts,
  onAmountChange,
}: {
  expenses: TripExpense[];
  isLoading: boolean;
  amounts: Record<string, string>;
  onAmountChange: (expenseId: string, value: string) => void;
}) {
  const totalEstimated = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalReal = expenses.reduce((acc, e) => {
    const override = amounts[e.id];
    return acc + (override !== undefined ? parseFloat(override) || 0 : e.amount);
  }, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Gastos del Viaje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Cargando gastos...
          </div>
        )}

        {!isLoading && expenses.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No hay gastos registrados para este viaje.
          </p>
        )}

        {!isLoading && expenses.length > 0 && (
          <>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 text-xs text-muted-foreground font-medium pb-1 border-b">
              <span>Gasto</span>
              <span className="text-right w-20">Estimado</span>
              <span className="text-right w-24">Real</span>
            </div>
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {EXPENSE_CATEGORY_LABELS[expense.category] ??
                      expense.category}
                  </p>
                  {expense.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {expense.description}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground text-right w-20 tabular-nums">
                  {formatCurrency(expense.amount)}
                </span>
                <div className="w-24">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={String(expense.amount)}
                    value={amounts[expense.id] ?? ""}
                    onChange={(e) => onAmountChange(expense.id, e.target.value)}
                    className="h-7 text-xs text-right"
                  />
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-normal text-xs">
                  Est. {formatCurrency(totalEstimated)}
                </span>
                <span>{formatCurrency(totalReal)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinishTripPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // Data
  const { data: trip, isLoading, isError } = useTrip(id!);
  const { data: expenses = [], isLoading: expensesLoading } = useTripExpenses(
    id!,
  );

  // Mutations
  const finishMutation = useFinishTrip({
    onSuccess: (finishedTrip) => {
      toast({
        title: "Viaje finalizado",
        description: `${finishedTrip.tripCode} ha sido completado exitosamente`,
        variant: "success",
      });
      navigate(`/trips/${finishedTrip.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al finalizar viaje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useUpdateExpense(id!);

  // Form state
  const [form, setForm] = useState<FinishFormState>({
    endMileage: "",
    actualArrival: utcIsoToLocalInput(new Date().toISOString()),
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Expense real amounts: expenseId → string value del input
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>(
    {},
  );

  // Permissions
  const canUpdate = hasPermission("trips", "update");

  // Computed values
  const startMileage = trip?.mileage?.start ?? null;

  const distanceKm = useMemo(() => {
    if (!startMileage || !form.endMileage) return null;
    const end = parseInt(form.endMileage, 10);
    if (isNaN(end) || end <= startMileage) return null;
    return end - startMileage;
  }, [startMileage, form.endMileage]);

  // Solo gastos estimados son editables al finalizar
  const estimatedExpenses = expenses.filter((e) => e.isEstimated);

  // Gastos con monto real diferente al estimado (serán actualizados)
  const modifiedExpenses = estimatedExpenses.filter((e) => {
    const override = expenseAmounts[e.id];
    return override !== undefined && parseFloat(override) !== e.amount;
  });

  // Pendientes al momento de finalizar
  const pendingStops = (trip?.stops ?? []).filter((s) => !s.actualArrival);
  const pendingCargos = (trip?.cargos ?? []).filter(
    (c) =>
      c.status !== CargoStatus.DELIVERED && c.status !== CargoStatus.CANCELLED,
  );
  const hasPendingItems = pendingStops.length > 0 || pendingCargos.length > 0;

  // Handlers
  const updateField = (field: keyof FinishFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleExpenseAmountChange = (expenseId: string, value: string) => {
    setExpenseAmounts((prev) => ({ ...prev, [expenseId]: value }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const endMileage = parseInt(form.endMileage, 10);
    if (!form.endMileage || isNaN(endMileage)) {
      newErrors.endMileage = "El kilometraje final es requerido";
    } else if (endMileage <= 0) {
      newErrors.endMileage = "El kilometraje debe ser mayor a 0";
    } else if (startMileage !== null && endMileage < startMileage) {
      newErrors.endMileage = `Debe ser mayor o igual al kilometraje inicial (${formatNumber(startMileage)} km)`;
    }

    if (!form.actualArrival) {
      newErrors.actualArrival = "La hora real de llegada es requerida";
    } else if (trip?.actualDeparture) {
      const arrival = new Date(form.actualArrival);
      const departure = new Date(trip.actualDeparture);
      if (arrival <= departure) {
        newErrors.actualArrival = "La llegada debe ser posterior a la salida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);

    try {
      // 1. Actualizar gastos modificados (estimado → real)
      if (modifiedExpenses.length > 0) {
        await Promise.all(
          modifiedExpenses.map((e) =>
            updateExpenseMutation.mutateAsync({
              expenseId: e.id,
              data: {
                amount: parseFloat(expenseAmounts[e.id]),
                isEstimated: false,
              },
            }),
          ),
        );
      }
    } catch (error) {
      toast({
        title: "Error al confirmar gastos",
        description:
          error instanceof Error
            ? error.message
            : "No fue posible actualizar los gastos estimados.",
        variant: "destructive",
      });
      return;
    }

    // 2. Finalizar el viaje
    const data: FinishTripInput = {
      endMileage: parseInt(form.endMileage, 10),
      actualArrival: localInputToUtcIso(form.actualArrival),
      notes: form.notes || undefined,
    };

    finishMutation.mutate({ id: id!, data });
  };

  // ============================================================================
  // RENDER: Loading
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ============================================================================
  // RENDER: Error
  // ============================================================================

  if (isError || !trip) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Error al cargar el viaje</h2>
        <p className="text-muted-foreground mb-4">
          No se pudo obtener la información del viaje.
        </p>
        <Button variant="outline" onClick={() => navigate("/trips")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Viajes
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER: Wrong status guard
  // ============================================================================

  if (trip.status !== "in_progress") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">
          Este viaje no puede finalizarse
        </h2>
        <p className="text-muted-foreground mb-4">
          Solo los viajes con estado "En Curso" pueden ser finalizados. El
          estado actual es: <Badge variant="secondary">{trip.status}</Badge>
        </p>
        <Button variant="outline" onClick={() => navigate(`/trips/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Ver Detalle del Viaje
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER: No permission guard
  // ============================================================================

  if (!canUpdate) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Sin permisos</h2>
        <p className="text-muted-foreground mb-4">
          No tienes permisos para finalizar viajes.
        </p>
        <Button variant="outline" onClick={() => navigate(`/trips/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const isPending =
    finishMutation.isPending || updateExpenseMutation.isPending;

  // ============================================================================
  // RENDER: Main
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/trips/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Finalizar Viaje</h1>
          <p className="text-muted-foreground">
            {trip.tripCode} · {trip.originCity} → {trip.destinationCity}
          </p>
        </div>
        <TripStatusBadge status={trip.status} size="sm" showIcon={false} />
      </div>

      {hasPendingItems && (
        <AlertWithIcon
          variant="warning"
          title="Elementos pendientes de confirmar"
        >
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            {pendingStops.length > 0 && (
              <li>
                {pendingStops.length} parada
                {pendingStops.length > 1 ? "s" : ""} sin marcar como visitada
                {pendingStops.length > 1 ? "s" : ""}
              </li>
            )}
            {pendingCargos.length > 0 && (
              <li>
                {pendingCargos.length} carga
                {pendingCargos.length > 1 ? "s" : ""} sin marcar como entregada
                {pendingCargos.length > 1 ? "s" : ""}
              </li>
            )}
          </ul>
          <p className="mt-2 text-xs opacity-80">
            Puedes registrarlos desde la tab Ruta y Cargas del detalle del viaje
            antes de finalizar.
          </p>
        </AlertWithIcon>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================== */}
        {/* LEFT: Trip Summary (2 cols)    */}
        {/* ============================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Vehicle */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unidad</span>
                </div>
                <p className="font-semibold mt-1">
                  {trip.vehicle?.unitNumber || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trip.vehicle?.licensePlate || ""}
                </p>
              </CardContent>
            </Card>

            {/* Driver */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Conductor</span>
                </div>
                <p className="font-semibold mt-1 truncate">
                  {trip.driver?.fullName || "—"}
                </p>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Cliente</span>
                </div>
                <p className="font-semibold mt-1 truncate">
                  {trip.client?.legalName || "Sin cliente"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Times */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Tiempos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Salida programada
                  </span>
                  <p className="font-medium">
                    {formatDateTime(trip.scheduledDeparture.toISOString())}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Llegada programada
                  </span>
                  <p className="font-medium">
                    {formatDateTime(trip.scheduledArrival?.toISOString())}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Salida real</span>
                  <p className="font-medium">
                    {formatDateTime(trip.actualDeparture?.toISOString())}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Kilometraje inicial
                  </span>
                  <p className="font-medium">
                    {startMileage !== null
                      ? `${formatNumber(startMileage)} km`
                      : "No registrado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route */}
          <RouteSummary stops={trip.stops} />

          {/* Cargos */}
          <CargoSummary cargos={trip.cargos} />

          {/* Gastos — editar monto real de estimados */}
          <EstimatedExpensesSection
            expenses={estimatedExpenses}
            isLoading={expensesLoading}
            amounts={expenseAmounts}
            onAmountChange={handleExpenseAmountChange}
          />
        </div>

        {/* ============================== */}
        {/* RIGHT: Finish Form (1 col)     */}
        {/* ============================== */}
        <div className="space-y-6">
          {/* Finish Form */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-primary" />
                Datos de Finalización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* End Mileage */}
              <div className="space-y-1.5">
                <Label htmlFor="endMileage" className="flex items-center gap-1">
                  <Navigation className="h-3.5 w-3.5" />
                  Kilometraje final *
                </Label>
                <Input
                  id="endMileage"
                  type="number"
                  placeholder={
                    startMileage
                      ? `Mayor a ${formatNumber(startMileage)}`
                      : "Ej: 155000"
                  }
                  value={form.endMileage}
                  onChange={(e) => updateField("endMileage", e.target.value)}
                  className={errors.endMileage ? "border-destructive" : ""}
                />
                {errors.endMileage && (
                  <p className="text-xs text-destructive">
                    {errors.endMileage}
                  </p>
                )}
                {distanceKm !== null && (
                  <p className="text-xs text-muted-foreground">
                    Distancia recorrida:{" "}
                    <span className="font-medium">
                      {formatNumber(distanceKm)} km
                    </span>
                  </p>
                )}
              </div>

              {/* Actual Arrival */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="actualArrival"
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Hora real de llegada *
                </Label>
                <Input
                  id="actualArrival"
                  type="datetime-local"
                  value={form.actualArrival}
                  onChange={(e) => updateField("actualArrival", e.target.value)}
                  className={errors.actualArrival ? "border-destructive" : ""}
                />
                {errors.actualArrival && (
                  <p className="text-xs text-destructive">
                    {errors.actualArrival}
                  </p>
                )}
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Observaciones (opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Novedades del viaje, incidentes, observaciones..."
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Finalizar Viaje
              </Button>
            </CardContent>
          </Card>

          {/* Help text */}
          <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Al finalizar el viaje:</p>
            <p>• El vehículo y conductor quedarán disponibles</p>
            <p>• El estado cambiará a "Completado"</p>
            <p>• Los gastos modificados se registrarán como reales</p>
            <p>• Esta acción no se puede deshacer</p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Finalizar viaje {trip.tripCode}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Se registrarán los siguientes datos de finalización:</p>
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">
                      Kilometraje final:
                    </span>{" "}
                    <span className="font-medium">
                      {formatNumber(parseInt(form.endMileage, 10))} km
                    </span>
                    {distanceKm !== null && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({formatNumber(distanceKm)} km recorridos)
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Llegada real:</span>{" "}
                    <span className="font-medium">
                      {formatDateTime(localInputToUtcIso(form.actualArrival))}
                    </span>
                  </p>
                  {modifiedExpenses.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">
                        Gastos a confirmar:
                      </span>{" "}
                      <span className="font-medium">
                        {modifiedExpenses.length} gasto
                        {modifiedExpenses.length > 1 ? "s" : ""} con monto real
                      </span>
                    </p>
                  )}
                </div>
                <p className="text-destructive text-xs">
                  Esta acción no se puede deshacer. El vehículo y conductor
                  quedarán disponibles.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Finalización
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
