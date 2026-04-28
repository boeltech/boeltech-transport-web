/**
 * CostsStep - Paso 4 del Wizard
 * Costos: Tarifa base, gastos operativos estimados e indicador de rentabilidad.
 *
 * Diseño para planeación operativa:
 * - Sugerencia automática de diesel basada en distancia total del viaje y
 *   rendimiento del vehículo (expected_fuel_efficiency de la tabla vehicles).
 * - Indicador de rentabilidad en tiempo real (tarifa vs gastos totales).
 * - Acceso rápido a los 4 gastos más frecuentes en transporte.
 * - Formulario simplificado: los datos de contabilidad (CFDI, RFC del proveedor,
 *   clave SAT, forma de pago) se gestionan en la liquidación post-viaje.
 */

import { useState, useMemo } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Separator } from "@shared/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Fuel,
  CircleDollarSign,
  Wallet,
  Bed,
  Package,
  ParkingCircle,
  Wrench,
  Shield,
  FileText,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripExpenseFormValues } from "./validation";
import { useVehicle } from "@features/vehicles/application";

// ============================================================================
// TYPES
// ============================================================================

interface CostsStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  expensesFieldArray: UseFieldArrayReturn<TripWizardFormValues, "expenses">;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DIESEL_PRICE = 24.0; // MXN/L — ajustable por el usuario en la UI

const EXPENSE_CATEGORIES = [
  { value: "fuel", label: "Combustible", icon: Fuel },
  { value: "tolls", label: "Casetas/Peajes", icon: CircleDollarSign },
  { value: "driver_allowance", label: "Viáticos del Operador", icon: Wallet },
  { value: "lodging", label: "Hospedaje", icon: Bed },
  { value: "loading_unloading", label: "Maniobras Carga/Descarga", icon: Package },
  { value: "parking", label: "Pensión/Estacionamiento", icon: ParkingCircle },
  { value: "maintenance", label: "Mantenimiento en Ruta", icon: Wrench },
  { value: "insurance", label: "Seguros", icon: Shield },
  { value: "permits", label: "Permisos y Trámites", icon: FileText },
  { value: "other", label: "Otros Gastos", icon: MoreHorizontal },
] as const;

