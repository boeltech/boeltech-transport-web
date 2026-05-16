/**
 * SummaryStep - Paso 5 del Wizard
 * Resumen: Confirmación antes de crear el viaje
 */

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Textarea } from "@shared/ui/text-area";
import { Separator } from "@shared/ui/separator";
import { Badge } from "@shared/ui/badge";
import {
  Truck,
  User,
  Building2,
  Calendar,
  MapPin,
  Package,
  Receipt,
  FileText,
  Navigation,
  Flag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileCheck,
  Scale,
  Milestone,
} from "lucide-react";
import type { TripWizardFormValues } from "./validation";
import type { DriverListItem } from "@features/drivers";
import { formatDateTime } from "@shared/utils/dateUtils";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import {
  computeFinancialSummary,
  formatMxCurrency,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
} from "./financialSummary";

interface SummaryStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: Array<{ id: string; unitNumber: string; licensePlate: string }>;
  drivers: DriverListItem[];
  clients: Array<{ id: string; legalName: string }>;
}

export function SummaryStep({
  form,
  vehicles,
  drivers,
  clients,
}: SummaryStepProps) {
  const values = form.watch();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.unitNumber} - ${vehicle.licensePlate}` : "No seleccionado";
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find((d) => d.id === id);
    return driver
      ? `${driver.employee.firstName} ${driver.employee.lastName}`
      : "No seleccionado";
  };

  const getClientName = (id?: string) => {
    if (!id) return "Sin cliente";
    const client = clients.find((c) => c.id === id);
    return client?.legalName || "Cliente no encontrado";
  };

  const getStopLabel = (stopType: string[]): { primary: string; operation: string } => {
    if (stopType.includes("origin")) return { primary: "Origen", operation: "Carga" };
    if (stopType.includes("destination")) return { primary: "Destino", operation: "Descarga" };
    const ops: string[] = [];
    if (stopType.includes("pickup")) ops.push("Carga");
    if (stopType.includes("delivery")) ops.push("Descarga");
    return { primary: "Escala", operation: ops.join(" / ") || "Paso" };
  };

  // ── Route calculations ──────────────────────────────────────────────────────

  const stops = values.stops ?? [];
  const totalDistanceKm = stops.reduce(
    (sum, stop, i) => (i > 0 ? sum + (stop.distanceFromPreviousKm || 0) : sum),
    0,
  );

  // ── Financial calculations ──────────────────────────────────────────────────

  const baseRate = values.baseRate || 0;
  const totalOperationalCosts =
    values.expenses?.reduce(
      (sum, expense) =>
        isOperationalExpenseCategory(expense.category)
          ? sum + (expense.amount || 0)
          : sum,
      0,
    ) || 0;
  const totalIndirectExpenses =
    values.expenses?.reduce(
      (sum, expense) =>
        isIndirectExpenseCategory(expense.category)
          ? sum + (expense.amount || 0)
          : sum,
      0,
    ) || 0;
  const totalExpenses = totalOperationalCosts + totalIndirectExpenses;
  const financial = computeFinancialSummary(baseRate, totalExpenses, {
    totalOperationalCosts,
    totalIndirectExpenses,
  });

  // ── Cargo aggregates ────────────────────────────────────────────────────────

  const cargos = values.cargos ?? [];
  const totalWeightKg = cargos.reduce((sum, c) => sum + (c.weightInKg || 0), 0);
  const hasHazmat = cargos.some((c) => c.hazardousMaterial);
  const insuredCargos = cargos.filter(
    (c) => (c.declaredValue ?? 0) > 0 || !!c.aseguraCarga || !!c.polizaCarga,
  ).length;

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <Card className="border-primary/50">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">
            <SectionHeadingWithHint
              title={
                <>
                  <FileText className="h-5 w-5 shrink-0" />
                  Resumen del Viaje
                </>
              }
              titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
              hintLabel="Revisión final"
              hint={
                <>
                  Última vista de asignaciones, ruta, cargas y costos antes de crear o guardar el viaje. Corrige
                  cualquier dato en los pasos anteriores si algo no coincide.
                </>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Asignaciones */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Asignaciones
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidad</p>
                  <p className="font-medium">{getVehicleName(values.vehicleId)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conductor</p>
                  <p className="font-medium">{getDriverName(values.driverId)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente Principal</p>
                  <p className="font-medium">{getClientName(values.clientId || "")}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Programación */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Programación
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salida Programada</p>
                  <p className="font-medium">{formatDateTime(values.scheduledDeparture)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Llegada Estimada (Destino)</p>
                  <p className="font-medium">
                    {values.scheduledArrival
                      ? formatDateTime(values.scheduledArrival)
                      : <span className="text-muted-foreground text-sm">Capturar en parada de destino</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Ruta */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Ruta
              </h4>
              {totalDistanceKm > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Milestone className="h-3.5 w-3.5" />
                  <span className="font-medium">{totalDistanceKm.toLocaleString("es-MX")} km totales</span>
                </div>
              )}
            </div>

            {stops.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin paradas registradas</p>
            ) : (
              <div className="space-y-2">
                {stops.map((stop, index) => {
                  const { primary, operation } = getStopLabel(stop.stopType);
                  const isOrigin = stop.stopType.includes("origin");
                  const isDestination = stop.stopType.includes("destination");
                  const locationDisplay =
                    stop.locationName ||
                    (stop.street ? `${stop.street}${stop.exteriorNumber ? ` ${stop.exteriorNumber}` : ""}` : null) ||
                    stop.postalCode ||
                    "Dirección no especificada";

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                          isOrigin
                            ? "bg-green-100 dark:bg-green-900/30"
                            : isDestination
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-muted"
                        }`}
                      >
                        {isOrigin ? (
                          <Navigation className="h-3.5 w-3.5 text-green-600" />
                        ) : isDestination ? (
                          <Flag className="h-3.5 w-3.5 text-red-600" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{locationDisplay}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {primary}
                          </Badge>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {operation}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stop.satStateCode && `${stop.satStateCode}`}
                          {stop.postalCode && stop.locationName && ` · CP ${stop.postalCode}`}
                          {index > 0 && stop.distanceFromPreviousKm
                            ? ` · ${stop.distanceFromPreviousKm} km desde parada anterior`
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cargas y Gastos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cargas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Cargas
              <Badge variant="secondary" className="ml-auto">
                {cargos.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cargos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin cargas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {cargos.map((cargo, index) => (
                  <div
                    key={index}
                    className="p-2 rounded bg-muted/50 space-y-0.5"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate flex-1">{cargo.description}</p>
                      {cargo.hazardousMaterial && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Peligroso
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {cargo.satProductCode && (
                        <span className="font-mono">{cargo.satProductCode}</span>
                      )}
                      {cargo.weightInKg != null && cargo.weightInKg > 0 && (
                        <span className="flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          {cargo.weightInKg} kg
                        </span>
                      )}
                      {cargo.clientId && (
                        <span>{getClientName(cargo.clientId)}</span>
                      )}
                    </div>
                    {(cargo.aseguraCarga || cargo.polizaCarga) && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {cargo.aseguraCarga ? (
                          <span>Seguro: {cargo.aseguraCarga}</span>
                        ) : null}
                        {cargo.polizaCarga ? (
                          <span className="font-mono">Poliza: {cargo.polizaCarga}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}

                <Separator className="my-2" />

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Scale className="h-3.5 w-3.5" />
                    <span>Peso total:</span>
                  </div>
                  <span className="font-medium">
                    {totalWeightKg > 0 ? `${totalWeightKg.toLocaleString("es-MX")} kg` : "No registrado"}
                  </span>
                </div>

                {hasHazmat && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Este viaje incluye materiales peligrosos. Verifique documentación.</span>
                  </div>
                )}
                {insuredCargos > 0 && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                    <FileCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {insuredCargos} carga{insuredCargos !== 1 ? "s" : ""} con datos de
                      seguro de carga.
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Gastos Estimados
              <Badge variant="secondary" className="ml-auto">
                {values.expenses?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!values.expenses || values.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin gastos registrados
              </p>
            ) : (
              <div className="space-y-2">
                {values.expenses.slice(0, 5).map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <p className="text-sm truncate flex-1">{expense.description}</p>
                    <span className="font-medium text-destructive shrink-0 ml-2">
                      {formatMxCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
                {values.expenses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{values.expenses.length - 5} gastos más
                  </p>
                )}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Gastos:</span>
                  <span className="text-destructive">{formatMxCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rentabilidad Estimada */}
      <Card
        className={
          financial.margin >= 0 ? "border-green-500/50" : "border-red-500/50"
        }
      >
        <CardHeader
          className={
            financial.margin >= 0 ? "bg-green-500/5" : "bg-red-500/5"
          }
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Resumen financiero estimado
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Tarifa Base</p>
              <p className="text-lg font-semibold">
                {formatMxCurrency(financial.baseRate)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Costos + Gastos</p>
              <p className="text-lg font-semibold text-destructive">
                {formatMxCurrency(financial.totalExpenses)}
              </p>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${
                financial.margin >= 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                {financial.margin >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                Margen Estimado
              </p>
              <p
                className={`text-xl font-bold ${financial.margin >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatMxCurrency(financial.margin)}
              </p>
              {financial.marginPct !== null && (
                <p className="text-xs text-muted-foreground">
                  Margen: {financial.marginPct.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Costos operativos</span>
              <span>-{formatMxCurrency(financial.totalOperationalCosts)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gastos indirectos</span>
              <span>-{formatMxCurrency(financial.totalIndirectExpenses)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones del viaje</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Instrucciones especiales, comentarios, etc..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
