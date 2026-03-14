/**
 * FinishTripPage
 * FSD: Pages Layer - Composition
 *
 * Página dedicada para finalizar un viaje en curso.
 * Muestra resumen del viaje (ruta, paradas, cargas, costos estimados)
 * y formulario para capturar datos de finalización.
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
  type FinishTripInput,
} from "@features/trips/application";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import type { TripStop, TripCargo } from "@features/trips/domain";
import {
  STOP_TYPE_LABELS,
  CARGO_STATUS_LABELS,
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

// Icons
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Truck,
  User,
  MapPin,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  Navigation,
  Fuel,
  CircleDollarSign,
  FileText,
  Building2,
} from "lucide-react";
import { TripStatusBadge } from "../config/tripStatusConfig";
import {
  formatDateTime,
  getTodayString,
  localInputToUtcIso,
} from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

interface FinishFormState {
  endMileage: string;
  actualArrival: string;
  fuelCost: string;
  tollCost: string;
  otherCosts: string;
  notes: string;
}

interface FormErrors {
  endMileage?: string;
  actualArrival?: string;
  fuelCost?: string;
  tollCost?: string;
  otherCosts?: string;
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

/**
 * Obtiene las labels de stop type (soporta string y array)
 */
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
  const totalRevenue = cargos.reduce((acc, c) => acc + (c.rate || 0), 0);

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
              <p className="text-xs font-medium mt-0.5">
                {formatCurrency(cargo.rate)}
              </p>
            </div>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {totalWeight > 0 && `${formatNumber(totalWeight)} kg total`}
            {totalWeight > 0 && totalUnits > 0 && " · "}
            {totalUnits > 0 && `${totalUnits} unidades total`}
          </span>
          <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
        </div>
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

  // Mutation
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

  // Form state
  const [form, setForm] = useState<FinishFormState>({
    endMileage: "",
    actualArrival: getTodayString(),
    fuelCost: "",
    tollCost: "",
    otherCosts: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConfirm, setShowConfirm] = useState(false);

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

  const estimatedCosts = trip?.costs;

  const finalCosts = useMemo(() => {
    const fuel = parseFloat(form.fuelCost) || 0;
    const tolls = parseFloat(form.tollCost) || 0;
    const other = parseFloat(form.otherCosts) || 0;
    const total = fuel + tolls + other;
    return { fuel, tolls, other, total };
  }, [form.fuelCost, form.tollCost, form.otherCosts]);

  // Handlers
  const updateField = (field: keyof FinishFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // End mileage is required
    const endMileage = parseInt(form.endMileage, 10);
    if (!form.endMileage || isNaN(endMileage)) {
      newErrors.endMileage = "El kilometraje final es requerido";
    } else if (endMileage <= 0) {
      newErrors.endMileage = "El kilometraje debe ser mayor a 0";
    } else if (startMileage !== null && endMileage <= startMileage) {
      newErrors.endMileage = `Debe ser mayor al kilometraje inicial (${formatNumber(startMileage)} km)`;
    }

    // Actual arrival is required
    if (!form.actualArrival) {
      newErrors.actualArrival = "La hora real de llegada es requerida";
    } else if (trip?.actualDeparture) {
      const arrival = new Date(form.actualArrival);
      const departure = new Date(trip.actualDeparture);
      if (arrival <= departure) {
        newErrors.actualArrival = "La llegada debe ser posterior a la salida";
      }
    }

    // Costs validation (optional but must be valid numbers)
    if (
      form.fuelCost &&
      (isNaN(parseFloat(form.fuelCost)) || parseFloat(form.fuelCost) < 0)
    ) {
      newErrors.fuelCost = "Ingrese un monto válido";
    }
    if (
      form.tollCost &&
      (isNaN(parseFloat(form.tollCost)) || parseFloat(form.tollCost) < 0)
    ) {
      newErrors.tollCost = "Ingrese un monto válido";
    }
    if (
      form.otherCosts &&
      (isNaN(parseFloat(form.otherCosts)) || parseFloat(form.otherCosts) < 0)
    ) {
      newErrors.otherCosts = "Ingrese un monto válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);

    const data: FinishTripInput = {
      endMileage: parseInt(form.endMileage, 10),
      actualArrival: localInputToUtcIso(form.actualArrival),
      fuelCost: form.fuelCost ? parseFloat(form.fuelCost) : undefined,
      tollCost: form.tollCost ? parseFloat(form.tollCost) : undefined,
      otherCosts: form.otherCosts ? parseFloat(form.otherCosts) : undefined,
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
        {/* <TripStatusBadgeAnimated status={trip.status} size="sm" /> */}
        <TripStatusBadge status={trip.status} size="sm" showIcon={false} />
      </div>

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
                    {formatDateTime(trip.scheduledArrival.toISOString())}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Salida real</span>
                  <p className="font-medium">
                    {formatDateTime(trip.actualDeparture.toISOString())}
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

          {/* Estimated Costs */}
          {estimatedCosts && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Costos Estimados (al crear viaje)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tarifa base</span>
                    <p className="font-medium">
                      {formatCurrency(estimatedCosts.baseRate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Combustible</span>
                    <p className="font-medium">
                      {formatCurrency(estimatedCosts.fuelCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Casetas</span>
                    <p className="font-medium">
                      {formatCurrency(estimatedCosts.tollCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Otros</span>
                    <p className="font-medium">
                      {formatCurrency(estimatedCosts.otherCosts)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

              {/* Costs Section */}
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-1">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  Costos Reales (opcional)
                </p>

                {/* Fuel Cost */}
                <div className="space-y-1.5 mb-3">
                  <Label
                    htmlFor="fuelCost"
                    className="text-xs flex items-center gap-1"
                  >
                    <Fuel className="h-3 w-3" />
                    Combustible
                  </Label>
                  <Input
                    id="fuelCost"
                    type="number"
                    step="0.01"
                    placeholder={
                      estimatedCosts?.fuelCost
                        ? `Estimado: ${formatCurrency(estimatedCosts.fuelCost)}`
                        : "$0.00"
                    }
                    value={form.fuelCost}
                    onChange={(e) => updateField("fuelCost", e.target.value)}
                    className={errors.fuelCost ? "border-destructive" : ""}
                  />
                  {errors.fuelCost && (
                    <p className="text-xs text-destructive">
                      {errors.fuelCost}
                    </p>
                  )}
                </div>

                {/* Toll Cost */}
                <div className="space-y-1.5 mb-3">
                  <Label
                    htmlFor="tollCost"
                    className="text-xs flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Casetas / Peajes
                  </Label>
                  <Input
                    id="tollCost"
                    type="number"
                    step="0.01"
                    placeholder={
                      estimatedCosts?.tollCost
                        ? `Estimado: ${formatCurrency(estimatedCosts.tollCost)}`
                        : "$0.00"
                    }
                    value={form.tollCost}
                    onChange={(e) => updateField("tollCost", e.target.value)}
                    className={errors.tollCost ? "border-destructive" : ""}
                  />
                  {errors.tollCost && (
                    <p className="text-xs text-destructive">
                      {errors.tollCost}
                    </p>
                  )}
                </div>

                {/* Other Costs */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="otherCosts"
                    className="text-xs flex items-center gap-1"
                  >
                    <DollarSign className="h-3 w-3" />
                    Otros gastos
                  </Label>
                  <Input
                    id="otherCosts"
                    type="number"
                    step="0.01"
                    placeholder="$0.00"
                    value={form.otherCosts}
                    onChange={(e) => updateField("otherCosts", e.target.value)}
                    className={errors.otherCosts ? "border-destructive" : ""}
                  />
                  {errors.otherCosts && (
                    <p className="text-xs text-destructive">
                      {errors.otherCosts}
                    </p>
                  )}
                </div>

                {/* Total */}
                {finalCosts.total > 0 && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                    <span className="text-muted-foreground">
                      Total costos reales
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(finalCosts.total)}
                    </span>
                  </div>
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
                disabled={finishMutation.isPending}
              >
                {finishMutation.isPending ? (
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
            <p>• Se registrarán los datos finales para reportes</p>
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
                  {finalCosts.total > 0 && (
                    <p>
                      <span className="text-muted-foreground">
                        Costos reales:
                      </span>{" "}
                      <span className="font-medium">
                        {formatCurrency(finalCosts.total)}
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
              disabled={finishMutation.isPending}
            >
              {finishMutation.isPending && (
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