const QUICK_ADD_PRESETS = [
  {
    category: "fuel" as const,
    label: "Diesel",
    icon: Fuel,
    defaultDescription: "Carga de diesel",
  },
  {
    category: "tolls" as const,
    label: "Casetas",
    icon: CircleDollarSign,
    defaultDescription: "Casetas de peaje",
  },
  {
    category: "driver_allowance" as const,
    label: "Viáticos",
    icon: Wallet,
    defaultDescription: "Viáticos del operador",
  },
  {
    category: "other" as const,
    label: "Otro",
    icon: Plus,
    defaultDescription: "",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const getCategoryInfo = (category: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === category) ?? EXPENSE_CATEGORIES[9];

const formatCurrency = (amount: number, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);

// ============================================================================
// COMPONENT
// ============================================================================

export function CostsStep({ form, expensesFieldArray }: CostsStepProps) {
  const { fields, append, remove, update } = expensesFieldArray;

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<TripExpenseFormValues>>({});

  // ── Diesel suggestion state ────────────────────────────────────────────────
  const [dieselPricePerLiter, setDieselPricePerLiter] =
    useState(DEFAULT_DIESEL_PRICE);

  // ── Form-level data ────────────────────────────────────────────────────────
  const vehicleId = form.watch("vehicleId");
  const stops = form.watch("stops");
  const baseRate = form.watch("baseRate") ?? 0;

  // ── Vehicle: rendimiento del combustible ──────────────────────────────────
  const { data: vehicle } = useVehicle(vehicleId);
  const expectedFuelEfficiency =
    vehicle?.capacities?.expectedFuelEfficiency ?? null;

  // ── Distancia total (suma de distanceFromPreviousKm de todas las paradas) ─
  const totalDistanceKm = useMemo(() => {
    if (!stops || stops.length < 2) return 0;
    return stops.reduce(
      (sum, stop, i) => (i > 0 ? sum + (stop.distanceFromPreviousKm || 0) : sum),
      0,
    );
  }, [stops]);

  // ── Sugerencia de diesel ───────────────────────────────────────────────────
  const dieselSuggestion = useMemo(() => {
    if (
      !expectedFuelEfficiency ||
      expectedFuelEfficiency <= 0 ||
      totalDistanceKm <= 0 ||
      dieselPricePerLiter <= 0
    )
      return null;
    const liters = totalDistanceKm / expectedFuelEfficiency;
    const cost = liters * dieselPricePerLiter;
    return {
      liters: Math.round(liters * 10) / 10,
      cost: Math.round(cost * 100) / 100,
    };
  }, [expectedFuelEfficiency, totalDistanceKm, dieselPricePerLiter]);

  // ── Totales ────────────────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => fields.reduce((sum, e) => sum + (e.amount || 0), 0),
    [fields],
  );

  const margin = baseRate - totalExpenses;
  const marginPct = baseRate > 0 ? (margin / baseRate) * 100 : null;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const openAddDialog = (preset?: {
    category: TripExpenseFormValues["category"];
    defaultDescription: string;
    amount?: number;
    notes?: string;
  }) => {
    setEditingIndex(null);
    setNewExpense({
      category: preset?.category ?? "other",
      description: preset?.defaultDescription ?? "",
      amount: preset?.amount,
      currency: "MXN",
      vendorName: "",
      notes: preset?.notes ?? "",
      isEstimated: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setNewExpense({ ...fields[index] });
    setIsDialogOpen(true);
  };

  const handleAddDieselSuggestion = () => {
    if (!dieselSuggestion) return;
    openAddDialog({
      category: "fuel",
      defaultDescription: "Carga de diesel",
      amount: dieselSuggestion.cost,
      notes: `${dieselSuggestion.liters} L × $${dieselPricePerLiter}/L (estimado)`,
    });
  };

  const handleSave = () => {
    if (
      !newExpense.category ||
      !newExpense.description?.trim() ||
      !newExpense.amount ||
      newExpense.amount <= 0
    )
      return;

    const expense: TripExpenseFormValues = {
      category: newExpense.category,
      description: newExpense.description,
      amount: newExpense.amount,
      currency: newExpense.currency || "MXN",
      vendorName: newExpense.vendorName || undefined,
      notes: newExpense.notes || undefined,
      isEstimated: newExpense.isEstimated ?? true,
    };

    if (editingIndex !== null) {
      update(editingIndex, expense);
    } else {
      append(expense);
    }
    setIsDialogOpen(false);
  };

  const isValid =
    !!newExpense.category &&
    !!newExpense.description?.trim() &&
    !!newExpense.amount &&
    newExpense.amount > 0;

  // ============================================================================
  // PROFITABILITY HELPERS
  // ============================================================================

  const getProfitColor = () => {
    if (marginPct === null) return "text-muted-foreground";
    if (marginPct >= 30) return "text-green-600 dark:text-green-400";
    if (marginPct >= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProfitBadgeClass = () => {
    if (marginPct === null) return "bg-muted text-muted-foreground";
    if (marginPct >= 30)
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (marginPct >= 10)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  const ProfitIcon = marginPct !== null && marginPct < 10 ? TrendingDown : TrendingUp;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* TARIFA BASE + RENTABILIDAD */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Tarifa del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="baseRate"
            render={({ field }) => (
              <FormItem className="sm:w-1/3">
                <FormLabel>Tarifa Base (MXN)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Indicador de rentabilidad — visible cuando hay tarifa */}
          {baseRate > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa Base</span>
                  <span className="font-medium">{formatCurrency(baseRate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    − Gastos Estimados
                  </span>
                  <span className="font-medium text-destructive">
                    − {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-1.5">
                    <ProfitIcon
                      className={cn("h-4 w-4", getProfitColor())}
                    />
                    Margen Estimado
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-lg font-bold", getProfitColor())}>
                      {formatCurrency(margin)}
                    </span>
                    {marginPct !== null && (
                      <span
                        className={cn(
                          "text-xs font-semibold px-1.5 py-0.5 rounded",
                          getProfitBadgeClass(),
                        )}
                      >
                        {marginPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Alerta de margen bajo */}
                {marginPct !== null && marginPct < 10 && totalExpenses > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 mt-1">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      El margen estimado es menor al 10%. Considera revisar la
                      tarifa o reducir los gastos estimados.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SUGERENCIA DE DIESEL */}
      {/* Visible solo si el vehículo tiene rendimiento y el viaje tiene distancia */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {totalDistanceKm > 0 && expectedFuelEfficiency && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardContent className="pt-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Estimación de Diesel
                </h4>
              </div>

              {/* Datos del cálculo */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Distancia total
                  </p>
                  <p className="font-medium">{totalDistanceKm.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rendimiento</p>
                  <p className="font-medium">
                    {expectedFuelEfficiency} km/L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Consumo estimado
                  </p>
                  <p className="font-medium">
                    {dieselSuggestion?.liters ?? "—"} L
                  </p>
                </div>
              </div>

              {/* Precio ajustable + costo resultante + botón agregar */}
              <div className="flex items-end gap-3">
                <div className="space-y-1 w-36">
                  <Label className="text-xs">Precio diesel (MXN/L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dieselPricePerLiter}
                    onChange={(e) =>
                      setDieselPricePerLiter(
                        e.target.value
                          ? Number(e.target.value)
                          : DEFAULT_DIESEL_PRICE,
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Costo estimado
                  </p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {dieselSuggestion ? formatCurrency(dieselSuggestion.cost) : "—"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/30"
                  onClick={handleAddDieselSuggestion}
                  disabled={!dieselSuggestion}
                >
                  <Fuel className="h-3.5 w-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* GASTOS ESTIMADOS */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Gastos Estimados
              </CardTitle>
              {fields.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {fields.length} gasto{fields.length !== 1 ? "s" : ""} •{" "}
                  {formatCurrency(totalExpenses)} total
                </p>
              )}
            </div>
          </div>

          {/* Acceso rápido */}
          <div className="flex flex-wrap gap-2 pt-2">
            {QUICK_ADD_PRESETS.map((preset) => (
              <Button
                key={preset.category}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() =>
                  openAddDialog({
                    category: preset.category,
                    defaultDescription: preset.defaultDescription,
                  })
                }
              >
                <preset.icon className="h-3.5 w-3.5 mr-1" />
                {preset.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin gastos registrados</p>
              <p className="text-xs mt-1">
                Usa los accesos rápidos o agrega un gasto personalizado
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {fields.map((expense, index) => {
                const categoryInfo = getCategoryInfo(expense.category);
                const CategoryIcon = categoryInfo.icon;
                return (
                  <div
                    key={expense.id || index}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {expense.description}
                        </p>
                        {expense.isEstimated && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                            Estimado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span>{categoryInfo.label}</span>
                        {expense.vendorName && (
                          <>
                            <span>·</span>
                            <span className="truncate">{expense.vendorName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="font-semibold text-sm whitespace-nowrap">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(index)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm font-medium">Total Gastos</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Agregar / Editar Gasto */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Gasto" : "Agregar Gasto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Categoría */}
            <div className="space-y-2">
              <Label>
                Categoría <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newExpense.category ?? "other"}
                onValueChange={(value) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    category: value as TripExpenseFormValues["category"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label>
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej: Carga de diesel en Pemex km 45..."
                value={newExpense.description || ""}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Monto + Moneda */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>
                  Monto <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={newExpense.amount ?? ""}
                  onChange={(e) =>
                    setNewExpense((prev) => ({
                      ...prev,
                      amount: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={newExpense.currency || "MXN"}
                  onValueChange={(value) =>
                    setNewExpense((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proveedor */}
            <div className="space-y-2">
              <Label>Proveedor (opcional)</Label>
              <Input
                placeholder="Nombre o razón social"
                value={newExpense.vendorName || ""}
                onChange={(e) =>
                  setNewExpense((prev) => ({
                    ...prev,
                    vendorName: e.target.value,
                  }))
                }
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={newExpense.notes || ""}
                onChange={(e) =>
                  setNewExpense((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </div>

            {/* Es estimado */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEstimated"
                checked={newExpense.isEstimated ?? true}
                onCheckedChange={(checked) =>
                  setNewExpense((prev) => ({ ...prev, isEstimated: !!checked }))
                }
              />
              <Label
                htmlFor="isEstimated"
                className="text-sm font-normal cursor-pointer"
              >
                Es un gasto estimado (aún no se ha efectuado)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={!isValid}>
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
