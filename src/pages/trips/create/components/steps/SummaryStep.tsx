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
} from "lucide-react";
import type { TripWizardFormValues } from "../types";

interface SummaryStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: Array<{ id: string; unitNumber: string; licensePlate: string }>;
  drivers: Array<{ id: string; fullName: string }>;
  clients: Array<{ id: string; legalName: string }>;
}

export function SummaryStep({
  form,
  vehicles,
  drivers,
  clients,
}: SummaryStepProps) {
  const values = form.getValues();

  // Helpers para obtener nombres
  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle
      ? `${vehicle.unitNumber} - ${vehicle.licensePlate}`
      : "No seleccionado";
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find((d) => d.id === id);
    return driver?.fullName || "No seleccionado";
  };

  const getClientName = (id: string) => {
    if (!id) return "Sin cliente";
    const client = clients.find((c) => c.id === id);
    return client?.legalName || "Cliente no encontrado";
  };

  const formatCurrency = (
    amount: number | undefined,
    currency: string = "MXN",
  ) => {
    if (amount === undefined) return "$0.00";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada";
    return new Date(dateString).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Cálculos financieros
  const totalCargoRevenue =
    values.cargos?.reduce((sum, c) => sum + (c.rate || 0), 0) || 0;
  const totalExpenses =
    values.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const baseRate = values.baseRate || 0;
  const totalRevenue = totalCargoRevenue + baseRate;
  const estimatedProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <Card className="border-primary/50">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Resumen del Viaje
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
                  <p className="font-medium">
                    {getVehicleName(values.vehicleId)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conductor</p>
                  <p className="font-medium">
                    {getDriverName(values.driverId)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Cliente Principal
                  </p>
                  <p className="font-medium">
                    {getClientName(values.clientId || "")}
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Salida Programada
                  </p>
                  <p className="font-medium">
                    {formatDate(values.scheduledDeparture)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Llegada Estimada
                  </p>
                  <p className="font-medium">
                    {formatDate(values.scheduledArrival || "")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Ruta */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Ruta
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Navigation className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Origen</p>
                  <p className="font-medium">{values.originAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {values.originCity}
                    {values.originState && `, ${values.originState}`}
                  </p>
                </div>
              </div>

              {values.stops && values.stops.length > 0 && (
                <div className="ml-4 pl-4 border-l-2 border-dashed space-y-2">
                  {values.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {stop.city} -{" "}
                        {stop.stopType === "pickup"
                          ? "Carga"
                          : stop.stopType === "delivery"
                            ? "Descarga"
                            : "Escala"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Flag className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="font-medium">{values.destinationAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {values.destinationCity}
                    {values.destinationState && `, ${values.destinationState}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargas y Costos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cargas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Cargas
              <Badge variant="secondary" className="ml-auto">
                {values.cargos?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!values.cargos || values.cargos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin cargas registradas
              </p>
            ) : (
              <div className="space-y-2">
                {values.cargos.map((cargo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {cargo.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getClientName(cargo.clientId)}
                      </p>
                    </div>
                    <span className="font-medium text-primary">
                      {formatCurrency(cargo.rate, cargo.currency)}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Cargas:</span>
                  <span className="text-primary">
                    {formatCurrency(totalCargoRevenue)}
                  </span>
                </div>
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
                    <p className="text-sm truncate">{expense.description}</p>
                    <span className="font-medium text-destructive">
                      {formatCurrency(expense.amount, expense.currency)}
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
                  <span className="text-destructive">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rentabilidad Estimada */}
      <Card
        className={
          estimatedProfit >= 0 ? "border-green-500/50" : "border-red-500/50"
        }
      >
        <CardHeader
          className={estimatedProfit >= 0 ? "bg-green-500/5" : "bg-red-500/5"}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Rentabilidad Estimada
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Tarifa Base</p>
              <p className="text-lg font-semibold">
                {formatCurrency(baseRate)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                Ingresos Cargas
              </p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(totalCargoRevenue)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">
                Gastos Estimados
              </p>
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div
              className={`text-center p-4 rounded-lg ${
                estimatedProfit >= 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                {estimatedProfit >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                Utilidad Estimada
              </p>
              <p
                className={`text-xl font-bold ${
                  estimatedProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(estimatedProfit)}
              </p>
              <p className="text-xs text-muted-foreground">
                Margen: {profitMargin.toFixed(1)}%
              </p>
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
