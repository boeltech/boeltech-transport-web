import { useMemo, useState } from "react";
import type { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import {
  AlertCircle,
  Bed,
  Calculator,
  CircleDollarSign,
  DollarSign,
  Edit2,
  FileText,
  Fuel,
  MoreHorizontal,
  Package,
  ParkingCircle,
  Plus,
  Receipt,
  Shield,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";

import { useVehicle } from "@features/vehicles/application";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { Separator } from "@shared/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Textarea } from "@shared/ui/text-area";
import { cn } from "@shared/lib/utils/cn";

import {
  computeFinancialSummary,
  formatMxCurrency,
  INDIRECT_EXPENSE_CATEGORIES,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  OPERATIONAL_COST_CATEGORIES,
  type ExpenseCategory,
} from "./financialSummary";
import type { TripExpenseFormValues, TripWizardFormValues } from "./validation";

interface CostsStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  expensesFieldArray: UseFieldArrayReturn<TripWizardFormValues, "expenses">;
}

type CostTab = "income" | "cost" | "expense";

const DEFAULT_DIESEL_PRICE = 24.0;

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

const CATEGORY_SET = new Set<ExpenseCategory>([
  ...OPERATIONAL_COST_CATEGORIES,
  ...INDIRECT_EXPENSE_CATEGORIES,
]);

const CATEGORY_MAP = new Map(
  EXPENSE_CATEGORIES.map((item) => [item.value, item]),
);

function isCostCategory(category: string): category is ExpenseCategory {
  return isOperationalExpenseCategory(category as ExpenseCategory);
}

function getDefaultCategoryForTab(tab: CostTab): ExpenseCategory {
  if (tab === "cost") return "fuel";
  if (tab === "expense") return "driver_allowance";
  return "fuel";
}

function getCategoriesByTab(tab: CostTab) {
  if (tab === "cost") {
    return EXPENSE_CATEGORIES.filter((item) =>
      isOperationalExpenseCategory(item.value),
    );
  }
  if (tab === "expense") {
    return EXPENSE_CATEGORIES.filter((item) =>
      isIndirectExpenseCategory(item.value),
    );
  }
  return [];
}

function getTabByCategory(category: string): CostTab {
  if (isCostCategory(category)) return "cost";
  return "expense";
}

export function CostsStep({ form, expensesFieldArray }: CostsStepProps) {
  const { fields, append, remove, update } = expensesFieldArray;

  const [activeTab, setActiveTab] = useState<CostTab>("income");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dieselPricePerLiter, setDieselPricePerLiter] =
    useState(DEFAULT_DIESEL_PRICE);
  const [draftExpense, setDraftExpense] = useState<Partial<TripExpenseFormValues>>({
    category: "fuel",
    description: "",
    amount: undefined,
    currency: "MXN",
    vendorName: "",
    notes: "",
    isEstimated: true,
  });

  const vehicleId = form.watch("vehicleId");
  const stops = form.watch("stops");
  const baseRate = form.watch("baseRate") ?? 0;

  const { data: vehicle } = useVehicle(vehicleId);
  const expectedFuelEfficiency =
    vehicle?.capacities?.expectedFuelEfficiency ?? null;

  const totalDistanceKm = useMemo(() => {
    if (!stops || stops.length < 2) return 0;
    return stops.reduce(
      (sum, stop, index) =>
        index > 0 ? sum + (stop.distanceFromPreviousKm || 0) : sum,
      0,
    );
  }, [stops]);

  const dieselSuggestion = useMemo(() => {
    if (
      !expectedFuelEfficiency ||
      expectedFuelEfficiency <= 0 ||
      totalDistanceKm <= 0 ||
      dieselPricePerLiter <= 0
    ) {
      return null;
    }
    const liters = totalDistanceKm / expectedFuelEfficiency;
    const cost = liters * dieselPricePerLiter;
    return {
      liters: Math.round(liters * 10) / 10,
      cost: Math.round(cost * 100) / 100,
    };
  }, [dieselPricePerLiter, expectedFuelEfficiency, totalDistanceKm]);

  const operationalCosts = useMemo(
    () =>
      fields.filter((expense) =>
        isOperationalExpenseCategory(expense.category),
      ),
    [fields],
  );
  const indirectExpenses = useMemo(
    () =>
      fields.filter((expense) =>
        isIndirectExpenseCategory(expense.category),
      ),
    [fields],
  );

  const totalOperationalCosts = useMemo(
    () =>
      operationalCosts.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    [operationalCosts],
  );
  const totalIndirectExpenses = useMemo(
    () =>
      indirectExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
    [indirectExpenses],
  );
  const totalExpenses = totalOperationalCosts + totalIndirectExpenses;

  const financial = computeFinancialSummary(baseRate, totalExpenses, {
    totalOperationalCosts,
    totalIndirectExpenses,
  });

  const activeExpenseList =
    activeTab === "cost"
      ? operationalCosts
      : activeTab === "expense"
        ? indirectExpenses
        : [];

  const availableCategories = getCategoriesByTab(activeTab);
  const showExpenseForm = activeTab === "cost" || activeTab === "expense";
  const selectedCategory = draftExpense.category ?? getDefaultCategoryForTab(activeTab);

  const resetDraft = (tab: CostTab) => {
    setDraftExpense({
      category: getDefaultCategoryForTab(tab),
      description: "",
      amount: undefined,
      currency: "MXN",
      vendorName: "",
      notes: "",
      isEstimated: true,
    });
    setEditingIndex(null);
  };

  const switchTab = (tab: CostTab) => {
    setActiveTab(tab);
    if (tab === "income") {
      setEditingIndex(null);
      return;
    }
    resetDraft(tab);
  };

  const handleEdit = (index: number) => {
    const expense = fields[index];
    const tab = getTabByCategory(expense.category);
    setActiveTab(tab);
    setEditingIndex(index);
    setDraftExpense({
      ...expense,
      currency: "MXN",
    });
  };

  const handleSaveExpense = () => {
    if (
      !showExpenseForm ||
      !draftExpense.category ||
      !CATEGORY_SET.has(draftExpense.category as ExpenseCategory) ||
      !draftExpense.description?.trim() ||
      !draftExpense.amount ||
      draftExpense.amount <= 0
    ) {
      return;
    }

    const payload: TripExpenseFormValues = {
      category: draftExpense.category as TripExpenseFormValues["category"],
      description: draftExpense.description.trim(),
      amount: draftExpense.amount,
      currency: "MXN",
      vendorName: draftExpense.vendorName?.trim() || undefined,
      notes: draftExpense.notes?.trim() || undefined,
      isEstimated: true,
    };

    if (editingIndex !== null) {
      update(editingIndex, payload);
    } else {
      append(payload);
    }

    resetDraft(activeTab);
  };

  const applyDieselSuggestion = () => {
    if (!dieselSuggestion) return;
    setDraftExpense((prev) => ({
      ...prev,
      category: "fuel",
      description: prev.description?.trim() || "Carga de diesel",
      amount: dieselSuggestion.cost,
      notes: `${dieselSuggestion.liters} L × $${dieselPricePerLiter}/L (estimado)`,
    }));
  };

  const isDraftValid =
    !!draftExpense.category &&
    !!draftExpense.description?.trim() &&
    !!draftExpense.amount &&
    draftExpense.amount > 0;

  const marginToneClass =
    financial.health === "healthy"
      ? "text-success"
      : financial.health === "warning"
        ? "text-warning"
        : financial.health === "critical"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              <SectionHeadingWithHint
                title={
                  <>
                    <Receipt className="h-5 w-5 shrink-0" />
                    Agregar movimiento
                  </>
                }
                titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
                hintLabel="Cómo funciona"
                hint={
                  <>
                    Registra primero el ingreso del viaje y luego clasifica cada
                    salida de dinero como costo operativo o gasto indirecto.
                  </>
                }
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={activeTab}
              onValueChange={(value) => switchTab(value as CostTab)}
            >
              <TabsList className="grid h-auto grid-cols-3 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="income"
                  className="h-12 border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Ingreso
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="cost"
                  className="h-12 border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <CircleDollarSign className="h-4 w-4" />
                    Costo
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="h-12 border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Gasto
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-4">
                <FormField
                  control={form.control}
                  name="baseRate"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Tarifa Base (MXN)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? Number(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="cost" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Costos operativos directos del servicio (combustible, casetas,
                  maniobras, mantenimiento, seguros, permisos).
                </p>
              </TabsContent>

              <TabsContent value="expense" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gastos indirectos relacionados con el viaje (viáticos, hospedaje,
                  estacionamientos, multas y otros).
                </p>
              </TabsContent>
            </Tabs>

            {showExpenseForm ? (
              <>
                <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Categoría <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) =>
                        setDraftExpense((prev) => ({
                          ...prev,
                          category: value as TripExpenseFormValues["category"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <category.icon className="h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Input value="MXN" disabled />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Descripción <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Ej: Casetas tramo MTY-SLP"
                      value={draftExpense.description || ""}
                      onChange={(event) =>
                        setDraftExpense((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Monto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={draftExpense.amount ?? ""}
                      onChange={(event) =>
                        setDraftExpense((prev) => ({
                          ...prev,
                          amount: event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Proveedor (opcional)</Label>
                    <Input
                      placeholder="Nombre o razón social"
                      value={draftExpense.vendorName || ""}
                      onChange={(event) =>
                        setDraftExpense((prev) => ({
                          ...prev,
                          vendorName: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      rows={2}
                      placeholder="Observaciones del concepto..."
                      value={draftExpense.notes || ""}
                      onChange={(event) =>
                        setDraftExpense((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {activeTab === "cost" && selectedCategory === "fuel" && totalDistanceKm > 0 && expectedFuelEfficiency ? (
                  <Card className="border-info/30 border-info/30 bg-info-soft/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        Estimación de Diesel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Distancia total</p>
                          <p className="font-medium">{totalDistanceKm.toFixed(1)} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Rendimiento</p>
                          <p className="font-medium">{expectedFuelEfficiency} km/L</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Consumo estimado</p>
                          <p className="font-medium">{dieselSuggestion?.liters ?? "—"} L</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1 w-44">
                          <Label className="text-xs">Precio diesel (MXN/L)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-sm"
                            value={dieselPricePerLiter}
                            onChange={(event) =>
                              setDieselPricePerLiter(
                                event.target.value
                                  ? Number(event.target.value)
                                  : DEFAULT_DIESEL_PRICE,
                              )
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Costo estimado</p>
                          <p className="text-xl font-bold text-info-soft-foreground">
                            {dieselSuggestion ? formatMxCurrency(dieselSuggestion.cost) : "—"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={applyDieselSuggestion}
                          disabled={!dieselSuggestion}
                        >
                          <Fuel className="mr-1 h-3.5 w-3.5" />
                          Usar estimación
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  {editingIndex !== null ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetDraft(activeTab)}
                    >
                      Cancelar edición
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="min-w-44"
                    onClick={handleSaveExpense}
                    disabled={!isDraftValid}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {editingIndex !== null ? "Guardar concepto" : "Agregar concepto"}
                  </Button>
                </div>

                {activeExpenseList.length === 0 ? (
                  <EmptyState
                    icon={<Receipt />}
                    size="sm"
                    title={`Sin ${activeTab === "cost" ? "costos" : "gastos"} registrados`}
                    description="Completa el formulario para agregar el primer concepto."
                  />
                ) : (
                  <div className="divide-y rounded-lg border px-4">
                    {activeExpenseList.map((expense) => {
                      const category = CATEGORY_MAP.get(expense.category);
                      const index = fields.findIndex((item) => item.id === expense.id);
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="rounded-lg bg-muted p-2 shrink-0">
                            {category ? (
                              <category.icon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{expense.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {category?.label || "Sin categoría"}
                              {expense.vendorName ? ` · ${expense.vendorName}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">
                            -{formatMxCurrency(expense.amount)}
                          </span>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(index)}
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
                  </div>
                )}
              </>
            ) : null}

            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Cómo funciona</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Define el ingreso del viaje en la pestaña Ingreso.</li>
                <li>Registra costos operativos directos en la pestaña Costo.</li>
                <li>Registra gastos indirectos en la pestaña Gasto.</li>
                <li>Revisa utilidad y margen en tiempo real en el panel derecho.</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-4 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Resumen financiero estimado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-success/30 bg-success-soft/70">
              <div className="border-b border-success/30 px-3 py-2 text-xs font-semibold text-success-soft-foreground">
                INGRESOS (1)
              </div>
              <div className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Flete</p>
                  <p className="text-xs text-muted-foreground">Tarifa base</p>
                </div>
                <span className="font-semibold text-success-soft-foreground">
                  +{formatMxCurrency(financial.baseRate)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-info/30 border-info/30 bg-info-soft/70">
              <div className="border-b border-info/30 px-3 py-2 text-xs font-semibold text-info-soft-foreground ">
                COSTOS OPERATIVOS ({operationalCosts.length})
              </div>
              <div className="space-y-2 px-3 py-2">
                {operationalCosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin conceptos</p>
                ) : (
                  operationalCosts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <p className="truncate">{item.description}</p>
                      <span className="font-semibold text-info-soft-foreground">
                        -{formatMxCurrency(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-warning/30 bg-warning-soft/70">
              <div className="border-b border-warning/30 px-3 py-2 text-xs font-semibold text-warning-soft-foreground ">
                GASTOS ({indirectExpenses.length})
              </div>
              <div className="space-y-2 px-3 py-2">
                {indirectExpenses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin conceptos</p>
                ) : (
                  indirectExpenses.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <p className="truncate">{item.description}</p>
                      <span className="font-semibold text-warning-soft-foreground">
                        -{formatMxCurrency(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />
            <InfoRow
              variant="inline"
              label="Ingresos"
              value={formatMxCurrency(financial.baseRate)}
            />
            <InfoRow
              variant="inline"
              label="Costos"
              value={`-${formatMxCurrency(financial.totalOperationalCosts)}`}
            />
            <InfoRow
              variant="inline"
              label="Gastos"
              value={`-${formatMxCurrency(financial.totalIndirectExpenses)}`}
            />
            <Separator />
            <InfoRow
              variant="inline"
              label="Utilidad"
              value={
                <span className={cn("font-semibold", marginToneClass)}>
                  {formatMxCurrency(financial.margin)}
                </span>
              }
            />
            <InfoRow
              variant="inline"
              label="Margen"
              value={
                financial.marginPct === null
                  ? "—"
                  : `${financial.marginPct.toFixed(1)}%`
              }
            />
          </CardContent>
        </Card>
      </div>

      {financial.health === "critical" ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-4 w-4" />}
          title="Rentabilidad estimada comprometida"
          items={[
            {
              text: "El margen está por debajo del 10%. Revisa tarifa o conceptos antes de continuar.",
            },
          ]}
        />
      ) : null}
    </div>
  );
}
